// Gestione lingua globale dell'app (IT/EN).
// Centralizza la scelta di lingua per incantesimi, privilegi e altri contenuti
// con doppia versione (italiano/inglese). Persistita in localStorage.appLang
// e sincronizzata con localStorage.spellLang per retrocompatibilita'.

const APP_LANG_STORAGE_KEY = 'appLang';
const APP_LANG_LEGACY_KEY = 'spellLang';

function getAppLang() {
    try {
        const v = localStorage.getItem(APP_LANG_STORAGE_KEY);
        if (v === 'en' || v === 'it') return v;
        const legacy = localStorage.getItem(APP_LANG_LEGACY_KEY);
        if (legacy === 'en' || legacy === 'it') return legacy;
    } catch {}
    return 'it';
}

function loadAppLang() {
    const lang = getAppLang();
    setAppLang(lang, false);
}

function setAppLang(lang, save = true) {
    const normalized = lang === 'en' ? 'en' : 'it';
    if (save) {
        try {
            localStorage.setItem(APP_LANG_STORAGE_KEY, normalized);
            // Mantieni compatibilita' con codice esistente che leggeva spellLang.
            localStorage.setItem(APP_LANG_LEGACY_KEY, normalized);
        } catch {}
    }

    document.documentElement.setAttribute('data-app-lang', normalized);

    if (typeof elements !== 'undefined') {
        if (elements.langIt) {
            elements.langIt.classList.toggle('active', normalized === 'it');
        }
        if (elements.langEn) {
            elements.langEn.classList.toggle('active', normalized === 'en');
        }
    }

    try {
        document.dispatchEvent(new CustomEvent('appLangChanged', { detail: { lang: normalized } }));
    } catch {}
}

window.getAppLang = getAppLang;
window.setAppLang = setAppLang;
window.loadAppLang = loadAppLang;
