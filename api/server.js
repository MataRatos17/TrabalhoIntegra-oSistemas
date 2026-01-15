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
// 2) Fazemos trim a TODAS as strings para evitar espaços em branco.
// 3) Validamos que TODOS os campos obrigatórios (titulo, descricao, categoria, colecao, foto, ano,
//    contexto_cultural, periodo_historico, material, dimensao) estão preenchidos e não vazios.
// 4) SE algum campo obrigatório ficar vazio ENTÃO devolvemos 400 com mensagem específica de erro.
// 5) SE estiver tudo preenchido ENTÃO geramos um novo ID, adicionamos o item ao array,
//    guardamos no ficheiro e devolvemos 201 com o item.
app.post('/api/itens', (req, res) => {
    try {
        const novoItem = req.body;

        // Normalizar (trim) TODAS as strings
        novoItem.titulo = (novoItem.titulo || '').trim();
        novoItem.descricao = (novoItem.descricao || '').trim();
        novoItem.categoria = (novoItem.categoria || '').trim();
        novoItem.colecao = (novoItem.colecao || '').trim();
        novoItem.foto = (novoItem.foto || '').trim();
        novoItem.ano = String(novoItem.ano || '').trim();
        novoItem.contexto_cultural = (novoItem.contexto_cultural || '').trim();
        novoItem.periodo_historico = (novoItem.periodo_historico || '').trim();
        novoItem.material = (novoItem.material || '').trim();
        novoItem.dimensao = (novoItem.dimensao || '').trim();
        
        // Validar TODOS os dados obrigatórios (não permitir strings vazias)
        const camposVazios = [];
        
        if (!novoItem.titulo) camposVazios.push('título');
        if (!novoItem.descricao) camposVazios.push('descrição');
        if (!novoItem.categoria) camposVazios.push('categoria');
        if (!novoItem.colecao) camposVazios.push('coleção');
        if (!novoItem.foto) camposVazios.push('foto');
        if (!novoItem.ano) camposVazios.push('ano');
        if (!novoItem.contexto_cultural) camposVazios.push('contexto cultural');
        if (!novoItem.periodo_historico) camposVazios.push('período histórico');
        if (!novoItem.material) camposVazios.push('material');
        if (!novoItem.dimensao) camposVazios.push('dimensão');
        
        if (camposVazios.length > 0) {
            return res.status(400).json({ 
                erro: `Dados incompletos. Os seguintes campos são obrigatórios: ${camposVazios.join(', ')}.` 
            });
        }
        
        // Validar ano como número
        const anoNum = parseInt(novoItem.ano);
        if (isNaN(anoNum) || anoNum < 0 || anoNum > new Date().getFullYear()) {
            return res.status(400).json({ erro: 'Ano deve ser um número válido entre 0 e o ano atual.' });
        }
        
        // Gerar novo ID
        const novoId = dadosMuseu.itens.length > 0 
            ? Math.max(...dadosMuseu.itens.map(i => i.id)) + 1 
            : 1;
        
        novoItem.id = novoId;
        novoItem.ano = anoNum;
        
        dadosMuseu.itens.push(novoItem);
        guardarDados();
        
        res.status(201).json(novoItem);
    } catch (error) {
        res.status(500).json({ erro: 'Erro ao adicionar item' });
    }
});

// Criar nova coleção (usado na área de administração)
// FLUXO PRINCIPAL:
// 1) Lemos o corpo do pedido e fazemos trim a TODAS as strings.
// 2) Validamos que TODOS os campos obrigatórios (nome, descrição, cor) estão preenchidos.
// 3) SE algum campo obrigatório ficar vazio ENTÃO devolvemos 400 com mensagem específica.
// 4) Verificamos SE já existe coleção com o mesmo nome; se existir devolvemos 400.
// 5) SE tudo estiver correto ENTÃO geramos um novo ID, guardamos no array
//    e persistimos no ficheiro, devolvendo 201 com a coleção criada.
app.post('/api/colecoes', (req, res) => {
    try {
        const novaColecao = req.body;

        // Normalizar (trim) TODAS as strings
        novaColecao.nome = (novaColecao.nome || '').trim();
        novaColecao.descricao = (novaColecao.descricao || '').trim();
        novaColecao.cor = (novaColecao.cor || '').trim();
        
        // Validar TODOS os dados obrigatórios (não permitir strings vazias)
        const camposVazios = [];
        
        if (!novaColecao.nome) camposVazios.push('nome');
        if (!novaColecao.descricao) camposVazios.push('descrição');
        if (!novaColecao.cor) camposVazios.push('cor');
        
        if (camposVazios.length > 0) {
            return res.status(400).json({ 
                erro: `Dados incompletos. Os seguintes campos são obrigatórios: ${camposVazios.join(', ')}.` 
            });
        }
        
        // Validar formato da cor (hex color)
        if (!/^#[0-9A-Fa-f]{6}$/.test(novaColecao.cor)) {
            return res.status(400).json({ erro: 'Cor deve ser um valor hexadecimal válido (ex: #FF0000).' });
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
// 2) Fazemos trim a TODAS as strings vindas do body.
// 3) Validamos que TODOS os campos obrigatórios estão preenchidos e não vazios.
// 4) SE algum campo obrigatório ficar vazio ENTÃO devolvemos 400 com mensagem específica.
// 5) SE estiver tudo válido ENTÃO mantemos o id original, substituímos o objeto no array
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

        // Normalizar (trim) TODAS as strings
        itemAtualizado.titulo = (itemAtualizado.titulo || '').trim();
        itemAtualizado.descricao = (itemAtualizado.descricao || '').trim();
        itemAtualizado.categoria = (itemAtualizado.categoria || '').trim();
        itemAtualizado.colecao = (itemAtualizado.colecao || '').trim();
        itemAtualizado.foto = (itemAtualizado.foto || '').trim();
        itemAtualizado.ano = String(itemAtualizado.ano || '').trim();
        itemAtualizado.contexto_cultural = (itemAtualizado.contexto_cultural || '').trim();
        itemAtualizado.periodo_historico = (itemAtualizado.periodo_historico || '').trim();
        itemAtualizado.material = (itemAtualizado.material || '').trim();
        itemAtualizado.dimensao = (itemAtualizado.dimensao || '').trim();
        
        // Validar TODOS os dados obrigatórios
        const camposVazios = [];
        
        if (!itemAtualizado.titulo) camposVazios.push('título');
        if (!itemAtualizado.descricao) camposVazios.push('descrição');
        if (!itemAtualizado.categoria) camposVazios.push('categoria');
        if (!itemAtualizado.colecao) camposVazios.push('coleção');
        if (!itemAtualizado.foto) camposVazios.push('foto');
        if (!itemAtualizado.ano) camposVazios.push('ano');
        if (!itemAtualizado.contexto_cultural) camposVazios.push('contexto cultural');
        if (!itemAtualizado.periodo_historico) camposVazios.push('período histórico');
        if (!itemAtualizado.material) camposVazios.push('material');
        if (!itemAtualizado.dimensao) camposVazios.push('dimensão');
        
        if (camposVazios.length > 0) {
            return res.status(400).json({ 
                erro: `Dados incompletos. Os seguintes campos são obrigatórios: ${camposVazios.join(', ')}.` 
            });
        }
        
        // Validar ano como número
        const anoNum = parseInt(itemAtualizado.ano);
        if (isNaN(anoNum) || anoNum < 0 || anoNum > new Date().getFullYear()) {
            return res.status(400).json({ erro: 'Ano deve ser um número válido entre 0 e o ano atual.' });
        }
        
        // Manter o ID original
        itemAtualizado.id = id;
        itemAtualizado.ano = anoNum;
        
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
// 2) Fazemos trim a TODAS as strings recebidas.
// 3) Validamos que TODOS os campos obrigatórios estão preenchidos e não vazios.
// 4) SE algum campo obrigatório ficar vazio ENTÃO devolvemos 400 com mensagem específica.
// 5) Caso contrário, mantemos o id, atualizamos o array, gravamos no ficheiro
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

        // Normalizar (trim) TODAS as strings
        colecaoAtualizada.nome = (colecaoAtualizada.nome || '').trim();
        colecaoAtualizada.descricao = (colecaoAtualizada.descricao || '').trim();
        colecaoAtualizada.cor = (colecaoAtualizada.cor || '').trim();
        
        // Validar TODOS os dados obrigatórios
        const camposVazios = [];
        
        if (!colecaoAtualizada.nome) camposVazios.push('nome');
        if (!colecaoAtualizada.descricao) camposVazios.push('descrição');
        if (!colecaoAtualizada.cor) camposVazios.push('cor');
        
        if (camposVazios.length > 0) {
            return res.status(400).json({ 
                erro: `Dados incompletos. Os seguintes campos são obrigatórios: ${camposVazios.join(', ')}.` 
            });
        }
        
        // Validar formato da cor (hex color)
        if (!/^#[0-9A-Fa-f]{6}$/.test(colecaoAtualizada.cor)) {
            return res.status(400).json({ erro: 'Cor deve ser um valor hexadecimal válido (ex: #FF0000).' });
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
// Cache para artistas (para evitar fazer as mesmas requisições)
let cacheArtistas = null;
let cacheArtistasTimestamp = 0;
const CACHE_DURATION = 3600000; // 1 hora em ms

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

// Retorna lista de artistas únicos (usando search com artistOrCulture)
app.get('/api/arte-publica/artistas', async (req, res) => {
    try {
        // Verificar se temos cache válido
        const agora = Date.now();
        if (cacheArtistas && (agora - cacheArtistasTimestamp) < CACHE_DURATION) {
            console.log('Retornando artistas do cache');
            return res.json(cacheArtistas);
        }

        console.log('Buscando artistas da API do Met Museum...');
        const baseUrl = 'https://collectionapi.metmuseum.org/public/collection/v1';
        
        // Buscar com artistOrCulture=true (do docs oficial da API)
        const searchUrl = `${baseUrl}/search?hasImages=true&artistOrCulture=true&q=artist`;
        const searchResult = await Promise.race([
            httpsGetJson(searchUrl),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
        ]);
        
        const objectIDs = searchResult.objectIDs ? searchResult.objectIDs.slice(0, 40) : [];
        console.log(`Encontrados ${objectIDs.length} objetos com artistOrCulture`);

        // Buscar detalhes dos objetos
        const promises = objectIDs.map(id => 
            httpsGetJson(`${baseUrl}/objects/${id}`)
                .catch(err => null)
        );
        
        const objetos = await Promise.all(promises);

        const artistasMap = new Map();
        objetos.forEach(obj => {
            if (!obj) return;
            const nome = (obj.artistDisplayName || obj.artistAlphaSort || '').trim();
            if (nome && !artistasMap.has(nome)) {
                artistasMap.set(nome, {
                    id: Buffer.from(nome).toString('base64'),
                    nome: nome
                });
            }
        });

        // Filtrar artistas que realmente têm obras
        const artistasParaValidar = Array.from(artistasMap.values());
        console.log(`Validando ${artistasParaValidar.length} artistas para ver se têm obras...`);
        
        const artistasComObras = [];
        
        for (const artista of artistasParaValidar) {
            try {
                // Decodificar nome do artista
                const nomeArtista = Buffer.from(artista.id, 'base64').toString('utf-8');
                
                // Buscar obras deste artista
                const obraSearchUrl = `${baseUrl}/search?artistOrCulture=true&hasImages=true&q=${encodeURIComponent(nomeArtista)}`;
                const obraSearchResult = await Promise.race([
                    httpsGetJson(obraSearchUrl),
                    new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 3000))
                ]);
                
                const temObras = obraSearchResult.objectIDs && obraSearchResult.objectIDs.length > 0;
                
                if (temObras) {
                    artistasComObras.push(artista);
                    console.log(`✓ ${nomeArtista} tem ${obraSearchResult.objectIDs.length} obras`);
                } else {
                    console.log(`✗ ${nomeArtista} não tem obras`);
                }
            } catch (err) {
                console.log(`! Erro ao validar ${artista.nome}:`, err.message);
            }
        }
        
        const artistasFinais = artistasComObras
            .sort((a, b) => a.nome.localeCompare(b.nome))
            .slice(0, 50);
        
        // Guardar em cache
        cacheArtistas = artistasFinais;
        cacheArtistasTimestamp = agora;
        
        console.log(`Retornando ${artistasFinais.length} artistas com obras`);
        res.json(artistasFinais);
    } catch (error) {
        console.error('Erro ao carregar artistas da API pública:', error.message);
        // Se falhar, tentar retornar o cache antigo
        if (cacheArtistas) {
            console.log('Retornando cache antigo de artistas');
            return res.json(cacheArtistas);
        }
        res.status(500).json({ erro: 'Erro ao carregar artistas da API pública' });
    }
});

// Retorna até 10 obras de um artista usando seu ID
app.get('/api/arte-publica/artista/:artistId', async (req, res) => {
    try {
        const artistId = req.params.artistId;
        
        // Decodificar o ID para obter o nome do artista
        let artistNome;
        try {
            artistNome = Buffer.from(artistId, 'base64').toString('utf-8');
        } catch (err) {
            return res.status(400).json({ erro: 'ID de artista inválido' });
        }

        if (!artistNome) return res.json([]);
        
        const baseUrl = 'https://collectionapi.metmuseum.org/public/collection/v1';

        // Usar o endpoint de search com artistOrCulture=true conforme docs oficiais
        const searchUrl = `${baseUrl}/search?artistOrCulture=true&hasImages=true&q=${encodeURIComponent(artistNome)}`;
        
        let searchResult;
        try {
            searchResult = await Promise.race([
                httpsGetJson(searchUrl),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
            ]);
        } catch (err) {
            console.error('Erro ao buscar no Met Museum:', err.message);
            return res.json([]);
        }
        
        const objectIDs = searchResult.objectIDs ? searchResult.objectIDs.slice(0, 50) : [];
        console.log(`Artista '${artistNome}': ${objectIDs.length} objetos encontrados`);

        const obras = [];
        for (const id of objectIDs) {
            if (obras.length >= 10) break;
            try {
                const obj = await Promise.race([
                    httpsGetJson(`${baseUrl}/objects/${id}`),
                    new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 3000))
                ]);
                if (!obj) continue;
                const imagem = obj.primaryImageSmall || obj.primaryImage || null;
                if (!imagem) continue;
                
                // Extração inteligente de dados
                const contexto = obj.culture || obj.classification || 'Contexto não disponível';
                const periodo = obj.period || obj.objectBeginDate || obj.objectDate || 'Período não disponível';
                const colecao = obj.department || 'Coleção não disponível';
                const material = obj.medium || 'Material não disponível';
                const dimensao = obj.dimensions || 'Dimensão não disponível';
                
                obras.push({
                    id: obj.objectID,
                    titulo: obj.title || 'Sem título',
                    artista: (obj.artistDisplayName || obj.artistAlphaSort || 'Artista desconhecido'),
                    data: obj.objectDate || obj.objectBeginDate || 'Data desconhecida',
                    imagem: imagem,
                    contexto_cultural: contexto,
                    periodo_historico: String(periodo),
                    colecao: colecao,
                    material: material,
                    dimensao: dimensao
                });
            } catch (err) {
                console.error(`Erro ao buscar objeto ${id}:`, err.message);
                continue;
            }
        }

        console.log(`Retornando ${obras.length} obras para artista '${artistNome}'`);
        res.json(obras);
    } catch (error) {
        console.error('Erro ao buscar obras por ID de artista:', error.message);
        res.json([]);
    }
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`API a correr em http://localhost:${PORT}`);
});
