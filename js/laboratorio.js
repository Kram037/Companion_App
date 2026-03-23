// ============================================================================
// LABORATORIO - Homebrew content management
// ============================================================================

let _labCurrentTab = 'classi';
let _labEditingId = null;

const LAB_CATEGORIES = {
    classi: {
        table: 'homebrew_classi',
        label: 'Classe',
        icon: '⚔',
        fields: () => labFieldsClassi()
    },
    razze: {
        table: 'homebrew_razze',
        label: 'Razza',
        icon: '🧬',
        fields: () => labFieldsRazze()
    },
    background: {
        table: 'homebrew_background',
        label: 'Background',
        icon: '📜',
        fields: () => labFieldsBackground()
    },
    incantesimi: {
        table: 'homebrew_incantesimi',
        label: 'Incantesimo',
        icon: '✨',
        fields: () => labFieldsIncantesimi()
    },
    nemici: {
        table: 'homebrew_nemici',
        label: 'Nemico',
        icon: '💀',
        fields: () => labFieldsNemici()
    },
    talenti: {
        table: 'homebrew_talenti',
        label: 'Talento',
        icon: '⭐',
        fields: () => labFieldsTalenti()
    },
    oggetti: {
        table: 'homebrew_oggetti',
        label: 'Oggetto',
        icon: '🎒',
        fields: () => labFieldsOggetti()
    }
};

// ============================================================================
// TAB SWITCHING & LOADING
// ============================================================================

function labSwitchTab(tab) {
    _labCurrentTab = tab;
    document.querySelectorAll('.lab-tab').forEach(t => {
        t.classList.toggle('active', t.dataset.lab === tab);
    });
    loadLabContent();
}

async function loadLabContent() {
    const container = document.getElementById('labContent');
    if (!container) return;

    const supabase = getSupabaseClient();
    if (!supabase || !AppState.isLoggedIn) {
        container.innerHTML = '<div class="content-placeholder"><p>Accedi per creare i tuoi contenuti homebrew</p></div>';
        return;
    }

    const cat = LAB_CATEGORIES[_labCurrentTab];
    if (!cat) return;

    const userData = await findUserByUid(AppState.currentUser?.uid);
    if (!userData) return;

    const { data, error } = await supabase
        .from(cat.table)
        .select('*')
        .eq('user_id', userData.id)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Errore caricamento laboratorio:', error);
        container.innerHTML = '<div class="lab-empty">Errore nel caricamento</div>';
        return;
    }

    if (!data || data.length === 0) {
        container.innerHTML = `<div class="lab-empty">Nessun contenuto homebrew. Premi <strong>+</strong> per crearne uno!</div>`;
        return;
    }

    container.innerHTML = `<div class="lab-list">${data.map(item => labRenderCard(item, cat)).join('')}</div>`;
}

function labRenderCard(item, cat) {
    const detail = labGetCardDetail(item, _labCurrentTab);
    return `
    <div class="lab-card" data-id="${item.id}">
        <div class="lab-card-icon">${cat.icon}</div>
        <div class="lab-card-info">
            <p class="lab-card-name">${escapeHtml(item.nome)}</p>
            ${detail ? `<p class="lab-card-detail">${escapeHtml(detail)}</p>` : ''}
        </div>
        <div class="lab-card-actions">
            <button onclick="labEditItem('${item.id}')" title="Modifica">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
            </button>
            <button class="lab-delete" onclick="labDeleteItem('${item.id}')" title="Elimina">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            </button>
        </div>
    </div>`;
}

function labGetCardDetail(item, tab) {
    switch (tab) {
        case 'classi': {
            const parts = [];
            if (item.dado_vita) parts.push(`d${item.dado_vita}`);
            if (item.tipo_caster) parts.push(item.tipo_caster);
            return parts.join(' · ');
        }
        case 'razze': return `${item.taglia || ''} · ${item.velocita || 9}m`;
        case 'background': return '';
        case 'incantesimi': {
            const lvl = item.livello === 0 ? 'Trucchetto' : `Livello ${item.livello}`;
            return `${lvl}${item.scuola ? ' · ' + item.scuola : ''}`;
        }
        case 'nemici': return `CA ${item.classe_armatura || 10} · PV ${item.punti_vita_max || 10} · GS ${item.grado_sfida || '0'}`;
        case 'talenti': return item.prerequisiti || '';
        case 'oggetti': {
            const parts = [];
            if (item.tipo) parts.push(item.tipo);
            if (item.rarita) parts.push(item.rarita);
            return parts.join(' · ');
        }
        default: return '';
    }
}

// ============================================================================
// FORM FIELD GENERATORS
// ============================================================================

function labFieldsClassi(data) {
    const ts = (data?.tiri_salvezza || []);
    const saves = ['forza','destrezza','costituzione','intelligenza','saggezza','carisma'];
    return `
    <div class="form-group">
        <label for="hbNome">Nome</label>
        <input type="text" id="hbNome" required placeholder="Nome della classe" value="${escapeHtml(data?.nome || '')}">
    </div>
    <div class="form-row form-row-2">
        <div class="form-group">
            <label for="hbDadoVita">Dado Vita</label>
            <select id="hbDadoVita">
                ${[6,8,10,12].map(d => `<option value="${d}" ${(data?.dado_vita || 8) === d ? 'selected' : ''}>d${d}</option>`).join('')}
            </select>
        </div>
        <div class="form-group">
            <label for="hbTipoCaster">Tipo Caster</label>
            <select id="hbTipoCaster">
                <option value="" ${!data?.tipo_caster ? 'selected' : ''}>Nessuno</option>
                <option value="pieno" ${data?.tipo_caster === 'pieno' ? 'selected' : ''}>Pieno</option>
                <option value="mezzo" ${data?.tipo_caster === 'mezzo' ? 'selected' : ''}>Mezzo</option>
                <option value="terzo" ${data?.tipo_caster === 'terzo' ? 'selected' : ''}>Terzo</option>
            </select>
        </div>
    </div>
    <div class="form-group">
        <label>Tiri Salvezza</label>
        <div class="pg-res-grid" style="grid-template-columns: repeat(3, 1fr); gap: 6px;">
            ${saves.map(s => `
                <label style="display:flex;align-items:center;gap:4px;font-size:0.88em;cursor:pointer;">
                    <input type="checkbox" class="hbSaveCheck" value="${s}" ${ts.includes(s) ? 'checked' : ''}>
                    ${s.charAt(0).toUpperCase() + s.slice(1)}
                </label>
            `).join('')}
        </div>
    </div>
    <div class="form-group">
        <label>Risorse Speciali</label>
        <div id="hbRisorseList">${labRenderRisorse(data?.risorse_speciali || [])}</div>
        <button type="button" class="hb-add-btn" onclick="labAddRisorsa()">+ Aggiungi risorsa</button>
    </div>`;
}

function labRenderRisorse(risorse) {
    if (!risorse.length) return '';
    return risorse.map((r, i) => `
    <div class="hb-attack-row" data-idx="${i}">
        <input type="text" placeholder="Nome (es. Punti Ki)" value="${escapeHtml(r.nome || '')}" class="hbRisNome">
        <input type="number" placeholder="Lv min" value="${r.livello_min || 1}" class="hbRisLvMin" style="width:60px">
        <button type="button" onclick="this.parentElement.remove()">✕</button>
    </div>`).join('');
}

window.labAddRisorsa = function() {
    const list = document.getElementById('hbRisorseList');
    if (!list) return;
    const idx = list.children.length;
    const row = document.createElement('div');
    row.className = 'hb-attack-row';
    row.dataset.idx = idx;
    row.innerHTML = `
        <input type="text" placeholder="Nome (es. Punti Ki)" class="hbRisNome">
        <input type="number" placeholder="Lv min" value="1" class="hbRisLvMin" style="width:60px">
        <button type="button" onclick="this.parentElement.remove()">✕</button>`;
    list.appendChild(row);
};

function labFieldsRazze(data) {
    return `
    <div class="form-group">
        <label for="hbNome">Nome</label>
        <input type="text" id="hbNome" required placeholder="Nome della razza" value="${escapeHtml(data?.nome || '')}">
    </div>
    <div class="form-row form-row-2">
        <div class="form-group">
            <label for="hbTaglia">Taglia</label>
            <select id="hbTaglia">
                ${['Piccola','Media','Grande'].map(t => `<option value="${t}" ${(data?.taglia || 'Media') === t ? 'selected' : ''}>${t}</option>`).join('')}
            </select>
        </div>
        <div class="form-group">
            <label for="hbVelocita">Velocità (m)</label>
            <input type="number" id="hbVelocita" step="1.5" value="${data?.velocita || 9}">
        </div>
    </div>`;
}

function labFieldsBackground(data) {
    return `
    <div class="form-group">
        <label for="hbNome">Nome</label>
        <input type="text" id="hbNome" required placeholder="Nome del background" value="${escapeHtml(data?.nome || '')}">
    </div>`;
}

function labFieldsIncantesimi(data) {
    const scuole = ['Abiurazione','Ammaliamento','Divinazione','Evocazione','Illusione','Invocazione','Necromanzia','Trasmutazione'];
    return `
    <div class="form-group">
        <label for="hbNome">Nome</label>
        <input type="text" id="hbNome" required placeholder="Nome dell'incantesimo" value="${escapeHtml(data?.nome || '')}">
    </div>
    <div class="form-row form-row-2">
        <div class="form-group">
            <label for="hbLivello">Livello</label>
            <select id="hbLivello">
                <option value="0" ${(data?.livello ?? 0) === 0 ? 'selected' : ''}>Trucchetto</option>
                ${[1,2,3,4,5,6,7,8,9].map(l => `<option value="${l}" ${data?.livello === l ? 'selected' : ''}>${l}°</option>`).join('')}
            </select>
        </div>
        <div class="form-group">
            <label for="hbScuola">Scuola</label>
            <select id="hbScuola">
                <option value="">-</option>
                ${scuole.map(s => `<option value="${s}" ${data?.scuola === s ? 'selected' : ''}>${s}</option>`).join('')}
            </select>
        </div>
    </div>
    <div class="form-row form-row-2">
        <div class="form-group">
            <label for="hbTempoLancio">Tempo di Lancio</label>
            <input type="text" id="hbTempoLancio" placeholder="1 azione" value="${escapeHtml(data?.tempo_lancio || '')}">
        </div>
        <div class="form-group">
            <label for="hbGittata">Gittata</label>
            <input type="text" id="hbGittata" placeholder="36m" value="${escapeHtml(data?.gittata || '')}">
        </div>
    </div>
    <div class="form-row form-row-2">
        <div class="form-group">
            <label for="hbComponenti">Componenti</label>
            <input type="text" id="hbComponenti" placeholder="V, S, M" value="${escapeHtml(data?.componenti || '')}">
        </div>
        <div class="form-group">
            <label for="hbDurata">Durata</label>
            <input type="text" id="hbDurata" placeholder="Istantaneo" value="${escapeHtml(data?.durata || '')}">
        </div>
    </div>
    <div class="form-group">
        <label for="hbDescrizione">Descrizione</label>
        <textarea id="hbDescrizione" rows="3" placeholder="Descrizione breve...">${escapeHtml(data?.descrizione || '')}</textarea>
    </div>`;
}

function labFieldsNemici(data) {
    const tipi = ['Aberrazione','Bestia','Celestiale','Costrutto','Drago','Elementale','Fatato','Immondo','Melma','Mostruosità','Non Morto','Pianta','Umanoide'];
    const taglie = ['Minuscola','Piccola','Media','Grande','Enorme','Mastodontica'];
    return `
    <div class="form-group">
        <label for="hbNome">Nome</label>
        <input type="text" id="hbNome" required placeholder="Nome del nemico" value="${escapeHtml(data?.nome || '')}">
    </div>
    <div class="form-row form-row-2">
        <div class="form-group">
            <label for="hbTipo">Tipo</label>
            <select id="hbTipo">
                <option value="">-</option>
                ${tipi.map(t => `<option value="${t}" ${data?.tipo === t ? 'selected' : ''}>${t}</option>`).join('')}
            </select>
        </div>
        <div class="form-group">
            <label for="hbTaglia">Taglia</label>
            <select id="hbTaglia">
                ${taglie.map(t => `<option value="${t}" ${(data?.taglia || 'Media') === t ? 'selected' : ''}>${t}</option>`).join('')}
            </select>
        </div>
    </div>
    <div class="form-row form-row-2">
        <div class="form-group">
            <label for="hbCA">CA</label>
            <input type="number" id="hbCA" value="${data?.classe_armatura || 10}">
        </div>
        <div class="form-group">
            <label for="hbPV">PV Massimi</label>
            <input type="number" id="hbPV" value="${data?.punti_vita_max || 10}">
        </div>
    </div>
    <div class="form-row form-row-2">
        <div class="form-group">
            <label for="hbGS">Grado Sfida</label>
            <input type="text" id="hbGS" placeholder="1" value="${escapeHtml(data?.grado_sfida || '')}">
        </div>
        <div class="form-group">
            <label for="hbVelocita">Velocità</label>
            <input type="text" id="hbVelocita" placeholder="9m" value="${escapeHtml(data?.velocita || '9m')}">
        </div>
    </div>
    <div class="form-section-label" style="margin-top: var(--spacing-sm);">Caratteristiche</div>
    <div class="hb-stats-grid">
        <div class="form-group"><label>FOR</label><input type="number" id="hbFor" value="${data?.forza || 10}"></div>
        <div class="form-group"><label>DES</label><input type="number" id="hbDes" value="${data?.destrezza || 10}"></div>
        <div class="form-group"><label>COS</label><input type="number" id="hbCos" value="${data?.costituzione || 10}"></div>
        <div class="form-group"><label>INT</label><input type="number" id="hbInt" value="${data?.intelligenza || 10}"></div>
        <div class="form-group"><label>SAG</label><input type="number" id="hbSag" value="${data?.saggezza || 10}"></div>
        <div class="form-group"><label>CAR</label><input type="number" id="hbCar" value="${data?.carisma || 10}"></div>
    </div>
    <div class="form-group" style="margin-top: var(--spacing-sm);">
        <label>Attacchi</label>
        <div id="hbAttacchiList">${labRenderAttacchi(data?.attacchi || [])}</div>
        <button type="button" class="hb-add-btn" onclick="labAddAttacco()">+ Aggiungi attacco</button>
    </div>`;
}

function labRenderAttacchi(attacchi) {
    if (!attacchi.length) return '';
    return attacchi.map((a, i) => `
    <div class="hb-attack-row" data-idx="${i}">
        <input type="text" placeholder="Nome" value="${escapeHtml(a.nome || '')}" class="hbAtkNome">
        <input type="text" placeholder="Bonus" value="${escapeHtml(a.bonus || '')}" class="hbAtkBonus" style="width:55px">
        <input type="text" placeholder="Danno" value="${escapeHtml(a.danno || '')}" class="hbAtkDanno" style="width:70px">
        <button type="button" onclick="this.parentElement.remove()">✕</button>
    </div>`).join('');
}

window.labAddAttacco = function() {
    const list = document.getElementById('hbAttacchiList');
    if (!list) return;
    const row = document.createElement('div');
    row.className = 'hb-attack-row';
    row.innerHTML = `
        <input type="text" placeholder="Nome" class="hbAtkNome">
        <input type="text" placeholder="Bonus" class="hbAtkBonus" style="width:55px">
        <input type="text" placeholder="Danno" class="hbAtkDanno" style="width:70px">
        <button type="button" onclick="this.parentElement.remove()">✕</button>`;
    list.appendChild(row);
};

function labFieldsTalenti(data) {
    return `
    <div class="form-group">
        <label for="hbNome">Nome</label>
        <input type="text" id="hbNome" required placeholder="Nome del talento" value="${escapeHtml(data?.nome || '')}">
    </div>
    <div class="form-group">
        <label for="hbPrerequisiti">Prerequisiti</label>
        <input type="text" id="hbPrerequisiti" placeholder="Es. Forza 13+" value="${escapeHtml(data?.prerequisiti || '')}">
    </div>
    <div class="form-group">
        <label for="hbEffetti">Effetti</label>
        <textarea id="hbEffetti" rows="3" placeholder="Descrizione degli effetti...">${escapeHtml(data?.effetti || '')}</textarea>
    </div>`;
}

function labFieldsOggetti(data) {
    const tipi = ['Arma','Armatura','Pozione','Pergamena','Anello','Bacchetta','Bastone','Oggetto Meraviglioso','Altro'];
    const rarita = ['Comune','Non Comune','Raro','Molto Raro','Leggendario','Artefatto'];
    return `
    <div class="form-group">
        <label for="hbNome">Nome</label>
        <input type="text" id="hbNome" required placeholder="Nome dell'oggetto" value="${escapeHtml(data?.nome || '')}">
    </div>
    <div class="form-row form-row-2">
        <div class="form-group">
            <label for="hbTipoOgg">Tipo</label>
            <select id="hbTipoOgg">
                <option value="">-</option>
                ${tipi.map(t => `<option value="${t}" ${data?.tipo === t ? 'selected' : ''}>${t}</option>`).join('')}
            </select>
        </div>
        <div class="form-group">
            <label for="hbRarita">Rarità</label>
            <select id="hbRarita">
                ${rarita.map(r => `<option value="${r}" ${(data?.rarita || 'Comune') === r ? 'selected' : ''}>${r}</option>`).join('')}
            </select>
        </div>
    </div>
    <div class="form-group">
        <label for="hbProprieta">Proprietà</label>
        <textarea id="hbProprieta" rows="3" placeholder="Descrizione proprietà...">${escapeHtml(data?.proprieta || '')}</textarea>
    </div>`;
}

// ============================================================================
// MODAL OPEN / CLOSE / SAVE
// ============================================================================

window.openHomebrewModal = function(editData) {
    _labEditingId = editData?.id || null;
    const cat = LAB_CATEGORIES[_labCurrentTab];
    if (!cat) return;

    const modal = document.getElementById('homebrewModal');
    const title = document.getElementById('homebrewModalTitle');
    const content = document.getElementById('homebrewFormContent');
    const saveBtn = document.getElementById('saveHomebrewBtn');

    title.textContent = _labEditingId ? `Modifica ${cat.label}` : `${cat.label} Homebrew`;
    saveBtn.textContent = _labEditingId ? 'Salva' : 'Crea';
    content.innerHTML = cat.fields(editData);

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
};

window.closeHomebrewModal = function() {
    const modal = document.getElementById('homebrewModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
        _labEditingId = null;
    }
};

window.labEditItem = async function(id) {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    const cat = LAB_CATEGORIES[_labCurrentTab];
    if (!cat) return;
    const { data, error } = await supabase.from(cat.table).select('*').eq('id', id).single();
    if (error || !data) { showNotification('Errore nel caricamento'); return; }
    openHomebrewModal(data);
};

window.labDeleteItem = async function(id) {
    const confirmed = await showConfirm('Eliminare questo contenuto homebrew?');
    if (!confirmed) return;
    const supabase = getSupabaseClient();
    if (!supabase) return;
    const cat = LAB_CATEGORIES[_labCurrentTab];
    if (!cat) return;
    const { error } = await supabase.from(cat.table).delete().eq('id', id);
    if (error) { showNotification('Errore nella cancellazione'); return; }
    showNotification('Eliminato');
    loadLabContent();
};

async function handleSaveHomebrew(e) {
    e.preventDefault();
    const supabase = getSupabaseClient();
    if (!supabase) return;
    const cat = LAB_CATEGORIES[_labCurrentTab];
    if (!cat) return;

    const nome = document.getElementById('hbNome')?.value?.trim();
    if (!nome) { showNotification('Inserisci un nome'); return; }

    const userData = await findUserByUid(AppState.currentUser?.uid);
    if (!userData) { showNotification('Errore: utente non trovato'); return; }

    const saveBtn = document.getElementById('saveHomebrewBtn');
    if (saveBtn) { saveBtn.disabled = true; saveBtn.textContent = 'Salvataggio...'; }

    let record = { nome, updated_at: new Date().toISOString() };

    switch (_labCurrentTab) {
        case 'classi':
            record.dado_vita = parseInt(document.getElementById('hbDadoVita')?.value) || 8;
            record.tipo_caster = document.getElementById('hbTipoCaster')?.value || null;
            record.tiri_salvezza = [...document.querySelectorAll('.hbSaveCheck:checked')].map(cb => cb.value);
            record.risorse_speciali = [...document.querySelectorAll('#hbRisorseList .hb-attack-row')].map(row => ({
                nome: row.querySelector('.hbRisNome')?.value || '',
                livello_min: parseInt(row.querySelector('.hbRisLvMin')?.value) || 1
            })).filter(r => r.nome);
            break;
        case 'razze':
            record.taglia = document.getElementById('hbTaglia')?.value || 'Media';
            record.velocita = parseFloat(document.getElementById('hbVelocita')?.value) || 9;
            break;
        case 'background':
            break;
        case 'incantesimi':
            record.livello = parseInt(document.getElementById('hbLivello')?.value) || 0;
            record.scuola = document.getElementById('hbScuola')?.value || null;
            record.tempo_lancio = document.getElementById('hbTempoLancio')?.value?.trim() || null;
            record.gittata = document.getElementById('hbGittata')?.value?.trim() || null;
            record.componenti = document.getElementById('hbComponenti')?.value?.trim() || null;
            record.durata = document.getElementById('hbDurata')?.value?.trim() || null;
            record.descrizione = document.getElementById('hbDescrizione')?.value?.trim() || null;
            break;
        case 'nemici':
            record.tipo = document.getElementById('hbTipo')?.value || null;
            record.taglia = document.getElementById('hbTaglia')?.value || 'Media';
            record.classe_armatura = parseInt(document.getElementById('hbCA')?.value) || 10;
            record.punti_vita_max = parseInt(document.getElementById('hbPV')?.value) || 10;
            record.grado_sfida = document.getElementById('hbGS')?.value?.trim() || '0';
            record.velocita = document.getElementById('hbVelocita')?.value?.trim() || '9m';
            record.forza = parseInt(document.getElementById('hbFor')?.value) || 10;
            record.destrezza = parseInt(document.getElementById('hbDes')?.value) || 10;
            record.costituzione = parseInt(document.getElementById('hbCos')?.value) || 10;
            record.intelligenza = parseInt(document.getElementById('hbInt')?.value) || 10;
            record.saggezza = parseInt(document.getElementById('hbSag')?.value) || 10;
            record.carisma = parseInt(document.getElementById('hbCar')?.value) || 10;
            record.attacchi = [...document.querySelectorAll('#hbAttacchiList .hb-attack-row')].map(row => ({
                nome: row.querySelector('.hbAtkNome')?.value || '',
                bonus: row.querySelector('.hbAtkBonus')?.value || '',
                danno: row.querySelector('.hbAtkDanno')?.value || ''
            })).filter(a => a.nome);
            break;
        case 'talenti':
            record.prerequisiti = document.getElementById('hbPrerequisiti')?.value?.trim() || null;
            record.effetti = document.getElementById('hbEffetti')?.value?.trim() || null;
            break;
        case 'oggetti':
            record.tipo = document.getElementById('hbTipoOgg')?.value || null;
            record.rarita = document.getElementById('hbRarita')?.value || 'Comune';
            record.proprieta = document.getElementById('hbProprieta')?.value?.trim() || null;
            break;
    }

    try {
        if (_labEditingId) {
            const { error } = await supabase.from(cat.table).update(record).eq('id', _labEditingId);
            if (error) throw error;
            showNotification(`${cat.label} aggiornato`);
        } else {
            record.user_id = userData.id;
            const { error } = await supabase.from(cat.table).insert(record);
            if (error) throw error;
            showNotification(`${cat.label} creato`);
        }
        closeHomebrewModal();
        loadLabContent();
    } catch (err) {
        console.error('Errore salvataggio homebrew:', err);
        showNotification('Errore nel salvataggio');
    } finally {
        if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = _labEditingId ? 'Salva' : 'Crea'; }
    }
}

// ============================================================================
// INIT BINDINGS (called from init.js)
// ============================================================================

function initLaboratorio() {
    const tabsContainer = document.getElementById('labTabs');
    if (tabsContainer) {
        tabsContainer.addEventListener('click', (e) => {
            const tab = e.target.closest('.lab-tab');
            if (tab && tab.dataset.lab) labSwitchTab(tab.dataset.lab);
        });
    }

    const addBtn = document.getElementById('addHomebrewBtn');
    if (addBtn) {
        addBtn.addEventListener('click', () => openHomebrewModal());
    }

    const closeBtn = document.getElementById('closeHomebrewModal');
    if (closeBtn) closeBtn.addEventListener('click', closeHomebrewModal);

    const cancelBtn = document.getElementById('cancelHomebrewBtn');
    if (cancelBtn) cancelBtn.addEventListener('click', closeHomebrewModal);

    const modal = document.getElementById('homebrewModal');
    if (modal) {
        modal.addEventListener('click', (e) => { if (e.target === modal) closeHomebrewModal(); });
    }

    const form = document.getElementById('homebrewForm');
    if (form) {
        form.addEventListener('submit', handleSaveHomebrew);
        form.addEventListener('keydown', (e) => { if (e.key === 'Enter') e.preventDefault(); });
    }
}
