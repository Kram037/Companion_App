// ============================================================================
// PERSONAGGI MANAGEMENT
// ============================================================================

// [BUILD-MARKER] Se vedi questa riga in console, hai la versione nuova del file.
appDebug('[homebrew][build] personaggi.js BUILD 2026-04-23-F integrazione sottoclassi homebrew nella scheda');

/* ──────────────────────────────────────────────────────────────────────
   Privilegi Tab
   Schema dati pg.privilegi:
   {
     hidden_auto: ['<class_slug>:<feature_name_en>', ...],   // privilegi auto-popolati nascosti
     custom_features: { '<TabName>': [{name, level, description}] },
     custom_tabs_order: ['Razza','Background', ...]          // ordine + presenza tabelle custom
   }
   ────────────────────────────────────────────────────────────────────── */

// Tabelle custom presenti di default nella pagina Privilegi.
// Nota: "Talenti" non e' qui perche' viene gestito come sezione speciale legata a pg.talenti.
let pgSaving = false;
async function handleSavePersonaggio(e) {
    e.preventDefault();
    if (pgSaving) return;
    pgSaving = true;
    const saveBtn = document.getElementById('savePersonaggioBtn');
    if (saveBtn) { saveBtn.disabled = true; saveBtn.textContent = 'Salvataggio...'; }
    const supabase = getSupabaseClient();
    if (!supabase) { pgSaving = false; if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = editingPersonaggioId ? 'Salva' : 'Crea'; } return; }

    const userData = await findUserByUid(AppState.currentUser?.uid);
    if (!userData) {
        showNotification('Errore: utente non trovato');
        return;
    }

    const destrezza = parseInt(document.getElementById('pgDestrezza').value) || 10;
    const desMod = calcMod(destrezza);
    const iniziativaVal = document.getElementById('pgIniziativa').value;
    const iniziativa = iniziativaVal !== '' ? parseInt(iniziativaVal) : desMod;
    const caVal = document.getElementById('pgCA').value;
    let caDefault = 10 + desMod;
    const classNames = pgSelectedClasses.map(c => c.nome);
    if (classNames.includes('Barbaro')) caDefault = 10 + desMod + calcMod(parseInt(document.getElementById('pgCostituzione').value) || 10);
    else if (classNames.includes('Monaco')) caDefault = 10 + desMod + calcMod(parseInt(document.getElementById('pgSaggezza').value) || 10);
    const classeArmatura = caVal !== '' ? parseInt(caVal) : caDefault;

    const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

    const classeDisplay = pgSelectedClasses.map(c => `${c.nome} ${c.livello}`).join(' / ');
    const totalLevel = pgGetTotalLevel();

    let pgData = {
        nome: document.getElementById('pgNome').value.trim(),
        razza: document.getElementById('pgRazza').value || null,
        sottorazza: document.getElementById('pgSottorazza').value || null,
        background: document.getElementById('pgBackground').value || null,
        classe: classeDisplay || null,
        classi: pgSelectedClasses,
        livello: totalLevel,
        forza: clamp(parseInt(document.getElementById('pgForza').value) || 10, 1, 30),
        destrezza: clamp(destrezza, 1, 30),
        costituzione: clamp(parseInt(document.getElementById('pgCostituzione').value) || 10, 1, 30),
        intelligenza: clamp(parseInt(document.getElementById('pgIntelligenza').value) || 10, 1, 30),
        saggezza: clamp(parseInt(document.getElementById('pgSaggezza').value) || 10, 1, 30),
        carisma: clamp(parseInt(document.getElementById('pgCarisma').value) || 10, 1, 30),
        tiri_salvezza: pgGetSelectedSaves(),
        competenze_abilita: Array.from(pgCurrentSkillProficiencies),
        maestrie_abilita: Array.from(pgCurrentSkillExpertise),
        talenti: pgCurrentTalenti,
        resistenze: pgCurrentResistenze,
        immunita: pgCurrentImmunita,
        equipaggiamento: pgSelectedEquipment.map(e => {
            if (e.tipo === 'arma') {
                const forza = clamp(parseInt(document.getElementById('pgForza').value) || 10, 1, 30);
                const modFor = calcMod(forza);
                const modDes = desMod;
                const isFinesse = e.proprieta?.some(p => p.includes('Accurata'));
                const isRanged = e.proprieta?.some(p => p.includes('Munizioni')) || e.proprieta?.some(p => p.includes('Lancio'));
                const atkMod = isRanged ? modDes : (isFinesse ? Math.max(modFor, modDes) : modFor);
                const profBonus = calcBonusCompetenza(totalLevel);
                return { ...e, bonus_colpire: profBonus + atkMod, bonus_danno: atkMod };
            }
            return e;
        }),
        slot_incantesimo: pgBuildSlotIncantesimo(),
        punti_vita_max: parseInt(document.getElementById('pgPV').value) || 10,
        pv_attuali: parseInt(document.getElementById('pgPV').value) || 10,
        iniziativa: iniziativa,
        classe_armatura: classeArmatura,
        percezione_passiva: pgCalcPercPassiva(),
        velocita: parseFloat(document.getElementById('pgVelocita').value) || 9,
        updated_at: new Date().toISOString()
    };

    if (!pgData.nome) {
        showNotification('Inserisci un nome per il personaggio');
        return;
    }

    // Auto-popola dati derivati da razza/background SOLO IN CREAZIONE: in
    // modifica non li tocchiamo per non sovrascrivere quanto l'utente ha
    // gia' personalizzato in scheda (lingue aggiunte, strumenti, oggetti,
    // monete spese). Cosi' i background del dataset locale spingono
    // direttamente al PG strumenti, linguaggi specifici, oggetti iniziali e
    // oro di partenza.
    if (!editingPersonaggioId) {
        const _razzaVal = document.getElementById('pgRazza').value || '';
        const _sottoVal = document.getElementById('pgSottorazza').value || '';
        pgData.linguaggi = autoPopulateLinguaggi(_razzaVal, _sottoVal);

        const _bgVal = document.getElementById('pgBackground').value || '';
        const _bgData = _bgVal ? getBackgroundData(_bgVal) : null;
        if (_bgData) {
            const _bgTools = (_bgData.competenze_strumenti || [])
                .map(t => ({ nome: t, maestria: false }));
            if (_bgTools.length > 0) pgData.competenze_strumenti = _bgTools;
            if (_bgData.linguaggi_specifici && _bgData.linguaggi_specifici.length > 0) {
                pgData.linguaggi = Array.from(new Set([
                    ...(pgData.linguaggi || []),
                    ..._bgData.linguaggi_specifici,
                ]));
            }
            if (_bgData.equipaggiamento_iniziale && _bgData.equipaggiamento_iniziale.length > 0) {
                pgData.inventario = _bgData.equipaggiamento_iniziale.map(name => ({
                    nome: name,
                    descrizione: 'Equipaggiamento iniziale del background',
                    quantita: 1,
                    magico: false,
                }));
            }
            if (_bgData.oro_iniziale) {
                pgData.monete = { mr: 0, ma: 0, me: 0, mo: _bgData.oro_iniziale, mp: 0 };
            }
        }
    }

    // Helper: alcune colonne (es. 'sottorazza') potrebbero non esistere
    // ancora a DB se l'utente non ha eseguito sql/add-sottorazza.sql.
    // Riproviamo senza la colonna problematica per non bloccare il salvataggio.
    const _stripMissingColumns = (data, errMsg) => {
        const m = (errMsg || '').match(/'?([a-z_]+)'? column/i)
              || (errMsg || '').match(/find ['"]?([a-z_]+)['"]? column/i)
              || (errMsg || '').match(/column ['"]?([a-z_]+)['"]?/i);
        if (!m) return null;
        const col = m[1];
        if (!(col in data)) return null;
        const cleaned = { ...data };
        delete cleaned[col];
        console.warn(`[pg save] Colonna '${col}' mancante a DB: salvo senza. Esegui sql/add-${col.replace(/_/g, '-')}.sql per abilitarla.`);
        return cleaned;
    };

    try {
        if (editingPersonaggioId) {
            let { error } = await supabase
                .from('personaggi')
                .update(pgData)
                .eq('id', editingPersonaggioId);
            // Retry escludendo colonne mancanti a DB
            for (let i = 0; i < 4 && error; i++) {
                const cleaned = _stripMissingColumns(pgData, error.message);
                if (!cleaned) break;
                pgData = cleaned;
                ({ error } = await supabase.from('personaggi').update(pgData).eq('id', editingPersonaggioId));
            }
            if (error) throw error;
            showNotification('Personaggio aggiornato');
        } else {
            pgData.user_id = userData.id;
            let { error } = await supabase
                .from('personaggi')
                .insert(pgData);
            for (let i = 0; i < 4 && error; i++) {
                const cleaned = _stripMissingColumns(pgData, error.message);
                if (!cleaned) break;
                pgData = cleaned;
                ({ error } = await supabase.from('personaggi').insert(pgData));
            }
            if (error) throw error;
            showNotification('Personaggio creato');
        }

        const wasEditing = editingPersonaggioId;
        closePersonaggioModal();
        if (wasEditing && AppState.currentPage === 'scheda') {
            await renderSchedaPersonaggio(wasEditing);
        } else {
            await loadPersonaggi();
        }
        await sendAppEventBroadcast({ table: 'personaggi', action: wasEditing ? 'update' : 'insert' });
    } catch (error) {
        console.error('Errore salvataggio personaggio:', error);
        showNotification('Errore: ' + (error.message || error));
    } finally {
        pgSaving = false;
        const btn = document.getElementById('savePersonaggioBtn');
        if (btn) { btn.disabled = false; btn.textContent = editingPersonaggioId ? 'Salva' : 'Crea'; }
    }
}

window.deletePersonaggio = async function(personaggioId) {
    const confirmed = await showConfirm('Sei sicuro di voler eliminare questo personaggio? Verrà rimosso anche da tutte le campagne associate.');
    if (!confirmed) return;

    const supabase = getSupabaseClient();
    if (!supabase) return;

    try {
        const { error } = await supabase
            .from('personaggi')
            .delete()
            .eq('id', personaggioId);
        if (error) throw error;

        showNotification('Personaggio eliminato');
        if (AppState.currentPage === 'scheda') {
            navigateToPage('personaggi');
        }
        await loadPersonaggi();
        await sendAppEventBroadcast({ table: 'personaggi', action: 'delete' });
    } catch (error) {
        console.error('Errore eliminazione personaggio:', error);
        showNotification('Errore: ' + (error.message || error));
    }
}

// ─────────────────────────────────────────────────────────────────────
// Cambio sottoclasse dalla card (lista personaggi)
// Permette di cambiare la sottoclasse di un personaggio gia' creato.
// I privilegi auto-derivati e le risorse di sottoclasse vengono ricalcolati
// automaticamente al successivo render (sono derivati da CLASSES_DATA +
// SUBCLASS_RESOURCES in base a sottoclasseSlug/sottoclasse_homebrew_id).
// ─────────────────────────────────────────────────────────────────────
window.pgChangeSubclassFromCard = async function(pgId) {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    let pg;
    try {
        const { data, error } = await supabase.from('personaggi').select('*').eq('id', pgId).single();
        if (error) throw error;
        pg = data;
    } catch (e) {
        console.error('Errore caricamento personaggio:', e);
        showNotification('Errore nel caricamento del personaggio');
        return;
    }
    if (!pg) return;

    if (typeof loadHomebrewSottoclassi === 'function') {
        try { await loadHomebrewSottoclassi(); } catch (_) {}
    }

    let classi = Array.isArray(pg.classi) && pg.classi.length > 0
        ? pg.classi
        : (pg.classe ? [{ nome: pg.classe, livello: pg.livello || 1 }] : []);

    if (!classi.length) {
        showNotification('Nessuna classe trovata per questo personaggio');
        return;
    }

    const eligible = classi.map((c, i) => {
        const opts = pgGetSubclassOptions(c.nome);
        const hbOpts = pgGetHomebrewSubclassOptions(c.nome);
        return { c, i, opts, hbOpts, hasOpts: opts.length > 0 || hbOpts.length > 0 };
    }).filter(x => x.hasOpts);

    if (!eligible.length) {
        showNotification('Nessuna sottoclasse disponibile per le classi di questo personaggio');
        return;
    }

    if (eligible.length === 1) {
        _pgOpenSubclassPickerForSavedPg(pgId, pg, eligible[0].i);
        return;
    }

    const items = eligible.map(({ c, i }) => ({
        value: String(i),
        label: `${c.nome} (Liv. ${c.livello || 1})${c.sottoclasse ? ' — ' + c.sottoclasse : ''}`
    }));
    openCustomSelect(items, (value) => {
        _pgOpenSubclassPickerForSavedPg(pgId, pg, parseInt(value));
    }, 'Per quale classe?');
};

async function _pgOpenSubclassPickerForSavedPg(pgId, pg, classIdx) {
    if (!Array.isArray(pg.classi) || !pg.classi[classIdx]) return;
    const c = pg.classi[classIdx];
    const opts = pgGetSubclassOptions(c.nome);
    const hbOpts = pgGetHomebrewSubclassOptions(c.nome);
    if (opts.length === 0 && hbOpts.length === 0) {
        showNotification(`Nessuna sottoclasse disponibile per ${c.nome}`);
        return;
    }
    const items = _buildSubclassPickerItems(opts, hbOpts, c.livello || 1);
    const allOpts = [...opts, ...hbOpts];

    openCustomSelect(items, async (value) => {
        const newClassi = pg.classi.map(x => ({ ...x }));
        const target = newClassi[classIdx];
        if (value === '__none__') {
            delete target.sottoclasse;
            delete target.sottoclasseSlug;
            delete target.sottoclasse_homebrew_id;
            delete target.sottoclasse_homebrew_author;
            target.thirdCaster = false;
        } else {
            const sel = allOpts.find(o => o.slug === value);
            if (!sel) return;
            target.sottoclasse = sel.name;
            target.sottoclasseSlug = sel.slug;
            if (sel.isHomebrew) {
                target.sottoclasse_homebrew_id = sel._hbId;
                if (sel._hbAuthor) target.sottoclasse_homebrew_author = sel._hbAuthor;
                target.thirdCaster = false;
            } else {
                delete target.sottoclasse_homebrew_id;
                delete target.sottoclasse_homebrew_author;
                target.thirdCaster = (typeof isThirdCasterSubclass === 'function')
                    ? isThirdCasterSubclass(sel.slug, sel.name) : false;
            }
        }

        // Pulisce dai privilegi salvati le voci "hidden_auto" legate alla
        // vecchia sottoclasse di questa stessa classe (prefisso
        // "<classSlug>:<oldSubSlug>:"), per non lasciare fantasmi che, in
        // teoria, potrebbero collidere se l'utente tornasse alla stessa
        // sottoclasse in futuro. Le custom_features (tabelle utente) restano
        // intatte.
        const oldSubSlug = c.sottoclasseSlug || '';
        let privilegi = pg.privilegi && typeof pg.privilegi === 'object' ? { ...pg.privilegi } : null;
        if (privilegi && Array.isArray(privilegi.hidden_auto) && oldSubSlug) {
            privilegi.hidden_auto = privilegi.hidden_auto.filter(k => {
                if (typeof k !== 'string') return true;
                return !k.includes(`:${oldSubSlug}:`);
            });
        }

        const updates = { classi: newClassi, updated_at: new Date().toISOString() };
        if (privilegi) updates.privilegi = privilegi;

        const supabase = getSupabaseClient();
        if (!supabase) return;
        try {
            const { error } = await supabase.from('personaggi').update(updates).eq('id', pgId);
            if (error) throw error;
            showNotification(target.sottoclasse
                ? `Sottoclasse di ${c.nome} aggiornata: ${target.sottoclasse}`
                : `Sottoclasse di ${c.nome} rimossa`);
            await loadPersonaggi();
            // Se la scheda di questo PG e' aperta, ricarica.
            if (AppState.currentPersonaggioId === pgId && AppState.currentPage === 'scheda') {
                if (typeof renderSchedaPersonaggio === 'function') {
                    await renderSchedaPersonaggio(pgId);
                }
            }
            try { await sendAppEventBroadcast({ table: 'personaggi', action: 'update', id: pgId }); } catch (_) {}
        } catch (e) {
            console.error('Errore aggiornamento sottoclasse:', e);
            showNotification('Errore nel salvataggio della sottoclasse');
        }
    }, `Sottoclasse di ${c.nome}`);
}

// --- Scegli personaggio per campagna ---

window.openScegliPersonaggioModal = async function(campagnaId) {
    if (!elements.scegliPersonaggioModal || !elements.scegliPersonaggioList) return;

    elements.scegliPersonaggioList.innerHTML = '<div class="loading-placeholder"><div class="loading-spinner"></div><p>Caricamento...</p></div>';
    elements.scegliPersonaggioModal.classList.add('active');
    document.body.style.overflow = 'hidden';

    const supabase = getSupabaseClient();
    if (!supabase) return;

    try {
        const userData = await findUserByUid(AppState.currentUser?.uid);
        if (!userData) throw new Error('Utente non trovato');

        const { data: personaggi, error } = await supabase.rpc('get_personaggi_utente');
        if (error) throw error;

        const { data: assoc } = await supabase
            .from('personaggi_campagna')
            .select('personaggio_id')
            .eq('campagna_id', campagnaId)
            .eq('user_id', userData.id)
            .maybeSingle();

        const currentPgId = assoc?.personaggio_id || null;

        if (!personaggi || personaggi.length === 0) {
            elements.scegliPersonaggioList.innerHTML = `
                <div class="content-placeholder">
                    <p>Non hai personaggi. Creane uno prima!</p>
                    <button class="btn-primary btn-small" onclick="closeScegliPersonaggioModal(); navigateToPage('personaggi');">Vai a Personaggi</button>
                </div>`;
            return;
        }

        elements.scegliPersonaggioList.innerHTML = personaggi.map(pg => {
            const initials = (pg.nome || '?').substring(0, 2).toUpperCase();
            const isSelected = pg.id === currentPgId;
            return `
            <div class="scegli-pg-item ${isSelected ? 'selected' : ''}" onclick="selectPersonaggioCampagna('${campagnaId}', '${pg.id}', '${userData.id}')">
                <div class="scegli-pg-item-avatar">${escapeHtml(initials)}</div>
                <div class="scegli-pg-item-info">
                    <div class="scegli-pg-item-name">${escapeHtml(pg.nome)}${isSelected ? ' (attuale)' : ''}</div>
                    <div class="scegli-pg-item-detail">${escapeHtml(pg.razza || '')} ${escapeHtml(pg.classe || '')} - Lv ${pg.livello || 1}</div>
                </div>
            </div>`;
        }).join('');
    } catch (error) {
        console.error('Errore caricamento personaggi per selezione:', error);
        elements.scegliPersonaggioList.innerHTML = '<div class="content-placeholder"><p>Errore nel caricamento</p></div>';
    }
}

function closeScegliPersonaggioModal() {
    if (elements.scegliPersonaggioModal) {
        elements.scegliPersonaggioModal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

window.selectPersonaggioCampagna = async function(campagnaId, personaggioId, userId) {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    try {
        const { error } = await supabase
            .from('personaggi_campagna')
            .upsert({
                campagna_id: campagnaId,
                user_id: userId,
                personaggio_id: personaggioId,
                created_at: new Date().toISOString()
            }, { onConflict: 'campagna_id,user_id' });

        if (error) throw error;

        showNotification('Personaggio selezionato!');
        closeScegliPersonaggioModal();
        await sendAppEventBroadcast({ table: 'personaggi_campagna', action: 'upsert', campagnaId });

        if (AppState.currentPage === 'dettagli' && AppState.currentCampagnaId === campagnaId) {
            await loadCampagnaDetails(campagnaId);
        }
    } catch (error) {
        console.error('Errore selezione personaggio:', error);
        showNotification('Errore: ' + (error.message || error));
    }
}

// ============================================================================
// TIPO SCHEDA MODAL
// ============================================================================

window.openTipoSchedaModal = function() {
    const modal = document.getElementById('tipoSchedaModal');
    if (modal) { modal.classList.add('active'); document.body.style.overflow = 'hidden'; }
};

window.closeTipoSchedaModal = function() {
    const modal = document.getElementById('tipoSchedaModal');
    if (modal) { modal.classList.remove('active'); document.body.style.overflow = ''; }
};

// ============================================================================
// MICRO SCHEDA CREATION
// ============================================================================

let _microEditingId = null;
let _microSelectedClasses = [];

function microRenderClassi() {
    const container = document.getElementById('microClassiList');
    if (!container) return;
    const chipsHtml = _microSelectedClasses.map((c, i) => {
        const subSelector = _renderSubclassSelector(c, i, 'microOpenSubclassDropdown');
        return `
        <div class="pg-classe-chip">
            <div class="pg-classe-chip-top">
                <span class="pg-classe-name">${escapeHtml(c.nome)}</span>
                <div class="pg-classe-lv-controls">
                    <span class="pg-classe-lv-label">Lv.</span>
                    <button type="button" class="pg-classe-lv-btn" onclick="microClassLevelChange(${i},-1)">−</button>
                    <span class="pg-classe-lv-val">${c.livello}</span>
                    <button type="button" class="pg-classe-lv-btn" onclick="microClassLevelChange(${i},1)">+</button>
                </div>
                <button type="button" class="pg-classe-remove" onclick="microRemoveClass(${i})">&times;</button>
            </div>
            ${subSelector}
        </div>`;
    }).join('');

    const addBtn = `<button type="button" class="pg-add-class-btn" onclick="microOpenClasseSelect()">
        <span class="pg-add-class-plus">+</span> Aggiungi classe
    </button>`;
    container.innerHTML = chipsHtml + addBtn;
    microUpdateTotalLevel();
}

window.microOpenSubclassDropdown = async function(index) {
    const c = _microSelectedClasses[index];
    if (!c) return;
    // Refresh cache homebrew sempre prima del picker (la dedup interna evita
    // doppie query). Cache vuota non significa "già provato": potrebbe essere
    // un'inizializzazione precedente fatta senza utente loggato.
    if (typeof loadHomebrewSottoclassi === 'function') {
        try { await loadHomebrewSottoclassi(); } catch (_) {}
    }
    const opts = pgGetSubclassOptions(c.nome);
    const hbOpts = pgGetHomebrewSubclassOptions(c.nome);
    if (opts.length === 0 && hbOpts.length === 0) {
        showNotification(`Nessuna sottoclasse disponibile per ${c.nome}`);
        return;
    }
    const items = _buildSubclassPickerItems(opts, hbOpts, c.livello);
    const allOpts = [...opts, ...hbOpts];
    openCustomSelect(items, (value) => {
        if (value === '__none__') {
            delete c.sottoclasse;
            delete c.sottoclasseSlug;
            delete c.sottoclasse_homebrew_id;
            delete c.sottoclasse_homebrew_author;
            c.thirdCaster = false;
        } else {
            const sel = allOpts.find(o => o.slug === value);
            if (sel) {
                c.sottoclasse = sel.name;
                c.sottoclasseSlug = sel.slug;
                if (sel.isHomebrew) {
                    c.sottoclasse_homebrew_id = sel._hbId;
                    if (sel._hbAuthor) c.sottoclasse_homebrew_author = sel._hbAuthor;
                    c.thirdCaster = false;
                } else {
                    delete c.sottoclasse_homebrew_id;
                    delete c.sottoclasse_homebrew_author;
                    c.thirdCaster = isThirdCasterSubclass(sel.slug, sel.name);
                }
            }
        }
        microRenderClassi();
    }, `Sottoclasse di ${c.nome}`);
};

window.microClearSubclass = function(index) {
    const c = _microSelectedClasses[index];
    if (!c) return;
    delete c.sottoclasse;
    delete c.sottoclasseSlug;
    delete c.sottoclasse_homebrew_id;
    delete c.sottoclasse_homebrew_author;
    c.thirdCaster = false;
    microRenderClassi();
};

function microUpdateTotalLevel() {
    const total = _microSelectedClasses.reduce((s, c) => s + c.livello, 0);
    const field = document.getElementById('microLivello');
    if (field) field.value = total;
}

window.microOpenClasseSelect = function() {
    const available = DND_CLASSES.filter(cls => !_microSelectedClasses.some(s => s.nome === cls));
    const classOptions = available.map(c => ({ value: c, label: c }));
    openCustomSelect(classOptions, (value) => {
        _microSelectedClasses.push({ nome: value, livello: 1, thirdCaster: false });
        microRenderClassi();
    }, 'Seleziona Classe');
};

window.microRemoveClass = function(i) {
    _microSelectedClasses.splice(i, 1);
    microRenderClassi();
};

window.microClassLevelChange = function(i, delta) {
    const c = _microSelectedClasses[i];
    if (!c) return;
    c.livello = Math.max(1, Math.min(20, c.livello + delta));
    microRenderClassi();
};

window.openMicroSchedaModal = function(personaggioId) {
    _microEditingId = personaggioId || null;
    const form = document.getElementById('microSchedaForm');
    if (form) form.reset();
    _microSelectedClasses = [];

    const title = document.getElementById('microSchedaModalTitle');
    const saveBtn = document.getElementById('saveMicroSchedaBtn');
    if (_microEditingId) {
        if (title) title.textContent = 'Modifica Micro Scheda';
        if (saveBtn) saveBtn.textContent = 'Salva';
        const supabase = getSupabaseClient();
        if (supabase) {
            supabase.from('personaggi').select('*').eq('id', personaggioId).single().then(({ data }) => {
                if (data) {
                    document.getElementById('microNome').value = data.nome || '';
                    document.getElementById('microPVMax').value = data.punti_vita_max || 10;
                    if (data.classi && Array.isArray(data.classi) && data.classi.length > 0) {
                        _microSelectedClasses = data.classi.map(c => ({
                            nome: c.nome,
                            livello: c.livello || 1,
                            thirdCaster: !!c.thirdCaster,
                            ...(c.sottoclasse ? { sottoclasse: c.sottoclasse } : {}),
                            ...(c.sottoclasseSlug ? { sottoclasseSlug: c.sottoclasseSlug } : {}),
                        }));
                    } else if (data.classe) {
                        _microSelectedClasses = [{ nome: data.classe, livello: data.livello || 1, thirdCaster: false }];
                    }
                    microRenderClassi();
                }
            });
        }
    } else {
        if (title) title.textContent = 'Nuova Micro Scheda';
        if (saveBtn) saveBtn.textContent = 'Crea';
    }
    microRenderClassi();

    const modal = document.getElementById('microSchedaModal');
    if (modal) { modal.classList.add('active'); document.body.style.overflow = 'hidden'; }
};

window.closeMicroSchedaModal = function() {
    const modal = document.getElementById('microSchedaModal');
    if (modal) { modal.classList.remove('active'); document.body.style.overflow = ''; }
    _microEditingId = null;
};

async function handleSaveMicroScheda(e) {
    e.preventDefault();
    const supabase = getSupabaseClient();
    if (!supabase) return;

    const nome = document.getElementById('microNome')?.value?.trim();
    if (!nome) { showNotification('Inserisci un nome'); return; }
    if (_microSelectedClasses.length === 0) { showNotification('Seleziona almeno una classe'); return; }

    const pvMax = parseInt(document.getElementById('microPVMax')?.value) || 10;
    const totalLevel = _microSelectedClasses.reduce((s, c) => s + c.livello, 0);
    const classeDisplay = _microSelectedClasses.map(c => `${c.nome} ${c.livello}`).join(' / ');

    const saveBtn = document.getElementById('saveMicroSchedaBtn');
    if (saveBtn) { saveBtn.disabled = true; saveBtn.textContent = 'Salvataggio...'; }

    const userData = await findUserByUid(AppState.currentUser?.uid);
    if (!userData) { showNotification('Errore: utente non trovato'); return; }

    const autoSlots = calcSpellSlotsFromClassi(_microSelectedClasses);
    const slotIncantesimo = {};
    Object.keys(autoSlots).forEach(lv => {
        slotIncantesimo[lv] = { max: autoSlots[lv], current: autoSlots[lv], used: 0 };
    });

    const pgData = {
        nome,
        classe: classeDisplay,
        classi: _microSelectedClasses,
        livello: totalLevel,
        punti_vita_max: pvMax,
        pv_attuali: pvMax,
        slot_incantesimo: slotIncantesimo,
        tipo_scheda: 'micro',
        updated_at: new Date().toISOString()
    };

    try {
        if (_microEditingId) {
            const { error } = await supabase.from('personaggi').update(pgData).eq('id', _microEditingId);
            if (error) throw error;
            showNotification('Micro Scheda aggiornata');
        } else {
            pgData.user_id = userData.id;
            pgData.forza = 10; pgData.destrezza = 10; pgData.costituzione = 10;
            pgData.intelligenza = 10; pgData.saggezza = 10; pgData.carisma = 10;
            pgData.classe_armatura = 10; pgData.iniziativa = 0; pgData.velocita = 9;
            pgData.percezione_passiva = 10;
            const { error } = await supabase.from('personaggi').insert(pgData);
            if (error) throw error;
            showNotification('Micro Scheda creata');
        }
        closeMicroSchedaModal();
        loadPersonaggi();
    } catch (err) {
        console.error('Errore salvataggio micro scheda:', err);
        showNotification('Errore nel salvataggio');
    } finally {
        if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = _microEditingId ? 'Salva' : 'Crea'; }
    }
}

// ============================================================================
// MICRO SCHEDA RENDERING
// ============================================================================

async function renderMicroScheda(personaggioId) {
    const content = document.getElementById('schedaContent');
    if (!content) return;

    const supabase = getSupabaseClient();
    if (!supabase) { content.innerHTML = '<p>Errore</p>'; return; }

    const { data: pg, error } = await supabase.from('personaggi').select('*').eq('id', personaggioId).single();
    if (error || !pg) { content.innerHTML = '<p>Personaggio non trovato</p>'; return; }
    _schedaPgCache = pg;

    let classeDisplay = pg.classe || '';
    if (pg.classi && Array.isArray(pg.classi) && pg.classi.length > 0) {
        classeDisplay = pg.classi.map(c => `${c.nome} ${c.livello}`).join(' / ');
    }

    const pvAttuali = pg.pv_attuali != null ? pg.pv_attuali : pg.punti_vita_max;
    const pvTemp = pg.pv_temporanei || 0;
    const initDisplay = pg.iniziativa != null ? pg.iniziativa : 0;
    const initStr = initDisplay >= 0 ? `+${initDisplay}` : `${initDisplay}`;

    const CLASS_HD = { 'Artefice':8,'Bardo':8,'Chierico':8,'Druido':8,'Ladro':8,'Monaco':8,'Warlock':8,'Barbaro':12,'Mago':6,'Stregone':6,'Guerriero':10,'Paladino':10,'Ranger':10 };
    const dadiDisp = pg.dadi_vita_disponibili || {};
    let hitDiceHtml = '';
    if (pg.classi && Array.isArray(pg.classi) && pg.classi.length > 0) {
        hitDiceHtml = `<div class="scheda-hd-table">
            ${pg.classi.map(c => {
                const die = CLASS_HD[c.nome] || 8;
                const total = c.livello || 1;
                const key = c.nome;
                const available = Math.min(total, dadiDisp[key] != null ? dadiDisp[key] : total);
                return `<div class="scheda-hd-row">
                    <span class="scheda-hd-total">${total}d${die} <small>(${c.nome})</small></span>
                    <div class="scheda-hd-avail">
                        <button class="scheda-hd-btn" onclick="microHdChange('${pg.id}','${key}',-1,${total})">−</button>
                        <span class="scheda-hd-val" id="sHd_${key}">${available}</span>
                        <button class="scheda-hd-btn" onclick="microHdChange('${pg.id}','${key}',1,${total})">+</button>
                    </div>
                </div>`;
            }).join('')}
        </div>`;
    }

    // Micro scheda: class resources
    const microClassRes = pg.risorse_classe || {};
    const microResItems = [];
    if (pg.classi && Array.isArray(pg.classi) && pg.classi.length > 0) {
        pg.classi.forEach(c => {
            const resList = CLASS_RESOURCES[c.nome];
            if (!resList) return;
            resList.forEach((res, rIdx) => {
                if (c.livello < res.fromLevel) return;
                let maxVal;
                if (res.hpPool) {
                    maxVal = c.livello * 5;
                } else if (res.usaMod) {
                    maxVal = Math.max(1, calcMod(pg[res.usaMod] || 10));
                } else if (res.perLivello) {
                    maxVal = res.perLivello[Math.min(c.livello, 20)] || 0;
                } else { return; }
                if (maxVal <= 0) return;
                const key = rIdx === 0 ? `${c.nome}_res` : `${c.nome}_res_${rIdx}`;
                const current = Math.min(maxVal, microClassRes[key] != null ? microClassRes[key] : maxVal);
                microResItems.push(`<div class="scheda-hd-row">
                    <span class="scheda-hd-total">${res.nome} <small>(${c.nome})</small></span>
                    <div class="scheda-hd-avail">
                        <button class="scheda-hd-btn" onclick="schedaClassResChange('${pg.id}','${key}',${current},-1,${maxVal})">−</button>
                        <span class="scheda-hd-val" id="sCRes_${key}">${current}</span>
                        <span class="scheda-hd-max">/ ${maxVal}</span>
                        <button class="scheda-hd-btn" onclick="schedaClassResChange('${pg.id}','${key}',${current},1,${maxVal})">+</button>
                    </div>
                </div>`);
            });
        });
    }
    _pgRaceResources(pg).forEach(rr => {
        const sub = rr.recharge ? ` <small>(razza, ${rr.recharge})</small>` : ` <small>(razza)</small>`;
        microResItems.push(`<div class="scheda-hd-row">
            <span class="scheda-hd-total">${escapeHtml(rr.name)}${sub}</span>
            <div class="scheda-hd-avail">
                <button class="scheda-hd-btn" onclick="schedaRaceResChange('${pg.id}','${rr.key}',${rr.current},-1,${rr.max})">−</button>
                <span class="scheda-hd-val" id="sRRes_${rr.key}">${rr.current}</span>
                <span class="scheda-hd-max">/ ${rr.max}</span>
                <button class="scheda-hd-btn" onclick="schedaRaceResChange('${pg.id}','${rr.key}',${rr.current},1,${rr.max})">+</button>
            </div>
        </div>`);
    });
    const microCustomRes = microClassRes._custom || [];
    microCustomRes.forEach((cr, i) => {
        const current = cr.current != null ? cr.current : cr.max;
        const label = cr.tipo === 'dadi' ? `${escapeHtml(cr.nome)} <small>(${cr.dado})</small>` : escapeHtml(cr.nome);
        microResItems.push(`<div class="scheda-hd-row">
            <span class="scheda-hd-total scheda-hd-total-clickable" onclick="schedaOpenAddCustomRes('${pg.id}',${i})" title="Modifica / elimina">${label}</span>
            <div class="scheda-hd-avail">
                <button class="scheda-hd-btn" onclick="schedaCustomResChange('${pg.id}',${i},${current},-1,${cr.max})">−</button>
                <span class="scheda-hd-val" id="sCusRes_${i}">${current}</span>
                <span class="scheda-hd-max">/ ${cr.max}</span>
                <button class="scheda-hd-btn" onclick="schedaCustomResChange('${pg.id}',${i},${current},1,${cr.max})">+</button>
            </div>
        </div>`);
    });
    const microClassResHtml = `<div class="scheda-section">
        <div class="scheda-section-title">Risorse di Classe
            <button class="scheda-edit-btn" onclick="schedaOpenAddCustomRes('${pg.id}')" title="Aggiungi risorsa">&#9998;</button>
        </div>
        ${microResItems.length > 0 ? `<div class="scheda-hd-table">${microResItems.join('')}</div>` : '<span class="scheda-empty">Nessuna risorsa</span>'}
    </div>`;

    const isConcentrating = !!pg.concentrazione;
    const conditionsActive = ALL_CONDITIONS.filter(c => c.key !== 'concentrazione' && pg[c.key]);
    const conditionsHtml = conditionsActive.length > 0 ?
        conditionsActive.map(c => `<span class="condition-badge active">${c.label}</span>`).join('') :
        '<span class="scheda-empty">Nessuna</span>';

    const resistenze = pg.resistenze || [];
    const immunita = pg.immunita || [];
    const microResHtml = resistenze.length > 0 ?
        resistenze.map(r => `<span class="scheda-tag">${escapeHtml(r.charAt(0).toUpperCase() + r.slice(1))}</span>`).join('') :
        '<span class="scheda-empty">Nessuna</span>';
    const microImmHtml = immunita.length > 0 ?
        immunita.map(r => `<span class="scheda-tag scheda-tag-imm">${escapeHtml(r.charAt(0).toUpperCase() + r.slice(1))}</span>`).join('') :
        '<span class="scheda-empty">Nessuna</span>';
    const resImmHtml = `<div class="scheda-section">
        <div class="scheda-section-title">
            Resistenze e Immunità
            <button class="scheda-edit-btn" onclick="schedaOpenResImmEdit('${pg.id}')" title="Modifica">&#9998;</button>
        </div>
        <div class="scheda-res-imm-display" id="schedaResImmDisplay">
            <div class="scheda-res-imm-row"><span class="scheda-res-imm-label">Resistenze</span><div class="scheda-tags">${microResHtml}</div></div>
            <div class="scheda-res-imm-row"><span class="scheda-res-imm-label">Immunità</span><div class="scheda-tags">${microImmHtml}</div></div>
        </div>
        <div id="schedaResImmEditGrid" style="display:none;"></div>
    </div>`;

    const slots = pg.slot_incantesimo || {};
    let slotsHtml = '';
    const sortedLevels = Object.keys(slots).map(Number).filter(l => l > 0 && slots[l]?.max > 0).sort((a, b) => a - b);
    const slotRows = sortedLevels.map(lv => {
        const s = slots[lv];
        const currentAvail = s.current != null ? s.current : (s.max - (s.used || 0));
        const pips = [];
        for (let i = 0; i < s.max; i++) {
            pips.push(`<span class="scheda-slot-pip ${i < currentAvail ? 'filled' : ''}" data-lvl="${lv}" data-idx="${i}"></span>`);
        }
        return `
        <div class="scheda-slot-row">
            <span class="scheda-slot-level">Lv ${lv}</span>
            <div class="scheda-slot-pips">${pips.join('')}</div>
            <span class="scheda-slot-count">${currentAvail}/${s.max}</span>
        </div>`;
    }).join('');
    slotsHtml = `<div class="scheda-section">
        <div class="scheda-section-title">Slot Incantesimo <button class="scheda-edit-btn" onclick="microOpenSlotConfig('${pg.id}')" title="Configura">&#9998;</button></div>
        ${slotRows ? `<div class="scheda-slots-table">${slotRows}</div>` : '<span class="scheda-empty">Nessuno slot configurato</span>'}
    </div>`;

    const tabBar = document.getElementById('schedaTabBar');
    if (tabBar) tabBar.style.display = 'none';

    // La micro-scheda non ha la struttura con il divisore "Statistiche": nascondi il bottone spada.
    const scrollBtn = document.getElementById('btnScrollStats');
    if (scrollBtn) scrollBtn.style.display = 'none';

    content.innerHTML = `
    <div class="scheda-identity">
        <div class="scheda-name">${escapeHtml(pg.nome)}</div>
        <div class="scheda-subtitle">${escapeHtml(classeDisplay)}</div>
        <div class="scheda-subtitle-sm">${[pg.razza, pg.background].filter(Boolean).map(s => escapeHtml(s)).join(' · ')}</div>
    </div>

    <div class="scheda-three-boxes">
        <div class="scheda-box clickable" onclick="schedaOpenStatCalc('${pg.id}','iniziativa')">
            <div class="scheda-box-val" id="schedaInit">${initStr}</div>
            <div class="scheda-box-label">Iniziativa</div>
        </div>
    </div>

    <div class="scheda-hp-section">
        <div class="scheda-hp-left">
            <div class="scheda-hp-pair">
                <div class="scheda-hp-cell clickable" onclick="schedaOpenHpCalc('${pg.id}','punti_vita_max',${pg.punti_vita_max},-1)">
                    <div class="scheda-hp-display" id="schedaPvMax">${pg.punti_vita_max || 10}</div>
                    <div class="scheda-hp-label">PV Massimi</div>
                </div>
                <div class="scheda-hp-cell clickable" onclick="schedaOpenHpCalc('${pg.id}','pv_attuali',${pvAttuali},${pg.punti_vita_max})">
                    <div class="scheda-hp-display pv-current" id="schedaPvAttuali">${pvAttuali}</div>
                    <div class="scheda-hp-label">PV Attuali</div>
                </div>
            </div>
        </div>
        <div class="scheda-hp-right clickable" onclick="schedaOpenHpCalc('${pg.id}','pv_temporanei',${pvTemp},-1)">
            <div class="scheda-hp-display" id="schedaPvTemp">${pvTemp}</div>
            <div class="scheda-hp-label">PV Temp</div>
        </div>
    </div>

    <div class="scheda-section">
        <div class="scheda-section-title">Dadi Vita</div>
        ${hitDiceHtml || '<span class="scheda-empty">-</span>'}
    </div>

    ${microClassResHtml}

    <div class="scheda-section">
        <div class="scheda-section-title">Condizioni</div>
        <div class="scheda-concentrazione-row">
            <button type="button" class="scheda-concentrazione-btn ${isConcentrating ? 'active' : ''}" onclick="schedaToggleConcentrazione('${pg.id}',this)">Concentrazione</button>
        </div>
        <div class="scheda-tags" style="margin-top:8px;">${conditionsHtml}</div>
        <div class="scheda-condition-extra">
            <span>Esaustione: <strong>${pg.esaustione || 0}</strong>/6</span>
        </div>
        <button type="button" class="btn-secondary btn-small" style="margin-top:8px;" onclick="openConditionsModal('${pg.id}')">Modifica stato</button>
    </div>

    ${resImmHtml}

    ${slotsHtml}
    `;

    content.querySelectorAll('.scheda-slot-pip').forEach(pip => {
        pip.addEventListener('click', () => {
            const lvl = parseInt(pip.dataset.lvl);
            const idx = parseInt(pip.dataset.idx);
            microSlotToggle(pg.id, lvl, idx);
        });
    });

    const backBtn = document.getElementById('schedaBackBtn');
    if (backBtn) backBtn.onclick = () => navigateToPage('personaggi');

    // Se richiesto, centra la vista sul blocco PV/PV temp/Iniziativa.
    if (window._schedaPendingScrollToStats) {
        window._schedaPendingScrollToStats = false;
        setTimeout(() => {
            const target = content.querySelector('.scheda-hp-section')
                        || content.querySelector('.scheda-three-boxes');
            if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 60);
    }
}

window.microSlotToggle = async function(pgId, level, index) {
    const pg = _schedaPgCache;
    if (!pg?.slot_incantesimo?.[level]) return;
    const slot = pg.slot_incantesimo[level];
    const currentAvail = slot.current != null ? slot.current : (slot.max - (slot.used || 0));
    slot.current = index < currentAvail ? index : index + 1;
    slot.used = slot.max - slot.current;
    await schedaInstantSave(pgId, { slot_incantesimo: pg.slot_incantesimo });
    renderMicroScheda(pgId);
}

window.microHdChange = async function(pgId, key, delta, max) {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    const { data: pg } = await supabase.from('personaggi').select('dadi_vita_disponibili').eq('id', pgId).single();
    const dadiDisp = pg?.dadi_vita_disponibili || {};
    const current = dadiDisp[key] != null ? dadiDisp[key] : max;
    const newVal = Math.max(0, Math.min(max, current + delta));
    dadiDisp[key] = newVal;
    await supabase.from('personaggi').update({ dadi_vita_disponibili: dadiDisp, updated_at: new Date().toISOString() }).eq('id', pgId);
    renderMicroScheda(pgId);
};

window.microToggleCondition = async function(pgId, key, el) {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    const isActive = el.classList.contains('active');
    await supabase.from('personaggi').update({ [key]: !isActive, updated_at: new Date().toISOString() }).eq('id', pgId);
    el.classList.toggle('active');
};

window.microSlotChange = async function(pgId, level, delta, max) {
    const pg = _schedaPgCache;
    if (!pg) return;
    const slots = pg.slot_incantesimo || {};
    if (!slots[level]) slots[level] = { max, current: max, used: 0 };
    const avail = slots[level].current != null ? slots[level].current : (max - (slots[level].used || 0));
    const newAvail = Math.max(0, Math.min(max, avail - delta));
    slots[level].current = newAvail;
    slots[level].used = max - newAvail;
    await schedaInstantSave(pgId, { slot_incantesimo: slots });
    renderMicroScheda(pgId);
};

window.microOpenSlotConfig = async function(pgId) {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    const { data: pg } = await supabase.from('personaggi').select('slot_incantesimo').eq('id', pgId).single();
    const slots = pg?.slot_incantesimo || {};

    let rows = '';
    for (let lv = 1; lv <= 9; lv++) {
        const maxVal = slots[lv]?.max || 0;
        rows += `<div class="micro-slot-config-row">
            <span>${lv}° Livello</span>
            <input type="number" min="0" max="20" value="${maxVal}" id="microSlotMax_${lv}" class="form-control" style="width:60px;text-align:center;" inputmode="none" readonly onclick="pgOpenAbilityKeypad(this)">
        </div>`;
    }

    const modalHtml = `
    <div class="modal active" id="microSlotConfigModal">
        <div class="modal-content">
            <button class="modal-close" onclick="closeMicroSlotConfig()">&times;</button>
            <h2>Configura Slot Incantesimo</h2>
            <p style="font-size:0.82rem;color:var(--text-muted);margin-bottom:12px;">Imposta il numero massimo di slot per livello</p>
            <div class="micro-slot-config-grid">${rows}</div>
            <div class="form-actions" style="margin-top:var(--spacing-md);">
                <button type="button" class="btn-secondary" onclick="closeMicroSlotConfig()">Annulla</button>
                <button type="button" class="btn-primary" onclick="saveMicroSlotConfig('${pgId}')">Salva</button>
            </div>
        </div>
    </div>`;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
    document.body.style.overflow = 'hidden';
};

window.closeMicroSlotConfig = function() {
    const m = document.getElementById('microSlotConfigModal');
    if (m) m.remove();
    document.body.style.overflow = '';
};

window.saveMicroSlotConfig = async function(pgId) {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    const { data: pg } = await supabase.from('personaggi').select('slot_incantesimo').eq('id', pgId).single();
    const slots = pg?.slot_incantesimo || {};

    for (let lv = 1; lv <= 9; lv++) {
        const input = document.getElementById(`microSlotMax_${lv}`);
        const maxVal = parseInt(input?.value) || 0;
        if (maxVal > 0) {
            if (!slots[lv]) slots[lv] = { max: maxVal, used: 0 };
            else slots[lv].max = maxVal;
        } else {
            delete slots[lv];
        }
    }

    await supabase.from('personaggi').update({ slot_incantesimo: slots, updated_at: new Date().toISOString() }).eq('id', pgId);
    closeMicroSlotConfig();
    renderMicroScheda(pgId);
    showNotification('Slot incantesimo aggiornati');
};
