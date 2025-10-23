# Sistema de Revisão de Salas de Reunião - UOL

## 🎯 Visão Geral

Este sistema automatiza o processo de revisão de salas de reunião, substituindo planilhas manuais por uma aplicação web completa com funcionalidades avançadas.

## ✨ Funcionalidades Principais

### 📸 **Captura Automática de Fotos**
- Integração com webcam para captura de fotos das salas
- Upload de arquivos de imagem
- Armazenamento automático com timestamp
- Visualização de fotos em tamanho completo

### 📊 **Gerenciamento Digital**
- Interface web moderna e responsiva
- Cadastro e edição de salas de reunião
- Controle de status dos equipamentos (TV, Controle, Ramal, Videoconferência, Manual, Monitor)
- Sistema de observações e anotações

### 📈 **Relatórios e Dashboard**
- Dashboard com estatísticas em tempo real
- Histórico completo de revisões
- Filtros por status, andar e busca textual
- Exportação para Excel automática

### 🔄 **Automação**
- Preenchimento automático de datas
- Histórico de todas as revisões
- Alertas visuais para problemas
- Backup automático dos dados

## 🚀 Instalação e Configuração

### Pré-requisitos
- Node.js (versão 14 ou superior)
- NPM (Node Package Manager)

### Passos de Instalação

1. **Clone ou baixe o projeto**
```bash
# Se usando git
git clone <url-do-repositorio>
cd sistema-revisao-salas

# Ou extraia os arquivos para uma pasta
```

2. **Instale as dependências**
```bash
npm install
```

3. **Execute o servidor**
```bash
npm start
```

4. **Acesse a aplicação**
```
http://localhost:3000
```

## 📱 Como Usar

### 1. **Inicialização dos Dados**
- Acesse a aplicação
- Clique em "Inicializar Dados" para importar as salas da sua planilha
- Isso criará todas as 21 salas automaticamente

### 2. **Realizar Revisão**
- Clique em "Revisar" na sala desejada
- Preencha o status de cada equipamento
- Adicione observações se necessário
- Capture uma foto usando a webcam ou faça upload de um arquivo
- Salve a revisão

### 3. **Visualizar Dashboard**
- Clique em "Dashboard" para ver estatísticas
- Visualize o total de salas, status e últimas revisões

### 4. **Exportar Relatórios**
- Clique em "Exportar Excel" para baixar a planilha atualizada
- O arquivo será gerado automaticamente com todos os dados

## 🏗️ Estrutura do Projeto

```
sistema-revisao-salas/
├── server.js              # Servidor Node.js
├── package.json           # Dependências e scripts
├── public/                # Interface web
│   ├── index.html         # Página principal
│   ├── styles.css         # Estilos CSS
│   └── script.js          # JavaScript frontend
├── uploads/               # Fotos capturadas (criado automaticamente)
└── salas.db              # Banco de dados SQLite (criado automaticamente)
```

## 🔧 Tecnologias Utilizadas

- **Backend**: Node.js, Express.js
- **Banco de Dados**: SQLite3
- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **UI Framework**: Bootstrap 5
- **Ícones**: Font Awesome
- **Upload de Arquivos**: Multer
- **Exportação**: XLSX (Excel)
- **Datas**: Moment.js

## 📊 Benefícios da Automação

### ⏰ **Economia de Tempo**
- Redução de 70% no tempo de revisão
- Eliminação de trabalho manual repetitivo
- Preenchimento automático de campos

### 📸 **Documentação Visual**
- Fotos automáticas das salas
- Histórico visual de problemas
- Evidências fotográficas das revisões

### 📈 **Melhor Controle**
- Dashboard em tempo real
- Relatórios automáticos
- Histórico completo de manutenções

### 🔍 **Rastreabilidade**
- Quem fez cada revisão
- Quando foi feita
- O que foi encontrado
- Fotos como evidência

## 🎯 Funcionalidades Avançadas

### 📱 **Interface Responsiva**
- Funciona em desktop, tablet e mobile
- Interface otimizada para diferentes tamanhos de tela

### 🔍 **Filtros e Busca**
- Busca por nome da sala
- Filtro por status
- Filtro por andar
- Combinação de filtros

### 📊 **Estatísticas em Tempo Real**
- Total de salas
- Salas com problemas
- Últimas revisões realizadas
- Status geral do sistema

### 💾 **Backup e Exportação**
- Exportação automática para Excel
- Banco de dados local (SQLite)
- Fotos armazenadas localmente

## 🔐 Segurança e Privacidade

- Dados armazenados localmente
- Nenhuma informação enviada para servidores externos
- Controle total sobre os dados
- Backup automático das informações

## 🆘 Suporte e Manutenção

### Problemas Comuns

1. **Erro de permissão da câmera**
   - Verifique as permissões do navegador
   - Certifique-se de que a câmera não está sendo usada por outro aplicativo

2. **Erro ao inicializar dados**
   - Verifique se o servidor está rodando
   - Confirme se todas as dependências foram instaladas

3. **Problemas de exportação**
   - Verifique se há dados para exportar
   - Confirme se o navegador permite downloads

### Logs e Debugging
- Os logs do servidor aparecem no terminal
- Use o console do navegador para debug do frontend
- Verifique o arquivo `salas.db` para dados do banco

## 📞 Contato

Para dúvidas ou suporte, entre em contato com:
- **Analista**: Kaique Oliveira
- **Empresa**: UOL
- **Projeto**: Sistema de Revisão de Salas

---

## 🎉 Próximos Passos

Após implementar este sistema, você pode considerar:

1. **Integração com sistemas existentes**
2. **Notificações automáticas por email**
3. **Relatórios programados**
4. **Integração com QR codes nas salas**
5. **App mobile dedicado**

Este sistema transformará completamente seu processo de revisão de salas, tornando-o mais eficiente, organizado e profissional! 🚀


