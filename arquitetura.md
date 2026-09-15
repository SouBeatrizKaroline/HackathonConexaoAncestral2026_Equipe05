# Arquitetura da aplicação

A solução adota uma arquitetura em microsserviços Serverless, que segue uma lógica de criação de uma área de autenticação focada em alimentar um banco de dados para entender quem são os usuários e quais os segmentos deles.
Além disso, o javascript coleta dados de cliques dos usuários, tempo logado na plataforma de forma que ajude a petronet a ter parâmetros sobre a área de licitações, sem esquecer da segurança dos dados:

┌─────────────────────────────────────┐
│ PÁGINA DE ENTRADA (Petronect) │
│ ├─ Coleta interesses do visitante │
│ ├─ Cadastro/Login │
│ ├─ Rastreia tempo em página │
│ └─ Rastreia cliques em elementos │
└──────────────┬──────────────────────┘
│
┌─────────┴─────────┐
│ │
▼ ▼
┌──────────────┐ ┌──────────────┐
│ API Acesso │ │ API Clique │
│ (tempo/pág) │ │ (elemento) │
└──────┬───────┘ └───────┬──────┘
│ │
└────────┬───────────┘
▼
┌─────────────────┐
│ BANCO DE DADOS │
│ ├─ usuarios │
│ ├─ interesses │
│ ├─ login_hist │
│ ├─ acessos │
│ └─ cliques │
└────────┬────────┘
│
┌─────────┴──────────┐
│ │
▼ ▼
┌──────────────┐ ┌──────────────┐
│ JSON Export │ │ API Endpoints│
│ (snapshot) │ │ (time real) │
└────┬─────────┘ └──────┬───────┘
│ │
▼ ▼
┌──────────────┐ ┌──────────────┐
│ PowerBI │ │ Dashboard 2 │
│ (Relatórios) │ │ (Análises) │
└──────────────┘ └──────────────┘


---

## 📊 Fluxo de Dados

### 1. Coleta de Dados (Front-end)

**Locais onde dados são capturados:**

- **Página de Entrada**: Tempo despendido selecionando interesses, cliques em botões
- **Cadastro/Login**: Tempo preenchendo formulário, cliques em campos e botões
- **Área de Oportunidades**: Tempo em cada oportunidade, cliques em links e filtros
- **Dashboards Internos**: Navegação e interações dos usuários
- **Segurança**: Cookies de sessão e captcha com bloqueio de login.

**Dados Coletados:**

```javascript
// Acesso (tempo em página)
{
  user_id: 123,
  pagina: "/oportunidades",
  data_acesso: "2026-09-14T14:30:00Z",
  duracao_segundos: 245
}

// Clique (interação com elementos)
{
  user_id: 123,
  elemento: "botao-candidatar",
  pagina: "/oportunidade/456",
  data_clique: "2026-09-14T14:32:15Z",
  posicao_x: 520,
  posicao_y: 340
}
```

---

## 💾 Banco de Dados

### Tabelas Principais

| Tabela | Descrição | Uso |
|--------|-----------|-----|
| `usuarios` | Dados básicos do usuário (nome, email, data cadastro) | Dashboard 1, PowerBI |
| `interesses` | Segmento/setor selecionado por usuário | Dashboard 1, PowerBI |
| `login_history` | Registro de logins (data, IP) | Dashboard 1, Dashboard 2 |
| `acessos` | Tempo gasto em cada página | Dashboard 2 |
| `cliques` | Registro de cliques em elementos | Dashboard 2 |

---

## 📈 Dashboards

### Dashboard 1: Usuários & Segmentos
**Acesso**: Área de Login / Menu Principal

**Informações:**
- Total de usuários cadastrados
- Distribuição por segmento/setor
- Lista de usuários recentes
- Taxa de crescimento

**Fonte de Dados**: 
- Arquivo JSON exportável (snapshot)
- Dados: tabelas `usuarios`, `interesses`, `login_history`

**Exportação**:
- Botão para download de JSON
- Arquivo alimenta PowerBI diretamente

### Dashboard 2: Acessos & Cliques
**Acesso**: Área de Análise / Menu Principal

**Informações:**
- Quantidade total de acessos
- Tempo médio de tela (média, máximo, mínimo)
- Acessos por página
- Elementos mais clicados
- Taxa de cliques por página

**Filtros:**
- Por mês
- Por dia
- Por ano
- Combinações (ex: mês + ano)

**Fonte de Dados**: 
- APIs em tempo real
- Consultas dinâmicas ao banco
- Dados: tabelas `acessos`, `cliques`, `login_history`

---

