// =============================
// SERVIDOR DA APLICACAO (FRONTEND)
// =============================
// Este ficheiro sobe um pequeno servidor Express apenas para
// servir os ficheiros estáticos da pasta public/ (HTML, CSS, JS).

const express = require('express');
const path = require('path');

const app = express();
// Porta do servidor da aplicação (diferente da porta da API 3000)
const PORT = process.env.APP_PORT || process.env.PORT || 8080;

// Servir ficheiros estáticos da pasta public
app.use(express.static(path.join(__dirname, 'public')));

// Rota raiz chama o index.html (exposição pública)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Atalho direto para a área privada (admin.html)
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Iniciar servidor da aplicação
app.listen(PORT, () => {
    console.log(`Aplicação a correr em http://localhost:${PORT}`);
});
