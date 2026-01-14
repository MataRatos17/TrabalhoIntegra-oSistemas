// =============================
// API DO MUSEU VIRTUAL (BACK-END)
// =============================
// Este ficheiro implementa a API em Node/Express que:
// - Lê e grava os dados num ficheiro JSON (data/museu.json)
// - Expõe endpoints públicos para o site (itens, coleções)
// - Expõe endpoints privados para administração (CRUD)
// - Integra com a API pública do Metropolitan Museum of Art

const express = require('express');   // Framework web
const cors = require('cors');         // Permitir pedidos de outros domínios (frontend)
const fs = require('fs');             // Ler/gravar ficheiros
const path = require('path');         // Construir caminhos independentes do SO
const https = require('https');       // Fazer pedidos HTTPS à API pública

const app = express();
const PORT = process.env.PORT || 3000; // Porta da API (por omissão 3000)

// ------------------------------
// MIDDLEWARE GLOBAL
// ------------------------------
// Ativa CORS e parsing automático de JSON no corpo dos pedidos
app.use(cors());
app.use(express.json());

// ------------------------------
// ROTAS DE SAUDE / INFORMACAO
// ------------------------------
// Endpoint simples para testar se a API está a responder
app.get('/', (req, res) => {
    res.send('Museu API ativa. Use os endpoints em /api');
});

app.get('/api', (req, res) => {
    res.json({
        ok: true,
        mensagem: 'Museu API ativa',
        endpoints: [
            '/api/itens',
            '/api/itens/:id',
            '/api/colecoes',
            '/api/colecoes/:nome/itens',
            '/api/arte-publica'
        ]
    });
});

// ------------------------------
// CARREGAR E GUARDAR DADOS EM FICHEIRO
// ------------------------------
// Estrutura em memória (itens e coleções) carregada de data/museu.json
let dadosMuseu = null;

function carregarDados() {
    try {
        const dadosJson = fs.readFileSync(path.join(__dirname, '..', 'data', 'museu.json'), 'utf8');
        dadosMuseu = JSON.parse(dadosJson);
        console.log('Dados do museu carregados com sucesso');
    } catch (error) {
        console.error('Erro ao carregar dados:', error);
        dadosMuseu = { itens: [], colecoes: [] };
    }
}

// Carregar dados ao iniciar o servidor
carregarDados();

// Função para guardar dados no ficheiro JSON
function guardarDados() {
    try {
        fs.writeFileSync(
            path.join(__dirname, '..', 'data', 'museu.json'),
            JSON.stringify(dadosMuseu, null, 2),
            'utf8'
        );
        console.log('Dados guardados com sucesso');
    } catch (error) {
        console.error('Erro ao guardar dados:', error);
    }
}

// ==================================
// ENDPOINTS PUBLICOS (USADOS NO SITE)
// ==================================

// Obter todos os itens (página pública)
// FLUXO:
// - SE conseguirmos aceder ao array dadosMuseu.itens ENTÃO devolvemos esse array em JSON.
// - SE ocorrer algum erro inesperado ENTÃO devolvemos status 500 com mensagem de erro.
app.get('/api/itens', (req, res) => {
    try {
        res.json(dadosMuseu.itens);
    } catch (error) {
        res.status(500).json({ erro: 'Erro ao obter itens' });
    }
});

// Obter item por ID
// FLUXO:
// - Lemos o id da rota (/api/itens/:id).
// - Procuramos no array de itens.
//   * SE encontrarmos um item com esse id ENTÃO devolvemos o item em JSON.
//   * SE não encontrarmos ENTÃO devolvemos 404 com mensagem "Item não encontrado".
app.get('/api/itens/:id', (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const item = dadosMuseu.itens.find(i => i.id === id);
        
        if (item) {
            res.json(item);
        } else {
            res.status(404).json({ erro: 'Item não encontrado' });
        }
    } catch (error) {
        res.status(500).json({ erro: 'Erro ao obter item' });
    }
});

// Obter todas as coleções
// FLUXO:
// - SE a leitura do array em memória correr bem ENTÃO devolvemos o array completo.
// - SE algo falhar ENTÃO respondemos com 500.
app.get('/api/colecoes', (req, res) => {
    try {
        res.json(dadosMuseu.colecoes);
    } catch (error) {
        res.status(500).json({ erro: 'Erro ao obter coleções' });
    }
});

// Obter itens por coleção
// FLUXO:
// - Lemos o nome da coleção da rota.
// - Filtramos o array de itens por item.colecao === nomeColecao.
// - Devolvemos SEMPRE o array filtrado (mesmo que vazio), ou 500 em caso de erro.
app.get('/api/colecoes/:nome/itens', (req, res) => {
    try {
        const nomeColecao = req.params.nome;
        const itensFiltrados = dadosMuseu.itens.filter(item => 
            item.colecao === nomeColecao
        );
        res.json(itensFiltrados);
    } catch (error) {
        res.status(500).json({ erro: 'Erro ao obter itens da coleção' });
    }
});

// ===================================
// ENDPOINTS PRIVADOS (AREA ADMIN)
// ===================================

// Adicionar novo item (usado na área de administração)
// FLUXO PRINCIPAL:
// 1) Lemos o corpo do pedido (req.body) para obter o novo item.
// 2) Fazemos trim às principais strings para evitar espaços em branco.
// 3) SE algum dos campos obrigatórios (titulo, descricao, categoria, colecao)
//    ficar vazio após o trim ENTÃO devolvemos 400 com mensagem de dados incompletos.
// 4) SE estiver tudo preenchido ENTÃO geramos um novo ID, definimos ano (se vier vazio)
//    e garantimos que foto pelo menos existe como string (pode ser vazia).
// 5) Adicionamos o item ao array, guardamos no ficheiro e devolvemos 201 com o item.
app.post('/api/itens', (req, res) => {
    try {
        const novoItem = req.body;

        // Normalizar (trim) strings
        novoItem.titulo = (novoItem.titulo || '').trim();
        novoItem.descricao = (novoItem.descricao || '').trim();
        novoItem.categoria = (novoItem.categoria || '').trim();
        novoItem.colecao = (novoItem.colecao || '').trim();
        
        // Validar dados obrigatórios (não permitir strings vazias)
        if (!novoItem.titulo || !novoItem.descricao || !novoItem.categoria || !novoItem.colecao) {
            return res.status(400).json({ erro: 'Dados incompletos. Preencha título, descrição, categoria e coleção.' });
        }
        
        // Gerar novo ID
        const novoId = dadosMuseu.itens.length > 0 
            ? Math.max(...dadosMuseu.itens.map(i => i.id)) + 1 
            : 1;
        
        novoItem.id = novoId;
        novoItem.ano = novoItem.ano || new Date().getFullYear();
        // Não definir foto se não fornecida - será tratado no frontend
        if (!novoItem.foto || novoItem.foto.trim() === '') {
            novoItem.foto = '';
        }
        
        dadosMuseu.itens.push(novoItem);
        guardarDados();
        
        res.status(201).json(novoItem);
    } catch (error) {
        res.status(500).json({ erro: 'Erro ao adicionar item' });
    }
});

// Criar nova coleção (usado na área de administração)
// FLUXO PRINCIPAL:
// 1) Lemos o corpo do pedido e fazemos trim ao nome e descrição.
// 2) SE nome ou descrição ficarem vazios ENTÃO devolvemos 400 (dados incompletos).
// 3) Verificamos SE já existe coleção com o mesmo nome; se existir devolvemos 400.
// 4) SE tudo estiver correto ENTÃO geramos um novo ID, definimos uma cor (ou padrão),
//    guardamos no array e persistimos no ficheiro, devolvendo 201 com a coleção criada.
app.post('/api/colecoes', (req, res) => {
    try {
        const novaColecao = req.body;

        // Normalizar (trim) strings
        novaColecao.nome = (novaColecao.nome || '').trim();
        novaColecao.descricao = (novaColecao.descricao || '').trim();
        
        // Validar dados obrigatórios (não permitir strings vazias)
        if (!novaColecao.nome || !novaColecao.descricao) {
            return res.status(400).json({ erro: 'Dados incompletos. Preencha nome e descrição da coleção.' });
        }
        
        // Verificar se já existe
        const existe = dadosMuseu.colecoes.find(c => c.nome === novaColecao.nome);
        if (existe) {
            return res.status(400).json({ erro: 'Coleção já existe' });
        }
        
        // Gerar novo ID
        const novoId = dadosMuseu.colecoes.length > 0 
            ? Math.max(...dadosMuseu.colecoes.map(c => c.id)) + 1 
            : 1;
        
        novaColecao.id = novoId;
        novaColecao.cor = novaColecao.cor || '#6C757D';
        
        dadosMuseu.colecoes.push(novaColecao);
        guardarDados();
        
        res.status(201).json(novaColecao);
    } catch (error) {
        res.status(500).json({ erro: 'Erro ao criar coleção' });
    }
});

// ===================================
// ENDPOINTS PARA ATUALIZAR (PUT)
// ===================================

// Atualizar item (PUT)
// FLUXO PRINCIPAL:
// 1) Lemos o id da rota e procuramos o índice do item na lista.
//    - SE não existir item com esse id ENTÃO devolvemos 404.
// 2) Fazemos trim às principais strings vindas do body.
// 3) SE após o trim algum campo obrigatório ficar vazio ENTÃO devolvemos 400.
// 4) SE estiver tudo válido ENTÃO mantemos o id original, substituímos o objeto no array
//    e guardamos os dados em disco; no final, devolvemos o item atualizado.
app.put('/api/itens/:id', (req, res) => {
    try {
        const id = parseInt(req.params.id);
        console.log(`PUT /api/itens/${id}`, req.body);
        
        const indice = dadosMuseu.itens.findIndex(i => i.id === id);
        
        if (indice === -1) {
            console.log(`Item ${id} não encontrado`);
            return res.status(404).json({ erro: 'Item não encontrado' });
        }
        
        const itemAtualizado = req.body;

        // Normalizar (trim) strings
        itemAtualizado.titulo = (itemAtualizado.titulo || '').trim();
        itemAtualizado.descricao = (itemAtualizado.descricao || '').trim();
        itemAtualizado.categoria = (itemAtualizado.categoria || '').trim();
        itemAtualizado.colecao = (itemAtualizado.colecao || '').trim();
        
        // Validar dados obrigatórios
        if (!itemAtualizado.titulo || !itemAtualizado.descricao || !itemAtualizado.categoria || !itemAtualizado.colecao) {
            return res.status(400).json({ erro: 'Dados incompletos. Preencha título, descrição, categoria e coleção.' });
        }
        
        // Manter o ID original
        itemAtualizado.id = id;
        
        // Atualizar o item
        dadosMuseu.itens[indice] = itemAtualizado;
        guardarDados();
        
        console.log(`Item ${id} atualizado com sucesso`);
        res.json(itemAtualizado);
    } catch (error) {
        console.error('Erro ao atualizar item:', error);
        res.status(500).json({ erro: 'Erro ao atualizar item' });
    }
});

// Atualizar coleção (PUT)
// FLUXO PRINCIPAL:
// 1) Lemos o id da rota e procuramos o índice da coleção.
//    - SE não encontrar ENTÃO devolvemos 404.
// 2) Fazemos trim ao nome e descrição recebidos.
// 3) SE algum destes campos estiver vazio ENTÃO devolvemos 400.
// 4) Caso contrário, mantemos o id, atualizamos o array, gravamos no ficheiro
//    e devolvemos a coleção atualizada.
app.put('/api/colecoes/:id', (req, res) => {
    try {
        const id = parseInt(req.params.id);
        console.log(`PUT /api/colecoes/${id}`, req.body);
        
        const indice = dadosMuseu.colecoes.findIndex(c => c.id === id);
        
        if (indice === -1) {
            console.log(`Coleção ${id} não encontrada`);
            return res.status(404).json({ erro: 'Coleção não encontrada' });
        }
        
        const colecaoAtualizada = req.body;

        // Normalizar (trim) strings
        colecaoAtualizada.nome = (colecaoAtualizada.nome || '').trim();
        colecaoAtualizada.descricao = (colecaoAtualizada.descricao || '').trim();
        
        // Validar dados obrigatórios
        if (!colecaoAtualizada.nome || !colecaoAtualizada.descricao) {
            return res.status(400).json({ erro: 'Dados incompletos. Preencha nome e descrição da coleção.' });
        }
        
        // Manter o ID original
        colecaoAtualizada.id = id;
        
        // Atualizar a coleção
        dadosMuseu.colecoes[indice] = colecaoAtualizada;
        guardarDados();
        
        console.log(`Coleção ${id} atualizada com sucesso`);
        res.json(colecaoAtualizada);
    } catch (error) {
        console.error('Erro ao atualizar coleção:', error);
        res.status(500).json({ erro: 'Erro ao atualizar coleção' });
    }
});

// ===================================
// ENDPOINTS PARA APAGAR (DELETE)
// ===================================

// Apagar item (DELETE)
// FLUXO:
// - Lemos o id, procuramos o índice no array.
//   * SE não encontrar ENTÃO devolvemos 404.
//   * SE encontrar ENTÃO removemos com splice, guardamos e devolvemos mensagem de sucesso.
app.delete('/api/itens/:id', (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const indice = dadosMuseu.itens.findIndex(i => i.id === id);
        
        if (indice === -1) {
            return res.status(404).json({ erro: 'Item não encontrado' });
        }
        
        dadosMuseu.itens.splice(indice, 1);
        guardarDados();
        
        res.json({ mensagem: 'Item apagado com sucesso' });
    } catch (error) {
        res.status(500).json({ erro: 'Erro ao apagar item' });
    }
});

// Apagar coleção (DELETE)
// FLUXO:
// - Lemos o id e procuramos a coleção.
//   * SE não existir ENTÃO devolvemos 404.
// - Descobrimos o nome da coleção e verificamos se há itens associados.
//   * SE existirem itens com essa coleção ENTÃO NÃO apagamos e devolvemos 400 a avisar.
//   * SE não existirem itens associados ENTÃO removemos a coleção, guardamos e respondemos sucesso.
app.delete('/api/colecoes/:id', (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const indice = dadosMuseu.colecoes.findIndex(c => c.id === id);
        
        if (indice === -1) {
            return res.status(404).json({ erro: 'Coleção não encontrada' });
        }
        
        const nomeColecao = dadosMuseu.colecoes[indice].nome;
        
        // Verificar se há itens usando esta coleção
        const itensComColecao = dadosMuseu.itens.filter(item => item.colecao === nomeColecao);
        if (itensComColecao.length > 0) {
            return res.status(400).json({ 
                erro: `Não é possível apagar a coleção. Existem ${itensComColecao.length} item(ns) associado(s) a esta coleção.` 
            });
        }
        
        dadosMuseu.colecoes.splice(indice, 1);
        guardarDados();
        
        res.json({ mensagem: 'Coleção apagada com sucesso' });
    } catch (error) {
        res.status(500).json({ erro: 'Erro ao apagar coleção' });
    }
});

// ============================================================
// INTEGRACAO COM API PUBLICA (Metropolitan Museum of Art)
// ============================================================
app.get('/api/arte-publica', (req, res) => {
    try {
        // Base URL da API do Metropolitan Museum of Art
        const baseUrl = 'https://collectionapi.metmuseum.org/public/collection/v1';
        
        // Primeiro, fazer uma busca para obter objectIDs
        const searchUrl = `${baseUrl}/search?q=*&hasImages=true`;
        
        // Primeiro passo: pesquisar objectIDs que tenham imagens.
        https.get(searchUrl, (searchResponse) => {
            let searchData = '';
            
            searchResponse.on('data', (chunk) => {
                searchData += chunk;
            });
            
            searchResponse.on('end', () => {
                try {
                    const searchResult = JSON.parse(searchData);
                    
                    // Pegar alguns objectIDs (primeiros 10) para não sobrecarregar.
                    const objectIDs = searchResult.objectIDs ? searchResult.objectIDs.slice(0, 10) : [];
                    
                    if (objectIDs.length === 0) {
                        return res.json([]);
                    }
                    
                    // Buscar detalhes de cada objeto.
                    // Para cada ID:
                    // - SE conseguirmos obter e processar o JSON ENTÃO transformamos
                    //   num objeto mais simples (id, titulo, artista, data, imagem).
                    // - SE der algum erro específico nesse ID ENTÃO apenas fazemos
                    //   resolve(null) para o ignorar mais tarde.
                    const promises = objectIDs.map(objectID => {
                        return new Promise((resolve, reject) => {
                            const objectUrl = `${baseUrl}/objects/${objectID}`;
                            
                            https.get(objectUrl, (objectResponse) => {
                                let objectData = '';
                                
                                objectResponse.on('data', (chunk) => {
                                    objectData += chunk;
                                });
                                
                                objectResponse.on('end', () => {
                                    try {
                                        const objeto = JSON.parse(objectData);
                                        
                                        // Transformar dados para formato compatível
                                        resolve({
                                            id: objeto.objectID,
                                            titulo: objeto.title || 'Sem título',
                                            artista: objeto.artistDisplayName || objeto.artistAlphaSort || 'Artista desconhecido',
                                            data: objeto.objectDate || objeto.objectBeginDate || 'Data desconhecida',
                                            imagem: objeto.primaryImage || objeto.primaryImageSmall || null
                                        });
                                    } catch (error) {
                                        console.error(`Erro ao processar objeto ${objectID}:`, error);
                                        resolve(null);
                                    }
                                });
                            }).on('error', (error) => {
                                console.error(`Erro ao buscar objeto ${objectID}:`, error);
                                resolve(null);
                            });
                        });
                    });
                    
                    // Esperar todas as promessas e filtrar nulos
                    Promise.all(promises).then(obrasArte => {
                        const obrasFiltradas = obrasArte.filter(obra => obra !== null && obra.imagem !== null);
                        
                        if (obrasFiltradas.length === 0) {
                            console.log('Nenhuma obra com imagem encontrada');
                            return res.json([]);
                        }
                        
                        res.json(obrasFiltradas);
                    }).catch(error => {
                        console.error('Erro ao processar objetos:', error);
                        res.status(500).json({ erro: 'Erro ao processar dados da API pública' });
                    });
                    
                } catch (error) {
                    console.error('Erro ao processar busca:', error);
                    res.status(500).json({ erro: 'Erro ao processar dados da API pública' });
                }
            });
        }).on('error', (error) => {
            console.error('Erro ao buscar API pública:', error);
            res.status(500).json({ erro: 'Erro ao buscar dados da API pública' });
        });
    } catch (error) {
        console.error('Erro ao buscar API pública:', error);
        res.status(500).json({ erro: 'Erro ao buscar dados da API pública' });
    }
});

// Pequeno helper para fazer GET de um URL HTTPS e devolver JSON
function httpsGetJson(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (resp) => {
            let data = '';
            resp.on('data', (chunk) => data += chunk);
            resp.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (err) {
                    reject(err);
                }
            });
        }).on('error', (err) => reject(err));
    });
}

// Retorna lista de artistas únicos (a partir dos objectIDs pesquisados)
app.get('/api/arte-publica/artistas', async (req, res) => {
    try {
        const baseUrl = 'https://collectionapi.metmuseum.org/public/collection/v1';
        const searchUrl = `${baseUrl}/search?q=*&hasImages=true`;

        const searchResult = await httpsGetJson(searchUrl);
        const objectIDs = searchResult.objectIDs ? searchResult.objectIDs.slice(0, 500) : [];

        const promises = objectIDs.map(id => httpsGetJson(`${baseUrl}/objects/${id}`).catch(() => null));
        const objetos = await Promise.all(promises);

        const artistasSet = new Set();
        objetos.forEach(obj => {
            if (!obj) return;
            const nome = (obj.artistDisplayName || obj.artistAlphaSort || '').trim();
            if (nome) artistasSet.add(nome);
        });

        const artistas = Array.from(artistasSet).sort((a, b) => a.localeCompare(b));
        res.json(artistas);
    } catch (error) {
        console.error('Erro ao carregar artistas da API pública:', error);
        res.status(500).json({ erro: 'Erro ao carregar artistas da API pública' });
    }
});

// Retorna até 6 obras de um artista especificado via query string ?artist=Nome+do+Artista
app.get('/api/arte-publica/por-artista', async (req, res) => {
    try {
        const artistQuery = req.query.artist;
        if (!artistQuery) return res.json([]);
        const baseUrl = 'https://collectionapi.metmuseum.org/public/collection/v1';

        // Usar o endpoint de search filtrando por artista/cultura para obter objectIDs relevantes
        const searchUrl = `${baseUrl}/search?artistOrCulture=true&hasImages=true&q=${encodeURIComponent(artistQuery)}`;
        
        let searchResult;
        try {
            searchResult = await httpsGetJson(searchUrl);
        } catch (err) {
            console.error('Erro ao buscar no Met Museum:', err.message);
            return res.json([]);
        }
        
        const objectIDs = searchResult.objectIDs ? searchResult.objectIDs.slice(0, 100) : [];

        const obras = [];
        for (const id of objectIDs) {
            if (obras.length >= 6) break;
            try {
                const obj = await httpsGetJson(`${baseUrl}/objects/${id}`);
                if (!obj) continue;
                const imagem = obj.primaryImageSmall || obj.primaryImage || null;
                obras.push({
                    id: obj.objectID,
                    titulo: obj.title || 'Sem título',
                    artista: (obj.artistDisplayName || obj.artistAlphaSort || 'Artista desconhecido'),
                    data: obj.objectDate || obj.objectBeginDate || 'Data desconhecida',
                    imagem: imagem
                });
            } catch (err) {
                // ignorar erro e continuar
            }
        }

        res.json(obras);
    } catch (error) {
        console.error('Erro ao buscar obras por artista:', error);
        res.json([]);
    }
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`API a correr em http://localhost:${PORT}`);
});
