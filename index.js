const express = require('express');
const pg = require('pg');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();
const port = 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

app.get('/', async (req, res) => {
  try {
    
    const result = await pool.query('SELECT numero, reservado FROM numeros ORDER BY numero ASC');
    const numeros = result.rows;
    res.render('index', { numeros });
  } catch (err) {
    console.error('Erro ao buscar números:', err);
    res.send('Erro ao buscar números');
  }
});


app.post('/reservar', async (req, res) => {
  let { nome, whatsapp, numeros } = req.body;

  try {
    // Garantir que 'numeros' seja sempre um array, mesmo que apenas um número tenha sido selecionado
    if (!Array.isArray(numeros)) {
      numeros = [numeros]; // Transformar em array se for uma string única
    }

    if (numeros.length === 0) {
      return res.send('Você deve selecionar pelo menos um número.');
    }

    await pool.query('BEGIN');

    // Capturando a hora atual e formatando para o padrão do PostgreSQL
    const horaReserva = new Date().toISOString(); // Converte para o formato ISO 8601

    for (const numero of numeros) {
      const result = await pool.query(
        'UPDATE numeros SET reservado = true, nome = $1, whatsapp = $2, hora_reserva = $3 WHERE numero = $4 AND reservado = false',
        [nome, whatsapp, horaReserva, numero]
      );
      if (result.rowCount === 0) {
        console.log(`Número ${numero} já está reservado ou não existe.`);
      } else {
        console.log(`Número ${numero} reservado com sucesso.`);
      }
    }

    await pool.query('COMMIT');
    res.render('pagamento', { mensagem: 'Por favor, realize o pagamento e envie o comprovante para o WhatsApp informado.' });
  } catch (err) {
    await pool.query('ROLLBACK');
    console.error('Erro ao reservar números:', err);
    res.send('Erro ao reservar números. Por favor, tente novamente.');
  }
});

app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});
