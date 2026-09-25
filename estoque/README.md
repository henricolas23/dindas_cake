# Dindas Cake · Controle de estoque

Aplicação web para consultar produtos, acompanhar níveis de estoque, registrar entradas e saídas e visualizar indicadores. O banco é criado sem produtos de exemplo; o catálogo é preenchido pela equipe.

## Requisitos

- Node.js 20 ou superior e npm.

## E-mail nas contas

O cadastro salva um e-mail junto ao usuário e permite entrar com o nome de usuário ou o endereço de e-mail. O e-mail de contas existentes pode ser cadastrado ou atualizado pelo painel **Configurações → Perfis da equipe**.

## Configurar

No terminal, entre nesta pasta e instale as dependências:

```sh
npm install
```

Para iniciar o sistema localmente, o `.env` é opcional e uma chave de sessão será gerada automaticamente. Também é possível definir `ADMIN_USER` e `ADMIN_PASSWORD` para criar uma conta administrativa inicial; `ADMIN_EMAIL` é opcional.

Em produção, configure `SESSION_SECRET` com um valor longo e aleatório. Gere um segredo com:

```sh
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

As senhas das contas são armazenadas com hash bcrypt. A senha original nunca é gravada no banco.

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
- `/movimentacoes` — histórico completo, com filtros rápidos e intervalo de datas personalizado.
- `/configuracoes` — limite de estoque baixo e edição dos perfis de acesso.
- `/criar-conta` — cadastro de um novo usuário para acessar o sistema.

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
src/routes/users.js       consulta e edição dos perfis de acesso
public/styles/main.css    identidade visual, componentes e responsividade
```

O SQLite em WebAssembly mantém o banco local sem exigir compilação de módulos nativos. O banco e as sessões são guardados em `data/`; faça backup dessa pasta. O arquivo `.env` não deve ser compartilhado. Em produção, publique atrás de HTTPS e configure `NODE_ENV=production`.
