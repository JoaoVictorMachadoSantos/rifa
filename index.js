const express = require('express');
const { Pool } = require('pg');
const path = require('path');
require('dotenv').config();

const app = express();
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Página inicial
app.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT numero FROM numeros WHERE reservado = false');
    const numerosDisponiveis = result.rows.map(row => row.numero);
    res.render('index', { numerosDisponiveis });
  } catch (err) {
    console.error(err);
    res.send('Erro ao carregar números.');
  }
});

// Página de pagamento
app.post('/pagamento', async (req, res) => {
  const { nome, whatsapp, numeros } = req.body;
  try {
    // Marcar os números escolhidos como reservados no banco de dados
    await pool.query('UPDATE numeros SET reservado = true, nome = $1, whatsapp = $2 WHERE numero = ANY($3)', [nome, whatsapp, numeros]);

    res.render('pagamento', { nome, whatsapp, numeros });
  } catch (err) {
    console.error(err);
    res.send('Erro ao processar pagamento.');
  }
});

// Servidor escutando
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
