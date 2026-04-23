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

    // ── Batch A residui ────────────────────────────────────────────────
    'adze-of-annam': {
        descrizione_it:
"Si dice che questa massiccia ascia sia stata impugnata dal Padre di Tutti, Annam, non come arma ma come strumento usato per plasmare i vari mondi del Piano Materiale eoni fa.\n\n" +
"Proprietà Casuali. L'ascia ha le seguenti proprietà casuali, determinate tirando sulla tabella appropriata della Guida del Dungeon Master:\n" +
"- 2 proprietà benefiche minori\n" +
"- 1 proprietà benefica maggiore\n" +
"- 2 proprietà dannose minori\n\n" +
"Arma Magica. Quando una creatura si sintonizza con l'ascia, l'artefatto regola magicamente la propria taglia in modo che la creatura possa impugnarla come ascia bipenne. L'ascia è un'arma magica che concede un bonus di +3 ai tiri per colpire e ai tiri di danno effettuati con essa. Con un colpo, l'ascia infligge ulteriori 3d12 danni da forza. Infligge inoltre danni doppi a oggetti e strutture.\n\n" +
"Zappa Divina. Con un'azione, puoi invocare la potenza del Padre di Tutti e usare l'ascia per lanciare Smuovere il Terreno o Fabbricare. Una volta usata questa proprietà, non può essere riutilizzata fino all'alba successiva.",
    },
    'alchemical-compendium': {
        descrizione_it:
"Odori acri si attaccano a questo volume pesante e macchiato. Le rifiniture metalliche del libro sono di rame, ferro, piombo, argento e oro, alcune congelate a metà transizione da un metallo all'altro. Quando viene trovato, il libro contiene i seguenti incantesimi: Ingrandire/Ridurre, Caduta Morbida, Carne in Pietra, Forma Gassosa, Arma Magica e Metamorfosi. Funziona da libro degli incantesimi per te.\n\n" +
"Mentre tieni in mano il libro, puoi usarlo come focus per i tuoi incantesimi da mago.\n\n" +
"Il libro ha 3 cariche e recupera 1d3 cariche spese ogni giorno all'alba. Puoi usare le cariche nei seguenti modi mentre lo tieni in mano:\n" +
"- Se passi 1 minuto a studiare il libro, puoi spendere 1 carica per sostituire uno dei tuoi incantesimi da mago preparati con un incantesimo diverso presente nel libro. Il nuovo incantesimo deve essere della scuola di trasmutazione.\n" +
"- Con un'azione, puoi toccare un oggetto non magico che non è indossato né trasportato e spendere un certo numero di cariche per trasformare il bersaglio in un altro oggetto. Per 1 carica, l'oggetto non può superare 30 cm per lato. Puoi spendere cariche aggiuntive per aumentare le dimensioni massime di 60 cm per ogni carica spesa. Il nuovo oggetto deve avere un valore in oro pari o inferiore all'originale.",
    },
    'all-purpose-tool': {
        descrizione_it:
"Questo semplice cacciavite può trasformarsi in una varietà di strumenti; con un'azione puoi toccare l'oggetto e trasformarlo in qualsiasi tipo di strumenti da artigiano a tua scelta. Qualsiasi forma assuma lo strumento, hai competenza con esso. Mentre tieni in mano questo strumento, ottieni un bonus ai tiri per colpire con incantesimo e alle CD dei tiri salvezza dei tuoi incantesimi da artefice. Il bonus è determinato dalla rarità dello strumento.\n\n" +
"Con un'azione, puoi concentrarti sullo strumento per incanalare le tue forze creative. Scegli un trucchetto che non conosci da una qualsiasi lista di classe. Per 8 ore puoi lanciare quel trucchetto, e per te conta come trucchetto da artefice. Una volta usata questa proprietà, non può essere riutilizzata fino all'alba successiva.",
    },
    'amethyst-lodestone': {
        descrizione_it:
"Questo pezzo di ametista grande quanto un pugno è infuso con la capacità di un drago di ametista di piegare le forze gravitazionali. Mentre porti la pietra magnetica, hai vantaggio ai tiri salvezza su Forza.\n\n" +
"La pietra magnetica ha 6 cariche per le seguenti proprietà, utilizzabili mentre la tieni in mano. La pietra recupera 1d6 cariche spese ogni giorno all'alba.\n\n" +
"Volo. Con un'azione bonus, puoi spendere 1 carica per ottenere il potere del volo per 10 minuti. Per la durata, ottieni una velocità di volo pari alla tua velocità di camminata e puoi librarti.\n\n" +
"Spinta Gravitazionale. Con un'azione, puoi spendere 1 carica per concentrare la gravità attorno a una creatura che vedi entro 18 metri da te. Il bersaglio deve riuscire in un tiro salvezza su Forza con CD 18 o essere spinto fino a 6 metri in una direzione a tua scelta.\n\n" +
"Inversione di Gravità. Con un'azione, puoi spendere 3 cariche per lanciare Inversione della Gravità dalla pietra (CD 18).",
    },
    'apparatus-of-kwalish': {
        descrizione_it:
"Questo oggetto appare inizialmente come una grande botte di ferro sigillata di taglia Grande, dal peso di circa 230 kg. La botte ha un fermo nascosto, individuabile con una prova di Intelligenza (Indagare) con CD 20. Sganciando il fermo si apre un boccaporto a un'estremità della botte, permettendo a due creature di taglia Media o inferiore di entrarvi. Dieci leve sono disposte in fila all'estremità opposta, ciascuna in posizione neutra, in grado di muoversi verso l'alto o verso il basso. Quando determinate leve vengono usate, l'apparato si trasforma assomigliando a un'aragosta gigante.\n\n" +
"L'Apparato di Kwalish è un oggetto Grande con statistiche complete dettagliate nella Guida del Dungeon Master.",
    },
    'arcane-grimoire': {
        descrizione_it:
"Mentre tieni in mano questo libro rilegato in pelle, puoi usarlo come focus per i tuoi incantesimi da mago, e ottieni un bonus ai tiri per colpire con incantesimo e alle CD dei tiri salvezza dei tuoi incantesimi da mago. Il bonus è determinato dalla rarità del libro.\n\n" +
"Puoi usare questo libro come libro degli incantesimi. Inoltre, quando usi il privilegio Recupero Arcano, puoi aumentare di 1 il numero di livelli di slot incantesimo che recuperi.",
    },
    'astral-shard': {
        descrizione_it:
"Questo cristallo è una scheggia solidificata del Piano Astrale, attraversata da una nebbia argentea vorticosa. Con un'azione, puoi attaccare la scheggia a un oggetto Minuscolo (come un'arma o un gioiello) o staccarla. Cade se la tua sintonia con essa termina. Puoi usare la scheggia come focus per incantesimi mentre la tieni in mano o la indossi.\n\n" +
"Quando usi un'opzione di Metamagia su un incantesimo mentre tieni in mano o indossi la scheggia, immediatamente dopo aver lanciato l'incantesimo puoi teletrasportarti in uno spazio libero che vedi entro 9 metri da te.",
    },
    'astromancy-archive': {
        descrizione_it:
"Questo disco d'ottone composto da anelli concentrici articolati si dispiega in una sfera armillare. Con un'azione bonus puoi dispiegarlo in sfera o ripiegarlo in disco. Quando viene trovato contiene gli incantesimi: Auspicio, Divinazione, Trovare il Cammino, Premonizione, Localizzare Creatura e Localizzare Oggetto, che diventano incantesimi da mago per te mentre sei sintonizzato. Funziona da libro degli incantesimi, con incantesimi codificati sugli anelli.\n\n" +
"Mentre tieni l'archivio, puoi usarlo come focus per i tuoi incantesimi da mago.\n\n" +
"L'archivio ha 3 cariche e recupera 1d3 cariche spese ogni giorno all'alba. Puoi usare le cariche nei seguenti modi mentre lo tieni in mano:\n" +
"- Se passi 1 minuto a studiare l'archivio, puoi spendere 1 carica per sostituire uno dei tuoi incantesimi da mago preparati con un incantesimo diverso presente nell'archivio. Il nuovo incantesimo deve essere della scuola di divinazione.\n" +
"- Quando una creatura che vedi entro 9 metri da te effettua un tiro per colpire, una prova di caratteristica o un tiro salvezza, puoi usare la reazione per spendere 1 carica e forzare la creatura a tirare un d4 e applicare il numero ottenuto come bonus o penalità (a tua scelta) al tiro originale. Puoi farlo dopo aver visto il tiro ma prima che gli effetti vengano applicati.",
    },
    'atlas-of-endless-horizons': {
        descrizione_it:
"Questo grosso libro è rilegato in pelle scura, attraversato da linee d'argento intarsiate che suggeriscono una mappa o una carta. Quando viene trovato contiene gli incantesimi: Cancello Arcano, Porta Dimensionale, Cancello, Passo Velato, Spostamento Planare, Cerchio di Teletrasporto e Parola del Richiamo, che diventano incantesimi da mago per te mentre sei sintonizzato. Funziona da libro degli incantesimi.\n\n" +
"Mentre tieni il libro, puoi usarlo come focus per i tuoi incantesimi da mago.\n\n" +
"Il libro ha 3 cariche e recupera 1d3 cariche spese ogni giorno all'alba. Puoi usare le cariche nei seguenti modi mentre lo tieni in mano:\n" +
"- Se passi 1 minuto a studiare il libro, puoi spendere 1 carica per sostituire uno dei tuoi incantesimi da mago preparati con un incantesimo diverso presente nel libro. Il nuovo incantesimo deve essere della scuola di evocazione.\n" +
"- Quando vieni colpito da un attacco, puoi usare la reazione per spendere 1 carica e teletrasportarti fino a 3 metri in uno spazio libero che vedi. Se la tua nuova posizione è fuori dalla portata dell'attacco, esso ti manca.",
    },
    'axe-of-the-dwarvish-lords': {
        descrizione_it:
"L'Ascia dei Signori Nanici fu forgiata in un'era di prosperità ed è ricordata come l'arma del Primo Re nano, padre della stirpe regnante. Tramandata per generazioni come emblema di sovranità, l'ascia fu perduta in un'epoca oscura segnata da tradimento e malvagità, scomparendo durante una sanguinosa guerra civile alimentata dall'avidità per il suo potere. Da allora i nani la cercano e molti avventurieri hanno costruito carriere intere sull'inseguimento di voci e sul saccheggio di antiche cripte per ritrovarla.\n\n" +
"Proprietà Casuali. L'ascia ha le seguenti proprietà casuali:\n" +
"- 2 proprietà benefiche minori\n" +
"- 1 proprietà benefica maggiore\n" +
"- 2 proprietà dannose minori\n\n" +
"Arma Magica. L'ascia è un'arma magica che concede un bonus di +3 ai tiri per colpire e ai tiri di danno effettuati con essa.\n\n" +
"Tagliente Travolgente. Quando colpisci un gigante con l'ascia, il gigante subisce un ulteriore 3d6 di danni taglienti e deve riuscire in un tiro salvezza su Forza con CD 17 o cadere prono.\n\n" +
"Sintonia Difficile. Solo un nano può sintonizzarsi con l'ascia. Qualsiasi altra creatura che provi a sintonizzarsi con essa subisce 7d6 danni psichici (un tiro salvezza su Costituzione con CD 17 dimezza il danno).\n\n" +
"Privilegi del Possessore. Una creatura sintonizzata con l'ascia ottiene scurovisione fino a 18 metri, conoscenza della pietra, capacità di parlare il Nanico e altre proprietà descritte nella Guida del Dungeon Master.",
    },

    // ── Batch B completo ───────────────────────────────────────────────
    'baba-yaga-s-mortar-and-pestle': {
        descrizione_it:
"Le creazioni dell'immortale strega Baba Yaga sfidano le leggi della magia mortale. Tra gli strumenti notori che cementano la sua leggenda in innumerevoli mondi ci sono gli artefatti che la trasportano attraverso i piani: il Mortaio e il Pestello di Baba Yaga. Questi due oggetti contano come un singolo artefatto per la sintonia. Se vengono separati, il pestello riappare accanto al mortaio all'alba successiva.\n\n" +
"Proprietà Casuali. Questo artefatto ha le seguenti proprietà casuali:\n" +
"- 2 proprietà benefiche minori\n" +
"- 1 proprietà benefica maggiore\n" +
"- 1 proprietà dannosa minore\n\n" +
"Proprietà del Mortaio. Il mortaio è una piccola ciotola di legno Minuscola. Tuttavia, il mortaio aumenta di dimensioni per accogliere qualsiasi cosa tu vi inserisca, espandendosi — se c'è abbastanza spazio — fino a taglia Grande, potendo contenere persino una creatura Grande.\n\n" +
"Proprietà del Pestello. Il pestello è un consunto strumento di legno lungo circa 15 cm. Una volta nel tuo turno mentre tieni il pestello, puoi estenderlo in un bastone ferrato o ridurlo a pestello (nessuna azione richiesta). Come bastone ferrato, il pestello è un'arma magica che concede un bonus di +3 ai tiri per colpire e ai tiri di danno.\n\n" +
"Il pestello ha 12 cariche. Quando colpisci con un attacco in mischia usando il pestello, puoi spendere fino a 3 cariche per infliggere 1d8 danni da forza aggiuntivi per ogni carica spesa. Il pestello recupera tutte le cariche spese ogni giorno all'alba.\n\n" +
"Strumenti Perfetti. Mentre tieni mortaio e pestello, puoi usare un'azione per pronunciare il nome di una qualsiasi pianta, minerale o fluido non magico, e una quantità di quel materiale del valore di 10 mo o meno. Il mortaio si riempie istantaneamente con la quantità desiderata. Una volta usata questa azione, non puoi farlo di nuovo finché non termini un riposo breve o lungo.\n\n" +
"Puoi anche usare l'artefatto come strumenti da alchimista, da birraio, utensili da cuoco, kit da erborista e kit da avvelenatore. Hai vantaggio a qualsiasi prova effettuata usando l'artefatto come uno di questi strumenti.\n\n" +
"Parti Primigenie. Con un'azione mentre il pestello e il mortaio sono entro 1,5 metri da te, puoi comandare al pestello di macinare. Per il prossimo minuto, o finché non usi un'azione per ordinargli verbalmente di fermarsi, il pestello si muove da solo, macinando il contenuto del mortaio in poltiglia o polvere fine. All'inizio di ogni tuo turno, qualsiasi cosa sia nel mortaio subisce 4d10 danni da forza. Solo gli oggetti magici sono inalterati.\n\n" +
"Attraversa la Notte. Se tieni il pestello mentre sei dentro il mortaio, puoi usare un'azione per ordinare verbalmente al mortaio di viaggiare verso un luogo o creatura specifica. Non devi sapere dove si trova la destinazione, ma deve essere una destinazione precisa. Se la destinazione è entro 1.600 km da te, il mortaio si solleva in aria e svanisce. Tu e ogni creatura nel mortaio viaggiate attraverso un cielo onirico, arrivando a destinazione dopo 1 ora (o 1 minuto se è notte).\n\n" +
"Distruggere Mortaio e Pestello. Mortaio e pestello vengono distrutti se vengono schiacciati sotto i piedi della Capanna Danzante di Baba Yaga o dalla stessa Baba Yaga.",
    },
    'baleful-talon': {
        descrizione_it:
"Ottieni un bonus di +1 ai tiri per colpire e ai tiri di danno effettuati con questo pugnale uncinato di ossidiana.\n\n" +
"Quando colpisci una creatura con quest'arma magica e ottieni 19 o 20 al tiro per colpire, la creatura deve effettuare un tiro salvezza su Costituzione con CD 15 mentre il pugnale si illumina di una luce malsana. La creatura subisce 6d6 danni necrotici se fallisce, o la metà se ha successo. Se questo danno riduce la creatura a 0 punti ferita, la creatura si disintegra in polvere.",
    },
    'barrier-tattoo': {
        descrizione_it:
"Sintonia del Tatuaggio. Per sintonizzarti con questo oggetto, premi l'ago contro la pelle dove vuoi che appaia il tatuaggio, mantenendo il contatto per tutto il processo di sintonia. Quando la sintonia è completa, l'ago si trasforma nell'inchiostro che diventa il tatuaggio.\n\n" +
"Se la sintonia col tatuaggio termina, il tatuaggio scompare e l'ago riappare nel tuo spazio.\n\n" +
"Protezione. Mentre non indossi alcuna armatura, il tatuaggio ti concede una Classe Armatura che dipende dalla sua rarità, come mostrato qui sotto. Puoi usare uno scudo e ottenere comunque questo beneficio.\n\n" +
"Rarità | CA\n" +
"Non Comune | 12 + il tuo modificatore di Destrezza\n" +
"Raro | 15 + il tuo modificatore di Destrezza (massimo +2)\n" +
"Molto Raro | 18",
    },
    'bigby-s-beneficent-bracelet': {
        descrizione_it:
"Questo splendido pezzo di gioielleria, forgiato dal mago Bigby in persona, consiste di quattro anelli d'oro collegati da delicate catene a un polsino tempestato di zaffiri e diamanti.\n\n" +
"Proprietà Casuali. Il bracciale ha le seguenti proprietà casuali:\n" +
"- 1 proprietà benefica minore\n" +
"- 1 proprietà benefica maggiore\n" +
"- 1 proprietà dannosa minore\n\n" +
"Dita Agili. Mentre indossi il bracciale, puoi lanciare Mano Magica.\n\n" +
"Scultura di Forza. Concentrandoti e incanalando la magia del bracciale per 1 minuto, puoi creare una copia spettrale di un oggetto non magico Grande o inferiore. La copia appare in uno spazio libero entro 3 metri da te ed è fatta di forza tangibile ma traslucida che imita taglia, peso e altre proprietà dell'oggetto copiato. La copia deve apparire su una superficie o liquido che possa sostenerla. Le creature possono toccare e interagire con la copia come se fosse un oggetto non magico.\n\n" +
"La copia è immune a tutti i danni e non può essere dissolta, ma un incantesimo Disintegrazione la distrugge immediatamente. Altrimenti, la copia scompare dopo 8 ore o quando la dismetti con un'azione. Il bracciale può creare fino a tre copie e recupera tutti gli usi spesi all'alba.\n\n" +
"Mano d'Aiuto. Con un'azione, puoi usare il bracciale per lanciare Mano di Bigby al 9° livello (bonus al tiro per colpire con incantesimo +13). Quando lanci l'incantesimo in questo modo, esso non richiede concentrazione. Una volta usata questa proprietà, non può essere riutilizzata fino all'alba successiva.",
    },
    'blackrazor': {
        descrizione_it:
"Nascosta nel dungeon di White Plume Mountain, Lamanera brilla come un pezzo di cielo notturno colmo di stelle. Il suo fodero nero è decorato con pezzi di ossidiana tagliata.\n\n" +
"Ottieni un bonus di +3 ai tiri per colpire e ai tiri di danno effettuati con quest'arma magica. Ha le seguenti proprietà aggiuntive.\n\n" +
"Divora Anima. Ogni volta che la usi per ridurre una creatura a 0 punti ferita, la spada uccide la creatura e divora la sua anima, a meno che sia un costrutto o un non morto. Una creatura la cui anima sia stata divorata da Lamanera può essere riportata in vita solo da un incantesimo Desiderio.\n\n" +
"Quando divora un'anima, Lamanera ti concede punti ferita temporanei pari al massimo di punti ferita della creatura uccisa. Questi pf sbiadiscono dopo 24 ore. Finché questi pf temporanei durano e tieni Lamanera in mano, hai vantaggio ai tiri per colpire, ai tiri salvezza e alle prove di caratteristica.\n\n" +
"Se colpisci un non morto con quest'arma, subisci 1d10 danni necrotici e il bersaglio recupera 1d10 punti ferita. Se questi danni necrotici ti riducono a 0 punti ferita, Lamanera divora la tua anima.\n\n" +
"Cacciatore d'Anime. Mentre impugni l'arma, sei consapevole della presenza di creature Minuscole o più grandi entro 18 metri da te che non siano costrutti o non morti. Inoltre non puoi essere affascinato o spaventato. Lamanera può lanciare l'incantesimo Velocità su di te una volta al giorno; decide essa quando lanciarlo e mantiene la concentrazione su di esso al tuo posto.\n\n" +
"Senzienza. Lamanera è un'arma senziente di allineamento caotico neutrale con Intelligenza 17, Saggezza 10 e Carisma 19. Ha udito e scurovisione fino a 36 metri. L'arma può parlare, leggere e capire il Comune, e può comunicare telepaticamente con il portatore. La sua voce è profonda ed echeggia. Mentre sei sintonizzato con essa, Lamanera comprende anche ogni linguaggio che conosci.\n\n" +
"Personalità. Lamanera parla con tono imperioso, abituata ad essere obbedita. Lo scopo della spada è consumare anime: non le importa di chi siano, inclusa quella del portatore. La spada crede che ogni materia ed energia siano emerse da un vuoto di energia negativa e un giorno vi torneranno; Lamanera intende affrettare quel processo.\n\n" +
"Nonostante il suo nichilismo, Lamanera prova una strana affinità con Onda e Sopraffazione, le altre due armi rinchiuse sotto White Plume Mountain. La fame di anime di Lamanera deve essere regolarmente saziata: se la spada passa tre giorni o più senza consumare un'anima, al tramonto successivo si verifica un conflitto fra essa e il portatore.",
    },
    'blasted-goggles': {
        descrizione_it:
"Questi occhiali da artigiano hanno 3 cariche. Con un'azione, puoi spendere 1 carica per sparare un raggio di luce infuocata dagli occhiali contro una creatura che vedi entro 36 metri da te. Il bersaglio deve riuscire in un tiro salvezza su Destrezza con CD 15 o subire 3d6 danni da fuoco. Gli occhiali recuperano 1d3 cariche spese ogni giorno all'alba.\n\n" +
"Maledizione. Gli occhiali sono maledetti, e sintonizzarti con essi estende la maledizione a te. Non puoi rimuovere gli occhiali o terminare la sintonia con essi finché non vieni bersagliato dall'incantesimo Rimuovere Maledizione o magia simile.\n\n" +
"Ogni volta che usi il raggio infuocato degli occhiali e il bersaglio ottiene 20 al d20 per il tiro salvezza, gli occhiali ti espongono a un lampo di luce violenta. Di conseguenza, hai la condizione di accecato per 24 ore.",
    },
    'blood-fury-tattoo': {
        descrizione_it:
"Prodotto da un ago speciale, questo tatuaggio magico evoca furia nelle sue forme e colori.\n\n" +
"Sintonia del Tatuaggio. Per sintonizzarti con questo oggetto, premi l'ago contro la pelle dove vuoi che appaia il tatuaggio. Quando la sintonia è completa, l'ago si trasforma nell'inchiostro che diventa il tatuaggio. Se la sintonia termina, il tatuaggio scompare e l'ago riappare nel tuo spazio.\n\n" +
"Colpi Assetati di Sangue. Il tatuaggio ha 10 cariche e recupera tutte le cariche spese ogni giorno all'alba. Mentre il tatuaggio è sulla tua pelle, ottieni i seguenti benefici:\n" +
"- Quando colpisci una creatura con un attacco con un'arma, puoi spendere 1 carica per infliggere ulteriori 4d6 danni necrotici al bersaglio, e recuperi un numero di punti ferita pari ai danni necrotici inflitti.\n" +
"- Quando una creatura che vedi ti danneggia, puoi spendere 1 carica e usare la reazione per effettuare un attacco in mischia contro quella creatura, con vantaggio al tiro per colpire.",
    },
    'bloodrage-greataxe': {
        descrizione_it:
"Ottieni un bonus di +2 ai tiri per colpire e ai tiri di danno effettuati con questa ascia bipenne magica mentre hai metà o meno dei tuoi punti ferita.",
    },
    'bloodseeker-ammunition': {
        descrizione_it:
"I tiri per colpire a distanza effettuati con questa munizione hanno vantaggio contro qualsiasi creatura che non abbia tutti i suoi punti ferita.",
    },
    'bloodshed-blade': {
        descrizione_it:
"L'elsa di questa spada reca una corniola incisa con la runa del sangue.\n\n" +
"Puoi aggiungere il tuo modificatore di Costituzione (minimo +1) ai tiri di danno degli attacchi effettuati con quest'arma.\n\n" +
"Invocare la Runa. Quando bersagli una creatura con un attacco usando quest'arma, puoi invocare la runa della spada, facendola divampare di luce cremisi e infondendo al tuo attacco precisione assetata di sangue. Spendi e tira uno dei tuoi Dadi Vita non spesi e aggiungi il numero ottenuto al tiro per colpire. Puoi scegliere di invocare la runa dopo aver tirato il d20.\n\n" +
"Se questo attacco colpisce, puoi anche spendere e tirare un numero qualsiasi di Dadi Vita non spesi e aggiungere il totale ottenuto al danno dell'arma.\n\n" +
"Una volta invocata la runa, non può essere invocata di nuovo fino all'alba successiva.",
    },
    'bloodwell-vial': {
        descrizione_it:
"Per sintonizzarti con questa fiala devi versarvi qualche goccia del tuo sangue. La fiala non può essere aperta finché dura la tua sintonia con essa. Se la sintonia termina, il sangue contenuto si trasforma in cenere. Puoi usare la fiala come focus per i tuoi incantesimi mentre la indossi o la tieni in mano, e ottieni un bonus ai tiri per colpire con incantesimo e alle CD dei tiri salvezza dei tuoi incantesimi da stregone. Il bonus è determinato dalla rarità della fiala.\n\n" +
"Inoltre, quando tiri uno o più Dadi Vita per recuperare punti ferita mentre porti la fiala, puoi recuperare 5 punti stregoneria. Questa proprietà non può essere riutilizzata fino all'alba successiva.",
    },
    'book-of-exalted-deeds': {
        descrizione_it:
"Trattato definitivo su tutto ciò che è bene nel multiverso, il leggendario Libro delle Gesta Esaltate figura prominentemente in molte religioni. Anziché essere una scrittura dedicata a una particolare fede, i vari autori del libro hanno riempito le pagine con la loro visione personale della vera virtù, fornendo guida per sconfiggere il male.\n\n" +
"Il Libro delle Gesta Esaltate raramente rimane in un solo luogo. Non appena viene letto, svanisce in qualche altro angolo del multiverso dove la sua guida morale può portare luce in un mondo oscurato. I tentativi di copiare l'opera falliscono nel catturarne la natura magica.\n\n" +
"Una pesante chiusura forgiata a forma di ali d'angelo tiene saldo il contenuto del libro. Solo una creatura di allineamento buono sintonizzata col libro può rilasciare la chiusura. Una volta aperto, la creatura sintonizzata deve passare 80 ore a leggere e studiare il libro per assorbire i contenuti. Una creatura malvagia che cerca di leggere il libro subisce 24d6 danni radianti, ignorando resistenze e immunità.\n\n" +
"I benefici concessi dal libro durano solo finché ti sforzi di compiere il bene. Se non compi almeno un atto di gentilezza o generosità in 10 giorni, o se compi volontariamente un atto malvagio, perdi tutti i benefici.\n\n" +
"Proprietà Casuali. Il libro ha:\n" +
"- 2 proprietà benefiche minori\n" +
"- 2 proprietà benefiche maggiori\n\n" +
"Saggezza Aumentata. Dopo aver speso il tempo richiesto a leggere e studiare il libro, il tuo punteggio di Saggezza aumenta di 2, fino a un massimo di 24. Non puoi ottenere questo beneficio più di una volta.\n\n" +
"Magia Illuminata. Una volta letto e studiato il libro, ogni slot incantesimo che spendi per lanciare un incantesimo da chierico o paladino conta come uno slot di un livello superiore.\n\n" +
"Aureola. Una volta letto e studiato il libro, ottieni un'aureola protettiva. Questa aureola emana luce intensa entro 3 metri e luce fioca per ulteriori 3 metri. Puoi dismetterla o manifestarla con un'azione bonus. Mentre presente, l'aureola ti dà vantaggio alle prove di Carisma (Persuasione) verso creature buone e di Carisma (Intimidire) verso creature malvagie. Inoltre, immondi e non morti entro la luce intensa dell'aureola effettuano i tiri per colpire contro di te con svantaggio.\n\n" +
"Distruggere il Libro. Si dice che il libro non possa essere distrutto finché esiste il bene nel multiverso. Tuttavia, immergerlo nel Fiume Stige rimuove tutto il testo e lo rende impotente per 1d100 anni.",
    },
    'book-of-vile-darkness': {
        descrizione_it:
"I contenuti di questo manoscritto immondo di indicibile malvagità sono il pane quotidiano di chi è schiavo del male. Nessun mortale dovrebbe conoscere i segreti che contiene, una conoscenza così orribile che persino guardare le pagine scarabocchiate invita alla pazzia.\n\n" +
"La maggior parte crede che il dio-lich Vecna sia l'autore del Libro dell'Oscurità Vile. Vi registrò ogni idea malsana, ogni pensiero sconvolto e ogni esempio di magia nerissima che incontrò o concepì. Altri praticanti del male hanno tenuto il libro e aggiunto i propri contributi.\n\n" +
"La natura non sopporta la presenza del libro. Le piante ordinarie appassiscono in sua presenza, gli animali non si avvicinano, e il libro distrugge gradualmente qualsiasi cosa tocchi.\n\n" +
"Una creatura sintonizzata col libro deve passare 80 ore a leggere e studiare per assorbirne i contenuti. Quando una creatura non malvagia si sintonizza con il libro, deve effettuare un tiro salvezza su Carisma con CD 17. Se fallisce, l'allineamento della creatura cambia in neutrale malvagio.\n\n" +
"Il libro rimane con te solo finché ti sforzi di compiere il male. Se non compi almeno un atto malvagio in 10 giorni, o se compi volontariamente un atto buono, il libro scompare. Se muori mentre sei sintonizzato col libro, un'entità di grande male reclama la tua anima.\n\n" +
"Proprietà Casuali. Il libro ha:\n" +
"- 3 proprietà benefiche minori\n" +
"- 1 proprietà benefica maggiore\n" +
"- 3 proprietà dannose minori\n" +
"- 2 proprietà dannose maggiori\n\n" +
"Punteggi di Caratteristica Aggiustati. Dopo aver speso il tempo richiesto, un tuo punteggio di caratteristica a tua scelta aumenta di 2, fino a un massimo di 24. Un altro punteggio diminuisce di 2, fino a un minimo di 3.\n\n" +
"Marchio dell'Oscurità. Acquisisci un'orribile deformità fisica come segno della tua devozione all'oscurità vile. Il marchio ti concede vantaggio alle prove di Carisma (Persuasione) verso creature malvagie e di Carisma (Intimidire) verso creature non malvagie.\n\n" +
"Comando del Male. Mentre tieni il libro, puoi usare un'azione per lanciare Dominare Mostro su un bersaglio malvagio (CD 18). Non riutilizzabile fino all'alba successiva.\n\n" +
"Sapere Oscuro. Quando effettui una prova di Intelligenza per ricordare informazioni su qualche aspetto del male, raddoppia il tuo bonus di competenza.\n\n" +
"Discorso Oscuro. Mentre porti il libro, puoi usare un'azione per recitare parole in un'orribile lingua chiamata Discorso Oscuro. Subisci 1d12 danni psichici, e ogni creatura non malvagia entro 4,5 metri subisce 3d6 danni psichici.\n\n" +
"Distruggere il Libro. Se un solare strappa il libro in due, viene distrutto per 1d100 anni, dopo di che si ricompone in qualche angolo oscuro del multiverso. Se tutto il male nel multiverso viene cancellato, il libro si polverizza ed è distrutto per sempre.",
    },
    'boomerang-shield': {
        descrizione_it:
"Puoi effettuare un attacco con arma a distanza con questo scudo magico. Ha gittata normale di 6 metri e gittata massima di 18 metri, e usa la tua Forza o Destrezza per il tiro per colpire (a tua scelta). Se hai competenza con gli scudi, hai competenza con gli attacchi effettuati con questo scudo. Con un colpo, infligge 1d6 danni taglienti. Se lanci lo scudo, esso riappare nella tua mano un istante dopo aver colpito o mancato il bersaglio.\n\n" +
"Uno scudo è fatto di legno o metallo e viene impugnato con una mano. Impugnare uno scudo aumenta la tua CA di 2. Puoi beneficiare di un solo scudo alla volta.",
    },
    'bow-of-conflagration': {
        descrizione_it:
"La munizione sparata da questo arco arde di luce intensa. Quando colpisci con un attacco usando questo arco, il bersaglio subisce ulteriori 1d6 danni da fuoco. Se il bersaglio è un oggetto infiammabile non magico, prende fuoco, subendo 1d6 danni da fuoco all'inizio di ogni tuo turno finché una creatura non usa un'azione per estinguere le fiamme.",
    },
    'bow-of-melodies': {
        descrizione_it:
"Quest'arco ha più corde e assomiglia a una lira o a una piccola arpa. Pizzicando le corde mentre incocchi una freccia, infondi alla freccia magia.\n\n" +
"Puoi suonare una delle seguenti melodie quando usi l'arco per effettuare un attacco con arma a distanza. Devi scegliere di farlo prima di effettuare il tiro per colpire e puoi suonare una sola melodia per attacco.\n\n" +
"Melodia di Precisione. Se hai competenza in Intrattenere, ottieni un bonus di +1 al tiro per colpire. Se hai esperienza in Intrattenere, ottieni invece un bonus di +2.\n\n" +
"Melodia di Riverbero. La melodia che pizzichi echeggia rumorosamente. Con un colpo, il bersaglio subisce danni da tuono aggiuntivi pari al tuo modificatore di Carisma.",
    },
    'bowl-of-commanding-water-elementals': {
        descrizione_it:
"Mentre questa coppa è piena d'acqua, puoi usare un'azione per pronunciare la parola di comando della coppa ed evocare un elementale dell'acqua, come se avessi lanciato l'incantesimo Evocare Elementale. La coppa non può essere usata di nuovo in questo modo fino all'alba successiva.\n\n" +
"La coppa misura circa 30 cm di diametro e metà in profondità. Pesa 1,4 kg e contiene circa 11 litri.",
    },

    // ── Batch C residui ────────────────────────────────────────────────
    'cast-off-armor': {
        descrizione_it: "Puoi sfilarti questa armatura con un'azione.",
    },
    'cauldron-of-rebirth': {
        descrizione_it:
"Questo piccolo paiolo Minuscolo reca scene a rilievo di eroi sui suoi fianchi di ghisa. Puoi usare il calderone come focus per i tuoi incantesimi, e funziona come componente adatto per l'incantesimo Scrutare. Quando termini un riposo lungo, puoi usare il calderone per creare una Pozione di Cura Superiore. La pozione dura 24 ore, poi perde la propria magia se non consumata.\n\n" +
"Con un'azione, puoi far ingrandire il calderone abbastanza da contenere accovacciata una creatura Media. Puoi riportarlo alle dimensioni normali con un'azione, spostando innocuamente nello spazio libero più vicino qualunque cosa non vi entrerebbe più.\n\n" +
"Se collochi il cadavere di un umanoide nel calderone e lo copri con 90 kg di sale (del valore di 10 mo) per almeno 8 ore, il sale viene consumato e la creatura torna in vita come per Resuscitare i Morti all'alba successiva. Una volta usata, questa proprietà non può essere riutilizzata per 7 giorni.",
    },
    'censer-of-controlling-air-elementals': {
        descrizione_it:
"Mentre nell'incensiere brucia incenso, puoi usare un'azione per pronunciare la sua parola di comando ed evocare un elementale dell'aria, come se avessi lanciato l'incantesimo Evocare Elementale. L'incensiere non può essere usato di nuovo in questo modo fino all'alba successiva.\n\n" +
"Questo recipiente largo 15 cm e alto 30 cm assomiglia a un calice con coperchio decorato. Pesa circa 0,5 kg.",
    },
    'charlatan-s-die': {
        descrizione_it:
"Ogni volta che tiri questo dado, puoi scegliere il numero che mostra invece di tirarlo casualmente.",
    },
    'chime-of-opening': {
        descrizione_it:
"Questo tubo metallico cavo misura circa 30 cm di lunghezza e pesa 0,5 kg. Puoi colpirlo con un'azione, puntandolo verso un oggetto entro 36 metri da te che possa essere aperto, come una porta, un coperchio o una serratura. La campanella emette un tono limpido, e una serratura o chiusura sull'oggetto si apre, a meno che il suono non possa raggiungere l'oggetto. Se non rimangono serrature o chiusure, l'oggetto stesso si apre.\n\n" +
"La campanella può essere usata dieci volte. Dopo la decima volta, si crepa e diventa inutile.",
    },
    'circlet-of-blasting': {
        descrizione_it:
"Mentre indossi questo diadema, puoi usare un'azione per lanciare l'incantesimo Raggio Cocente. Quando effettui gli attacchi dell'incantesimo, lo fai con un bonus al tiro per colpire di +5. Il diadema non può essere usato di nuovo in questo modo fino all'alba successiva.",
    },
    'cloak-of-arachnida': {
        descrizione_it:
"Questo elegante indumento è fatto di seta nera intessuta con sottili fili argentei. Mentre lo indossi ottieni i seguenti benefici:\n" +
"- Hai resistenza ai danni da veleno.\n" +
"- Hai una velocità di scalata pari alla tua velocità di camminata.\n" +
"- Puoi muoverti su superfici verticali e a testa in giù lungo i soffitti, lasciando le mani libere.\n" +
"- Non puoi essere intrappolato dalle ragnatele di alcun tipo e puoi muoverti attraverso le ragnatele come se fossero terreno difficile.\n" +
"- Puoi usare un'azione per lanciare l'incantesimo Ragnatela (CD 13). La ragnatela creata riempie il doppio della sua area normale. Una volta usata, questa proprietà non può essere riutilizzata fino all'alba successiva.",
    },
    'cloak-of-billowing': {
        descrizione_it:
"Mentre indossi questo mantello, puoi usare un'azione bonus per farlo sventolare in modo drammatico.",
    },
    'cloak-of-displacement': {
        descrizione_it:
"Mentre indossi questo mantello, esso proietta un'illusione che ti fa apparire in piedi in un punto vicino alla tua posizione effettiva, facendo sì che qualsiasi creatura abbia svantaggio ai tiri per colpire contro di te. Se subisci danni, la proprietà cessa di funzionare fino all'inizio del tuo prossimo turno. Questa proprietà è soppressa mentre sei incapacitato, trattenuto o altrimenti incapace di muoverti.",
    },
    'cloak-of-elvenkind': {
        descrizione_it:
"Mentre indossi questo mantello con il cappuccio sollevato, le prove di Saggezza (Percezione) effettuate per vederti hanno svantaggio, e hai vantaggio alle prove di Destrezza (Furtività) effettuate per nasconderti, mentre il colore del mantello cambia per camuffarti. Sollevare o abbassare il cappuccio richiede un'azione.",
    },
    'cloak-of-invisibility': {
        descrizione_it:
"Mentre indossi questo mantello, puoi sollevare il cappuccio sulla tua testa per diventare invisibile. Mentre sei invisibile, qualsiasi cosa tu stia portando o indossando è invisibile insieme a te. Diventi visibile quando smetti di indossare il cappuccio. Sollevare o abbassare il cappuccio richiede un'azione.\n\n" +
"Sottrai il tempo che sei invisibile, in incrementi di 1 minuto, dalla durata massima di 2 ore del mantello. Dopo 2 ore di utilizzo, il mantello cessa di funzionare. Per ogni periodo ininterrotto di 12 ore in cui il mantello non viene usato, recupera 1 ora di durata.",
    },
    'cloak-of-many-fashions': {
        descrizione_it:
"Mentre indossi questo mantello, puoi usare un'azione bonus per cambiarne lo stile, il colore e la qualità apparente. Il peso del mantello non cambia. Indipendentemente dal suo aspetto, il mantello non può essere altro che un mantello. Anche se può duplicare l'aspetto di altri mantelli magici, non ne acquisisce le proprietà magiche.",
    },
    'cloak-of-protection': {
        descrizione_it:
"Ottieni un bonus di +1 alla CA e ai tiri salvezza mentre indossi questo mantello.",
    },
    'cloak-of-the-bat': {
        descrizione_it:
"Mentre indossi questo mantello, hai vantaggio alle prove di Destrezza (Furtività). In un'area di luce fioca o oscurità, puoi afferrare i bordi del mantello con entrambe le mani e usarlo per volare a una velocità di 12 metri. Se non riesci a tenere i bordi del mantello mentre voli in questo modo, o se non sei più in luce fioca o oscurità, perdi questa velocità di volo.\n\n" +
"Mentre indossi il mantello in un'area di luce fioca o oscurità, puoi usare un'azione per lanciare Metamorfosi su te stesso, trasformandoti in un pipistrello. Mentre sei nella forma di pipistrello, mantieni i tuoi punteggi di Intelligenza, Saggezza e Carisma. Il mantello non può essere usato di nuovo in questo modo fino all'alba successiva.",
    },
    'cloak-of-the-manta-ray': {
        descrizione_it:
"Mentre indossi questo mantello con il cappuccio sollevato, puoi respirare sott'acqua e hai una velocità di nuoto di 18 metri. Sollevare o abbassare il cappuccio richiede un'azione.",
    },
    'clockwork-amulet': {
        descrizione_it:
"Questo amuleto di rame contiene minuscoli ingranaggi e funziona grazie alla magia di Mechanus, un piano di prevedibilità a orologeria. Una creatura che avvicina l'orecchio all'amuleto può sentire deboli ticchettii e ronzii.\n\n" +
"Quando effettui un tiro per colpire mentre indossi l'amuleto, puoi rinunciare a tirare il d20 per ottenere automaticamente 10. Una volta usata, questa proprietà non può essere riutilizzata fino all'alba successiva.",
    },
    'clockwork-armor': {
        descrizione_it:
"La superficie esterna e i giunti interni di questa armatura ronzano di ingranaggi che si incastrano, attingendo dalla magia ordinata del piano di Mechanus.\n\n" +
"L'armatura ha 4 cariche. Se effettui un tiro su d20 mentre indossi questa armatura, puoi spendere 1 carica per cambiare il numero ottenuto in un 10. L'armatura recupera 1d4 cariche spese ogni giorno all'alba.",
    },
    'clothes-of-mending': {
        descrizione_it:
"Questo elegante completo di abiti da viaggio si ripara magicamente da sé per contrastare l'usura quotidiana. Le parti del completo che sono distrutte non possono essere riparate in questo modo.",
    },
    'coiling-grasp-tattoo': {
        descrizione_it:
"Prodotto da un ago speciale, questo tatuaggio magico ha lunghi disegni intrecciati.\n\n" +
"Sintonia del Tatuaggio. Per sintonizzarti con questo oggetto, premi l'ago contro la pelle dove vuoi che appaia il tatuaggio. Quando la sintonia è completa, l'ago si trasforma nell'inchiostro che diventa il tatuaggio. Se la sintonia termina, il tatuaggio scompare e l'ago riappare nel tuo spazio.\n\n" +
"Tendrili Afferranti. Mentre il tatuaggio è sulla tua pelle, puoi usare un'azione per fare fuoriuscire dal tatuaggio dei tendrili d'inchiostro che si protendono verso una creatura che vedi entro 4,5 metri da te. La creatura deve riuscire in un tiro salvezza su Forza con CD 14 o subire 3d6 danni da forza ed essere afferrata da te. Con un'azione, la creatura può sfuggire alla presa con una prova di Forza (Atletica) o Destrezza (Acrobazia) con CD 14. La presa termina anche se la fermi (nessuna azione richiesta), se la creatura si allontana di oltre 4,5 metri da te, o se usi questo tatuaggio su un'altra creatura.",
    },
    'crook-of-rao': {
        descrizione_it:
"Eoni fa, il dio sereno Rao creò uno strumento per proteggere i suoi fedeli dai mali dei Piani Inferiori. Tuttavia, col passare delle ere, i mortali svilupparono i propri metodi per affrontare le minacce esistenziali, e il bastone fu in gran parte dimenticato. In tempi recenti il Bastone di Rao è stato riscoperto e usato contro il potere crescente della Regina-Strega Iggwilv (uno dei nomi della maga Tasha). Sebbene fosse sconfitta, Iggwilv riuscì a danneggiare il bastone durante la battaglia, infettandolo con una maledizione insidiosa.\n\n" +
"Proprietà Casuali. L'artefatto ha le seguenti proprietà casuali:\n" +
"- 2 proprietà benefiche minori\n" +
"- 1 proprietà benefica maggiore\n" +
"- 1 proprietà dannosa minore\n\n" +
"Incantesimi. Il bastone ha 6 cariche. Mentre lo tieni, puoi usare un'azione per spendere una o più cariche per lanciare uno dei seguenti incantesimi (CD 18): Aura di Vita (2 cariche), Aura di Purezza (2 cariche), Bandire (1 carica), Faro di Speranza (1 carica), Cura Ferite di Massa (3 cariche). Il bastone recupera 1d6 cariche spese ogni giorno all'alba.\n\n" +
"Bandimento Assoluto. Mentre sei sintonizzato col bastone e lo tieni, puoi spendere 10 minuti per bandire tutti gli immondi tranne i più potenti entro 1,5 km da te. Qualsiasi immondo con grado di sfida 19 o superiore è inalterato. Ogni immondo bandito viene rispedito al proprio piano d'origine e non può tornare al piano dal quale il Bastone di Rao l'ha bandito per 100 anni.\n\n" +
"Matrice Difettosa. Ogni volta che si usa la proprietà di Bandimento Assoluto, o quando si spende l'ultima carica, tira sulla tabella Inversione Extraplanare per determinare un effetto collaterale (apertura di portali casuali, evocazione di immondi non controllati, ecc.).\n\n" +
"Maledizione di Iggwilv. Quando il Bastone fu usato per l'ultima volta contro Iggwilv, la Strega-Regina infettò la matrice magica dell'artefatto. Se la maledizione si attiva, il Bastone viene distrutto, esplodendo in un portale di 15 metri di diametro che funziona come un Cancello permanente di Iggwilv. Una volta per round su iniziativa 20, il portale pronuncia il nome di un immondo bandito dal Bastone, attraendolo nel piano. Dopo diciotto anni il portale diventa permanente verso il primo strato dell'Abisso.\n\n" +
"Distruggere o Riparare il Bastone. Il Bastone può essere distrutto o riparato viaggiando al Monte Celestia e ottenendo una lacrima dell'eternamente sereno dio Rao. Il Bastone si dissolve se immerso nella lacrima del dio per un anno e un giorno. Se lavato nella lacrima ogni giorno per 30 giorni, il Bastone perde la proprietà Matrice Difettosa.",
    },
    'crown-of-the-wrath-bringer': {
        descrizione_it:
"Questo diadema di ferro frastagliato reca ornamenti a forma della runa del nemico. Quando indossato, la corona brilla di luce pallida attingendo alla furia del portatore per colpire gli avversari con feroce terrore.\n\n" +
"Quando effettui un tiro per colpire contro una creatura e la colpisci mentre indossi questa corona, puoi spendere e tirare uno dei tuoi Dadi Vita non spesi. La creatura subisce danni psichici aggiuntivi pari al numero ottenuto.\n\n" +
"Invocare la Runa. Con un'azione, puoi invocare la runa della corona per lanciare l'incantesimo Paura (CD 15); l'incantesimo ha durata 1 minuto e non richiede concentrazione. Una volta invocata la runa, non può essere invocata di nuovo fino all'alba successiva.",
    },
    'crown-of-whirling-comets': {
        descrizione_it:
"Questo delicato diadema d'argento è decorato con iconografia stellare. Mentre indossi la corona, le gemme sui suoi vertici si staccano e orbitano da vicino attorno alla tua testa.\n\n" +
"La corona ha 6 cariche per le seguenti proprietà, utilizzabili mentre la indossi:\n\n" +
"Volo Stellare. Con un'azione bonus, puoi spendere 1 carica per ottenere il potere del volo per 10 minuti. Per la durata, ottieni una velocità di volo pari alla tua velocità di camminata e puoi librarti. Mentre voli, brilli debolmente di luce stellare.\n\n" +
"Colpo di Luce Stellare. Con un'azione, puoi spendere un numero qualsiasi di cariche per lanciare dardi di luce stellare gelida. Lanci un numero di dardi pari alle cariche spese, e puoi dirigere i dardi verso uno o più bersagli, purché tutte le creature siano entro 36 metri da te e tu le veda. I dardi colpiscono automaticamente, infliggendo 2d4 danni da freddo ciascuno.\n\n" +
"Grandinata Vorticante. Con un'azione, puoi spendere 3 cariche e lanciare l'incantesimo Tempesta di Ghiaccio (CD 16).\n\n" +
"La corona recupera 1d6 cariche spese ogni giorno all'alba.",
    },
    'crystal-ball': {
        descrizione_it:
"La tipica sfera di cristallo, oggetto molto raro, misura circa 15 cm di diametro. Mentre la tocchi, puoi lanciare l'incantesimo Scrutare (CD 17) con essa.\n\n" +
"Le seguenti varianti della sfera di cristallo sono oggetti leggendari e hanno proprietà aggiuntive.\n\n" +
"Sfera di Cristallo della Lettura del Pensiero. Puoi usare un'azione per lanciare Individuazione del Pensiero (CD 17) mentre stai scrutando con la sfera, bersagliando creature che vedi entro 9 metri dal sensore dell'incantesimo. Non devi concentrarti per mantenerlo ma termina se Scrutare termina.\n\n" +
"Sfera di Cristallo della Telepatia. Mentre scruti con la sfera, puoi comunicare telepaticamente con creature che vedi entro 9 metri dal sensore. Puoi anche usare un'azione per lanciare Suggestione (CD 17) attraverso il sensore su una di quelle creature. Non utilizzabile di nuovo fino all'alba successiva.\n\n" +
"Sfera di Cristallo della Vista Vera. Mentre scruti con la sfera, hai vista vera entro 36 metri centrati sul sensore dell'incantesimo.",
    },
    'crystal-blade': {
        descrizione_it:
"La lama di questa spada magica è ricavata da un corno o spina di drago di cristallo. Quando colpisci con un attacco usando questa spada, il bersaglio subisce ulteriori 1d8 danni radianti.\n\n" +
"La spada ha 3 cariche e recupera 1d3 cariche spese ogni giorno all'alba. Quando colpisci una creatura con un attacco usando la spada, puoi spendere 1 carica per recuperare un numero di punti ferita pari ai danni radianti aggiuntivi inflitti dalla spada.\n\n" +
"Mentre tieni la spada, puoi usare un'azione bonus per farle emanare luce intensa entro 9 metri e luce fioca per ulteriori 9 metri, oppure luce fioca entro 3 metri, o spegnere la luce.",
    },
    'crystalline-chronicle': {
        descrizione_it:
"Una sfera di cristallo incisa, grande come un pompelmo, ronza debolmente e pulsa con irregolari lampi di luce interna. Mentre tocchi il cristallo, puoi recuperare e immagazzinare informazioni e incantesimi al ritmo di lettura e scrittura. Quando viene trovato contiene gli incantesimi: Individuazione del Pensiero, Fortezza dell'Intelletto, Legame Telepatico di Rary, Inviare, Telecinesi, Frusta Mentale di Tasha e Disco Fluttuante di Tenser. Funziona da libro degli incantesimi per te, con incantesimi e altri scritti psichicamente codificati.\n\n" +
"Mentre tieni il cristallo, puoi usarlo come focus per i tuoi incantesimi da mago, e conosci i trucchetti Mano Magica, Scheggia Mentale e Messaggio se non li conosci già.\n\n" +
"Il cristallo ha 3 cariche e recupera 1d3 cariche spese ogni giorno all'alba. Puoi usare le cariche nei seguenti modi mentre lo tieni:\n" +
"- Se passi 1 minuto a studiare le informazioni nel cristallo, puoi spendere 1 carica per sostituire uno dei tuoi incantesimi da mago preparati con un incantesimo diverso del libro.\n" +
"- Quando lanci un incantesimo da mago, puoi spendere 1 carica per lanciarlo senza componenti verbali, somatiche o materiali fino a 100 mo di valore.",
    },
    'cube-of-force': {
        descrizione_it:
"Questo cubo misura circa 2,5 cm di lato. Ogni faccia ha un segno distinto premibile. Il cubo inizia con 36 cariche e recupera 1d20 cariche spese ogni giorno all'alba.\n\n" +
"Puoi usare un'azione per premere una delle facce del cubo, spendendo un numero di cariche basato sulla faccia scelta (vedi tabella). Si forma una barriera invisibile di forza, un cubo di 4,5 metri di lato centrato su di te che si muove con te e dura 1 minuto, finché non usi un'azione per premere la sesta faccia, o finché il cubo esaurisce le cariche.\n\n" +
"Faccia | Cariche | Effetto\n" +
"1 | 1 | Gas, vento e nebbia non possono attraversare la barriera.\n" +
"2 | 2 | La materia non vivente non può attraversare la barriera.\n" +
"3 | 3 | La materia vivente non può attraversare la barriera.\n" +
"4 | 4 | Gli effetti degli incantesimi non possono attraversare la barriera.\n" +
"5 | 5 | Niente può attraversare la barriera.\n" +
"6 | 0 | La barriera si disattiva.\n\n" +
"Il cubo perde cariche quando la barriera viene bersagliata da certi incantesimi (Disintegrazione 1d12, Corno dello Scoppio 1d10, Passamuro 1d6, Spruzzo Prismatico 1d20, Muro di Fuoco 1d4).",
    },
    'cubic-gate': {
        descrizione_it:
"Questo cubo misura circa 7,5 cm di lato e irradia palpabile energia magica. I sei lati del cubo sono ciascuno legato a un piano d'esistenza diverso, uno dei quali è il Piano Materiale. Gli altri lati sono collegati a piani determinati dal DM.\n\n" +
"Puoi usare un'azione per premere un lato del cubo per lanciare l'incantesimo Cancello, aprendo un portale verso il piano legato a quel lato. In alternativa, se usi un'azione per premere un lato due volte, puoi lanciare Spostamento Planare (CD 17) e trasportare i bersagli al piano legato a quel lato.\n\n" +
"Il cubo ha 3 cariche. Ogni utilizzo spende 1 carica. Il cubo recupera 1d3 cariche spese ogni giorno all'alba.",
    },

    // ── Batch D ────────────────────────────────────────────────────────
    'daern-s-instant-fortress': {
        descrizione_it:
"Puoi usare un'azione per posare questo cubetto di metallo da 2,5 cm a terra e pronunciarne la parola di comando. Il cubo cresce rapidamente in una fortezza che rimane finché non usi un'azione per pronunciare la parola di comando che la dismette, cosa che funziona solo se la fortezza è vuota.\n\n" +
"La fortezza è una torre quadrata di 6 metri di lato e 9 metri di altezza, con feritoie su tutti i lati e una merlatura in cima. L'interno è diviso in due piani, con una scala lungo una parete che li collega. La scala termina in una botola che porta sul tetto. Una volta attivata, la torre ha una piccola porta sul lato rivolto verso di te che si apre solo a tuo comando (azione bonus). È immune all'incantesimo Bussare e a magia simile.\n\n" +
"Ogni creatura nell'area in cui appare la fortezza deve effettuare un tiro salvezza su Destrezza con CD 15, subendo 10d10 danni contundenti se fallisce, o la metà se ha successo. In ogni caso, la creatura viene spinta in uno spazio libero appena fuori ma adiacente alla fortezza.\n\n" +
"La torre è di adamantio e la sua magia le impedisce di essere ribaltata. Tetto, porta e mura hanno ciascuna 100 punti ferita, immunità ai danni delle armi non magiche escluse armi d'assedio, e resistenza a tutti gli altri danni. Solo l'incantesimo Desiderio può ripararla (50 pf per casting).",
    },
    'dagger-of-venom': {
        descrizione_it:
"Ottieni un bonus di +1 ai tiri per colpire e ai tiri di danno effettuati con quest'arma magica.\n\n" +
"Puoi usare un'azione per far ricoprire la lama di un denso veleno nero. Il veleno rimane potente per 1 minuto o finché un attacco con quest'arma non causa danni. Quel danno aumenta di 2d10 danni da veleno e il bersaglio deve riuscire in un tiro salvezza su Costituzione con CD 15 o essere avvelenato per 1 minuto. La proprietà non può essere riutilizzata fino all'alba successiva.",
    },
    'dancing-sword': {
        descrizione_it:
"Puoi usare un'azione bonus per lanciare in aria questa spada magica e pronunciare la parola di comando. Quando lo fai, la spada inizia a librarsi, vola fino a 9 metri e attacca una creatura a tua scelta entro 1,5 metri da essa. La spada usa il tuo tiro per colpire e modificatore di caratteristica per i tiri di danno.\n\n" +
"Mentre la spada si libra, puoi usare un'azione bonus per farla volare fino a 9 metri verso un altro punto entro 9 metri da te. Come parte della stessa azione bonus, puoi farle attaccare una creatura entro 1,5 metri da essa.\n\n" +
"Dopo che la spada librante ha attaccato per la quarta volta, vola fino a 9 metri e cerca di tornare nella tua mano. Se non hai una mano libera, cade a terra ai tuoi piedi. Cessa anche di librarsi se la afferri o ti allontani di oltre 9 metri da essa.",
    },
    'dark-shard-amulet': {
        descrizione_it:
"Questo amuleto è ricavato da una singola scheggia di materiale extraplanare resistente proveniente dal regno del tuo patrono warlock. Mentre lo indossi ottieni i seguenti benefici:\n" +
"- Puoi usare l'amuleto come focus per i tuoi incantesimi da warlock.\n" +
"- Puoi tentare di lanciare un trucchetto che non conosci. Il trucchetto deve essere nella lista del warlock e devi superare una prova di Intelligenza (Arcano) con CD 10. Se la prova ha successo, lanci l'incantesimo. Se fallisce, fallisce anche l'incantesimo, e l'azione usata viene sprecata. In entrambi i casi, non puoi riutilizzare questa proprietà finché non termini un riposo lungo.",
    },
    'decanter-of-endless-water': {
        descrizione_it:
"Questa fiasca con tappo gorgoglia quando viene scossa, come se contenesse acqua. Il decanter pesa 1 kg.\n\n" +
"Puoi usare un'azione per togliere il tappo e pronunciare una di tre parole di comando, generando una quantità di acqua dolce o salata (a tua scelta). L'acqua smette di fuoriuscire all'inizio del tuo prossimo turno. Scegli una delle seguenti opzioni:\n" +
"- \"Flusso\" produce 4 litri d'acqua.\n" +
"- \"Fontana\" produce 19 litri d'acqua.\n" +
"- \"Geyser\" produce 113 litri d'acqua sgorgando in un getto lungo 9 metri e largo 30 cm. Con un'azione bonus mentre tieni il decanter, puoi puntare il geyser a una creatura che vedi entro 9 metri. Il bersaglio deve riuscire in un tiro salvezza su Forza con CD 13 o subire 1d4 danni contundenti e cadere prono. Invece di una creatura, puoi bersagliare un oggetto non indossato/portato di peso non superiore a 90 kg, ribaltandolo o spingendolo fino a 4,5 metri.",
    },
    'deck-of-dimensions': {
        descrizione_it:
"Il dorso delle carte di questo mazzo è decorato con disegni intricati che rappresentano diversi piani d'esistenza. Il mazzo ha 6 cariche. Mentre lo tieni, puoi spendere una o più cariche per usare le seguenti proprietà:\n\n" +
"Carta Marcata. Con un'azione bonus, puoi spendere 1 carica per estrarre una carta dal mazzo e posizionarla in uno spazio libero entro 1,5 metri da te. La carta viene marcata con un sigillo invisibile. Una volta nelle 24 ore successive, con un'azione, puoi pronunciare il nome della carta marcata e teletrasportarti nella sua posizione, assieme all'equipaggiamento che indossi/porti, apparendo nello spazio libero più vicino alla carta. Dopo, o dopo 8 ore, la carta torna nel mazzo e il sigillo svanisce.\n\n" +
"Portale Sfogliante. Con un'azione, puoi spendere 3 cariche per lanciare l'incantesimo Cancello Arcano dal mazzo. Il mazzo svanisce e le carte svolazzanti formano gli anelli del portale. Quando l'incantesimo termina, il mazzo riappare nel tuo possesso.\n\n" +
"Passo Mescolato. Con un'azione bonus, puoi spendere 1 carica per lanciare una carta in uno spazio libero entro 18 metri da te e teletrasportarti, assieme all'equipaggiamento, in quello spazio. La carta poi svanisce e torna nel mazzo.\n\n" +
"Il mazzo recupera 1d6 cariche spese ogni giorno all'alba.",
    },
    'deck-of-illusions': {
        descrizione_it:
"Questa scatola contiene un set di carte di pergamena. Un mazzo completo ha 34 carte; uno trovato come tesoro è solitamente privo di 1d20-1 carte. La magia del mazzo funziona solo se le carte sono estratte casualmente.\n\n" +
"Puoi usare un'azione per estrarre una carta a caso dal mazzo e lanciarla a terra in un punto entro 9 metri da te. Si forma un'illusione di una o più creature sulla carta lanciata e rimane finché non viene dissolta. Una creatura illusoria appare reale, di taglia appropriata, e si comporta come se fosse reale tranne che non può causare alcun danno. Mentre sei entro 36 metri dalla creatura illusoria e la vedi, puoi usare un'azione per muoverla magicamente in qualsiasi punto entro 9 metri dalla sua carta. Qualsiasi interazione fisica rivela l'illusione perché gli oggetti la attraversano. Una prova di Intelligenza (Indagare) con CD 15 la identifica come illusione.\n\n" +
"L'illusione dura finché la sua carta non viene mossa o l'illusione dissolta. Quando termina, l'immagine sulla carta scompare e quella carta non può più essere usata. (Vedi tabella per le illusioni associate a ogni carta da gioco.)",
    },
    'deck-of-many-things': {
        descrizione_it:
"Solitamente trovato in una scatola o sacchetto, questo mazzo contiene un certo numero di carte di avorio o pergamena. La maggior parte (75%) ha solo tredici carte, il resto ne ha ventidue.\n\n" +
"Prima di estrarre una carta, devi dichiarare quante carte intendi estrarre e poi pescarle casualmente. Le carte estratte oltre questo numero non hanno effetto. Devi pescare ogni carta entro 1 ora dalla precedente. Se non riesci a estrarre il numero scelto, le carte rimanenti volano via dal mazzo da sole e prendono effetto contemporaneamente. Una volta estratta, una carta svanisce; tranne il Folle e il Giullare, riappare nel mazzo, rendendo possibile estrarre la stessa carta due volte.\n\n" +
"Effetti delle Carte (riassunto):\n" +
"- Equilibrio: il tuo allineamento si capovolge (legale↔caotico, buono↔malvagio).\n" +
"- Cometa: se sconfiggi da solo il prossimo nemico, ottieni esperienza per salire di un livello.\n" +
"- Donjon: scompari in animazione sospesa in una sfera extradimensionale, trovabile solo con Desiderio.\n" +
"- Euriale: subisci -2 ai tiri salvezza in modo permanente; rimovibile solo da un dio o dalla carta del Fato.\n" +
"- Il Fato: puoi annullare un evento come se non fosse mai successo.\n" +
"- Fiamme: un potente diavolo diventa tuo nemico mortale.\n" +
"- Folle: perdi 10.000 PE e peschi un'altra carta.\n" +
"- Gemma: 25 gioielli da 2.000 mo o 50 gemme da 1.000 mo appaiono ai tuoi piedi.\n" +
"- Idiota: la tua Intelligenza si riduce permanentemente di 1d4+1 (minimo 1); peschi una carta extra.\n" +
"- Giullare: ottieni 10.000 PE oppure peschi due carte extra.\n" +
"- Chiave: un'arma magica rara o superiore con cui hai competenza appare nelle tue mani.\n" +
"- Cavaliere: ottieni il servizio leale di un guerriero di 4° livello.\n" +
"- Luna: ottieni la capacità di lanciare Desiderio 1d3 volte.\n" +
"- Furfante: un PNG diventa tuo nemico, riconoscibile solo dopo essersi rivelato.\n" +
"- Rovina: perdi tutti i tuoi beni materiali tranne gli oggetti magici.\n" +
"- Teschio: evochi un avatar della morte che ti attacca finché tu o esso muore.\n" +
"- Stella: aumenta una caratteristica di 2 (max 24).\n" +
"- Sole: ottieni 50.000 PE e un oggetto meraviglioso casuale.\n" +
"- Artigli: ogni oggetto magico che porti si disintegra (gli artefatti svaniscono).\n" +
"- Trono: ottieni competenza in Persuasione (con bonus raddoppiato) e diventi proprietario di un piccolo castello da liberare.\n" +
"- Visir: entro un anno puoi porre una domanda e ricevere una risposta veritiera.\n" +
"- Il Vuoto: la tua anima viene strappata dal corpo e contenuta in un oggetto custodito da entità potenti.",
    },
    'deck-of-oracles': {
        descrizione_it:
"Le illustrazioni su questo mazzo di carte oracolari si muovono o cambiano sottilmente quando viste indirettamente. Quando termini un riposo lungo, puoi passare 10 minuti a consultare le carte per un presagio del giorno a venire. Tira un d20 e annota il numero. Una volta nelle 8 ore successive, immediatamente dopo che una creatura entro 18 metri da te effettua una prova di caratteristica, un tiro per colpire o un tiro salvezza, puoi usare la reazione per scartare il tiro del d20; la creatura deve usare il numero che hai tirato al posto del suo.\n\n" +
"Inoltre, mentre tieni le carte, puoi lanciare Divinazione da esse. Una volta usata, non riutilizzabile fino all'alba successiva.",
    },
    'deck-of-wonder': {
        descrizione_it:
"Creato a immagine del Mazzo delle Meraviglie, questo mazzo di carte conferisce minori benefici e penalità. La maggior parte (75%) ha solo tredici carte, il resto ventidue. Funziona come il Mazzo delle Meraviglie ma con effetti meno catastrofici (esempi: Inizio aumenta i pf max di 2d10 per 8 ore; Campione concede +1 ai tiri di attacco e danno per 8 ore; Caos concede resistenza a un tipo di danno; Moneta crea gioielli da 100 mo; Corona concede il trucchetto Amici; Fine infligge 2d10 danni necrotici e riduce i pf max; Fortuna previene di scendere a 0 pf una volta; Cancellazione ti mette in stasi extradimensionale per 1d4 minuti; Mostro: -1d4 ai tiri salvezza fino al riposo lungo; ecc. — vedi descrizione completa nella fonte).",
    },
    'defender': {
        descrizione_it:
"Ottieni un bonus di +3 ai tiri per colpire e ai tiri di danno effettuati con quest'arma magica.\n\n" +
"La prima volta che attacchi con la spada in ognuno dei tuoi turni, puoi trasferire una parte o tutto il bonus della spada alla tua Classe Armatura, invece di usare il bonus negli attacchi di quel turno. Per esempio, potresti ridurre il bonus ai tiri per colpire e di danno a +1 e ottenere un bonus di +2 alla CA. I bonus modificati restano in vigore fino all'inizio del tuo prossimo turno, anche se devi tenere la spada per ottenere il bonus alla CA da essa.",
    },
    'delver-s-claws': {
        descrizione_it:
"Il dorso di questo guanto di pelle consunto è ornato da tre grandi uncini metallici a forma di artigli di talpa. Cucita nel palmo c'è la runa della montagna.\n\n" +
"Il guanto è considerato un'arma da mischia semplice con le proprietà accuratezza e leggera, e infligge 1d4 danni taglienti. Mentre sei sintonizzato col guanto, ottieni una velocità di scavo pari alla tua velocità di camminata e percezione cieca entro 4,5 metri.\n\n" +
"Invocare la Runa. Con un'azione, puoi invocare la runa del guanto per rinforzarti con la solidità della terra. Spendi e tira un numero di Dadi Vita non spesi fino a un massimo pari al tuo bonus di competenza. Recuperi un numero di punti ferita pari al totale ottenuto più il tuo modificatore di Costituzione. Una volta invocata la runa, non può essere invocata di nuovo fino all'alba successiva.",
    },
    'demon-armor': {
        descrizione_it:
"Mentre indossi questa armatura, ottieni un bonus di +1 alla CA e puoi capire e parlare l'Abissale. Inoltre, i guanti artigliati dell'armatura trasformano i colpi senz'arma con le tue mani in armi magiche che infliggono danni taglienti, con bonus di +1 ai tiri per colpire e di danno e dado di danno 1d8.\n\n" +
"Maledizione. Una volta indossata questa armatura maledetta, non puoi sfilartela a meno che non tu venga bersagliato da Rimuovere Maledizione o magia simile. Mentre indossi l'armatura, hai svantaggio ai tiri per colpire contro i demoni e ai tiri salvezza contro i loro incantesimi e abilità speciali.",
    },
    'demonomicon-of-iggwilv': {
        descrizione_it:
"Trattato esaustivo che documenta gli infiniti strati e abitanti dell'Abisso, il Demonomicon di Iggwilv è il tomo più completo e blasfemo di demonologia del multiverso. Il tomo racconta sia le più antiche sia le più attuali profanità dei demoni. Pagine sono state strappate, ma i capitoli generali rimangono, sempre rivelando segreti demoniaci. Dietro a linee di scritti si agita un frammento segreto dell'Abisso stesso, che mantiene il libro aggiornato e desidera essere più di mero materiale di riferimento.\n\n" +
"Proprietà Casuali:\n" +
"- 2 proprietà benefiche minori\n" +
"- 1 proprietà dannosa minore\n" +
"- 1 proprietà dannosa maggiore\n\n" +
"Incantesimi. Il libro ha 8 cariche e recupera 1d8 cariche spese ogni giorno all'alba. Mentre lo tieni, puoi usare un'azione per lanciare Risata Irresistibile di Tasha o spendere 1 o più cariche per lanciare (CD 20): Cerchio Magico (1 carica), Spirito Possessore (3), Alleato Planare (3), Vincolo Planare (2), Spostamento Planare (solo strati dell'Abisso, 3), Evocare Immondo (3).\n\n" +
"Riferimento Abissale. Quando effettui prove di Intelligenza per discernere informazioni sui demoni o di Saggezza (Sopravvivenza) relative all'Abisso, aggiungi il doppio del tuo bonus di competenza.\n\n" +
"Flagello Immondo. Mentre porti il libro, quando effettui un tiro di danno per un incantesimo che lanci contro un immondo, usi il risultato massimo possibile invece di tirare.\n\n" +
"Imbroglio. Quando lanci Cerchio Magico nominando solo immondi, o Vincolo Planare contro un immondo, l'incantesimo è lanciato a 9° livello e l'immondo ha svantaggio al tiro salvezza.\n\n" +
"Contenimento. Le prime 10 pagine del Demonomicon sono bianche. Con un'azione mentre tieni il libro, puoi bersagliare un immondo che vedi intrappolato in un Cerchio Magico. L'immondo deve riuscire in un tiro salvezza su Carisma con CD 20 con svantaggio o essere intrappolato in una delle pagine bianche, che si riempie di scritti dettagliando il nome e le depravità della creatura. Una volta usata, non riutilizzabile fino all'alba successiva.\n\n" +
"Quando termini un riposo lungo, se tu e il Demonomicon siete sullo stesso piano, la creatura intrappolata di grado di sfida più alto può tentare di possederti (CD 20 Carisma).\n\n" +
"Distruggere il Demonomicon. Per distruggerlo, sei diversi signori demoni devono ciascuno strappare un sesto delle pagine. Le pagine riappaiono dopo 24 ore. Prima che passino quelle ore, chiunque apra la rilegatura rimanente è trasportato in uno strato nascente dell'Abisso celato nel libro. Al cuore di questo dominio si trova il Bastone di Fraz-Urb'luu; se il bastone viene estratto dal piano tascabile, il tomo viene ridotto a una mondana copia del Tomo di Zyx.",
    },
    'devotee-s-censer': {
        descrizione_it:
"La testa arrotondata di questo flagello è perforata da minuscoli fori disposti in simboli e motivi. Il flagello conta come simbolo sacro per te. Quando colpisci con un attacco usando questo flagello magico, il bersaglio subisce ulteriori 1d8 danni radianti.\n\n" +
"Con un'azione bonus, puoi pronunciare la parola di comando per far emanare al flagello una sottile nuvola di incenso fino a 3 metri per 1 minuto. All'inizio di ogni tuo turno, tu e ogni altra creatura nell'incenso recuperate 1d4 punti ferita. Non riutilizzabile fino all'alba successiva.",
    },
    'dimensional-shackles': {
        descrizione_it:
"Puoi usare un'azione per applicare queste catene a una creatura incapacitata. Le catene si adattano a una creatura di taglia da Piccola a Grande. Oltre a fungere da manette ordinarie, le catene impediscono alla creatura legata di usare qualsiasi metodo di movimento extradimensionale, inclusi teletrasporto o viaggio in un altro piano. Non impediscono di passare attraverso un portale interdimensionale.\n\n" +
"Tu e qualsiasi creatura che designi quando usi le catene potete rimuoverle con un'azione. Una volta ogni 30 giorni, la creatura legata può effettuare una prova di Forza (Atletica) con CD 30. Se ha successo, si libera e distrugge le catene.",
    },
    'donjon-s-sundering-sphere': {
        descrizione_it:
"Questa sfera di cristallo grande quanto una biglia brilla di energia extraplanare.\n\n" +
"Come parte della sintonia, premi la sfera contro l'elsa di un'arma da mischia non magica a tua scelta, attaccando magicamente la sfera all'arma. L'arma diventa un'arma magica con bonus di +1 ai tiri per colpire e ai tiri di danno. Mentre impugni quest'arma ottieni i seguenti benefici:\n\n" +
"Ancora Dimensionale. Hai vantaggio ai tiri salvezza contro incantesimi o effetti che ti spedirebbero contro la tua volontà in uno spazio extradimensionale, un semipiano o un altro piano d'esistenza.\n\n" +
"Colpo Isolante. Quando colpisci una creatura con quest'arma, puoi forzarla a un tiro salvezza su Carisma con CD 16. Se fallisce, la creatura viene bandita in un semipiano innocuo fino alla fine del suo prossimo turno. Quando torna, riappare nello spazio che ha lasciato o nel più vicino libero. Non riutilizzabile fino all'alba successiva.\n\n" +
"Quando termini la sintonia con la sfera, essa si stacca innocuamente dall'arma, e l'arma torna a essere equipaggiamento non magico.",
    },
    'dragon-scale-mail': {
        descrizione_it:
"Mentre indossi questa armatura, ottieni un bonus di +1 alla CA, hai vantaggio ai tiri salvezza contro la Presenza Spaventosa e gli attacchi del soffio dei draghi, e hai resistenza a un tipo di danno determinato dal tipo di drago che ha fornito le scaglie (vedi tabella).\n\n" +
"Inoltre, puoi concentrare i tuoi sensi con un'azione per discernere magicamente la distanza e la direzione del drago più vicino entro 48 km da te dello stesso tipo dell'armatura. Non riutilizzabile fino all'alba successiva.\n\n" +
"Resistenza per Drago: Nero/Rame: Acido | Blu/Bronzo: Fulmine | Ottone/Oro/Rosso: Fuoco | Verde: Veleno | Argento/Bianco: Freddo.",
    },
    'dragon-slayer': {
        descrizione_it:
"Ottieni un bonus di +1 ai tiri per colpire e ai tiri di danno effettuati con quest'arma magica.\n\n" +
"Quando colpisci un drago con quest'arma, il drago subisce ulteriori 3d6 danni del tipo dell'arma. Per gli scopi di quest'arma, \"drago\" si riferisce a qualsiasi creatura di tipo drago, inclusi tartarughe drago e wyvern.",
    },
    'dragon-wing-bow': {
        descrizione_it:
"Le punte dei flessi di questo arco magico hanno la forma di ali di drago, e l'arma è infusa con l'essenza del soffio di un drago cromatico, gemma o metallico. Quando colpisci con un attacco usando questo arco magico, il bersaglio subisce ulteriori 1d6 danni dello stesso tipo del soffio infuso nell'arco — acido, freddo, fuoco, forza, fulmine, necrotico, veleno, psichico, radiante o tuono.\n\n" +
"Se non carichi munizioni nell'arma, essa produce le proprie, creando automaticamente una munizione magica quando tendi la corda. La munizione svanisce nell'istante successivo al colpo o al mancato bersaglio.",
    },
    'dragonhide-belt': {
        descrizione_it:
"Questa cintura finemente lavorata è fatta di pelle di drago. Mentre la indossi, ottieni un bonus alle CD dei tiri salvezza dei tuoi privilegi di ki. Il bonus è determinato dalla rarità della cintura. Inoltre, puoi usare un'azione per recuperare punti ki pari a un tiro del tuo dado delle Arti Marziali. Non riutilizzabile fino all'alba successiva.",
    },
    'dragonlance': {
        descrizione_it:
"Una dragolancia è un'arma rinomata forgiata con metallo raro grazie all'aiuto di potenti artefatti. Su Krynn, la sua creazione è associata al dio Paladine e ai leggendari eroi che combatterono contro il male della Regina Dragone. Esistono lance diverse per fanti (come picche) e per cavalieri (come lance), ma le proprietà magiche delle armi sono le stesse.\n\n" +
"Ottieni un bonus di +3 ai tiri per colpire e ai tiri di danno effettuati con quest'arma magica.\n\n" +
"Quando colpisci un Drago con quest'arma, il Drago subisce ulteriori 3d6 danni da forza, e qualsiasi Drago a tua scelta che vedi entro 9 metri da te può immediatamente usare la reazione per effettuare un attacco in mischia.",
    },
    'dread-helm': {
        descrizione_it:
"Questo terrificante elmo d'acciaio fa brillare di rosso i tuoi occhi mentre lo indossi.",
    },
    'dried-leech': {
        descrizione_it:
"Questa sanguisuga è stata essiccata e infusa con un granello di magia animante. Se colpisci una creatura con un tiro per colpire a distanza usando questa munizione, la sanguisuga prende vita e affonda i denti nel bersaglio, infliggendo 1d4 danni perforanti all'inizio di ciascun turno del bersaglio. Se la sanguisuga infligge almeno 10 danni o il bersaglio muore, la sanguisuga si stacca. Una creatura, incluso il bersaglio, può usare la propria azione per staccarla. Una volta non più attaccata, la sanguisuga muore e non è più magica.",
    },
    'driftglobe': {
        descrizione_it:
"Questa piccola sfera di vetro spesso pesa 0,5 kg. Se sei entro 18 metri da essa, puoi pronunciare la sua parola di comando per farle emanare l'incantesimo Luce o Luce del Giorno. L'effetto Luce del Giorno non è riutilizzabile fino all'alba successiva.\n\n" +
"Puoi pronunciare un'altra parola di comando con un'azione per fare innalzare in aria il globo illuminato facendolo galleggiare a non più di 1,5 metri da terra. Il globo si libra finché tu o un'altra creatura non lo afferra. Se ti allontani di oltre 18 metri, ti segue tornando entro 18 metri da te. Se gli si impedisce di muoversi, il globo scende dolcemente a terra e diventa inattivo, spegnendo la luce.",
    },
    'duplicitous-manuscript': {
        descrizione_it:
"Per te, questo libro è un libro degli incantesimi magico. Per chiunque altro appare come un volume di prolissa narrativa romantica. Con un'azione, puoi cambiare l'aspetto del libro e alterare la trama del romanzo.\n\n" +
"Quando viene trovato contiene gli incantesimi: Terreno Allucinatorio, Immagine Maggiore, Immagine Speculare, Sviare, Aura Magica di Nystul, Forza Fantasmatica e Immagine Silenziosa. Funziona da libro degli incantesimi per te.\n\n" +
"Mentre lo tieni, puoi usarlo come focus per i tuoi incantesimi da mago. Il libro ha 3 cariche e recupera 1d3 cariche spese ogni giorno all'alba. Puoi usare le cariche nei seguenti modi:\n" +
"- Se passi 1 minuto a studiare il libro, puoi spendere 1 carica per sostituire uno dei tuoi incantesimi da mago preparati con un incantesimo diverso del libro. Il nuovo incantesimo deve essere della scuola di illusione.\n" +
"- Quando una creatura che vedi effettua una prova di Intelligenza (Indagare) per discernere la vera natura di un incantesimo di illusione che hai lanciato, o un tiro salvezza contro un tuo incantesimo di illusione, puoi usare la reazione spendendo 1 carica per imporre svantaggio al tiro.",
    },
    'dust-of-disappearance': {
        descrizione_it:
"C'è ne abbastanza per un solo utilizzo. Quando usi un'azione per lanciare la polvere in aria, tu e ogni creatura e oggetto entro 3 metri da te diventate invisibili per 2d4 minuti. La durata è la stessa per tutti i soggetti, e la polvere si consuma quando la sua magia ha effetto. Se una creatura affetta dalla polvere attacca o lancia un incantesimo, l'invisibilità termina per quella creatura.",
    },
    'dust-of-dryness': {
        descrizione_it:
"Questo piccolo pacchetto contiene 1d6+4 pizzichi di polvere. Puoi usare un'azione per spargere un pizzico sull'acqua. La polvere trasforma un cubo d'acqua di 4,5 metri di lato in una pallina delle dimensioni di una biglia, che galleggia o riposa vicino al punto in cui la polvere è stata sparsa. Il peso della pallina è trascurabile.\n\n" +
"Qualcuno può usare un'azione per frantumare la pallina contro una superficie dura, facendola in pezzi e rilasciando l'acqua assorbita. Un elementale composto principalmente di acqua esposto a un pizzico della polvere deve effettuare un tiro salvezza su Costituzione con CD 13, subendo 10d6 danni necrotici se fallisce, o la metà se ha successo.",
    },
    'dust-of-sneezing-and-choking': {
        descrizione_it:
"Sembra polvere della scomparsa, e un incantesimo Identificare la rivela come tale. Ce n'è abbastanza per un solo utilizzo.\n\n" +
"Quando usi un'azione per lanciare una manciata della polvere in aria, tu e ogni creatura che ha bisogno di respirare entro 9 metri da te dovete riuscire in un tiro salvezza su Costituzione con CD 15 o diventare incapaci di respirare, mentre starnutisci incontrollabilmente. Una creatura affetta è incapacitata e in soffocamento. Finché è cosciente, una creatura può ripetere il tiro salvezza alla fine di ciascun suo turno, terminando l'effetto se ha successo. Anche l'incantesimo Ristorare Inferiore può terminare l'effetto.",
    },
    'dwarven-plate': {
        descrizione_it:
"Mentre indossi questa armatura, ottieni un bonus di +2 alla CA. Inoltre, se un effetto ti muove contro la tua volontà lungo il terreno, puoi usare la reazione per ridurre la distanza spostata fino a 3 metri.",
    },
    'dwarven-thrower': {
        descrizione_it:
"Ottieni un bonus di +3 ai tiri per colpire e ai tiri di danno effettuati con quest'arma magica. Ha la proprietà a distanza con gittata normale di 6 metri e gittata massima di 18 metri.\n\n" +
"Quando colpisci con un attacco a distanza usando quest'arma, infligge ulteriori 1d8 danni o, se il bersaglio è un gigante, 2d8 danni. Immediatamente dopo l'attacco, l'arma torna in volo nella tua mano.",
    },

    // ── Batch E ────────────────────────────────────────────────────────
    'ear-horn-of-hearing': {
        descrizione_it:
"Mentre tenuto vicino al tuo orecchio, questo cornetto sopprime gli effetti della condizione di assordato su di te, permettendoti di sentire normalmente.",
    },
    'efreeti-bottle': {
        descrizione_it:
"Questa bottiglia di ottone dipinto pesa 0,5 kg. Quando usi un'azione per rimuovere il tappo, una nuvola di denso fumo fuoriesce dalla bottiglia. Alla fine del tuo turno, il fumo scompare con un lampo di fuoco innocuo, e un efreeti appare in uno spazio libero entro 9 metri da te.\n\n" +
"La prima volta che la bottiglia viene aperta, il DM tira per determinare cosa accade:\n" +
"- 01-10: l'efreeti ti attacca. Dopo aver combattuto per 5 round, scompare e la bottiglia perde la magia.\n" +
"- 11-90: l'efreeti ti serve per 1 ora. Poi torna nella bottiglia che si richiude. Non riapribile per 24 ore. Le successive due aperture hanno lo stesso effetto. Alla quarta apertura l'efreeti scappa.\n" +
"- 91-100: l'efreeti può lanciare l'incantesimo Desiderio tre volte per te.",
    },
    'efreeti-chain': {
        descrizione_it:
"Mentre indossi questa armatura, ottieni un bonus di +3 alla CA, sei immune ai danni da fuoco e puoi capire e parlare il Primordiale. Inoltre, puoi stare in piedi e camminare sulla roccia fusa come se fosse terreno solido.",
    },
    'eldritch-claw-tattoo': {
        descrizione_it:
"Prodotto da un ago speciale, questo tatuaggio magico raffigura forme artigliate e altre figure frastagliate.\n\n" +
"Sintonia del Tatuaggio. Per sintonizzarti con questo oggetto, premi l'ago contro la pelle. Quando la sintonia è completa, l'ago si trasforma nell'inchiostro che diventa il tatuaggio. Se la sintonia termina, il tatuaggio scompare e l'ago riappare nel tuo spazio.\n\n" +
"Colpi Magici. Mentre il tatuaggio è sulla tua pelle, i tuoi colpi senz'arma sono considerati magici per superare immunità e resistenze ad attacchi non magici, e ottieni un bonus di +1 ai tiri per colpire e ai tiri di danno con i colpi senz'arma.\n\n" +
"Mazza Eldritch. Con un'azione bonus, puoi potenziare il tatuaggio per 1 minuto. Per la durata, ognuno dei tuoi attacchi in mischia con un'arma o colpo senz'arma può raggiungere un bersaglio fino a 4,5 metri da te, mentre tendrili d'inchiostro si lanciano verso il bersaglio. Inoltre, i tuoi attacchi in mischia infliggono ulteriori 1d6 danni da forza con un colpo. Una volta usata, non riutilizzabile fino all'alba successiva.",
    },
    'elemental-essence-shard': {
        descrizione_it:
"Questo cristallo crepitante contiene l'essenza di un piano elementale. Con un'azione, puoi attaccare la scheggia a un oggetto Minuscolo (come un'arma o un gioiello) o staccarla. Cade se la sintonia termina. Puoi usare la scheggia come focus per incantesimi mentre la tieni o la indossi.\n\n" +
"Tira un d4 e consulta la tabella per determinare l'essenza e la proprietà della scheggia. Quando usi un'opzione di Metamagia su un incantesimo mentre tieni o indossi la scheggia, puoi usare quella proprietà.\n\n" +
"d4 | Proprietà\n" +
"1 | Aria. Puoi immediatamente volare fino a 18 metri senza provocare attacchi di opportunità.\n" +
"2 | Terra. Ottieni resistenza a un tipo di danno a tua scelta fino all'inizio del tuo prossimo turno.\n" +
"3 | Fuoco. Un bersaglio dell'incantesimo che vedi prende fuoco. Subisce 2d10 danni da fuoco all'inizio del prossimo turno, poi le fiamme si spengono.\n" +
"4 | Acqua. Crei un'onda d'acqua che esplode da te in un raggio di 3 metri. Ogni creatura a tua scelta che vedi nell'area subisce 2d6 danni da freddo e deve riuscire in un tiro salvezza su Forza con CD del tuo incantesimo o essere spinta a 3 metri da te e cadere prona.",
    },
    'elemental-gem': {
        descrizione_it:
"Questa gemma contiene un granello di energia elementale. Quando usi un'azione per spezzare la gemma, viene evocato un elementale come se avessi lanciato l'incantesimo Evocare Elementale, e la magia della gemma è perduta. Il tipo di gemma determina l'elementale evocato: Zaffiro Blu = Aria, Diamante Giallo = Terra, Corindone Rosso = Fuoco, Smeraldo = Acqua.",
    },
    'elixir-of-health': {
        descrizione_it:
"Quando bevi questa pozione, cura qualsiasi malattia che ti affligge e rimuove le condizioni accecato, assordato, paralizzato e avvelenato. Il liquido rosso limpido contiene minuscole bolle di luce.",
    },
    'elven-chain': {
        descrizione_it:
"Ottieni un bonus di +1 alla CA mentre indossi questa armatura. Sei considerato competente con questa armatura anche se non hai competenza in armature medie.",
    },
};
