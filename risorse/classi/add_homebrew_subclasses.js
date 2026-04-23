// Script idempotente per aggiungere due sottoclassi al dataset:
//   - Guerriero "Pistolero" (Gunslinger di Matt Mercer)
//   - Bardo "Collegio della Danza" (College of Dance, D&D 2024)
//
// Aggiorna sia risorse/classi/extra_classes.json (documentazione) sia
// il file gia' generato js/data/classes_data.js (consumato dal browser).
//
// Uso:  node risorse/classi/add_homebrew_subclasses.js

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const EXTRA = path.join(ROOT, 'risorse', 'classi', 'extra_classes.json');
const GENERATED = path.join(ROOT, 'js', 'data', 'classes_data.js');

// ── Definizione delle due sottoclassi ────────────────────────────────
const GUNSLINGER = {
    slug: 'gunslinger',
    name_en: 'Gunslinger',
    name: 'Pistolero',
    features: [
        {
            name_en: 'Firearm Proficiency',
            name: 'Competenza nelle Armi da Fuoco',
            level: 3,
            description_en: "Starting when you choose this archetype at 3rd level, you gain proficiency with firearms, allowing you to add your proficiency bonus to attacks made with firearms.",
            description: "Quando scegli questo archetipo al 3° livello, ottieni competenza nelle armi da fuoco, il che ti permette di aggiungere il tuo bonus di competenza agli attacchi effettuati con armi da fuoco.",
            translated: true,
        },
        {
            name_en: 'Gunsmith',
            name: 'Armaiolo',
            level: 3,
            description_en: "Upon choosing this archetype at 3rd level, you gain proficiency with Tinker's Tools. You may use them to craft ammunition at half the cost, repair damaged firearms, or even draft and create new ones (DM's discretion). Some extremely experimental and intricate firearms are only available through crafting.",
            description: "Quando scegli questo archetipo al 3° livello, ottieni competenza negli Attrezzi da Inventore. Puoi usarli per fabbricare munizioni a metà del costo, riparare armi da fuoco danneggiate o persino progettarne e crearne di nuove (a discrezione del DM). Alcune armi da fuoco estremamente sperimentali e complesse sono ottenibili solo tramite fabbricazione.",
            translated: true,
        },
        {
            name_en: 'Adept Marksman',
            name: 'Tiratore Esperto',
            level: 3,
            description_en: "When you choose this archetype at 3rd level, you learn to perform powerful Trick Shots to disable or damage your opponents using your firearms.\n\nTrick Shots. You learn two trick shots of your choice. Many maneuvers enhance an attack in some way. Each use of a trick shot must be declared before the attack roll is made. You can use only one trick shot per attack. You learn an additional trick shot of your choice at 7th, 10th, 15th, and 18th level. Each time you learn a new trick shot, you can also replace one trick shot you know with a different one.\n\nGrit. You gain a number of grit points equal to your Wisdom modifier (minimum of 1). You regain 1 expended grit point each time you roll a 20 on the d20 roll for an attack with a firearm, or deal a killing blow with a firearm to a creature of significant threat (DM's discretion). You regain all expended grit points after a short or long rest.\n\nSaving Throws. Some of your trick shots require your targets to make a saving throw to resist the trick shot's effects. The saving throw DC is calculated as follows: Trick shot save DC = 8 + your proficiency bonus + your Dexterity modifier.",
            description: "Quando scegli questo archetipo al 3° livello, impari a effettuare potenti **Tiri Speciali** (Trick Shots) per disabilitare o danneggiare i tuoi avversari con le tue armi da fuoco.\n\n**Tiri Speciali.** Impari due tiri speciali a tua scelta. Molte manovre potenziano un attacco in qualche modo. Ogni uso di un tiro speciale deve essere dichiarato prima del tiro per colpire. Puoi usare un solo tiro speciale per attacco. Impari un tiro speciale aggiuntivo a tua scelta al 7°, 10°, 15° e 18° livello. Ogni volta che impari un nuovo tiro speciale, puoi anche sostituirne uno che conosci con uno diverso.\n\n**Grinta (Grit).** Ottieni un numero di punti grinta pari al tuo modificatore di Saggezza (minimo 1). Recuperi 1 punto grinta speso ogni volta che ottieni un 20 naturale sul d20 per un tiro per colpire con un'arma da fuoco, o quando infliggi il colpo di grazia con un'arma da fuoco a una creatura di rilievo (a discrezione del DM). Recuperi tutti i punti grinta spesi al termine di un riposo breve o lungo.\n\n**Tiri Salvezza.** Alcuni dei tuoi tiri speciali richiedono che i bersagli effettuino un tiro salvezza per resistere agli effetti. La CD è calcolata così: CD del tiro speciale = 8 + il tuo bonus di competenza + il tuo modificatore di Destrezza.",
            translated: true,
        },
        {
            name_en: 'Quickdraw',
            name: 'Estrazione Rapida',
            level: 7,
            description_en: "When you reach 7th level, you add your proficiency bonus to your initiative. You can also stow a firearm, then draw another firearm as a single object interaction on your turn.",
            description: "Al 7° livello, aggiungi il tuo bonus di competenza all'iniziativa. Inoltre puoi riporre un'arma da fuoco e poi estrarne un'altra come una singola interazione con oggetti durante il tuo turno.",
            translated: true,
        },
        {
            name_en: 'Rapid Repair',
            name: 'Riparazione Rapida',
            level: 10,
            description_en: "Upon reaching 10th level, you learn how to quickly attempt to fix a jammed gun. You can spend a grit point to attempt to repair a misfired (but not broken) firearm as a bonus action.",
            description: "Al 10° livello, impari a riparare velocemente un'arma da fuoco inceppata. Puoi spendere un punto grinta per tentare di riparare un'arma da fuoco inceppata (ma non rotta) come azione bonus.",
            translated: true,
        },
        {
            name_en: 'Lightning Reload',
            name: 'Ricarica Fulminea',
            level: 15,
            description_en: "Starting at 15th level, you can reload any firearm as a bonus action.",
            description: "A partire dal 15° livello, puoi ricaricare qualsiasi arma da fuoco come azione bonus.",
            translated: true,
        },
        {
            name_en: 'Vicious Intent',
            name: 'Intento Spietato',
            level: 18,
            description_en: "At 18th level, your firearm attacks score a critical hit on a roll of 19-20, and you regain a grit point on a roll of 19 or 20 on a d20 attack roll.",
            description: "Al 18° livello, i tuoi attacchi con armi da fuoco infliggono un colpo critico con un tiro di 19-20, e recuperi un punto grinta con un tiro di 19 o 20 sul d20 per un tiro per colpire.",
            translated: true,
        },
        {
            name_en: 'Hemorrhaging Critical',
            name: 'Critico Emorragico',
            level: 18,
            description_en: "Upon reaching 18th level, whenever you score a critical hit on an attack with a firearm, the target additionally suffers half of the damage from the attack at the end of its next turn.",
            description: "Al 18° livello, ogni volta che ottieni un colpo critico con un attacco con un'arma da fuoco, il bersaglio subisce inoltre metà dei danni dell'attacco al termine del suo turno successivo.",
            translated: true,
        },
    ],
};

const COLLEGE_OF_DANCE = {
    slug: 'college-of-dance',
    name_en: 'College of Dance',
    name: 'Collegio della Danza',
    features: [
        {
            name_en: 'Dazzling Footwork',
            name: 'Passi Abbaglianti',
            level: 3,
            description_en: "While you aren't wearing armor or wielding a Shield, you gain the following benefits.\n\nDance Virtuoso. You have Advantage on any Charisma (Performance) check you make that involves you dancing.\n\nUnarmored Defense. Your base Armor Class equals 10 plus your Dexterity and Charisma modifiers.\n\nAgile Strikes. When you expend a use of your Bardic Inspiration as part of an action, a Bonus Action, or a Reaction, you can make one Unarmed Strike as part of that action, Bonus Action, or Reaction.\n\nBardic Damage. You can use Dexterity instead of Strength for the attack rolls of your Unarmed Strikes. When you deal damage with an Unarmed Strike, you can deal Bludgeoning damage equal to a roll of your Bardic Inspiration die plus your Dexterity modifier, instead of the strike's normal damage. This roll doesn't expend the die.",
            description: "Quando non indossi un'armatura e non impugni uno scudo, ottieni i seguenti benefici.\n\n**Virtuoso della Danza.** Hai vantaggio su qualsiasi prova di Carisma (Intrattenere) che effettui che coinvolga la danza.\n\n**Difesa senza Armatura.** La tua Classe Armatura di base è pari a 10 + il tuo modificatore di Destrezza + il tuo modificatore di Carisma.\n\n**Colpi Agili.** Quando spendi un uso della tua Ispirazione Bardica come parte di un'azione, un'azione bonus o una reazione, puoi effettuare un Colpo Senz'Armi come parte di quella stessa azione, azione bonus o reazione.\n\n**Danno Bardico.** Puoi usare Destrezza al posto di Forza per i tiri per colpire dei tuoi Colpi Senz'Armi. Quando infliggi danni con un Colpo Senz'Armi, puoi infliggere danni Contundenti pari al risultato del tiro del tuo dado di Ispirazione Bardica + il tuo modificatore di Destrezza, al posto dei danni normali del colpo. Questo tiro non consuma il dado.",
            translated: true,
        },
        {
            name_en: 'Inspiring Movement',
            name: 'Movimento Ispiratore',
            level: 6,
            description_en: "When an enemy you can see ends its turn within 5 feet of you, you can take a Reaction and expend one use of your Bardic Inspiration to move up to half your Speed. Then one ally of your choice within 30 feet of you can also move up to half their Speed using their Reaction.\n\nNone of this feature's movement provokes Opportunity Attacks.",
            description: "Quando un nemico che puoi vedere termina il suo turno entro 1,5 metri (5 piedi) da te, puoi usare la tua reazione e spendere un uso della tua Ispirazione Bardica per muoverti fino a metà della tua Velocità. Poi un alleato a tua scelta entro 9 metri (30 piedi) da te può anch'esso muoversi fino a metà della propria Velocità usando la propria reazione.\n\nNessuno dei movimenti concessi da questo privilegio provoca attacchi di opportunità.",
            translated: true,
        },
        {
            name_en: 'Tandem Footwork',
            name: 'Passo a Due',
            level: 6,
            description_en: "When you roll Initiative, you can expend one use of your Bardic Inspiration if you don't have the Incapacitated condition. When you do so, roll your Bardic Inspiration die; you and each ally within 30 feet of you who can see or hear you gains a bonus to Initiative equal to the number rolled.",
            description: "Quando tiri l'iniziativa, puoi spendere un uso della tua Ispirazione Bardica se non hai la condizione Incapacitato. Quando lo fai, tira il tuo dado di Ispirazione Bardica; tu e ogni alleato entro 9 metri (30 piedi) da te che possa vederti o sentirti ottiene un bonus all'iniziativa pari al risultato del tiro.",
            translated: true,
        },
        {
            name_en: 'Leading Evasion',
            name: 'Evasione Trascinante',
            level: 14,
            description_en: "When you are subjected to an effect that allows you to make a Dexterity saving throw to take only half damage, you instead take no damage if you succeed on the saving throw and only half damage if you fail. If any creatures within 5 feet of you are making the same Dexterity saving throw, you can share this benefit with them for that save.\n\nYou can't use this feature if you have the Incapacitated condition.",
            description: "Quando sei soggetto a un effetto che ti permette di effettuare un tiro salvezza su Destrezza per subire solo metà danni, invece non subisci alcun danno se riesci nel tiro salvezza e subisci solo metà danni se fallisci. Se altre creature entro 1,5 metri (5 piedi) da te stanno effettuando lo stesso tiro salvezza su Destrezza, puoi condividere questo beneficio con loro per quel tiro.\n\nNon puoi usare questo privilegio se hai la condizione Incapacitato.",
            translated: true,
        },
    ],
};

// ── Helpers ──────────────────────────────────────────────────────────
function upsertSubclass(arr, sub) {
    const i = arr.findIndex(s => s.slug === sub.slug);
    if (i >= 0) { arr[i] = sub; return 'updated'; }
    arr.push(sub);
    return 'added';
}

// 1. extra_classes.json
function updateExtraJson() {
    const j = JSON.parse(fs.readFileSync(EXTRA, 'utf8'));
    j.extra_subclasses ||= {};
    j.extra_subclasses.fighter ||= [];
    j.extra_subclasses.bard ||= [];
    const r1 = upsertSubclass(j.extra_subclasses.fighter, GUNSLINGER);
    const r2 = upsertSubclass(j.extra_subclasses.bard, COLLEGE_OF_DANCE);
    fs.writeFileSync(EXTRA, JSON.stringify(j, null, 2) + '\n', 'utf8');
    console.log(`[extra_classes.json] gunslinger: ${r1}, college-of-dance: ${r2}`);
}

// 2. js/data/classes_data.js (file generato; aggiorno l'array in-place)
function updateGenerated() {
    const txt = fs.readFileSync(GENERATED, 'utf8');
    // Estraggo la prima riga di commento e ricostruisco
    const eqIdx = txt.indexOf('=');
    const headerComment = txt.slice(0, txt.indexOf('window.CLASSES_DATA'));
    const arrText = txt.slice(eqIdx + 1).replace(/;\s*$/, '').trim();
    const data = JSON.parse(arrText);

    const upsertInClass = (slug, sub) => {
        const cls = data.find(c => c.slug === slug);
        if (!cls) { console.warn(`Classe '${slug}' non trovata`); return 'missing'; }
        cls.subclasses ||= [];
        return upsertSubclass(cls.subclasses, sub);
    };

    const r1 = upsertInClass('fighter', GUNSLINGER);
    const r2 = upsertInClass('bard', COLLEGE_OF_DANCE);
    const out = headerComment + 'window.CLASSES_DATA = ' + JSON.stringify(data) + ';\n';
    fs.writeFileSync(GENERATED, out, 'utf8');
    console.log(`[classes_data.js] gunslinger: ${r1}, college-of-dance: ${r2}`);
}

updateExtraJson();
updateGenerated();
console.log('Done.');
