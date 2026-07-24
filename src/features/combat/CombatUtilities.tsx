import { useEffect, useMemo, useState } from 'react';

const DICE = [4, 6, 8, 10, 12, 20] as const;
type Operator = '+' | '-' | '*' | '/';

export type CalculatorState = {
  display: string;
  stored: number | null;
  operator: Operator | null;
  replace: boolean;
};

const EMPTY_CALCULATOR: CalculatorState = { display: '0', stored: null, operator: null, replace: true };

export function calculatorPress(state: CalculatorState, key: string): CalculatorState {
  if (key === 'C') return EMPTY_CALCULATOR;
  if (/^\d$/.test(key)) {
    return { ...state, display: state.replace || state.display === 'Err' ? key : `${state.display}${key}`, replace: false };
  }
  if (key === '.') {
    if (!state.replace && state.display.includes('.')) return state;
    return { ...state, display: state.replace ? '0.' : `${state.display}.`, replace: false };
  }

  const current = Number(state.display);
  if (!Number.isFinite(current)) return EMPTY_CALCULATOR;
  if (key === '=') {
    if (state.stored == null || !state.operator) return state;
    return resultState(calculate(state.stored, current, state.operator));
  }
  if (!isOperator(key)) return state;

  const value = state.stored != null && state.operator && !state.replace
    ? calculate(state.stored, current, state.operator)
    : current;
  if (!Number.isFinite(value)) return resultState(value);
  return { display: formatNumber(value), stored: value, operator: key, replace: true };
}

export function CombatUtilities({ mode, onClose }: { mode: 'dice' | 'calculator' | null; onClose: () => void }) {
  useEffect(() => {
    if (!mode) return;
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, [mode, onClose]);

  if (!mode) return null;
  return <div id={mode === 'calculator' ? 'hpCalcOverlay' : 'combatDiceOverlay'} className="hp-calc-overlay" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
    {mode === 'dice' ? <DicePanel onClose={onClose} /> : <CalculatorPanel onClose={onClose} />}
  </div>;
}

function DicePanel({ onClose }: { onClose: () => void }) {
  const [dice, setDice] = useState([{ sides: 20, value: rollDie(20) }]);
  const [modifier, setModifier] = useState(0);
  const total = useMemo(() => dice.reduce((sum, die) => sum + die.value, modifier), [dice, modifier]);

  return <section className="hp-calc-modal combat-dice-modal" role="dialog" aria-modal="true" aria-labelledby="combat-dice-title">
    <button className="hp-calc-close" type="button" onClick={onClose} aria-label="Chiudi">×</button>
    <div className="hp-calc-title" id="combat-dice-title">Tira dadi</div>
    <div className="dice-stage" aria-live="polite">
      {dice.length ? dice.map((die, index) => <button type="button" className={`dice-face dice-d${die.sides}`} key={`${die.sides}-${index}`} title={`Rimuovi d${die.sides}`} onClick={() => setDice(current => current.filter((_, itemIndex) => itemIndex !== index))}><span>{die.value}</span></button>) : <span className="content-placeholder">Aggiungi un dado</span>}
    </div>
    <div className="dice-total"><span>Totale</span><strong>{total}</strong></div>
    <div className="dice-type-row">{DICE.map(sides => <button type="button" className={`dice-type dice-d${sides}`} key={sides} onClick={() => setDice(current => [...current, { sides, value: rollDie(sides) }])} aria-label={`Aggiungi d${sides}`}><span>{sides}</span></button>)}</div>
    <div className="dice-actions">
      <label className="dice-modifier"><span>Mod.</span><input type="number" min="-99" max="99" value={modifier} onChange={event => setModifier(Number(event.target.value) || 0)} /></label>
      <button className="dice-roll-btn" type="button" disabled={!dice.length} onClick={() => setDice(current => current.map(die => ({ ...die, value: rollDie(die.sides) })))}>Roll</button>
    </div>
  </section>;
}

function CalculatorPanel({ onClose }: { onClose: () => void }) {
  const [state, setState] = useState(EMPTY_CALCULATOR);
  return <section className="hp-calc-modal" role="dialog" aria-modal="true" aria-labelledby="combat-calculator-title">
    <button className="hp-calc-close" type="button" onClick={onClose} aria-label="Chiudi">×</button>
    <div className="hp-calc-title" id="combat-calculator-title">Calcolatrice</div>
    <output className="hp-calc-input-display" aria-live="polite">{state.display}</output>
    <div className="combat-calculator-grid">
      {['7', '8', '9', '/', '4', '5', '6', '*', '1', '2', '3', '-', '0', '.', '=', '+'].map(key => <button className={`hp-calc-btn ${key === '=' ? 'heal' : 'neutral'}`} type="button" key={key} onClick={() => setState(current => calculatorPress(current, key))}>{key}</button>)}
    </div>
    <button className="hp-calc-btn neutral hp-calc-btn-full" type="button" onClick={() => setState(EMPTY_CALCULATOR)}>C</button>
  </section>;
}

function calculate(left: number, right: number, operator: Operator) {
  if (operator === '+') return left + right;
  if (operator === '-') return left - right;
  if (operator === '*') return left * right;
  return right === 0 ? Number.NaN : left / right;
}

function resultState(value: number): CalculatorState {
  return { display: Number.isFinite(value) ? formatNumber(value) : 'Err', stored: null, operator: null, replace: true };
}

function formatNumber(value: number) { return String(Number(value.toFixed(10))); }
function isOperator(key: string): key is Operator { return key === '+' || key === '-' || key === '*' || key === '/'; }
function rollDie(sides: number) { return Math.floor(Math.random() * sides) + 1; }
