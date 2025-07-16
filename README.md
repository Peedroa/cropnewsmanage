# News Scraper Manager

Aplicação React para navegar por pastas de recortes de jornais digitalizados, exibindo títulos e visualizando PDFs com base em arquivos JSON.

## 🚀 Deploy no Netlify

### Opção 1: Deploy via Git (Recomendado)

1. **Faça push do código para o GitHub:**
   ```bash
   git add .
   git commit -m "Preparando para deploy no Netlify"
   git push origin main
   ```

2. **Acesse o Netlify:**
   - Vá para [netlify.com](https://netlify.com)
   - Faça login ou crie uma conta

3. **Conecte o repositório:**
   - Clique em "New site from Git"
   - Escolha "GitHub"
   - Selecione seu repositório
   - Configure as opções de build:
     - **Build command:** `npm run build`
     - **Publish directory:** `dist`
   - Clique em "Deploy site"

### Opção 2: Deploy via Drag & Drop

1. **Faça o build localmente:**
   ```bash
   npm run build
   ```

2. **Acesse o Netlify:**
   - Vá para [netlify.com](https://netlify.com)
   - Arraste a pasta `dist` para a área de deploy

### ⚙️ Configurações Importantes

O arquivo `netlify.toml` já está configurado com:
- Comando de build: `npm run build`
- Diretório de publicação: `dist`
- Redirecionamentos para SPA
- Versão do Node.js: 18

## 🛠️ Desenvolvimento Local

```bash
# Instalar dependências
npm install

# Executar em modo desenvolvimento
npm run dev

# Build para produção
npm run build

# Preview do build
npm run preview
```

## 📁 Estrutura do Projeto

```
newsscrappermanage/
├── src/
│   ├── components/
│   │   ├── ThreeColumnLayout.tsx
│   │   └── InitialScreen.tsx
│   ├── services/
│   │   ├── fileService.ts
│   │   └── pdfService.ts
│   ├── types.ts
│   ├── App.tsx
│   └── App.css
├── netlify.toml
└── package.json
```

## 🎯 Funcionalidades

- **Navegação hierárquica**: Fontes → Títulos → Visualização
- **Visualização de PDFs**: Recortes individuais ou páginas inteiras
- **Busca e filtros**: Filtro de títulos por texto
- **Layout responsivo**: 3 colunas organizadas
- **Combinação de PDFs**: Múltiplos arquivos em um só visualizador

## 🔧 Tecnologias

- **React 19** com TypeScript
- **Vite** para build e desenvolvimento
- **PDF.js** para manipulação de PDFs
- **PDF-lib** para combinação de arquivos
- **File System Access API** para acesso a arquivos locais
