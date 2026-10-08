# 🛒 CarrinhoLeve

Comparador de preços de supermercado que coloca **Atacadão** e **Mateus** lado a lado, mostra o **preço por unidade** (R$/kg, R$/L, R$/un) e aponta onde cada produto sai mais barato.

> Projeto Escolar · Feira do Empreendedor

Este repositório contém o **site**. As buscas nos mercados passam por um **proxy em outro repositório**: [`carrinholeve-proxy`](https://github.com/eoshai/comparador-proxy).

---

## ✨ Funcionalidades

- **Busca em tempo real** nas duas lojas ao mesmo tempo
- **Pareamento automático** de produtos equivalentes (mesmo tamanho + nome parecido), com aviso de "mais barato / mais caro que no outro mercado"
- **Preço por unidade** calculado a partir do nome do produto (kg, g, L, ml, un)
- **Selo de melhor preço por unidade** nos resultados
- **Filtros e ordenação:** por relevância, menor preço ou preço/unidade; por loja; só produtos presentes nas duas lojas; busca por todas as palavras
- **Paginação** dos resultados (8 produtos por página)
- **Carrinho** para montar a lista de compras
- **Tema claro e escuro**, com a escolha salva no navegador
- **Modo de exemplo:** se uma loja não responder, o site mostra dados de demonstração dessa loja e avisa o usuário

---

## 🧱 Como funciona

O navegador não consegue consultar as APIs dos mercados diretamente (bloqueio de CORS). Por isso o projeto é dividido em dois repositórios:

```
┌──────────────────┐   /api/atacadao?term=…   ┌──────────────────┐      ┌───────────┐
│  Site            │ ───────────────────────▶ │  Proxy           │ ───▶ │ Atacadão  │
│  (este repo)     │   /api/mateus?term=…     │  (outro repo)    │ ───▶ │ Mateus    │
│  TanStack Start  │ ◀─────────────────────── │  Node + cache    │      └───────────┘
└──────────────────┘          JSON            └──────────────────┘
```

| Repositório | O que faz |
| --- | --- |
| **Site** (este) | Interface, filtros, pareamento, preço por unidade, carrinho |
| **Proxy** | Repassa a busca aos mercados, com cache e limite de requisições |

---

## 🧰 Tecnologias

- [TanStack Start](https://tanstack.com/start) + TanStack Router
- React 19 + TypeScript
- Tailwind CSS 4 + componentes Radix UI
- Vite

---

## 🚀 Como rodar localmente

**Pré-requisito:** Node.js em versão recente (22 ou superior recomendado) e npm.

### 1. Suba o proxy

Siga o README do repositório do proxy. Por padrão ele roda em `http://localhost:3000`.

### 2. Rode o site

```sh
git clone https://github.com/eoshai/comparador.git
cd comparador
npm install
npm run dev
```

Abra o endereço que o Vite mostrar no terminal.

---

## ⚙️ Configuração

A única configuração do site é o endereço do proxy, em `src/lib/comparador.ts`:

```ts
export const PROXY_BASE = "http://localhost:3000";
```

Ao publicar, troque pela URL pública do proxy, por exemplo:

```ts
export const PROXY_BASE = "https://seu-proxy.onrender.com";
```

> O proxy precisa estar no ar para as buscas funcionarem. Sem ele, o site mostra os dados de exemplo.

---

## 📜 Scripts

| Comando | O que faz |
| --- | --- |
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Gera o build de produção |
| `npm run preview` | Visualiza o build localmente |
| `npm run lint` | Verifica o código com ESLint |
| `npm run format` | Formata o código com Prettier |
| `npm test` | Roda os testes (Vitest) |

---

## ☁️ Publicação

1. Publique primeiro o **proxy** (veja o README dele) e copie a URL pública
2. Atualize o `PROXY_BASE` em `src/lib/comparador.ts` com essa URL
3. Publique o **site** pelo Lovable ou em uma hospedagem com suporte a TanStack Start (como a Vercel)

---

## 📁 Estrutura

```
src/
├── routes/
│   └── index.tsx        # Página principal (busca, filtros, grade, paginação)
├── components/
│   ├── Carrinho.tsx     # Carrinho de compras
│   └── ui/              # Componentes de interface
└── lib/
    └── comparador.ts    # Busca nas lojas, pareamento e preço por unidade
public/
├── bg-light.png         # Textura de fundo (tema claro)
└── bg-dark.png          # Textura de fundo (tema escuro)
```

---

## ⚠️ Observações

- Os preços vêm das APIs públicas dos próprios mercados e **podem mudar ou ficar indisponíveis** a qualquer momento
- Os mercados podem bloquear requisições vindas de servidores na nuvem; nesse caso o site usa os dados de exemplo
- Este é um projeto escolar, sem vínculo com o Atacadão ou o Mateus Mais

---

## 🛠️ Feito com

Criado no [Lovable](https://lovable.dev). O código é livre: edite no Lovable ou localmente e sincronize pelo GitHub.