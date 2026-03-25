

# 📚 StudyApp — App de Estudos com IA para Fundamental II

## Visão Geral
App mobile-friendly onde o pai/mãe insere o ano escolar (6º-9º), matéria, assunto — e opcionalmente envia fotos do livro ou áudio com resumo. A IA analisa o conteúdo e gera exercícios interativos variados para a criança praticar no celular.

## Fluxo Principal

### 1. Tela Inicial — Configurar Estudo
- Selecionar **ano escolar** (6º ao 9º)
- Selecionar **matéria** (Matemática, Português, Ciências, História, Geografia, Inglês, etc.)
- Campo de texto para **assunto** (ex: "Equações do 1º grau", "Revolução Francesa")
- Upload de **fotos** das páginas do livro (múltiplas imagens)
- Gravação/upload de **áudio** com resumo da matéria
- Botão "Gerar Exercícios"

### 2. Tela de Confirmação
- A IA analisa os inputs (texto, imagens, áudio) e mostra um resumo do conteúdo identificado
- Usuário confirma ou ajusta antes de gerar

### 3. Exercícios Interativos
Gerados pela IA, com 4 tipos:
- **Múltipla escolha** — 4-5 alternativas com feedback imediato (certo/errado + explicação)
- **Verdadeiro ou Falso** — Afirmações para julgar, com explicação
- **Preencher lacunas** — Frases com campo de input para completar
- **Associação** — Arrastar/conectar conceitos relacionados (drag & drop)

Cada exercício mostra:
- Feedback instantâneo (✅/❌ com explicação breve)
- Barra de progresso
- Pontuação final com resumo de acertos

### 4. Resultado Final
- Nota/porcentagem de acertos
- Revisão dos erros com explicações
- Botão para gerar mais exercícios sobre o mesmo tema

## Design & UX
- Interface **colorida mas limpa**, adequada para pré-adolescentes (não infantil demais)
- Layout **mobile-first** otimizado para celular
- Animações suaves nos exercícios de arrastar
- Emojis e ícones para tornar divertido sem ser poluído

## Tecnologia
- **Lovable AI (Gemini)** no backend para:
  - Analisar fotos do livro (visão computacional)
  - Transcrever áudio
  - Identificar conteúdo/assunto
  - Gerar exercícios variados e contextualizados
- **Lovable Cloud** para edge functions
- Sem necessidade de login (uso pessoal)
- Dados salvos localmente no navegador (histórico de sessões)

## Páginas
1. **Home** — Formulário de configuração do estudo
2. **Confirmação** — Resumo do conteúdo pela IA
3. **Exercícios** — Tela interativa com os exercícios
4. **Resultado** — Pontuação e revisão

