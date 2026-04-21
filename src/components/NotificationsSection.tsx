import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bell, Send, Plus, Save, Trash2, ToggleLeft, ToggleRight, Clock, Users, Mail, Smartphone, Zap, BellRing, BellOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { usePushSubscription } from '@/hooks/usePushSubscription';

interface NotificationTemplate {
  id: string;
  title: string;
  body: string;
  icon_emoji: string;
  trigger_type: string;
  inactive_days: number | null;
  channel: string;
  is_active: boolean;
  category: string;
  created_at: string;
}

export default function NotificationsSection() {
  const { isSubscribed, isSupported, permission, subscribe, unsubscribe } = usePushSubscription();
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [vapidKey, setVapidKey] = useState('');
  const [editValues, setEditValues] = useState<Partial<NotificationTemplate>>({});
  const [showNew, setShowNew] = useState(false);
  const [newTemplate, setNewTemplate] = useState<Partial<NotificationTemplate>>({
    title: '', body: '', icon_emoji: '🔔', trigger_type: 'manual', channel: 'push', inactive_days: null, category: 'custom',
  });
  const [subscriberCount, setSubscriberCount] = useState(0);
  const [logStats, setLogStats] = useState({ total: 0, last7d: 0, sent: 0, failed: 0 });
  const [recentLogs, setRecentLogs] = useState<Array<{ id: string; created_at: string; status: string; channel: string; template_title?: string; template_emoji?: string }>>([]);

  const fetchTemplates = async () => {
    setLoading(true);
    const { data } = await supabase.from('notification_templates').select('*').order('created_at', { ascending: false });
    setTemplates((data as NotificationTemplate[]) || []);
    setLoading(false);
  };

  const fetchStats = async () => {
    const { count } = await supabase.from('push_subscriptions').select('*', { count: 'exact', head: true });
    setSubscriberCount(count || 0);

    const { count: totalLogs } = await supabase.from('notification_log').select('*', { count: 'exact', head: true });
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { count: weekLogs } = await supabase.from('notification_log').select('*', { count: 'exact', head: true }).gte('created_at', weekAgo);
    const { count: sentCount } = await supabase.from('notification_log').select('*', { count: 'exact', head: true }).eq('status', 'sent');
    const { count: failedCount } = await supabase.from('notification_log').select('*', { count: 'exact', head: true }).eq('status', 'failed');
    setLogStats({ total: totalLogs || 0, last7d: weekLogs || 0, sent: sentCount || 0, failed: failedCount || 0 });

    // Recent log entries with template info
    const { data: logs } = await supabase
      .from('notification_log')
      .select('id, created_at, status, channel, template_id')
      .order('created_at', { ascending: false })
      .limit(20);
    if (logs && logs.length > 0) {
      const templateIds = [...new Set(logs.map(l => l.template_id).filter(Boolean))] as string[];
      const { data: tmpls } = await supabase
        .from('notification_templates')
        .select('id, title, icon_emoji')
        .in('id', templateIds);
      const tmap = new Map((tmpls || []).map(t => [t.id, t]));
      setRecentLogs(logs.map(l => ({
        id: l.id,
        created_at: l.created_at,
        status: l.status,
        channel: l.channel,
        template_title: l.template_id ? tmap.get(l.template_id)?.title : undefined,
        template_emoji: l.template_id ? tmap.get(l.template_id)?.icon_emoji : undefined,
      })));
    } else {
      setRecentLogs([]);
    }

    // Fetch VAPID key
    const { data: vapidSetting } = await supabase.from('branding_settings').select('value').eq('key', 'vapid_public_key').single();
    if (vapidSetting?.value) setVapidKey(vapidSetting.value);
  };

  useEffect(() => { fetchTemplates(); fetchStats(); }, []);

  const handleSendManual = async (templateId: string) => {
    setSending(templateId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { data, error } = await supabase.functions.invoke('send-notification', {
        headers: { Authorization: `Bearer ${session?.access_token}` },
        body: { action: 'send_manual', template_id: templateId },
      });
      if (error) throw error;

      console.log('send_manual response:', data);
      const pushSent = data?.push_sent ?? 0;
      const pushFailed = data?.push_failed ?? 0;
      const emailSent = data?.email_sent ?? 0;
      const subsTotal = data?.subs_total ?? 0;
      const sampleErrors: string[] = data?.sample_errors || [];

      if (subsTotal === 0) {
        toast.error('Nenhum dispositivo inscrito para receber push. Os usuários precisam ativar notificações primeiro.');
      } else if (pushSent === 0 && pushFailed > 0) {
        toast.error(
          `Falha em todos os ${pushFailed} envios. ${sampleErrors[0] || 'Verifique as VAPID keys.'}`,
          { duration: 8000 }
        );
      } else if (pushSent > 0 && pushFailed > 0) {
        toast.warning(
          `Enviado parcial: ${pushSent}/${subsTotal} push, ${pushFailed} falharam. ${sampleErrors[0] || ''}`,
          { duration: 6000 }
        );
      } else {
        toast.success(`✅ ${pushSent}/${subsTotal} push enviados${emailSent ? `, ${emailSent} emails` : ''}`);
      }
      fetchStats();
    } catch (err: any) {
      toast.error('Erro ao enviar: ' + (err.message || 'Desconhecido'));
    } finally {
      setSending(null);
    }
  };

  const handleTestPush = async () => {
    if (!isSubscribed) {
      const ok = await subscribe();
      if (!ok) {
        toast.error('Não foi possível ativar push neste dispositivo. Verifique as permissões do navegador.');
        return;
      }
    }
    setTesting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { data, error } = await supabase.functions.invoke('send-notification', {
        headers: { Authorization: `Bearer ${session?.access_token}` },
        body: { action: 'send_test' },
      });
      if (error) throw error;
      if (data?.ok) {
        toast.success(`Teste enviado! ${data.sent}/${data.total} dispositivo(s). Você deve recebê-lo em segundos.`);
      } else {
        const errMsg = data?.error || (data?.errors ? data.errors[0] : null) || 'erro desconhecido';
        toast.error(`Falha no teste: ${errMsg}`);
        if (data?.errors) console.error('Push errors:', data.errors);
        console.error('Full test response:', data);
      }
      console.log('Test push response:', data);
    } catch (err: any) {
      toast.error('Erro ao testar push: ' + (err.message || 'desconhecido'));
    } finally {
      setTesting(false);
    }
  };

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    await supabase.from('notification_templates').update({ is_active: !currentActive }).eq('id', id);
    setTemplates(prev => prev.map(t => t.id === id ? { ...t, is_active: !currentActive } : t));
    toast.success(currentActive ? 'Desativado' : 'Ativado');
  };

  const handleSaveEdit = async (id: string) => {
    const { error } = await supabase.from('notification_templates').update({
      title: editValues.title,
      body: editValues.body,
      icon_emoji: editValues.icon_emoji,
      trigger_type: editValues.trigger_type,
      inactive_days: editValues.trigger_type === 'auto_inactive' ? editValues.inactive_days : null,
      channel: editValues.channel,
      category: editValues.category,
    }).eq('id', id);
    if (error) { toast.error('Erro: ' + error.message); return; }
    toast.success('Template atualizado!');
    setEditingId(null);
    fetchTemplates();
  };

  const handleCreate = async () => {
    const { error } = await supabase.from('notification_templates').insert({
      title: newTemplate.title!,
      body: newTemplate.body!,
      icon_emoji: newTemplate.icon_emoji || '🔔',
      trigger_type: newTemplate.trigger_type || 'manual',
      inactive_days: newTemplate.trigger_type === 'auto_inactive' ? newTemplate.inactive_days : null,
      channel: newTemplate.channel || 'push',
      category: newTemplate.category || 'custom',
    });
    if (error) { toast.error('Erro: ' + error.message); return; }
    toast.success('Template criado!');
    setShowNew(false);
    setNewTemplate({ title: '', body: '', icon_emoji: '🔔', trigger_type: 'manual', channel: 'push', inactive_days: null, category: 'custom' });
    fetchTemplates();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir este template?')) return;
    await supabase.from('notification_templates').delete().eq('id', id);
    toast.success('Excluído');
    fetchTemplates();
  };

  const startEdit = (t: NotificationTemplate) => {
    setEditingId(t.id);
    setEditValues({ ...t });
  };

  const getChannelBadge = (channel: string) => {
    const icons: Record<string, typeof Smartphone> = { push: Smartphone, email: Mail, both: Bell };
    const labels: Record<string, string> = { push: 'Push', email: 'Email', both: 'Push + Email' };
    const Icon = icons[channel] || Bell;
    return (
      <Badge variant="outline" className="text-[10px] gap-1">
        <Icon className="h-2.5 w-2.5" /> {labels[channel] || channel}
      </Badge>
    );
  };

  const getTriggerBadge = (type: string, days: number | null) => {
    if (type === 'auto_inactive') {
      return <Badge className="bg-accent/20 text-accent-foreground text-[10px] gap-1"><Clock className="h-2.5 w-2.5" /> Auto · {days}d inativo</Badge>;
    }
    return <Badge variant="secondary" className="text-[10px] gap-1"><Send className="h-2.5 w-2.5" /> Manual</Badge>;
  };

  const TemplateForm = ({ values, onChange, onSave, saveLabel }: {
    values: Partial<NotificationTemplate>;
    onChange: (v: Partial<NotificationTemplate>) => void;
    onSave: () => void;
    saveLabel: string;
  }) => (
    <div className="space-y-3 rounded-xl border border-primary/15 bg-card/50 p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs text-foreground/70">Emoji</Label>
          <Input value={values.icon_emoji || ''} onChange={e => onChange({ ...values, icon_emoji: e.target.value })} className="bg-card border-primary/20 text-foreground" placeholder="🔔" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-foreground/70">Título</Label>
          <Input value={values.title || ''} onChange={e => onChange({ ...values, title: e.target.value })} className="bg-card border-primary/20 text-foreground" placeholder="Hora de estudar!" />
        </div>
      </div>
      <div className="space-y-1">
        <Label className="text-xs text-foreground/70">Mensagem</Label>
        <Textarea value={values.body || ''} onChange={e => onChange({ ...values, body: e.target.value })} rows={2} className="bg-card border-primary/20 text-foreground resize-y" placeholder="Sua sequência de estudos te espera..." />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="space-y-1">
          <Label className="text-xs text-foreground/70">Disparo</Label>
          <Select value={values.trigger_type || 'manual'} onValueChange={v => onChange({ ...values, trigger_type: v })}>
            <SelectTrigger className="bg-card border-primary/20"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="manual">Manual</SelectItem>
              <SelectItem value="auto_inactive">Automático (inatividade)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-foreground/70">Canal</Label>
          <Select value={values.channel || 'push'} onValueChange={v => onChange({ ...values, channel: v })}>
            <SelectTrigger className="bg-card border-primary/20"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="push">Push</SelectItem>
              <SelectItem value="email">Email</SelectItem>
              <SelectItem value="both">Push + Email</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {values.trigger_type === 'auto_inactive' && (
          <div className="space-y-1">
            <Label className="text-xs text-foreground/70">Dias inativos</Label>
            <Input type="number" value={values.inactive_days ?? ''} onChange={e => onChange({ ...values, inactive_days: parseInt(e.target.value) || null })} className="bg-card border-primary/20 text-foreground font-mono" placeholder="3" />
          </div>
        )}
      </div>
      <div className="space-y-1">
        <Label className="text-xs text-foreground/70">Categoria</Label>
        <Select value={values.category || 'custom'} onValueChange={v => onChange({ ...values, category: v })}>
          <SelectTrigger className="bg-card border-primary/20"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="engagement">Engajamento</SelectItem>
            <SelectItem value="streak">Sequência</SelectItem>
            <SelectItem value="challenge">Desafio</SelectItem>
            <SelectItem value="review">Revisão</SelectItem>
            <SelectItem value="custom">Personalizado</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button onClick={onSave} className="bg-primary text-primary-foreground font-display font-bold hover:opacity-90">
        <Save className="h-4 w-4 mr-2" /> {saveLabel}
      </Button>
    </div>
  );

  if (loading) {
    return <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-2">
        <Bell className="h-5 w-5 text-primary" />
        <h2 className="font-display text-xl font-bold text-foreground">Notificações & Engajamento</h2>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-xl border border-primary/15 bg-card/50 p-4 text-center">
          <div className="text-2xl font-bold text-foreground">{templates.length}</div>
          <div className="text-[10px] text-foreground/50 uppercase tracking-wider">Templates</div>
        </div>
        <div className="rounded-xl border border-primary/15 bg-card/50 p-4 text-center">
          <div className="text-2xl font-bold text-primary">{subscriberCount}</div>
          <div className="text-[10px] text-foreground/50 uppercase tracking-wider">Assinantes Push</div>
        </div>
        <div className="rounded-xl border border-primary/15 bg-card/50 p-4 text-center">
          <div className="text-2xl font-bold text-foreground">{logStats.last7d}</div>
          <div className="text-[10px] text-foreground/50 uppercase tracking-wider">Enviados (7d)</div>
        </div>
        <div className="rounded-xl border border-primary/15 bg-card/50 p-4 text-center">
          <div className="text-2xl font-bold text-foreground/60">{logStats.total}</div>
          <div className="text-[10px] text-foreground/50 uppercase tracking-wider">Total enviados</div>
        </div>
      </div>

      {/* Push diagnostics & test */}
      <div className="rounded-xl border border-primary/15 bg-card/50 p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-primary" />
          <h3 className="font-display font-bold text-foreground text-sm">Diagnóstico de Push</h3>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <Badge variant={isSupported ? 'secondary' : 'destructive'} className="text-[10px]">
            {isSupported ? '✓ Navegador suporta push' : '✗ Push não suportado'}
          </Badge>
          <Badge variant={permission === 'granted' ? 'secondary' : permission === 'denied' ? 'destructive' : 'outline'} className="text-[10px]">
            Permissão: {permission}
          </Badge>
          <Badge variant={isSubscribed ? 'secondary' : 'outline'} className="text-[10px]">
            {isSubscribed ? <BellRing className="h-2.5 w-2.5 mr-0.5" /> : <BellOff className="h-2.5 w-2.5 mr-0.5" />}
            {isSubscribed ? 'Inscrito neste navegador' : 'Não inscrito'}
          </Badge>
        </div>

        <div className="flex flex-wrap gap-2">
          {!isSubscribed ? (
            <Button size="sm" onClick={subscribe} className="gap-1.5 text-xs bg-primary text-primary-foreground" disabled={!isSupported || permission === 'denied'}>
              <BellRing className="h-3.5 w-3.5" /> Ativar push neste navegador
            </Button>
          ) : (
            <Button size="sm" variant="outline" onClick={unsubscribe} className="gap-1.5 text-xs">
              <BellOff className="h-3.5 w-3.5" /> Desinscrever
            </Button>
          )}
          <Button
            size="sm"
            onClick={handleTestPush}
            disabled={testing || !isSupported}
            className="gap-1.5 text-xs bg-accent text-accent-foreground"
          >
            <Send className="h-3.5 w-3.5" /> {testing ? 'Enviando teste...' : 'Enviar push de teste para mim'}
          </Button>
        </div>

        <p className="text-[10px] text-foreground/40 leading-relaxed">
          Use o botão acima para validar se as VAPID keys e o serviço de push estão funcionando.
          Se o teste falhar, abra o console do navegador para ver detalhes.
          {permission === 'denied' && ' ⚠️ Permissão de notificação foi bloqueada — desbloqueie nas configurações do navegador.'}
        </p>

        <div className="pt-2 border-t border-primary/10 space-y-1">
          <Label className="text-xs text-foreground/70">VAPID Public Key (lida pelo navegador para inscrição)</Label>
          <div className="flex gap-2">
            <Input
              value={vapidKey}
              onChange={e => setVapidKey(e.target.value)}
              placeholder="BNK4Z..."
              className="bg-card border-primary/20 text-foreground font-mono text-xs flex-1"
            />
            <Button size="sm" onClick={async () => {
              await supabase.from('branding_settings').upsert({ key: 'vapid_public_key', value: vapidKey, category: 'push' }, { onConflict: 'key' });
              toast.success('VAPID key salva!');
            }} className="bg-primary text-primary-foreground shrink-0">
              <Save className="h-3.5 w-3.5 mr-1" /> Salvar
            </Button>
          </div>
          <p className="text-[10px] text-foreground/40">Deve ser igual ao secret VAPID_PUBLIC_KEY do servidor.</p>
        </div>
      </div>

      {/* New template */}
      <Button onClick={() => setShowNew(!showNew)} variant="outline" className="gap-2">
        <Plus className="h-4 w-4" /> Novo template
      </Button>
      {showNew && (
        <TemplateForm values={newTemplate} onChange={setNewTemplate} onSave={handleCreate} saveLabel="Criar template" />
      )}

      {/* Template list */}
      <div className="space-y-3">
        {templates.map(t => (
          <div key={t.id} className="rounded-xl border border-primary/15 bg-card/50 p-4 space-y-3">
            {editingId === t.id ? (
              <>
                <TemplateForm values={editValues} onChange={setEditValues} onSave={() => handleSaveEdit(t.id)} saveLabel="Salvar alterações" />
                <Button variant="ghost" size="sm" onClick={() => setEditingId(null)} className="text-xs">Cancelar</Button>
              </>
            ) : (
              <>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-lg">{t.icon_emoji}</span>
                      <h3 className="font-display font-bold text-foreground text-sm">{t.title}</h3>
                      {!t.is_active && <Badge variant="destructive" className="text-[9px]">Inativo</Badge>}
                    </div>
                    <p className="text-xs text-foreground/60 mt-1 line-clamp-2">{t.body}</p>
                  </div>
                  <div className="flex gap-1 shrink-0 flex-wrap">
                    {getChannelBadge(t.channel)}
                    {getTriggerBadge(t.trigger_type, t.inactive_days)}
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-2 border-t border-primary/10">
                  {t.trigger_type === 'manual' && (
                    <Button size="sm" onClick={() => handleSendManual(t.id)} disabled={sending === t.id || !t.is_active} className="gap-1.5 text-xs bg-primary text-primary-foreground">
                      <Send className="h-3 w-3" /> {sending === t.id ? 'Enviando...' : 'Enviar agora'}
                    </Button>
                  )}
                  <Button size="sm" variant="outline" onClick={() => startEdit(t)} className="text-xs">Editar</Button>
                  <Button size="sm" variant="ghost" onClick={() => handleToggleActive(t.id, t.is_active)} className="text-xs gap-1">
                    {t.is_active ? <ToggleRight className="h-3.5 w-3.5 text-primary" /> : <ToggleLeft className="h-3.5 w-3.5 text-foreground/40" />}
                    {t.is_active ? 'Ativo' : 'Inativo'}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleDelete(t.id)} className="text-xs text-destructive hover:text-destructive gap-1 ml-auto">
                    <Trash2 className="h-3 w-3" /> Excluir
                  </Button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
