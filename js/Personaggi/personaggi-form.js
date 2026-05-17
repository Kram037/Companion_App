// ============================================================================
// CHARACTER FORM SAVE AND MODAL
// ============================================================================

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
