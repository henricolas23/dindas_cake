# Dindas Cake · Controle de estoque

Aplicação web para consultar produtos, acompanhar níveis de estoque, registrar entradas e saídas e visualizar indicadores. O banco é criado sem produtos de exemplo; o catálogo é preenchido pela equipe.

## Requisitos

- Node.js 20 ou superior e npm.

## Configurar

No terminal, entre nesta pasta e instale as dependências:

```sh
npm install
```

Copie `.env.example` para `.env` e preencha `SESSION_SECRET`, `ADMIN_USER` e `ADMIN_PASSWORD`. Gere um segredo aleatório para a sessão com:

```sh
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Use uma senha forte para a conta administrativa. Ela é criada na primeira inicialização, com o hash armazenado no banco SQLite.

## Executar

```sh
npm start
```

Acesse `http://localhost:3000`. Para desenvolvimento com reinício automático:

```sh
npm run dev
```

## Páginas

- `/dashboard` — indicadores, comparativo de quantidades, distribuição percentual e alertas.
- `/estoque` — busca, ordenação, cadastro, edição, exclusão e movimentação.
- `/movimentacoes` — histórico das últimas 200 entradas, saídas e ajustes.
- `/configuracoes` — limite global de alerta de estoque baixo.

## Organização do código

```text
server.js                 inicialização do Express e montagem das rotas
src/database.js           banco SQLite em WebAssembly e persistência local
src/middleware/           autenticação das rotas protegidas
src/routes/               endpoints de login, produtos, movimentações e ajustes
public/index.html         login
public/pages/             uma página HTML por seção do sistema
public/scripts/api.js     comunicação com a API
public/scripts/components/ navegação e diálogos reutilizáveis
public/scripts/pages/     lógica específica de cada página
public/styles/main.css    identidade visual, componentes e responsividade
```

O SQLite em WebAssembly mantém o banco local sem exigir compilação de módulos nativos. O banco e as sessões são guardados em `data/`; faça backup dessa pasta. O arquivo `.env` não deve ser compartilhado. Em produção, publique atrás de HTTPS e configure `NODE_ENV=production`.
