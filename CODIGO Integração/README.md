# Museu Virtual da Escola

Aplicação web desenvolvida em JavaScript para criar um catálogo digital de projetos escolares, fotografias e peças históricas.

## Estrutura do Projeto

- **Backend (API)**: Servidor Node.js/Express que lê dados de um ficheiro JSON e fornece endpoints REST
- **Frontend**: Duas páginas web (pública e privada) que consomem a API
- **Integração API Pública**: Integração com a API do Art Institute of Chicago para exibir obras de arte

## Requisitos Implementados

✅ 2 páginas web (1 pública + 1 privada)  
✅ Conteúdo consumido a partir da API criada  
✅ Integração com API pública (Art Institute of Chicago)  
✅ API que lê ficheiro JSON e guarda dados em memória  
✅ API fornece dados e operações necessárias para a aplicação JS  

## Instalação

1. Instalar dependências:
```bash
npm install
```

2. Iniciar o servidor:
```bash
npm start
```

3. Abrir no navegador:
- Página pública: http://localhost:3000/index.html
- Página privada: http://localhost:3000/admin.html

## Funcionalidades

### Página Pública (index.html)
- Visualização de todos os itens do museu
- Filtro por coleções temáticas
- Exposição de obras de arte da API pública

### Página Privada (admin.html)
- Adicionar novos itens ao museu
- Criar novas coleções temáticas
- Visualizar todos os itens adicionados

## Estrutura de Dados

Os dados são armazenados em `data/museu.json` e incluem:
- **Itens**: Projetos, fotografias e peças históricas
- **Coleções**: Agrupamentos temáticos dos itens

## Endpoints da API

### Públicos
- `GET /api/itens` - Obter todos os itens
- `GET /api/itens/:id` - Obter item por ID
- `GET /api/colecoes` - Obter todas as coleções
- `GET /api/colecoes/:nome/itens` - Obter itens por coleção
- `GET /api/arte-publica` - Obter obras de arte da API pública

### Privados
- `POST /api/itens` - Adicionar novo item
- `POST /api/colecoes` - Criar nova coleção

## Tecnologias Utilizadas

- **Backend**: Node.js, Express
- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **API Externa**: Art Institute of Chicago API
