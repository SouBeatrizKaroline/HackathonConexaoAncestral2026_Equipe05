// app.js - Servidor Express com MariaDB e auto-export para PowerBI

const express = require('express');
const path = require('path');
const fs = require('fs');
const pool = require('./database');
require('dotenv').config();

const app = express();

// Middleware
app.use(express.json());
app.use(express.static('public'));
app.use(express.static('.'));

// ============ FUNÇÃO DE AUTO-EXPORT ============

async function exportarParaPowerBI() {
  try {
    const connection = await pool.getConnection();

    // Buscar todos os dados
    const [usuarios] = await connection.query(`
      SELECT 
        u.id, 
        u.cnpj, 
        u.razao_social, 
        u.email, 
        u.data_cadastro,
        GROUP_CONCAT(s.segmento SEPARATOR ',') as segmentos,
        COUNT(DISTINCT lh.id) as total_logins,
        MAX(lh.data_login) as ultimo_login,
        COUNT(DISTINCT a.id) as total_acessos,
        AVG(a.duracao_segundos) as tempo_medio_permanencia
      FROM usuarios u
      LEFT JOIN segmentos s ON u.id = s.user_id
      LEFT JOIN login_history lh ON u.id = lh.user_id
      LEFT JOIN acessos a ON u.id = a.user_id
      GROUP BY u.id
    `);

    // Dados de representantes
    const [representantes] = await connection.query(`
      SELECT user_id, COUNT(*) as total_representantes
      FROM representantes
      GROUP BY user_id
    `);

    // Dados de acessos detalhados
    const [acessosPorPagina] = await connection.query(`
      SELECT pagina, COUNT(*) as quantidade, AVG(duracao_segundos) as tempo_medio
      FROM acessos
      GROUP BY pagina
      ORDER BY quantidade DESC
    `);

    // Dados de cliques
    const [clicksPorElemento] = await connection.query(`
      SELECT elemento, pagina, COUNT(*) as quantidade
      FROM cliques
      GROUP BY elemento, pagina
      ORDER BY quantidade DESC
      LIMIT 20
    `);

    connection.release();

    // Criar objeto JSON
    const jsonExport = {
      exportacao: new Date().toISOString(),
      resumo: {
        total_usuarios: usuarios.length,
        total_segmentos: new Set(usuarios.flatMap(u => u.segmentos ? u.segmentos.split(',') : [])).size,
        total_logins: usuarios.reduce((sum, u) => sum + (u.total_logins || 0), 0),
        tempo_medio_permanencia_segundos: Math.round(
          usuarios.reduce((sum, u) => sum + (u.tempo_medio_permanencia || 0), 0) / usuarios.length
        )
      },
      usuarios: usuarios,
      representantes_por_usuario: representantes,
      acessos_por_pagina: acessosPorPagina,
      cliques_mais_comuns: clicksPorElemento
    };

    // Salvar arquivo JSON
    const pastaExport = path.join(__dirname, 'powerbi-exports');
    if (!fs.existsSync(pastaExport)) {
      fs.mkdirSync(pastaExport, { recursive: true });
    }

    const nomeArquivo = `petronect_${new Date().toISOString().split('T')[0]}_${Date.now()}.json`;
    const caminhoArquivo = path.join(pastaExport, nomeArquivo);

    fs.writeFileSync(caminhoArquivo, JSON.stringify(jsonExport, null, 2));
    console.log(`✅ JSON exportado: ${caminhoArquivo}`);

    return jsonExport;
  } catch (err) {
    console.error('❌ Erro ao exportar para PowerBI:', err.message);
    throw err;
  }
}

// ============ ENDPOINTS ============

// 1. CRIAR USUÁRIO (Passo 1 - Dados da Empresa)
app.post('/api/usuarios', async (req, res) => {
  try {
    const { cnpj, razao_social, email, telefone, endereco, ie, tributacao, segmento } = req.body;

    if (!cnpj || !email) {
      return res.status(400).json({ erro: 'CNPJ e email são obrigatórios' });
    }

    const query = `
      INSERT INTO usuarios (cnpj, razao_social, email, telefone, endereco, inscricao_estadual, tributacao)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const connection = await pool.getConnection();
    const [result] = await connection.query(query, [cnpj, razao_social, email, telefone, endereco, ie, tributacao]);
    
    const user_id = result.insertId;

    // Adicionar segmento
    if (segmento) {
      const segQuery = 'INSERT INTO segmentos (user_id, segmento) VALUES (?, ?)';
      await connection.query(segQuery, [user_id, segmento]);
    }

    connection.release();

    // Auto-export após criar usuário
    await exportarParaPowerBI();

    res.json({ sucesso: true, user_id });
  } catch (err) {
    console.error('Erro:', err);
    res.status(500).json({ erro: err.message });
  }
});

// 2. ADICIONAR REPRESENTANTES LEGAIS (Passo 2)
app.post('/api/representantes', async (req, res) => {
  try {
    const { user_id, representantes } = req.body;

    if (!user_id || !representantes || representantes.length === 0) {
      return res.status(400).json({ erro: 'user_id e representantes são obrigatórios' });
    }

    const query = `
      INSERT INTO representantes (user_id, nome_completo, cpf, cargo, email, telefone)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    const connection = await pool.getConnection();

    for (let rep of representantes) {
      if (rep.nome && rep.email) {
        await connection.query(query, [user_id, rep.nome, rep.cpf || null, rep.cargo, rep.email, rep.telefone]);
      }
    }

    connection.release();

    // Auto-export após adicionar representantes
    await exportarParaPowerBI();

    res.json({ sucesso: true });
  } catch (err) {
    console.error('Erro:', err);
    res.status(500).json({ erro: err.message });
  }
});

// 3. ATUALIZAR PREFERÊNCIAS LGPD (Passo 3)
app.post('/api/preferencias', async (req, res) => {
  try {
    const { user_id, aceita_lgpd, aceita_alertas } = req.body;

    const query = `
      INSERT INTO preferencias (user_id, aceita_lgpd, aceita_alertas)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE aceita_lgpd = ?, aceita_alertas = ?
    `;

    const connection = await pool.getConnection();
    await connection.query(query, [user_id, aceita_lgpd, aceita_alertas, aceita_lgpd, aceita_alertas]);
    connection.release();

    // Auto-export após atualizar preferências
    await exportarParaPowerBI();

    res.json({ sucesso: true });
  } catch (err) {
    console.error('Erro:', err);
    res.status(500).json({ erro: err.message });
  }
});

// 4. RASTREAR ACESSO (Tempo em página)
app.post('/api/rastrear-acesso', async (req, res) => {
  try {
    const { user_id, pagina, duracao_segundos } = req.body;

    if (!user_id || !pagina) {
      return res.status(400).json({ erro: 'user_id e pagina são obrigatórios' });
    }

    const query = `
      INSERT INTO acessos (user_id, pagina, duracao_segundos)
      VALUES (?, ?, ?)
    `;

    const connection = await pool.getConnection();
    await connection.query(query, [user_id, pagina, duracao_segundos || 0]);
    connection.release();

    res.json({ sucesso: true });
  } catch (err) {
    console.error('Erro:', err);
    res.status(500).json({ erro: err.message });
  }
});

// 5. RASTREAR CLIQUE
app.post('/api/rastrear-clique', async (req, res) => {
  try {
    const { user_id, elemento, pagina, pos_x, pos_y } = req.body;

    if (!user_id || !elemento || !pagina) {
      return res.status(400).json({ erro: 'user_id, elemento e pagina são obrigatórios' });
    }

    const query = `
      INSERT INTO cliques (user_id, elemento, pagina, pos_x, pos_y)
      VALUES (?, ?, ?, ?, ?)
    `;

    const connection = await pool.getConnection();
    await connection.query(query, [user_id, elemento, pagina, pos_x || 0, pos_y || 0]);
    connection.release();

    res.json({ sucesso: true });
  } catch (err) {
    console.error('Erro:', err);
    res.status(500).json({ erro: err.message });
  }
});

// 6. DASHBOARD 1 - Usuários e Segmentos
app.get('/api/dashboard-1', async (req, res) => {
  try {
    const connection = await pool.getConnection();

    const [total] = await connection.query('SELECT COUNT(*) as total FROM usuarios');

    const [segmentos] = await connection.query(`
      SELECT segmento, COUNT(DISTINCT user_id) as quantidade
      FROM segmentos
      GROUP BY segmento
      ORDER BY quantidade DESC
    `);

    const [recentes] = await connection.query(`
      SELECT id, razao_social, email, data_cadastro
      FROM usuarios
      ORDER BY data_cadastro DESC
      LIMIT 10
    `);

    connection.release();

    res.json({
      totalUsuarios: total[0].total,
      segmentos,
      usuariosRecentes: recentes
    });
  } catch (err) {
    console.error('Erro:', err);
    res.status(500).json({ erro: err.message });
  }
});

// 7. DASHBOARD 2 - Acessos e Cliques (com filtros)
app.get('/api/dashboard-2', async (req, res) => {
  try {
    const { ano, mes, dia } = req.query;

    let filtro = '';
    if (ano) {
      filtro = `WHERE YEAR(data_acesso) = ${ano}`;
      if (mes) {
        filtro += ` AND MONTH(data_acesso) = ${mes}`;
        if (dia) {
          filtro += ` AND DAY(data_acesso) = ${dia}`;
        }
      }
    }

    const connection = await pool.getConnection();

    const [qtdAcessos] = await connection.query(`
      SELECT COUNT(*) as total FROM acessos ${filtro}
    `);

    const [tempoMedio] = await connection.query(`
      SELECT 
        AVG(duracao_segundos) as media,
        MAX(duracao_segundos) as maximo,
        MIN(duracao_segundos) as minimo
      FROM acessos ${filtro}
    `);

    const [acessosPorPagina] = await connection.query(`
      SELECT pagina, COUNT(*) as quantidade, AVG(duracao_segundos) as tempo_medio
      FROM acessos ${filtro}
      GROUP BY pagina
      ORDER BY quantidade DESC
    `);

    const [clicksMaisComuns] = await connection.query(`
      SELECT elemento, pagina, COUNT(*) as quantidade
      FROM cliques ${filtro}
      GROUP BY elemento, pagina
      ORDER BY quantidade DESC
      LIMIT 10
    `);

    connection.release();

    res.json({
      quantidadeAcessos: qtdAcessos[0].total,
      tempoMedio: tempoMedio[0],
      acessosPorPagina,
      clicksMaisComuns
    });
  } catch (err) {
    console.error('Erro:', err);
    res.status(500).json({ erro: err.message });
  }
});

// 8. EXPORTAR JSON PARA POWERBI (Manual)
app.get('/api/exportar-json', async (req, res) => {
  try {
    const jsonData = await exportarParaPowerBI();
    
    res.setHeader('Content-Disposition', `attachment; filename=petronect_${Date.now()}.json`);
    res.setHeader('Content-Type', 'application/json');
    res.json(jsonData);
  } catch (err) {
    console.error('Erro:', err);
    res.status(500).json({ erro: err.message });
  }
});

// 9. LISTAR EXPORTS DISPONÍVEIS
app.get('/api/lista-exports', (req, res) => {
  try {
    const pastaExport = path.join(__dirname, 'powerbi-exports');
    
    if (!fs.existsSync(pastaExport)) {
      return res.json({ exports: [] });
    }

    const arquivos = fs.readdirSync(pastaExport)
      .filter(f => f.endsWith('.json'))
      .map(f => ({
        nome: f,
        tamanho: fs.statSync(path.join(pastaExport, f)).size,
        data: fs.statSync(path.join(pastaExport, f)).mtime
      }))
      .sort((a, b) => b.data - a.data);

    res.json({ exports: arquivos });
  } catch (err) {
    console.error('Erro:', err);
    res.status(500).json({ erro: err.message });
  }
});

// 10. FAZER DOWNLOAD DE EXPORT
app.get('/api/download-export/:filename', (req, res) => {
  try {
    const { filename } = req.params;
    const caminhoArquivo = path.join(__dirname, 'powerbi-exports', filename);

    // Validar para evitar path traversal
    if (!caminhoArquivo.startsWith(path.join(__dirname, 'powerbi-exports'))) {
      return res.status(403).json({ erro: 'Acesso negado' });
    }

    if (!fs.existsSync(caminhoArquivo)) {
      return res.status(404).json({ erro: 'Arquivo não encontrado' });
    }

    res.download(caminhoArquivo);
  } catch (err) {
    console.error('Erro:', err);
    res.status(500).json({ erro: err.message });
  }
});

// ============ INICIAR SERVIDOR ============

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
  console.log(`📊 JSON exports salvos em: ./powerbi-exports/`);
});
