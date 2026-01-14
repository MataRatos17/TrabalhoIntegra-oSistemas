// =============================
// CONFIGURACAO DA AREA PRIVADA
// =============================
// Este ficheiro controla TUDO o que acontece na area de administracao
// (admin.html). A ideia geral do fluxo e:
// 1) Primeiro confirmar se o utilizador fez login com o Google
//    - Se NAO estiver autenticado, entao NAO pode ver a pagina admin
//      e e redirecionado imediatamente para login.html.
// 2) Se estiver autenticado, quando o DOM estiver pronto carregamos:
//    - As colecoes (para selects e listagens)
//    - Os itens existentes
//    - A lista de colecoes na parte de gestao
//    - Os handlers dos formularios (criar item, criar colecao, editar, etc.).
// 3) Tambem configuramos o botao de "Terminar sessao" para limpar o login.

// URL base da API Node (back-end) onde estão os endpoints /api/...
const API_URL = 'http://localhost:3000/api';

// Mesmas chaves usadas em login.js para guardar o login Google
// Se estas chaves nao existirem no localStorage, significa que o utilizador
// ainda nao fez login nesta sessao.
const STORAGE_TOKEN_KEY = 'google_token';
const STORAGE_USER_KEY = 'google_user';

// 1) Verificar se o utilizador está autenticado antes de carregar a página
// Se NAO existir token no localStorage:
//    -> significa que o utilizador nao fez login Google
//    -> entao NAO permitimos ver admin.html e redirecionamos para login.html
if (!localStorage.getItem(STORAGE_TOKEN_KEY)) {
    window.location.href = 'login.html';
}

// 2) Ao carregar o DOM, inicializamos a área de administração
//    (carrega coleções, itens, configura formulários e botão de logout)
document.addEventListener('DOMContentLoaded', () => {
    // Se o utilizador chegou aqui, e porque passou na verificacao do token
    // Entao podemos carregar os dados da API e preparar os formularios.
    carregarColecoes();          // Preenche o select de colecao do formulario
    carregarItens();             // Mostra a lista de itens ja existentes
    carregarListaColecoes();     // Lista as colecoes criadas na parte inferior
    configurarFormularios();     // Liga os eventos dos formularios (submit)

    // Configura o botão "Terminar sessão" no cabeçalho
    const btnLogout = document.getElementById('btn-logout');
    // Se o botão existir no HTML, então ligamos o evento de clique
    if (btnLogout) {
        btnLogout.addEventListener('click', () => {
            // Quando o utilizador clica em "Terminar sessão":
            // 1) Remove token e dados do utilizador do armazenamento local
            localStorage.removeItem(STORAGE_TOKEN_KEY);
            localStorage.removeItem(STORAGE_USER_KEY);
            // 2) Volta para a página de login para forçar novo login Google
            window.location.href = 'login.html';
        });
    }
});

/**
 * Carrega as coleções para o select do formulário
 *
 * Fluxo:
 * - Pede à API a lista de coleções criadas.
 * - Se a resposta for OK, entao:
 *      -> Limpa o select
 *      -> Cria uma option "Selecione..."
 *      -> Adiciona uma option para cada colecao existente.
 * - Se der erro na API, mostra mensagem de erro ao utilizador.
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
 * Carrega todos os itens para exibir na lista de administração
 *
 * Fluxo:
 * - Faz um GET para /api/itens.
 * - Se a API responder com sucesso, entao chama exibirItensAdmin
 *   para desenhar os cards na parte de baixo da admin.
 * - Se der erro, escreve na consola e mostra mensagem de erro.
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
 *
 * Ideia:
 * - Em vez de usar o comportamento padrao do form (enviar e recarregar pagina),
 *   interceptamos o submit, fazemos e.preventDefault() e chamamos funcoes JS
 *   que vao falar com a API.
 *
 * - Se o utilizador carregar em "Adicionar Item", entao:
 *      -> chamamos adicionarItem(), que valida os campos e faz POST /api/itens.
 * - Se carregar em "Criar Coleção", entao:
 *      -> chamamos criarColecao(), que valida e faz POST /api/colecoes.
 * - Nos formularios de edicao, fazemos o mesmo com PUT.
 */
function configurarFormularios() {
    const formItem = document.getElementById('form-adicionar-item');
    const formColecao = document.getElementById('form-criar-colecao');
    const formEditarItem = document.getElementById('form-editar-item');
    const formEditarColecao = document.getElementById('form-editar-colecao');
    
    formItem.addEventListener('submit', async (e) => {
        e.preventDefault();
        await adicionarItem();
    });
    
    formColecao.addEventListener('submit', async (e) => {
        e.preventDefault();
        await criarColecao();
    });

    formEditarItem.addEventListener('submit', async (e) => {
        e.preventDefault();
        await guardarEdicaoItem();
    });

    formEditarColecao.addEventListener('submit', async (e) => {
        e.preventDefault();
        await guardarEdicaoColecao();
    });
}

/**
 * Adiciona um novo item ao museu
 *
 * Fluxo resumido em "se isto, então aquilo":
 * 1) Le os valores dos campos do formulario e faz trim (remove espaços).
 * 2) Se algum dos campos obrigatorios (titulo, descricao, categoria, colecao)
 *    estiver vazio, entao:
 *       -> mostra mensagem de erro
 *       -> NAO envia nada para a API.
 * 3) Se o ano estiver vazio ou nao for numero, entao mostra erro e para.
 * 4) Se o ano for inferior a 1900 ou maior que 2100, entao mostra erro e para.
 * 5) Se o utilizador escreveu uma URL de foto:
 *       -> chamamos validarUrlImagem(urlFoto).
 *       -> Se a funcao devolver null (URL invalida), entao mostramos erro e paramos.
 * 6) Se todas as validacoes passarem, entao:
 *       -> construimos o objeto formData
 *       -> fazemos POST /api/itens para a API.
 * 7) Se a API responder com sucesso (resposta.ok):
 *       -> mostramos mensagem de sucesso
 *       -> limpamos o formulario
 *       -> recarregamos a lista de itens e colecoes.
 *    Caso contrario:
 *       -> lemos a mensagem de erro da API e mostramos ao utilizador.
 */
async function adicionarItem() {
    try {
        // Ler e limpar (trim) os valores dos campos do formulário
        const titulo = document.getElementById('titulo').value.trim();
        const descricao = document.getElementById('descricao').value.trim();
        const categoria = document.getElementById('categoria').value.trim();
        const anoValor = document.getElementById('ano').value.trim();
        const colecao = document.getElementById('colecao').value.trim();
        const urlFoto = document.getElementById('foto').value.trim();

        // VALIDAÇÕES NO FRONT-END
        if (!titulo || !descricao || !categoria || !colecao) {
            mostrarMensagem('Preencha todos os campos obrigatórios (Título, Descrição, Categoria e Coleção).', 'erro');
            return;
        }

        if (!anoValor || isNaN(parseInt(anoValor))) {
            mostrarMensagem('Informe um ano válido.', 'erro');
            return;
        }

        const ano = parseInt(anoValor);
        if (ano < 1900 || ano > 2100) {
            mostrarMensagem('O ano deve estar entre 1900 e 2100.', 'erro');
            return;
        }

        const urlValidada = validarUrlImagem(urlFoto);
        
        if (urlFoto && !urlValidada) {
            mostrarMensagem(' URL de imagem inválida. Use URLs diretas de imagens (não páginas do Pinterest). Veja as instruções abaixo.', 'erro');
            return;
        }
        
        const formData = {
            titulo,
            descricao,
            categoria,
            ano,
            foto: urlValidada || undefined,
            colecao
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
 *
 * Fluxo:
 * - Le o nome, descricao e cor do formulario.
 * - Se nome OU descricao estiverem vazios, entao mostra erro e nao envia.
 * - Se estiver tudo preenchido, constroi formData e faz POST /api/colecoes.
 * - Se a API devolver sucesso, entao:
 *      -> mostra mensagem "Coleção criada com sucesso!"
 *      -> limpa o formulario
 *      -> recarrega select de colecoes e lista de colecoes.
 */
async function criarColecao() {
    try {
        const nome = document.getElementById('nome-colecao').value.trim();
        const descricao = document.getElementById('descricao-colecao').value.trim();
        const cor = document.getElementById('cor-colecao').value;

        // Validar campos obrigatórios da coleção
        if (!nome || !descricao) {
            mostrarMensagem('Preencha o nome e a descrição da coleção.', 'erro');
            return;
        }

        const formData = {
            nome,
            descricao,
            cor
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
 *
 * - Se o array de itens vier vazio, entao mostra uma mensagem
 *   "Nenhum item adicionado ainda".
 * - Caso contrario, ordena os itens por ID (mais recentes primeiro)
 *   e cria um card para cada um com criarCardItem().
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
 *
 * Regras principais:
 * - Se a string estiver vazia, entao devolve null (sem imagem).
 * - Se for URL do Pinterest tipo pagina (pinterest.com), entao devolve null
 *   porque nao da para usar paginas HTML como src de <img>.
 * - Se for URL direta (pinimg.com) ou de servico de imagens conhecido, entao aceita.
 * - Se a URL nao for valida ou lanca excecao no new URL(...), devolve null.
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
 * Carrega todas as coleções para exibir na lista da área admin
 *
 * - Faz GET /api/colecoes.
 * - Se der certo, chama exibirColecoesAdmin para desenhar os cards.
 * - Se der erro, mostra mensagem de erro.
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
 *
 * - Se nao houver colecoes, entao mostra texto "Nenhuma coleção criada ainda".
 * - Caso contrario, cria um card (criarCardColecao) para cada colecao.
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
 *
 * - Mostra o nome e descricao da coleção.
 * - Mostra dois botoes:
 *      -> "Editar": abre o modal de edicao, passando os dados da colecao.
 *      -> "Apagar": chama apagarColecao(id, nome) com confirmacao.
 */
function criarCardColecao(colecao) {
    const card = document.createElement('div');
    card.className = 'colecao-card';
    card.style.borderLeft = `4px solid ${colecao.cor}`;
    
    // Escapar aspas no nome para evitar problemas no onclick
    const nomeEscapado = colecao.nome.replace(/'/g, "\\'").replace(/"/g, '&quot;');
    const colecaoJson = JSON.stringify(colecao).replace(/'/g, "\\'").replace(/"/g, '&quot;');
    
    card.innerHTML = `
        <div class="conteudo">
            <h3>${colecao.nome}</h3>
            <p class="descricao">${colecao.descricao}</p>
            <div class="acoes">
                <button class="btn-editar" onclick="abrirModalEditarColecao(${colecaoJson})" title="Editar coleção">
                     Editar
                </button>
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
 *
 * - Se a URL da imagem for valida, mostra a imagem; caso contrario,
 *   mostra um placeholder "Sem imagem".
 * - Mostra titulo, categoria, descricao, ano, colecao e ID do item.
 * - Disponibiliza botoes de "Editar" (abre modal) e "Apagar" (chama apagarItem).
 */
function criarCardItem(item) {
    const card = document.createElement('div');
    card.className = 'item-card';
    
    const urlImagem = validarUrlImagem(item.foto);
    const imagemHtml = urlImagem 
        ? `<img src="${urlImagem}" alt="${item.titulo}" loading="lazy" onerror="this.onerror=null; this.src='data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'400\' height=\'300\'%3E%3Crect fill=\'%23ddd\' width=\'400\' height=\'300\'/%3E%3Ctext x=\'50%25\' y=\'50%25\' text-anchor=\'middle\' dy=\'.3em\' fill=\'%23999\' font-family=\'Arial\' font-size=\'16\'%3ESem Imagem%3C/text%3E%3C/svg%3E'; this.parentElement.classList.add('sem-imagem');">`
        : `<div class="sem-imagem-placeholder"><span></span><p>Sem imagem</p></div>`;
    
    const itemJson = JSON.stringify(item).replace(/'/g, "\\'").replace(/"/g, '&quot;');
    
    card.innerHTML = `
        ${imagemHtml}
        <div class="conteudo">
            <h3>${item.titulo}</h3>
            <span class="categoria">${item.categoria}</span>
            <p class="descricao">${item.descricao}</p>
            <p class="ano">ID: ${item.id} | Ano: ${item.ano} | Coleção: ${item.colecao}</p>
            <div class="acoes">
                <button class="btn-editar" onclick="abrirModalEditarItem(${itemJson})" title="Editar item">
                    Editar
                </button>
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
 *
 * Fluxo:
 * - Primeiro mostra um confirm() para ter a certeza.
 *   Se o utilizador clicar em Cancelar, entao NAO faz nada.
 * - Se o utilizador confirmar:
 *      -> faz DELETE /api/itens/:id.
 *      -> Se a API responder ok, mostra mensagem de sucesso e recarrega itens.
 *      -> Se der erro, mostra a mensagem devolvida pela API.
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
 *
 * Fluxo:
 * - Mostra um confirm() explicando que so pode apagar colecoes sem itens.
 * - Se o utilizador cancelar, entao nao faz nada.
 * - Se confirmar, faz DELETE /api/colecoes/:id.
 * - Se a API devolver sucesso, recarrega as listas; se nao, mostra erro.
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
 * Abre o modal para editar um item
 *
 * - Primeiro carrega as colecoes da API para o select de edicao.
 * - Depois preenche os campos do modal com os dados do item recebido.
 * - No final, torna o modal visivel (display = 'block').
 */
window.abrirModalEditarItem = async function(item) {
    // Carregar as coleções para o select
    try {
        const resposta = await fetch(`${API_URL}/colecoes`);
        const colecoes = await resposta.json();
        
        const selectColecao = document.getElementById('editar-colecao');
        selectColecao.innerHTML = '<option value="">Selecione...</option>';
        
        colecoes.forEach(colecao => {
            const option = document.createElement('option');
            option.value = colecao.nome;
            option.textContent = colecao.nome;
            selectColecao.appendChild(option);
        });
    } catch (erro) {
        console.error('Erro ao carregar coleções:', erro);
    }
    
    document.getElementById('editar-item-id').value = item.id;
    document.getElementById('editar-titulo').value = item.titulo;
    document.getElementById('editar-descricao').value = item.descricao;
    document.getElementById('editar-categoria').value = item.categoria;
    document.getElementById('editar-ano').value = item.ano;
    document.getElementById('editar-foto').value = item.foto || '';
    document.getElementById('editar-colecao').value = item.colecao;
    
    document.getElementById('modal-editar-item').style.display = 'block';
}

/**
 * Fecha o modal de edição de item
 */
window.fecharModalEditarItem = function() {
    document.getElementById('modal-editar-item').style.display = 'none';
    document.getElementById('form-editar-item').reset();
}

/**
 * Guarda as alterações do item
 *
 * - Valida novamente a URL da foto (para evitar URL invalida apos edicao).
 * - Se for invalida, mostra erro e nao envia.
 * - Se for valida, constroi objeto itemAtualizado e faz PUT /api/itens/:id.
 * - Se a API responder ok, fecha o modal e recarrega a lista de itens.
 */
async function guardarEdicaoItem() {
    try {
        const id = parseInt(document.getElementById('editar-item-id').value);
        const urlFoto = document.getElementById('editar-foto').value.trim();
        const urlValidada = validarUrlImagem(urlFoto);
        
        if (urlFoto && !urlValidada) {
            mostrarMensagem('URL de imagem inválida. Use URLs diretas de imagens (não páginas do Pinterest).', 'erro');
            return;
        }
        
        const itemAtualizado = {
            titulo: document.getElementById('editar-titulo').value,
            descricao: document.getElementById('editar-descricao').value,
            categoria: document.getElementById('editar-categoria').value,
            ano: parseInt(document.getElementById('editar-ano').value),
            foto: urlValidada || '',
            colecao: document.getElementById('editar-colecao').value,
            id: id
        };
        
        console.log('Enviando para servidor:', itemAtualizado);
        
        const resposta = await fetch(`${API_URL}/itens/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(itemAtualizado)
        });
        
        const dados = await resposta.json();
        console.log('Resposta do servidor:', dados);
        
        if (resposta.ok) {
            mostrarMensagem('Item atualizado com sucesso!', 'sucesso');
            fecharModalEditarItem();
            carregarItens();
        } else {
            mostrarMensagem(dados.erro || 'Erro ao atualizar item', 'erro');
        }
    } catch (erro) {
        console.error('Erro ao atualizar item:', erro);
        mostrarMensagem('Erro ao atualizar item: ' + erro.message, 'erro');
    }
}

/**
 * Abre o modal para editar uma coleção
 *
 * - Preenche os campos do modal com os dados da colecao passada.
 * - Depois mostra o modal na tela para o utilizador poder alterar.
 */
window.abrirModalEditarColecao = function(colecao) {
    document.getElementById('editar-colecao-id').value = colecao.id;
    document.getElementById('editar-nome-colecao').value = colecao.nome;
    document.getElementById('editar-descricao-colecao').value = colecao.descricao;
    document.getElementById('editar-cor-colecao').value = colecao.cor || '#6C757D';
    
    document.getElementById('modal-editar-colecao').style.display = 'block';
}

/**
 * Fecha o modal de edição de coleção
 */
window.fecharModalEditarColecao = function() {
    document.getElementById('modal-editar-colecao').style.display = 'none';
    document.getElementById('form-editar-colecao').reset();
}

/**
 * Guarda as alterações da coleção
 *
 * - Lê os dados editados, monta o objeto colecaoAtualizada
 *   e faz PUT /api/colecoes/:id na API.
 * - Se a API devolver sucesso, fecha o modal e recarrega listas.
 */
async function guardarEdicaoColecao() {
    try {
        const id = parseInt(document.getElementById('editar-colecao-id').value);
        const colecaoAtualizada = {
            nome: document.getElementById('editar-nome-colecao').value,
            descricao: document.getElementById('editar-descricao-colecao').value,
            cor: document.getElementById('editar-cor-colecao').value,
            id: id
        };
        
        console.log('Enviando para servidor:', colecaoAtualizada);
        
        const resposta = await fetch(`${API_URL}/colecoes/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(colecaoAtualizada)
        });
        
        const dados = await resposta.json();
        console.log('Resposta do servidor:', dados);
        
        if (resposta.ok) {
            mostrarMensagem('Coleção atualizada com sucesso!', 'sucesso');
            fecharModalEditarColecao();
            carregarListaColecoes();
            carregarColecoes();
        } else {
            mostrarMensagem(dados.erro || 'Erro ao atualizar coleção', 'erro');
        }
    } catch (erro) {
        console.error('Erro ao atualizar coleção:', erro);
        mostrarMensagem('Erro ao atualizar coleção: ' + erro.message, 'erro');
    }
}

/**
 * Mostra uma mensagem de feedback ao utilizador
 *
 * - Remove mensagens anteriores para nao acumular muitas caixas.
 * - Cria um div com a classe "mensagem" e o tipo (sucesso/erro).
 * - Insere a mensagem no topo do <main>.
 * - Depois de 5 segundos, remove automaticamente a mensagem.
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
