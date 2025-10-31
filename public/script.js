// Variáveis globais
let currentStream = null;
let capturedPhotoData = null;
let salasData = [];
let filteredSalas = [];
let selectedSalas = new Set();

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    loadSalas();
    setupEventListeners();
});

// Configurar event listeners
function setupEventListeners() {
    document.getElementById('search-salas').addEventListener('input', filterSalas);
    document.getElementById('filter-status').addEventListener('change', filterSalas);
    document.getElementById('filter-andar').addEventListener('change', filterSalas);
    document.getElementById('photo-input').addEventListener('change', handleFileUpload);
}

// Carregar salas
async function loadSalas() {
    try {
        const response = await fetch('/api/salas');
        salasData = await response.json();
        filteredSalas = [...salasData];
        renderSalas();
    } catch (error) {
        console.error('Erro ao carregar salas:', error);
        showAlert('Erro ao carregar salas', 'danger');
    }
}

// Renderizar salas
function renderSalas() {
    const container = document.getElementById('salas-container');
    
    if (filteredSalas.length === 0) {
        container.innerHTML = `
            <div class="col-12">
                <div class="alert alert-info text-center">
                    <i class="fas fa-info-circle me-2"></i>
                    Nenhuma sala encontrada com os filtros aplicados.
                </div>
            </div>
        `;
        return;
    }

    container.innerHTML = filteredSalas.map(sala => `
        <div class="col-md-6 col-lg-4">
            <div class="card sala-card status-${getStatusClass(sala.status)} fade-in">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-start mb-3">
                        <div class="d-flex align-items-center">
                            <input type="checkbox" class="form-check-input me-2 sala-checkbox" 
                                   value="${sala.id}" onchange="toggleSalaSelection(${sala.id})">
                            <div>
                                <h5 class="card-title mb-1">${sala.sala}</h5>
                                <small class="text-muted">${sala.andar} - ${sala.escritorio}</small>
                            </div>
                        </div>
                        <span class="badge status-badge bg-${getStatusColor(sala.status)}">${sala.status}</span>
                    </div>
                    
                    <div class="equipamentos-grid mb-3">
                        <div class="equipamento-item">
                            <div class="status-indicator">
                                <span class="status-dot status-${sala.tv.toLowerCase()}"></span>
                                <small>TV</small>
                            </div>
                        </div>
                        <div class="equipamento-item">
                            <div class="status-indicator">
                                <span class="status-dot status-${sala.controle.toLowerCase()}"></span>
                                <small>Controle</small>
                            </div>
                        </div>
                        <div class="equipamento-item">
                            <div class="status-indicator">
                                <span class="status-dot status-${sala.ramal.toLowerCase().replace('/', '')}"></span>
                                <small>Ramal</small>
                            </div>
                        </div>
                        <div class="equipamento-item">
                            <div class="status-indicator">
                                <span class="status-dot status-${sala.videoconf.toLowerCase().replace('/', '')}"></span>
                                <small>Videoconf</small>
                            </div>
                        </div>
                        <div class="equipamento-item">
                            <div class="status-indicator">
                                <span class="status-dot status-${sala.manual.toLowerCase().replace('/', '')}"></span>
                                <small>Manual</small>
                            </div>
                        </div>
                        <div class="equipamento-item">
                            <div class="status-indicator">
                                <span class="status-dot status-${sala.monitor.toLowerCase().replace('/', '')}"></span>
                                <small>Monitor</small>
                            </div>
                        </div>
                    </div>
                    
                    <div class="mb-3">
                        <small class="text-muted">
                            <i class="fas fa-calendar me-1"></i>
                            Última revisão: ${formatDate(sala.data_revisao)}
                        </small>
                    </div>
                    
                    <div class="d-flex justify-content-between align-items-center">
                        <button class="btn btn-primary btn-sm" onclick="openRevisaoModal(${sala.id})">
                            <i class="fas fa-edit"></i> Revisar
                        </button>
                        <button class="btn btn-outline-info btn-sm" onclick="viewHistorico(${sala.id})">
                            <i class="fas fa-history"></i> Histórico
                        </button>
                    </div>
                    
                    ${sala.observacoes && sala.observacoes !== 'OK' ? `
                        <div class="mt-2">
                            <small class="text-warning">
                                <i class="fas fa-exclamation-triangle"></i> ${sala.observacoes}
                            </small>
                        </div>
                    ` : ''}
                    
                    ${sala.foto_path ? `
                        <div class="mt-2 foto-container">
                            <img src="/${sala.foto_path}" class="foto-sala" style="width: 100%; height: 80px; object-fit: cover;" 
                                 onclick="showFullPhoto('/${sala.foto_path}')">
                        </div>
                    ` : ''}
                </div>
            </div>
        </div>
    `).join('');
}

// Funções auxiliares
function getStatusClass(status) {
    switch(status) {
        case 'Revisão OK': return 'ok';
        case 'Em Uso': return 'uso';
        default: return 'problema';
    }
}

function getStatusColor(status) {
    switch(status) {
        case 'Revisão OK': return 'success';
        case 'Em Uso': return 'warning';
        default: return 'danger';
    }
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
}

// Filtrar salas
function filterSalas() {
    const searchTerm = document.getElementById('search-salas').value.toLowerCase();
    const statusFilter = document.getElementById('filter-status').value;
    const andarFilter = document.getElementById('filter-andar').value;
    
    filteredSalas = salasData.filter(sala => {
        const matchesSearch = sala.sala.toLowerCase().includes(searchTerm) ||
                            sala.andar.toLowerCase().includes(searchTerm);
        const matchesStatus = !statusFilter || sala.status === statusFilter;
        const matchesAndar = !andarFilter || sala.andar === andarFilter;
        
        return matchesSearch && matchesStatus && matchesAndar;
    });
    
    renderSalas();
}

// Abrir modal de revisão
async function openRevisaoModal(salaId) {
    try {
        const response = await fetch(`/api/salas/${salaId}`);
        const sala = await response.json();
        
        document.getElementById('sala-id').value = sala.id;
        document.getElementById('tv').value = sala.tv;
        document.getElementById('controle').value = sala.controle;
        document.getElementById('ramal').value = sala.ramal;
        document.getElementById('videoconf').value = sala.videoconf;
        document.getElementById('manual').value = sala.manual;
        document.getElementById('monitor').value = sala.monitor;
        document.getElementById('status').value = sala.status;
        document.getElementById('observacoes').value = sala.observacoes;
        document.getElementById('troca-pilha-tv').value = sala.troca_pilha_tv || '';
        document.getElementById('analista').value = sala.analista || 'Kaique';
        
        const modal = new bootstrap.Modal(document.getElementById('revisaoModal'));
        modal.show();
    } catch (error) {
        console.error('Erro ao carregar dados da sala:', error);
        showAlert('Erro ao carregar dados da sala', 'danger');
    }
}

// Iniciar câmera
async function startCamera() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { width: 320, height: 240 } 
        });
        
        const video = document.getElementById('video');
        video.srcObject = stream;
        currentStream = stream;
        
        showAlert('Câmera iniciada com sucesso!', 'success');
    } catch (error) {
        console.error('Erro ao acessar câmera:', error);
        showAlert('Erro ao acessar câmera. Verifique as permissões.', 'danger');
    }
}

// Capturar foto
function capturePhoto() {
    const video = document.getElementById('video');
    const canvas = document.getElementById('canvas');
    const photoPreview = document.getElementById('photo-preview');
    
    if (!currentStream) {
        showAlert('Inicie a câmera primeiro!', 'warning');
        return;
    }
    
    const context = canvas.getContext('2d');
    context.drawImage(video, 0, 0, 320, 240);
    
    capturedPhotoData = canvas.toDataURL('image/jpeg');
    photoPreview.src = capturedPhotoData;
    photoPreview.style.display = 'block';
    
    showAlert('Foto capturada com sucesso!', 'success');
}

// Parar câmera
function stopCamera() {
    if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
        currentStream = null;
        
        const video = document.getElementById('video');
        video.srcObject = null;
        
        showAlert('Câmera parada', 'info');
    }
}

// Lidar com upload de arquivo
function handleFileUpload(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            capturedPhotoData = e.target.result;
            document.getElementById('photo-preview').src = e.target.result;
            document.getElementById('photo-preview').style.display = 'block';
        };
        reader.readAsDataURL(file);
    }
}

// Salvar revisão
async function saveRevisao() {
    const formData = new FormData();
    const salaId = document.getElementById('sala-id').value;
    
    // Adicionar dados do formulário
    formData.append('tv', document.getElementById('tv').value);
    formData.append('controle', document.getElementById('controle').value);
    formData.append('ramal', document.getElementById('ramal').value);
    formData.append('videoconf', document.getElementById('videoconf').value);
    formData.append('manual', document.getElementById('manual').value);
    formData.append('monitor', document.getElementById('monitor').value);
    formData.append('status', document.getElementById('status').value);
    formData.append('observacoes', document.getElementById('observacoes').value);
    formData.append('troca_pilha_tv', document.getElementById('troca-pilha-tv').value);
    formData.append('analista', document.getElementById('analista').value);
    
    // Adicionar foto se capturada
    if (capturedPhotoData) {
        const blob = dataURLtoBlob(capturedPhotoData);
        formData.append('foto', blob, `sala_${salaId}_${Date.now()}.jpg`);
    }
    
    try {
        const response = await fetch(`/api/salas/${salaId}`, {
            method: 'PUT',
            body: formData
        });
        
        if (response.ok) {
            showAlert('Revisão salva com sucesso!', 'success');
            bootstrap.Modal.getInstance(document.getElementById('revisaoModal')).hide();
            loadSalas();
            resetRevisaoForm();
        } else {
            throw new Error('Erro ao salvar revisão');
        }
    } catch (error) {
        console.error('Erro ao salvar revisão:', error);
        showAlert('Erro ao salvar revisão', 'danger');
    }
}

// Converter data URL para blob
function dataURLtoBlob(dataurl) {
    const arr = dataurl.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
}

// Resetar formulário de revisão
function resetRevisaoForm() {
    capturedPhotoData = null;
    document.getElementById('photo-preview').style.display = 'none';
    document.getElementById('photo-preview').src = '';
    stopCamera();
}

// Mostrar alertas
function showAlert(message, type) {
    const alertContainer = document.createElement('div');
    alertContainer.className = `alert alert-${type} alert-dismissible fade show alert-custom`;
    alertContainer.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(alertContainer);
    
    setTimeout(() => {
        if (alertContainer.parentNode) {
            alertContainer.remove();
        }
    }, 5000);
}

// Exportar para Excel
async function exportToExcel() {
    try {
        const response = await fetch('/api/export/excel');
        const blob = await response.blob();
        
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `revisao_salas_${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        showAlert('Planilha exportada com sucesso!', 'success');
    } catch (error) {
        console.error('Erro ao exportar:', error);
        showAlert('Erro ao exportar planilha', 'danger');
    }
}

// Inicializar dados
async function initData() {
    try {
        const response = await fetch('/api/init-data', { method: 'POST' });
        if (response.ok) {
            showAlert('Dados inicializados com sucesso!', 'success');
            loadSalas();
        } else {
            throw new Error('Erro ao inicializar dados');
        }
    } catch (error) {
        console.error('Erro ao inicializar dados:', error);
        showAlert('Erro ao inicializar dados', 'danger');
    }
}

// Mostrar dashboard
async function showDashboard() {
    document.getElementById('salas-section').classList.add('d-none');
    document.getElementById('dashboard-section').classList.remove('d-none');
    
    try {
        const response = await fetch('/api/dashboard');
        const data = await response.json();
        
        document.getElementById('total-salas').textContent = data.totalSalas[0].total;
        document.getElementById('salas-ok').textContent = data.salasOk[0].total;
        document.getElementById('salas-problemas').textContent = data.salasComProblemas[0].total;
        
        if (data.ultimasRevisoes.length > 0) {
            document.getElementById('ultima-revisao').textContent = formatDate(data.ultimasRevisoes[0].data_revisao);
        }
        
        // Renderizar últimas revisões
        const container = document.getElementById('ultimas-revisoes');
        container.innerHTML = data.ultimasRevisoes.map(revisao => `
            <div class="historico-item">
                <div class="d-flex justify-content-between">
                    <div>
                        <strong>Sala ${revisao.sala}</strong> - ${revisao.andar}
                    </div>
                    <small class="text-muted">${formatDate(revisao.data_revisao)}</small>
                </div>
                <div class="text-muted">
                    <small>Analista: ${revisao.analista}</small>
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Erro ao carregar dashboard:', error);
        showAlert('Erro ao carregar dashboard', 'danger');
    }
}

// Voltar para lista de salas
function showSalasList() {
    document.getElementById('dashboard-section').classList.add('d-none');
    document.getElementById('salas-section').classList.remove('d-none');
}

// Adicionar nova sala
function showAddSalaModal() {
    const modal = new bootstrap.Modal(document.getElementById('addSalaModal'));
    modal.show();
}

async function addSala() {
    const escritorio = document.getElementById('new-escritorio').value;
    const sala = document.getElementById('new-sala').value;
    const andar = document.getElementById('new-andar').value;
    
    try {
        const response = await fetch('/api/salas', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                escritorio,
                sala,
                andar,
                tv: 'OK',
                controle: 'OK',
                ramal: 'N/A',
                videoconf: 'OK',
                manual: 'N/A',
                monitor: 'OK',
                status: 'Revisão OK',
                observacoes: 'OK'
            })
        });
        
        if (response.ok) {
            showAlert('Sala adicionada com sucesso!', 'success');
            bootstrap.Modal.getInstance(document.getElementById('addSalaModal')).hide();
            loadSalas();
            document.getElementById('addSalaForm').reset();
        } else {
            throw new Error('Erro ao adicionar sala');
        }
    } catch (error) {
        console.error('Erro ao adicionar sala:', error);
        showAlert('Erro ao adicionar sala', 'danger');
    }
}

// Ver histórico
async function viewHistorico(salaId) {
    try {
        const responseAL = await fetch(`/api/salas/${salaId}/historico`);
        const historico = await responseAL.json();
        
        let historicoHtml = `
            <div class="modal fade" id="historicoModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Histórico de Revisões</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
        `;
        
        if (historico.length === 0) {
            historicoHtml += '<p class="text-muted">Nenhum histórico encontrado.</p>';
        } else {
            historico.forEach(item => {
                historicoHtml += `
                    <div class="historico-item">
                        <div class="d-flex justify-content-between align-items-start">
                            <div>
                                <strong>Data: ${formatDate(item.data_revisao)}</strong>
                                <br>
                                <small class="text-muted">Analista: ${item.analista}</small>
                                ${item.observacoes ? `<br><small>Obs: ${item.observacoes}</small>` : ''}
                            </div>
                            ${item.foto_path ? `
                                <img src="/${item.foto_path}" style="width: 80px; height: 60px; object-fit: cover; border-radius: 5px;" 
                                     onclick="showFullPhoto('/${item.foto_path}')">
                            ` : ''}
                        </div>
                    </div>
                `;
            });
        }
        
        historicoHtml += `
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Fechar</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Remover modal anterior se existir
        const existingModal = document.getElementById('historicoModal');
        if (existingModal) {
            existingModal.remove();
        }
        
        document.body.insertAdjacentHTML('beforeend', historicoHtml);
        const modal = new bootstrap.Modal(document.getElementById('historicoModal'));
        modal.show();
        
    } catch (error) {
        console.error('Erro ao carregar histórico:', error);
        showAlert('Erro ao carregar histórico', 'danger');
    }
}

// Mostrar foto em tamanho completo
function showFullPhoto(photoPath) {
    const modalHtml = `
        <div class="modal fade" id="photoModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Foto da Sala</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body text-center">
                        <img src="${photoPath}" class="img-fluid" alt="Foto da sala">
                    </div>
                </div>
            </div>
        </div>
    `;
    
    const existingModal = document.getElementById('photoModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    const modal = new bootstrap.Modal(document.getElementById('photoModal'));
    modal.show();
}

// Event listeners para navegação
document.addEventListener('click', function(e) {
    if (e.target.matches('[data-action="show-salas"]')) {
        showSalasList();
    }
});

// Funções de seleção e exclusão de salas
function toggleSalaSelection(salaId) {
    if (selectedSalas.has(salaId)) {
        selectedSalas.delete(salaId);
    } else {
        selectedSalas.add(salaId);
    }
    
    updateDeleteButton();
}

function updateDeleteButton() {
    const deleteBtn = document.getElementById('deleteBtn');
    if (selectedSalas.size > 0) {
        deleteBtn.style.display = 'inline-block';
        deleteBtn.innerHTML = `<i class="fas fa-trash"></i> Excluir (${selectedSalas.size})`;
    } else {
        deleteBtn.style.display = 'none';
    }
}

function showDeleteModal() {
    if (selectedSalas.size === 0) {
        showAlert('Selecione pelo menos uma sala para excluir', 'warning');
        return;
    }
    
    const selectedSalasList = document.getElementById('selectedSalasList');
    const selectedSalasArray = Array.from(selectedSalas);
    const salasToDelete = filteredSalas.filter(sala => selectedSalasArray.includes(sala.id));
    
    selectedSalasList.innerHTML = salasToDelete.map(sala => `
        <div class="d-flex justify-content-between align-items-center p-2 bg-light rounded mb-2">
            <div>
                <strong>${sala.sala}</strong> - ${sala.andar} - ${sala.escritorio}
            </div>
            <span class="badge bg-${getStatusColor(sala.status)}">${sala.status}</span>
        </div>
    `).join('');
    
    const modal = new bootstrap.Modal(document.getElementById('deleteModal'));
    modal.show();
}

async function confirmDelete() {
    if (selectedSalas.size === 0) {
        showAlert('Nenhuma sala selecionada', 'warning');
        return;
    }
    
    try {
        const selectedSalasArray = Array.from(selectedSalas);
        const deletePromises = selectedSalasArray.map(salaId => 
            fetch(`/api/salas/${salaId}`, { method: 'DELETE' })
        );
        
        const responses = await Promise.all(deletePromises);
        const allSuccessful = responses.every(response => response.ok);
        
        if (allSuccessful) {
            showAlert(`${selectedSalas.size} sala(s) excluída(s) com sucesso!`, 'success');
            selectedSalas.clear();
            updateDeleteButton();
            loadSalas();
            bootstrap.Modal.getInstance(document.getElementById('deleteModal')).hide();
        } else {
            throw new Error('Erro ao excluir algumas salas');
        }
    } catch (error) {
        console.error('Erro ao excluir salas:', error);
        showAlert('Erro ao excluir salas', 'danger');
    }
}

// Função para selecionar/deselecionar todas as salas
function toggleAllSalas() {
    const checkboxes = document.querySelectorAll('.sala-checkbox');
    const allChecked = Array.from(checkboxes).every(cb => cb.checked);
    
    checkboxes.forEach(checkbox => {
        checkbox.checked = !allChecked;
        toggleSalaSelection(parseInt(checkbox.value));
    });
}

// Função para limpar seleção
function clearSelection() {
    selectedSalas.clear();
    const checkboxes = document.querySelectorAll('.sala-checkbox');
    checkboxes.forEach(checkbox => {
        checkbox.checked = false;
    });
    updateDeleteButton();
}


