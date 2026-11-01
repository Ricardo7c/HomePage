// =============================================================
// CONFIGURAÇÃO DO TAILWIND CSS
// =============================================================
if (window.tailwind) {
  tailwind.config = {
    darkMode: 'class',
    theme: {
      extend: {
        colors: {
          brand: {
            50: '#f0f9ff',
            400: '#38bdf8',
            500: '#0ea5e9',
            600: '#0284c7',
          },
          darkBg: '#090d16',
          cardBg: '#111827',
          cardHover: '#172033',
          borderSubtle: '#1f293d'
        }
      }
    }
  };
}

// =============================================================
// CONFIGURAÇÃO DO GOOGLE CLIENT ID
// =============================================================
const GOOGLE_CLIENT_ID = "711193125996-p20lv3u2e25dchrtpf9tea2g9oh3rd8r.apps.googleusercontent.com";

// -------------------------------------------------------------
// DADOS INICIAIS (FALLBACK SE O LOCALSTORAGE ESTIVER VAZIO)
// -------------------------------------------------------------
const DADOS_INICIAIS = [
  {
    id: "bloco_ias",
    titulo: "Inteligência Artificial",
    favoritos: [
      { nome: "ChatGPT", url: "https://chatgpt.com" },
      { nome: "Gemini", url: "https://gemini.google.com" },
      { nome: "Copilot", url: "https://copilot.microsoft.com" },
      { nome: "DeepSeek", url: "https://chat.deepseek.com" },
      { nome: "Duck.ai", url: "https://duck.ai" },
      { nome: "Leo.ai", url: "https://brave.com/leo/" },
      { nome: "Lumo", url: "https://lumo.proton.me" }
    ]
  },
  {
    id: "bloco_emails",
    titulo: "E-mails",
    favoritos: [
      { nome: "Outlook", url: "https://outlook.live.com" },
      { nome: "Gmail", url: "https://mail.google.com" },
      { nome: "Proton Mail", url: "https://mail.proton.me" },
      { nome: "Tuta Mail", url: "https://app.tuta.com" }
    ]
  },
  {
    id: "bloco_entretenimento",
    titulo: "Entretenimento",
    favoritos: [
      { nome: "YouTube", url: "https://www.youtube.com" },
      { nome: "YouTube Music", url: "https://music.youtube.com" },
      { nome: "Instagram", url: "https://www.instagram.com" },
      { nome: "Facebook", url: "https://www.facebook.com" },
      { nome: "LinkedIn", url: "https://linkedin.com" },
      { nome: "GitHub", url: "https://github.com" }
    ]
  }
];

// Estado Geral da Aplicação
let categorias = [];
let googleAccessToken = null;
let tokenClient = null;
let driveFileId = null;
let filtroAtual = "";
let motorBuscaAtivo = "ddg"; // 'ddg' (DuckDuckGo) ou 'google'

// -------------------------------------------------------------
// INICIALIZAÇÃO
// -------------------------------------------------------------
window.addEventListener('DOMContentLoaded', () => {
  carregarPreferenciasMotor();
  carregarDadosLocais();
  renderizarBlocos();
  verificarSessaoSalvaDrive();
});

function carregarDadosLocais() {
  const versaoLista = "v5_entretenimento_block";
  const versaoSalva = localStorage.getItem('homepage_dados_versao');
  const salvo = localStorage.getItem('homepage_dados');

  if (versaoSalva !== versaoLista) {
    categorias = JSON.parse(JSON.stringify(DADOS_INICIAIS));
    localStorage.setItem('homepage_dados_versao', versaoLista);
    salvarDadosLocais();
    return;
  }

  if (salvo) {
    try {
      categorias = JSON.parse(salvo);
    } catch (e) {
      console.error("Erro ao carregar dados locais, restaurando padrão:", e);
      categorias = JSON.parse(JSON.stringify(DADOS_INICIAIS));
    }
  } else {
    categorias = JSON.parse(JSON.stringify(DADOS_INICIAIS));
    salvarDadosLocais();
  }
}

function salvarDadosLocais() {
  localStorage.setItem('homepage_dados', JSON.stringify(categorias));
  if (googleAccessToken) {
    sincronizarComDriveSilenciosamente();
  }
}

// -------------------------------------------------------------
// BUSCA, MOTORES E FILTROS EM TEMPO REAL
// -------------------------------------------------------------
function carregarPreferenciasMotor() {
  const motorSalvo = localStorage.getItem('homepage_motor_busca');
  if (motorSalvo === 'google' || motorSalvo === 'ddg') {
    motorBuscaAtivo = motorSalvo;
  } else {
    motorBuscaAtivo = 'ddg';
  }
  atualizarUIMotorBusca();
}

function alternarMenuMotor(event) {
  if (event) event.stopPropagation();
  const menu = document.getElementById('dropdownMotor');
  menu.classList.toggle('hidden');
}

function selecionarMotorBusca(motor) {
  motorBuscaAtivo = motor;
  localStorage.setItem('homepage_motor_busca', motor);
  atualizarUIMotorBusca();
  document.getElementById('dropdownMotor').classList.add('hidden');
  mostrarToast(`Motor padrão alterado para ${motor === 'ddg' ? 'DuckDuckGo' : 'Google'}`);
}

function atualizarUIMotorBusca() {
  const icone = document.getElementById('iconeMotorAtivo');
  const label = document.getElementById('labelMotorAtivo');
  const checkDdg = document.getElementById('checkDdg');
  const checkGoogle = document.getElementById('checkGoogle');

  if (motorBuscaAtivo === 'ddg') {
    icone.innerText = '🦆';
    label.innerText = 'DuckDuckGo';
    checkDdg.classList.remove('hidden');
    checkGoogle.classList.add('hidden');
  } else {
    icone.innerText = '🌐';
    label.innerText = 'Google';
    checkDdg.classList.add('hidden');
    checkGoogle.classList.remove('hidden');
  }
}

document.addEventListener('click', (e) => {
  const dropdown = document.getElementById('dropdownMotor');
  const btn = document.getElementById('btnMotorAtivo');
  if (dropdown && btn && !dropdown.contains(e.target) && !btn.contains(e.target)) {
    dropdown.classList.add('hidden');
  }
});

function filtrarFavoritos(termo) {
  filtroAtual = termo;
  renderizarBlocos();
}

function limparFiltro() {
  document.getElementById('searchInput').value = '';
  filtroAtual = '';
  renderizarBlocos();
}

function tratarBuscaEnter(event) {
  if (event.key === 'Enter') {
    executarBuscaWeb();
  }
}

function executarBuscaWeb() {
  const termo = document.getElementById('searchInput').value.trim();
  if (!termo) return;

  if (motorBuscaAtivo === 'ddg') {
    window.open(`https://duckduckgo.com/?q=${encodeURIComponent(termo)}`, '_blank');
  } else {
    window.open(`https://www.google.com/search?q=${encodeURIComponent(termo)}`, '_blank');
  }
}

// -------------------------------------------------------------
// IMPORTAÇÃO / EXPORTAÇÃO (BACKUP JSON)
// -------------------------------------------------------------
function alternarMenuBackup() {
  const dropdown = document.getElementById('backupDropdown');
  dropdown.classList.toggle('hidden');
}

document.addEventListener('click', (e) => {
  const dropdown = document.getElementById('backupDropdown');
  const btn = document.getElementById('btnBackupMenu');
  if (!dropdown.contains(e.target) && !btn.contains(e.target)) {
    dropdown.classList.add('hidden');
  }
});

function exportarBackupJSON() {
  const jsonStr = JSON.stringify(categorias, null, 2);
  const blob = new Blob([jsonStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement("a");
  link.href = url;
  link.download = `homepage_backup_${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  
  document.getElementById('backupDropdown').classList.add('hidden');
  mostrarToast("Backup JSON baixado com sucesso!");
}

function importarBackupJSON(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async function(e) {
    try {
      const dadosImportados = JSON.parse(e.target.result);
      if (Array.isArray(dadosImportados)) {
        categorias = dadosImportados.map(b => ({
          id: b.id || ('bloco_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4)),
          titulo: b.titulo || 'Novo Bloco',
          favoritos: Array.isArray(b.favoritos) ? b.favoritos : []
        }));

        salvarDadosLocais();
        renderizarBlocos();
        mostrarToast("Backup importado e sincronizado!");
        document.getElementById('backupDropdown').classList.add('hidden');
      } else {
        mostrarToast("O arquivo não possui o formato de lista de blocos válido.");
      }
    } catch (err) {
      console.error("Erro na importação JSON:", err);
      mostrarToast("Erro ao importar o arquivo JSON");
    }
  };
  reader.readAsText(file);
  event.target.value = '';
}

function restaurarPadraoComConfirmacao() {
  if (confirm("Deseja restaurar os blocos de demonstração? Isso substituirá sua lista atual.")) {
    categorias = JSON.parse(JSON.stringify(DADOS_INICIAIS));
    salvarDadosLocais();
    renderizarBlocos();
    mostrarToast("Dados padrão restaurados!");
    document.getElementById('backupDropdown').classList.add('hidden');
  }
}

// -------------------------------------------------------------
// INTEGRAÇÃO COM GOOGLE DRIVE (PERSISTENTE COM AUTO-LOGIN)
// -------------------------------------------------------------
function obterTokenClient() {
  if (!tokenClient && typeof google !== 'undefined' && google.accounts && google.accounts.oauth2) {
    tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: 'https://www.googleapis.com/auth/drive.appdata',
      callback: async (tokenResponse) => {
        if (tokenResponse.error) {
          console.warn("Autenticação não pôde ser completada:", tokenResponse.error);
          if (tokenResponse.error !== "interaction_required") {
            mostrarToast("Erro na autenticação com o Google");
          }
          return;
        }

        googleAccessToken = tokenResponse.access_token;
        
        // Salva token e cálculo de expiração (com margem de 60s)
        const expiresIn = tokenResponse.expires_in ? parseInt(tokenResponse.expires_in, 10) : 3500;
        const expiresAt = Date.now() + (expiresIn - 60) * 1000;
        localStorage.setItem('homepage_drive_token', googleAccessToken);
        localStorage.setItem('homepage_drive_expires_at', expiresAt.toString());
        localStorage.setItem('homepage_drive_conectado', 'true');

        atualizarStatusDrive(true);
        mostrarToast("Conectado ao Google Drive!");
        await carregarOuSalvarDrive();
      },
    });
  }
  return tokenClient;
}

async function verificarSessaoSalvaDrive() {
  const estaConectado = localStorage.getItem('homepage_drive_conectado') === 'true';
  if (!estaConectado) return;

  const tokenSalvo = localStorage.getItem('homepage_drive_token');
  const expiresAt = parseInt(localStorage.getItem('homepage_drive_expires_at') || '0', 10);
  driveFileId = localStorage.getItem('homepage_drive_file_id') || null;

  // Se o token ainda for válido no tempo
  if (tokenSalvo && Date.now() < expiresAt) {
    googleAccessToken = tokenSalvo;
    atualizarStatusDrive(true);
    carregarOuSalvarDrive();
    return;
  }

  // Se expirou, tenta renovar silenciosamente sem abrir pop-up
  tentarRenovarTokenSilencioso();
}

function tentarRenovarTokenSilencioso() {
  let tentativas = 0;
  const intervalo = setInterval(() => {
    tentativas++;
    const client = obterTokenClient();
    if (client) {
      clearInterval(intervalo);
      // prompt: '' tenta renovar em background sem interromper o usuário
      client.requestAccessToken({ prompt: '' });
    }
    if (tentativas > 10) {
      clearInterval(intervalo);
    }
  }, 500);
}

function acionarLoginGoogleDrive() {
  if (!GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID.includes("SEU_CLIENT_ID_AQUI")) {
    mostrarToast("Configure a constante GOOGLE_CLIENT_ID no código primeiro!");
    return;
  }

  // Se já estiver logado, oferece sincronizar ou sair
  if (googleAccessToken) {
    if (confirm("Você já está conectado ao Google Drive.\n\n• Clique OK para sincronizar agora\n• Clique Cancelar para SAIR e desconectar a conta")) {
      carregarOuSalvarDrive();
    } else {
      desconectarGoogleDrive();
    }
    return;
  }

  if (typeof google === 'undefined' || !google.accounts || !google.accounts.oauth2) {
    mostrarToast("Biblioteca do Google ainda carregando. Aguarde alguns segundos...");
    return;
  }

  const client = obterTokenClient();
  if (client) {
    // Abre o consentimento interativo para o primeiro login
    client.requestAccessToken({ prompt: 'select_account' });
  }
}

async function carregarOuSalvarDrive() {
  if (!googleAccessToken) return;

  try {
    mostrarToast("Verificando backup na nuvem...");

    const query = encodeURIComponent("name = 'favoritos_backup.json' and 'appDataFolder' in parents and trashed = false");
    const listRes = await fetch(`https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=${query}&fields=files(id, name)`, {
      headers: { 'Authorization': `Bearer ${googleAccessToken}` }
    });

    if (listRes.status === 401) {
      tentarRenovarTokenSilencioso();
      return;
    }

    const listData = await listRes.json();

    if (listData.files && listData.files.length > 0) {
      driveFileId = listData.files[0].id;
      localStorage.setItem('homepage_drive_file_id', driveFileId);

      const fileRes = await fetch(`https://www.googleapis.com/drive/v3/files/${driveFileId}?alt=media`, {
        headers: { 'Authorization': `Bearer ${googleAccessToken}` }
      });
      const conteudoNuvem = await fileRes.json();

      if (Array.isArray(conteudoNuvem) && conteudoNuvem.length > 0) {
        categorias = conteudoNuvem;
        localStorage.setItem('homepage_dados', JSON.stringify(categorias));
        renderizarBlocos();
        mostrarToast("Sincronizado com o Google Drive!");
        return;
      }
    }

    await sincronizarComDriveSilenciosamente();
    mostrarToast("Backup salvo no Google Drive!");
  } catch (e) {
    console.error("Erro na sincronização:", e);
    mostrarToast("Erro ao sincronizar com Google Drive");
  }
}

async function sincronizarComDriveSilenciosamente() {
  if (!googleAccessToken) return;

  try {
    const metadata = {
      name: 'favoritos_backup.json',
      mimeType: 'application/json',
      parents: ['appDataFolder']
    };

    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', new Blob([JSON.stringify(categorias)], { type: 'application/json' }));

    const endpoint = driveFileId 
      ? `https://www.googleapis.com/upload/drive/v3/files/${driveFileId}?uploadType=multipart`
      : 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';

    const method = driveFileId ? 'PATCH' : 'POST';

    const res = await fetch(endpoint, {
      method: method,
      headers: { 'Authorization': `Bearer ${googleAccessToken}` },
      body: form
    });

    if (res.status === 401) {
      tentarRenovarTokenSilencioso();
      return;
    }

    const data = await res.json();
    if (data.id) {
      driveFileId = data.id;
      localStorage.setItem('homepage_drive_file_id', driveFileId);
    }
  } catch (err) {
    console.warn("Falha no salvamento automático no Google Drive:", err);
  }
}

function atualizarStatusDrive(conectado) {
  const syncText = document.getElementById('syncStatusText');
  const icon = document.getElementById('driveStatusIcon');

  if (conectado) {
    syncText.innerText = "Drive Sincronizado";
    icon.className = "ph-fill ph-check-circle text-emerald-400 text-lg";
  } else {
    syncText.innerText = "Conectar Drive";
    icon.className = "ph-bold ph-google-drive-logo text-emerald-400 text-lg";
  }
}

function desconectarGoogleDrive() {
  if (googleAccessToken && typeof google !== 'undefined' && google.accounts && google.accounts.oauth2) {
    google.accounts.oauth2.revoke(googleAccessToken, () => {
      console.log("Token revogado no Google.");
    });
  }

  googleAccessToken = null;
  driveFileId = null;

  localStorage.removeItem('homepage_drive_token');
  localStorage.removeItem('homepage_drive_expires_at');
  localStorage.removeItem('homepage_drive_conectado');
  localStorage.removeItem('homepage_drive_file_id');

  atualizarStatusDrive(false);
  mostrarToast("Desconectado com sucesso!");
}

// -------------------------------------------------------------
// RENDERIZAÇÃO DOS BLOCOS E FAVORITOS
// -------------------------------------------------------------
function renderizarBlocos() {
  const container = document.getElementById('blocksContainer');
  const emptyState = document.getElementById('emptyState');
  const filterBanner = document.getElementById('filterBanner');

  if (!container) return;

  if (filtroAtual.trim() !== '') {
    filterBanner?.classList.remove('hidden');
  } else {
    filterBanner?.classList.add('hidden');
  }

  const termoBusca = filtroAtual.toLowerCase().trim();

  const blocosVisiveis = categorias.map(bloco => {
    const listaFavoritos = Array.isArray(bloco.favoritos) ? bloco.favoritos : [];
    const favoritosFiltrados = listaFavoritos.filter(fav => 
      fav.nome.toLowerCase().includes(termoBusca) ||
      fav.url.toLowerCase().includes(termoBusca)
    );
    return {
      ...bloco,
      favoritos: favoritosFiltrados,
      deveExibir: favoritosFiltrados.length > 0 || (termoBusca === '' || bloco.titulo.toLowerCase().includes(termoBusca))
    };
  }).filter(b => termoBusca === '' ? true : b.deveExibir);

  if (blocosVisiveis.length === 0) {
    container.innerHTML = '';
    emptyState?.classList.remove('hidden');
    return;
  }

  emptyState?.classList.add('hidden');
  container.innerHTML = '';

  blocosVisiveis.forEach((bloco) => {
    const card = document.createElement('div');
    card.className = "bg-cardBg border border-borderSubtle hover:border-slate-700/80 rounded-2xl p-4 sm:p-5 shadow-lg transition-all duration-200 flex flex-col";

    const header = document.createElement('div');
    header.className = "flex items-center justify-between pb-3 mb-3 border-b border-borderSubtle/60";
    header.innerHTML = `
      <div class="flex items-center gap-2 overflow-hidden flex-1 mr-2">
        <span class="w-2 h-2 rounded-full bg-brand-400 shrink-0"></span>
        <h2 class="font-semibold text-slate-100 text-sm truncate" title="${escaparHTML(bloco.titulo)}">
          ${escaparHTML(bloco.titulo)}
        </h2>
        <span class="text-[11px] text-slate-500 font-mono">(${bloco.favoritos ? bloco.favoritos.length : 0})</span>
      </div>
      <div class="flex items-center space-x-1 shrink-0">
        <button 
          onclick="abrirModalFavorito('${bloco.id}')" 
          class="p-1.5 text-slate-400 hover:text-brand-400 hover:bg-slate-800/80 rounded-lg transition-colors"
          title="Adicionar Favorito">
          <i class="ph-bold ph-plus text-base"></i>
        </button>
        <button 
          onclick="editarBloco('${bloco.id}')" 
          class="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 rounded-lg transition-colors"
          title="Renomear Bloco">
          <i class="ph-bold ph-pencil-simple text-base"></i>
        </button>
        <button 
          onclick="excluirBloco('${bloco.id}')" 
          class="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800/80 rounded-lg transition-colors"
          title="Excluir Bloco">
          <i class="ph-bold ph-trash text-base"></i>
        </button>
      </div>
    `;
    card.appendChild(header);

    const lista = document.createElement('div');
    lista.className = "flex flex-col gap-1.5 flex-1";

    if (!bloco.favoritos || bloco.favoritos.length === 0) {
      lista.innerHTML = `
        <div class="py-6 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl">
          Nenhum favorito neste bloco.
          <button onclick="abrirModalFavorito('${bloco.id}')" class="block mx-auto mt-2 text-brand-400 hover:underline">
            + Adicionar link
          </button>
        </div>
      `;
    } else {
      bloco.favoritos.forEach((fav, favIdx) => {
        const item = document.createElement('div');
        item.className = "group flex items-center justify-between p-2 rounded-xl hover:bg-cardHover border border-transparent hover:border-slate-800 transition-all duration-150";

        const domain = extrairDominio(fav.url);
        let iconeHtml = '';
        
        if (fav.icone && fav.icone.trim().length <= 4) {
          iconeHtml = `<span class="w-6 h-6 flex items-center justify-center text-lg shrink-0">${escaparHTML(fav.icone)}</span>`;
        } else if (fav.icone && fav.icone.startsWith('http')) {
          iconeHtml = `<img src="${escaparHTML(fav.icone)}" class="w-5 h-5 rounded object-cover shrink-0" onerror="tratarErroFavicon(this, '${domain}')"/>`;
        } else {
          const urlDuck = `https://icons.duckduckgo.com/ip3/${domain}.ico`;
          iconeHtml = `<img src="${urlDuck}" alt="" class="w-5 h-5 rounded shrink-0 object-contain" onerror="tratarErroFavicon(this, '${domain}')"/>`;
        }

        item.innerHTML = `
          <a href="${escaparHTML(fav.url)}" target="_blank" rel="noopener noreferrer" class="flex items-center gap-3 min-w-0 flex-1">
            ${iconeHtml}
            <div class="min-w-0 flex-1">
              <span class="text-xs font-medium text-slate-200 group-hover:text-brand-400 transition-colors block truncate">
                ${escaparHTML(fav.nome)}
              </span>
              <span class="text-[10px] text-slate-500 block truncate">
                ${escaparHTML(extrairDominio(fav.url))}
              </span>
            </div>
          </a>
          <div class="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity pl-2">
            <button 
              onclick="editarFavorito('${bloco.id}', ${favIdx})" 
              class="p-1 text-slate-400 hover:text-slate-200 rounded hover:bg-slate-700/60 transition-colors"
              title="Editar">
              <i class="ph-bold ph-pencil-simple text-xs"></i>
            </button>
            <button 
              onclick="excluirFavorito('${bloco.id}', ${favIdx})" 
              class="p-1 text-slate-400 hover:text-rose-400 rounded hover:bg-slate-700/60 transition-colors"
              title="Excluir">
              <i class="ph-bold ph-x text-xs"></i>
            </button>
          </div>
        `;
        lista.appendChild(item);
      });
    }

    card.appendChild(lista);
    container.appendChild(card);
  });
}

// -------------------------------------------------------------
// GESTÃO DE BLOCOS (MODAL & OPERAÇÕES)
// -------------------------------------------------------------
function abrirModalBloco() {
  document.getElementById('editBlocoId').value = '';
  document.getElementById('inputTituloBloco').value = '';
  document.getElementById('modalBlocoTitle').innerHTML = '<i class="ph-bold ph-folder-plus text-brand-400"></i> Novo Bloco';
  document.getElementById('modalBloco').classList.remove('hidden');
  setTimeout(() => document.getElementById('inputTituloBloco').focus(), 50);
}

function fecharModalBloco() {
  document.getElementById('modalBloco').classList.add('hidden');
}

function editarBloco(blocoId) {
  const bloco = categorias.find(b => b.id === blocoId);
  if (!bloco) return;

  document.getElementById('editBlocoId').value = bloco.id;
  document.getElementById('inputTituloBloco').value = bloco.titulo;
  document.getElementById('modalBlocoTitle').innerHTML = '<i class="ph-bold ph-pencil text-brand-400"></i> Renomear Bloco';
  document.getElementById('modalBloco').classList.remove('hidden');
  setTimeout(() => document.getElementById('inputTituloBloco').focus(), 50);
}

function salvarBloco(event) {
  event.preventDefault();
  const id = document.getElementById('editBlocoId').value.trim();
  const titulo = document.getElementById('inputTituloBloco').value.trim();

  if (!titulo) return;

  if (id) {
    const bloco = categorias.find(b => b.id === id);
    if (bloco) bloco.titulo = titulo;
    mostrarToast("Bloco renomeado com sucesso!");
  } else {
    const novoBloco = {
      id: 'bloco_' + Date.now(),
      titulo: titulo,
      favoritos: []
    };
    categorias.push(novoBloco);
    mostrarToast("Novo bloco criado!");
  }

  salvarDadosLocais();
  renderizarBlocos();
  fecharModalBloco();
}

let blocoIdParaExcluir = null;

function excluirBloco(blocoId) {
  const bloco = categorias.find(b => b.id === blocoId);
  if (!bloco) return;

  blocoIdParaExcluir = blocoId;
  const texto = document.getElementById('confirmacaoTexto');
  if (texto) {
    texto.innerText = `Tem certeza que deseja excluir o bloco "${bloco.titulo}" e todos os seus links? Esta ação não pode ser desfeita.`;
  }

  const btnConfirmar = document.getElementById('btnConfirmarExclusao');
  if (btnConfirmar) {
    btnConfirmar.onclick = confirmarExclusaoBloco;
  }

  const modal = document.getElementById('modalConfirmacao');
  if (modal) {
    modal.classList.remove('hidden');
  }
}

function fecharModalConfirmacao() {
  const modal = document.getElementById('modalConfirmacao');
  if (modal) {
    modal.classList.add('hidden');
  }
  blocoIdParaExcluir = null;
}

function confirmarExclusaoBloco() {
  if (!blocoIdParaExcluir) return;

  categorias = categorias.filter(b => b.id !== blocoIdParaExcluir);
  salvarDadosLocais();
  renderizarBlocos();
  mostrarToast("Bloco excluído com sucesso!");
  fecharModalConfirmacao();
}

// -------------------------------------------------------------
// GESTÃO DE FAVORITOS (MODAL & OPERAÇÕES)
// -------------------------------------------------------------
function abrirModalFavorito(blocoId) {
  document.getElementById('favBlocoId').value = blocoId;
  document.getElementById('editFavIndex').value = '-1';
  document.getElementById('inputFavUrl').value = '';
  document.getElementById('inputFavNome').value = '';
  document.getElementById('inputFavIcone').value = '';
  document.getElementById('modalFavoritoTitle').innerHTML = '<i class="ph-bold ph-bookmark-simple text-brand-400"></i> Adicionar Favorito';
  document.getElementById('modalFavorito').classList.remove('hidden');
  setTimeout(() => document.getElementById('inputFavUrl').focus(), 50);
}

function fecharModalFavorito() {
  document.getElementById('modalFavorito').classList.add('hidden');
}

function editarFavorito(blocoId, favIndex) {
  const bloco = categorias.find(b => b.id === blocoId);
  if (!bloco || !bloco.favoritos[favIndex]) return;

  const fav = bloco.favoritos[favIndex];
  document.getElementById('favBlocoId').value = blocoId;
  document.getElementById('editFavIndex').value = favIndex;
  document.getElementById('inputFavUrl').value = fav.url;
  document.getElementById('inputFavNome').value = fav.nome;
  document.getElementById('inputFavIcone').value = fav.icone || '';
  document.getElementById('modalFavoritoTitle').innerHTML = '<i class="ph-bold ph-pencil-simple text-brand-400"></i> Editar Favorito';
  document.getElementById('modalFavorito').classList.remove('hidden');
}

function preencherNomeAutomatico(url) {
  const nomeInput = document.getElementById('inputFavNome');
  if (url && !nomeInput.value.trim()) {
    try {
      const host = extrairDominio(url).replace('www.', '');
      const partes = host.split('.');
      if (partes.length > 0) {
        nomeInput.value = partes[0].charAt(0).toUpperCase() + partes[0].slice(1);
      }
    } catch (e) {}
  }
}

function salvarFavorito(event) {
  event.preventDefault();
  const blocoId = document.getElementById('favBlocoId').value;
  const favIndex = parseInt(document.getElementById('editFavIndex').value, 10);
  let url = document.getElementById('inputFavUrl').value.trim();
  const nome = document.getElementById('inputFavNome').value.trim();
  const icone = document.getElementById('inputFavIcone').value.trim();

  if (!url || !nome) return;

  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }

  const bloco = categorias.find(b => b.id === blocoId);
  if (!bloco) return;

  const itemFavorito = { nome, url, icone };

  if (favIndex >= 0 && bloco.favoritos[favIndex]) {
    bloco.favoritos[favIndex] = itemFavorito;
    mostrarToast("Favorito atualizado!");
  } else {
    bloco.favoritos.push(itemFavorito);
    mostrarToast("Favorito adicionado!");
  }

  salvarDadosLocais();
  renderizarBlocos();
  fecharModalFavorito();
}

function excluirFavorito(blocoId, favIndex) {
  const bloco = categorias.find(b => b.id === blocoId);
  if (!bloco || !bloco.favoritos[favIndex]) return;

  bloco.favoritos.splice(favIndex, 1);
  salvarDadosLocais();
  renderizarBlocos();
  mostrarToast("Favorito removido!");
}

// -------------------------------------------------------------
// UTILITÁRIOS
// -------------------------------------------------------------
function tratarErroFavicon(imgElement, domain) {
  const fallbackGoogle = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
  if (imgElement.src !== fallbackGoogle) {
    imgElement.src = fallbackGoogle;
  } else {
    imgElement.outerHTML = '<span class="w-5 h-5 flex items-center justify-center text-slate-500 shrink-0"><i class="ph-bold ph-globe text-base"></i></span>';
  }
}

function extrairDominio(url) {
  try {
    let limpa = url;
    if (!limpa.startsWith('http://') && !limpa.startsWith('https://')) {
      limpa = 'https://' + limpa;
    }
    return new URL(limpa).hostname;
  } catch (e) {
    return "google.com";
  }
}

function escaparHTML(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function mostrarToast(mensagem) {
  const toast = document.getElementById('toast');
  const toastMsg = document.getElementById('toastMsg');
  toastMsg.innerText = mensagem;

  toast.classList.remove('translate-y-20', 'opacity-0');
  toast.classList.add('translate-y-0', 'opacity-100');

  setTimeout(() => {
    toast.classList.remove('translate-y-0', 'opacity-100');
    toast.classList.add('translate-y-20', 'opacity-0');
  }, 2500);
}
