

# Integração Completa Stripe — Maluz

## Resumo

Criar 4 produtos no Stripe (Pro mensal, Pro anual, Família mensal, Família anual), 3 edge functions (create-checkout, check-stripe-subscription, customer-portal), atualizar o frontend (PricingSection, useSubscription, página de sucesso) e adicionar a coluna `stripe_price_id` na tabela `subscription_plans`.

## Etapas

### 1. Criar Produtos e Preços no Stripe
- **Maluz Pro Mensal**: R$ 14,90/mês (1490 centavos, BRL, recurring month)
- **Maluz Pro Anual**: R$ 99,90/ano (9990 centavos, BRL, recurring year)
- **Maluz Família Mensal**: R$ 24,90/mês (2490 centavos, BRL, recurring month)
- **Maluz Família Anual**: R$ 199,90/ano (19990 centavos, BRL, recurring year)

### 2. Migração: adicionar `stripe_price_id` à tabela `subscription_plans`
```sql
ALTER TABLE subscription_plans ADD COLUMN stripe_price_id text;
```
Depois, atualizar os registros existentes com os price IDs criados no Stripe.

### 3. Edge Function: `create-checkout`
- Recebe `price_id` e `billing_period` do frontend
- Autentica o usuário via token JWT
- Busca/cria customer no Stripe pelo email
- Cria checkout session `mode: "subscription"` com success/cancel URLs
- Retorna URL do checkout

### 4. Edge Function: `check-stripe-subscription`
- Autentica o usuário, busca customer no Stripe pelo email
- Verifica se há subscription ativa
- Retorna: `subscribed`, `product_id`, `subscription_end`, `price_id`
- Usado no frontend para validar status real da assinatura

### 5. Edge Function: `customer-portal`
- Autentica o usuário, busca customer no Stripe
- Cria sessão do Billing Portal
- Retorna URL para gerenciar assinatura (cancelar, trocar cartão, etc.)

### 6. Frontend: Atualizar `PricingSection.tsx`
- Botão "Assinar" chama `create-checkout` com o `stripe_price_id` do plano
- Toggle mensal/anual para escolher período
- Usuários logados vão direto ao checkout; não logados vão para /login primeiro
- Destaque visual no plano atual do usuário

### 7. Frontend: Atualizar `useSubscription.ts`
- Adicionar hook `useStripeSubscription()` que chama `check-stripe-subscription`
- Invocar na mudança de auth state e periodicamente (a cada 60s)
- Manter compatibilidade com o sistema atual (admin_manual + futuro stores)

### 8. Página de sucesso pós-checkout
- Rota `/pagamento-sucesso` com mensagem de confirmação
- Chama `check-stripe-subscription` para atualizar estado
- Redireciona para `/perfis` após alguns segundos

### 9. Botão "Gerenciar Assinatura"
- Na página de perfis ou configurações, botão que abre o Customer Portal do Stripe
- Visível apenas para assinantes ativos

### Arquivos Criados/Modificados
- `supabase/functions/create-checkout/index.ts` — novo
- `supabase/functions/check-stripe-subscription/index.ts` — novo
- `supabase/functions/customer-portal/index.ts` — novo
- `src/hooks/useSubscription.ts` — adicionar hook Stripe
- `src/components/PricingSection.tsx` — botões de checkout + toggle período
- `src/pages/PaymentSuccess.tsx` — novo
- `src/App.tsx` — nova rota
- Migração SQL — adicionar coluna stripe_price_id

### Detalhes Técnicos
- Stripe API version: `2025-08-27.basil`
- STRIPE_SECRET_KEY já está configurado nos secrets
- Sem webhooks — verificação por polling via `check-stripe-subscription`
- O plano Free não tem checkout (é o padrão)

