const API_URL = 'http://localhost:3000/api';

// Carregar dados ao iniciar a página
document.addEventListener('DOMContentLoaded', () => {
    carregarColecoes();
    carregarItens();
    carregarListaColecoes();
    configurarFormularios();
});

/**
 * Carrega as coleções para o select do formulário
 */
async function carregarColecoes() {
    try {
        const resposta = await fetch(`${API_URL}/colecoes`);
        const colecoes = await resposta.json();
        
        const selectColecao = document.getElementById('colecao');
        selectColecao.innerHTML = '<option value="">Selecione...</option>';
        
        colecoes.forEach(colecao => {
            const option = document.createElement('option');
            option.value = colecao.nome;
            option.textContent = colecao.nome;
            selectColecao.appendChild(option);
        });
    } catch (erro) {
        console.error('Erro ao carregar coleções:', erro);
        mostrarMensagem('Erro ao carregar coleções', 'erro');
    }
}

/**
 * Carrega todos os itens para exibir na lista
 */
async function carregarItens() {
    try {
        const resposta = await fetch(`${API_URL}/itens`);
        const itens = await resposta.json();
        
        exibirItensAdmin(itens);
    } catch (erro) {
        console.error('Erro ao carregar itens:', erro);
        mostrarMensagem('Erro ao carregar itens', 'erro');
    }
}

/**
 * Configura os event listeners dos formulários
 */
function configurarFormularios() {
    const formItem = document.getElementById('form-adicionar-item');
    const formColecao = document.getElementById('form-criar-colecao');
    
    formItem.addEventListener('submit', async (e) => {
        e.preventDefault();
        await adicionarItem();
    });
    
    formColecao.addEventListener('submit', async (e) => {
        e.preventDefault();
        await criarColecao();
    });
}

/**
 * Adiciona um novo item ao museu
 */
async function adicionarItem() {
    try {
        const urlFoto = document.getElementById('foto').value.trim();
        const urlValidada = validarUrlImagem(urlFoto);
        
        if (urlFoto && !urlValidada) {
            mostrarMensagem(' URL de imagem inválida. Use URLs diretas de imagens (não páginas do Pinterest). Veja as instruções abaixo.', 'erro');
            return;
        }
        
        const formData = {
            titulo: document.getElementById('titulo').value,
            descricao: document.getElementById('descricao').value,
            categoria: document.getElementById('categoria').value,
            ano: parseInt(document.getElementById('ano').value),
            foto: urlValidada || undefined,
            colecao: document.getElementById('colecao').value
        };
        
        const resposta = await fetch(`${API_URL}/itens`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        if (resposta.ok) {
            const novoItem = await resposta.json();
            mostrarMensagem('Item adicionado com sucesso!', 'sucesso');
            document.getElementById('form-adicionar-item').reset();
            carregarItens();
            carregarColecoes(); // Recarregar para incluir nova coleção se necessário
        } else {
            const erro = await resposta.json();
            mostrarMensagem(erro.erro || 'Erro ao adicionar item', 'erro');
        }
    } catch (erro) {
        console.error('Erro ao adicionar item:', erro);
        mostrarMensagem('Erro ao adicionar item', 'erro');
    }
}

/**
 * Cria uma nova coleção
 */
async function criarColecao() {
    try {
        const formData = {
            nome: document.getElementById('nome-colecao').value,
            descricao: document.getElementById('descricao-colecao').value,
            cor: document.getElementById('cor-colecao').value
        };
        
        const resposta = await fetch(`${API_URL}/colecoes`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        if (resposta.ok) {
            const novaColecao = await resposta.json();
            mostrarMensagem('Coleção criada com sucesso!', 'sucesso');
            document.getElementById('form-criar-colecao').reset();
            carregarColecoes();
            carregarListaColecoes();
        } else {
            const erro = await resposta.json();
            mostrarMensagem(erro.erro || 'Erro ao criar coleção', 'erro');
        }
    } catch (erro) {
        console.error('Erro ao criar coleção:', erro);
        mostrarMensagem('Erro ao criar coleção', 'erro');
    }
}

/**
 * Exibe os itens na área de administração
 */
function exibirItensAdmin(itens) {
    const container = document.getElementById('lista-itens-admin');
    container.innerHTML = '';
    
    if (itens.length === 0) {
        container.innerHTML = '<p>Nenhum item adicionado ainda.</p>';
        return;
    }
    
    // Ordenar por ID (mais recentes primeiro)
    itens.sort((a, b) => b.id - a.id);
    
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
        if (url.includes('pinimg.com')) {
            // Já é uma URL direta do Pinterest
            return url;
        } else {
            // É uma página do Pinterest, não uma imagem direta
            return null;
        }
    }
    
    // Verificar se é uma URL válida
    try {
        const urlObj = new URL(url);
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
        return null;
    }
    
    return url;
}

/**
 * Carrega todas as coleções para exibir na lista
 */
async function carregarListaColecoes() {
    try {
        const resposta = await fetch(`${API_URL}/colecoes`);
        const colecoes = await resposta.json();
        
        exibirColecoesAdmin(colecoes);
    } catch (erro) {
        console.error('Erro ao carregar coleções:', erro);
        mostrarMensagem('Erro ao carregar coleções', 'erro');
    }
}

/**
 * Exibe as coleções na área de administração
 */
function exibirColecoesAdmin(colecoes) {
    const container = document.getElementById('lista-colecoes-admin');
    if (!container) return; // Se não existir o elemento, sair
    
    container.innerHTML = '';
    
    if (colecoes.length === 0) {
        container.innerHTML = '<p>Nenhuma coleção criada ainda.</p>';
        return;
    }
    
    colecoes.forEach(colecao => {
        const card = criarCardColecao(colecao);
        container.appendChild(card);
    });
}

/**
 * Cria um card para exibir uma coleção na área admin
 */
function criarCardColecao(colecao) {
    const card = document.createElement('div');
    card.className = 'colecao-card';
    card.style.borderLeft = `4px solid ${colecao.cor}`;
    
    // Escapar aspas no nome para evitar problemas no onclick
    const nomeEscapado = colecao.nome.replace(/'/g, "\\'").replace(/"/g, '&quot;');
    
    card.innerHTML = `
        <div class="conteudo">
            <h3>${colecao.nome}</h3>
            <p class="descricao">${colecao.descricao}</p>
            <div class="acoes">
                <button class="btn-apagar" onclick="apagarColecao(${colecao.id}, '${nomeEscapado}')" title="Apagar coleção">
                     Apagar
                </button>
            </div>
        </div>
    `;
    
    return card;
}

/**
 * Cria um card para exibir um item na área admin
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
            <p class="ano">ID: ${item.id} | Ano: ${item.ano} | Coleção: ${item.colecao}</p>
            <div class="acoes">
                <button class="btn-apagar" onclick="apagarItem(${item.id}, '${item.titulo.replace(/'/g, "\\'").replace(/"/g, '&quot;')}')" title="Apagar item">
                    Apagar
                </button>
            </div>
        </div>
    `;
    
    return card;
}

/**
 * Apaga um item
 */
window.apagarItem = async function(id, titulo) {
    if (!confirm(`Tem certeza que deseja apagar o item "${titulo}"?\n\nEsta ação não pode ser desfeita.`)) {
        return;
    }
    
    try {
        const resposta = await fetch(`${API_URL}/itens/${id}`, {
            method: 'DELETE'
        });
        
        if (resposta.ok) {
            mostrarMensagem('Item apagado com sucesso!', 'sucesso');
            carregarItens();
        } else {
            const erro = await resposta.json();
            mostrarMensagem(erro.erro || 'Erro ao apagar item', 'erro');
        }
    } catch (erro) {
        console.error('Erro ao apagar item:', erro);
        mostrarMensagem('Erro ao apagar item', 'erro');
    }
}

/**
 * Apaga uma coleção
 */
window.apagarColecao = async function(id, nome) {
    if (!confirm(`Tem certeza que deseja apagar a coleção "${nome}"?\n\nNota: Só é possível apagar coleções que não tenham itens associados.\n\nEsta ação não pode ser desfeita.`)) {
        return;
    }
    
    try {
        const resposta = await fetch(`${API_URL}/colecoes/${id}`, {
            method: 'DELETE'
        });
        
        if (resposta.ok) {
            mostrarMensagem('Coleção apagada com sucesso!', 'sucesso');
            carregarListaColecoes();
            carregarColecoes(); // Recarregar select do formulário
        } else {
            const erro = await resposta.json();
            mostrarMensagem(erro.erro || 'Erro ao apagar coleção', 'erro');
        }
    } catch (erro) {
        console.error('Erro ao apagar coleção:', erro);
        mostrarMensagem('Erro ao apagar coleção', 'erro');
    }
}

/**
 * Mostra uma mensagem de feedback ao utilizador
 */
function mostrarMensagem(texto, tipo) {
    // Remover mensagens anteriores
    const mensagensAntigas = document.querySelectorAll('.mensagem');
    mensagensAntigas.forEach(msg => msg.remove());
    
    const mensagem = document.createElement('div');
    mensagem.className = `mensagem ${tipo}`;
    mensagem.textContent = texto;
    
    const main = document.querySelector('main');
    main.insertBefore(mensagem, main.firstChild);
    
    setTimeout(() => {
        mensagem.remove();
    }, 5000);
}
