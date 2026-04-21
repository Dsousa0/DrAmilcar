# DrAmilcar — Redesign Visual

**Objetivo:** Eliminar a aparência de "feito por IA" substituindo a paleta genérica (blue-600/gray), a tipografia de sistema e a ausência de identidade por uma linguagem visual coesa e deliberada.

**Direção aprovada:** Neutro Premium — tons quentes off-white/creme com acento âmbar dourado, tipografia Lora no logo e Plus Jakarta Sans na UI.

---

## Paleta de Cores

Todos os valores substituem os `blue-*`, `gray-*` e `white` atuais.

| Token semântico | Hex | Uso |
|---|---|---|
| `stone-950` | `#1c1917` | Texto primário, logo |
| `stone-900` | `#292524` | Bubble do usuário, botão login |
| `stone-700` | `#44403c` | Texto de corpo (respostas da IA) |
| `stone-500` | `#78716c` | Texto secundário (sidebar itens, logout) |
| `stone-400` | `#a8a29e` | Texto muted (tagline, placeholder) |
| `stone-200` | `#e8e5e0` | Bordas, divisores |
| `stone-100` | `#f0ede8` | Item ativo na sidebar, fundo de hover |
| `stone-50`  | `#f5f4f1` | Bubble da IA, input box, fundo de campo |
| `warm-white`| `#fafaf9` | Fundo da sidebar |
| `white`     | `#fffffe` | Fundo do chat, cards |
| `amber`     | `#d6a96a` | Acento único: borda ativa, send button, avatar, links |
| `amber-dark`| `#c4954f` | Hover do amber |

**Regra:** `#d6a96a` é o único acento — não usar azul em nenhum lugar.

---

## Tipografia

### Fontes

| Fonte | Peso | Uso |
|---|---|---|
| Lora | 700 | Logo "DrAmilcar" no header da sidebar e na página de login |
| Plus Jakarta Sans | 400, 500, 600, 700 | Todo o restante da UI |

**Self-hosted via Google Fonts** (import no `index.css`):
```css
@import url('https://fonts.googleapis.com/css2?family=Lora:wght@700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
```

### Hierarquia

| Elemento | Fonte | Tamanho | Peso |
|---|---|---|---|
| Logo sidebar/login | Lora | 18px / 24px | 700 |
| Tagline sidebar | Plus Jakarta Sans | 10px | 400 |
| Section labels | Plus Jakarta Sans | 9.5px uppercase | 700 |
| Itens de conversa | Plus Jakarta Sans | 11px | 400 (inactive) / 500 (active) |
| Título do chat header | Plus Jakarta Sans | 13px | 600 |
| Bubbles (user + AI) | Plus Jakarta Sans | 12px | 400 |
| Input placeholder | Plus Jakarta Sans | 12px | 400 |
| Labels de formulário | Plus Jakarta Sans | 11.5px | 600 |
| Campos de formulário | Plus Jakarta Sans | 13px | 400 |

---

## Componentes

### Sidebar

- Fundo: `#fafaf9`, borda direita: `1px solid #e8e5e0`
- **Header:** logo em Lora 18px/`#1c1917`, tagline "base de conhecimento" em 10px/`#a8a29e`
- **Section labels:** 9.5px uppercase `#a8a29e`, letter-spacing 1.4px
- **Item de conversa ativo:** `background: #f0ede8`, `border-left: 2.5px solid #d6a96a`, texto `#292524`, peso 500
- **Item de conversa inativo:** texto `#78716c`, hover `background: #f5f3ef`
- **Botão "Nova conversa":** borda dashed `#d6c5ae`, ícone "＋" em `#d6a96a`; hover: borda `#d6a96a`, fundo `#faf7f3`
- **Upload zone:** borda dashed `#d6c5ae`, texto `#a8a29e`; hover: borda `#d6a96a`
- **Ícone de documento:** `◆` em `#d6a96a` (Lucide `FileText` quando instalado)
- **Footer:** email em 10px/`#a8a29e`, botão "sair" em 10px/`#a8a29e` → hover `#c25b4a`

### Chat Header

- Fundo branco `#fffffe`, borda inferior `1px solid #e8e5e0`
- Título da conversa: 13px, peso 600, `#1c1917`
- Meta ("2 documentos"): 10px, `#a8a29e`

### Bubbles

**Usuário:**
- `background: #292524`, texto `#fafaf9`
- `border-radius: 16px 16px 3px 16px`
- 12px, linha 1.55

**IA:**
- Avatar "A": círculo 26px, `background: #f0ede8`, borda `1.5px solid #e8e5e0`, Lora 10px bold, cor `#d6a96a`
- `background: #f5f4f1`, texto `#44403c`
- `border-radius: 3px 16px 16px 16px`
- 12px, linha 1.65

**Estado "Pensando":** 3 dots animados `#c5bdb4`, bounce com delay 0/0.2/0.4s — sem texto "Pensando"

### Input de Chat

- Container: `background: #f5f4f1`, borda `1.5px solid #e8e5e0`, border-radius 12px
- Focus: borda `#d6a96a`
- Placeholder: 12px `#a8a29e`
- Send button: 28×28px, `background: #d6a96a`, border-radius 7px, ↑ branco

### Login

- Fundo da página: `#f5f4f1`
- Card: `background: #fffffe`, border-radius 16px, padding 36px 32px, sombra suave
- Logo: Lora 24px/700/`#1c1917`
- Subtítulo: 13px/`#78716c`
- Labels: 11.5px/600/`#44403c`
- Campos: `background: #f5f4f1`, borda `1.5px solid #e8e5e0`, focus borda `#d6a96a`
- Botão principal: `background: #292524`, texto `#fafaf9`; hover `#1c1917`
- Link de toggle: cor `#d6a96a`, peso 600

---

## Arquivos a Modificar

| Arquivo | O que muda |
|---|---|
| `frontend/src/index.css` | Importar Lora + Plus Jakarta Sans; definir `font-family` base |
| `frontend/src/App.jsx` | Cores do layout principal e sidebar |
| `frontend/src/pages/Login.jsx` | Paleta completa do card de login |
| `frontend/src/components/Chat/MessageBubble.jsx` | Bubbles e avatar da IA |
| `frontend/src/components/Chat/ChatWindow.jsx` | Fundo e chat header |
| `frontend/src/components/Chat/ChatInput.jsx` | Input box e send button |
| `frontend/src/components/Conversations/ConversationList.jsx` | Item ativo, Nova conversa btn |
| `frontend/src/components/Upload/UploadZone.jsx` | Upload zone, ícone |
| `frontend/src/components/Documents/DocumentList.jsx` | Ícone de documento, cores |

**Não instalar novas dependências de ícones** — usar caracteres Unicode (◆, ＋) onde necessário. Os componentes existentes têm estrutura suficiente.

---

## O que NÃO muda

- Estrutura de layout (sidebar + main) — não é alterada
- Lógica de estado e hooks — nenhuma mudança funcional
- Responsividade — mantida como está
- Markdown rendering nas respostas — mantido

---

## Critérios de Aceitação

- Nenhum `blue-*` ou `gray-*` do Tailwind na UI (somente `stone-*` e amber customizado via CSS inline ou classes arbitrárias)
- Logo em Lora em todas as telas
- Plus Jakarta Sans carregada e aplicada como `font-family` base
- Acento âmbar `#d6a96a` visível apenas em: borda ativa, send button, avatar "A", link de cadastro, hover em upload/nova conversa
- Bubble do usuário em `#292524` (não azul)
- Dots de "pensando" sem texto "Pensando"
