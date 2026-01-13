# Museu Virtual da Escola

Aplicação web com frontend e API separados. O frontend é servido pelo Apache (XAMPP) e a API roda em um servidor Node/Express dedicado.

## Arquitetura

- **API (Node/Express)**: `api/server.js` expõe endpoints REST em `http://localhost:3000/api` e lê/grava dados em `data/museu.json`.
- **Frontend (Apache/XAMPP)**: páginas em [public/index.html](public/index.html) e [public/admin.html](public/admin.html) consumem a API.
- **Dados**: armazenados em [data/museu.json](data/museu.json).

## Instalação e Execução

1) Instalar dependências (na raiz do projeto):
```powershell
npm install
```

2) Iniciar somente a API (servidor separado):
```powershell
npm run api:start
```
API disponível em: `http://localhost:3000/api`

3) Abrir o frontend pelo Apache (XAMPP):
- Página pública: `http://localhost/TrabalhoIntegra-oSistemas/public/index.html`
- Área privada: `http://localhost/TrabalhoIntegra-oSistemas/public/admin.html`

Obs.: O `API_URL` já aponta para `http://localhost:3000/api` em [public/privado.js](public/privado.js).

## Funcionalidades

### Página Pública (index.html)
- Visualização de todos os itens do museu
- Filtro por coleções temáticas
- Exposição de obras de arte obtidas da API pública (MetMuseum)

### Página Privada (admin.html)
- Adicionar novos itens
- Criar novas coleções
- Listar e apagar itens/coleções

## Endpoints da API

### Públicos
- `GET /api/itens` — Obter todos os itens
- `GET /api/itens/:id` — Obter item por ID
- `GET /api/colecoes` — Obter todas as coleções
- `GET /api/colecoes/:nome/itens` — Obter itens por coleção
- `GET /api/arte-publica` — Obras com imagens da API do MetMuseum

### Privados
- `POST /api/itens` — Adicionar novo item
- `POST /api/colecoes` — Criar nova coleção
- `DELETE /api/itens/:id` — Apagar item
- `DELETE /api/colecoes/:id` — Apagar coleção (sem itens associados)

## CORS e Proxy (opcional)

- **CORS**: A API usa `cors()` e aceita chamadas do frontend. Em produção, restrinja `origin` ao domínio do site.
- **Proxy Apache (mesma origem)**: você pode configurar `/api` no Apache para rotear para `http://localhost:3000/api`, evitando CORS:
	- Habilite `mod_proxy` e `mod_proxy_http`.
	- No VirtualHost/`httpd.conf`:
		```
		ProxyPass        "/TrabalhoIntegra-oSistemas/public/api" "http://localhost:3000/api"
		ProxyPassReverse "/TrabalhoIntegra-oSistemas/public/api" "http://localhost:3000/api"
		```
	- No frontend, chame `/TrabalhoIntegra-oSistemas/public/api/...`.

## Troubleshooting

- API não responde: verifique se está rodando com `npm run api:start` e sem conflito de porta.
- Erros de CORS: use o proxy do Apache (acima) ou ajuste `cors()` na API para permitir a origem do frontend.
- Permissões de escrita: garanta que o Node tenha permissão para gravar em [data/museu.json](data/museu.json).

## Tecnologias

- **Backend**: Node.js, Express, CORS
- **Frontend**: HTML, CSS, JavaScript
- **API Externa**: Metropolitan Museum of Art API
