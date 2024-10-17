const express = require('express');
const pg = require('pg');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();
const port = 3000;

// Configuração do EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Conectando ao PostgreSQL
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Rota principal para exibir números disponíveis
app.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT numero FROM numeros WHERE reservado = false');
    const numerosDisponiveis = result.rows;
    res.render('index', { numerosDisponiveis });
  } catch (err) {
    console.error(err);
    res.send('Erro ao buscar números disponíveis');
  }
});

// Rota para reservar números
app.post('/reservar', async (req, res) => {
  const { nome, whatsapp, numeros } = req.body;

  try {
    if (!Array.isArray(numeros)) {
      return res.send('Você deve selecionar pelo menos um número.');
    }

    await pool.query('BEGIN');
    for (const numero of numeros) {
      await pool.query('UPDATE numeros SET reservado = true, nome = $1, whatsapp = $2 WHERE numero = $3 AND reservado = false', [nome, whatsapp, numero]);
    }
    await pool.query('COMMIT');
    
    res.render('pagamento', { mensagem: 'Por favor, realize o pagamento e envie o comprovante para o WhatsApp informado.' });
  } catch (err) {
    await pool.query('ROLLBACK');
    console.error(err);
    res.send('Erro ao reservar números. Por favor, tente novamente.');
  }
});

app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});
