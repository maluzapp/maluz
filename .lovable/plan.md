## Diferenciação de Fotos e Áudio por Plano

### Proposta de limites


| Recurso          | Free      | Pro / Família |
| ---------------- | --------- | ------------- |
| Fotos por sessão | até 2     | ilimitadas    |
| Áudio            | bloqueado | liberado      |


> Concordo com a ideia, mas sugiro **2 fotos no Free** em vez de 3 — cria mais incentivo de upgrade sem frustrar demais. Ilimitadas no Pro faz sentido. Áudio como recurso exclusivo Pro é um ótimo gatilho de conversão, pois agrega muito valor pedagógico.

### Alterações

**1. `src/hooks/useSubscription.ts**`

- Expandir o retorno de `useCanStartSession` para incluir `planSlug` (já existe) e exportar um helper `usePlanLimits()` que retorna `{ maxPhotos: number | null, canUseAudio: boolean }` baseado no `planSlug`.
  - Free: `{ maxPhotos: 2, canUseAudio: false }`
  - Pro/Família: `{ maxPhotos: null, canUseAudio: true }`

**2. `src/pages/Generate.tsx**`

- Importar `usePlanLimits`.
- No upload de fotos: limitar `images.length` ao `maxPhotos` se definido; mostrar badge "PRO" e mensagem quando atingir o limite.
- No bloco de áudio: se `!canUseAudio`, exibir o botão desabilitado com badge "PRO" e texto explicativo ("Recurso disponível no plano Pro").
- Mostrar um mini-banner sutil indicando os limites do plano Free.

**3. `src/components/PricingSection.tsx**`

- Adicionar "Até 2 fotos por exercício" nas features do Free e "Fotos ilimitadas + áudio" no Pro/Família (renderizado dinamicamente a partir das features do banco, mas como fallback visual).

### Detalhes técnicos

- Nenhuma migração necessária — os limites são derivados do `planSlug` no frontend.
- A lógica fica centralizada no hook `usePlanLimits` para reutilização futura.
- O bloco de áudio no Free mostrará um overlay/lock visual com ícone de coroa, mantendo o padrão visual PRO já usado no app.  
  
  
Finalizar inserindo esses novos limites e caracteristicas na landing page, tb, pra ficar claro as diferenças e no backend tb, já estar config pra essa modulação.