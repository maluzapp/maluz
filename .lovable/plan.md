

# Contornar o problema do setup de email nativo

## Situação

O domínio `maluz.app` está configurado como custom domain do projeto, mas o modal de setup de email falhou 4 vezes seguidas — erro "Couldn't connect maluz.app". Não há nenhum domínio de email configurado no workspace.

## Problema

O único caminho nativo para configurar o domínio de email é via o modal `<lov-open-email-setup>`. Não existe ferramenta de CLI ou API alternativa para registrar o domínio manualmente — todas as ferramentas (scaffold, infra) dependem de um domínio já registrado.

## Opções reais

### Opção A — Tentar o modal novamente com diagnóstico
O erro pode ser intermitente (DNS propagation do custom domain, ou problema temporário do lado do Lovable). Podemos:
1. Verificar se o custom domain `maluz.app` está ativo e resolvendo corretamente
2. Tentar o setup em horário diferente (pode ser instabilidade temporária)
3. Se persistir, reportar ao suporte do Lovable como bug

### Opção B — Usar Resend como provedor de email
Contornar completamente o sistema nativo e usar Resend:
1. Criar conta no Resend e verificar o domínio `maluz.app` (ou subdomínio `mail.maluz.app`)
2. Adicionar `RESEND_API_KEY` como secret
3. Criar edge function `send-email` que usa a API do Resend
4. Templates de email customizáveis via `branding_settings` (categoria `email`)
5. Integrar envio no fluxo de pagamento e auth

### Opção C — Aguardar e usar emails padrão por enquanto
Os emails de autenticação (confirmação, reset de senha) já funcionam com o template padrão do Lovable — sem branding customizado. Podemos:
1. Continuar usando os emails padrão para auth
2. Focar em outras features enquanto o problema do modal é resolvido
3. Voltar para o setup nativo quando estiver funcionando

## Recomendação

**Opção B (Resend)** é a mais confiável e independente. O setup é simples (1 API key), o free tier tem 3.000 emails/mês, e não depende do modal do Lovable. Podemos usar `mail.maluz.app` como subdomínio para evitar conflitos futuros se o email nativo voltar a funcionar.

Se preferir não criar conta em outro serviço, a **Opção A** vale uma última tentativa — o erro pode ser temporário.

