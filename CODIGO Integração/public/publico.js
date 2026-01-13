const API_URL = 'http://localhost:3000/api';

// Carregar itens e coleções ao iniciar a página
document.addEventListener('DOMContentLoaded', () => {
    carregarColecoes();
    carregarItens();
    carregarObrasArtePublica();
});

/**
 * Carrega todas as coleções e cria os botões de filtro
 */
async function carregarColecoes() {
    try {
        const resposta = await fetch(`${API_URL}/colecoes`);
        const colecoes = await resposta.json();
        
        const containerFiltros = document.getElementById('filtros-colecoes');
        
        colecoes.forEach(colecao => {
            const botao = document.createElement('button');
            botao.className = 'filtro-btn';
            botao.textContent = colecao.nome;
            botao.dataset.colecao = colecao.nome;
            botao.style.borderColor = colecao.cor;
            botao.style.color = colecao.cor;
            
            botao.addEventListener('click', () => {
                // Remover classe active de todos os botões
                document.querySelectorAll('.filtro-btn').forEach(btn => {
                    btn.classList.remove('active');
                });
                
                // Adicionar classe active ao botão clicado
                botao.classList.add('active');
                
                // Filtrar itens
                if (colecao.nome === 'todas') {
                    carregarItens();
                } else {
                    filtrarPorColecao(colecao.nome);
                }
            });
            
            containerFiltros.appendChild(botao);
        });
    } catch (erro) {
        console.error('Erro ao carregar coleções:', erro);
        mostrarMensagem('Erro ao carregar coleções', 'erro');
    }
}

/**
 * Carrega todos os itens do museu
 */
async function carregarItens(colecao = null) {
    try {
        let url = `${API_URL}/itens`;
        if (colecao) {
            url = `${API_URL}/colecoes/${colecao}/itens`;
        }
        
        const resposta = await fetch(url);
        const itens = await resposta.json();
        
        exibirItens(itens);
    } catch (erro) {
        console.error('Erro ao carregar itens:', erro);
        mostrarMensagem('Erro ao carregar itens', 'erro');
    }
}

/**
 * Filtra itens por coleção
 */
function filtrarPorColecao(nomeColecao) {
    carregarItens(nomeColecao);
}

/**
 * Exibe os itens na galeria
 */
function exibirItens(itens) {
    const container = document.getElementById('itens-container');
    container.innerHTML = '';
    
    if (itens.length === 0) {
        container.innerHTML = '<p>Nenhum item encontrado.</p>';
        return;
    }
    
    itens.forEach(item => {
        const card = criarCardItem(item);
        container.appendChild(card);
    });
}

/**
 * Cria um card para exibir um item
 */
function criarCardItem(item) {
    const card = document.createElement('div');
    card.className = 'item-card';
    
    card.innerHTML = `
        <img src="${item.foto}" alt="${item.titulo}" onerror="this.src='https://via.placeholder.com/400x300?text=Sem+Imagem'">
        <div class="conteudo">
            <h3>${item.titulo}</h3>
            <span class="categoria">${item.categoria}</span>
            <p class="descricao">${item.descricao}</p>
            <p class="ano">Ano: ${item.ano} | Coleção: ${item.colecao}</p>
        </div>
    `;
    
    return card;
}

/**
 * Carrega obras de arte da API pública
 */
async function carregarObrasArtePublica() {
    try {
        const resposta = await fetch(`${API_URL}/arte-publica`);
        const obras = await resposta.json();
        
        exibirObrasArte(obras);
    } catch (erro) {
        console.error('Erro ao carregar obras de arte:', erro);
        const container = document.getElementById('obras-arte-container');
        container.innerHTML = '<p>Erro ao carregar obras de arte da API pública.</p>';
    }
}

/**
 * Exibe as obras de arte da API pública
 */
function exibirObrasArte(obras) {
    const container = document.getElementById('obras-arte-container');
    container.innerHTML = '';
    
    if (obras.length === 0) {
        container.innerHTML = '<p>Nenhuma obra encontrada.</p>';
        return;
    }
    
    obras.forEach(obra => {
        const card = document.createElement('div');
        card.className = 'obra-card';
        
        const imagem = obra.imagem 
            ? `<img src="${obra.imagem}" alt="${obra.titulo}" onerror="this.style.display='none'">`
            : '<div style="height: 200px; background: #ddd; display: flex; align-items: center; justify-content: center;">Sem imagem</div>';
        
        card.innerHTML = `
            ${imagem}
            <div class="conteudo">
                <h3>${obra.titulo}</h3>
                <span class="artista">${obra.artista}</span>
                <p class="data">${obra.data || 'Data não disponível'}</p>
            </div>
        `;
        
        container.appendChild(card);
    });
}

/**
 * Mostra uma mensagem de feedback ao utilizador
 */
function mostrarMensagem(texto, tipo) {
    const mensagem = document.createElement('div');
    mensagem.className = `mensagem ${tipo}`;
    mensagem.textContent = texto;
    
    const main = document.querySelector('main');
    main.insertBefore(mensagem, main.firstChild);
    
    setTimeout(() => {
        mensagem.remove();
    }, 3000);
}
