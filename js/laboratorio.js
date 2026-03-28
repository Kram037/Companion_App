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
        fields: () => labFieldsRazze()
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

function _openLabNemiciWizard(data) {
    const modal = document.getElementById('homebrewModal');
    if (!modal) return;
    const mlg = modal.querySelector('.modal-content-lg');
    if (!mlg) return;

    const p = data || {};
    const pSaves = p.tiri_salvezza || [];
    const pSkills = p.competenze_abilita || [];
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
                        ${SCHEDA_ABILITIES.map(a => `
                        <div class="pg-ability-block">
                            <label>${a.full}</label>
                            <div class="pg-ability-row"><input type="number" id="hb${a.key}" class="pg-ability-input" min="1" max="30" value="${p[a.key] || 10}"></div>
                            <label class="pg-save-item"><input type="checkbox" id="hbSave_${a.key}" ${pSaves.includes(a.key)?'checked':''}> <span>TS</span></label>
                        </div>`).join('')}
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
                        <div class="form-group"><label for="hbCA">CA</label><input type="number" id="hbCA" value="${p.classe_armatura || 10}"></div>
                        <div class="form-group"><label for="hbVelocita">Velocità</label><input type="text" id="hbVelocita" placeholder="9" value="${escapeHtml(p.velocita || '9')}"></div>
                        <div class="form-group"><label for="hbInitMod">Mod. Iniz.</label><input type="number" id="hbInitMod" value="${p.mod_iniziativa ?? ''}"></div>
                    </div>
                    <div class="form-group"><label for="hbPV">PV Max</label><input type="number" id="hbPV" value="${p.punti_vita_max || 10}"></div>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn-secondary" onclick="labNemWizardNav(-1)">Indietro</button>
                    <button type="button" class="btn-primary" onclick="labNemWizardNav(1)">Successivo</button>
                </div>
            </div>
            <div class="wizard-page" id="hbNStep3">
                <div class="form-section-label">Abilità</div>
                <div class="wizard-page-scroll">
                    <div class="pg-skills-list">${SCHEDA_SKILLS.map(sk => `
                        <label class="pg-skill-check-item"><input type="checkbox" id="hbSkill_${sk.key}" ${pSkills.includes(sk.key)?'checked':''}> ${sk.label} <small>(${sk.ability.substring(0, 3).toUpperCase()})</small></label>`).join('')}
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
                    <div class="form-group"><label for="hbResLegg">Resistenze Leggendarie</label><input type="number" id="hbResLegg" min="0" value="${p.resistenze_leggendarie || 0}"></div>
                    <div class="form-group"><label for="hbAzLeggMax">Azioni Leggendarie per turno</label><input type="number" id="hbAzLeggMax" min="0" value="${p.azioni_legg_max || 0}"></div>
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
                        <select id="hbCarInc">
                            <option value="">Nessuna (non incantatore)</option>
                            ${SPELL_ABILITIES.map(a => `<option value="${a}" ${p.caratteristica_incantatore===a?'selected':''}>${SPELL_AB_LABELS[a]}</option>`).join('')}
                        </select>
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
    return attacchi.map((a, i) => {
        const hasUsi = (a.usi_max || 0) > 0;
        return `
    <div class="hb-attack-row" data-idx="${i}">
        <input type="text" placeholder="Nome" value="${escapeHtml(a.nome || '')}" class="hbAtkNome">
        <input type="text" placeholder="+Hit" value="${escapeHtml(a.bonus || '')}" class="hbAtkBonus" style="width:50px">
        <input type="text" placeholder="Danno" value="${escapeHtml(a.danno || '')}" class="hbAtkDanno" style="width:60px">
        <label class="mAtkUsiLabel" title="Usi limitati"><input type="checkbox" class="hbAtkHasUsi" ${hasUsi ? 'checked' : ''} onchange="labToggleAtkUsi(this)"><span>Usi</span></label>
        <input type="number" class="hbAtkUsiMax" placeholder="N" min="1" value="${a.usi_max || ''}" style="width:40px;${hasUsi ? '' : 'display:none'}">
        <button type="button" onclick="this.parentElement.remove()">✕</button>
    </div>`;
    }).join('');
}

function labRenderAzioniLegg(azioni) {
    if (!azioni || !azioni.length) return '';
    return azioni.map((a, i) => `
    <div class="hb-attack-row" data-idx="${i}">
        <input type="text" placeholder="Nome azione" value="${escapeHtml(a.nome || '')}" class="hbLeggNome">
        <input type="text" placeholder="Descrizione" value="${escapeHtml(a.descrizione || '')}" class="hbLeggDesc" style="flex:2">
        <button type="button" onclick="this.parentElement.remove()">✕</button>
    </div>`).join('');
}

window.labAddAzioneLegg = function() {
    const list = document.getElementById('hbAzioniLeggList');
    if (!list) return;
    const idx = list.querySelectorAll('.hb-attack-row').length;
    list.insertAdjacentHTML('beforeend', `
    <div class="hb-attack-row" data-idx="${idx}">
        <input type="text" placeholder="Nome azione" class="hbLeggNome">
        <input type="text" placeholder="Descrizione" class="hbLeggDesc" style="flex:2">
        <button type="button" onclick="this.parentElement.remove()">✕</button>
    </div>`);
};

window.labAddAttacco = function() {
    const list = document.getElementById('hbAttacchiList');
    if (!list) return;
    const row = document.createElement('div');
    row.className = 'hb-attack-row';
    row.innerHTML = `
        <input type="text" placeholder="Nome" class="hbAtkNome">
        <input type="text" placeholder="+Hit" class="hbAtkBonus" style="width:50px">
        <input type="text" placeholder="Danno" class="hbAtkDanno" style="width:60px">
        <label class="mAtkUsiLabel" title="Usi limitati"><input type="checkbox" class="hbAtkHasUsi" onchange="labToggleAtkUsi(this)"><span>Usi</span></label>
        <input type="number" class="hbAtkUsiMax" placeholder="N" min="1" style="width:40px;display:none">
        <button type="button" onclick="this.parentElement.remove()">✕</button>`;
    list.appendChild(row);
};
window.labToggleAtkUsi = function(cb) {
    const usiInput = cb.closest('.hb-attack-row')?.querySelector('.hbAtkUsiMax');
    if (usiInput) usiInput.style.display = cb.checked ? '' : 'none';
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
        competenze_abilita: SCHEDA_SKILLS.filter(sk => document.getElementById(`hbSkill_${sk.key}`)?.checked).map(sk => sk.key),
        resistenze: window._labNemResistenze || [],
        immunita: window._labNemImmunita || [],
        mod_iniziativa: parseInt(document.getElementById('hbInitMod')?.value) || null,
        resistenze_leggendarie: parseInt(document.getElementById('hbResLegg')?.value) || 0,
        azioni_legg_max: parseInt(document.getElementById('hbAzLeggMax')?.value) || 0,
        caratteristica_incantatore: document.getElementById('hbCarInc')?.value || null,
    };

    record.attacchi = [...document.querySelectorAll('#hbAttacchiList .hb-attack-row')].map(row => {
        const hasUsi = row.querySelector('.hbAtkHasUsi')?.checked;
        const usiMax = hasUsi ? (parseInt(row.querySelector('.hbAtkUsiMax')?.value) || 0) : 0;
        return {
            nome: row.querySelector('.hbAtkNome')?.value || '',
            bonus: row.querySelector('.hbAtkBonus')?.value || '',
            danno: row.querySelector('.hbAtkDanno')?.value || '',
            usi_max: usiMax
        };
    }).filter(a => a.nome);

    record.azioni_leggendarie = [...document.querySelectorAll('#hbAzioniLeggList .hb-attack-row')].map(row => ({
        nome: row.querySelector('.hbLeggNome')?.value || '',
        descrizione: row.querySelector('.hbLeggDesc')?.value || ''
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
                .filter(sk => document.getElementById(`hbSkill_${sk.key}`)?.checked).map(sk => sk.key);
            record.resistenze = window._labNemResistenze || [];
            record.immunita = window._labNemImmunita || [];
            record.attacchi = [...document.querySelectorAll('#hbAttacchiList .hb-attack-row')].map(row => {
                const hasUsi = row.querySelector('.hbAtkHasUsi')?.checked;
                const usiMax = hasUsi ? (parseInt(row.querySelector('.hbAtkUsiMax')?.value) || 0) : 0;
                return {
                    nome: row.querySelector('.hbAtkNome')?.value || '',
                    bonus: row.querySelector('.hbAtkBonus')?.value || '',
                    danno: row.querySelector('.hbAtkDanno')?.value || '',
                    usi_max: usiMax
                };
            }).filter(a => a.nome);
            record.resistenze_leggendarie = parseInt(document.getElementById('hbResLegg')?.value) || 0;
            record.azioni_legg_max = parseInt(document.getElementById('hbAzLeggMax')?.value) || 0;
            record.azioni_leggendarie = [...document.querySelectorAll('#hbAzioniLeggList .hb-attack-row')].map(row => ({
                nome: row.querySelector('.hbLeggNome')?.value || '',
                descrizione: row.querySelector('.hbLeggDesc')?.value || ''
            })).filter(a => a.nome);
            record.caratteristica_incantatore = document.getElementById('hbCarInc')?.value || null;
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
