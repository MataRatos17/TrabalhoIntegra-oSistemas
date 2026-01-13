# API (/met)

API simples em Node/Express que lê `data.json`, guarda os dados em memória e expõe endpoints REST sob a base `/met`.

## Pré-requisitos
- Node.js LTS (inclui `npm`)
  - Instalação rápida (Windows): `winget install OpenJS.NodeJS.LTS`
  - Ou baixe em https://nodejs.org (versão LTS)
  - Após instalar, feche e reabra o terminal/VS Code

Verifique:
```powershell
node -v
npm -v
```

## Instalação e execução
Na pasta `api`:
```powershell
npm install
npm start
```
Servidor padrão: `http://127.0.0.1:3001/met`

Variáveis de ambiente (opcional):
```powershell
# Alterar porta/host temporariamente
$env:PORT = 3002
$env:HOST = "127.0.0.1"
npm start
```

## Endpoints
- `GET /met` → índice da API (links e coleções)
- `GET /met/health` → healthcheck `{ status: "ok" }`
- `GET /met/data` → JSON completo carregado de `data.json`
- `GET /met/:collection` → lista itens de uma coleção (ex.: `games`, `streams`)
  - Suporta `?q=texto` para filtro simples por nome/título
- `GET /met/:collection/:id` → item por `id`
- `POST /met/reload` → recarrega `data.json` em memória

## Testes rápidos
PowerShell:
```powershell
Invoke-WebRequest -UseBasicParsing http://127.0.0.1:3001/met/health | Select-Object StatusCode, Content
Invoke-WebRequest -UseBasicParsing http://127.0.0.1:3001/met/data   | Select-Object StatusCode, Content
Invoke-WebRequest -UseBasicParsing "http://127.0.0.1:3001/met/games?q=cs" | Select-Object StatusCode, Content
```
`curl`:
```bash
curl http://127.0.0.1:3001/met/health
curl http://127.0.0.1:3001/met/data
curl "http://127.0.0.1:3001/met/games?q=cs"
```

## Integração com o frontend
O helper já está disponível no arquivo do site: `templatemo_579_cyborg_gaming/assets/js/custom.js` (`window.api`). Base padrão: `http://localhost:3001/met`.

Exemplos no console do navegador:
```js
api.health()
api.games()
api.games({ q: 'cs' })
api.streams()
api.all()
```
Se mudar a porta/host da API, atualize a constante `BASE` no final do `custom.js`.

## Sobre os dados
- Arquivo: `api/data.json`
- Carregado em memória no boot; use `POST /met/reload` para recarregar após editar o arquivo.

## Solução de problemas
- "npm/node não reconhecido": instale Node LTS via winget/MSI e reabra o terminal.
- `MODULE_NOT_FOUND 'express'`: rode `npm install` na pasta `api`.
- `EADDRINUSE` (porta em uso): defina outra porta com `PORT=...` e ajuste o frontend.
- CORS: habilitado por padrão (lib `cors`) para facilitar o uso via `fetch`.
