#!/bin/bash

# quick-start.sh - Script para iniciar o projeto rapidamente

echo "🚀 Petronect PPE - Quick Start"
echo "======================================="
echo ""

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Verificar Node.js
echo -e "${YELLOW}[1/5] Verificando Node.js...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js não instalado. Instale em: https://nodejs.org${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Node.js encontrado: $(node -v)${NC}\n"

# Verificar MariaDB
echo -e "${YELLOW}[2/5] Verificando MariaDB...${NC}"
if ! command -v mysql &> /dev/null; then
    echo -e "${RED}❌ MariaDB não instalado. Instale em: https://mariadb.org${NC}"
    exit 1
fi
echo -e "${GREEN}✅ MariaDB encontrado${NC}\n"

# Renomear arquivos
echo -e "${YELLOW}[3/5] Preparando arquivos...${NC}"
if [ -f "index-integrado.html" ]; then
    mv index-integrado.html index.html
    echo -e "${GREEN}✅ index.html pronto${NC}"
fi

if [ -f "script-integrado.js" ]; then
    mv script-integrado.js script.js
    echo -e "${GREEN}✅ script.js pronto${NC}"
fi

if [ -f "app-integrado.js" ]; then
    mv app-integrado.js app.js
    echo -e "${GREEN}✅ app.js pronto${NC}"
fi

if [ -f "package-completo.json" ]; then
    cp package-completo.json package.json
    echo -e "${GREEN}✅ package.json atualizado${NC}"
fi
echo ""

# Instalar dependências
echo -e "${YELLOW}[4/5] Instalando dependências...${NC}"
npm install --quiet
echo -e "${GREEN}✅ Dependências instaladas${NC}\n"

# Criar .env
echo -e "${YELLOW}[5/5] Criando arquivo .env...${NC}"
if [ ! -f ".env" ]; then
    cp .env.example .env
    echo -e "${GREEN}✅ .env criado (edite com suas credenciais)${NC}"
else
    echo -e "${GREEN}✅ .env já existe${NC}"
fi
echo ""

# Criar banco de dados
echo -e "${YELLOW}Criando banco de dados...${NC}"
read -p "Digite a senha do root do MariaDB (deixe em branco se não houver): " senha

if [ -z "$senha" ]; then
    mysql -u root < schema.sql
else
    mysql -u root -p"$senha" < schema.sql
fi

echo -e "${GREEN}✅ Banco de dados criado${NC}\n"

# Mensagem final
echo "======================================="
echo -e "${GREEN}🎉 PRONTO PARA COMEÇAR!${NC}"
echo "======================================="
echo ""
echo "Próximos passos:"
echo "1️⃣  Abra .env e configure com suas credenciais"
echo "2️⃣  Execute: npm start"
echo "3️⃣  Acesse: http://localhost:3000"
echo "4️⃣  Para testar endpoints: npm test"
echo ""
echo -e "${GREEN}Boa sorte no Hackathon! 🚀${NC}"
