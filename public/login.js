// ============================
// CONFIGURACAO DO LOGIN GOOGLE
// ============================

// Chaves usadas no localStorage para guardar dados do login Google
// - google_token: token JWT devolvido pelo Google
// - google_user:  alguns dados do utilizador (nome, email, foto)
const STORAGE_TOKEN_KEY = 'google_token';
const STORAGE_USER_KEY = 'google_user';

// Quando o ficheiro é carregado, verificamos se já existe token
// Se existir, consideramos que o utilizador já fez login antes
// e redirecionamos logo para a página admin (evita login repetido)
if (localStorage.getItem(STORAGE_TOKEN_KEY)) {
    window.location.href = 'admin.html';
}

// ===============================================
// FUNCAO DE CALLBACK CHAMADA PELO GOOGLE AO LOGIN
// ===============================================
// Esta função é referenciada em login.html em data-callback="handleCredentialResponse"
// O Google chama esta função passando um objeto "response" que contém:
// - response.credential: token JWT com informações do utilizador
window.handleCredentialResponse = function (response) {
    try {
        const credential = response.credential;
        if (!credential) {
            alert('Não foi possível obter o token do Google.');
            return;
        }

        // Decodifica o conteúdo do token (nome, email, foto, etc.)
        const payload = decodeJwtPayload(credential);

        // Guarda o token bruto e, se possível, os dados básicos do utilizador
        localStorage.setItem(STORAGE_TOKEN_KEY, credential);
        if (payload) {
            localStorage.setItem(STORAGE_USER_KEY, JSON.stringify({
                name: payload.name,
                email: payload.email,
                picture: payload.picture
            }));
        }

        // Depois de guardar os dados, envia o utilizador para a área privada
        window.location.href = 'admin.html';
    } catch (e) {
        console.error('Erro ao processar login Google:', e);
        alert('Ocorreu um erro ao processar o login Google.');
    }
};

// ========================================================
// Função auxiliar para decodificar o JWT devolvido pelo Google
// ========================================================
// O token JWT tem 3 partes separadas por ponto: header.payload.signature
// Aqui pegamos apenas a 2ª parte (payload), transformamos de Base64URL
// para texto normal e depois fazemos JSON.parse para obter um objeto JS.
function decodeJwtPayload(token) {
    try {
        const partes = token.split('.');
        if (partes.length !== 3) return null;

        const payloadBase64 = partes[1]
            .replace(/-/g, '+')
            .replace(/_/g, '/');

        const payloadJson = atob(payloadBase64);
        return JSON.parse(payloadJson);
    } catch (e) {
        console.error('Erro ao decodificar JWT:', e);
        return null;
    }
}
