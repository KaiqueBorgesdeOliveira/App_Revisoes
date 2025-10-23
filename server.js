const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const multer = require('multer');
const XLSX = require('xlsx');
const moment = require('moment');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

// Configuração do multer para upload de fotos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/fotos';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const timestamp = moment().format('YYYY-MM-DD_HH-mm-ss');
    const sala = req.body.sala || 'sala';
    cb(null, `${sala}_${timestamp}.jpg`);
  }
});

const upload = multer({ storage: storage });

// Inicializar banco de dados
const db = new sqlite3.Database('salas.db');

// Criar tabelas
db.serialize(() => {
  // Tabela de salas
  db.run(`
    CREATE TABLE IF NOT EXISTS salas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      escritorio TEXT NOT NULL,
      sala TEXT NOT NULL,
      andar TEXT NOT NULL,
      tv TEXT DEFAULT 'OK',
      controle TEXT DEFAULT 'OK',
      ramal TEXT DEFAULT 'N/A',
      videoconf TEXT DEFAULT 'OK',
      manual TEXT DEFAULT 'N/A',
      monitor TEXT DEFAULT 'OK',
      status TEXT DEFAULT 'Revisão OK',
      observacoes TEXT DEFAULT 'OK',
      data_revisao TEXT,
      troca_pilha_tv TEXT,
      analista TEXT,
      data_criacao TEXT DEFAULT CURRENT_TIMESTAMP,
      foto_path TEXT
    )
  `);

  // Tabela de histórico de revisões
  db.run(`
    CREATE TABLE IF NOT EXISTS historico_revisoes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sala_id INTEGER,
      data_revisao TEXT,
      analista TEXT,
      observacoes TEXT,
      foto_path TEXT,
      FOREIGN KEY (sala_id) REFERENCES salas (id)
    )
  `);
});

// Rotas da API

// Buscar todas as salas
app.get('/api/salas', (req, res) => {
  db.all('SELECT * FROM salas ORDER BY andar, sala', (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Buscar sala específica
app.get('/api/salas/:id', (req, res) => {
  const { id } = req.params;
  db.get('SELECT * FROM salas WHERE id = ?', [id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!row) {
      res.status(404).json({ error: 'Sala não encontrada' });
      return;
    }
    res.json(row);
  });
});

// Atualizar revisão de sala
app.put('/api/salas/:id', upload.single('foto'), (req, res) => {
  const { id } = req.params;
  const {
    tv, controle, ramal, videoconf, manual, monitor,
    status, observacoes, troca_pilha_tv, analista
  } = req.body;

  const dataRevisao = moment().format('YYYY-MM-DD');
  const fotoPath = req.file ? req.file.path : null;

  const sql = `
    UPDATE salas SET
      tv = ?, controle = ?, ramal = ?, videoconf = ?,
      manual = ?, monitor = ?, status = ?, observacoes = ?,
      data_revisao = ?, troca_pilha_tv = ?, analista = ?,
      foto_path = COALESCE(?, foto_path)
    WHERE id = ?
  `;

  db.run(sql, [
    tv, controle, ramal, videoconf, manual, monitor,
    status, observacoes, dataRevisao, troca_pilha_tv,
    analista, fotoPath, id
  ], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }

    // Salvar no histórico
    const historicoSql = `
      INSERT INTO historico_revisoes (sala_id, data_revisao, analista, observacoes, foto_path)
      VALUES (?, ?, ?, ?, ?)
    `;
    db.run(historicoSql, [id, dataRevisao, analista, observacoes, fotoPath]);

    res.json({ message: 'Revisão atualizada com sucesso', changes: this.changes });
  });
});

// Adicionar nova sala
app.post('/api/salas', (req, res) => {
  const {
    escritorio, sala, andar, tv, controle, ramal,
    videoconf, manual, monitor, status, observacoes
  } = req.body;

  const sql = `
    INSERT INTO salas (escritorio, sala, andar, tv, controle, ramal,
                      videoconf, manual, monitor, status, observacoes, data_revisao)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const dataRevisao = moment().format('YYYY-MM-DD');

  db.run(sql, [
    escritorio, sala, andar, tv, controle, ramal,
    videoconf, manual, monitor, status, observacoes, dataRevisao
  ], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ message: 'Sala adicionada com sucesso', id: this.lastID });
  });
});

// Exportar para Excel
app.get('/api/export/excel', (req, res) => {
  db.all('SELECT * FROM salas ORDER BY andar, sala', (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Revisão Salas');

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=revisao_salas_${moment().format('YYYY-MM-DD')}.xlsx`);
    res.send(buffer);
  });
});

// Buscar histórico de uma sala
app.get('/api/salas/:id/historico', (req, res) => {
  const { id } = req.params;
  db.all(`
    SELECT * FROM historico_revisoes 
    WHERE sala_id = ? 
    ORDER BY data_revisao DESC
  `, [id], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Dashboard - estatísticas
app.get('/api/dashboard', (req, res) => {
  const queries = {
    totalSalas: 'SELECT COUNT(*) as total FROM salas',
    salasOk: 'SELECT COUNT(*) as total FROM salas WHERE status = "Revisão OK"',
    salasComProblemas: 'SELECT COUNT(*) as total FROM salas WHERE status != "Revisão OK"',
    ultimasRevisoes: `
      SELECT s.sala, s.andar, s.data_revisao, s.analista 
      FROM salas s 
      ORDER BY s.data_revisao DESC 
      LIMIT 5
    `
  };

  const results = {};
  let completed = 0;
  const totalQueries = Object.keys(queries).length;

  Object.keys(queries).forEach(key => {
    db.all(queries[key], (err, rows) => {
      if (err) {
        results[key] = { error: err.message };
      } else {
        results[key] = rows;
      }
      
      completed++;
      if (completed === totalQueries) {
        res.json(results);
      }
    });
  });
});

// Inicializar dados da planilha
app.post('/api/init-data', (req, res) => {
  const salasData = [
    { escritorio: 'MG', sala: 'CEO', andar: '13°', tv: 'OK', controle: 'OK', ramal: 'N/A', videoconf: 'OK', manual: 'N/A', monitor: '', status: 'Em Uso', observacoes: 'OK' },
    { escritorio: 'MG', sala: '13.5', andar: '13°', tv: 'OK', controle: 'OK', ramal: 'OK', videoconf: 'OK', manual: 'N/A', monitor: '', status: 'Revisão OK', observacoes: 'OK' },
    { escritorio: 'MG', sala: '13.4', andar: '13°', tv: 'OK', controle: 'OK', ramal: 'N/A', videoconf: 'OK', manual: 'N/A', monitor: '', status: 'Revisão OK', observacoes: 'OK', troca_pilha_tv: '2025-09-02' },
    { escritorio: 'MG', sala: '13.3', andar: '13°', tv: 'OK', controle: 'OK', ramal: 'N/A', videoconf: 'N/A', manual: 'N/A', monitor: '', status: 'Revisão OK', observacoes: 'OK', troca_pilha_tv: '2025-09-02' },
    { escritorio: 'MG', sala: '13.2', andar: '13°', tv: 'OK', controle: 'OK', ramal: 'N/A', videoconf: 'N/A', manual: 'N/A', monitor: '', status: 'Revisão OK', observacoes: 'OK' },
    { escritorio: 'MG', sala: '13.1', andar: '13°', tv: 'OK', controle: 'OK', ramal: 'N/A', videoconf: 'N/A', manual: 'N/A', monitor: '', status: 'Revisão OK', observacoes: 'OK' },
    { escritorio: 'MG', sala: '12.4', andar: '12°', tv: 'OK', controle: 'OK', ramal: 'N/A', videoconf: 'OK', manual: 'OK', monitor: '', status: 'Revisão OK', observacoes: 'OK' },
    { escritorio: 'MG', sala: '12.5', andar: '12°', tv: 'OK', controle: 'OK', ramal: 'N/A', videoconf: 'OK', manual: 'OK', monitor: '', status: 'Revisão OK', observacoes: 'OK' },
    { escritorio: 'MG', sala: '12.6 (Nova)', andar: '12°', tv: 'OK', controle: 'OK', ramal: 'N/A', videoconf: 'OK', manual: 'OK', monitor: '', status: 'Revisão OK', observacoes: 'OK' },
    { escritorio: 'MG', sala: '12.7 (Nova)', andar: '12°', tv: 'NOK', controle: 'OK', ramal: 'N/A', videoconf: 'OK', manual: 'OK', monitor: '', status: 'Revisão OK', observacoes: 'Equipamento com cabo HDMI apresentando problemas' },
    { escritorio: 'MG', sala: '10.1', andar: '10°', tv: 'OK', controle: 'OK', ramal: 'N/A', videoconf: 'N/A', manual: 'N/A', monitor: '', status: 'Revisão OK', observacoes: 'OK' },
    { escritorio: 'MG', sala: '10.2', andar: '10°', tv: 'OK', controle: 'OK', ramal: 'N/A', videoconf: 'N/A', manual: 'N/A', monitor: 'OK', status: 'Revisão OK', observacoes: 'OK' },
    { escritorio: 'MG', sala: '10.3', andar: '10°', tv: 'OK', controle: 'OK', ramal: 'N/A', videoconf: 'OK', manual: 'OK', monitor: '', status: 'Revisão OK', observacoes: 'OK', troca_pilha_tv: '2025-09-29' },
    { escritorio: 'MG', sala: '9.2', andar: '9°', tv: 'OK', controle: 'OK', ramal: 'N/A', videoconf: 'N/A', manual: 'N/A', monitor: '', status: 'Em Uso', observacoes: 'OK' },
    { escritorio: 'MG', sala: '9.3', andar: '9°', tv: 'OK', controle: 'OK', ramal: 'N/A', videoconf: 'N/A', manual: 'N/A', monitor: '', status: 'Revisão OK', observacoes: 'OK' },
    { escritorio: 'MG', sala: '9.4', andar: '9°', tv: 'OK', controle: 'OK', ramal: 'N/A', videoconf: 'N/A', manual: 'N/A', monitor: '', status: 'Em Uso', observacoes: 'OK' },
    { escritorio: 'MG', sala: '9.5', andar: '9°', tv: 'OK', controle: 'OK', ramal: 'N/A', videoconf: 'OK', manual: 'OK', monitor: '', status: 'Em Uso', observacoes: 'OK' },
    { escritorio: 'MG', sala: '8.2', andar: '8°', tv: 'OK', controle: 'OK', ramal: 'N/A', videoconf: 'N/A', manual: 'N/A', monitor: '', status: 'Revisão OK', observacoes: 'OK' },
    { escritorio: 'MG', sala: '8.3', andar: '8°', tv: 'OK', controle: 'OK', ramal: 'N/A', videoconf: 'N/A', manual: 'N/A', monitor: '', status: 'Revisão OK', observacoes: 'OK', troca_pilha_tv: '2025-08-19' },
    { escritorio: 'MG', sala: '8.4', andar: '8°', tv: 'OK', controle: 'OK', ramal: 'N/A', videoconf: 'N/A', manual: 'N/A', monitor: '', status: 'Revisão OK', observacoes: 'OK' },
    { escritorio: 'MG', sala: '8.5', andar: '8°', tv: 'OK', controle: 'OK', ramal: 'N/A', videoconf: 'OK', manual: 'OK', monitor: '', status: 'Revisão OK', observacoes: 'OK' }
  ];

  const dataRevisao = moment().format('YYYY-MM-DD');
  const analista = 'Kaique';

  let inserted = 0;
  salasData.forEach(sala => {
    const sql = `
      INSERT INTO salas (escritorio, sala, andar, tv, controle, ramal,
                        videoconf, manual, monitor, status, observacoes, 
                        data_revisao, troca_pilha_tv, analista)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.run(sql, [
      sala.escritorio, sala.sala, sala.andar, sala.tv, sala.controle, sala.ramal,
      sala.videoconf, sala.manual, sala.monitor, sala.status, sala.observacoes,
      dataRevisao, sala.troca_pilha_tv || null, analista
    ], function(err) {
      if (err) {
        console.error('Erro ao inserir sala:', err);
      }
      inserted++;
      if (inserted === salasData.length) {
        res.json({ message: 'Dados inicializados com sucesso', salas: salasData.length });
      }
    });
  });
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  console.log(`Acesse: http://localhost:${PORT}`);
});


