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
// Rota principal para exibir números disponíveis
app.get('/', async (req, res) => {
    try {
      const result = await pool.query('SELECT numero, reservado FROM numeros');
      const numeros = result.rows; // Obtemos todos os números
      res.render('index', { numeros }); // Certifique-se de que "numeros" está sendo passado aqui
    } catch (err) {
      console.error('Erro ao buscar números disponíveis:', err);
      res.send('Erro ao buscar números disponíveis');
    }
  });
  
  

  app.post('/reservar', async (req, res) => {
    let { nome, whatsapp, numeros } = req.body;
  
    try {
      // Garantir que "numeros" seja um array, mesmo que só um número tenha sido selecionado
      if (!Array.isArray(numeros)) {
        numeros = [numeros];  // Converte para array se for um único número
      }
  
      if (numeros.length === 0) {
        return res.send('Você deve selecionar pelo menos um número.');
      }
  
      await pool.query('BEGIN');
  
      for (const numero of numeros) {
        const result = await pool.query('UPDATE numeros SET reservado = true, nome = $1, whatsapp = $2 WHERE numero = $3 AND reservado = false', [nome, whatsapp, numero]);
        if (result.rowCount === 0) {
          console.log(`Número ${numero} já está reservado ou não existe.`);
        } else {
          console.log(`Número ${numero} reservado com sucesso.`);
        }
      }
  
      await pool.query('COMMIT');
  
      res.render('pagamento', { 
        mensagem: 'Por favor, realize o pagamento e envie o comprovante para o WhatsApp informado de imediato. Caso contrário, os números reservados voltarão a ficar disponíveis em 30 minutos.' 
      });
    } catch (err) {
      await pool.query('ROLLBACK');
      console.error('Erro ao reservar números:', err);
      res.send('Erro ao reservar números. Por favor, tente novamente.');
    }
  });
  

app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});
