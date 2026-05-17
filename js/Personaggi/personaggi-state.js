// ============================================================================
// PERSONAGGI STATE
// ============================================================================

let editingPersonaggioId = null;
let pgWizardCurrentStep = 0;
let pgSelectedClasses = [];
let pgSelectedEquipment = [];
let _pgRaceSkills = [];
let _pgBgSkills = [];
// Strumenti e linguaggi auto-popolati dal background, per poterli rimuovere
// se l'utente cambia bg.
let _pgBgTools = [];
let _pgBgLangs = [];
// Linguaggi/strumenti aggiunti tramite background (set, di soli "fissi").
let pgCurrentBgLanguages = new Set();
let pgCurrentBgTools = new Set();
let _pgRaceResistances = [];
