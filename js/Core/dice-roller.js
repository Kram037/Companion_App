(function() {
    const DICE_TYPES = [4, 6, 8, 10, 12, 20];
    const state = {
        dice: [{ sides: 20, value: 1 }],
        modifier: 0
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
        document.getElementById('d20Logo')?.setAttribute('aria-label', 'Chiudi tira dadi');
        document.getElementById('d20Logo')?.setAttribute('aria-expanded', 'true');
    }

    function closeDiceRoller() {
        document.body.classList.remove('dice-desktop-open', 'dice-mobile-open');
        document.getElementById('diceRollerPanel')?.setAttribute('aria-hidden', 'true');
        document.getElementById('d20Logo')?.setAttribute('aria-label', 'Apri tira dadi');
        document.getElementById('d20Logo')?.setAttribute('aria-expanded', 'false');
    }

    function toggleDiceRoller() {
        if (document.body.classList.contains('dice-desktop-open') || document.body.classList.contains('dice-mobile-open')) {
            closeDiceRoller();
        } else {
            openDiceRoller();
        }
    }

    window.openDiceRoller = openDiceRoller;
    window.closeDiceRoller = closeDiceRoller;
    window.toggleDiceRoller = toggleDiceRoller;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            ensureDiceRoller();
        });
    } else {
        ensureDiceRoller();
    }
})();
