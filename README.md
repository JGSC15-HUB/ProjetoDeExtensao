# Cave Barber Shop

## Arquivos principais

- `index.html`: formulário público de atendimento.
- `admin.html`: login e painel administrativo.
- `script.js`: funcionamento do formulário e ponto de integração com Google Sheets/n8n.
- `admin.js`: login, faturamento, atendimentos, barbeiros e clientes.
- `style.css`: visual do sistema.

## Login de demonstração

- Usuário: `admin`
- Senha: `1234`

## Como testar

Abra `index.html` para registrar atendimentos. Clique em **Administração** no menu ou abra `admin.html` para acessar o painel.

Os dados de teste ficam no `localStorage` do navegador. O local para conectar o Google Sheets/n8n está comentado no arquivo `script.js`.

> O login em JavaScript é apenas demonstrativo. Em produção, use autenticação no backend, Firebase ou Supabase.
