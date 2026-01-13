const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const https = require('https');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Rotas de saúde/boas-vindas
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

// Carregar dados iniciais do ficheiro JSON
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

// ========== ENDPOINTS PÚBLICOS ==========

// Obter todos os itens (página pública)
app.get('/api/itens', (req, res) => {
    try {
        res.json(dadosMuseu.itens);
    } catch (error) {
        res.status(500).json({ erro: 'Erro ao obter itens' });
    }
});

// Obter item por ID
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
app.get('/api/colecoes', (req, res) => {
    try {
        res.json(dadosMuseu.colecoes);
    } catch (error) {
        res.status(500).json({ erro: 'Erro ao obter coleções' });
    }
});

// Obter itens por coleção
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

// ========== ENDPOINTS PRIVADOS ==========

// Adicionar novo item
app.post('/api/itens', (req, res) => {
    try {
        const novoItem = req.body;
        
        // Validar dados obrigatórios
        if (!novoItem.titulo || !novoItem.descricao || !novoItem.categoria) {
            return res.status(400).json({ erro: 'Dados incompletos' });
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

// Criar nova coleção
app.post('/api/colecoes', (req, res) => {
    try {
        const novaColecao = req.body;
        
        // Validar dados obrigatórios
        if (!novaColecao.nome || !novaColecao.descricao) {
            return res.status(400).json({ erro: 'Dados incompletos' });
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

// ========== ENDPOINTS PARA APAGAR ==========

// Apagar item
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

// Apagar coleção
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

// Endpoint para integrar API pública (Metropolitan Museum of Art API)
app.get('/api/arte-publica', (req, res) => {
    try {
        // Base URL da API do Metropolitan Museum of Art
        const baseUrl = 'https://collectionapi.metmuseum.org/public/collection/v1';
        
        // Primeiro, fazer uma busca para obter objectIDs
        const searchUrl = `${baseUrl}/search?q=*&hasImages=true`;
        
        https.get(searchUrl, (searchResponse) => {
            let searchData = '';
            
            searchResponse.on('data', (chunk) => {
                searchData += chunk;
            });
            
            searchResponse.on('end', () => {
                try {
                    const searchResult = JSON.parse(searchData);
                    
                    // Pegar os primeiros 5 objectIDs
                    const objectIDs = searchResult.objectIDs ? searchResult.objectIDs.slice(0, 5) : [];
                    
                    if (objectIDs.length === 0) {
                        return res.json([]);
                    }
                    
                    // Buscar detalhes de cada objeto
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

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`API a correr em http://localhost:${PORT}`);
});
