// test-endpoints.js - Testar endpoints da API

const http = require('http');

const BASE_URL = 'http://localhost:3000';

// Cores para console
const cores = {
  reset: '\x1b[0m',
  verde: '\x1b[32m',
  vermelho: '\x1b[31m',
  amarelo: '\x1b[33m',
  azul: '\x1b[34m'
};

// Função para fazer requisições HTTP
function fazerRequisicao(metodo, endpoint, dados = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE_URL + endpoint);
    const opcoes = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: metodo,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(opcoes, (res) => {
      let dados_resposta = '';
      res.on('data', chunk => dados_resposta += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(dados_resposta);
          resolve({ status: res.statusCode, dados: json });
        } catch {
          resolve({ status: res.statusCode, dados: dados_resposta });
        }
      });
    });

    req.on('error', reject);

    if (dados) {
      req.write(JSON.stringify(dados));
    }
    req.end();
  });
}

// Testes
async function executarTestes() {
  console.log(`\n${cores.azul}${'='.repeat(60)}${cores.reset}`);
  console.log(`${cores.azul}🧪 TESTES DE ENDPOINTS - PETRONECT PPE${cores.reset}`);
  console.log(`${cores.azul}${'='.repeat(60)}${cores.reset}\n`);

  let userId = null;
  let sucessos = 0;
  let falhas = 0;

  // Teste 1: Criar Usuário
  console.log(`${cores.amarelo}[1/7] Testando POST /api/usuarios${cores.reset}`);
  try {
    const resUsuario = await fazerRequisicao('POST', '/api/usuarios', {
      cnpj: '11.222.333/0001-81',
      razao_social: 'Empresa Teste XYZ',
      email: 'teste@empresa.com.br',
      telefone: '(11) 99999-9999',
      endereco: 'Rua Teste, 123, São Paulo - SP',
      ie: '123.456.789.012',
      tributacao: 'simples',
      segmento: 'Petróleo'
    });

    if (resUsuario.status === 200 && resUsuario.dados.user_id) {
      userId = resUsuario.dados.user_id;
      console.log(`${cores.verde}✅ Usuário criado com sucesso! ID: ${userId}${cores.reset}\n`);
      sucessos++;
    } else {
      console.log(`${cores.vermelho}❌ Erro ao criar usuário${cores.reset}\n`);
      falhas++;
    }
  } catch (err) {
    console.log(`${cores.vermelho}❌ Erro de conexão: ${err.message}${cores.reset}\n`);
    falhas++;
  }

  if (!userId) {
    console.log(`${cores.vermelho}Abortando testes - Usuário não foi criado${cores.reset}`);
    return;
  }

  // Teste 2: Adicionar Representantes
  console.log(`${cores.amarelo}[2/7] Testando POST /api/representantes${cores.reset}`);
  try {
    const resRep = await fazerRequisicao('POST', '/api/representantes', {
      user_id: userId,
      representantes: [
        {
          nome: 'João da Silva',
          cpf: '123.456.789-00',
          cargo: 'Sócio-Administrador',
          email: 'joao@empresa.com.br',
          telefone: '(11) 98888-8888'
        }
      ]
    });

    if (resRep.status === 200) {
      console.log(`${cores.verde}✅ Representante adicionado com sucesso!${cores.reset}\n`);
      sucessos++;
    } else {
      console.log(`${cores.vermelho}❌ Erro ao adicionar representante${cores.reset}\n`);
      falhas++;
    }
  } catch (err) {
    console.log(`${cores.vermelho}❌ Erro: ${err.message}${cores.reset}\n`);
    falhas++;
  }

  // Teste 3: Atualizar Preferências
  console.log(`${cores.amarelo}[3/7] Testando POST /api/preferencias${cores.reset}`);
  try {
    const resPref = await fazerRequisicao('POST', '/api/preferencias', {
      user_id: userId,
      aceita_lgpd: true,
      aceita_alertas: true
    });

    if (resPref.status === 200) {
      console.log(`${cores.verde}✅ Preferências atualizadas com sucesso!${cores.reset}\n`);
      sucessos++;
    } else {
      console.log(`${cores.vermelho}❌ Erro ao atualizar preferências${cores.reset}\n`);
      falhas++;
    }
  } catch (err) {
    console.log(`${cores.vermelho}❌ Erro: ${err.message}${cores.reset}\n`);
    falhas++;
  }

  // Teste 4: Rastrear Acesso
  console.log(`${cores.amarelo}[4/7] Testando POST /api/rastrear-acesso${cores.reset}`);
  try {
    const resAcesso = await fazerRequisicao('POST', '/api/rastrear-acesso', {
      user_id: userId,
      pagina: '/pré-qualificação',
      duracao_segundos: 125
    });

    if (resAcesso.status === 200) {
      console.log(`${cores.verde}✅ Acesso rastreado com sucesso!${cores.reset}\n`);
      sucessos++;
    } else {
      console.log(`${cores.vermelho}❌ Erro ao rastrear acesso${cores.reset}\n`);
      falhas++;
    }
  } catch (err) {
    console.log(`${cores.vermelho}❌ Erro: ${err.message}${cores.reset}\n`);
    falhas++;
  }

  // Teste 5: Rastrear Clique
  console.log(`${cores.amarelo}[5/7] Testando POST /api/rastrear-clique${cores.reset}`);
  try {
    const resClique = await fazerRequisicao('POST', '/api/rastrear-clique', {
      user_id: userId,
      elemento: 'btn-enviar',
      pagina: '/pré-qualificação',
      pos_x: 520,
      pos_y: 340
    });

    if (resClique.status === 200) {
      console.log(`${cores.verde}✅ Clique rastreado com sucesso!${cores.reset}\n`);
      sucessos++;
    } else {
      console.log(`${cores.vermelho}❌ Erro ao rastrear clique${cores.reset}\n`);
      falhas++;
    }
  } catch (err) {
    console.log(`${cores.vermelho}❌ Erro: ${err.message}${cores.reset}\n`);
    falhas++;
  }

  // Teste 6: Dashboard 1
  console.log(`${cores.amarelo}[6/7] Testando GET /api/dashboard-1${cores.reset}`);
  try {
    const resDash1 = await fazerRequisicao('GET', '/api/dashboard-1');

    if (resDash1.status === 200 && resDash1.dados.totalUsuarios !== undefined) {
      console.log(`${cores.verde}✅ Dashboard 1 respondendo!${cores.reset}`);
      console.log(`   Total de usuários: ${resDash1.dados.totalUsuarios}\n`);
      sucessos++;
    } else {
      console.log(`${cores.vermelho}❌ Erro ao buscar dashboard 1${cores.reset}\n`);
      falhas++;
    }
  } catch (err) {
    console.log(`${cores.vermelho}❌ Erro: ${err.message}${cores.reset}\n`);
    falhas++;
  }

  // Teste 7: Lista Exports
  console.log(`${cores.amarelo}[7/7] Testando GET /api/lista-exports${cores.reset}`);
  try {
    const resExports = await fazerRequisicao('GET', '/api/lista-exports');

    if (resExports.status === 200) {
      console.log(`${cores.verde}✅ Exports listados com sucesso!${cores.reset}`);
      console.log(`   Quantidade de exports: ${resExports.dados.exports.length}\n`);
      sucessos++;
    } else {
      console.log(`${cores.vermelho}❌ Erro ao listar exports${cores.reset}\n`);
      falhas++;
    }
  } catch (err) {
    console.log(`${cores.vermelho}❌ Erro: ${err.message}${cores.reset}\n`);
    falhas++;
  }

  // Resultado Final
  console.log(`${cores.azul}${'='.repeat(60)}${cores.reset}`);
  console.log(`${cores.azul}📊 RESULTADO FINAL${cores.reset}`);
  console.log(`${cores.azul}${'='.repeat(60)}${cores.reset}`);
  console.log(`${cores.verde}✅ Sucessos: ${sucessos}/7${cores.reset}`);
  console.log(`${cores.vermelho}❌ Falhas: ${falhas}/7${cores.reset}\n`);

  if (falhas === 0) {
    console.log(`${cores.verde}🎉 TODOS OS TESTES PASSARAM! Sistema pronto para usar.${cores.reset}\n`);
  } else {
    console.log(`${cores.amarelo}⚠️  Verifique os erros acima.${cores.reset}\n`);
  }
}

// Executar
console.log(`${cores.amarelo}Aguardando servidor estar online...${cores.reset}`);
setTimeout(executarTestes, 2000);
