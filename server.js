const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.APP_PORT || process.env.PORT || 8080;

// Servir ficheiros estáticos da aplicação
app.use(express.static(path.join(__dirname, 'public')));

// Rota raiz chama o index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Opcional: atalho para /admin
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Iniciar servidor da aplicação
app.listen(PORT, () => {
    console.log(`Aplicação a correr em http://localhost:${PORT}`);
});
