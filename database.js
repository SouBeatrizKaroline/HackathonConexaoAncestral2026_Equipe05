// database.js - Conexão com MariaDB

const mysql = require('mysql2/promise');

// Configuração da conexão
const config = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'petronect',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Criar pool de conexões
const pool = mysql.createPool(config);

// Exportar pool
module.exports = pool;

// Função para testar conexão
async function testarConexao() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Conectado ao MariaDB com sucesso!');
    connection.release();
  } catch (err) {
    console.error('❌ Erro ao conectar ao MariaDB:', err.message);
    process.exit(1);
  }
}

// Testar ao iniciar
testarConexao();
