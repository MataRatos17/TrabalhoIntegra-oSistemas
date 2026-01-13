const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || '127.0.0.1';
const DATA_FILE = path.join(__dirname, 'data.json');

app.use(cors());
app.use(express.json());

let state = { _loadedAt: new Date().toISOString() };

function loadData() {
  const raw = fs.readFileSync(DATA_FILE, 'utf8');
  const json = JSON.parse(raw);
  state = { ...json, _loadedAt: new Date().toISOString() };
  return state;
}

// Carrega dados ao iniciar
try {
  loadData();
  // eslint-disable-next-line no-console
  console.log(`data.json carregado com sucesso (${DATA_FILE})`);
} catch (err) {
  // eslint-disable-next-line no-console
  console.error('Falha ao ler data.json:', err.message);
}

// Raiz /met
app.get('/met', (req, res) => {
  res.json({
    name: 'Trabalho Integração de Sistemas - API',
    base: '/met',
    health: '/met/health',
    data: '/met/data',
    collections: Object.keys(state).filter(k => !k.startsWith('_')),
    loadedAt: state._loadedAt
  });
});

// Healthcheck
app.get('/met/health', (req, res) => {
  res.json({ status: 'ok', loadedAt: state._loadedAt });
});

// Devolve o JSON completo
app.get('/met/data', (req, res) => {
  res.json(state);
});

// Lista uma coleção: /met/games?q=fort
app.get('/met/:collection', (req, res) => {
  const { collection } = req.params;
  const { q } = req.query;
  const data = state[collection];

  if (data === undefined) {
    return res.status(404).json({ error: `Coleção '${collection}' não encontrada` });
  }

  if (Array.isArray(data) && q) {
    const ql = String(q).toLowerCase();
    const filtered = data.filter(it => {
      const fields = ['name', 'title', 'genre', 'game', 'user'];
      return fields.some(f => (it[f] ? String(it[f]).toLowerCase().includes(ql) : false));
    });
    return res.json(filtered);
  }

  return res.json(data);
});

// Busca item por id: /met/games/1
app.get('/met/:collection/:id', (req, res) => {
  const { collection, id } = req.params;
  const data = state[collection];
  if (!Array.isArray(data)) {
    return res.status(404).json({ error: `Coleção '${collection}' não é uma lista ou não existe` });
  }
  const isNum = /^\d+$/.test(id);
  const item = data.find(it => (isNum ? String(it.id) === id : String(it.id) === id));
  if (!item) return res.status(404).json({ error: `Item '${id}' não encontrado em '${collection}'` });
  return res.json(item);
});

// Recarrega data.json manualmente (dev)
app.post('/met/reload', (req, res) => {
  try {
    const updated = loadData();
    res.json({ status: 'reloaded', loadedAt: updated._loadedAt });
  } catch (err) {
    res.status(500).json({ error: 'Falha ao recarregar data.json', detail: err.message });
  }
});

app.listen(PORT, HOST, () => {
  // eslint-disable-next-line no-console
  console.log(`API ouvindo em http://${HOST}:${PORT}/met`);
});
