# Frontend MVP Connexa

Interface web simples e moderna para interagir com a API MVP Connexa.

## 🎨 Funcionalidades

- ✅ **Tela de Boas-vindas** - Landing page atrativa
- 🔐 **Login de Usuários** - Autenticação com JWT
- 📝 **Cadastro de Usuários** - Registro completo com validação
- 👤 **Perfil do Usuário** - Visualização dos dados do usuário
- 🔄 **Renovação de Token** - Atualização automática de sessão
- 📱 **Design Responsivo** - Funciona em desktop e mobile
- 🎯 **Validação em Tempo Real** - Feedback imediato nos formulários
- 🍞 **Notificações Toast** - Mensagens de sucesso/erro elegantes

## 🚀 Como Usar

### 1. Iniciar o Servidor
```bash
# Na pasta raiz do projeto
npm run dev
```

### 2. Acessar a Interface
Abra seu navegador e vá para:
```
http://localhost:3000
```

## 📱 Telas Disponíveis

### 🏠 **Tela Inicial (Welcome)**
- Apresentação do sistema
- Botões para login e cadastro
- Design moderno com gradiente

### 🔑 **Tela de Login**
- Campo de email institucional
- Campo de senha
- Validação de formulário
- Redirecionamento após login bem-sucedido

### 📝 **Tela de Cadastro**
- Nome completo
- Email institucional (validação .edu.br/.edu)
- Senha forte (validação em tempo real)
- Seleção de curso (carregado da API)
- Semestre atual
- Validações robustas

### 👤 **Tela de Perfil**
- Dados do usuário logado
- Informações do curso
- Data de cadastro
- Botão para renovar token
- Botão de logout

## 🎨 Recursos Visuais

### Design Moderno
- **Gradiente de cores** - Azul para roxo (#667eea → #764ba2)
- **Cards com sombra** - Efeito de profundidade
- **Animações suaves** - Transições CSS
- **Ícones Font Awesome** - Interface intuitiva

### Responsividade
- **Mobile First** - Otimizado para dispositivos móveis
- **Breakpoints** - Tablet (768px) e Desktop
- **Flexbox Layout** - Layout flexível e moderno

### UX/UI Features
- **Loading Overlay** - Indicador de carregamento
- **Toast Notifications** - Feedback visual para ações
- **Form Validation** - Validação em tempo real
- **Error Handling** - Tratamento de erros da API

## 🔧 Tecnologias Utilizadas

- **HTML5** - Estrutura semântica
- **CSS3** - Estilos modernos com Flexbox/Grid
- **JavaScript Vanilla** - Funcionalidade interativa
- **Font Awesome** - Ícones vetoriais
- **Fetch API** - Requisições HTTP
- **LocalStorage** - Persistência de token JWT

## 📋 Funcionalidades Implementadas

### Autenticação
- [x] Login com JWT
- [x] Cadastro de usuário
- [x] Logout
- [x] Renovação de token
- [x] Persistência de sessão (localStorage)

### Interface
- [x] Design responsivo
- [x] Animações e transições
- [x] Validação de formulários
- [x] Feedback visual (toast messages)
- [x] Loading states

### Integração API
- [x] Consumo de todas as rotas da API
- [x] Tratamento de erros HTTP
- [x] Headers de autenticação automáticos
- [x] Refresh token automático

## 🔒 Segurança Frontend

- **Token JWT** armazenado no localStorage
- **Headers de autenticação** automáticos
- **Validação client-side** (complementa validação do servidor)
- **Sanitização** de dados de entrada
- **Timeout de sessão** com renovação de token

## 📱 Compatibilidade

- ✅ **Chrome** (versões recentes)
- ✅ **Firefox** (versões recentes) 
- ✅ **Safari** (versões recentes)
- ✅ **Edge** (versões recentes)
- ✅ **Mobile browsers** (iOS Safari, Chrome Mobile)

## 🎯 Próximas Melhorias

- [ ] **Tema Escuro** - Toggle dark/light mode
- [ ] **PWA** - Progressive Web App
- [ ] **Offline Support** - Funcionalidade offline
- [ ] **Push Notifications** - Notificações do navegador
- [ ] **Multi-idioma** - Suporte para múltiplos idiomas
- [ ] **Acessibilidade** - Melhorias de a11y

## 🔧 Estrutura de Arquivos

```
frontend/
├── index.html          # Estrutura HTML principal
├── style.css           # Estilos CSS
├── script.js           # Lógica JavaScript
└── README.md          # Esta documentação
```

## 🚀 Deploy

Para deploy em produção:

1. **Configurar variáveis de ambiente**
2. **Atualizar API_BASE_URL** no script.js
3. **Minificar assets** (opcional)
4. **Servir via HTTPS** (recomendado)

## 📞 Suporte

Se encontrar algum problema:

1. Verifique se a API está rodando
2. Verifique o console do navegador para erros
3. Certifique-se de que o CORS está configurado
4. Teste as rotas da API diretamente

---

**MVP Connexa Frontend** - Interface moderna e intuitiva para o sistema de cadastro universitário! 🎓✨