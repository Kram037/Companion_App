(function() {
    const DICE_TYPES = [4, 6, 8, 10, 12, 20];
    const state = {
        dice: [{ sides: 20, value: 1 }],
        modifier: 0,
        dragging: false,
        startX: 0,
        startY: 0
    };

    function isDesktop() {
        return window.matchMedia?.('(min-width: 900px)').matches;
    }

    function rollDie(sides) {
        return Math.floor(Math.random() * sides) + 1;
    }

    function total() {
        return state.dice.reduce((sum, die) => sum + die.value, 0) + state.modifier;
    }

    function ensureDiceRoller() {
        if (!document.getElementById('diceRollerPanel')) {
            const panel = document.createElement('section');
            panel.id = 'diceRollerPanel';
            panel.className = 'dice-roller-panel';
            panel.setAttribute('aria-label', 'Tira dadi');
            panel.setAttribute('aria-hidden', 'true');
            panel.addEventListener('click', onPanelClick);
            panel.addEventListener('change', onPanelChange);
            document.body.appendChild(panel);
        }

        if (!document.getElementById('diceSidebarToggle')) {
            const button = document.createElement('button');
            button.type = 'button';
            button.id = 'diceSidebarToggle';
            button.className = 'dice-sidebar-toggle';
            button.setAttribute('aria-label', 'Apri tira dadi');
            button.title = 'Tira dadi';
            setSafeHtml(button, '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7"></path></svg>');
            button.addEventListener('click', (event) => {
                event.preventDefault();
                event.stopPropagation();
                toggleDiceRoller();
            });
            document.body.appendChild(button);
        }

        state.dice.forEach(die => {
            if (!die.value) die.value = rollDie(die.sides);
        });
        renderDiceRoller();
    }

    function renderDiceRoller() {
        const panel = document.getElementById('diceRollerPanel');
        if (!panel) return;
        setSafeHtml(panel, `
            <div class="dice-roller-shell">
                <div class="dice-roller-head">
                    <h2>Tira dadi</h2>
                    <button type="button" class="dice-close-btn" data-dice-close aria-label="Chiudi">x</button>
                </div>
                <div class="dice-stage" aria-live="polite">
                    ${state.dice.map((die, index) => `
                        <button type="button" class="dice-face dice-d${die.sides}" data-dice-remove="${index}" title="Rimuovi d${die.sides}">
                            <span>${die.value}</span>
                        </button>
                    `).join('')}
                </div>
                <div class="dice-total">
                    <span>Totale</span>
                    <strong>${total()}</strong>
                </div>
                <div class="dice-type-row">
                    ${DICE_TYPES.map(sides => `
                        <button type="button" class="dice-type dice-d${sides}" data-dice-add="${sides}" aria-label="Aggiungi d${sides}">
                            <span>${sides}</span>
                        </button>
                    `).join('')}
                </div>
                <div class="dice-actions">
                    <label class="dice-modifier">
                        <span>Mod.</span>
                        <input type="number" value="${state.modifier}" min="-99" max="99" step="1" data-dice-modifier>
                    </label>
                    <button type="button" class="dice-roll-btn" data-dice-roll>Roll</button>
                </div>
            </div>
        `);
    }

    function onPanelClick(event) {
        const close = event.target.closest('[data-dice-close]');
        if (close) {
            closeDiceRoller();
            return;
        }

        const add = event.target.closest('[data-dice-add]');
        if (add) {
            const sides = parseInt(add.dataset.diceAdd, 10);
            state.dice.push({ sides, value: rollDie(sides) });
            renderDiceRoller();
            return;
        }

        const remove = event.target.closest('[data-dice-remove]');
        if (remove) {
            state.dice.splice(parseInt(remove.dataset.diceRemove, 10), 1);
            renderDiceRoller();
            return;
        }

        if (event.target.closest('[data-dice-roll]')) {
            rollAllDice();
            return;
        }

    }

    function onPanelChange(event) {
        if (!event.target.matches('[data-dice-modifier]')) return;
        state.modifier = parseInt(event.target.value, 10) || 0;
        renderDiceRoller();
    }

    function rollAllDice() {
        const panel = document.getElementById('diceRollerPanel');
        panel?.classList.add('is-rolling');
        window.setTimeout(() => {
            state.dice = state.dice.map(die => ({ ...die, value: rollDie(die.sides) }));
            panel?.classList.remove('is-rolling');
            renderDiceRoller();
        }, 220);
    }

    function openDiceRoller() {
        ensureDiceRoller();
        document.body.classList.toggle('dice-desktop-open', isDesktop());
        document.body.classList.toggle('dice-mobile-open', !isDesktop());
        document.getElementById('diceRollerPanel')?.setAttribute('aria-hidden', 'false');
    }

    function closeDiceRoller() {
        document.body.classList.remove('dice-desktop-open', 'dice-mobile-open');
        document.getElementById('diceRollerPanel')?.setAttribute('aria-hidden', 'true');
    }

    function toggleDiceRoller() {
        if (document.body.classList.contains('dice-desktop-open') || document.body.classList.contains('dice-mobile-open')) {
            closeDiceRoller();
        } else {
            openDiceRoller();
        }
    }

    function bindMobileLogoDrag() {
        const logo = document.getElementById('d20Logo');
        if (!logo || logo.dataset.diceDragBound === '1') return;
        logo.dataset.diceDragBound = '1';

        const beginDrag = (clientX, clientY) => {
            if (isDesktop()) return;
            state.dragging = true;
            state.startX = clientX;
            state.startY = clientY;
        };

        const moveDrag = (clientX, clientY) => {
            if (!state.dragging || isDesktop()) return;
            const dx = Math.abs(clientX - state.startX);
            const dy = clientY - state.startY;
            if (dy > 46 && dx < 90) {
                state.dragging = false;
                openDiceRoller();
            }
        };

        logo.addEventListener('pointerdown', (event) => {
            beginDrag(event.clientX, event.clientY);
        }, { passive: true });

        logo.addEventListener('pointermove', (event) => {
            moveDrag(event.clientX, event.clientY);
        }, { passive: true });

        logo.addEventListener('pointerup', () => { state.dragging = false; }, { passive: true });
        logo.addEventListener('pointercancel', () => { state.dragging = false; }, { passive: true });

        logo.addEventListener('touchstart', (event) => {
            const touch = event.touches[0];
            if (touch) beginDrag(touch.clientX, touch.clientY);
        }, { passive: true });

        logo.addEventListener('touchmove', (event) => {
            const touch = event.touches[0];
            if (touch) moveDrag(touch.clientX, touch.clientY);
        }, { passive: true });

        logo.addEventListener('touchend', () => { state.dragging = false; }, { passive: true });
        logo.addEventListener('touchcancel', () => { state.dragging = false; }, { passive: true });
    }

    window.openDiceRoller = openDiceRoller;
    window.closeDiceRoller = closeDiceRoller;
    window.toggleDiceRoller = toggleDiceRoller;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            ensureDiceRoller();
            bindMobileLogoDrag();
        });
    } else {
        ensureDiceRoller();
        bindMobileLogoDrag();
    }
})();
