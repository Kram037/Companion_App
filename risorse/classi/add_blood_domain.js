// Script idempotente per aggiungere la sottoclasse del Chierico
// "Dominio del Sangue" (Blood Domain).
//
// Aggiorna:
//   - risorse/classi/extra_classes.json (sorgente)
//   - js/data/classes_data.js (file generato consumato dal browser)
//
// Uso:  node risorse/classi/add_blood_domain.js

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const EXTRA = path.join(ROOT, 'risorse', 'classi', 'extra_classes.json');
const GENERATED = path.join(ROOT, 'js', 'data', 'classes_data.js');

const BLOOD_DOMAIN = {
    slug: 'blood-domain',
    name_en: 'Blood Domain',
    name: 'Dominio del Sangue',
    features: [
        {
            name_en: 'Blood Domain Spells',
            name: 'Incantesimi del Dominio del Sangue',
            level: 1,
            description_en: "You gain domain spells at the cleric levels listed in the Blood Domain Spells table. See the Divine Domain class feature for how domain spells work.\n\n1st: Sleep, Ray of Sickness\n3rd: Ray of Enfeeblement, Crown of Madness\n5th: Haste, Slow\n7th: Blight, Stoneskin\n9th: Dominate Person, Hold Monster",
            description: "Ottieni gli incantesimi di dominio ai livelli da Chierico indicati nella tabella degli Incantesimi del Dominio del Sangue. Vedi il privilegio Dominio Divino per il funzionamento degli incantesimi di dominio.\n\n**1° livello:** Sonno, Raggio della Malattia\n**3° livello:** Raggio Indebolente, Corona di Follia\n**5° livello:** Velocità, Rallentare\n**7° livello:** Inaridire, Pelle di Pietra\n**9° livello:** Dominare Persona, Bloccare Mostri",
            translated: true,
        },
        {
            name_en: 'Bonus Proficiency',
            name: 'Competenza Bonus',
            level: 1,
            description_en: "At 1st level, you gain proficiency with martial weapons.",
            description: "Al 1° livello ottieni la competenza nelle armi da guerra.",
            translated: true,
        },
        {
            name_en: 'Bloodletting Focus',
            name: 'Focus del Salasso',
            level: 1,
            description_en: "From 1st level, your divine magics draw the blood from inflicted wounds, worsening the agony of your nearby foes. When you use a spell of 1st level or higher to inflict damage to any creatures that have blood, those creatures suffer additional necrotic damage equal to 2 + the spell's level.",
            description: "Dal 1° livello, le tue magie divine richiamano il sangue dalle ferite inflitte, aumentando l'agonia dei tuoi nemici nelle vicinanze. Quando usi un incantesimo di 1° livello o superiore per infliggere danni a creature che hanno sangue, quelle creature subiscono danni necrotici aggiuntivi pari a 2 + il livello dell'incantesimo.",
            translated: true,
        },
        {
            name_en: "Channel Divinity: Blood Puppet",
            name: "Incanalare Divinità: Marionetta di Sangue",
            level: 2,
            description_en: "Starting at 2nd level, you can use your Channel Divinity to briefly control a creature's actions against their will.\n\nAs an action, you target a Large or smaller creature that has blood within 60 feet of you. That creature must succeed on a Constitution saving throw against your spell save DC or immediately move up to half of their movement in any direction of your choice and make a single weapon attack against a creature of your choice within range. Dead or unconscious creatures automatically fail their saving throw. At 8th level, you can target a Huge or smaller creature.",
            description: "Dal 2° livello, puoi usare il tuo Incanalare Divinità per controllare brevemente le azioni di una creatura contro la sua volontà.\n\nCon un'azione, scegli come bersaglio una creatura di taglia Grande o inferiore che abbia sangue entro 18 metri (60 piedi) da te. Quella creatura deve riuscire in un tiro salvezza su Costituzione contro la tua CD del tiro salvezza dell'incantesimo, altrimenti si muove immediatamente fino a metà del proprio movimento in una direzione a tua scelta ed effettua un singolo attacco con un'arma contro una creatura a tua scelta entro la sua portata. Le creature morte o incoscienti falliscono automaticamente il tiro salvezza. All'8° livello, puoi bersagliare una creatura di taglia Enorme o inferiore.",
            translated: true,
        },
        {
            name_en: "Channel Divinity: Crimson Bond",
            name: "Incanalare Divinità: Legame Cremisi",
            level: 6,
            description_en: "Starting at 6th level, you can use your Channel Divinity to focus on a sample of blood from a creature that is at least 2 ounces, and that has been spilt no longer than a week ago.\n\nAs an action, you can focus on the blood of the creature to form a bond and gain information about their current circumstances. You know their approximate distance and direction from you, as well as their general state of health, as long as they are within 10 miles of you. You can maintain this effect as though you were concentrating on a spell for up to 1 hour.\n\nDuring your bond, you can spend an action to attempt to connect with the bonded creature's senses. The target makes a Constitution saving throw against your spell save DC. If they succeed, the connection is resisted, ending the bond. You suffer 2d6 necrotic damage. Upon a failed saving throw, you can choose to either see through the eyes of or hear through their ears of the target for a number of rounds equal to your Wisdom modifier (minimum of 1). During this time, you are blind or deaf (respectively) with regard to your own senses.\n\nOnce this connection ends, the Crimson Bond is lost.",
            description: "Dal 6° livello, puoi usare il tuo Incanalare Divinità per concentrarti su un campione di sangue di una creatura di almeno 60 grammi (2 once), versato non più di una settimana fa.\n\nCon un'azione, puoi concentrarti sul sangue della creatura per formare un legame e ottenere informazioni sulle sue circostanze attuali. Conosci la sua distanza e direzione approssimative da te, così come il suo generale stato di salute, finché si trova entro 16 km (10 miglia) da te. Puoi mantenere questo effetto come se stessi concentrando su un incantesimo per un massimo di 1 ora.\n\nDurante il legame, puoi spendere un'azione per tentare di connetterti ai sensi della creatura legata. Il bersaglio effettua un tiro salvezza su Costituzione contro la tua CD del tiro salvezza dell'incantesimo. Se ha successo, la connessione viene resistita e il legame termina. Tu subisci 2d6 danni necrotici. In caso di fallimento del tiro salvezza, puoi scegliere se vedere attraverso gli occhi o sentire attraverso le orecchie del bersaglio per un numero di round pari al tuo modificatore di Saggezza (minimo 1). Durante questo tempo, sei cieco o sordo (rispettivamente) per quanto riguarda i tuoi stessi sensi.\n\nUna volta terminata questa connessione, il Legame Cremisi viene perso.",
            translated: true,
        },
        {
            name_en: 'Sanguine Recall',
            name: 'Richiamo Sanguigno',
            level: 8,
            description_en: "At 8th level, you can sacrifice a portion of your own vitality to recover expended spell slots. As an action, you recover spell slots that have a combined level equal to or less than half of your cleric level (rounded up), and none of the slots can be 6th level or higher. You immediately suffer 1d6 necrotic damage per spell slot level recovered. You can't use this feature again until you finish a long rest.\n\nFor example, if you are an 8th-level cleric, you can recover up to four levels of spell slots. You can recover a single 4th-level spell slot, two 2nd-level spell slots, a 3rd-level spell slot and a 1st level spell slot, or four 1st-level spell slots. You then suffer 4d6 damage.",
            description: "All'8° livello, puoi sacrificare una porzione della tua vitalità per recuperare slot incantesimo consumati. Con un'azione, recuperi slot incantesimo che hanno un livello combinato pari o inferiore alla metà del tuo livello da Chierico (arrotondato per eccesso), e nessuno degli slot può essere di 6° livello o superiore. Subisci immediatamente 1d6 danni necrotici per ogni livello di slot incantesimo recuperato. Non puoi usare di nuovo questo privilegio finché non termini un riposo lungo.\n\nPer esempio, se sei un Chierico di 8° livello, puoi recuperare fino a quattro livelli di slot incantesimo. Puoi recuperare un singolo slot di 4° livello, due slot di 2° livello, uno slot di 3° livello e uno slot di 1° livello, o quattro slot di 1° livello. Subisci poi 4d6 danni.",
            translated: true,
        },
        {
            name_en: 'Vascular Corruption Aura',
            name: 'Aura di Corruzione Vascolare',
            level: 17,
            description_en: "At 17th level, as an action, you can emit a powerful aura that extends 30 feet out from you. This aura pulses necrotic energy through the veins of nearby foes, causing them to burst and bleed.\n\nFor 1 minute, any enemy creatures with blood that begin their turn within the aura or enter it for the first time on their turn immediately suffer 2d6 necrotic damage. Any enemy creature with blood that would regain hit points while within the aura only regains half of the intended number of hit points (rounded up).\n\nOnce you use this feature, you can't use it again until you finish a long rest.",
            description: "Al 17° livello, con un'azione, puoi emanare una potente aura che si estende per 9 metri (30 piedi) intorno a te. Quest'aura pulsa energia necrotica attraverso le vene dei nemici vicini, facendoli scoppiare e sanguinare.\n\nPer 1 minuto, qualsiasi creatura nemica con sangue che inizia il proprio turno all'interno dell'aura o vi entra per la prima volta nel proprio turno subisce immediatamente 2d6 danni necrotici. Qualsiasi creatura nemica con sangue che dovrebbe recuperare punti ferita mentre si trova all'interno dell'aura recupera solo metà del numero di punti ferita previsti (arrotondato per eccesso).\n\nUna volta usato questo privilegio, non puoi usarlo di nuovo finché non termini un riposo lungo.",
            translated: true,
        },
    ],
};

function upsertSubclass(arr, sub) {
    const i = arr.findIndex(s => s.slug === sub.slug);
    if (i >= 0) { arr[i] = sub; return 'updated'; }
    arr.push(sub);
    return 'added';
}

function updateExtraJson() {
    const j = JSON.parse(fs.readFileSync(EXTRA, 'utf8'));
    j.extra_subclasses ||= {};
    j.extra_subclasses.cleric ||= [];
    const r = upsertSubclass(j.extra_subclasses.cleric, BLOOD_DOMAIN);
    fs.writeFileSync(EXTRA, JSON.stringify(j, null, 2) + '\n', 'utf8');
    console.log(`[extra_classes.json] blood-domain: ${r}`);
}

function updateGenerated() {
    const txt = fs.readFileSync(GENERATED, 'utf8');
    const eqIdx = txt.indexOf('=');
    const headerComment = txt.slice(0, txt.indexOf('window.CLASSES_DATA'));
    const arrText = txt.slice(eqIdx + 1).replace(/;\s*$/, '').trim();
    const data = JSON.parse(arrText);

    const cls = data.find(c => c.slug === 'cleric');
    if (!cls) { console.warn("Classe 'cleric' non trovata"); return; }
    cls.subclasses ||= [];
    const r = upsertSubclass(cls.subclasses, BLOOD_DOMAIN);
    const out = headerComment + 'window.CLASSES_DATA = ' + JSON.stringify(data) + ';\n';
    fs.writeFileSync(GENERATED, out, 'utf8');
    console.log(`[classes_data.js] blood-domain: ${r}`);
}

updateExtraJson();
updateGenerated();
console.log('Done.');
