

# Configuração de Emails com Domínio Próprio — Maluz

## Resumo

Configurar o sistema de emails do Maluz para usar o domínio `maluz.app` como remetente (hello@maluz.app), incluindo emails de autenticação (confirmação de conta, reset de senha) e emails transacionais (confirmação de pagamento). Adicionar capacidade de customizar templates de email via backend (admin).

## Estado Atual

- **Nenhum sistema de email customizado** configurado — o projeto usa emails padrão do sistema de autenticação
- **Nenhum email transacional** implementado (a página de sucesso de pagamento é apenas visual, sem envio de email)
- **Stripe está integrado** com checkout e portal de faturamento funcionando

## Etapas

### 1. Configurar domínio de email (maluz.app)
- Configurar o subdomínio de envio (ex: `notify.maluz.app`) via diálogo de setup de email
- O remetente será exibido como `hello@maluz.app` no cabeçalho dos emails
- Requer configuração de DNS (registros NS) no registrar do domínio — propagação pode levar até 72h

### 2. Configurar infraestrutura de email
- Criar filas de processamento, tabelas de log e jobs automáticos para envio confiável com retry
- Isso garante que emails não se percam mesmo em caso de falhas temporárias

### 3. Criar templates de email de autenticação
- **Confirmação de cadastro** — email enviado ao criar conta
- **Reset de senha** — email de recuperação
- **Magic link** — login por link
- **Mudança de email** — confirmação de alteração
- Todos com visual da marca Maluz (cores navy/dourado, fonte Playfair Display)
- Background branco no corpo do email para compatibilidade

### 4. Criar templates de emails transacionais
- **Confirmação de pagamento** — enviado após checkout Stripe bem-sucedido
- **Boas-vindas Pro/Família** — enviado ao ativar assinatura
- Templates com estilo consistente da marca

### 5. Integrar envio de email ao fluxo de pagamento
- Na página `PaymentSuccess`, disparar email de confirmação de pagamento para o usuário
- Passar dados dinâmicos (nome do plano, período) para o template

### 6. Criar página de descadastro (unsubscribe)
- Página no app para processar pedidos de descadastro de emails transacionais
- Link automático incluído no rodapé dos emails

### 7. Sistema de customização de templates via admin
- Adicionar seção no painel admin (`/admin`) para editar textos dos emails
- Usar tabela `branding_settings` existente (categoria `email`) para armazenar customizações:
  - Título, corpo e texto do botão de cada template
  - Nome do remetente
- Os edge functions consultam essas configurações ao montar os emails

## Arquivos Impactados

- **Novos**: Templates de email (6 auth + 2 transacionais), edge functions de email, página de unsubscribe
- **Editados**: `PaymentSuccess.tsx` (adicionar envio de email), `Admin.tsx` (seção de gestão de emails), `App.tsx` (rota unsubscribe)
- **Migrações**: Inserir configurações de email na tabela `branding_settings`

## Detalhes Técnicos
- Remetente: `hello@maluz.app` (via subdomínio verificado `notify.maluz.app`)
- Cores dos emails: primary `hsl(42, 91%, 61%)` (dourado), foreground `hsl(213, 50%, 11%)` (navy), fundo branco `#ffffff`
- React Email v0.0.22 para templates
- Fila pgmq com retry automático e dead-letter queue
- Customizações salvas em `branding_settings` com categoria `email`

