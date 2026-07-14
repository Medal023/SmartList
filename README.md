# SmartList 🛒

SmartList é um gerenciador inteligente de listas de compras projetado para simplificar e otimizar suas compras de supermercado. Ele possui uma interface minimalista e fluida, recursos de compartilhamento rápido, estatísticas detalhadas de categorias e gastos, sincronização robusta com Firestore e suporte completo a modo offline.

Além disso, o SmartList é potencializado por Inteligência Artificial (Gemini 3.5 Flash) para sugerir produtos relevantes, fazer parsing de notas fiscais via OCR e processar texto livre em listas estruturadas.

---

## ✨ Funcionalidades Principais

*   **Listas de Compras Inteligentes:** Crie, edite e compartilhe listas facilmente com amigos ou familiares.
*   **Inteligência Artificial Integrada:**
    *   **Sugestões Inteligentes:** Sugere produtos ideais baseados no título ou contexto de sua lista de compras.
    *   **Scanner OCR de Cupons:** Faça upload da imagem do cupom fiscal e extraia automaticamente todos os itens comprados (com marca, quantidade, categoria e preço pago).
    *   **Importação por Texto:** Digite ou cole uma lista informal de produtos e a IA estruturará tudo com quantidades, unidades, marcas e categorias automáticas.
*   **Estatísticas Detalhadas:** Gráficos modernos de crescimento de cadastros de usuários e distribuição de produtos por categorias.
*   **Arquitetura Offline-First:** Funciona de forma totalmente offline! Todo o seu progresso é mantido localmente e sincronizado silenciosamente com a nuvem quando houver conexão estável.
*   **Painel Super Admin:** Visão de nível administrativo para monitorar o crescimento dos cadastros e auditar a distribuição de itens de compras.

---

## 🛠️ Tecnologias Utilizadas

*   **Frontend:** React (v19) + Vite + TypeScript + Tailwind CSS + Lucide Icons + Motion (Framer Motion)
*   **Backend:** Node.js + Express (com roteamento proxy seguro para ocultar as credenciais da API Gemini)
*   **Nuvem & Banco de Dados:** Firebase Client SDK (Firestore com persistência local em multi-tab, Authentication e Storage)
*   **Inteligência Artificial:** SDK Oficial `@google/genai` (Gemini 3.5 Flash)

---

## 🚀 Como Executar Localmente

### Pré-requisitos
*   Node.js (versão 18 ou superior)
*   npm (gerenciador de pacotes padrão)

### 1. Clonar o Repositório
```bash
git clone https://github.com/SEU_USUARIO/smartlist.git
cd smartlist
```

### 2. Instalar as Dependências
Instale as dependências declaradas no `package.json`:
```bash
npm install
```

### 3. Configurar as Variáveis de Ambiente
Crie um arquivo `.env` na raiz do projeto (copiando o exemplo fornecido em `.env.example`):
```bash
cp .env.example .env
```
Abra o arquivo `.env` e configure suas chaves de API com segurança:
```env
# Chave de API do Google Gemini
GEMINI_API_KEY="SUA_CHAVE_AQUI"

# URL da aplicação (opcional, configurada automaticamente em produção)
APP_URL="http://localhost:3000"
```

### 4. Executar em Modo de Desenvolvimento
Inicialize o servidor Express de desenvolvimento (que também serve o frontend dinamicamente via Vite middleware):
```bash
npm run dev
```
O servidor estará disponível na porta `3000`: [http://localhost:3000](http://localhost:3000)

---

## 📦 Compilação e Produção

### Realizar o Build
Para compilar tanto o frontend (estático em `/dist`) quanto o backend Express (compilado pelo `esbuild` em `/dist/server.cjs`), execute:
```bash
npm run build
```

### Executar em Produção
Após compilar o projeto, você pode inicializá-lo em modo standalone de produção:
```bash
npm run start
```

---

## 🔒 Segurança de Credenciais

Seguindo as melhores práticas de engenharia de software e segurança cibernética:
*   Todas as chaves de API sensíveis (como `GEMINI_API_KEY`) são mantidas **exclusivamente no servidor** em variáveis de ambiente, nunca expostas no código do navegador.
*   Roteamentos proxy `/api/*` lidam com todas as chamadas de IA.
*   O arquivo `.gitignore` está configurado para nunca subir arquivos `.env` ou pastas temporárias para o GitHub.

---

## 📄 Licença

Este projeto está licenciado sob a Licença MIT - consulte o arquivo [LICENSE](./LICENSE) para obter detalhes.

---

## 👤 Autor

*   **Alison Vitório Medal** - [alisonvitoriomedal@gmail.com](mailto:alisonvitoriomedal@gmail.com)
