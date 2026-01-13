const API_URL = 'http://localhost:3000/api';

// Carregar dados ao iniciar a página
document.addEventListener('DOMContentLoaded', () => {
    carregarColecoes();
    carregarItens();
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
        const formData = {
            titulo: document.getElementById('titulo').value,
            descricao: document.getElementById('descricao').value,
            categoria: document.getElementById('categoria').value,
            ano: parseInt(document.getElementById('ano').value),
            foto: document.getElementById('foto').value || undefined,
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
 * Cria um card para exibir um item na área admin
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
            <p class="ano">ID: ${item.id} | Ano: ${item.ano} | Coleção: ${item.colecao}</p>
        </div>
    `;
    
    return card;
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
