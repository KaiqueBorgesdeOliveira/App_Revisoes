# Sistema de Revisão de Salas - UOL

Sistema web para gerenciamento e controle de revisões de salas de reunião, desenvolvido para os escritórios do Grupo UOL.

## Descrição

Aplicação desenvolvida para facilitar o processo de revisão diária das salas de reunião, permitindo o registro do estado dos equipamentos, documentação fotográfica e geração de relatórios históricos.

## Funcionalidades Principais

### Gerenciamento de Salas
- Cadastro de salas por escritório e andar
- Organização por localidade (MG, SP, RJ)
- Controle de capacidade máxima de salas por andar
- Exclusão individual ou em lote

### Sistema de Revisão
- Checklist de equipamentos:
  - TV
  - Controle remoto
  - Ramal telefônico
  - Sistema de videoconferência
  - Manual de uso
  - Monitor adicional
- Campo de observações
- Captura de foto via câmera ou upload
- Registro automático de data e hora

### Histórico e Relatórios
- Visualização completa do histórico de revisões
- Filtro por período (data inicial e final)
- Seleção múltipla de revisões
- Exportação em diversos formatos:
  - JSON (dados estruturados)
  - CSV (compatível com Excel)
  - PDF (via impressão do navegador)
  - Impressão direta

### Filtros e Busca
- Busca por número de sala
- Filtro por escritório/localidade
- Filtro por andar
- Botão para limpar todos os filtros

### Indicadores Visuais
- Badge verde: sala com revisão realizada
- Badge vermelho: sala sem revisão
- Contadores de salas e revisões
- Status dos equipamentos por cores

## Tecnologias Utilizadas

### Frontend
- HTML5
- CSS3 (design responsivo)
- JavaScript (ES6+)
- Bootstrap 5.3.0
- Font Awesome 6.4.0

### Armazenamento
- LocalStorage (navegador)
- Não requer banco de dados ou servidor

### APIs do Navegador
- MediaDevices API (acesso à câmera)
- FileReader API (processamento de imagens)
- Blob API (geração de arquivos)

## Estrutura do Projeto

```
Projeto Revisões/
├── public/
│   ├── index.html              # Página principal
│   ├── styles.css              # Estilos globais
│   ├── js/
│   │   ├── salas.js           # Lógica principal
│   │   └── escritorios.js     # Configuração de escritórios
│   └── assets/
│       └── logo-uol.png       # Logo corporativa
└── README.md
```

## Instalação e Uso

### Requisitos
- Navegador web moderno (Chrome, Firefox, Edge, Safari)
- Suporte a JavaScript habilitado
- Permissão de acesso à câmera (opcional)

### Instalação Local

1. Clone ou baixe o repositório
```bash
git clone [url-do-repositorio]
cd "Projeto Revisões"
```

2. Abra o arquivo `index.html` diretamente no navegador
```bash
# Windows
start public/index.html

# Linux/Mac
open public/index.html
```

Não é necessário servidor web ou instalação de dependências.

## Configuração de Escritórios

As configurações de escritórios e andares estão no arquivo `public/js/escritorios.js`:

```javascript
const escritoriosConfig = {
    'MG': {
        nome: 'Belo Horizonte - MG',
        andares: {
            '8': { maxSalas: 10 },
            '9': { maxSalas: 10 },
            '10': { maxSalas: 4 }
        }
    },
    // ... outros escritórios
};
```

Para adicionar novo escritório ou andar, edite este arquivo seguindo o padrão existente.

## Fluxo de Uso

1. **Adicionar Salas**
   - Clique em "Adicionar Sala"
   - Selecione escritório e andar
   - O número da sala é gerado automaticamente
   - Confirme para criar

2. **Realizar Revisão**
   - Localize a sala desejada (use filtros se necessário)
   - Clique em "Revisar"
   - Marque os equipamentos presentes
   - Adicione observações (opcional)
   - Tire/anexe foto (opcional)
   - Salve a revisão

3. **Consultar Histórico**
   - Clique em "Histórico" na sala desejada
   - Use filtros de data se necessário
   - Selecione revisões para exportar
   - Escolha o formato de exportação

4. **Exportar Dados**
   - Selecione as revisões desejadas
   - Clique no botão de exportação preferido
   - O arquivo será baixado automaticamente

## Armazenamento de Dados

### LocalStorage
Todos os dados são armazenados localmente no navegador usando `localStorage`:

- Chave: `revisoes_salas_cache_v1`
- Formato: JSON
- Persistência: permanece até limpeza manual do cache

### Backup Manual
Para fazer backup dos dados:
1. Abra o Console do navegador (F12)
2. Execute: `localStorage.getItem('revisoes_salas_cache_v1')`
3. Copie e salve o conteúdo em arquivo .json

### Restauração
Para restaurar backup:
1. Abra o Console do navegador (F12)
2. Execute: `localStorage.setItem('revisoes_salas_cache_v1', '[conteúdo-do-backup]')`
3. Recarregue a página

## Compatibilidade

### Navegadores Suportados
- Google Chrome 90+
- Mozilla Firefox 88+
- Microsoft Edge 90+
- Safari 14+
- Opera 76+

### Dispositivos
- Desktop (Windows, Mac, Linux)
- Tablets
- Smartphones (interface responsiva)

### Recursos Opcionais
- Câmera: necessária apenas para captura de fotos
- Impressora: necessária apenas para função de impressão

## Segurança e Privacidade

- Dados armazenados apenas localmente no dispositivo
- Nenhuma informação enviada para servidores externos
- Fotos armazenadas em Base64 no navegador
- Acesso à câmera requer permissão explícita do usuário

## Limitações Conhecidas

- Armazenamento limitado pelo navegador (geralmente 5-10 MB)
- Dados não sincronizados entre dispositivos
- Backup manual necessário para preservar histórico
- Fotos em alta resolução podem ocupar muito espaço

## Manutenção

### Limpeza de Dados
Para limpar todos os dados armazenados:
```javascript
localStorage.removeItem('revisoes_salas_cache_v1');
location.reload();
```

### Atualização de Versão
Para atualizar a versão do cache (forçar migração):
1. Altere `STORAGE_KEY` em `salas.js`
2. Implemente função de migração se necessário

## Suporte Técnico

### Problemas Comuns

**Dados não aparecem:**
- Verifique o Console (F12) por erros JavaScript
- Limpe o cache do navegador
- Certifique-se de que o LocalStorage não foi limpo

**Erro ao acessar a câmera:**
- Verifique as permissões do navegador
- Assegure-se de que nenhum outro aplicativo está usando a câmera

**Problemas na exportação de dados:**
- Tente novamente após garantir que há dados suficientes
- Verifique se o navegador permite downloads automáticos

### Contato para Suporte
- **E-mail**: suporte@uol.com.br
- **Telefone**: 11 9999-9999
- **Horário**: Segunda a Sexta, 9h às 18h

---

## Atualizações e Novas Funcionalidades

Versão 1.0.0:
- Lançamento inicial do sistema


Próximas versões:
- Integração com sistemas de calendário
- Notificações de manutenção programada
- Relatórios personalizados por usuário
- Melhoria na interface de usuário (UX)

Fique atento às atualizações para aproveitar novas funcionalidades e melhorias de desempenho!



