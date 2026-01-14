// ============================
// CONFIGURACAO DO LOGIN GOOGLE
// ============================

// Chaves usadas no localStorage para guardar dados do login Google
// - google_token: token JWT devolvido pelo Google
// - google_user:  alguns dados do utilizador (nome, email, foto)
const STORAGE_TOKEN_KEY = 'google_token';
const STORAGE_USER_KEY = 'google_user';

// Quando o ficheiro é carregado, verificamos se já existe token
// SE já existir um token válido guardado ENTÃO assumimos que o
// utilizador já fez login antes e não precisa de ver o ecrã de login.
// Nessa situação, redirecionamos logo para a página admin e
// evitamos que tenha de clicar novamente no botão do Google.
if (localStorage.getItem(STORAGE_TOKEN_KEY)) {
    window.location.href = 'admin.html';
}

// ===============================================
// FUNCAO DE CALLBACK CHAMADA PELO GOOGLE AO LOGIN
// ===============================================
// Esta função é referenciada em login.html em data-callback="handleCredentialResponse"
// O Google chama esta função passando um objeto "response" que contém:
// - response.credential: token JWT com informações do utilizador
// FLUXO RESUMIDO:
// 1) SE o Google não devolver o campo credential ENTÃO mostramos um erro e paramos.
// 2) SE existir credential ENTÃO tentamos decodificar para obter nome/email/foto.
// 3) Guardamos o token completo e, SE a decodificação tiver resultado, também
//    guardamos os dados básicos do utilizador (para uso futuro, se quisermos mostrar).
// 4) No fim, redirecionamos SEMPRE para admin.html se não houver erros.
window.handleCredentialResponse = function (response) {
    try {
        const credential = response.credential;
        // SE o Google não enviar o token (credential vazio ou indefinido)
        // ENTÃO avisamos o utilizador que não foi possível obter o token
        // e saímos da função sem fazer login.
        if (!credential) {
            alert('Não foi possível obter o token do Google.');
            return;
        }

        // SE chegarmos aqui, significa que temos um token JWT.
        // Tentamos decodificar o conteúdo do token (nome, email, foto, etc.).
        const payload = decodeJwtPayload(credential);

        // Guardamos SEMPRE o token bruto, porque é isso que prova o login.
        localStorage.setItem(STORAGE_TOKEN_KEY, credential);
        // SE a decodificação funcionou (payload não é null)
        // ENTÃO também guardamos alguns campos úteis do utilizador.
        if (payload) {
            localStorage.setItem(STORAGE_USER_KEY, JSON.stringify({
                name: payload.name,
                email: payload.email,
                picture: payload.picture
            }));
        }

        // Depois de guardar os dados, SE não tiver havido erro na lógica acima,
        // ENTÃO redirecionamos o utilizador para a área privada.
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
// FLUXO:
// - SE o token não tiver 3 partes ENTÃO devolvemos null (token inválido).
// - SE a conversão Base64 ou o JSON.parse falharem ENTÃO apanhamos o erro,
//   escrevemos no console e também devolvemos null para indicar falha.
// - SE tudo correr bem ENTÃO devolvemos o objeto com os dados do utilizador.
function decodeJwtPayload(token) {
    try {
        const partes = token.split('.');
        if (partes.length !== 3) return null;

        const payloadBase64 = partes[1]
            .replace(/-/g, '+')
            .replace(/_/g, '/');

        const payloadJson = atob(payloadBase64);
        // SE conseguirmos fazer o parse do JSON com sucesso
        // ENTÃO devolvemos o objeto com os dados descodificados.
        return JSON.parse(payloadJson);
    } catch (e) {
        console.error('Erro ao decodificar JWT:', e);
        return null;
    }
}
