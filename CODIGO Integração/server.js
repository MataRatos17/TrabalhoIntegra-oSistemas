const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const https = require('https');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Carregar dados iniciais do ficheiro JSON
let dadosMuseu = null;

function carregarDados() {
    try {
        const dadosJson = fs.readFileSync(path.join(__dirname, 'data', 'museu.json'), 'utf8');
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
            path.join(__dirname, 'data', 'museu.json'),
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
        novoItem.foto = novoItem.foto || 'https://via.placeholder.com/400x300?text=Novo+Item';
        
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

// Endpoint para integrar API pública (exemplo: API de arte)
app.get('/api/arte-publica', (req, res) => {
    try {
        // Integração com API pública de arte (exemplo: Art Institute of Chicago API)
        const url = 'https://api.artic.edu/api/v1/artworks?limit=5';
        
        https.get(url, (response) => {
            let dados = '';
            
            response.on('data', (chunk) => {
                dados += chunk;
            });
            
            response.on('end', () => {
                try {
                    const data = JSON.parse(dados);
                    
                    // Transformar dados para formato compatível
                    const obrasArte = data.data.map(obra => ({
                        id: obra.id,
                        titulo: obra.title,
                        artista: obra.artist_title || 'Artista desconhecido',
                        data: obra.date_display,
                        imagem: obra.image_id 
                            ? `https://www.artic.edu/iiif/2/${obra.image_id}/full/843,/0/default.jpg`
                            : null
                    }));
                    
                    res.json(obrasArte);
                } catch (error) {
                    console.error('Erro ao processar dados da API:', error);
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
    console.log(`Servidor a correr em http://localhost:${PORT}`);
});
