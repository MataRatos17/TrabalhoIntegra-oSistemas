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
 * Valida e corrige URL de imagem
 */
function validarUrlImagem(url) {
    if (!url || url.trim() === '') {
        return null;
    }
    
    // Se for URL do Pinterest, tentar converter
    if (url.includes('pinterest.com') || url.includes('pinimg.com')) {
        // URLs do Pinterest precisam ser convertidas para URLs diretas
        // Exemplo: https://i.pinimg.com/originals/.../imagem.jpg
        if (url.includes('pinimg.com')) {
            // Já é uma URL direta do Pinterest
            return url;
        } else {
            // É uma página do Pinterest, não uma imagem direta
            return null; // Não podemos usar páginas HTML como imagens
        }
    }
    
    // Verificar se é uma URL válida
    try {
        const urlObj = new URL(url);
        // Verificar se termina com extensão de imagem ou é um serviço de imagem conhecido
        const extensoesImagem = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
        const temExtensao = extensoesImagem.some(ext => urlObj.pathname.toLowerCase().endsWith(ext));
        const servicosImagem = ['imgur.com', 'i.imgur.com', 'unsplash.com', 'images.unsplash.com', 
                               'pexels.com', 'images.pexels.com', 'via.placeholder.com', 'placehold.it',
                               'pinimg.com', 'cloudinary.com', 'imgbb.com'];
        const eServicoImagem = servicosImagem.some(servico => urlObj.hostname.includes(servico));
        
        if (temExtensao || eServicoImagem) {
            return url;
        }
    } catch (e) {
        // URL inválida
        return null;
    }
    
    return url;
}

/**
 * Cria um card para exibir um item
 */
function criarCardItem(item) {
    const card = document.createElement('div');
    card.className = 'item-card';
    
    const urlImagem = validarUrlImagem(item.foto);
    const imagemHtml = urlImagem 
        ? `<img src="${urlImagem}" alt="${item.titulo}" loading="lazy" onerror="this.onerror=null; this.src='data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'400\' height=\'300\'%3E%3Crect fill=\'%23ddd\' width=\'400\' height=\'300\'/%3E%3Ctext x=\'50%25\' y=\'50%25\' text-anchor=\'middle\' dy=\'.3em\' fill=\'%23999\' font-family=\'Arial\' font-size=\'16\'%3ESem Imagem%3C/text%3E%3C/svg%3E'; this.parentElement.classList.add('sem-imagem');">`
        : `<div class="sem-imagem-placeholder"><span></span><p>Sem imagem</p></div>`;
    
    card.innerHTML = `
        ${imagemHtml}
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
            ? `<img src="${obra.imagem}" alt="${obra.titulo}" loading="lazy" onerror="this.onerror=null; this.parentElement.innerHTML='<div style=\\'height: 200px; background: #ddd; display: flex; align-items: center; justify-content: center; color: #999;\\'>Sem imagem</div>'">`
            : '<div style="height: 200px; background: #ddd; display: flex; align-items: center; justify-content: center; color: #999;">Sem imagem</div>';
        
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
