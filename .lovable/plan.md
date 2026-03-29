

# Gestão de Usuários/Assinaturas no Admin

## Situação Atual
A aba "Usuários" no `/admin` já existe e mostra: email, data de cadastro, último login, perfis (nome, tipo, nível, XP, ano escolar) e roles. **Porém não mostra informações de assinatura/plano de cada usuário.**

## Plano de Implementação

### 1. Enriquecer a Edge Function `admin-users`
- Buscar também dados de `user_subscriptions` (com join em `subscription_plans`) para cada usuário
- Retornar no objeto enriquecido: plano ativo, status, período de cobrança, data de expiração

### 2. Expandir a seção de Usuários no Admin
- Mostrar para cada usuário: **badge do plano** (Free/Pro/Família), status da assinatura, período (mensal/anual), data de expiração
- Adicionar **filtros**: por plano (Free/Pro/Família), por status (ativo/expirado/cancelado)
- Mostrar contadores resumidos no topo: total de usuários, total Pro, total Família, total Free

### 3. Adicionar aba "Planos" no Admin
- Listar os planos da tabela `subscription_plans`
- Permitir editar preços, limites de sessão, max perfis, features, product IDs das stores
- Botão salvar por plano

### Arquivos Modificados
- `supabase/functions/admin-users/index.ts` — adicionar fetch de subscriptions
- `src/pages/Admin.tsx` — expandir UsersSection com info de plano + nova aba Planos

