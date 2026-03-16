function formatTempoGioco(minuti) {
    if (minuti < 60) {
        return `00:${minuti.toString().padStart(2, '0')}`;
    }
    const ore = Math.floor(minuti / 60);
    const min = minuti % 60;
    // Se ore <= 99, usa formato hh:mm, altrimenti hhh:mm
    const oreStr = ore.toString().padStart(ore > 99 ? 3 : 2, '0');
    return `${oreStr}:${min.toString().padStart(2, '0')}`;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Notification System (simple)
function showNotification(message) {
    // Crea elemento notifica
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 90px;
        left: 50%;
        transform: translateX(-50%);
        background: var(--accent);
        color: white;
        padding: 1rem 2rem;
        border-radius: 12px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        z-index: 2000;
        animation: slideDown 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideUp 0.3s ease';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Add CSS animations for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideDown {
        from {
            transform: translateX(-50%) translateY(-20px);
            opacity: 0;
        }
        to {
            transform: translateX(-50%) translateY(0);
            opacity: 1;
        }
    }
    @keyframes slideUp {
        from {
            transform: translateX(-50%) translateY(0);
            opacity: 1;
        }
        to {
            transform: translateX(-50%) translateY(-20px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Callback per i dialog personalizzati
let confirmDialogResolve = null;
let promptDialogResolve = null;

/**
 * Mostra un dialog di conferma personalizzato (sostituisce confirm())
 * @param {string} message - Messaggio da mostrare
 * @param {string} title - Titolo del dialog (default: "Conferma")
 * @returns {Promise<boolean>} - true se confermato, false se annullato
 */
function showConfirm(message, title = 'Conferma') {
    return new Promise((resolve) => {
        if (!elements.confirmDialogModal) {
            console.error('❌ confirmDialogModal non trovato');
            resolve(false);
            return;
        }

        // Imposta titolo e messaggio
        if (elements.confirmDialogTitle) {
            elements.confirmDialogTitle.textContent = title;
        }
        if (elements.confirmDialogMessage) {
            elements.confirmDialogMessage.textContent = message;
        }

        // Memorizza il resolve
        confirmDialogResolve = resolve;

        // Mostra modal
        elements.confirmDialogModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    });
}

/**
 * Chiude il dialog di conferma
 */
function closeConfirmDialog(result) {
    if (elements.confirmDialogModal) {
        elements.confirmDialogModal.classList.remove('active');
        document.body.style.overflow = '';
    }
    if (confirmDialogResolve) {
        confirmDialogResolve(result);
        confirmDialogResolve = null;
    }
}

/**
 * Mostra un dialog di input personalizzato (sostituisce prompt())
 * @param {string} message - Messaggio da mostrare
 * @param {string} title - Titolo del dialog (default: "Input")
 * @param {string} defaultValue - Valore di default (default: "")
 * @returns {Promise<string|null>} - Valore inserito o null se annullato
 */
function showPrompt(message, title = 'Input', defaultValue = '') {
    return new Promise((resolve) => {
        if (!elements.editFieldModal) {
            console.error('❌ editFieldModal non trovato');
            resolve(null);
            return;
        }

        // Imposta titolo e label
        if (elements.editFieldModalTitle) {
            elements.editFieldModalTitle.textContent = title;
        }
        if (elements.editFieldLabel) {
            elements.editFieldLabel.textContent = message;
        }
        if (elements.editFieldInput) {
            elements.editFieldInput.value = defaultValue;
            elements.editFieldInput.type = 'text';
        }

        // Memorizza il resolve
        promptDialogResolve = resolve;

        // Mostra modal
        elements.editFieldModal.classList.add('active');
        document.body.style.overflow = 'hidden';
        // Focus sull'input
        setTimeout(() => {
            if (elements.editFieldInput) {
                elements.editFieldInput.focus();
                elements.editFieldInput.select();
            }
        }, 100);
    });
}

/**
 * Chiude il dialog di input
 */
function closePromptDialog(result) {
    if (elements.editFieldModal) {
        elements.editFieldModal.classList.remove('active');
        document.body.style.overflow = '';
    }
    if (promptDialogResolve) {
        promptDialogResolve(result);
        promptDialogResolve = null;
    }
}

// ============================================================================
// CUSTOM DROPDOWN COMPONENT
// ============================================================================

window.openCustomDropdown = function(options, { selected, multi, title, onConfirm, onSelect }) {
    const existing = document.getElementById('customDropdownOverlay');
    if (existing) existing.remove();

    const selectedSet = new Set(Array.isArray(selected) ? selected : (selected ? [selected] : []));

    const overlay = document.createElement('div');
    overlay.id = 'customDropdownOverlay';
    overlay.className = 'custom-dd-overlay';

    const optionsHtml = options.map(opt => {
        const val = typeof opt === 'string' ? opt : opt.value;
        const label = typeof opt === 'string' ? opt : opt.label;
        const isSelected = selectedSet.has(val);
        if (multi) {
            return `<label class="custom-dd-option" data-value="${escapeHtml(val)}">
                <input type="checkbox" ${isSelected ? 'checked' : ''} value="${escapeHtml(val)}">
                <span>${escapeHtml(label)}</span>
            </label>`;
        }
        return `<div class="custom-dd-option ${isSelected ? 'active' : ''}" data-value="${escapeHtml(val)}">${escapeHtml(label)}</div>`;
    }).join('');

    overlay.innerHTML = `
        <div class="custom-dd-modal">
            <div class="custom-dd-header">
                <span class="custom-dd-title">${escapeHtml(title || 'Seleziona')}</span>
                <button class="custom-dd-close" onclick="closeCustomDropdown()">&times;</button>
            </div>
            <div class="custom-dd-options">${optionsHtml}</div>
            ${multi ? '<div class="custom-dd-footer"><button class="btn-primary btn-small custom-dd-confirm">Aggiungi</button></div>' : ''}
        </div>`;

    if (multi) {
        overlay.querySelector('.custom-dd-confirm').addEventListener('click', () => {
            const checked = [...overlay.querySelectorAll('.custom-dd-option input:checked')].map(cb => cb.value);
            closeCustomDropdown();
            if (onConfirm) onConfirm(checked);
        });
    } else {
        overlay.querySelectorAll('.custom-dd-option').forEach(el => {
            el.addEventListener('click', () => {
                closeCustomDropdown();
                if (onSelect) onSelect(el.dataset.value);
            });
        });
    }

    overlay.addEventListener('click', (e) => { if (e.target === overlay) closeCustomDropdown(); });
    document.body.appendChild(overlay);
}

window.closeCustomDropdown = function() {
    const overlay = document.getElementById('customDropdownOverlay');
    if (overlay) overlay.remove();
}

// ============================================================================
// CUSTOM SELECT COMPONENT
// ============================================================================

window.openCustomSelect = function(options, callback, title) {
    closeCustomSelect();
    window._customSelectOptions = options;
    window._customSelectCb = callback;
    const overlay = document.createElement('div');
    overlay.id = 'customSelectOverlay';
    overlay.className = 'custom-select-overlay';
    const listHtml = options.map((o, i) => {
        if (o.type === 'divider') return `<div class="custom-select-divider">${escapeHtml(o.label)}</div>`;
        return `<button type="button" class="custom-select-item" data-idx="${i}">${escapeHtml(o.label)}</button>`;
    }).join('');
    overlay.innerHTML = `
        <div class="custom-select-panel">
            <div class="custom-select-header">
                <span>${escapeHtml(title || 'Seleziona')}</span>
                <button class="custom-select-close" onclick="closeCustomSelect()">&times;</button>
            </div>
            <div class="custom-select-list">${listHtml}</div>
        </div>`;
    overlay.querySelector('.custom-select-list').addEventListener('click', (e) => {
        const btn = e.target.closest('.custom-select-item');
        if (btn) {
            const opt = window._customSelectOptions[parseInt(btn.dataset.idx)];
            if (opt && window._customSelectCb) window._customSelectCb(opt.value, opt.label);
            closeCustomSelect();
        }
    });
    overlay.addEventListener('click', (e) => { if (e.target === overlay) closeCustomSelect(); });
    document.body.appendChild(overlay);
}

window.openMultiSelect = function(options, currentSelected, callback, title) {
    closeCustomSelect();
    window._multiSelectState = new Set(currentSelected || []);
    window._multiSelectCb = callback;
    const overlay = document.createElement('div');
    overlay.id = 'customSelectOverlay';
    overlay.className = 'custom-select-overlay';
    overlay.innerHTML = `
        <div class="custom-select-panel">
            <div class="custom-select-header">
                <span>${escapeHtml(title || 'Seleziona')}</span>
                <button class="custom-select-close" onclick="closeCustomSelect()">&times;</button>
            </div>
            <div class="custom-select-list">
                ${options.map((o, i) => `
                <label class="custom-select-check-item">
                    <input type="checkbox" data-idx="${i}" ${window._multiSelectState.has(o.value) ? 'checked' : ''}>
                    <span>${escapeHtml(o.label)}</span>
                </label>`).join('')}
            </div>
            <div class="custom-select-footer">
                <button type="button" class="btn-primary btn-small" onclick="confirmMultiSelect()">Aggiungi</button>
            </div>
        </div>`;
    overlay.querySelectorAll('.custom-select-check-item input').forEach(cb => {
        cb.addEventListener('change', () => {
            const opt = options[parseInt(cb.dataset.idx)];
            if (cb.checked) window._multiSelectState.add(opt.value);
            else window._multiSelectState.delete(opt.value);
        });
    });
    overlay.addEventListener('click', (e) => { if (e.target === overlay) closeCustomSelect(); });
    document.body.appendChild(overlay);
}

window.confirmMultiSelect = function() {
    if (window._multiSelectCb) window._multiSelectCb([...window._multiSelectState]);
    closeCustomSelect();
}

window.closeCustomSelect = function() {
    const el = document.getElementById('customSelectOverlay');
    if (el) el.remove();
    window._customSelectCb = null;
    window._customSelectOptions = null;
    window._multiSelectCb = null;
    window._multiSelectState = null;
}

const DAMAGE_TYPES = [
    { value: 'acido', label: 'Acido' }, { value: 'contundente', label: 'Contundente' },
    { value: 'freddo', label: 'Freddo' }, { value: 'fulmine', label: 'Fulmine' },
    { value: 'fuoco', label: 'Fuoco' }, { value: 'forza', label: 'Forza' },
    { value: 'necrotico', label: 'Necrotico' }, { value: 'perforante', label: 'Perforante' },
    { value: 'psichico', label: 'Psichico' }, { value: 'radiante', label: 'Radiante' },
    { value: 'tagliente', label: 'Tagliente' }, { value: 'tuono', label: 'Tuono' },
    { value: 'veleno', label: 'Veleno' }
];
