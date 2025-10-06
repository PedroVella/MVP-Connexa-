# MVP Connexa API

API para cadastro de usuários com Express.js e PostgreSQL, incluindo hash de senhas com bcrypt.

## 🚀 Funcionalidades

### **Autenticação e Usuários:**
- ✅ Cadastro de usuários com validação de dados
- 🔐 Hash seguro de senhas com bcrypt (12 rounds)
- 📧 Validação de email institucional
- 🎓 Integração com tabela de cursos
- 🔑 Autenticação JWT com tokens seguros
- 👤 Perfil de usuário protegido

### **Grupos de Estudos:**
- 📚 Criação de grupos de estudos
- 🗑️ Exclusão de grupos de estudos
- 👥 Sistema de membros e participantes
- 📖 Organização por matérias/disciplinas
- 🔗 Relacionamento entre usuários e grupos

### **Segurança e Qualidade:**
- 🛡️ Middleware de segurança (Helmet, CORS)
- ✨ Validação robusta de entrada de dados
- 🚨 Tratamento de erros personalizado
- 🔄 Renovação automática de tokens

## 📋 Pré-requisitos

- Node.js (versão 16 ou superior)
- PostgreSQL (versão 12 ou superior)
- npm ou yarn

## ⚡ Instalação

1. **Clone o repositório:**
   ```bash
   git clone https://github.com/PedroVella/MVP-Connexa-.git
   cd MVP-Connexa-
   ```

2. **Instale as dependências:**
   ```bash
   npm install
   ```

3. **Configure as variáveis de ambiente:**
   ```bash
   cp .env.example .env
   ```
   
   Edite o arquivo `.env` com suas configurações:
   ```env
   NODE_ENV=development
   PORT=3000
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=your_database_name
   DB_USER=your_username
   DB_PASSWORD=your_password
   BCRYPT_ROUNDS=12
   ```

4. **Configure o banco de dados PostgreSQL:**
   
   Execute os comandos SQL da seção [Estrutura do Banco de Dados](#-estrutura-do-banco-de-dados) abaixo.

## 🗄️ **Estrutura do Banco de Dados**

### **Tabelas Principais:**

#### **1. Tabela `courses` (Cursos):**
```sql
CREATE TABLE public.courses (
  id SERIAL NOT NULL,
  name CHARACTER VARYING(100) NULL,
  CONSTRAINT courses_pkey PRIMARY KEY (id)
) TABLESPACE pg_default;
```

#### **2. Tabela `profiles` (Usuários):**
```sql
CREATE TABLE public.profiles (
  id SERIAL NOT NULL,
  full_name TEXT NOT NULL,
  institutional_email TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  course_id INTEGER NOT NULL,
  current_semester INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_institutional_email_key UNIQUE (institutional_email),
  CONSTRAINT profiles_course_id_fkey FOREIGN KEY (course_id) REFERENCES courses (id)
) TABLESPACE pg_default;
```

#### **3. Tabela `study_groups` (Grupos de Estudos):**
```sql
CREATE TABLE public.study_groups (
  id SERIAL NOT NULL,
  name CHARACTER VARYING(100) NOT NULL,
  description TEXT NULL,
  subject CHARACTER VARYING(100) NULL,
  created_by INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NULL DEFAULT NOW(),
  is_active BOOLEAN NULL DEFAULT TRUE,
  CONSTRAINT study_groups_pkey PRIMARY KEY (id),
  CONSTRAINT study_groups_created_by_fkey FOREIGN KEY (created_by) REFERENCES profiles (id) ON DELETE CASCADE
) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_study_groups_created_by ON public.study_groups USING btree (created_by) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_study_groups_subject ON public.study_groups USING btree (subject) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_study_groups_active ON public.study_groups USING btree (is_active) TABLESPACE pg_default;
```

#### **4. Tabela `study_group_members` (Membros dos Grupos):**
```sql
CREATE TABLE public.study_group_members (
  id SERIAL NOT NULL,
  group_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  is_active BOOLEAN NULL DEFAULT TRUE,
  CONSTRAINT study_group_members_pkey PRIMARY KEY (id),
  CONSTRAINT study_group_members_unique UNIQUE (group_id, user_id),
  CONSTRAINT study_group_members_group_id_fkey FOREIGN KEY (group_id) REFERENCES study_groups (id) ON DELETE CASCADE,
  CONSTRAINT study_group_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles (id) ON DELETE CASCADE
) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_study_group_members_group_id ON public.study_group_members USING btree (group_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_study_group_members_user_id ON public.study_group_members USING btree (user_id) TABLESPACE pg_default;
```

### **Dados Iniciais (Opcional):**

#### **Inserir alguns cursos de exemplo:**
```sql
INSERT INTO public.courses (name) VALUES 
('Ciência da Computação'),
('Engenharia de Software'),
('Sistemas de Informação'),
('Engenharia Civil'),
('Administração'),
('Medicina'),
('Direito'),
('Psicologia');
```

### **Relacionamentos:**
```
courses ←→ profiles ←→ study_groups
                ↓
        study_group_members
```

## 🔄 Uso

### Iniciar o servidor

**Desenvolvimento (com auto-reload):**
```bash
npm run dev
```

**Produção:**
```bash
npm start
```

O servidor estará disponível em: `http://localhost:3000`

### 🔗 Endpoints da API

#### 1. Health Check
```http
GET /health
```

**Resposta:**
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2025-10-06T15:30:00.000Z",
  "environment": "development"
}
```

#### 2. Cadastro de Usuário
```http
POST /api/users/register
Content-Type: application/json
```

**Body:**
```json
{
  "full_name": "João Silva Santos",
  "institutional_email": "joao.santos@universidade.edu.br",
  "password": "MinhaSenh@123",
  "course_id": 1,
  "current_semester": 3
}
```

**Resposta de Sucesso (201):**
```json
{
  "success": true,
  "message": "Usuário cadastrado com sucesso",
  "data": {
    "user": {
      "id": 1,
      "full_name": "João Silva Santos",
      "institutional_email": "joao.santos@universidade.edu.br",
      "course_id": 1,
      "current_semester": 3,
      "created_at": "2025-10-06T15:30:00.000Z"
    }
  }
}
```

#### 3. Login de Usuário
```http
POST /api/users/login
Content-Type: application/json
```

**Body:**
```json
{
  "institutional_email": "joao.santos@universidade.edu.br",
  "password": "MinhaSenh@123"
}
```

**Resposta de Sucesso (200):**
```json
{
  "success": true,
  "message": "Login realizado com sucesso",
  "data": {
    "user": {
      "id": 1,
      "full_name": "João Silva Santos",
      "institutional_email": "joao.santos@universidade.edu.br",
      "course_id": 1,
      "current_semester": 3,
      "created_at": "2025-10-06T15:30:00.000Z",
      "course_name": "Ciência da Computação"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expires_in": "24h"
  }
}
```

#### 4. Renovar Token
```http
POST /api/users/refresh-token
Authorization: Bearer <token>
```

**Resposta:**
```json
{
  "success": true,
  "message": "Token renovado com sucesso",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expires_in": "24h"
  }
}
```

#### 5. Perfil do Usuário (Protegida)
```http
GET /api/users/profile
Authorization: Bearer <token>
```

**Resposta:**
```json
{
  "success": true,
  "message": "Perfil recuperado com sucesso",
  "data": {
    "user": {
      "id": 1,
      "full_name": "João Silva Santos",
      "institutional_email": "joao.santos@universidade.edu.br",
      "course_id": 1,
      "current_semester": 3,
      "created_at": "2025-10-06T15:30:00.000Z",
      "course_name": "Ciência da Computação"
    }
  }
}
```

#### 6. Listar Cursos
```http
GET /api/users/courses
```

**Resposta:**
```json
{
  "success": true,
  "message": "Cursos recuperados com sucesso",
  "data": {
    "courses": [
      {
        "id": 1,
        "name": "Ciência da Computação"
      },
      {
        "id": 2,
        "name": "Engenharia de Software"
      }
    ]
  }
}
```

#### 7. Documentação da API
```http
GET /api
```

## � Autenticação JWT

### Como usar o token JWT:

1. **Fazer login** para obter o token
2. **Incluir o token** nos headers das rotas protegidas:
   ```
   Authorization: Bearer <seu_token_jwt>
   ```

### Exemplos com curl:

**Login:**
```bash
curl -X POST http://localhost:3000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "institutional_email": "joao@universidade.edu.br",
    "password": "MinhaSenh@123"
  }'
```

**Acessar perfil (rota protegida):**
```bash
curl -X GET http://localhost:3000/api/users/profile \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Renovar token:**
```bash
curl -X POST http://localhost:3000/api/users/refresh-token \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Configuração JWT:

No arquivo `.env`, configure:
```env
JWT_SECRET=your_super_secret_jwt_key_here_min_32_chars
JWT_EXPIRES_IN=24h
```

⚠️ **IMPORTANTE:** Use uma chave secreta forte (mínimo 32 caracteres) em produção!

## �🛡️ Validações

### Cadastro de Usuário

- **Nome completo:** 2-255 caracteres, apenas letras e espaços
- **Email institucional:** Formato válido, deve terminar com `.edu.br` ou `.edu`
- **Senha:** Mínimo 8 caracteres, deve conter:
  - 1 letra minúscula
  - 1 letra maiúscula
  - 1 número
  - 1 caractere especial
- **Course ID:** Número inteiro positivo, deve existir na tabela `courses`
- **Semestre atual:** Número entre 1 e 20

## 🔐 Segurança

- **Bcrypt:** Hash de senhas com 12 rounds (configurável via `BCRYPT_ROUNDS`)
- **Helmet:** Headers de segurança HTTP
- **CORS:** Configurado para ambientes de desenvolvimento e produção
- **Validação:** Sanitização e validação robusta de entrada
- **Rate Limiting:** Recomendado implementar em produção

## 📂 Estrutura do Projeto

```
MVP-Connexa-/
├── config/
│   └── database.js          # Configuração do banco PostgreSQL
├── middleware/
│   ├── errorHandler.js      # Middleware de tratamento de erros
│   └── validation.js        # Middleware de validação
├── routes/
│   └── users.js            # Rotas de usuários
├── services/
│   └── userService.js      # Lógica de negócio dos usuários
├── .env.example            # Exemplo de variáveis de ambiente
├── package.json            # Dependências e scripts
├── README.md              # Este arquivo
└── server.js              # Arquivo principal do servidor
```

## 🐛 Tratamento de Erros

A API possui tratamento abrangente de erros:

- **400:** Dados de entrada inválidos
- **409:** Email já cadastrado
- **404:** Rota não encontrada
- **500:** Erros internos do servidor

Exemplo de resposta de erro:
```json
{
  "success": false,
  "message": "Dados de entrada inválidos",
  "errors": [
    {
      "field": "password",
      "message": "Senha deve ter pelo menos 8 caracteres",
      "value": "123"
    }
  ]
}
```

## 🧪 Testando a API

### Usando curl:

```bash
# Cadastrar usuário
curl -X POST http://localhost:3000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "Maria Silva",
    "institutional_email": "maria.silva@universidade.edu.br",
    "password": "MinhaSenh@123",
    "course_id": 1,
    "current_semester": 2
  }'

# Listar cursos
curl http://localhost:3000/api/users/courses
```

### Usando Postman:

1. Importe a coleção de endpoints
2. Configure o ambiente para `http://localhost:3000`
3. Teste os endpoints de cadastro e listagem

## 📦 Dependências Principais

- **express:** Framework web
- **pg:** Driver PostgreSQL
- **bcrypt:** Hash de senhas
- **express-validator:** Validação de dados
- **cors:** Cross-Origin Resource Sharing
- **helmet:** Segurança HTTP
- **dotenv:** Variáveis de ambiente

## 🚀 Próximos Passos

- [ ] Autenticação JWT
- [ ] Middleware de rate limiting
- [ ] Logs estruturados
- [ ] Testes unitários e de integração
- [ ] Documentação OpenAPI/Swagger
- [ ] Docker containerization

## 📄 Licença

ISC License

## 👥 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request
