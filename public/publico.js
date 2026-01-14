// ================================
// LADO PUBLICO DO SITE (EXPOSICAO)
// ================================
// Este ficheiro contém o JavaScript da página index.html.
// Responsabilidades principais:
// - Pedir à API os itens e coleções do museu
// - Mostrar os cartões de itens na galeria
// - Filtrar por coleção
// - Carregar obras de arte da API pública (Met) e artistas

// URL base da API interna do museu
const API_URL = 'http://localhost:3000/api';

// Quando o DOM estiver pronto, carrega os dados iniciais.
// FLUXO:
// - SE a página carregar corretamente ENTÃO buscamos de imediato:
//   1) Coleções (para os botões de filtro)
//   2) Itens (para a galeria principal)
//   3) Obras da API pública
//   4) Lista de artistas da API pública
document.addEventListener('DOMContentLoaded', () => {
    carregarColecoes();          // Botões de filtro por coleção
    carregarItens();             // Itens da exposição
    carregarObrasArtePublica();  // Obras vindas da API pública
    carregarArtistas();          // Lista de artistas para o select
});

// ------------------------------
// ARTISTAS E OBRAS DA API PUBLICA
// ------------------------------
// Carrega lista de artistas vindos da API pública e popula a combobox.
// FLUXO:
// - Fazemos um pedido à API interna /arte-publica/artistas.
// - SE o pedido for bem sucedido ENTÃO limpamos o select, criamos a opção "Todos"
//   e depois adicionamos uma option por cada artista.
// - Adicionamos um listener ao select:
//   * SE o utilizador escolher "Todos" ENTÃO voltamos a carregar todas as obras.
//   * SE escolher um artista específico ENTÃO chamamos carregarObrasPorArtista.
// - SE acontecer algum erro ENTÃO mostramos uma mensagem de erro no próprio select.
async function carregarArtistas() {
    const select = document.getElementById('select-artistas');
    try {
        const resposta = await fetch(`${API_URL}/arte-publica/artistas`);
        const artistas = await resposta.json();

        select.innerHTML = '';
        const opcTodas = document.createElement('option');
        opcTodas.value = '';
        opcTodas.textContent = 'Todos';
        select.appendChild(opcTodas);

        artistas.forEach(nome => {
            const opt = document.createElement('option');
            opt.value = nome;
            opt.textContent = nome;
            select.appendChild(opt);
        });

        select.addEventListener('change', () => {
            const val = select.value;
            // SE o valor estiver vazio ("Todos") ENTÃO mostramos todas as obras disponíveis.
            // SE tiver um nome de artista ENTÃO filtramos as obras para esse artista.
            if (!val) {
                carregarObrasArtePublica();
            } else {
                carregarObrasPorArtista(val);
            }
        });
    } catch (erro) {
        console.error('Erro ao carregar artistas:', erro);
        select.innerHTML = '<option value="">Erro ao carregar artistas</option>';
    }
}

/**
 * Carrega até 6 obras de um artista selecionado.
 * FLUXO:
 * - Fazemos um pedido ao endpoint /arte-publica/por-artista.
 * - SE a resposta HTTP não for ok ENTÃO mostramos mensagem de "Nenhuma obra".
 * - SE o array devolvido estiver vazio ENTÃO também avisamos que não há obras.
 * - CASO CONTRÁRIO, chamamos exibirObrasArte para desenhar os cartões.
 */
async function carregarObrasPorArtista(artista) {
    const container = document.getElementById('obras-arte-container');
    
    try {
        console.log('Carregando obras para artista:', artista);
        const resposta = await fetch(`${API_URL}/arte-publica/por-artista?artist=${encodeURIComponent(artista)}`);
        
        if (!resposta.ok) {
            console.error('Erro HTTP:', resposta.status);
            container.innerHTML = '<p>Nenhuma obra encontrada para este artista.</p>';
            return;
        }
        
        const obras = await resposta.json();
        
        if (!obras || obras.length === 0) {
            container.innerHTML = '<p>Nenhuma obra encontrada para este artista.</p>';
            return;
        }

        exibirObrasArte(obras);
    } catch (erro) {
        console.error('Erro ao carregar obras por artista:', erro);
        container.innerHTML = '<p>Nenhuma obra disponível para este artista.</p>';
    }
}

// ------------------------------
// COLECOES E ITENS DO MUSEU
// ------------------------------
// Carrega todas as coleções e cria os botões de filtro.
// FLUXO:
// - Fazemos GET /colecoes.
// - SE a chamada tiver sucesso ENTÃO para cada coleção criamos um botão:
//   * Ao clicar, removemos a classe active de todos, marcamos o clicado,
//     e chamamos carregarItens (todas) ou filtrarPorColecao (específica).
// - SE der erro na chamada ENTÃO mostramos mensagem de erro.
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
                // Primeiro, removemos a seleção (active) de todos os botões.
                document.querySelectorAll('.filtro-btn').forEach(btn => {
                    btn.classList.remove('active');
                });
                
                // Depois, marcamos APENAS o botão clicado como ativo.
                botao.classList.add('active');
                
                // SE o nome da coleção for "todas" ENTÃO voltamos a carregar todos os itens.
                // CASO CONTRÁRIO, chamamos filtrarPorColecao para mostrar só essa coleção.
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

// ------------------------------
// FUNCOES DE APOIO (URL, CARDS, MENSAGENS)
// ------------------------------
// Valida e corrige URL de imagem
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
                <p class="contexto"><strong>Contexto cultural:</strong> ${obra.culture || '—'}</p>
                <p class="periodo"><strong>Período histórico:</strong> ${obra.period || '—'}</p>
                <p class="departamento"><strong>Coleção:</strong> ${obra.department || '—'}</p>
                <p class="material"><strong>Material:</strong> ${obra.medium || '—'}</p>
                <p class="dimensoes"><strong>Dimensão:</strong> ${obra.dimensions || '—'}</p>
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
