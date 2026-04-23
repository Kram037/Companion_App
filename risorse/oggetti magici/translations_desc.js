/**
 * Dictionary delle descrizioni IT per gli oggetti magici SRD.
 *
 * Schema: id -> { descrizione_it: string }
 *
 * Aggiungi voci qui sotto e poi lancia:
 *   node "risorse/oggetti magici/apply_translations.js"
 *
 * Convenzioni di stile (vedi anche translations.js):
 *   - Italiano corrente, fedele al testo originale.
 *   - Termini di gioco coerenti col manuale italiano D&D 5e:
 *       saving throw  -> tiro salvezza
 *       spell attack  -> tiro per colpire con incantesimo
 *       attack roll   -> tiro per colpire
 *       spellcasting focus -> focus per incantesimi
 *       bonus action  -> azione bonus
 *       reaction      -> reazione
 *       hit points    -> punti ferita
 *       advantage     -> vantaggio
 *       disadvantage  -> svantaggio
 *       short/long rest -> riposo breve/lungo
 *       at dawn       -> all'alba
 *       AC            -> CA
 *       DC            -> CD
 *       d4/d6/d8/d10/d12/d20 -> d4/d6/d8/d10/d12/d20
 *       feet          -> "piedi" (mantieni la distanza in piedi)
 *   - Mantieni nomi di incantesimi in italiano se esiste la traduzione
 *     ufficiale (es. Palla di Fuoco, Velocita), altrimenti EN tra
 *     virgolette.
 *   - Mantieni le tabelle preservando l'allineamento via "|".
 */

module.exports = {
    // ── A ──────────────────────────────────────────────────────────────
    'absorbing-tattoo': {
        descrizione_it:
"Prodotto da un ago speciale, questo tatuaggio magico presenta motivi che enfatizzano un singolo colore.\n\n" +
"Sintonia del Tatuaggio. Per sintonizzarti con questo oggetto, premi l'ago contro la pelle dove vuoi che appaia il tatuaggio, mantenendo il contatto per tutto il processo di sintonia. Quando la sintonia è completa, l'ago si trasforma nell'inchiostro che diventa il tatuaggio sulla pelle.\n\n" +
"Se la sintonia col tatuaggio termina, il tatuaggio scompare e l'ago riappare nel tuo spazio.\n\n" +
"Resistenza al Danno. Mentre il tatuaggio è sulla tua pelle, hai resistenza al tipo di danno associato al colore, come indicato nella tabella seguente. Il DM sceglie il colore o lo determina casualmente.\n\n" +
"d10 | Tipo di Danno | Colore\n" +
"1 | Acido | Verde\n" +
"2 | Freddo | Blu\n" +
"3 | Fuoco | Rosso\n" +
"4 | Forza | Bianco\n" +
"5 | Fulmine | Giallo\n" +
"6 | Necrotico | Nero\n" +
"7 | Veleno | Viola\n" +
"8 | Psichico | Argento\n" +
"9 | Radiante | Oro\n" +
"10 | Tuono | Arancione\n\n" +
"Assorbimento del Danno. Quando subisci danno del tipo scelto, puoi usare la reazione per ottenere immunità contro quella istanza di danno e recuperare un numero di punti ferita pari alla metà del danno che avresti subito. Una volta usata questa reazione, non può essere riutilizzata fino all'alba successiva.",
    },
    'adamantine-armor': {
        descrizione_it:
"Questa armatura è rinforzata con adamantio, una delle sostanze più dure esistenti. Mentre la indossi, qualsiasi colpo critico contro di te diventa un colpo normale.",
    },
    'alchemy-jug': {
        descrizione_it:
"Questa brocca di ceramica sembra in grado di contenere un gallone (circa 4 litri) di liquido e pesa 12 libbre sia piena sia vuota. Quando viene scossa, dall'interno della brocca si sentono rumori di liquido in movimento, anche se è vuota.\n\n" +
"Con un'azione, puoi nominare uno dei liquidi della tabella sottostante per fare in modo che la brocca produca quel liquido. In seguito, puoi stappare la brocca con un'azione e versare il liquido, fino a 2 galloni al minuto. La quantità massima di liquido che la brocca può produrre dipende dal liquido nominato.\n\n" +
"Una volta che la brocca inizia a produrre un liquido, non può produrne uno diverso, né più di uno che ha raggiunto il massimo, fino all'alba successiva.\n\n" +
"Liquido | Quantità Max\n" +
"Acido | 8 once\n" +
"Veleno comune | 1/2 oncia\n" +
"Birra | 4 galloni\n" +
"Miele | 1 gallone\n" +
"Maionese | 2 galloni\n" +
"Olio | 1 quarto\n" +
"Aceto | 2 galloni\n" +
"Acqua dolce | 8 galloni\n" +
"Acqua salata | 12 galloni\n" +
"Vino | 1 gallone",
    },
    'amulet-of-health': {
        descrizione_it:
"Il tuo punteggio di Costituzione è 19 mentre indossi questo amuleto. Non ha effetto su di te se la tua Costituzione è già 19 o superiore.",
    },
    'amulet-of-proof-against-detection-and-location': {
        descrizione_it:
"Mentre indossi questo amuleto, sei nascosto alla magia di divinazione. Non puoi essere bersaglio di tale magia né percepito tramite sensori magici di scrutamento.",
    },
    'amulet-of-the-devout': {
        descrizione_it:
"Questo amuleto reca il simbolo di una divinità intarsiato con pietre o metalli preziosi. Mentre indossi il simbolo sacro, ottieni un bonus ai tiri per colpire con incantesimo e alle CD dei tiri salvezza dei tuoi incantesimi. Il bonus è determinato dalla rarità dell'amuleto.\n\n" +
"Mentre indossi questo amuleto, puoi usare il privilegio Incanalare Divinità senza spendere uno dei suoi utilizzi. Una volta usata questa proprietà, non può essere riutilizzata fino all'alba successiva.",
    },
    'amulet-of-the-planes': {
        descrizione_it:
"Mentre indossi questo amuleto, puoi usare un'azione per nominare un luogo che ti è familiare su un altro piano di esistenza. Poi effettua una prova di Intelligenza con CD 15. Se la prova ha successo, lanci l'incantesimo Spostamento Planare. In caso di fallimento, tu e ogni creatura e oggetto entro 4,5 metri da te viaggiate verso una destinazione casuale. Tira un d100. Con un risultato di 1-60, viaggi verso un luogo casuale del piano nominato. Con un risultato di 61-100, viaggi verso un piano di esistenza determinato casualmente.",
    },
    'animated-shield': {
        descrizione_it:
"Mentre impugni questo scudo, puoi pronunciare la sua parola di comando con un'azione bonus per farlo animare. Lo scudo balza in aria e fluttua nel tuo spazio per proteggerti come se lo stessi impugnando, lasciandoti le mani libere. Lo scudo rimane animato per 1 minuto, finché non usi un'azione bonus per terminare l'effetto, o finché non sei incapacitato o muori, momento in cui lo scudo cade a terra o nella tua mano se ne hai una libera.",
    },
    'antimagic-armor': {
        descrizione_it:
"Mentre indossi questa armatura, puoi usare la reazione per ottenere vantaggio a un tiro salvezza che effettui contro un incantesimo. Una volta usata questa proprietà, non può essere riutilizzata fino all'alba successiva.\n\n" +
"Inoltre, mentre indossi questa armatura puoi usarla per lanciare Campo Antimagia, senza richiedere componenti dell'incantesimo. Una volta usata questa proprietà, non può essere riutilizzata fino all'alba successiva.",
    },
    'arrow-catching-shield': {
        descrizione_it:
"Ottieni un bonus di +2 alla CA contro gli attacchi a distanza mentre impugni questo scudo. Questo bonus si somma al normale bonus alla CA dello scudo. Inoltre, ogni volta che un attaccante effettua un attacco a distanza contro un bersaglio entro 1,5 metri da te, puoi usare la reazione per diventare tu il bersaglio dell'attacco al suo posto.",
    },
    'arrow-of-slaying': {
        descrizione_it:
"Una freccia sterminatrice è un'arma magica concepita per uccidere un particolare tipo di creatura. Alcune sono più specifiche di altre: ad esempio, esistono frecce sterminatrici di draghi e frecce sterminatrici di draghi blu. Se una creatura appartenente al tipo, razza o gruppo associato alla freccia sterminatrice subisce danni dalla freccia, deve effettuare un tiro salvezza su Costituzione con CD 17, subendo 6d10 danni perforanti aggiuntivi se fallisce, o la metà di quei danni se ha successo.\n\n" +
"Una volta che una freccia sterminatrice ha inflitto i suoi danni aggiuntivi a una creatura, diventa una freccia non magica.\n\n" +
"Esistono anche altri tipi di munizioni magiche di questo genere, come quadrelli sterminatori per balestra, anche se le frecce sono le più comuni.",
    },

    // ── B ──────────────────────────────────────────────────────────────
    'bag-of-beans': {
        descrizione_it:
"All'interno di questa borsa di tessuto pesante ci sono 3d4 fagioli secchi. La borsa pesa mezza libbra più mezza oncia per ogni fagiolo che contiene.\n\n" +
"Se versi i fagioli dalla borsa, esplodono in un raggio di 3 metri da essi, dissolvendosi dopo l'esplosione. Ogni creatura entro 3 metri dai fagioli deve effettuare un tiro salvezza su Destrezza con CD 15, subendo 5d4 danni da fuoco se fallisce, o la metà se ha successo.\n\n" +
"Per evitare l'esplosione, i fagioli devono essere estratti con cura dalla borsa e piantati. Quando un fagiolo viene piantato in terra o terreno, accade un effetto, casuale o determinato dal DM (vedi tabella sul DMG).",
    },
    'bag-of-devouring': {
        descrizione_it:
"Questa borsa assomiglia molto a una Borsa Conservante ma è in realtà una bocca di un'enorme creatura extradimensionale. Posizionare qualsiasi creatura all'interno della borsa la teletrasporta nelle fauci della creatura. Quando la borsa si gira al rovescio, la creatura emerge.\n\n" +
"Se viene ascoltata, dall'interno della borsa si sente un debole digerimento. Gli oggetti collocati nella borsa vengono ingoiati dopo 1 minuto. Una volta al giorno la borsa ingoia qualsiasi creatura collocata al suo interno e di taglia Media o inferiore. La creatura ingoiata viene espulsa nel piano del Caos di Pandemonium.",
    },
    'bag-of-holding': {
        descrizione_it:
"Questa borsa ha una capacità interna di 500 libbre, occupando un volume non superiore a 64 piedi cubi. La borsa pesa sempre 15 libbre, indipendentemente dal suo contenuto. Estrarre un oggetto dalla borsa richiede un'azione.\n\n" +
"Se la borsa viene riempita oltre la sua capacità, o se è perforata o lacerata, si rompe e viene distrutta, e i suoi contenuti si disperdono nel Piano Astrale. Se la borsa è capovolta, i contenuti escono illesi, ma la borsa deve essere rimessa al diritto prima di poter essere riutilizzata. Le creature respiranti all'interno della borsa hanno aria sufficiente per 10 minuti, divisi per il numero di creature respiranti al suo interno.\n\n" +
"Posizionare una Borsa Conservante all'interno di un'altra borsa extradimensionale (come una Borsa Divorante, una Sacca a Tracolla Manesca di Heward o un Buco Portatile) distrugge entrambi gli oggetti e apre un portale verso il Piano Astrale. Il portale ha origine dove un oggetto è stato collocato dentro l'altro. Qualsiasi creatura entro 3 metri dal portale viene risucchiata e depositata in un luogo casuale del Piano Astrale. Il portale si chiude quindi. Il portale è a senso unico e non può essere riaperto.",
    },
    'bag-of-tricks': {
        descrizione_it:
"Questa borsa di tessuto ordinaria, di colore grigio, marrone chiaro o nero, sembra vuota. Tuttavia, infilando una mano all'interno si avverte la presenza di un piccolo oggetto soffice. La borsa pesa mezza libbra.\n\n" +
"Con un'azione, puoi estrarre il piccolo oggetto dalla borsa e lanciarlo fino a 6 metri di distanza. Quando l'oggetto tocca terra, si trasforma in una creatura determinata tirando un d8 e consultando la tabella corrispondente al colore della borsa. La creatura scompare al raggiungimento di 0 punti ferita o all'alba successiva.\n\n" +
"La creatura è amichevole verso te e i tuoi compagni e agisce nel tuo turno. Puoi usare un'azione bonus per ordinarle come muoversi e che azione compiere nel suo turno successivo, oppure darle istruzioni generali (come attaccare i nemici). In assenza di ordini, la creatura agisce in modo confacente alla sua natura.\n\n" +
"Una volta estratte tre creature dalla borsa, questa non può essere usata di nuovo fino all'alba successiva.",
    },
    'bead-of-force': {
        descrizione_it:
"Questa piccola perla nera misura circa 2 centimetri di diametro e pesa un'oncia. In genere, da 1 a 4 perle di forza si trovano insieme.\n\n" +
"Puoi usare un'azione per lanciare la perla fino a 18 metri di distanza. Al termine del movimento, la perla esplode in un'onda di forza. Ogni creatura entro 3 metri dal punto di esplosione deve riuscire in un tiro salvezza su Destrezza con CD 15 o subire 5d4 danni da forza. Una sfera di forza traslucida ingloba quindi l'area per 1 minuto. Qualsiasi creatura che ha fallito il tiro salvezza ed è interamente all'interno dell'area è intrappolata in questa sfera. Le creature che sono solo parzialmente all'interno dell'area, o quelle che hanno avuto successo nel tiro salvezza, vengono spinte via dal centro della sfera fino a non essere più all'interno di essa. Solo una creatura intrappolata può respirare. La sfera può essere danneggiata e distrutta. Ha 10 punti ferita, immunità a tutti i danni eccetto forza, e se ridotta a 0 pf, viene distrutta, liberando ogni creatura intrappolata al suo interno.",
    },
    'bead-of-nourishment': {
        descrizione_it:
"Questa perla aromatica si dissolve a contatto con la lingua e ti fornisce nutrimento sufficiente per 24 ore, anche se non puoi normalmente mangiare cibo o bere acqua, ad esempio se sei non morto.",
    },
    'bead-of-refreshment': {
        descrizione_it:
"Questa perla si dissolve quando immersa in un liquido, conferendo a quel liquido il sapore dell'acqua fresca pulita. Una pinta del liquido così trattato diventa pura e potabile, eliminando ogni veleno o malattia che vi si trovi.",
    },
    'bell-branch': {
        descrizione_it:
"Tieni questo ramoscello e suoni le campanelle attaccate per usarlo come focus per i tuoi incantesimi da druido. Mentre suoni le campanelle, ricevi un bonus ai tiri per colpire con incantesimo e alle CD dei tiri salvezza dei tuoi incantesimi da druido. Il bonus è determinato dalla rarità del ramo a sonagli.",
    },
    'belt-of-dwarvenkind': {
        descrizione_it:
"Mentre indossi questa cintura, ottieni i seguenti benefici:\n\n" +
"- Il tuo punteggio di Costituzione aumenta di 2, fino a un massimo di 20.\n" +
"- Hai vantaggio ai tiri salvezza su Carisma effettuati per resistere agli effetti degli incantesimi lanciati da giganti.\n" +
"Inoltre, mentre la indossi hai una probabilità del 50% all'alba di ogni giorno di far crescere una folta barba scura, se sei in grado di farla crescere, o di rendere ancora più impressionante quella esistente, se ne hai già una. Se non apprezzi questa caratteristica, la barba si dissolve quando rimuovi la cintura.",
    },
    'belt-of-giant-strength': {
        descrizione_it:
"Mentre indossi questa cintura, il tuo punteggio di Forza viene impostato secondo il tipo di gigante (vedi tabella). L'effetto non si applica se la tua Forza è già pari o superiore al valore della cintura.\n\n" +
"Tipo di Cintura | Punteggio di Forza\n" +
"Cintura del Gigante delle Colline | 21\n" +
"Cintura del Gigante di Pietra/Frost | 23\n" +
"Cintura del Gigante del Fuoco | 25\n" +
"Cintura del Gigante delle Nuvole | 27\n" +
"Cintura del Gigante delle Tempeste | 29",
    },
    'berserker-axe': {
        descrizione_it:
"Ottieni un bonus di +1 ai tiri per colpire e ai tiri di danno effettuati con questa arma magica. Inoltre, mentre sei sintonizzato con quest'arma, il tuo massimo di punti ferita aumenta di 1 per ogni livello che hai.\n\n" +
"Maledizione. Questa ascia è maledetta e la sintonia con essa estende la maledizione a te. Finché rimani maledetto, sei restio a separarti dall'arma, mantenendola alla portata in ogni momento. Hai inoltre svantaggio ai tiri per colpire effettuati con altre armi.\n\n" +
"Inoltre, mentre l'ascia è sulla tua persona, devi effettuare un tiro salvezza su Saggezza con CD 15 ogni volta che subisci danno in combattimento. In caso di fallimento, vai in furia per il proprio successivo turno. Per ogni turno in furia, devi effettuare attacchi in mischia contro la creatura più vicina. Se puoi attaccare più di una creatura nel tuo movimento, scegli a caso il bersaglio. La furia termina al tuo turno se non puoi vedere o avvicinarti a una creatura ostile.",
    },
    'boots-of-elvenkind': {
        descrizione_it:
"Mentre indossi questi stivali, i tuoi passi non producono alcun rumore, indipendentemente dalla superficie su cui ti muovi. Hai inoltre vantaggio alle prove di Destrezza (Furtività) effettuate per muoverti silenziosamente.",
    },
    'boots-of-false-tracks': {
        descrizione_it:
"Solo gli umanoidi possono indossare questi stivali. Mentre li indossi, puoi fare in modo che gli stivali lascino le tracce di una qualsiasi creatura umanoide di taglia simile alla tua.",
    },
    'boots-of-levitation': {
        descrizione_it:
"Mentre indossi questi stivali, puoi usare un'azione per lanciare l'incantesimo Levitazione su te stesso a volontà.",
    },
    'boots-of-speed': {
        descrizione_it:
"Mentre indossi questi stivali, puoi usare un'azione bonus e battere i talloni insieme. Per 10 minuti, la tua velocità di camminata è raddoppiata, le creature ostili hanno svantaggio ai tiri per colpire contro di te quando le attacchi in mischia, e l'attacco di opportunità non si applica a te quando lasci la portata di una creatura ostile. Se i talloni perdono contatto, l'effetto termina.\n\n" +
"Quando l'effetto termina, non puoi riutilizzare la proprietà finché non l'avrai usata in modo continuativo per 10 minuti.",
    },
    'boots-of-striding-and-springing': {
        descrizione_it:
"Mentre indossi questi stivali, la tua velocità di camminata diventa 9 metri, a meno che non sia già superiore, e la tua velocità non viene ridotta se sei carico o indossi armatura pesante. Inoltre, puoi saltare il triplo della distanza normale, ma non oltre la tua velocità di camminata rimanente.",
    },
    'boots-of-the-winterlands': {
        descrizione_it:
"Questi stivali confortevoli sono caldi e impermeabili. Mentre li indossi ottieni i seguenti benefici:\n\n" +
"- Hai resistenza ai danni da freddo.\n" +
"- Ignori il terreno difficile creato da ghiaccio o neve.\n" +
"- Puoi sopportare temperature fino a -45 gradi Celsius senza ulteriore protezione. Se indossi indumenti pesanti, puoi sopportare temperature fino a -73 gradi Celsius.",
    },
    'bracers-of-archery': {
        descrizione_it:
"Mentre indossi questi bracciali, hai competenza nell'arco lungo e nell'arco corto, e ottieni un bonus di +2 ai tiri di danno con quei tipi d'arma.",
    },
    'bracers-of-defense': {
        descrizione_it:
"Mentre indossi questi bracciali, ottieni un bonus di +2 alla CA se non indossi alcuna armatura e non impugni alcuno scudo.",
    },
    'brazier-of-commanding-fire-elementals': {
        descrizione_it:
"Mentre nessun fuoco arde in questo braciere d'ottone, puoi usare un'azione per pronunciare la sua parola di comando ed evocare un elementale del fuoco, come se avessi lanciato l'incantesimo Evocare Elementale. Il braciere non può essere usato di nuovo allo stesso scopo fino all'alba successiva.",
    },
    'brooch-of-shielding': {
        descrizione_it:
"Mentre indossi questa spilla, hai resistenza ai danni da forza e immunità ai danni inflitti dall'incantesimo Proiettile Magico.",
    },
    'broom-of-flying': {
        descrizione_it:
"Questa scopa di legno, che pesa 1,5 kg, funziona come una normale scopa fino a quando non sei in piedi su di essa e ne pronunci la parola di comando. Allora si libra in volo e può essere cavalcata in volo. Ha una velocità di volo di 15 metri. Può trasportare fino a 200 libbre, ma la sua velocità di volo si dimezza se trasporta oltre 100 libbre. La scopa smette di volare se atterri. Puoi inviare la scopa a viaggiare da sola fino a una destinazione entro 1,5 km, se conosci il luogo. La scopa torna nel tuo spazio dopo 24 ore se il suo viaggio fallisce. Altrimenti, viaggia verso qualsiasi destinazione tu specifichi e poi torna nel tuo spazio.",
    },
};
