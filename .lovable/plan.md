

# Redesign "Gamer Premium" — Direção Visual Definitiva

Você está certo. As 3 propostas anteriores foram genéricas. Vou abandonar a ideia de "escolher entre 3 estilos médios" e construir **uma única direção forte**, fundamentada nas referências que você enviou (Royal Match, Brawl Stars, mascote dourado, ranking com pódio 3D).

## A Direção: **"Maluz Arena"**

Um sistema visual que combina:
- **Profundidade real** (Royal Match): bordas escuras grossas, sombras internas, faces coloridas inferiores nos botões — sensação de objeto físico moldado, não plano.
- **Energia de campeonato** (Brawl Stars): ranking com pódio 3D, faixas diagonais de XP, badges metálicos com brilho.
- **Mascote como herói** (suas refs): a lampadinha Maluz ganha presença em estados de conquista, pódio e empty states.
- **Paleta dominada por dourado**, com roxo (premium/conquistas), verde (XP/sucesso), vermelho coral (vidas/streak), azul info — sempre subordinados ao ouro.

Nada de "3D tosco". Tudo é construído com camadas CSS reais (gradientes radiais, sombras múltiplas, insets), não filtros baratos.

---

## Sistema Visual — Tokens

**Paleta expandida** (em `index.css`):
```text
Dourado profundo:   42 91% 61%  (primary atual)
Dourado claro:      48 100% 72% (highlights, top bevel)
Dourado escuro:     30 80% 38%  (sombras, bottom bevel)
Roxo realeza:       268 70% 58% (PRO, conquistas)
Verde XP:           142 76% 50% (progresso, sucesso)
Coral vida:         8 88% 62%   (streak, vidas)
Azul info:          210 90% 60% (links, tooltips)
Navy profundo:      213 50% 8%  (background mais escuro)
Navy card:          214 40% 14% (mantém)
Cream destaque:     43 87% 94%  (foreground)
```

**Sombras gamer** (utilities customizadas):
- `shadow-bevel-gold`: bevel inferior 4px dourado escuro + glow externo dourado
- `shadow-bevel-purple`, `shadow-bevel-green`, `shadow-bevel-coral`
- `shadow-trophy`: sombra dramática com 3 camadas para pódio
- `shadow-card-game`: card flutuante com sombra dourada sutil

**Animações novas**: `coin-spin`, `trophy-bounce`, `xp-fill`, `badge-pop`, `glow-breathe`.

---

## Componentes Base Novos (`src/components/game/`)

1. **`GameButton.tsx`** — botão com bevel real (top highlight + bottom shadow color), 3 variantes: `gold` (primária), `purple` (PRO), `ghost-gold` (secundária). Press state afunda 2px.
2. **`GameCard.tsx`** — card com borda dourada dupla, gradient interno sutil, sombra com tom dourado.
3. **`StatBadge.tsx`** — badge circular tipo "moeda" para XP, streak, nível. Ícone + número grande + label pequena.
4. **`ProgressBarGame.tsx`** — barra de XP com gradiente verde→dourado, brilho deslizante, shimmer no fim, marcadores de nível.
5. **`TrophyPodium.tsx`** — pódio 3D para top-3 do ranking (1º maior centro, 2º esquerda, 3º direita) com avatares e badges metálicos.

---

## Ícones — Geração via IA (Gemini 3 Pro Image)

Vou gerar **6 ícones-chave** em PNG estilizados, salvos em `src/assets/icons-game/`:

1. `nav-home.png` — casa estilizada com telhado dourado, janelas iluminadas, base navy com bevel
2. `nav-profiles.png` — duas figuras estilizadas (família) com escudo dourado
3. `nav-trophy.png` — troféu dourado com gemas, base de mármore navy, fitas roxas
4. `nav-swords.png` — duas espadas cruzadas douradas com cabo roxo, escudo no fundo
5. `central-lamp-glow.png` — lampadinha Maluz (já existe) reinterpretada com aura dourada radial intensa, raios saindo
6. `xp-coin.png` — moeda dourada com "XP" gravado, brilho metálico

Cada ícone: 512×512, fundo transparente, estilo "Royal Match meets Brawl Stars" — volume real, sombras pintadas, sem ser cartoon infantil. Prompt menciona explicitamente a paleta navy/dourado e o tom premium para crianças+pais.

---

## Páginas Redesenhadas (Fase Core)

### 1. `BottomNav.tsx`
- Barra com altura aumentada (84px), borda superior dourada com glow sutil
- Substituir ícones Lucide pelos PNGs gerados (nav-home, nav-profiles, nav-trophy, nav-swords)
- Item ativo: ícone com brilho dourado + indicador de "lâmina" dourado curvo no topo (não barrinha reta)
- Botão central: aumentar para 80px, anel dourado pulsante quando idle, explosão de partículas CSS ao tocar
- Badges de notificação: redondos com bevel coral, número em fonte mono bold

### 2. `Index.tsx` (Dashboard)
- **Header do herói**: card grande no topo com avatar do perfil em moldura dourada circular, nome em Playfair, nível ao lado em badge roxo com bevel
- **Barra de XP**: nova `ProgressBarGame` ocupando largura total, mostra "Nível X → X+1", XP atual / próximo nível, com shimmer
- **Stats em fileira**: 3 `StatBadge` lado a lado (Streak 🔥coral, XP Total 💎dourado, Sessões ⚡verde) — circulares, tipo moedas
- **Card "Continuar estudando"**: `GameCard` com a lampadinha à direita, CTA `GameButton gold` grande
- **Grid de ações rápidas**: 4 cards 2×2 (Gerar, Desafiar amigo, Ver ranking, Família) com ícones grandes e labels em mono bold
- **Feed social**: cards menores com bordas douradas finas, reações com bounce
- **PRO upsell** (se Free): card com gradiente roxo→dourado, coroa grande, glow breathe

### 3. `Profiles.tsx`
- Card "Meu Plano" reformulado: badge PRO/Free com bevel, gradiente sutil de fundo conforme tier
- Avatares dos perfis em molduras douradas circulares com borda dupla, badge de nível flutuando no canto inferior direito
- Botões de ação (gerenciar, desvincular) como `GameButton` outline dourado
- Seção família com fundo de gradient navy mais profundo, separação visual clara entre "Eu", "Cônjuge", "Filhos"

### 4. Bonus — Topo de `Challenges.tsx` (preview do ranking)
- Mini pódio 3D no topo (top 3 amigos por XP semanal) usando `TrophyPodium`
- Resto da lista mantém layout atual mas com `GameCard` e badges de posição douradas/prateadas/bronze

---

## Detalhes Técnicos

**Arquivos a criar**:
- `src/components/game/GameButton.tsx`
- `src/components/game/GameCard.tsx`
- `src/components/game/StatBadge.tsx`
- `src/components/game/ProgressBarGame.tsx`
- `src/components/game/TrophyPodium.tsx`
- `src/assets/icons-game/*.png` (6 ícones gerados via Edge Function temporária ou diretamente via API)

**Arquivos a editar**:
- `src/index.css` — adicionar tokens da paleta expandida + utilities de sombra/bevel + 5 keyframes novas
- `tailwind.config.ts` — registrar cores `purple`, `xp-green`, `coral`, `info-blue` e `boxShadow` customizadas
- `src/components/BottomNav.tsx` — substituir ícones e estilizar com novo sistema
- `src/pages/Index.tsx` — refazer dashboard usando componentes game/
- `src/pages/Profiles.tsx` — aplicar GameCard, StatBadge, molduras douradas
- `src/pages/Challenges.tsx` — adicionar TrophyPodium no topo

**Geração de ícones**: vou usar a API Lovable AI Gateway (`google/gemini-3-pro-image-preview`) chamada de um script local one-shot para gerar e salvar os 6 PNGs em `src/assets/icons-game/` antes do build. Se falhar, fallback para Lucide estilizado com gradientes/sombras douradas (não bloqueia o redesign).

**Não toca em**: lógica de negócio, hooks, edge functions, Stripe, Auth, exercícios. Pure UI/UX.

**Acessibilidade**: contraste mantido (foreground cream sobre navy = AAA), animações respeitam `prefers-reduced-motion`, touch targets ≥44px.

**Mobile-first**: tudo testado primeiro em 592px (viewport atual). Pódio escala bem em mobile (top 3 em coluna única se largura <360px).

---

## Entregável desta primeira iteração

Após sua aprovação:
1. Tokens + utilities + animações no CSS/Tailwind
2. 6 ícones PNG gerados e salvos
3. 5 componentes `game/` prontos
4. BottomNav, Dashboard (Index), Profiles e topo de Challenges aplicando o novo sistema

Próximas fases (não inclusas agora): Exercícios, Generate, Friends, Admin, Landing.

