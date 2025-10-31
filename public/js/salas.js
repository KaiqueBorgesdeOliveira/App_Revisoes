/* Arquivo único e sem duplicatas - gerenciamento de salas, revisão e histórico */

const STORAGE_KEY = 'revisoes_salas_cache_v1';

const DEFAULT_EQUIP = {
    tv: false,
    controle: false,
    ramal: false,
    videoconf: false,
    manual: false,
    monitor: false
};

let salasCache = [];
const currentFilters = { andar: '', query: '', escritorio: '' };

/* Persistência */
function loadCache() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        salasCache = raw ? JSON.parse(raw) : [];
        console.log('Cache carregado:', salasCache.length, 'salas');
    } catch (e) {
        salasCache = [];
        console.error('Erro ao carregar cache:', e);
    }
}
function saveCache() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(salasCache));
        console.log('Cache salvo:', salasCache.length, 'salas');
    } catch (e) {
        console.error('Erro ao salvar cache:', e);
    }
}

/* Utilitários */
function criarId(escritorio, numero) {
    return `${escritorio}-${numero}`.toLowerCase();
}
function getSalasDoAndar(escritorio, andar) {
    return salasCache.filter(s => s.escritorio === escritorio && String(s.andar) === String(andar));
}
function getNextRoomNumber(escritorio, andar) {
    const existentes = getSalasDoAndar(escritorio, andar)
        .map(s => {
            const parts = (s.numero || '').split('.');
            return parts.length > 1 ? parseInt(parts[1], 10) : NaN;
        })
        .filter(n => Number.isInteger(n) && n > 0);
    const used = new Set(existentes);
    let i = 1;
    while (used.has(i)) i++;
    return `${andar}.${i}`;
}
function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
}

/* Validação */
function validarNovaSala(escritorio, andar) {
    if (!window.escritoriosConfig || !escritoriosConfig[escritorio]) {
        alert('Escritório não encontrado!');
        return false;
    }
    if (!escritoriosConfig[escritorio].andares[andar]) {
        alert('Andar não disponível neste escritório!');
        return false;
    }
    const maxSalas = escritoriosConfig[escritorio].andares[andar].maxSalas;
    const existentes = getSalasDoAndar(escritorio, andar).length;
    if (existentes >= maxSalas) {
        alert(`O ${andar}º andar já possui o número máximo de ${maxSalas} salas!`);
        return false;
    }
    return true;
}

/* Popula selects do modal */
function populaEscritorios() {
    const selE = document.getElementById('selectEscritorio');
    const selA = document.getElementById('selectAndar');
    if (!selE || !selA) return;
    selE.innerHTML = '<option value="">Selecione...</option>';
    if (window.escritoriosConfig) {
        Object.keys(escritoriosConfig).forEach(key => {
            const cfg = escritoriosConfig[key];
            const opt = document.createElement('option');
            opt.value = key;
            opt.textContent = `${key} - ${cfg.nome || key}`;
            selE.appendChild(opt);
        });
    }
    selA.innerHTML = '<option value="">Selecione...</option>';
    const numEl = document.getElementById('numeroSala');
    if (numEl) numEl.value = '';
}

function atualizarAndares() {
    const selectEscritorio = document.getElementById('selectEscritorio');
    const selectAndar = document.getElementById('selectAndar');
    if (!selectEscritorio || !selectAndar) return;
    const escritorio = selectEscritorio.value;
    selectAndar.innerHTML = '<option value="">Selecione...</option>';
    if (window.escritoriosConfig && escritoriosConfig[escritorio]) {
        Object.keys(escritoriosConfig[escritorio].andares).forEach(andar => {
            const label = andar === 'T' ? 'Térreo' : `${andar}º Andar`;
            selectAndar.add(new Option(label, andar));
        });
    }
    atualizarNumeroSala();
}
function atualizarNumeroSala() {
    const selectEscritorio = document.getElementById('selectEscritorio');
    const selectAndar = document.getElementById('selectAndar');
    const numeroSalaEl = document.getElementById('numeroSala');
    if (!selectEscritorio || !selectAndar || !numeroSalaEl) return;
    if (!selectEscritorio.value || !selectAndar.value) {
        numeroSalaEl.value = '';
        return;
    }
    numeroSalaEl.value = getNextRoomNumber(selectEscritorio.value, selectAndar.value);
}

/* CRUD local */
function salvarNovaSala() {
    const selectEscritorio = document.getElementById('selectEscritorio');
    const selectAndar = document.getElementById('selectAndar');
    if (!selectEscritorio || !selectAndar) return;
    const escritorio = selectEscritorio.value;
    const andar = selectAndar.value;
    if (!escritorio || !andar) {
        alert('Selecione escritório e andar.');
        return;
    }
    if (!validarNovaSala(escritorio, andar)) return;
    const numeroSala = getNextRoomNumber(escritorio, andar);
    const id = criarId(escritorio, numeroSala);
    if (salasCache.some(s => s.id === id)) {
        alert(`A sala ${numeroSala} já existe neste andar!`);
        return;
    }
    const novaSala = {
        id,
        escritorio,
        andar: String(andar),
        numero: numeroSala,
        status: 'disponivel',
        equipamentos: Object.assign({}, DEFAULT_EQUIP),
        ultimaRevisao: null,
        history: []
    };
    salasCache.push(novaSala);
    saveCache();
    atualizarListaSalas();
    const modalEl = document.getElementById('addSalaModal');
    const modal = modalEl ? bootstrap.Modal.getInstance(modalEl) : null;
    if (modal) modal.hide();
}

/* Renderização de card */
function criarCardSala(sala) {
    sala.equipamentos = Object.assign({}, DEFAULT_EQUIP, sala.equipamentos || {});
    const labelFor = key => key === 'tv' ? 'TV'
        : key === 'controle' ? 'Controle'
        : key === 'ramal' ? 'Ramal'
        : key === 'videoconf' ? 'Videoconf'
        : key === 'manual' ? 'Manual'
        : key === 'monitor' ? 'Monitor'
        : key;
    const equipamentosHtml = Object.keys(sala.equipamentos).map(key => {
        const present = !!sala.equipamentos[key];
        return `
            <div class="equipamento-item">
                <span class="equip-dot ${present ? 'present' : 'absent'}" aria-hidden="true"></span>
                <span class="equip-label">${labelFor(key)}</span>
            </div>
        `;
    }).join('');
    const andarLabel = sala.andar === 'T' ? 'Térreo' : `${sala.andar}º`;
    
    // Define cor do badge baseado na revisão
    const badgeClass = sala.ultimaRevisao ? 'status-badge-success' : 'status-badge-danger';
    const badgeText = sala.ultimaRevisao ? 'Revisão OK' : 'Sem revisão';
    
    return `
    <div class="sala-card" id="${sala.id}">
        <div style="display:flex;align-items:center;justify-content:space-between;">
            <div style="display:flex;align-items:center;gap:8px;">
                <input type="checkbox" class="sala-select" data-id="${sala.id}" aria-label="Selecionar sala" />
                <strong style="font-size:1rem">${sala.numero}</strong>
            </div>
            <div class="status-badge ${badgeClass}">${badgeText}</div>
        </div>
        <p class="text-muted" style="margin-top:8px">${andarLabel} - ${sala.escritorio}</p>
        <div class="equipamentos-grid" aria-hidden="true">
            ${equipamentosHtml}
        </div>
        <div class="ultima-revisao" style="margin-top:8px;color:#666;">
            <i class="fas fa-calendar-alt"></i> Última revisão: ${sala.ultimaRevisao || '—'}
        </div>
        <div class="card-footer" style="margin-top:12px;display:flex;gap:8px;">
            <button class="btn btn-warning" type="button" onclick="revisarSala('${sala.id}')">Revisar</button>
            <button class="btn btn-outline-secondary" type="button" onclick="verHistorico('${sala.id}')">Histórico</button>
            <button class="btn btn-outline-danger" type="button" onclick="deletarSala('${sala.id}')">Excluir</button>
        </div>
    </div>
    `;
}

/* Popula filtro de escritórios */
function populateFilterEscritorios() {
    const sel = document.getElementById('filterEscritorio');
    if (!sel || !window.escritoriosConfig) return;
    sel.innerHTML = '<option value="">Todas as localidades</option>';
    Object.keys(escritoriosConfig).forEach(key => {
        const cfg = escritoriosConfig[key];
        sel.appendChild(new Option(`${key} - ${cfg.nome}`, key));
    });
}

/* Filtro por andar (aceita valores não-numéricos como "T") */
function populateFilterAndares() {
    const sel = document.getElementById('filterAndar');
    if (!sel || !window.escritoriosConfig) return;
    const set = new Set();
    Object.values(escritoriosConfig).forEach(cfg => {
        Object.keys(cfg.andares || {}).forEach(a => set.add(String(a)));
    });
    const andares = Array.from(set).sort((a, b) => {
        if (a === 'T') return -1;
        if (b === 'T') return 1;
        const numA = parseInt(a, 10);
        const numB = parseInt(b, 10);
        if (isNaN(numA)) return 1;
        if (isNaN(numB)) return -1;
        return numA - numB;
    });
    sel.innerHTML = '<option value="">Todos os andares</option>';
    andares.forEach(a => {
        const label = a === 'T' ? 'Térreo' : `${a}º`;
        sel.appendChild(new Option(label, a));
    });
}

/* Lista / filtros */
function atualizarListaSalas() {
    const container = document.getElementById('salas-container');
    if (!container) return;
    const unique = new Map();
    salasCache.forEach(s => unique.set(s.id, s));
    let salas = Array.from(unique.values()).sort((a, b) => {
        const [aAndar, aNum] = (a.numero || '').split('.').map(x => parseInt(x, 10));
        const [bAndar, bNum] = (b.numero || '').split('.').map(x => parseInt(x, 10));
        if (aAndar === bAndar) return (aNum || 0) - (bNum || 0);
        return (aAndar || 0) - (bAndar || 0);
    });
    
    if (currentFilters.escritorio) {
        salas = salas.filter(s => s.escritorio === currentFilters.escritorio);
    }
    
    if (currentFilters.andar) {
        salas = salas.filter(s => String(s.andar) === String(currentFilters.andar));
    }
    
    const q = (currentFilters.query || '').trim().toLowerCase();
    if (q) {
        salas = salas.filter(s => {
            return (s.numero && s.numero.toLowerCase().includes(q)) ||
                   (s.escritorio && s.escritorio.toLowerCase().includes(q)) ||
                   (s.ultimaObs && s.ultimaObs.toLowerCase().includes(q));
        });
    }
    
    console.log('Renderizando', salas.length, 'salas');
    container.innerHTML = '';
    salas.forEach(s => container.insertAdjacentHTML('beforeend', criarCardSala(s)));
    bindSelectAllState();
}

/* Exclusão / seleção */
function deletarSala(id) {
    if (!confirm('Confirma exclusão desta sala?')) return;
    salasCache = salasCache.filter(s => s.id !== id);
    saveCache();
    atualizarListaSalas();
}
function toggleSelectAll(checked) {
    document.querySelectorAll('.sala-select').forEach(cb => cb.checked = !!checked);
}
function deletarSelecionadas() {
    const checks = Array.from(document.querySelectorAll('.sala-select:checked'));
    if (checks.length === 0) { alert('Nenhuma sala selecionada.'); return; }
    if (!confirm(`Excluir ${checks.length} sala(s) selecionada(s)?`)) return;
    const ids = checks.map(c => c.getAttribute('data-id')).filter(Boolean);
    salasCache = salasCache.filter(s => !ids.includes(s.id));
    saveCache();
    atualizarListaSalas();
}

/* Limpar todos os filtros */
function limparFiltros() {
    currentFilters.andar = '';
    currentFilters.query = '';
    currentFilters.escritorio = '';
    
    const filterEscritorio = document.getElementById('filterEscritorio');
    const filterAndar = document.getElementById('filterAndar');
    const searchEl = document.getElementById('searchSala');
    
    if (filterEscritorio) filterEscritorio.value = '';
    if (filterAndar) filterAndar.value = '';
    if (searchEl) searchEl.value = '';
    
    atualizarListaSalas();
}

/* UI helpers */
function bindSelectAllState() {
    const btn = document.getElementById('btnSelectAll');
    if (!btn) return;
    const all = Array.from(document.querySelectorAll('.sala-select'));
    if (all.length === 0) { btn.setAttribute('data-selected', '0'); btn.classList.remove('active'); return; }
    const selectedCount = all.filter(cb => cb.checked).length;
    const next = selectedCount === all.length;
    btn.setAttribute('data-selected', next ? '1' : '0');
    btn.classList.toggle('active', next);
}

/* Revisar */
function revisarSala(id) {
    const sala = salasCache.find(s => s.id === id);
    if (!sala) return alert('Sala não encontrada.');
    const modalEl = document.getElementById('revisarModal');
    if (!modalEl) return alert('Modal de revisão não encontrado.');

    sala.equipamentos = Object.assign({}, DEFAULT_EQUIP, sala.equipamentos || {});
    modalEl.querySelector('.modal-title').textContent = `Revisar ${sala.numero}`;

    const equipamentosHtml = Object.keys(sala.equipamentos).map(key => {
        const label = key === 'tv' ? 'TV'
                    : key === 'controle' ? 'Controle'
                    : key === 'ramal' ? 'Ramal'
                    : key === 'videoconf' ? 'Videoconf'
                    : key === 'manual' ? 'Manual'
                    : key === 'monitor' ? 'Monitor'
                    : key;
        const checked = sala.equipamentos[key] ? 'checked' : '';
        return `
            <div class="form-check">
                <input class="form-check-input revisao-equip" type="checkbox" id="rev_${key}" data-key="${key}" ${checked}>
                <label class="form-check-label" for="rev_${key}">${label}</label>
            </div>
        `;
    }).join('');

    modalEl.querySelector('.modal-body').innerHTML = `
        <p><strong>${sala.numero}</strong> — ${sala.andar === 'T' ? 'Térreo' : sala.andar + 'º'} - ${sala.escritorio}</p>
        <hr/>
        <form id="formRevisao">
            <div class="mb-3">
                <label class="form-label">Equipamentos (marque os presentes)</label>
                ${equipamentosHtml}
            </div>
            <div class="mb-3">
                <label class="form-label">Observações</label>
                <textarea class="form-control" id="revisaoObs" rows="3">${sala.ultimaObs || ''}</textarea>
            </div>
            <div class="mb-3">
                <label class="form-label">Foto da sala (opcional)</label>
                <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;">
                    <input type="file" accept="image/*" capture="environment" class="form-control" id="revisaoFoto" style="flex:1 1 200px;min-width:140px;">
                    <button type="button" id="openCameraBtn" class="btn btn-outline-primary btn-sm">Abrir câmera</button>
                </div>
                <div class="mt-2" id="revisaoFotoPreviewWrap">
                    ${sala.history && sala.history.length && sala.history[sala.history.length-1].foto ? `<img src="${sala.history[sala.history.length-1].foto}" alt="Foto" style="max-width:100%;border-radius:6px;">` : ''}
                </div>
                <div id="cameraWrap" style="display:none;margin-top:8px;">
                    <video id="revVideo" autoplay playsinline style="width:100%;max-height:240px;border-radius:6px;background:#000;"></video>
                    <div style="display:flex;gap:8px;margin-top:8px;">
                        <button type="button" id="captureCameraBtn" class="btn btn-primary btn-sm">Capturar</button>
                        <button type="button" id="stopCameraBtn" class="btn btn-secondary btn-sm">Fechar câmera</button>
                    </div>
                </div>
            </div>
        </form>
    `;

    let fotoBase64 = null;
    const fileEl = modalEl.querySelector('#revisaoFoto');
    const previewWrap = modalEl.querySelector('#revisaoFotoPreviewWrap');

    if (fileEl) {
        fileEl.onchange = null;
        fileEl.addEventListener('change', function (ev) {
            const f = ev.target.files && ev.target.files[0];
            if (!f) { fotoBase64 = null; previewWrap.innerHTML = ''; return; }
            const reader = new FileReader();
            reader.onload = function(evt) {
                fotoBase64 = evt.target.result;
                previewWrap.innerHTML = `<img src="${fotoBase64}" alt="Foto" style="max-width:100%;border-radius:6px;">`;
            };
            reader.readAsDataURL(f);
        });
    }

    const openCameraBtn = modalEl.querySelector('#openCameraBtn');
    const cameraWrap = modalEl.querySelector('#cameraWrap');
    const videoEl = modalEl.querySelector('#revVideo');
    const captureBtn = modalEl.querySelector('#captureCameraBtn');
    const stopBtn = modalEl.querySelector('#stopCameraBtn');

    async function startCamera() {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            alert('Câmera não suportada neste dispositivo.');
            return;
        }
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
            modalEl._revStream = stream;
            videoEl.srcObject = stream;
            cameraWrap.style.display = 'block';
        } catch (err) {
            console.error('Erro ao acessar câmera:', err);
            alert('Não foi possível acessar a câmera.');
        }
    }
    function stopCamera() {
        if (modalEl._revStream) {
            modalEl._revStream.getTracks().forEach(t => t.stop());
            modalEl._revStream = null;
        }
        if (videoEl) videoEl.srcObject = null;
        if (cameraWrap) cameraWrap.style.display = 'none';
    }
    function captureFromCamera() {
        if (!videoEl || !videoEl.videoWidth) return;
        const canvas = document.createElement('canvas');
        canvas.width = videoEl.videoWidth;
        canvas.height = videoEl.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
        fotoBase64 = canvas.toDataURL('image/jpeg', 0.85);
        previewWrap.innerHTML = `<img src="${fotoBase64}" alt="Foto" style="max-width:100%;border-radius:6px;">`;
        stopCamera();
    }

    if (openCameraBtn) {
        openCameraBtn.onclick = () => {
            if (cameraWrap.style.display === 'block') {
                stopCamera();
            } else {
                startCamera();
            }
        };
    }
    if (captureBtn) {
        captureBtn.onclick = () => captureFromCamera();
    }
    if (stopBtn) {
        stopBtn.onclick = () => stopCamera();
    }

    if (!modalEl._cameraBound) {
        modalEl.addEventListener('hidden.bs.modal', () => {
            stopCamera();
        });
        modalEl._cameraBound = true;
    }

    const salvarBtn = modalEl.querySelector('.btn-save-revisao');
    if (salvarBtn) {
        salvarBtn.onclick = null;
        salvarBtn.onclick = () => {
            const checks = modalEl.querySelectorAll('.revisao-equip');
            checks.forEach(cb => { const key = cb.dataset.key; sala.equipamentos[key] = !!cb.checked; });
            const obs = modalEl.querySelector('#revisaoObs')?.value || '';
            sala.history = sala.history || [];
            const entry = { date: new Date().toISOString(), equipamentos: Object.assign({}, sala.equipamentos), obs, foto: fotoBase64 || null };
            sala.history.push(entry);
            sala.ultimaRevisao = new Date().toLocaleDateString();
            sala.ultimaObs = obs;
            saveCache();
            atualizarListaSalas();
            const modalInstance = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
            modalInstance.hide();
            stopCamera();
        };
    }

    const modalInstance = new bootstrap.Modal(modalEl);
    modalInstance.show();
}

/* Visualizador de foto */
function showPhotoViewer(src) {
    const img = document.getElementById('photoViewerImg');
    if (!img) return;
    img.src = src || '';
    const m = new bootstrap.Modal(document.getElementById('photoViewerModal'));
    m.show();
}

/* Histórico com filtro de data e exportação */
function verHistorico(id) {
    const sala = salasCache.find(s => s.id === id);
    if (!sala) return alert('Sala não encontrada.');
    const modalEl = document.getElementById('historicoModal');
    if (!modalEl) return alert('Modal de histórico não encontrado.');
    modalEl.querySelector('.modal-title').textContent = `Histórico - ${sala.numero}`;
    
    const history = (sala.history && sala.history.length) ? sala.history.slice().reverse() : [];
    
    if (history.length === 0) {
        modalEl.querySelector('.modal-body').innerHTML = `
            <div class="historico-empty">
                <p><strong>${sala.numero}</strong> — ${sala.andar === 'T' ? 'Térreo' : sala.andar + 'º'} - ${sala.escritorio}</p>
                <p class="text-muted">Sem histórico de revisões.</p>
            </div>
        `;
    } else {
        // Renderiza com filtro de data e seleção
        const renderHistoryContent = (filteredHistory) => {
            const itemsHtml = filteredHistory.map((h, idx) => {
                const dt = new Date(h.date).toLocaleString();
                const equipTags = Object.keys(h.equipamentos || {}).map(k => {
                    const label = k === 'tv' ? 'TV'
                                : k === 'controle' ? 'Controle'
                                : k === 'ramal' ? 'Ramal'
                                : k === 'videoconf' ? 'Videoconf'
                                : k === 'manual' ? 'Manual'
                                : k === 'monitor' ? 'Monitor'
                                : k;
                    const present = !!h.equipamentos[k];
                    return `<span class="hist-equip-tag ${present ? 'present' : 'absent'}">${label}</span>`;
                }).join('');
                const fotoThumb = h.foto ? `<div class="history-photo"><img class="history-thumb" src="${h.foto}" data-full="${h.foto}" alt="Foto" /></div>` : '';
                const obsHtml = h.obs ? `<div class="history-obs"><strong>Obs:</strong><div>${escapeHtml(h.obs)}</div></div>` : '';
                return `
                    <div class="history-entry">
                        <div style="display:flex;align-items:flex-start;gap:8px;">
                            <input type="checkbox" class="history-select" data-index="${idx}" style="margin-top:4px;">
                            <div style="flex:1;">
                                <div class="history-meta">
                                    <div class="history-date">${dt}</div>
                                </div>
                                <div class="history-body">
                                    <div class="history-equips">${equipTags}</div>
                                    ${obsHtml}
                                    ${fotoThumb}
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
            
            return `
                <div><strong>${sala.numero}</strong> — ${sala.andar === 'T' ? 'Térreo' : sala.andar + 'º'} - ${sala.escritorio}</div>
                
                <!-- Filtros de data -->
                <div class="history-filters" style="margin-top:1rem;padding:1rem;background:#f8f9fa;border-radius:8px;">
                    <div style="display:flex;gap:0.75rem;flex-wrap:wrap;align-items:center;">
                        <label style="font-weight:500;margin:0;">Filtrar por data:</label>
                        <input type="date" id="historyDateStart" class="form-control" placeholder="Data inicial" style="max-width:160px;">
                        <span style="color:#666;">até</span>
                        <input type="date" id="historyDateEnd" class="form-control" placeholder="Data final" style="max-width:160px;">
                        <button type="button" class="btn btn-primary btn-sm" id="btnFilterHistory">
                            <i class="fas fa-filter"></i> Filtrar
                        </button>
                        <button type="button" class="btn btn-outline-secondary btn-sm" id="btnClearHistoryFilter">
                            <i class="fas fa-times"></i> Limpar
                        </button>
                    </div>
                    <div style="margin-top:0.5rem;font-size:0.875rem;color:#666;">
                        <i class="fas fa-info-circle"></i> Exibindo ${filteredHistory.length} de ${history.length} revisões
                    </div>
                </div>
                
                <!-- Botões de exportação -->
                <div class="export-actions" style="margin-top:1rem;padding:1rem;background:#fff3cd;border-radius:8px;border:1px solid #ffc107;">
                    <div style="display:flex;gap:0.5rem;flex-wrap:wrap;align-items:center;margin-bottom:0.5rem;">
                        <button type="button" class="btn btn-sm btn-outline-primary" id="btnSelectAllHistory">
                            <i class="fas fa-check-square"></i> Selecionar todas
                        </button>
                        <button type="button" class="btn btn-sm btn-outline-secondary" id="btnDeselectAllHistory">
                            <i class="fas fa-square"></i> Desmarcar todas
                        </button>
                        <span style="color:#856404;font-size:0.875rem;margin-left:auto;" id="selectedCount">0 selecionadas</span>
                    </div>
                    <div style="display:flex;gap:0.5rem;flex-wrap:wrap;">
                        <button type="button" class="btn btn-success btn-sm" id="btnExportJSON">
                            <i class="fas fa-file-code"></i> Exportar JSON
                        </button>
                        <button type="button" class="btn btn-success btn-sm" id="btnExportCSV">
                            <i class="fas fa-file-csv"></i> Exportar CSV
                        </button>
                        <button type="button" class="btn btn-danger btn-sm" id="btnExportPDF">
                            <i class="fas fa-file-pdf"></i> Exportar PDF
                        </button>
                        <button type="button" class="btn btn-info btn-sm" id="btnPrintHistory">
                            <i class="fas fa-print"></i> Imprimir
                        </button>
                    </div>
                </div>
                
                <div class="history-list" style="margin-top:1rem">${itemsHtml || '<p class="text-muted">Nenhuma revisão encontrada neste período.</p>'}</div>
            `;
        };
        
        const setupFilterHandlers = () => {
            const btnFilter = document.getElementById('btnFilterHistory');
            const btnClear = document.getElementById('btnClearHistoryFilter');
            const dateStart = document.getElementById('historyDateStart');
            const dateEnd = document.getElementById('historyDateEnd');
            
            if (btnFilter) {
                btnFilter.onclick = () => {
                    const startDate = dateStart?.value ? new Date(dateStart.value) : null;
                    const endDate = dateEnd?.value ? new Date(dateEnd.value) : null;
                    
                    if (endDate) {
                        endDate.setHours(23, 59, 59, 999);
                    }
                    
                    let filtered = history;
                    
                    if (startDate || endDate) {
                        filtered = history.filter(h => {
                            const revisionDate = new Date(h.date);
                            
                            if (startDate && revisionDate < startDate) return false;
                            if (endDate && revisionDate > endDate) return false;
                            
                            return true;
                        });
                    }
                    
                    modalEl.querySelector('.modal-body').innerHTML = renderHistoryContent(filtered);
                    setupFilterHandlers();
                    setupExportHandlers(filtered);
                    setupHistoryImageHandlers();
                };
            }
            
            if (btnClear) {
                btnClear.onclick = () => {
                    modalEl.querySelector('.modal-body').innerHTML = renderHistoryContent(history);
                    setupFilterHandlers();
                    setupExportHandlers(history);
                    setupHistoryImageHandlers();
                };
            }
        };
        
        const setupExportHandlers = (currentHistory) => {
            // Contador de selecionados
            const updateSelectedCount = () => {
                const selected = document.querySelectorAll('.history-select:checked').length;
                const countEl = document.getElementById('selectedCount');
                if (countEl) countEl.textContent = `${selected} selecionada${selected !== 1 ? 's' : ''}`;
            };
            
            document.querySelectorAll('.history-select').forEach(cb => {
                cb.onchange = updateSelectedCount;
            });
            
            // Selecionar/Desmarcar todas
            const btnSelectAll = document.getElementById('btnSelectAllHistory');
            if (btnSelectAll) {
                btnSelectAll.onclick = () => {
                    document.querySelectorAll('.history-select').forEach(cb => cb.checked = true);
                    updateSelectedCount();
                };
            }
            
            const btnDeselectAll = document.getElementById('btnDeselectAllHistory');
            if (btnDeselectAll) {
                btnDeselectAll.onclick = () => {
                    document.querySelectorAll('.history-select').forEach(cb => cb.checked = false);
                    updateSelectedCount();
                };
            }
            
            // Função para obter revisões selecionadas
            const getSelectedRevisions = () => {
                const selected = [];
                document.querySelectorAll('.history-select:checked').forEach(cb => {
                    const idx = parseInt(cb.dataset.index);
                    if (!isNaN(idx) && currentHistory[idx]) {
                        selected.push(currentHistory[idx]);
                    }
                });
                return selected;
            };
            
            // Exportar JSON
            const btnExportJSON = document.getElementById('btnExportJSON');
            if (btnExportJSON) {
                btnExportJSON.onclick = () => {
                    const selected = getSelectedRevisions();
                    if (selected.length === 0) {
                        alert('Selecione pelo menos uma revisão para exportar.');
                        return;
                    }
                    
                    const data = {
                        sala: {
                            numero: sala.numero,
                            andar: sala.andar,
                            escritorio: sala.escritorio
                        },
                        revisoes: selected,
                        exportadoEm: new Date().toISOString()
                    };
                    
                    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                    downloadFile(blob, `historico-${sala.numero}-${Date.now()}.json`);
                };
            }
            
            // Exportar CSV
            const btnExportCSV = document.getElementById('btnExportCSV');
            if (btnExportCSV) {
                btnExportCSV.onclick = () => {
                    const selected = getSelectedRevisions();
                    if (selected.length === 0) {
                        alert('Selecione pelo menos uma revisão para exportar.');
                        return;
                    }
                    
                    let csv = 'Data/Hora;Sala;Andar;Escritório;TV;Controle;Ramal;Videoconf;Manual;Monitor;Observações\n';
                    
                    selected.forEach(h => {
                        const dt = new Date(h.date).toLocaleString();
                        const equips = h.equipamentos || {};
                        const obs = (h.obs || '').replace(/;/g, ',').replace(/\n/g, ' ');
                        
                        csv += `"${dt}";"${sala.numero}";"${sala.andar}";"${sala.escritorio}";`;
                        csv += `"${equips.tv ? 'Sim' : 'Não'}";"${equips.controle ? 'Sim' : 'Não'}";`;
                        csv += `"${equips.ramal ? 'Sim' : 'Não'}";"${equips.videoconf ? 'Sim' : 'Não'}";`;
                        csv += `"${equips.manual ? 'Sim' : 'Não'}";"${equips.monitor ? 'Sim' : 'Não'}";`;
                        csv += `"${obs}"\n`;
                    });
                    
                    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
                    downloadFile(blob, `historico-${sala.numero}-${Date.now()}.csv`);
                };
            }
            
            // Exportar PDF
            const btnExportPDF = document.getElementById('btnExportPDF');
            if (btnExportPDF) {
                btnExportPDF.onclick = () => {
                    const selected = getSelectedRevisions();
                    if (selected.length === 0) {
                        alert('Selecione pelo menos uma revisão para exportar.');
                        return;
                    }
                    
                    exportHistoryToPDF(sala, selected);
                };
            }
            
            // Imprimir
            const btnPrint = document.getElementById('btnPrintHistory');
            if (btnPrint) {
                btnPrint.onclick = () => {
                    const selected = getSelectedRevisions();
                    if (selected.length === 0) {
                        alert('Selecione pelo menos uma revisão para imprimir.');
                        return;
                    }
                    
                    printHistory(sala, selected);
                };
            }
        };
        
        modalEl.querySelector('.modal-body').innerHTML = renderHistoryContent(history);
        setupFilterHandlers();
        setupExportHandlers(history);
        setupHistoryImageHandlers();
    }
    
    const modalInstance = new bootstrap.Modal(modalEl);
    modalInstance.show();
}

/* Função auxiliar para download */
function downloadFile(blob, filename) {
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

/* Exportar para PDF (HTML para print) */
function exportHistoryToPDF(sala, revisoes) {
    const printWindow = window.open('', '_blank');
    
    let html = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Histórico - ${sala.numero}</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                h1 { color: #333; border-bottom: 3px solid #FFD700; padding-bottom: 10px; }
                .info { margin-bottom: 20px; font-size: 14px; color: #666; }
                .revisao { border: 1px solid #ddd; padding: 15px; margin-bottom: 15px; page-break-inside: avoid; }
                .revisao-header { font-weight: bold; margin-bottom: 10px; color: #333; }
                .equipamentos { display: flex; flex-wrap: wrap; gap: 8px; margin: 10px 0; }
                .equip-tag { padding: 4px 12px; border-radius: 12px; font-size: 12px; }
                .equip-presente { background: #d4edda; color: #155724; }
                .equip-ausente { background: #f8d7da; color: #721c24; }
                .obs { background: #f8f9fa; padding: 10px; border-radius: 6px; margin-top: 10px; font-size: 13px; }
                .foto { max-width: 300px; margin-top: 10px; }
                @media print {
                    body { padding: 0; }
                    .no-print { display: none; }
                }
            </style>
        </head>
        <body>
            <h1>Histórico de Revisões - Sala ${sala.numero}</h1>
            <div class="info">
                <strong>Andar:</strong> ${sala.andar === 'T' ? 'Térreo' : sala.andar + 'º'} | 
                <strong>Escritório:</strong> ${sala.escritorio} | 
                <strong>Total de revisões:</strong> ${revisoes.length}
            </div>
    `;
    
    revisoes.forEach((h, idx) => {
        const dt = new Date(h.date).toLocaleString();
        const equips = h.equipamentos || {};
        
        html += `
            <div class="revisao">
                <div class="revisao-header">${idx + 1}. Revisão em ${dt}</div>
                <div class="equipamentos">
        `;
        
        Object.keys(equips).forEach(key => {
            const label = key === 'tv' ? 'TV'
                        : key === 'controle' ? 'Controle'
                        : key === 'ramal' ? 'Ramal'
                        : key === 'videoconf' ? 'Videoconf'
                        : key === 'manual' ? 'Manual'
                        : key === 'monitor' ? 'Monitor'
                        : key;
            const present = !!equips[key];
            html += `<span class="equip-tag ${present ? 'equip-presente' : 'equip-ausente'}">${label}</span>`;
        });
        
        html += '</div>';
        
        if (h.obs) {
            html += `<div class="obs"><strong>Observações:</strong><br>${escapeHtml(h.obs)}</div>`;
        }
        
        if (h.foto) {
            html += `<div><img src="${h.foto}" class="foto" alt="Foto da sala" /></div>`;
        }
        
        html += '</div>';
    });
    
    html += `
            <div class="info" style="margin-top:30px;border-top:1px solid #ddd;padding-top:10px;">
                Exportado em: ${new Date().toLocaleString()} | Sistema de Revisão de Salas - UOL
            </div>
            <div class="no-print" style="margin-top:20px;">
                <button onclick="window.print()" style="padding:10px 20px;background:#007bff;color:white;border:none;border-radius:4px;cursor:pointer;">Imprimir / Salvar PDF</button>
                <button onclick="window.close()" style="padding:10px 20px;background:#6c757d;color:white;border:none;border-radius:4px;cursor:pointer;margin-left:10px;">Fechar</button>
            </div>
        </body>
        </html>
    `;
    
    printWindow.document.write(html);
    printWindow.document.close();
}

/* Imprimir histórico */
function printHistory(sala, revisoes) {
    exportHistoryToPDF(sala, revisoes);
}

/* Setup dos handlers de imagem do histórico */
function setupHistoryImageHandlers() {
    document.querySelectorAll('.history-thumb').forEach(img => {
        img.onclick = () => showPhotoViewer(img.getAttribute('data-full'));
        img.style.cursor = 'pointer';
        img.style.maxWidth = '160px';
        img.style.borderRadius = '6px';
    });
}

/* Injeta estilos simples */
function injectResponsiveStyles() {
    if (document.getElementById('salas-responsive-styles')) return;
    const css = `
        #salas-container { 
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 1.5rem;
            margin-top: 1.5rem;
        }
        
        .sala-card { 
            background: #fff;
            border: 1px solid #dee2e6;
            border-radius: 10px;
            padding: 1.25rem;
            box-shadow: 0 2px 8px rgba(0,0,0,0.08);
            transition: transform 0.2s, box-shadow 0.2s;
            position: relative;
            display: flex;
            flex-direction: column;
        }
        
        .sala-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.12);
        }
        
        .status-badge {
            position: absolute;
            top: 12px;
            right: 12px;
            padding: 0.25rem 0.75rem;
            border-radius: 20px;
            font-size: 0.75rem;
            font-weight: 600;
            color: white;
        }
        
        .status-badge-success {
            background-color: #28a745;
        }
        
        .status-badge-danger {
            background-color: #dc3545;
        }
        
        .sala-card strong {
            font-size: 1.1rem;
            color: #333;
        }
        
        .sala-card .text-muted {
            color: #6c757d;
            font-size: 0.9rem;
            margin: 0.5rem 0;
        }
        
        .equipamentos-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 0.5rem;
            margin: 1rem 0;
        }
        
        .equipamento-item { 
            display: flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.5rem;
            background: #f8f9fa;
            border-radius: 6px;
            font-size: 0.85rem;
        }
        
        .equip-dot {
            width: 10px;
            height: 10px;
            border-radius: 50%;
            flex-shrink: 0;
        }
        
        .equip-dot.present {
            background-color: #28a745;
        }
        
        .equip-dot.absent {
            background-color: #dc3545;
        }
        
        .equip-label {
            font-size: 0.85rem;
            color: #495057;
        }
        
        .ultima-revisao {
            margin-top: 0.75rem;
            color: #666;
            font-size: 0.85rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        
        .card-footer {
            display: flex;
            gap: 0.5rem;
            margin-top: auto;
            padding-top: 1rem;
            border-top: 1px solid #e9ecef;
            flex-wrap: wrap;
        }
        
        .card-footer .btn {
            flex: 1;
            min-width: 80px;
            font-size: 0.85rem;
            padding: 0.4rem 0.75rem;
        }
        
        .sala-select {
            width: 18px;
            height: 18px;
            cursor: pointer;
        }
        
        .history-entry { 
            border-bottom: 1px solid #eee; 
            padding: 1rem 0; 
        }
        
        .history-entry:last-child {
            border-bottom: none;
        }
        
        .history-date {
            font-weight: 600;
            color: #495057;
            margin-bottom: 0.5rem;
        }
        
        .history-equips {
            display: flex;
            flex-wrap: wrap;
            gap: 0.5rem;
            margin: 0.5rem 0;
        }
        
        .hist-equip-tag {
            padding: 0.25rem 0.75rem;
            border-radius: 12px;
            font-size: 0.8rem;
            font-weight: 500;
        }
        
        .hist-equip-tag.present {
            background-color: #d4edda;
            color: #155724;
        }
        
        .hist-equip-tag.absent {
            background-color: #f8d7da;
            color: #721c24;
        }
        
        .history-obs {
            margin-top: 0.5rem;
            padding: 0.5rem;
            background: #f8f9fa;
            border-radius: 6px;
        }
        
        .history-thumb { 
            max-width: 160px;
            border-radius: 6px;
            cursor: pointer;
            margin-top: 0.5rem;
        }
        
        .history-filters {
            margin-top: 1rem;
            padding: 1rem;
            background: #f8f9fa;
            border-radius: 8px;
        }
        
        .history-filters input[type="date"] {
            height: 36px;
        }
        
        .history-list {
            max-height: 400px;
            overflow-y: auto;
        }
        
        @media (max-width:768px) {
            #salas-container { 
                grid-template-columns: 1fr;
                gap: 1rem; 
            }
            .sala-card { 
                padding: 1rem; 
            }
            .equipamentos-grid {
                grid-template-columns: 1fr;
            }
            .card-footer { 
                flex-direction: column; 
            }
            .card-footer .btn { 
                width: 100%; 
            }
        }
    `;
    const style = document.createElement('style');
    style.id = 'salas-responsive-styles';
    style.appendChild(document.createTextNode(css));
    document.head.appendChild(style);
}

/* Inicialização */
document.addEventListener('DOMContentLoaded', () => {
    injectResponsiveStyles();
    loadCache();

    const modalAdd = document.getElementById('addSalaModal');
    if (modalAdd) modalAdd.addEventListener('show.bs.modal', populaEscritorios);
    populaEscritorios();

    const selectEscritorio = document.getElementById('selectEscritorio');
    if (selectEscritorio && window.escritoriosConfig) {
        selectEscritorio.innerHTML = '';
        Object.keys(escritoriosConfig).forEach(k => {
            selectEscritorio.add(new Option(`${k} - ${escritoriosConfig[k].nome}`, k));
        });
    }

    const btnSelectAll = document.getElementById('btnSelectAll');
    if (btnSelectAll) {
        btnSelectAll.addEventListener('click', () => {
            const selected = btnSelectAll.getAttribute('data-selected') === '1';
            const next = !selected;
            btnSelectAll.setAttribute('data-selected', next ? '1' : '0');
            btnSelectAll.classList.toggle('active', next);
            toggleSelectAll(next);
        });
    }
    
    const btnDeleteSelected = document.getElementById('btnDeleteSelected');
    if (btnDeleteSelected) btnDeleteSelected.addEventListener('click', deletarSelecionadas);
    
    // Botão limpar filtros
    const btnLimparFiltros = document.getElementById('btnLimparFiltros');
    if (btnLimparFiltros) btnLimparFiltros.addEventListener('click', limparFiltros);

    document.body.addEventListener('change', function (e) {
        if (e.target && e.target.classList && e.target.classList.contains('sala-select')) {
            bindSelectAllState();
        }
    });

    populateFilterEscritorios();
    populateFilterAndares();
    
    const filterEscritorio = document.getElementById('filterEscritorio');
    if (filterEscritorio) {
        filterEscritorio.addEventListener('change', (e) => {
            currentFilters.escritorio = e.target.value;
            atualizarListaSalas();
        });
    }
    
    const filterAndar = document.getElementById('filterAndar');
    if (filterAndar) {
        filterAndar.addEventListener('change', (e) => {
            currentFilters.andar = e.target.value;
            atualizarListaSalas();
        });
    }
    
    const searchEl = document.getElementById('searchSala');
    if (searchEl) {
        searchEl.addEventListener('input', (e) => {
            currentFilters.query = e.target.value || '';
            atualizarListaSalas();
        });
    }

    const selEscr = document.getElementById('selectEscritorio');
    if (selEscr) selEscr.addEventListener('change', atualizarAndares);
    const selAnd = document.getElementById('selectAndar');
    if (selAnd) selAnd.addEventListener('change', atualizarNumeroSala);

    atualizarAndares();
    atualizarListaSalas();
});