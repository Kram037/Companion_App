// ============================================================================
// LABORATORIO - Homebrew content management
// ============================================================================

let _labCurrentTab = 'classi';
let _labEditingId = null;

const LAB_CATEGORIES = {
    classi: {
        table: 'homebrew_classi',
        label: 'Classe',
        labelPlural: 'Classi',
        icon: '⚔',
        fields: () => labFieldsClassi()
    },
    razze: {
        table: 'homebrew_razze',
        label: 'Razza',
        labelPlural: 'Razze',
        icon: '🧬',
        fields: () => ''
    },
    background: {
        table: 'homebrew_background',
        label: 'Background',
        labelPlural: 'Background',
        icon: '📜',
        fields: () => labFieldsBackground()
    },
    incantesimi: {
        table: 'homebrew_incantesimi',
        label: 'Incantesimo',
        labelPlural: 'Incantesimi',
        icon: '✨',
        fields: () => labFieldsIncantesimi()
    },
    nemici: {
        table: 'homebrew_nemici',
        label: 'Nemico',
        labelPlural: 'Nemici',
        icon: '💀',
        fields: () => labFieldsNemici()
    },
    talenti: {
        table: 'homebrew_talenti',
        label: 'Talento',
        labelPlural: 'Talenti',
        icon: '⭐',
        fields: () => labFieldsTalenti()
    },
    oggetti: {
        table: 'homebrew_oggetti',
        label: 'Oggetto',
        labelPlural: 'Oggetti',
        icon: '🎒',
        fields: () => labFieldsOggetti()
    },
    impostazioni: {
        label: 'Impostazioni',
        labelPlural: 'Impostazioni',
        icon: '⚙',
        isSettings: true
    }
};

// ============================================================================
// HUB & SUB-PAGE NAVIGATION
// ============================================================================

function labRenderHub() {
    const grid = document.getElementById('labHubGrid');
    if (!grid) return;
    grid.innerHTML = Object.entries(LAB_CATEGORIES).map(([key, cat]) => `
        <div class="lab-hub-card" onclick="labOpenCategory('${key}')">
            <span class="lab-hub-card-icon">${cat.icon}</span>
            <span class="lab-hub-card-label">${cat.labelPlural || cat.label + 'i'}</span>
        </div>
    `).join('');
    document.getElementById('laboratorioPage')?.classList.add('lab-hub-active');
}

window.labOpenCategory = function(tab) {
    _labCurrentTab = tab;
    const cat = LAB_CATEGORIES[tab];
    if (!cat) return;

    const hub = document.getElementById('labHub');
    const sub = document.getElementById('labSubPage');
    if (hub) hub.style.display = 'none';
    if (sub) sub.style.display = '';

    document.getElementById('laboratorioPage')?.classList.remove('lab-hub-active');

    const title = document.getElementById('labSubTitle');
    if (title) title.textContent = cat.labelPlural || cat.label;

    const addBtn = document.getElementById('addHomebrewBtn');
    if (addBtn) addBtn.style.visibility = cat.isSettings ? 'hidden' : '';

    if (cat.isSettings) {
        labRenderSettings();
    } else {
        loadLabContent();
    }
};

window.labBackToHub = function() {
    const hub = document.getElementById('labHub');
    const sub = document.getElementById('labSubPage');
    if (hub) hub.style.display = '';
    if (sub) sub.style.display = 'none';
    document.getElementById('laboratorioPage')?.classList.add('lab-hub-active');
};

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

    if (!AppState.currentUser?.uid) return;

    container.innerHTML = '<div class="lab-empty">Caricamento...</div>';

    const { data, error } = await supabase
        .from(cat.table)
        .select('*')
        .eq('user_id', AppState.currentUser.uid)
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
    const clickAction = _labCurrentTab === 'nemici' ? `onclick="labViewNemico('${item.id}')"` : '';
    return `
    <div class="lab-card" data-id="${item.id}" ${clickAction} style="${clickAction ? 'cursor:pointer' : ''}">
        <div class="lab-card-icon">${cat.icon}</div>
        <div class="lab-card-info">
            <p class="lab-card-name">${escapeHtml(item.nome)}</p>
            ${detail ? `<p class="lab-card-detail">${escapeHtml(detail)}</p>` : ''}
        </div>
        <div class="lab-card-actions">
            <button onclick="event.stopPropagation();labEditItem('${item.id}')" title="Modifica">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
            </button>
            <button class="lab-delete" onclick="event.stopPropagation();labDeleteItem('${item.id}')" title="Elimina">
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
        case 'razze': {
            const parts = [`${item.taglia || 'Media'}`, `${item.velocita || 9}m`];
            const nRes = (item.resistenze || []).length;
            if (nRes > 0) parts.push(`${nRes} res.`);
            const nLang = (item.linguaggi || []).length;
            if (nLang > 0) parts.push(`${nLang} ling.`);
            return parts.join(' · ');
        }
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

let _labRazzeWizardStep = 0;
const _LAB_RAZZE_STEPS = ['Identità', 'Resistenze', 'Competenze', 'Linguaggi', 'Abilità Speciali'];

function _openLabRazzeWizard(editData) {
    _labEditingId = editData?.id || null;
    const modal = document.getElementById('homebrewModal');
    if (!modal) return;
    const mlg = modal.querySelector('.modal-content-lg');
    if (!mlg) return;
    const p = editData || {};
    const pRes = p.resistenze || [];
    const pSkills = p.competenze_abilita || [];
    const pLangs = p.linguaggi || [];
    const pAbil = p.abilita_speciali || [];
    const langOptions = [...DND_LINGUAGGI, 'A scelta'];
    const genericAbil = pAbil.filter(a => a.tipo !== 'incantesimo');
    const innateSpells = pAbil.filter(a => a.tipo === 'incantesimo');

    _labRazzeWizardStep = 0;
    mlg.innerHTML = `
        <button class="modal-close" onclick="closeHomebrewModal()">&times;</button>
        <h2>${_labEditingId ? 'Modifica Razza' : 'Nuova Razza'}</h2>
        <div class="wizard-steps" id="razzeWizardSteps">${_LAB_RAZZE_STEPS.map((s,i) => `<span class="wizard-step ${i===0?'active':''}" title="${s}"></span>`).join('')}</div>
            <div class="wizard-page active" id="hbRStep0">
                <div class="form-section-label">Identità</div>
                <div class="wizard-page-scroll">
                    <div class="form-group">
                        <label for="hbNome">Nome</label>
                        <input type="text" id="hbNome" required placeholder="Nome della razza" value="${escapeHtml(p.nome || '')}">
                    </div>
                    <div class="form-row form-row-2">
                        <div class="form-group">
                            <label for="hbTaglia">Taglia</label>
                            <select id="hbTaglia">
                                ${['Piccola','Media','Grande'].map(t => `<option value="${t}" ${(p.taglia || 'Media') === t ? 'selected' : ''}>${t}</option>`).join('')}
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="hbVelocita">Velocità (m)</label>
                            <input type="number" id="hbVelocita" step="1.5" value="${p.velocita || 9}" inputmode="none" readonly onclick="pgOpenAbilityKeypad(this)">
                        </div>
                    </div>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn-secondary" onclick="closeHomebrewModal()">Annulla</button>
                    <button type="button" class="btn-primary" onclick="labRazzeWizardNav(1)">Successivo</button>
                </div>
            </div>
            <div class="wizard-page" id="hbRStep1">
                <div class="form-section-label">Resistenze</div>
                <div class="wizard-page-scroll">
                    <div class="hb-checkbox-grid" id="hbRazzeResGrid">
                        ${DAMAGE_TYPES.map(dt => `<label class="scheda-checkbox-item"><input type="checkbox" value="${dt.value}" ${pRes.includes(dt.value) ? 'checked' : ''}><span>${dt.label}</span></label>`).join('')}
                    </div>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn-secondary" onclick="labRazzeWizardNav(-1)">Indietro</button>
                    <button type="button" class="btn-primary" onclick="labRazzeWizardNav(1)">Successivo</button>
                </div>
            </div>
            <div class="wizard-page" id="hbRStep2">
                <div class="form-section-label">Competenze Abilità</div>
                <div class="wizard-page-scroll">
                    <div class="hb-checkbox-grid" id="hbRazzeSkillGrid">
                        ${SCHEDA_SKILLS.map(sk => `<label class="scheda-checkbox-item"><input type="checkbox" value="${sk.key}" ${pSkills.includes(sk.key) ? 'checked' : ''}><span>${sk.label}</span></label>`).join('')}
                    </div>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn-secondary" onclick="labRazzeWizardNav(-1)">Indietro</button>
                    <button type="button" class="btn-primary" onclick="labRazzeWizardNav(1)">Successivo</button>
                </div>
            </div>
            <div class="wizard-page" id="hbRStep3">
                <div class="form-section-label">Linguaggi</div>
                <div class="wizard-page-scroll">
                    <div class="hb-checkbox-grid" id="hbRazzeLangGrid">
                        ${langOptions.map(l => `<label class="scheda-checkbox-item"><input type="checkbox" value="${escapeHtml(l)}" ${pLangs.includes(l) ? 'checked' : ''}><span>${escapeHtml(l)}</span></label>`).join('')}
                    </div>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn-secondary" onclick="labRazzeWizardNav(-1)">Indietro</button>
                    <button type="button" class="btn-primary" onclick="labRazzeWizardNav(1)">Successivo</button>
                </div>
            </div>
            <div class="wizard-page" id="hbRStep4">
                <div class="form-section-label">Abilità Speciali <button type="button" class="btn-icon" onclick="labRazzeAddAbilita()" title="Aggiungi abilità">＋</button></div>
                <div class="wizard-page-scroll">
                    <div id="hbRazzeAbilitaList">
                        ${genericAbil.map(a => _labRazzeAbilitaRow(a)).join('')}
                    </div>
                    <div class="form-section-label" style="margin-top:var(--spacing-sm)">Incantesimi Innati <button type="button" class="btn-icon" onclick="labRazzeAddInnato()" title="Aggiungi incantesimo innato">＋</button></div>
                    <div id="hbRazzeInnatiList">
                        ${innateSpells.map(a => _labRazzeInnatoRow(a)).join('')}
                    </div>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn-secondary" onclick="labRazzeWizardNav(-1)">Indietro</button>
                    <button type="button" class="btn-primary" onclick="labSaveRazza()">Salva</button>
                </div>
            </div>`;
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

window.labRazzeWizardNav = function(dir) {
    const step = Math.max(0, Math.min(_LAB_RAZZE_STEPS.length - 1, _labRazzeWizardStep + dir));
    if (step === _labRazzeWizardStep) return;
    if (dir > 0 && _labRazzeWizardStep === 0) {
        const nome = document.getElementById('hbNome')?.value?.trim();
        if (!nome) { showNotification('Inserisci il nome della razza'); return; }
    }
    document.getElementById(`hbRStep${_labRazzeWizardStep}`)?.classList.remove('active');
    _labRazzeWizardStep = step;
    document.getElementById(`hbRStep${step}`)?.classList.add('active');
    const stepsBar = document.getElementById('razzeWizardSteps');
    if (stepsBar) stepsBar.querySelectorAll('.wizard-step').forEach((dot, i) => dot.classList.toggle('active', i <= step));
};

window.labSaveRazza = async function() {
    const record = {
        nome: document.getElementById('hbNome')?.value?.trim(),
        taglia: document.getElementById('hbTaglia')?.value || 'Media',
        velocita: parseFloat(document.getElementById('hbVelocita')?.value) || 9,
        resistenze: Array.from(document.querySelectorAll('#hbRazzeResGrid input:checked')).map(cb => cb.value),
        competenze_abilita: Array.from(document.querySelectorAll('#hbRazzeSkillGrid input:checked')).map(cb => cb.value),
        linguaggi: Array.from(document.querySelectorAll('#hbRazzeLangGrid input:checked')).map(cb => cb.value)
    };
    if (!record.nome) { showNotification('Inserisci il nome della razza'); return; }
    const abilita = [];
    document.querySelectorAll('#hbRazzeAbilitaList .hb-action-card').forEach(card => {
        const nome = card.querySelector('.hbRAbilNome')?.value?.trim();
        if (!nome) return;
        const usi = card.querySelector('.hbRAbilUsi')?.value;
        abilita.push({
            tipo: 'abilita',
            nome,
            descrizione: card.querySelector('.hbRAbilDesc')?.value?.trim() || '',
            bonus: card.querySelector('.hbRAbilHit')?.value?.trim() || '',
            usi: usi !== '' && usi !== undefined ? parseInt(usi) : null
        });
    });
    document.querySelectorAll('#hbRazzeInnatiList .hb-action-card').forEach(card => {
        const nome = card.querySelector('.hbRInnNome')?.value?.trim();
        if (!nome) return;
        const usi = card.querySelector('.hbRInnUsi')?.value;
        abilita.push({
            tipo: 'incantesimo',
            nome,
            livello: parseInt(card.querySelector('.hbRInnLvl')?.value) || 0,
            usi: usi !== '' && usi !== undefined ? parseInt(usi) : null
        });
    });
    record.abilita_speciali = abilita;
    if (!_labEditingId) record.user_id = AppState.currentUser.id;
    try {
        if (_labEditingId) {
            const { error } = await supabase.from('homebrew_razze').update(record).eq('id', _labEditingId);
            if (error) throw error;
            showNotification('Razza aggiornata!');
        } else {
            const { error } = await supabase.from('homebrew_razze').insert(record);
            if (error) throw error;
            showNotification('Razza creata!');
        }
        closeHomebrewModal();
        loadLabContent();
    } catch (e) { showNotification('Errore: ' + e.message); }
};

function _labActionCard(data, prefix, hasDesc) {
    data = data || {};
    const nome = data.nome || '';
    const bonus = data.bonus || '';
    const usi = data.usi ?? '';
    const desc = data.descrizione || '';
    return `<div class="hb-action-card">
        <div class="hb-action-card-row">
            <input type="text" class="${prefix}Nome" placeholder="Nome" value="${escapeHtml(nome)}">
            <button type="button" class="hb-action-remove" onclick="this.closest('.hb-action-card').remove()">✕</button>
        </div>
        <div class="hb-action-card-row">
            <div class="form-group" style="flex:1"><label>Tiro</label><input type="text" class="${prefix}Hit" placeholder="+5" value="${escapeHtml(bonus)}"></div>
            <div class="form-group" style="width:70px"><label>Usi</label><input type="number" class="${prefix}Usi" min="0" value="${usi}" placeholder="∞" inputmode="none" readonly onclick="pgOpenAbilityKeypad(this)"></div>
        </div>
        ${hasDesc ? `<textarea class="${prefix}Desc" placeholder="Descrizione..." rows="2">${escapeHtml(desc)}</textarea>` : ''}
    </div>`;
}

function _labRazzeAbilitaRow(data) {
    return _labActionCard(data, 'hbRAbil', true);
}

function _labRazzeInnatoRow(data) {
    data = data || {};
    const nome = data.nome || '';
    const livello = data.livello ?? 0;
    const usi = data.usi ?? '';
    return `<div class="hb-action-card">
        <div class="hb-action-card-row">
            <input type="text" class="hbRInnNome" placeholder="Nome incantesimo" value="${escapeHtml(nome)}">
            <button type="button" class="hb-action-remove" onclick="this.closest('.hb-action-card').remove()">✕</button>
        </div>
        <div class="hb-action-card-row">
            <div class="form-group" style="flex:1"><label>Livello</label><input type="number" class="hbRInnLvl" min="0" max="9" value="${livello}" inputmode="none" readonly onclick="pgOpenAbilityKeypad(this)"></div>
            <div class="form-group" style="width:70px"><label>Usi</label><input type="number" class="hbRInnUsi" min="0" value="${usi}" placeholder="∞" inputmode="none" readonly onclick="pgOpenAbilityKeypad(this)"></div>
        </div>
    </div>`;
}

window.labRazzeAddAbilita = function() {
    const list = document.getElementById('hbRazzeAbilitaList');
    if (!list) return;
    list.insertAdjacentHTML('beforeend', _labRazzeAbilitaRow());
};

window.labRazzeAddInnato = function() {
    const list = document.getElementById('hbRazzeInnatiList');
    if (!list) return;
    list.insertAdjacentHTML('beforeend', _labRazzeInnatoRow());
};

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

function _openLabNemiciWizard(data) {
    const modal = document.getElementById('homebrewModal');
    if (!modal) return;
    const mlg = modal.querySelector('.modal-content-lg');
    if (!mlg) return;

    const p = data || {};
    const pSaves = p.tiri_salvezza || [];
    const pSkills = p.competenze_abilita || [];
    const pExpert = p.maestrie_abilita || [];
    const pSlots = p.slot_incantesimo || {};
    const SPELL_ABILITIES = ['intelligenza','saggezza','carisma'];
    const SPELL_AB_LABELS = { intelligenza:'Intelligenza', saggezza:'Saggezza', carisma:'Carisma' };

    window._labNemResistenze = (p.resistenze || []).slice();
    window._labNemImmunita = (p.immunita || []).slice();
    window._labNemWizardStep = 0;

    mlg.innerHTML = `
        <button class="modal-close" onclick="closeHomebrewModal()">&times;</button>
        <h2>${_labEditingId ? 'Modifica Nemico' : 'Nemico Homebrew'}</h2>
        <div class="wizard-steps">
            ${[0,1,2,3,4,5,6,7].map(i => `<div class="wizard-step ${i===0?'active':''}" data-step="${i}"></div>`).join('')}
        </div>
        <form id="labNemiciForm" onsubmit="return false;">
            <div class="wizard-page active" id="hbNStep0">
                <div class="form-section-label">Identità</div>
                <div class="form-group">
                    <label for="hbNome">Nome</label>
                    <input type="text" id="hbNome" required placeholder="Nome del nemico" value="${escapeHtml(p.nome || '')}">
                </div>
                <div class="form-group">
                    <label>Tipologia</label>
                    <button type="button" class="custom-select-trigger" id="hbTipo" data-value="${p.tipo || MONSTER_TYPES[0]}" onclick="openMonsterFieldSelect('hbTipo',MONSTER_TYPES,'Tipologia')">${p.tipo || MONSTER_TYPES[0]}</button>
                </div>
                <div class="form-row form-row-2">
                    <div class="form-group">
                        <label>Taglia</label>
                        <button type="button" class="custom-select-trigger" id="hbTaglia" data-value="${p.taglia || 'Media'}" onclick="openMonsterFieldSelect('hbTaglia',MONSTER_SIZES,'Taglia')">${p.taglia || 'Media'}</button>
                    </div>
                    <div class="form-group">
                        <label for="hbGS">Grado Sfida</label>
                        <input type="text" id="hbGS" placeholder="1" value="${escapeHtml(p.grado_sfida || '')}">
                    </div>
                </div>
                <div class="form-group">
                    <label>Allineamento</label>
                    <button type="button" class="custom-select-trigger" id="hbAllineamento" data-value="${p.allineamento || MONSTER_ALIGNMENTS[0]}" onclick="openMonsterFieldSelect('hbAllineamento',MONSTER_ALIGNMENTS,'Allineamento')">${p.allineamento || MONSTER_ALIGNMENTS[0]}</button>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn-secondary" onclick="closeHomebrewModal()">Annulla</button>
                    <button type="button" class="btn-primary" onclick="labNemWizardNav(1)">Successivo</button>
                </div>
            </div>
            <div class="wizard-page" id="hbNStep1">
                <div class="form-section-label">Caratteristiche e Tiri Salvezza</div>
                <div class="wizard-page-scroll">
                    <div class="pg-abilities-grid">
                        ${SCHEDA_ABILITIES.map(a => {
                            const val = p[a.key] || 10;
                            const mod = Math.floor((val - 10) / 2);
                            const fmod = mod >= 0 ? '+' + mod : '' + mod;
                            return `
                        <div class="pg-ability-block">
                            <label>${a.full}</label>
                            <div class="pg-ability-row"><input type="number" id="hb${a.key}" class="pg-ability-input" min="1" max="30" value="${val}" inputmode="none" readonly onclick="pgOpenAbilityKeypad(this)" onchange="labUpdateMods()"><span class="pg-ability-mod" id="hbMod_${a.key}">${fmod}</span></div>
                            <label class="pg-save-item"><input type="checkbox" id="hbSave_${a.key}" ${pSaves.includes(a.key)?'checked':''} onchange="labUpdateMods()"> <span class="pg-save-val" id="hbSaveVal_${a.key}">${fmod}</span></label>
                        </div>`;
                        }).join('')}
                    </div>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn-secondary" onclick="labNemWizardNav(-1)">Indietro</button>
                    <button type="button" class="btn-primary" onclick="labNemWizardNav(1)">Successivo</button>
                </div>
            </div>
            <div class="wizard-page" id="hbNStep2">
                <div class="form-section-label">Statistiche</div>
                <div class="wizard-page-scroll">
                    <div class="pg-stats-row-3">
                        <div class="form-group"><label for="hbCA">CA</label><input type="number" id="hbCA" value="${p.classe_armatura || 10}" inputmode="none" readonly onclick="pgOpenAbilityKeypad(this)"></div>
                        <div class="form-group"><label for="hbVelocita">Velocità</label><input type="number" id="hbVelocita" value="${parseFloat(p.velocita) || 9}" inputmode="none" readonly onclick="pgOpenAbilityKeypad(this)"></div>
                        <div class="form-group"><label for="hbInitMod">Mod. Iniz.</label><input type="number" id="hbInitMod" value="${p.mod_iniziativa ?? ''}" inputmode="none" readonly onclick="pgOpenAbilityKeypad(this)"></div>
                    </div>
                    <div class="form-section-label" style="margin-top:var(--spacing-sm)">Punti Vita</div>
                    <div class="pg-stats-row-3">
                        <div class="form-group"><label>N° Dadi</label><input type="number" id="hbDadiVitaNum" min="1" value="${p.dadi_vita_num || Math.max(1, parseInt(p.grado_sfida)||1)}" inputmode="none" readonly onclick="pgOpenAbilityKeypad(this)" onchange="labRecalcHP()"></div>
                        <div class="form-group"><label>Dado</label><button type="button" class="custom-select-trigger" id="hbDadoVita" data-value="${p.dado_vita || _monsterSizeHitDie(p.taglia)}" onclick="openLabHitDieSelect()">${p.dado_vita ? 'd'+p.dado_vita : 'd'+_monsterSizeHitDie(p.taglia)}</button></div>
                        <div class="form-group"><label>PV Max</label><input type="number" id="hbPV" min="1" value="${p.punti_vita_max || 10}" inputmode="none" readonly onclick="pgOpenAbilityKeypad(this)"></div>
                    </div>
                    <p class="monster-hp-formula" id="hbHPFormula"></p>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn-secondary" onclick="labNemWizardNav(-1)">Indietro</button>
                    <button type="button" class="btn-primary" onclick="labNemWizardNav(1)">Successivo</button>
                </div>
            </div>
            <div class="wizard-page" id="hbNStep3">
                <div class="form-section-label">Abilità</div>
                <div class="wizard-page-scroll">
                    <div class="pg-skills-list" id="hbSkillsList">${SCHEDA_SKILLS.map(sk => {
                        const isProf = pSkills.includes(sk.key);
                        const isExp = pExpert.includes(sk.key);
                        const abilMod = Math.floor(((p[sk.ability]||10)-10)/2);
                        const bonus = _monsterProfBonus(p.grado_sfida);
                        const total = abilMod + (isProf ? bonus : 0) + (isExp ? bonus : 0);
                        const fval = total >= 0 ? '+' + total : '' + total;
                        return `<div class="pg-skill-item ${isProf ? 'proficient' : ''} ${isExp ? 'expert' : ''}" id="hbSkillRow_${sk.key}">
                            <span class="pg-skill-dot ${isProf ? 'active' : ''}" onclick="labToggleSkill('${sk.key}')" title="Competenza">●</span>
                            <span class="pg-skill-dot expert ${isExp ? 'active' : ''}" onclick="labToggleSkillExpert('${sk.key}')" title="Maestria">★</span>
                            <span class="pg-skill-value" id="hbSkillVal_${sk.key}">${fval}</span>
                            <span class="pg-skill-name">${sk.label}</span>
                            <span class="pg-skill-ability">(${sk.ability.substring(0, 3).toUpperCase()})</span>
                        </div>`;
                    }).join('')}
                    </div>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn-secondary" onclick="labNemWizardNav(-1)">Indietro</button>
                    <button type="button" class="btn-primary" onclick="labNemWizardNav(1)">Successivo</button>
                </div>
            </div>
            <div class="wizard-page" id="hbNStep4">
                <div class="form-section-label">Resistenze e Immunità</div>
                <div class="pg-res-header"><span></span><span class="pg-res-col-label">Res</span><span class="pg-res-col-label">Imm</span></div>
                <div class="wizard-page-scroll"><div id="hbResImmGrid" class="pg-res-grid"></div></div>
                <div class="form-actions">
                    <button type="button" class="btn-secondary" onclick="labNemWizardNav(-1)">Indietro</button>
                    <button type="button" class="btn-primary" onclick="labNemWizardNav(1)">Successivo</button>
                </div>
            </div>
            <div class="wizard-page" id="hbNStep5">
                <div class="form-section-label">Azioni</div>
                <div class="wizard-page-scroll">
                    <div id="hbAttacchiList">${labRenderAttacchi(p.attacchi || [])}</div>
                    <button type="button" class="hb-add-btn" onclick="labAddAttacco()">+ Aggiungi azione</button>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn-secondary" onclick="labNemWizardNav(-1)">Indietro</button>
                    <button type="button" class="btn-primary" onclick="labNemWizardNav(1)">Successivo</button>
                </div>
            </div>
            <div class="wizard-page" id="hbNStep6">
                <div class="form-section-label">Leggendario</div>
                <div class="wizard-page-scroll">
                    <div class="form-group"><label for="hbResLegg">Resistenze Leggendarie</label><input type="number" id="hbResLegg" min="0" value="${p.resistenze_leggendarie || 0}" inputmode="none" readonly onclick="pgOpenAbilityKeypad(this)"></div>
                    <div class="form-group"><label for="hbAzLeggMax">Azioni Leggendarie per turno</label><input type="number" id="hbAzLeggMax" min="0" value="${p.azioni_legg_max || 0}" inputmode="none" readonly onclick="pgOpenAbilityKeypad(this)"></div>
                    <div class="form-group" style="margin-top:var(--spacing-sm);">
                        <label>Azioni Leggendarie</label>
                        <div id="hbAzioniLeggList">${labRenderAzioniLegg(p.azioni_leggendarie || [])}</div>
                        <button type="button" class="hb-add-btn" onclick="labAddAzioneLegg()">+ Aggiungi azione</button>
                    </div>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn-secondary" onclick="labNemWizardNav(-1)">Indietro</button>
                    <button type="button" class="btn-primary" onclick="labNemWizardNav(1)">Successivo</button>
                </div>
            </div>
            <div class="wizard-page" id="hbNStep7">
                <div class="form-section-label">Incantesimi (opzionale)</div>
                <div class="wizard-page-scroll">
                    <div class="form-group">
                        <label>Caratteristica da incantatore</label>
                        <button type="button" class="custom-select-trigger" id="hbCarInc" data-value="${p.caratteristica_incantatore || ''}" onclick="openSpellAbilitySelect('hbCarInc')">${p.caratteristica_incantatore ? SPELL_AB_LABELS[p.caratteristica_incantatore] : 'Nessuna'}</button>
                    </div>
                    <div class="form-section-label" style="margin-top:var(--spacing-sm);">Slot per livello</div>
                    <div class="hb-stats-grid">
                        ${[1,2,3,4,5,6,7,8,9].map(lv => `<div class="form-group"><label>Lv ${lv}</label><input type="number" id="hbSlot${lv}" min="0" value="${pSlots[lv]?.max || 0}"></div>`).join('')}
                    </div>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn-secondary" onclick="labNemWizardNav(-1)">Indietro</button>
                    <button type="button" class="btn-primary" onclick="saveLabNemico()">${_labEditingId ? 'Salva' : 'Crea'}</button>
                </div>
            </div>
        </form>`;

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function labFieldsNemici(data) { return ''; }

window.labNemWizardNav = function(dir) {
    if (dir > 0 && window._labNemWizardStep === 0) {
        const nome = document.getElementById('hbNome')?.value?.trim();
        if (!nome) { showNotification('Inserisci un nome'); return; }
    }
    const total = 8, maxStep = total - 1;
    window._labNemWizardStep = Math.max(0, Math.min(maxStep, (window._labNemWizardStep || 0) + dir));
    const step = window._labNemWizardStep;
    for (let i = 0; i <= maxStep; i++) {
        const page = document.getElementById(`hbNStep${i}`);
        if (page) page.classList.toggle('active', i === step);
    }
    if (step === 1) labUpdateMods();
    if (step === 2) labAutoCompileStats();
    if (step === 3) labUpdateSkillValues();
    if (step === 4) labRenderResImmGrid();
    const modal = document.getElementById('homebrewModal');
    if (modal) modal.querySelectorAll('.wizard-step').forEach((dot, i) => dot.classList.toggle('active', i <= step));
};

window.labNemToggleRes = function(val, checked) {
    if (!window._labNemResistenze) window._labNemResistenze = [];
    if (checked) { if (!window._labNemResistenze.includes(val)) window._labNemResistenze.push(val); }
    else { window._labNemResistenze = window._labNemResistenze.filter(r => r !== val); }
};
window.labNemToggleImm = function(val, checked) {
    if (!window._labNemImmunita) window._labNemImmunita = [];
    if (checked) { if (!window._labNemImmunita.includes(val)) window._labNemImmunita.push(val); }
    else { window._labNemImmunita = window._labNemImmunita.filter(r => r !== val); }
};

function labRenderAttacchi(attacchi) {
    if (!attacchi.length) return '';
    return attacchi.map((a, i) => _monsterActionCard(a, i, 'hb')).join('');
}

function labRenderAzioniLegg(azioni) {
    if (!azioni || !azioni.length) return '';
    return azioni.map((a, i) => `<div class="hb-action-card" data-idx="${i}">
        <div class="hb-action-card-row">
            <input type="text" placeholder="Nome azione" value="${escapeHtml(a.nome || '')}" class="hbLeggNome">
            <button type="button" class="hb-action-remove" onclick="this.closest('.hb-action-card').remove()">✕</button>
        </div>
        <textarea class="hbLeggDesc" placeholder="Descrizione..." rows="2">${escapeHtml(a.descrizione || '')}</textarea>
    </div>`).join('');
}

window.labAddAzioneLegg = function() {
    const list = document.getElementById('hbAzioniLeggList');
    if (!list) return;
    list.insertAdjacentHTML('beforeend', `<div class="hb-action-card">
        <div class="hb-action-card-row">
            <input type="text" placeholder="Nome azione" class="hbLeggNome">
            <button type="button" class="hb-action-remove" onclick="this.closest('.hb-action-card').remove()">✕</button>
        </div>
        <textarea class="hbLeggDesc" placeholder="Descrizione..." rows="2"></textarea>
    </div>`);
};

window.labAddAttacco = function() {
    const list = document.getElementById('hbAttacchiList');
    if (!list) return;
    const idx = list.querySelectorAll('.hb-action-card').length;
    list.insertAdjacentHTML('beforeend', _monsterActionCard({}, idx, 'hb'));
};

window.openLabHitDieSelect = function() {
    const dieOptions = [4,6,8,10,12,20].map(d => ({ value: String(d), label: 'd' + d }));
    openCustomSelect(dieOptions, (value) => {
        const btn = document.getElementById('hbDadoVita');
        if (btn) { btn.dataset.value = value; btn.textContent = 'd' + value; }
        labRecalcHP();
    }, 'Dado Vita');
};

window.labRecalcHP = function() {
    const numDice = parseInt(document.getElementById('hbDadiVitaNum')?.value) || 1;
    const die = parseInt(document.getElementById('hbDadoVita')?.dataset?.value) || 8;
    const con = parseInt(document.getElementById('hbcostituzione')?.value) || 10;
    const conMod = Math.floor((con - 10) / 2);
    const avgDie = (die + 1) / 2;
    const hp = Math.floor(numDice * avgDie + numDice * conMod);
    const pvInput = document.getElementById('hbPV');
    if (pvInput) pvInput.value = Math.max(1, hp);
    const formula = document.getElementById('hbHPFormula');
    if (formula) {
        const conPart = conMod !== 0 ? ` ${conMod > 0 ? '+' : '−'} ${Math.abs(numDice * conMod)}` : '';
        formula.textContent = `${numDice}d${die}${conPart} = ${Math.max(1, hp)} PV`;
    }
};

window.labAutoCompileStats = function() {
    const dex = parseInt(document.getElementById('hbdestrezza')?.value) || 10;
    const initInput = document.getElementById('hbInitMod');
    if (initInput && !initInput.dataset.userEdited) initInput.value = Math.floor((dex - 10) / 2);

    const taglia = document.getElementById('hbTaglia')?.dataset?.value || 'Media';
    const dieBtn = document.getElementById('hbDadoVita');
    if (dieBtn && !dieBtn.dataset.userEdited) {
        const die = _monsterSizeHitDie(taglia);
        dieBtn.dataset.value = die;
        dieBtn.textContent = 'd' + die;
    }

    const gs = parseInt(document.getElementById('hbGS')?.value) || 1;
    const numInput = document.getElementById('hbDadiVitaNum');
    if (numInput && !numInput.dataset.userEdited) numInput.value = Math.max(1, gs);

    labRecalcHP();
};

window.labUpdateMods = function() {
    const gs = document.getElementById('hbGS')?.value || '0';
    const bonus = _monsterProfBonus(gs);
    SCHEDA_ABILITIES.forEach(a => {
        const val = parseInt(document.getElementById(`hb${a.key}`)?.value) || 10;
        const mod = Math.floor((val - 10) / 2);
        const fmod = mod >= 0 ? '+' + mod : '' + mod;
        const modEl = document.getElementById(`hbMod_${a.key}`);
        if (modEl) {
            modEl.textContent = fmod;
            modEl.className = 'pg-ability-mod ' + (mod > 0 ? 'positive' : mod < 0 ? 'negative' : 'zero');
        }
        const cb = document.getElementById(`hbSave_${a.key}`);
        const saveEl = document.getElementById(`hbSaveVal_${a.key}`);
        if (saveEl) {
            const saveTot = mod + (cb?.checked ? bonus : 0);
            saveEl.textContent = saveTot >= 0 ? '+' + saveTot : '' + saveTot;
        }
    });
    labUpdateSkillValues();
};

window.labUpdateSkillValues = function() {
    const gs = document.getElementById('hbGS')?.value || '0';
    const bonus = _monsterProfBonus(gs);
    SCHEDA_SKILLS.forEach(sk => {
        const row = document.getElementById(`hbSkillRow_${sk.key}`);
        if (!row) return;
        const abilVal = parseInt(document.getElementById(`hb${sk.ability}`)?.value) || 10;
        const abilMod = Math.floor((abilVal - 10) / 2);
        const isProf = row.classList.contains('proficient');
        const isExp = row.classList.contains('expert');
        const total = abilMod + (isProf ? bonus : 0) + (isExp ? bonus : 0);
        const valEl = document.getElementById(`hbSkillVal_${sk.key}`);
        if (valEl) valEl.textContent = total >= 0 ? '+' + total : '' + total;
    });
};

window.labToggleSkill = function(skillKey) {
    const row = document.getElementById(`hbSkillRow_${skillKey}`);
    if (!row) return;
    const dot = row.querySelector('.pg-skill-dot:not(.expert)');
    const isActive = dot?.classList.toggle('active');
    row.classList.toggle('proficient', isActive);
    if (!isActive) {
        const star = row.querySelector('.pg-skill-dot.expert');
        if (star) star.classList.remove('active');
        row.classList.remove('expert');
    }
    labUpdateSkillValues();
};

window.labToggleSkillExpert = function(skillKey) {
    const row = document.getElementById(`hbSkillRow_${skillKey}`);
    if (!row) return;
    const dot = row.querySelector('.pg-skill-dot:not(.expert)');
    if (!dot?.classList.contains('active')) {
        dot?.classList.add('active');
        row.classList.add('proficient');
    }
    const star = row.querySelector('.pg-skill-dot.expert');
    const isActive = star?.classList.toggle('active');
    row.classList.toggle('expert', isActive);
    labUpdateSkillValues();
};

function labRenderResImmGrid() {
    const container = document.getElementById('hbResImmGrid');
    if (!container) return;
    container.innerHTML = DAMAGE_TYPES.map(dt => {
        const isRes = (window._labNemResistenze || []).includes(dt.value);
        const isImm = (window._labNemImmunita || []).includes(dt.value);
        return `<div class="pg-res-row"><span class="pg-res-label">${dt.label}</span><input type="checkbox" class="pg-res-cb" ${isRes ? 'checked' : ''} onchange="labNemToggleRes('${dt.value}', this.checked)"><input type="checkbox" class="pg-imm-cb" ${isImm ? 'checked' : ''} onchange="labNemToggleImm('${dt.value}', this.checked)"></div>`;
    }).join('');
}

window.saveLabNemico = async function() {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    if (!AppState.currentUser?.uid) { showNotification('Errore: utente non trovato'); return; }

    const nome = document.getElementById('hbNome')?.value?.trim();
    if (!nome) { showNotification('Inserisci un nome'); return; }

    const record = {
        nome,
        updated_at: new Date().toISOString(),
        tipo: document.getElementById('hbTipo')?.dataset?.value || null,
        taglia: document.getElementById('hbTaglia')?.dataset?.value || 'Media',
        allineamento: document.getElementById('hbAllineamento')?.dataset?.value || null,
        classe_armatura: parseInt(document.getElementById('hbCA')?.value) || 10,
        punti_vita_max: parseInt(document.getElementById('hbPV')?.value) || 10,
        grado_sfida: document.getElementById('hbGS')?.value?.trim() || '0',
        velocita: document.getElementById('hbVelocita')?.value?.trim() || '9',
        forza: parseInt(document.getElementById('hbforza')?.value) || 10,
        destrezza: parseInt(document.getElementById('hbdestrezza')?.value) || 10,
        costituzione: parseInt(document.getElementById('hbcostituzione')?.value) || 10,
        intelligenza: parseInt(document.getElementById('hbintelligenza')?.value) || 10,
        saggezza: parseInt(document.getElementById('hbsaggezza')?.value) || 10,
        carisma: parseInt(document.getElementById('hbcarisma')?.value) || 10,
        tiri_salvezza: SCHEDA_ABILITIES.filter(a => document.getElementById(`hbSave_${a.key}`)?.checked).map(a => a.key),
        competenze_abilita: SCHEDA_SKILLS.filter(sk => document.getElementById(`hbSkillRow_${sk.key}`)?.classList.contains('proficient')).map(sk => sk.key),
        maestrie_abilita: SCHEDA_SKILLS.filter(sk => document.getElementById(`hbSkillRow_${sk.key}`)?.classList.contains('expert')).map(sk => sk.key),
        dadi_vita_num: parseInt(document.getElementById('hbDadiVitaNum')?.value) || 1,
        dado_vita: parseInt(document.getElementById('hbDadoVita')?.dataset?.value) || 8,
        resistenze: window._labNemResistenze || [],
        immunita: window._labNemImmunita || [],
        mod_iniziativa: parseInt(document.getElementById('hbInitMod')?.value) || null,
        resistenze_leggendarie: parseInt(document.getElementById('hbResLegg')?.value) || 0,
        azioni_legg_max: parseInt(document.getElementById('hbAzLeggMax')?.value) || 0,
        caratteristica_incantatore: document.getElementById('hbCarInc')?.dataset?.value || null,
    };

    record.attacchi = [...document.querySelectorAll('#hbAttacchiList .hb-action-card')].map(card => {
        const usiVal = card.querySelector('.hbAtkUsiMax')?.value;
        const usiMax = usiVal !== '' && usiVal !== undefined ? (parseInt(usiVal) || 0) : 0;
        return {
            nome: card.querySelector('.hbAtkNome')?.value || '',
            bonus: card.querySelector('.hbAtkBonus')?.value || '',
            danno: card.querySelector('.hbAtkDanno')?.value || '',
            descrizione: card.querySelector('.hbAtkDesc')?.value || '',
            usi_max: usiMax
        };
    }).filter(a => a.nome);

    record.azioni_leggendarie = [...document.querySelectorAll('#hbAzioniLeggList .hb-action-card')].map(card => ({
        nome: card.querySelector('.hbLeggNome')?.value || '',
        descrizione: card.querySelector('.hbLeggDesc')?.value || ''
    })).filter(a => a.nome);

    const carInc = record.caratteristica_incantatore;
    let slotInc = null;
    if (carInc) {
        slotInc = {};
        for (let lv = 1; lv <= 9; lv++) {
            const max = parseInt(document.getElementById(`hbSlot${lv}`)?.value) || 0;
            if (max > 0) slotInc[lv] = { max, current: max };
        }
        if (Object.keys(slotInc).length === 0) slotInc = null;
    }
    record.slot_incantesimo = slotInc;

    try {
        if (_labEditingId) {
            const { error } = await supabase.from('homebrew_nemici').update(record).eq('id', _labEditingId);
            if (error) throw error;
            showNotification('Nemico aggiornato');
        } else {
            record.user_id = AppState.currentUser.uid;
            const { error } = await supabase.from('homebrew_nemici').insert(record);
            if (error) throw error;
            showNotification('Nemico creato');
        }
        closeHomebrewModal();
        loadLabContent();
    } catch (err) {
        console.error('Errore salvataggio nemico:', err);
        showNotification('Errore nel salvataggio');
    }
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

    if (_labCurrentTab === 'nemici') {
        _openLabNemiciWizard(editData);
        return;
    }
    if (_labCurrentTab === 'razze') {
        _openLabRazzeWizard(editData);
        return;
    }

    const modal = document.getElementById('homebrewModal');
    _restoreHomebrewModalStructure();
    const title = document.getElementById('homebrewModalTitle');
    const content = document.getElementById('homebrewFormContent');
    const saveBtn = document.getElementById('saveHomebrewBtn');

    title.textContent = _labEditingId ? `Modifica ${cat.label}` : `${cat.label} Homebrew`;
    saveBtn.textContent = _labEditingId ? 'Salva' : 'Crea';
    content.innerHTML = cat.fields(editData);

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
};

const _HOMEBREW_MODAL_ORIGINAL_HTML = null;

function _restoreHomebrewModalStructure() {
    const modal = document.getElementById('homebrewModal');
    if (!modal) return;
    const mlg = modal.querySelector('.modal-content-lg');
    if (!mlg) return;
    if (!document.getElementById('homebrewForm')) {
        mlg.innerHTML = `
            <button class="modal-close" id="closeHomebrewModal">&times;</button>
            <h2 id="homebrewModalTitle">Nuovo Contenuto</h2>
            <form id="homebrewForm">
                <div id="homebrewFormContent"></div>
                <div class="form-actions" id="homebrewDefaultActions">
                    <button type="button" class="btn-secondary" id="cancelHomebrewBtn">Annulla</button>
                    <button type="submit" class="btn-primary" id="saveHomebrewBtn">Crea</button>
                </div>
            </form>`;
        document.getElementById('closeHomebrewModal')?.addEventListener('click', closeHomebrewModal);
        document.getElementById('cancelHomebrewBtn')?.addEventListener('click', closeHomebrewModal);
        document.getElementById('homebrewForm')?.addEventListener('submit', handleSaveHomebrew);
        document.getElementById('homebrewForm')?.addEventListener('keydown', (e) => { if (e.key === 'Enter') e.preventDefault(); });
    }
}

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

    if (!AppState.currentUser?.uid) { showNotification('Errore: utente non trovato'); return; }

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
            record.tipo = document.getElementById('hbTipo')?.dataset?.value || document.getElementById('hbTipo')?.value || null;
            record.taglia = document.getElementById('hbTaglia')?.dataset?.value || document.getElementById('hbTaglia')?.value || 'Media';
            record.allineamento = document.getElementById('hbAllineamento')?.dataset?.value || null;
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
            record.tiri_salvezza = ['forza','destrezza','costituzione','intelligenza','saggezza','carisma']
                .filter(s => document.getElementById(`hbSave_${s}`)?.checked);
            record.competenze_abilita = SCHEDA_SKILLS
                .filter(sk => document.getElementById(`hbSkillRow_${sk.key}`)?.classList.contains('proficient')).map(sk => sk.key);
            record.maestrie_abilita = SCHEDA_SKILLS
                .filter(sk => document.getElementById(`hbSkillRow_${sk.key}`)?.classList.contains('expert')).map(sk => sk.key);
            record.resistenze = window._labNemResistenze || [];
            record.immunita = window._labNemImmunita || [];
            record.attacchi = [...document.querySelectorAll('#hbAttacchiList .hb-action-card')].map(card => {
                const usiVal = card.querySelector('.hbAtkUsiMax')?.value;
                const usiMax = usiVal !== '' && usiVal !== undefined ? (parseInt(usiVal) || 0) : 0;
                return {
                    nome: card.querySelector('.hbAtkNome')?.value || '',
                    bonus: card.querySelector('.hbAtkBonus')?.value || '',
                    danno: card.querySelector('.hbAtkDanno')?.value || '',
                    descrizione: card.querySelector('.hbAtkDesc')?.value || '',
                    usi_max: usiMax
                };
            }).filter(a => a.nome);
            record.resistenze_leggendarie = parseInt(document.getElementById('hbResLegg')?.value) || 0;
            record.azioni_legg_max = parseInt(document.getElementById('hbAzLeggMax')?.value) || 0;
            record.azioni_leggendarie = [...document.querySelectorAll('#hbAzioniLeggList .hb-action-card')].map(card => ({
                nome: card.querySelector('.hbLeggNome')?.value || '',
                descrizione: card.querySelector('.hbLeggDesc')?.value || ''
            })).filter(a => a.nome);
            record.caratteristica_incantatore = document.getElementById('hbCarInc')?.dataset?.value || null;
            {
                const carInc = record.caratteristica_incantatore;
                let slotInc = null;
                if (carInc) {
                    slotInc = {};
                    for (let lv = 1; lv <= 9; lv++) {
                        const max = parseInt(document.getElementById(`hbSlot${lv}`)?.value) || 0;
                        if (max > 0) slotInc[lv] = { max, current: max };
                    }
                    if (Object.keys(slotInc).length === 0) slotInc = null;
                }
                record.slot_incantesimo = slotInc;
            }
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
            record.user_id = AppState.currentUser.uid;
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
// SETTINGS PAGE
// ============================================================================

async function labRenderSettings() {
    const container = document.getElementById('labContent');
    if (!container) return;

    const supabase = getSupabaseClient();
    if (!supabase || !AppState.currentUser?.uid) {
        container.innerHTML = '<div class="lab-empty">Accedi per gestire le impostazioni</div>';
        return;
    }

    container.innerHTML = '<div class="lab-empty">Caricamento...</div>';

    const userData = await findUserByUid(AppState.currentUser.uid);
    if (!userData) { container.innerHTML = '<div class="lab-empty">Errore</div>'; return; }

    const hbSettings = userData.homebrew_settings || { enabled: false, amici_abilitati: [] };
    const isEnabled = hbSettings.enabled !== false;

    const { data: amici } = await supabase.rpc('get_amici');
    const amiciList = amici || [];

    const amiciHtml = amiciList.length > 0 ? amiciList.map(a => {
        const checked = (hbSettings.amici_abilitati || []).includes(a.amico_id) ? 'checked' : '';
        return `<label class="lab-settings-friend">
            <input type="checkbox" value="${a.amico_id}" ${checked} onchange="labToggleFriendHb(this)">
            <span>${escapeHtml(a.nome_utente || 'Amico')}${a.cid ? ' #' + a.cid : ''}</span>
        </label>`;
    }).join('') : '<p class="lab-empty" style="padding:8px 0;">Nessun amico aggiunto</p>';

    container.innerHTML = `
    <div class="lab-settings">
        <div class="lab-settings-section">
            <div class="lab-settings-row">
                <span class="lab-settings-label">Mostra contenuti homebrew</span>
                <label class="lab-toggle">
                    <input type="checkbox" id="labHbEnabled" ${isEnabled ? 'checked' : ''} onchange="labToggleHbEnabled(this)">
                    <span class="lab-toggle-slider"></span>
                </label>
            </div>
            <p class="lab-settings-hint">Quando attivo, i contenuti homebrew tuoi e degli amici selezionati saranno visibili durante la creazione dei personaggi.</p>
        </div>

        <div class="lab-settings-section">
            <div class="lab-settings-section-title">Homebrew degli amici</div>
            <p class="lab-settings-hint">Seleziona gli amici di cui vuoi visualizzare i contenuti homebrew.</p>
            <div class="lab-settings-friends" id="labFriendsList">
                ${amiciHtml}
            </div>
        </div>
    </div>`;
}

window.labToggleHbEnabled = async function(cb) {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    const userData = await findUserByUid(AppState.currentUser?.uid);
    if (!userData) return;
    const settings = userData.homebrew_settings || { enabled: false, amici_abilitati: [] };
    settings.enabled = cb.checked;
    await supabase.from('utenti').update({ homebrew_settings: settings, updated_at: new Date().toISOString() }).eq('id', userData.id);
    userData.homebrew_settings = settings;
};

window.labToggleFriendHb = async function(cb) {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    const userData = await findUserByUid(AppState.currentUser?.uid);
    if (!userData) return;
    const settings = userData.homebrew_settings || { enabled: false, amici_abilitati: [] };
    if (!settings.amici_abilitati) settings.amici_abilitati = [];
    const friendId = cb.value;
    if (cb.checked) {
        if (!settings.amici_abilitati.includes(friendId)) settings.amici_abilitati.push(friendId);
    } else {
        settings.amici_abilitati = settings.amici_abilitati.filter(id => id !== friendId);
    }
    await supabase.from('utenti').update({ homebrew_settings: settings, updated_at: new Date().toISOString() }).eq('id', userData.id);
    userData.homebrew_settings = settings;
};

// ============================================================================
// VIEW NEMICO (scheda read-only in modal)
// ============================================================================

window.labViewNemico = async function(id) {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    const { data: m } = await supabase.from('homebrew_nemici').select('*').eq('id', id).single();
    if (!m) return;

    const fMod = (v) => { const mod = Math.floor(((v||10)-10)/2); return mod >= 0 ? `+${mod}` : `${mod}`; };
    const bonusComp = Math.max(2, Math.floor(((parseInt(m.grado_sfida)||0)-1)/4)+2);
    const saves = m.tiri_salvezza || [];
    const skills = m.competenze_abilita || [];

    const resistenzeHtml = (m.resistenze?.length) ? m.resistenze.map(r => `<span class="scheda-tag">${escapeHtml(r)}</span>`).join('') : '';
    const immunitaHtml = (m.immunita?.length) ? m.immunita.map(r => `<span class="scheda-tag" style="background:rgba(239,68,68,0.15);color:#ef4444;">${escapeHtml(r)}</span>`).join('') : '';

    const attacks = m.attacchi || [];
    const attacksHtml = attacks.length > 0 ? attacks.map(a => {
        const hasUsi = a.usi_max > 0;
        const usiPips = hasUsi ? `<span class="monster-action-uses">${Array.from({length: a.usi_max}, () =>
            `<span class="monster-action-use-pip filled"></span>`).join('')}</span>` : '';
        return `<div class="monster-attack-row"><span class="monster-attack-name">${escapeHtml(a.nome)}</span><span class="monster-attack-hit">${escapeHtml(a.bonus || '')}</span><span class="monster-attack-dmg">${escapeHtml(a.danno || '')}</span>${usiPips}</div>`;
    }).join('') : '';

    const leggActions = m.azioni_leggendarie || [];
    const leggActionsHtml = leggActions.length > 0 ? leggActions.map(a =>
        `<div class="monster-legg-row"><span class="monster-legg-name">${escapeHtml(a.nome)}</span><span class="monster-legg-desc">${escapeHtml(a.descrizione || '')}</span></div>`
    ).join('') : '';

    const resLeggMax = m.resistenze_leggendarie || 0;
    const azLeggMax = m.azioni_legg_max || 0;

    const expert = m.maestrie_abilita || [];
    const skillsHtml = skills.length > 0 ? SCHEDA_SKILLS.filter(sk => skills.includes(sk.key)).map(sk => {
        const abilityMod = Math.floor(((m[sk.ability]||10)-10)/2);
        const isExp = expert.includes(sk.key);
        const total = abilityMod + bonusComp + (isExp ? bonusComp : 0);
        const expLabel = isExp ? ' ★' : '';
        return `<span class="scheda-tag">${sk.label} ${total >= 0 ? '+' + total : total}${expLabel}</span>`;
    }).join('') : '';

    let spellHtml = '';
    const slots = m.slot_incantesimo;
    const hasSpells = slots && typeof slots === 'object' && Object.keys(slots).length > 0;
    if (hasSpells) {
        const carInc = m.caratteristica_incantatore;
        const incVal = m[carInc] || 10;
        const incMod = Math.floor((incVal - 10) / 2);
        const atkBonus = incMod + bonusComp;
        const dc = 8 + bonusComp + incMod;
        const levels = Object.keys(slots).map(Number).sort((a,b) => a-b);
        const slotsHtml = levels.map(lvl => {
            const s = slots[lvl];
            const pips = Array.from({length: s.max}, () => `<span class="scheda-slot-pip filled"></span>`).join('');
            return `<div class="scheda-slot-row"><span class="scheda-slot-level">Lv ${lvl}</span><div class="scheda-slot-pips">${pips}</div><span class="scheda-slot-count">${s.max}/${s.max}</span></div>`;
        }).join('');
        spellHtml = `
            <div class="combat-section-label">Incantesimi</div>
            <div class="scheda-three-boxes" style="margin-bottom:10px;">
                <div class="scheda-box"><div class="scheda-box-val">${incMod >= 0 ? '+'+incMod : incMod}</div><div class="scheda-box-label">${(carInc||'').substring(0,3).toUpperCase()}</div></div>
                <div class="scheda-box"><div class="scheda-box-val">${atkBonus >= 0 ? '+'+atkBonus : atkBonus}</div><div class="scheda-box-label">Attacco</div></div>
                <div class="scheda-box"><div class="scheda-box-val">${dc}</div><div class="scheda-box-label">CD</div></div>
            </div>
            <div class="scheda-slots-table">${slotsHtml}</div>`;
    }

    const modal = document.getElementById('homebrewModal');
    const content = modal?.querySelector('.modal-content-lg');
    if (!content) return;

    content.innerHTML = `
        <h2 style="flex-shrink:0;">${escapeHtml(m.nome)} <button class="modal-close" onclick="closeHomebrewModal()">&times;</button></h2>
        <div style="flex:1;overflow-y:auto;padding:0 2px;">
            <p style="color:var(--text-secondary);margin:0 0 12px;font-size:0.85rem;">${escapeHtml(m.tipologia||'')} · ${escapeHtml(m.taglia||'Media')} · GS ${m.grado_sfida||0}</p>
            <div class="scheda-three-boxes">
                <div class="scheda-box"><div class="scheda-box-val">${m.classe_armatura||10}</div><div class="scheda-box-label">CA</div></div>
                <div class="scheda-box"><div class="scheda-box-val">${m.punti_vita_max||10}</div><div class="scheda-box-label">PV</div></div>
                <div class="scheda-box"><div class="scheda-box-val">${m.velocita||9}</div><div class="scheda-box-label">Velocità</div></div>
            </div>
            ${m.mod_iniziativa != null ? `<p style="text-align:center;font-size:0.8rem;color:var(--text-muted);margin:6px 0;">Mod. Iniziativa: ${m.mod_iniziativa >= 0 ? '+' + m.mod_iniziativa : m.mod_iniziativa}</p>` : ''}
            <div class="combat-abilities-grid" style="margin:12px 0;">
                ${SCHEDA_ABILITIES.map(a => {
                    const isSave = saves.includes(a.key);
                    const saveMod = Math.floor(((m[a.key]||10)-10)/2) + (isSave ? bonusComp : 0);
                    const saveStr = saveMod >= 0 ? `+${saveMod}` : `${saveMod}`;
                    return `<div class="combat-ability"><span class="combat-ability-label">${a.label}</span><span class="combat-ability-val">${m[a.key]||10}</span><span class="combat-ability-mod">${fMod(m[a.key])}</span><span class="combat-ability-save-mini ${isSave?'prof':''}">TS ${saveStr}</span></div>`;
                }).join('')}
            </div>
            ${skillsHtml ? `<div class="combat-section-label">Competenze</div><div class="scheda-tags">${skillsHtml}</div>` : ''}
            ${attacksHtml ? `<div class="combat-section-label">Azioni</div><div class="monster-attacks-list">${attacksHtml}</div>` : ''}
            ${resLeggMax > 0 ? `<div class="combat-section-label">Resistenze Leggendarie</div><div class="monster-res-legg-counter">${Array.from({length: resLeggMax}, () => `<span class="monster-res-legg-pip filled"></span>`).join('')}<span class="monster-res-legg-label">${resLeggMax}/${resLeggMax}</span></div>` : ''}
            ${azLeggMax > 0 || leggActionsHtml ? `<div class="combat-section-label">Azioni Leggendarie${azLeggMax > 0 ? ` (${azLeggMax}/turno)` : ''}</div>` : ''}
            ${leggActionsHtml ? `<div class="monster-legg-list">${leggActionsHtml}</div>` : ''}
            ${resistenzeHtml ? `<div class="combat-section-label">Resistenze</div><div class="scheda-tags">${resistenzeHtml}</div>` : ''}
            ${immunitaHtml ? `<div class="combat-section-label">Immunità</div><div class="scheda-tags">${immunitaHtml}</div>` : ''}
            ${spellHtml}
        </div>`;

    modal.style.display = 'flex';
};

// ============================================================================
// INIT BINDINGS (called from init.js)
// ============================================================================

function initLaboratorio() {
    labRenderHub();

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
