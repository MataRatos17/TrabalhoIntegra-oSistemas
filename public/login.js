// Chave no localStorage para guardar o token Google
const STORAGE_TOKEN_KEY = 'google_token';
const STORAGE_USER_KEY = 'google_user';

// Se já estiver autenticado, ir direto para a página privada
if (localStorage.getItem(STORAGE_TOKEN_KEY)) {
    window.location.href = 'admin.html';
}

// Função chamada pelo Google Identity Services quando o utilizador faz login
window.handleCredentialResponse = function (response) {
    try {
        const credential = response.credential;
        if (!credential) {
            alert('Não foi possível obter o token do Google.');
            return;
        }

        const payload = decodeJwtPayload(credential);

        // Guardar token e dados básicos do utilizador
        localStorage.setItem(STORAGE_TOKEN_KEY, credential);
        if (payload) {
            localStorage.setItem(STORAGE_USER_KEY, JSON.stringify({
                name: payload.name,
                email: payload.email,
                picture: payload.picture
            }));
        }

        // Redirecionar para a área privada
        window.location.href = 'admin.html';
    } catch (e) {
        console.error('Erro ao processar login Google:', e);
        alert('Ocorreu um erro ao processar o login Google.');
    }
};

// Decodifica o payload (2ª parte) do JWT devolvido pelo Google
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
