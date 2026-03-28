

# Painel de Administração Maluz

## Objetivo
Criar uma página `/admin` completa para gerenciar visualmente todos os parâmetros de branding da landing page e do app, lendo e gravando na tabela `branding_settings`.

## Mudanças necessárias

### 1. Migração: permitir UPDATE/INSERT para admins
Atualmente a tabela `branding_settings` só permite SELECT. Precisamos:
- Criar enum `app_role` e tabela `user_roles` para controle de admin
- Adicionar RLS policies para INSERT e UPDATE na `branding_settings` permitindo apenas admins
- Criar função `has_role()` security definer

### 2. Página `/admin` (novo arquivo `src/pages/Admin.tsx`)
Painel com abas/seções organizadas por categoria:

**Aba "Geral"**
- Nome do app, tagline, slogan

**Aba "Cores"**
- Color pickers para: navy, gold, cream, mint, coral, lilac, sky_blue, etc.
- Preview em tempo real das cores

**Aba "Tipografia"**
- Selects para font_display, font_body, font_mono

**Aba "Tamanhos (Logos)"**
- Sliders para cada tamanho de logo/símbolo (hero, footer, login, nav, index)
- Preview visual do tamanho

**Aba "Tom de Voz"**
- Campos editáveis para as frases motivacionais (phrase_1 a phrase_4)

**Aba "Textos da Landing"**
- Adicionar à tabela campos para os textos principais da landing (hero title, hero subtitle, brand story, missão, visão, essência)
- Campos textarea editáveis no painel

Cada seção terá botão "Salvar" que faz UPDATE na tabela.

### 3. Rota protegida
- Adicionar rota `/admin` em `App.tsx`
- Criar guard que verifica role admin via `has_role()`
- Botão discreto no BottomNav ou acessível por URL direta

### 4. Landing page dinâmica
- Refatorar `Landing.tsx` para buscar textos editáveis da `branding_settings` ao carregar, usando os valores do banco como fallback para os hardcoded atuais

### 5. Inserir textos da landing no banco
- Inserir registros iniciais para textos da landing (hero_title, hero_subtitle, brand_story, mission, vision, essence, cta_text)

## Estrutura técnica
- Hook `useBrandingSettings()` para fetch/update dos settings
- Componentes: `ColorPickerField`, `SliderField`, `TextEditField`
- Tabs do shadcn/ui para organizar as seções
- Toast de confirmação ao salvar

## Arquivos envolvidos
- `supabase/migrations/` -- nova migration (roles + RLS + textos landing)
- `src/pages/Admin.tsx` -- novo
- `src/hooks/useBrandingSettings.ts` -- novo
- `src/pages/Landing.tsx` -- refatorar para usar dados dinâmicos
- `src/App.tsx` -- adicionar rota /admin

