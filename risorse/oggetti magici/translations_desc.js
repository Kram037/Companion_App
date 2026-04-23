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

    // ── Voci C residue (candele e accessori) ───────────────────────────
    'candle-of-invocation': {
        descrizione_it:
"Questo cero affusolato è dedicato a una divinità e ne condivide l'allineamento. L'allineamento della candela può essere rilevato con l'incantesimo Individuazione del Bene e del Male. Il DM sceglie il dio e l'allineamento associato o lo determina casualmente (vedi tabella d20).\n\n" +
"La magia della candela si attiva quando viene accesa, cosa che richiede un'azione. Dopo aver bruciato per 4 ore, la candela viene distrutta. Puoi spegnerla in anticipo per usarla in un secondo momento, sottraendo il tempo bruciato in incrementi di 1 minuto dalla durata totale.\n\n" +
"Mentre è accesa, la candela emana luce fioca entro 9 metri. Qualsiasi creatura entro quella luce il cui allineamento corrisponda a quello della candela effettua i tiri per colpire, i tiri salvezza e le prove di caratteristica con vantaggio. Inoltre, un chierico o druido nella luce con allineamento corrispondente può lanciare incantesimi di 1° livello che ha preparato senza spendere slot incantesimo, anche se l'effetto è come lanciato con slot di 1° livello.\n\n" +
"In alternativa, quando accendi la candela per la prima volta, puoi lanciare l'incantesimo Cancello con essa. Farlo distrugge la candela.",
    },
    'candle-of-the-deep': {
        descrizione_it:
"La fiamma di questa candela non si estingue quando viene immersa nell'acqua. Emana luce e calore come una candela normale.",
    },
    'cap-of-water-breathing': {
        descrizione_it:
"Mentre indossi questo cappuccio sott'acqua, puoi pronunciarne la parola di comando con un'azione per creare una bolla d'aria attorno alla tua testa. Ti permette di respirare normalmente sott'acqua. La bolla rimane con te finché non pronunci di nuovo la parola di comando, finché il cappuccio non viene rimosso, o finché non sei più sott'acqua.",
    },
    'cape-of-the-mountebank': {
        descrizione_it:
"Questo mantello emana un debole odore di zolfo. Mentre lo indossi, puoi usarlo per lanciare l'incantesimo Porta Dimensionale con un'azione. Non riutilizzabile fino all'alba successiva.\n\n" +
"Quando scompari, lasci dietro di te una nuvola di fumo e appari in una nuvola di fumo simile a destinazione. Il fumo oscura leggermente lo spazio che hai lasciato e quello in cui appari, dissipandosi alla fine del tuo prossimo turno. Un vento leggero o più forte disperde il fumo.",
    },
    'card-sharp-s-deck': {
        descrizione_it:
"Le carte di questo mazzo brillano lungo i bordi. Mentre lo tieni, puoi usare le seguenti proprietà:\n\n" +
"Affare Mortale. Con un'azione, puoi usare questo mazzo per effettuare un attacco con incantesimo a distanza lanciando una carta spettrale e usando Destrezza per il tiro per colpire. La carta ha gittata di 36 metri e infligge 1d8 danni da forza con un colpo.\n\n" +
"Pioggia di Carte. Con un'azione, puoi mescolare il mazzo e lanciare l'incantesimo Pioggia di Carte al 3° livello dal mazzo (CD 15). Una volta che il mazzo ha lanciato l'incantesimo, non può lanciarlo di nuovo fino all'alba successiva.",
    },
    'carpet-of-flying': {
        descrizione_it:
"Puoi pronunciare la parola di comando del tappeto con un'azione per farlo librare e volare. Si muove secondo le tue direzioni vocali, purché tu sia entro 9 metri da esso.\n\n" +
"Esistono quattro taglie di tappeto volante. Il DM ne sceglie la taglia o la determina casualmente:\n" +
"- 1×1,5 m: capacità 90 kg, velocità di volo 24 m\n" +
"- 1,2×1,8 m: capacità 180 kg, velocità di volo 18 m\n" +
"- 1,5×2,1 m: capacità 270 kg, velocità di volo 12 m\n" +
"- 1,8×2,7 m: capacità 360 kg, velocità di volo 9 m\n\n" +
"Un tappeto può portare fino al doppio del peso indicato in tabella, ma vola a metà velocità se trasporta più della sua capacità normale.",
    },

    // ── Batch E residui ────────────────────────────────────────────────
    'emerald-pen': {
        descrizione_it:
"Questa penna ha un pennino di smeraldo e non richiede inchiostro per scrivere. Mentre la tieni, puoi lanciare a volontà Scrittura Illusoria, senza componenti materiali.",
    },
    'enduring-spellbook': {
        descrizione_it:
"Questo libro degli incantesimi, e tutto ciò che è scritto sulle sue pagine, non può essere danneggiato dal fuoco o dall'immersione in acqua. Inoltre, il libro non si deteriora con l'età.",
    },
    'ersatz-eye': {
        descrizione_it:
"Questo occhio artificiale sostituisce uno reale che è andato perduto o è stato rimosso. Mentre l'occhio surrogato è incassato nella tua orbita, non può essere rimosso da nessuno tranne te, e puoi vedere attraverso il piccolo globo come se fosse un occhio normale.",
    },
    'euryale-s-aegis': {
        descrizione_it:
"Questo lucente scudo di ottone reca un rilievo della leggendaria druida medusa Euriale.\n\n" +
"Mentre impugni questo scudo ottieni i seguenti benefici:\n\n" +
"Benedizione di Euriale. Hai resistenza ai danni da veleno e sei immune alla condizione di pietrificato.\n\n" +
"Araldica Pietrificante. Con un'azione bonus, puoi far divampare il fronte dello scudo con la magia pietrificante di una medusa, facendo brillare gli occhi del rilievo. Scegli una creatura che vedi entro 9 metri da te. La creatura deve riuscire in un tiro salvezza su Costituzione con CD 20, o ottiene la condizione di trattenuto mentre il suo corpo si trasforma in pietra. La creatura trattenuta deve effettuare un altro tiro salvezza su Costituzione con CD 20 all'inizio del suo prossimo turno. Se fallisce, ottiene la condizione di pietrificato per 24 ore. Se ha successo, la condizione di trattenuto termina. Non riutilizzabile fino all'alba successiva.\n\n" +
"Incantesimi. Mentre impugni lo scudo, puoi usare un'azione per lanciare uno dei seguenti incantesimi: Ristorare Inferiore, Localizzare Creatura, Trasporto Vegetale. Una volta usato per lanciare un incantesimo, lo scudo non può lanciare quell'incantesimo di nuovo fino all'alba successiva.",
    },
    'eversmoking-bottle': {
        descrizione_it:
"Da questa bottiglia di ottone fuoriesce continuamente una densa nuvola di fumo che oscura completamente le aree entro 18 metri. La nuvola persiste finché la bottiglia rimane aperta. Chiudere la bottiglia richiede di pronunciarne la parola di comando con un'azione. Una volta chiusa, la nuvola si dissolve dopo 10 minuti. Un vento moderato (18-32 km/h) può disperdere il fumo dopo 1 minuto, e un vento forte (33+ km/h) dopo 1 round.",
    },
    'eye-and-hand-of-vecna': {
        descrizione_it:
"Pochi pronunciano il suo nome senza paura o sussurri. Egli era il Sussurrato, il Maestro del Trono Ragno, il Re Senza Morte e il Signore della Torre Putrefatta. Si dice che il luogotenente di Vecna, Kas, bramasse il Trono Ragno per sé, o che la spada che il suo signore forgiò per lui lo sedusse alla ribellione. Qualunque sia la ragione, Kas pose fine al regno del Re Senza Morte in una terribile battaglia che lasciò la torre di Vecna ridotta a un cumulo di cenere. Di Vecna rimasero solo una mano e un occhio, raccapriccianti artefatti che ancora cercano di compiere la volontà del Sussurrato.\n\n" +
"L'Occhio e la Mano di Vecna possono essere trovati insieme o separatamente. L'occhio appare come un organo iniettato di sangue strappato dalla sua orbita. La mano è un'estremità sinistra mummificata e raggrinzita.\n\n" +
"Per sintonizzarti con l'occhio, devi cavarti il tuo stesso occhio e premere l'artefatto nell'orbita vuota. L'occhio si innesta sulla tua testa e vi rimane finché non muori. Una volta in posizione, si trasforma in un occhio dorato con pupilla a fessura. Se l'occhio viene mai rimosso, muori.\n\n" +
"Per sintonizzarti con la mano, devi mozzarti la mano sinistra al polso e premere l'artefatto contro il moncone. La mano si innesta al tuo braccio e diventa un'appendice funzionante. Se la mano viene mai rimossa, muori.\n\n" +
"Proprietà Casuali. L'Occhio e la Mano di Vecna hanno ciascuno: 1 proprietà benefica minore, 1 proprietà benefica maggiore, 1 proprietà dannosa minore.\n\n" +
"Proprietà dell'Occhio. Il tuo allineamento cambia in neutrale malvagio. Hai vista vera. Puoi usare un'azione per vedere come se indossassi un anello di vista a raggi X (terminabile come azione bonus). L'occhio ha 8 cariche; con un'azione e spendendo cariche puoi lanciare (CD 18): Chiaroveggenza (2), Corona della Pazzia (1), Disintegrazione (4), Dominare Mostro (5), Occhio Malvagio (4). Recupera 1d4+4 cariche all'alba. Ogni volta che lanci un incantesimo dall'occhio, c'è 5% di probabilità che Vecna ti strappi l'anima dal corpo, la divori e prenda il controllo del tuo corpo come una marionetta — diventi un PNG sotto il controllo del DM.\n\n" +
"Proprietà della Mano. Il tuo allineamento cambia in neutrale malvagio. Il tuo punteggio di Forza diventa 20, a meno che non sia già 20 o superiore. La mano consente di lanciare diversi incantesimi simili all'occhio (vedi descrizione completa nel manuale). Anch'essa ha la possibilità che Vecna prenda controllo.\n\n" +
"Distruggere l'Occhio e la Mano. Se entrambi sono detenuti dalla stessa creatura e quella creatura viene uccisa con la spada di Kas, sia l'occhio che la mano vengono distrutti.",
    },
    'eyes-of-charming': {
        descrizione_it:
"Queste lenti di cristallo si applicano sopra gli occhi e hanno 3 cariche. Mentre le indossi, puoi spendere 1 carica con un'azione per lanciare l'incantesimo Charme su Persone (CD 13) su un umanoide entro 9 metri da te, purché tu e l'umanoide possiate vedervi. Le lenti recuperano tutte le cariche spese ogni giorno all'alba.",
    },
    'eyes-of-minute-seeing': {
        descrizione_it:
"Queste lenti di cristallo si applicano sopra gli occhi. Mentre le indossi, puoi vedere molto meglio del normale a 30 cm o meno. Hai vantaggio alle prove di Intelligenza (Indagare) effettuate cercando un'area o studiando un oggetto entro quella distanza.",
    },
    'eyes-of-the-eagle': {
        descrizione_it:
"Queste lenti di cristallo si applicano sopra gli occhi. Mentre le indossi, hai vantaggio alle prove di Saggezza (Percezione) basate sulla vista. In condizioni di luce adeguate, puoi distinguere creature ed oggetti molto distanti larghi anche solo 60 cm.",
    },

    // ── Batch F ────────────────────────────────────────────────────────
    'fabulist-gem': {
        descrizione_it:
"Questa gemma rossa scintillante si trova comunemente incastonata in un anello o spilla. Mentre indossi la gemma, ottieni i seguenti benefici:\n\n" +
"Monete Contraffatte. Puoi usare un'azione per creare magicamente un mucchio di monete, del valore complessivo non superiore a 100 mo, in uno spazio libero entro 3 metri da te. Il mucchio deve apparire su una superficie che possa sostenerlo. Dopo 1 ora, le monete svaniscono. Non riutilizzabile fino all'alba successiva.\n\n" +
"Moda Illusoria. Con un'azione bonus, puoi cambiare magicamente l'aspetto dei tuoi vestiti e armatura. Puoi cambiare lo stile, il colore e la qualità apparente di ciò che indossi, oppure farlo apparire come abiti completamente diversi. In ogni caso, i cambiamenti non superano un'ispezione fisica.",
    },
    'far-realm-shard': {
        descrizione_it:
"Questo cristallo contorto è impregnato dell'essenza distorta del Reame Lontano. Con un'azione, puoi attaccare la scheggia a un oggetto Minuscolo o staccarla. Cade se la sintonia termina. Puoi usare la scheggia come focus per incantesimi mentre la tieni o la indossi.\n\n" +
"Quando usi un'opzione di Metamagia su un incantesimo mentre tieni o indossi la scheggia, puoi far emergere un viscido tendrillo dalla trama della realtà che colpisce una creatura che vedi entro 9 metri da te. La creatura deve riuscire in un tiro salvezza su Carisma contro la CD del tuo incantesimo o subire 3d6 danni psichici e diventare spaventata da te fino all'inizio del tuo prossimo turno.",
    },
    'fate-cutter-shears': {
        descrizione_it:
"Le lame di queste forbici da potatura recano molte tacche e ammaccature ma tagliano ancora pulitamente. Le forbici funzionano come pugnale magico. L'arma ha le seguenti proprietà:\n\n" +
"Sempre Affilate. Quando colpisci con un attacco usando le forbici, il bersaglio subisce ulteriori 1d6 danni da forza.\n\n" +
"Recidi Fili. Quando colpisci una creatura con le forbici, puoi tagliare il suo destino. Finché il bersaglio non termina un riposo lungo, i tiri per colpire contro di esso ottengono un colpo critico con un risultato di 19 o 20 al d20. Non riutilizzabile fino all'alba successiva.",
    },
    'fate-dealer-s-deck': {
        descrizione_it:
"Il dorso di queste carte è inciso con glifi che rappresentano i Piani Interni, i Piani Esterni o i simboli sacri di varie divinità. Mentre tieni questo mazzo, puoi usarlo come focus per incantesimi, e ottieni un bonus ai tiri per colpire con incantesimo e alla CD dei tuoi incantesimi. Il bonus è determinato dalla rarità del mazzo.\n\n" +
"Inoltre, mentre tieni il mazzo, puoi estrarre una carta con un'azione per spendere e tirare uno dei tuoi Dadi Vita e aggiungere il bonus del mazzo al numero ottenuto. Una creatura che vedi entro 9 metri da te subisce danni radianti o recupera punti ferita (a tua scelta) pari al totale.\n\n" +
"Rarità | Bonus\n" +
"Raro | +1\n" +
"Molto Raro | +2\n" +
"Leggendario | +3",
    },
    'feywild-shard': {
        descrizione_it:
"Questo cristallo caldo brilla con i colori del tramonto del cielo del Reame Fatato ed evoca sussurri di memorie emotive. Con un'azione, puoi attaccare la scheggia a un oggetto Minuscolo o staccarla. Cade se la sintonia termina. Puoi usare la scheggia come focus per incantesimi mentre la tieni o la indossi.\n\n" +
"Quando usi un'opzione di Metamagia su un incantesimo mentre tieni o indossi la scheggia, puoi tirare sulla tabella di Surge di Magia Selvaggia del Manuale del Giocatore. Se il risultato è un incantesimo, è troppo selvaggio per essere influenzato dalla tua Metamagia, e se richiede normalmente concentrazione, in questo caso non la richiede; l'incantesimo dura per la sua intera durata.\n\n" +
"Se non hai l'Origine Stregonesca della Magia Selvaggia, una volta usata questa proprietà non può essere riutilizzata fino all'alba successiva.",
    },
    'feywrought-armor': {
        descrizione_it:
"Questa armatura colorata e floreale è stata forgiata nel Reame Fatato ed è infusa con la magia accattivante di quel piano.\n\n" +
"Mentre indossi questa armatura, hai vantaggio ai tiri salvezza per evitare o terminare la condizione di affascinato su di te.\n\n" +
"L'armatura ha 3 cariche. Puoi usare un'azione per spendere una carica per lanciare l'incantesimo Compulsione (CD 15) da quest'armatura. Recupera 1d3 cariche spese ogni giorno all'alba.",
    },
    'figurine-of-wondrous-power': {
        descrizione_it:
"Una Statuetta di Potere Meraviglioso è una figurina di una bestia abbastanza piccola da entrare in tasca. Se usi un'azione per pronunciarne la parola di comando e lanciarla in un punto a terra entro 18 metri da te, la statuetta diventa una creatura vivente. Se lo spazio è occupato o non c'è abbastanza spazio, la statuetta non si trasforma.\n\n" +
"La creatura è amichevole verso di te e i tuoi compagni, comprende le tue lingue e obbedisce ai tuoi comandi. Se non emetti comandi, si difende ma non compie altre azioni. Esiste per una durata specifica per ogni statuetta. Alla fine, torna alla forma di statuetta. Torna anticipatamente se scende a 0 pf o se usi un'azione per pronunciare di nuovo la parola di comando toccandola. Quando torna statuetta, non riutilizzabile finché non passa un certo tempo.\n\n" +
"Tipi noti: Grifone di Bronzo (Raro, fino a 6 ore, ricarica 5 giorni); Mosca d'Ebano (Raro, fino a 12 ore, ricarica 2 giorni); Leoni d'Oro (Raro, sempre in coppia, fino a 1 ora, ricarica 7 giorni); Capre d'Avorio (Raro, set di tre, vedi descrizione completa); Elefante di Marmo (Raro, fino a 24 ore, ricarica 7 giorni); Destriero d'Ossidiana (Molto Raro, diventa cavallo da incubo per 24 ore, ricarica 5 giorni; rischia di trasportarti su Hades); Cane d'Onice (Raro, mastino con Int 8 e scurovisione, fino a 6 ore, ricarica 7 giorni); Civetta Serpentina (Raro, civetta gigante, fino a 8 ore, ricarica 2 giorni); Corvo d'Argento (Non Comune, corvo, fino a 12 ore, ricarica 2 giorni).",
    },
    'figurine-of-wondrous-power-gold-canary': {
        descrizione_it:
"Variante leggendaria della Statuetta di Potere Meraviglioso aggiunta in Fizban's Treasury of Dragons.\n\n" +
"Forma di Canarino Gigante. La statuetta diventa un canarino gigante (vedi blocco statistiche associato) per un massimo di 8 ore e può essere cavalcato come cavalcatura. Una volta diventata canarino gigante, non riutilizzabile fino all'alba successiva.\n\n" +
"Forma di Drago d'Oro. Mentre ti mancano metà o più dei punti ferita, puoi pronunciare una parola di comando diversa e la statuetta diventa un drago d'oro adulto per un massimo di 1 ora. Il drago non può usare azioni leggendarie o azioni di tana. Una volta diventata drago d'oro adulto, non riutilizzabile fino a 1 anno successivo.\n\n" +
"Canarino Gigante: bestia Grande non allineata, CA 12 (armatura naturale), 26 pf (4d10+4), velocità 9m, volo 18m, FOR 10, DES 14, COS 12, INT 2, SAG 10, CAR 6. Attacco Beccata: +4 al colpo, gittata 1,5 m, 1d10+2 perforanti.",
    },
    'flail-of-tiamat': {
        descrizione_it:
"Questo flagello magico è realizzato a immagine di Tiamat, con cinque teste frastagliate a forma delle teste di cinque diversi draghi cromatici. Ottieni un bonus di +3 ai tiri per colpire e ai tiri di danno effettuati con questo flagello. Quando colpisci con un tiro per colpire usandolo, il bersaglio subisce ulteriori 5d4 danni di un tipo a tua scelta tra acido, freddo, fuoco, fulmine o veleno.\n\n" +
"Mentre tieni il flagello, puoi usare un'azione e pronunciare una parola di comando per far soffiare alle teste fiamme multicolori in un cono di 27 metri. Ogni creatura nell'area deve effettuare un tiro salvezza su Destrezza con CD 18. Se fallisce, subisce 14d6 danni di uno dei tipi a tua scelta (acido, freddo, fuoco, fulmine o veleno); se ha successo, ne subisce metà. Non riutilizzabile fino all'alba successiva.",
    },
    'flame-tongue': {
        descrizione_it:
"Puoi usare un'azione bonus per pronunciare la parola di comando di questa spada magica, facendo divampare fiamme dalla lama. Queste fiamme emanano luce intensa entro 12 metri e luce fioca per ulteriori 12 metri. Mentre la spada è infiammata, infligge ulteriori 2d6 danni da fuoco a qualsiasi bersaglio colpito. Le fiamme durano finché non usi un'azione bonus per pronunciare di nuovo la parola di comando o finché non lasci cadere o riponi la spada.",
    },
    'folding-boat': {
        descrizione_it:
"Questo oggetto appare come una scatola di legno di 30 cm di lunghezza, 15 cm di larghezza e 15 cm di profondità. Pesa 2 kg e galleggia. Può essere aperta per riporvi oggetti. Ha tre parole di comando, ciascuna usabile con un'azione.\n\n" +
"La prima parola di comando fa dispiegare la scatola in una barca lunga 3 metri, larga 1,2 m e profonda 60 cm, con un paio di remi, un'ancora, un albero e una vela latina. La barca può ospitare comodamente fino a quattro creature Medie.\n\n" +
"La seconda parola di comando fa dispiegare la scatola in una nave lunga 7,2 m, larga 2,4 m e profonda 1,8 m, con ponte, sedili da rematori, cinque coppie di remi, un timone, un'ancora, una cabina e un albero con vela quadra. Può ospitare comodamente quindici creature Medie.\n\n" +
"Quando la scatola diventa un'imbarcazione, il suo peso diventa quello di un'imbarcazione normale di quelle dimensioni, e qualsiasi cosa fosse riposta nella scatola rimane nella barca.\n\n" +
"La terza parola di comando fa ripiegare la barca nella scatola, purché non vi siano creature a bordo. Gli oggetti che non possono entrare nella scatola rimangono fuori.",
    },
    'fool-s-blade': {
        descrizione_it:
"Quest'arma appare ordinaria, ma reca una potente magia di illusione che permette al portatore di ingannare abilmente gli avversari.\n\n" +
"Hai un bonus di +2 ai tiri per colpire e ai tiri di danno effettuati con quest'arma magica. Mentre la impugni ottieni anche i seguenti benefici:\n\n" +
"Finta del Folle. Con un'azione bonus, puoi fintare scegliendo come bersaglio una creatura entro 1,5 metri da te. Fino all'inizio del tuo prossimo turno, hai vantaggio ai tiri per colpire contro il bersaglio. Non riutilizzabile fino all'alba successiva.\n\n" +
"Sviare. Quando una creatura entro 18 metri da te ti bersaglia con un tiro per colpire, puoi usare la reazione per richiederle un tiro salvezza su Intelligenza con CD 15. Se fallisce, l'attacco bersaglia invece un'altra creatura a tua scelta entro la portata dell'attaccante. Non riutilizzabile fino all'alba successiva.",
    },
    'forcebreaker-weapon': {
        descrizione_it:
"Ottieni un bonus di +2 ai tiri per colpire e ai tiri di danno effettuati con quest'arma magica.\n\n" +
"Quest'arma è stata creata per distruggere le strutture fatte di forza, come quelle create da Gabbia di Forza o Muro di Forza. Colpire una struttura di forza magica Grande o inferiore con quest'arma frantuma automaticamente quella struttura. Se il bersaglio è una struttura di forza Enorme o più grande, l'arma frantuma una porzione cubica di essa di 6 metri di lato.",
    },
    'frost-brand': {
        descrizione_it:
"Quando colpisci con un attacco usando questa spada magica, il bersaglio subisce ulteriori 1d6 danni da freddo. Inoltre, mentre tieni la spada, hai resistenza ai danni da fuoco.\n\n" +
"In temperature gelide, la lama emana luce intensa entro 3 metri e luce fioca per ulteriori 3 metri.\n\n" +
"Quando estrai quest'arma, puoi spegnere tutte le fiamme non magiche entro 9 metri da te. Questa proprietà non può essere usata più di una volta all'ora.",
    },
    'fulminating-treatise': {
        descrizione_it:
"Questo grosso libro degli incantesimi bruciacchiato emana odore di fumo e ozono, e scintille di energia crepitano lungo i bordi delle sue pagine. Quando viene trovato contiene gli incantesimi: Contingenza, Palla di Fuoco, Folata di Vento, Piccola Capanna di Leomund, Proiettile Magico, Onda Tonante e Muro di Forza. Funziona da libro degli incantesimi per te.\n\n" +
"Mentre tieni il libro, puoi usarlo come focus per i tuoi incantesimi da mago.\n\n" +
"Il libro ha 3 cariche e recupera 1d3 cariche spese ogni giorno all'alba. Puoi usare le cariche nei seguenti modi:\n" +
"- Se passi 1 minuto a studiare il libro, puoi spendere 1 carica per sostituire uno dei tuoi incantesimi da mago preparati con un incantesimo diverso del libro. Il nuovo incantesimo deve essere della scuola di evocazione/invocazione.\n" +
"- Quando una creatura che vedi subisce danni da un incantesimo di evocazione che hai lanciato, puoi usare la reazione e spendere 1 carica per infliggere alla creatura ulteriori 2d6 danni da forza e farla cadere prona se è Grande o inferiore.",
    },

    // ── Batch G ────────────────────────────────────────────────────────
    'gauntlets-of-ogre-power': {
        descrizione_it:
"Il tuo punteggio di Forza è 19 mentre indossi questi guanti. Non hanno alcun effetto se la tua Forza è già 19 o superiore senza di essi.",
    },
    'gem-of-brightness': {
        descrizione_it:
"Questo prisma ha 50 cariche. Mentre lo tieni, puoi usare un'azione per pronunciare una di tre parole di comando per causare uno dei seguenti effetti:\n" +
"- La prima parola di comando fa emanare alla gemma luce intensa entro 9 metri e luce fioca per ulteriori 9 metri. Non spende cariche. Dura finché non usi un'azione bonus per ripetere la parola di comando o finché non usi un'altra funzione della gemma.\n" +
"- La seconda parola di comando spende 1 carica e fa lanciare alla gemma un brillante raggio di luce contro una creatura che vedi entro 18 metri da te. La creatura deve riuscire in un tiro salvezza su Costituzione con CD 15 o diventare accecata per 1 minuto. Può ripetere il TS alla fine di ogni suo turno.\n" +
"- La terza parola di comando spende 5 cariche e fa esplodere la gemma in un lampo accecante in un cono di 9 metri. Ogni creatura nel cono effettua un tiro salvezza come per il raggio.\n\n" +
"Quando tutte le cariche della gemma sono spese, la gemma diventa un gioiello non magico del valore di 50 mo.",
    },
    'gem-of-seeing': {
        descrizione_it:
"Questa gemma ha 3 cariche. Con un'azione, puoi pronunciare la parola di comando della gemma e spendere 1 carica. Per i prossimi 10 minuti, hai vista vera fino a 36 metri quando guardi attraverso la gemma. La gemma recupera 1d3 cariche spese ogni giorno all'alba.",
    },
    'ghost-step-tattoo': {
        descrizione_it:
"Prodotto da un ago speciale, questo tatuaggio si sposta e oscilla sulla pelle, parti di esso appaiono sfocate.\n\n" +
"Sintonia del Tatuaggio. Per sintonizzarti, premi l'ago contro la pelle. Quando la sintonia è completa, l'ago diventa l'inchiostro del tatuaggio. Se la sintonia termina, il tatuaggio scompare e l'ago riappare.\n\n" +
"Forma Spettrale. Il tatuaggio ha 3 cariche e recupera tutte le cariche spese ogni giorno all'alba. Con un'azione bonus mentre il tatuaggio è sulla tua pelle, puoi spendere 1 carica per diventare incorporeo fino alla fine del tuo prossimo turno. Per la durata, ottieni i seguenti benefici:\n" +
"- Hai resistenza ai danni contundenti, perforanti e taglienti da attacchi non magici.\n" +
"- Non puoi essere afferrato o trattenuto.\n" +
"- Puoi muoverti attraverso creature e oggetti solidi come se fossero terreno difficile. Se termini il turno in un oggetto solido, subisci 1d10 danni da forza. Se l'effetto termina mentre sei in un oggetto solido, vieni spinto allo spazio libero più vicino e subisci 1d10 danni da forza per ogni 1,5 metri percorsi.",
    },
    'giant-slayer': {
        descrizione_it:
"Ottieni un bonus di +1 ai tiri per colpire e ai tiri di danno effettuati con quest'arma magica.\n\n" +
"Quando colpisci un gigante con essa, il gigante subisce ulteriori 2d6 danni del tipo dell'arma e deve riuscire in un tiro salvezza su Forza con CD 15 o cadere prono. Per gli scopi di quest'arma, \"gigante\" si riferisce a qualsiasi creatura di tipo gigante, inclusi ettin e troll.",
    },
    'glamoured-studded-leather': {
        descrizione_it:
"Mentre indossi questa armatura, ottieni un bonus di +1 alla CA. Puoi anche usare un'azione bonus per pronunciare la parola di comando dell'armatura e farle assumere l'aspetto di un normale set di vestiti o un altro tipo di armatura. Decidi tu come appare, inclusi colore, stile e accessori, ma l'armatura mantiene la propria sagoma e peso. L'apparenza illusoria dura finché non usi di nuovo questa proprietà o finché non rimuovi l'armatura.",
    },
    'glimmering-moonbow': {
        descrizione_it:
"Quest'arco argento e nero è inciso con le fasi della luna. Ottieni un bonus di +1 ai tiri per colpire e ai tiri di danno effettuati con quest'arma magica.\n\n" +
"Quando colpisci con un attacco a distanza usando questo arco magico, il bersaglio subisce ulteriori 1d6 danni radianti. Se non carichi munizioni nell'arma, essa produce le proprie, creando automaticamente una munizione magica quando effettui un attacco a distanza con essa. La munizione svanisce nell'istante successivo al colpo o al mancato bersaglio.\n\n" +
"Mentre impugni questo arco magico, puoi usare un'azione bonus per entrare in uno stato semi-incorporeo fino all'inizio del tuo prossimo turno. Mentre semi-incorporeo, hai resistenza ai danni contundenti, perforanti e taglienti. Non riutilizzabile fino all'alba successiva.",
    },
    'gloomwrought-armor': {
        descrizione_it:
"Questa intricata armatura in scala di grigio è stata forgiata nel Reame delle Ombre ed è infusa con la cupezza di quel piano.\n\n" +
"Mentre indossi questa armatura, hai vantaggio ai tiri salvezza per evitare o terminare la condizione di spaventato su di te.\n\n" +
"L'armatura ha 3 cariche. Puoi spendere una carica per lanciare l'incantesimo Calmare le Emozioni (CD 15) dall'armatura. Recupera 1d3 cariche spese ogni giorno all'alba.",
    },
    'gloves-of-missile-snaring': {
        descrizione_it:
"Questi guanti sembrano vestire come una seconda pelle quando li indossi. Quando vieni colpito da un attacco con arma a distanza mentre indossi i guanti, puoi usare la reazione per ridurre il danno di 1d10 + il tuo modificatore di Destrezza, purché tu abbia una mano libera. Se riduci il danno a 0, puoi catturare il proiettile se è abbastanza piccolo da poterlo tenere in quella mano.",
    },
    'gloves-of-swimming-and-climbing': {
        descrizione_it:
"Mentre indossi questi guanti, scalare e nuotare non ti costa movimento extra, e ottieni un bonus di +5 alle prove di Forza (Atletica) effettuate per scalare o nuotare.",
    },
    'gloves-of-thievery': {
        descrizione_it:
"Questi guanti sono invisibili mentre indossati. Mentre li indossi, ottieni un bonus di +5 alle prove di Destrezza (Rapidità di Mano) e alle prove di Destrezza effettuate per scassinare serrature.",
    },
    'glowrune-pigment': {
        descrizione_it:
"Questo set di 1d4+2 piccoli barattoli di vernice contiene pigmenti mescolati da gemme luminescenti frantumate. Questa vernice magica conferisce doni magici temporanei alle creature con rune disegnate sulla pelle.\n\n" +
"Un barattolo contiene pigmento sufficiente per dipingere una runa. Una creatura può passare 10 minuti per dipingere una delle seguenti rune su sé stessa o su un'altra creatura:\n\n" +
"Runa del Viaggio. Il terreno difficile non costa movimento extra alla creatura dipinta.\n\n" +
"Runa della Vita. La creatura dipinta ottiene 10 punti ferita temporanei e ha vantaggio ai tiri salvezza contro la morte.\n\n" +
"Runa della Luce. La creatura dipinta ottiene scurovisione fino a 9 metri. Se ha già scurovisione, il raggio aumenta di 9 metri.\n\n" +
"Runa della Montagna. La creatura dipinta è immune all'essere fatta cadere prona e ha vantaggio ai tiri salvezza su Forza e Costituzione.\n\n" +
"Runa dello Scudo. La creatura dipinta ha vantaggio ai tiri salvezza su Destrezza contro effetti che infliggono danni.\n\n" +
"Una creatura può beneficiare di una sola runa dipinta alla volta, quindi una nuova runa non ha effetto se la vecchia non viene rimossa prima. I benefici durano 8 ore o finché la creatura dipinta usa la propria azione per cancellare la runa.",
    },
    'goggles-of-night': {
        descrizione_it:
"Mentre indossi queste lenti scure, hai scurovisione fino a 18 metri. Se hai già scurovisione, indossare gli occhiali ne aumenta il raggio di 18 metri.",
    },
    'grasping-whip': {
        descrizione_it:
"Ottieni un bonus di +1 ai tiri per colpire e ai tiri di danno effettuati con questa frusta magica. Quando colpisci una creatura o oggetto Grande o inferiore con questa frusta, puoi tirare quella creatura o oggetto di 1,5 metri verso di te invece di infliggere danni.\n\n" +
"La competenza con una frusta ti permette di aggiungere il bonus di competenza al tiro per colpire di qualsiasi attacco con essa.",
    },
    'guardian-emblem': {
        descrizione_it:
"Questo emblema è il simbolo di una divinità o di una tradizione spirituale. Con un'azione, puoi attaccare l'emblema a un'armatura o a uno scudo, o rimuoverlo.\n\n" +
"L'emblema ha 3 cariche. Quando tu o una creatura che vedi entro 9 metri da te subisce un colpo critico mentre indossi l'armatura o impugni lo scudo che reca l'emblema, puoi usare la reazione per spendere 1 carica e trasformare il colpo critico in un colpo normale. L'emblema recupera tutte le cariche spese ogni giorno all'alba.",
    },

    // ── Batch H ────────────────────────────────────────────────────────
    'hammer-of-runic-focus': {
        descrizione_it:
"Questo martello magico ha 3 cariche. Con un'azione bonus, puoi spendere 1 carica e sbattere il martello a terra, creando un cerchio di rune luminose di 4,5 metri di raggio centrato sul punto d'impatto. Mentre sei dentro quell'area, il tuo martello brilla con rune corrispondenti, e ottieni un bonus di +3 ai tiri per colpire e ai tiri di danno effettuati con questo martello. Il cerchio di rune scompare dopo 1 minuto, quando ne crei un altro, o quando lo dismetti come azione bonus. Recupera 1d3 cariche spese ogni giorno all'alba.",
    },
    'hammer-of-thunderbolts': {
        descrizione_it:
"Ottieni un bonus di +1 ai tiri per colpire e ai tiri di danno effettuati con quest'arma magica.\n\n" +
"Flagello dei Giganti (richiede sintonia). Devi indossare una cintura di forza dei giganti (qualsiasi varietà) e guanti del potere dell'ogre per sintonizzarti con quest'arma. La sintonia termina se ti togli uno di quei due oggetti. Mentre sei sintonizzato e tieni l'arma, il tuo punteggio di Forza aumenta di 4 e può superare 20, ma non 30. Quando ottieni 20 al tiro per colpire effettuato con quest'arma contro un gigante, il gigante deve riuscire in un tiro salvezza su Costituzione con CD 17 o morire.\n\n" +
"Il martello ha anche 5 cariche. Mentre sintonizzato, puoi spendere 1 carica e effettuare un attacco con arma a distanza con il martello, lanciandolo come se avesse la proprietà a distanza con gittata 6/18 m. Se l'attacco colpisce, il martello scatena un tuono udibile fino a 90 metri. Il bersaglio e ogni creatura entro 9 metri da esso devono riuscire in un tiro salvezza su Costituzione con CD 17 o essere storditi fino alla fine del tuo prossimo turno. Recupera 1d4+1 cariche spese ogni giorno all'alba.",
    },
    'harp-of-gilded-plenty': {
        descrizione_it:
"Questa arpa dorata è scolpita a immagine della dea Iallanis, raffigurata come una giovane gigante delle nubi. Quando una creatura si avvicina entro 1,5 metri dall'arpa, lo strumento si anima ed è capace di parlare, cantare e suonare da solo.\n\n" +
"Ogni volta che cerchi di sintonizzarti con l'arpa, devi prima superare una prova di Carisma (Intrattenere) con CD 15 o di Carisma (Persuasione) con CD 20 per convincere l'arpa che ne sei degno. Se fallisci, non puoi tentare di nuovo fino all'alba successiva. Una volta sintonizzato, l'arpa si ridimensiona per adattarsi a te.\n\n" +
"Canzone Risoluta. Ogni volta che effettui una prova di Carisma mentre sintonizzato all'arpa, puoi trattare un risultato di 9 o inferiore al dado come un 10.\n\n" +
"Banchetto dell'Abbondanza. Se passi 10 minuti a suonare l'arpa, puoi lanciare l'incantesimo Banchetto degli Eroi da essa. Non riutilizzabile finché non sono passati 1d10+10 giorni.\n\n" +
"Melodia Lenitiva. Con un'azione, puoi usare l'arpa per lanciare l'incantesimo Calmare le Emozioni (CD 19). Quando lanciato tramite l'arpa, la durata aumenta a 1 ora se mantieni la concentrazione. Cinque utilizzi al giorno, recuperati all'alba.\n\n" +
"Senzienza. L'arpa è un oggetto senziente di allineamento caotico buono con Intelligenza 13, Saggezza 15 e Carisma 20. Ha udito e scurovisione fino a 36 metri. Parla, legge e capisce il Comune e il Gigante. Comunica telepaticamente con la creatura sintonizzata. Personalità drammatica e pomposa, orgogliosa della qualità della sua musica.",
    },
    'hat-of-disguise': {
        descrizione_it:
"Mentre indossi questo cappello, puoi usare un'azione per lanciare l'incantesimo Camuffarsi a volontà. L'incantesimo termina se il cappello viene rimosso.",
    },
    'hat-of-vermin': {
        descrizione_it:
"Questo cappello ha 3 cariche. Mentre lo tieni, puoi usare un'azione per spendere 1 carica e pronunciare una parola di comando che evoca a tua scelta un pipistrello, una rana o un ratto. La creatura evocata appare magicamente nel cappello e cerca di allontanarsi da te il più velocemente possibile. La creatura non è né amichevole né ostile, e non è sotto il tuo controllo. Si comporta come una creatura ordinaria della sua specie e scompare dopo 1 ora o quando scende a 0 pf. Recupera tutte le cariche spese ogni giorno all'alba.",
    },
    'hat-of-wizardry': {
        descrizione_it:
"Questo cappello antiquato a forma di cono è ornato con lune crescenti dorate e stelle. Mentre lo indossi ottieni i seguenti benefici:\n" +
"- Puoi usare il cappello come focus per i tuoi incantesimi da mago.\n" +
"- Puoi tentare di lanciare un trucchetto che non conosci. Il trucchetto deve essere nella lista del mago e devi superare una prova di Intelligenza (Arcano) con CD 10. Se la prova ha successo, lanci l'incantesimo. Se fallisce, fallisce anche l'incantesimo. In entrambi i casi, non puoi riutilizzare questa proprietà finché non termini un riposo lungo.",
    },
    'headband-of-intellect': {
        descrizione_it:
"Il tuo punteggio di Intelligenza è 19 mentre indossi questa fascia. Non ha alcun effetto se la tua Intelligenza è già 19 o superiore senza di essa.",
    },
    'heart-weaver-s-primer': {
        descrizione_it:
"Questo libro immacolato emana un debole profumo casuale a tua scelta. Quando viene trovato contiene gli incantesimi: Antipatia/Simpatia, Charme su Persone, Dominare Persone, Soggiogare, Schema Ipnotico, Modificare Memoria e Suggestione. Funziona da libro degli incantesimi per te.\n\n" +
"Mentre tieni il libro, puoi usarlo come focus per i tuoi incantesimi da mago.\n\n" +
"Il libro ha 3 cariche e recupera 1d3 cariche spese ogni giorno all'alba. Puoi usare le cariche nei seguenti modi:\n" +
"- Se passi 1 minuto a studiare il libro, puoi spendere 1 carica per sostituire uno dei tuoi incantesimi da mago preparati con un incantesimo diverso del libro. Il nuovo incantesimo deve essere della scuola di ammaliamento.\n" +
"- Quando lanci un incantesimo di ammaliamento, puoi spendere 1 carica per imporre svantaggio al primo tiro salvezza che un bersaglio effettua contro l'incantesimo.",
    },
    'helm-of-brilliance': {
        descrizione_it:
"Questo elmo abbagliante è incastonato con 1d10 diamanti, 2d10 rubini, 3d10 opali di fuoco e 4d10 opali. Qualsiasi gemma estratta dall'elmo si polverizza. Quando tutte le gemme sono rimosse o distrutte, l'elmo perde la sua magia.\n\n" +
"Mentre lo indossi ottieni i seguenti benefici:\n" +
"- Puoi usare un'azione per lanciare uno dei seguenti incantesimi (CD 18) usando una gemma dell'elmo del tipo specificato come componente: Luce del Giorno (opale), Palla di Fuoco (opale di fuoco), Spruzzo Prismatico (diamante) o Muro di Fuoco (rubino). La gemma viene distrutta quando l'incantesimo viene lanciato.\n" +
"- Finché ha almeno un diamante, l'elmo emana luce fioca entro 9 metri quando almeno un non morto si trova in quell'area. Ogni non morto che inizia il turno nell'area subisce 1d6 danni radianti.\n" +
"- Finché ha almeno un rubino, hai resistenza ai danni da fuoco.\n" +
"- Finché ha almeno un opale di fuoco, puoi usare un'azione e parola di comando per far divampare un'arma che impugni. Le fiamme emanano luce intensa entro 3 metri e luce fioca per ulteriori 3 metri. Un colpo con l'arma fiammeggiante infligge ulteriori 1d6 danni da fuoco.\n\n" +
"Tira un d20 se indossi l'elmo e subisci danni da fuoco fallendo un tiro salvezza contro un incantesimo. Con un 1, l'elmo emette raggi dalle gemme rimanenti. Ogni creatura entro 18 metri tranne te deve riuscire in un tiro salvezza su Destrezza con CD 17 o subire danni radianti pari al numero di gemme. L'elmo e le gemme vengono poi distrutti.",
    },
    'helm-of-comprehending-languages': {
        descrizione_it:
"Mentre indossi questo elmo, puoi usare un'azione per lanciare a volontà l'incantesimo Comprendere i Linguaggi.",
    },
    'helm-of-perfect-potential': {
        descrizione_it:
"Questo elmo color rame contiene una scheggia del Caos Elementale incastonata sulla fronte, circondata da un motivo a sole nascente. La leggenda narra che Annam forgiò questo elmo per sua figlia Diancastra perché contenesse il frammento di caos che lei usò per provare il proprio valore al padre.\n\n" +
"Proprietà Casuali:\n" +
"- 2 proprietà benefiche minori\n" +
"- 1 proprietà benefica maggiore\n" +
"- 1 proprietà dannosa minore\n\n" +
"Maestro dell'Astuzia. Mentre indossi l'elmo, hai vantaggio alle prove di Carisma (Inganno) e Saggezza (Intuizione).\n\n" +
"Freccia di Devastazione Elementale. Con un'azione bonus mentre indossi l'elmo, puoi lanciare un dardo di scottante energia elementale verso una creatura che vedi entro 27 metri da te. Il bersaglio deve effettuare un tiro salvezza su Destrezza con CD 20. Se fallisce, subisce 4d6 danni di tipo acido, freddo, fuoco, fulmine o tuono (a tua scelta); se ha successo, ne subisce metà.\n\n" +
"Incantesimi. L'elmo ha 6 cariche e recupera 1d6 cariche all'alba. Con un'azione mentre lo indossi, puoi spendere cariche per lanciare (CD 20): Arma Elementale (1), Richiamare il Fulmine (2), Muro di Fuoco (3), Evocare Elementale (4), Tsunami (5).",
    },
    'helm-of-telepathy': {
        descrizione_it:
"Mentre indossi questo elmo, puoi usare un'azione per lanciare l'incantesimo Individuazione del Pensiero (CD 13). Finché mantieni la concentrazione, puoi usare un'azione bonus per inviare un messaggio telepatico a una creatura su cui sei focalizzato. Essa può rispondere usando un'azione bonus mentre il tuo focus su di lei continua.\n\n" +
"Mentre sei focalizzato su una creatura con Individuazione del Pensiero, puoi usare un'azione per lanciare Suggestione (CD 13) dall'elmo su quella creatura. Non riutilizzabile fino all'alba successiva.",
    },
    'helm-of-teleportation': {
        descrizione_it:
"Questo elmo ha 3 cariche. Mentre lo indossi, puoi usare un'azione e spendere 1 carica per lanciare l'incantesimo Teletrasporto da esso. Recupera 1d3 cariche spese ogni giorno all'alba.",
    },
    'heward-s-handy-haversack': {
        descrizione_it:
"Questo zaino ha una tasca centrale e due tasche laterali, ognuna delle quali è uno spazio extradimensionale. Ogni tasca laterale può contenere fino a 9 kg di materiale, non superando un volume di 60 dm³. La grande tasca centrale può contenere fino a 230 dm³ o 36 kg. Lo zaino pesa sempre 2,3 kg, indipendentemente dal contenuto.\n\n" +
"Posizionare un oggetto segue le regole normali per interagire con oggetti. Estrarre un oggetto richiede un'azione: l'oggetto cercato è sempre magicamente in cima.\n\n" +
"Lo zaino ha alcune limitazioni: se sovraccarico o se un oggetto affilato lo perfora, lo zaino si rompe e viene distrutto, perdendo per sempre il contenuto (gli artefatti riappaiono). Se rovesciato, il contenuto fuoriesce illeso. Una creatura respirante che vi viene posta dentro può sopravvivere fino a 10 minuti, dopo i quali inizia a soffocare.\n\n" +
"Posizionare lo zaino in uno spazio extradimensionale (sacca dimensionale, foro portatile, ecc.) distrugge istantaneamente entrambi gli oggetti e apre un cancello al Piano Astrale, risucchiando le creature entro 3 metri.",
    },
    'heward-s-handy-spice-pouch': {
        descrizione_it:
"Questa sacca da cintura appare vuota e ha 10 cariche. Mentre tieni la sacca, puoi usare un'azione per spendere 1 carica, pronunciare il nome di qualsiasi condimento alimentare non magico (come sale, pepe, zafferano o coriandolo) e estrarre un pizzico del condimento desiderato dalla sacca. Un pizzico è sufficiente per condire un singolo pasto. La sacca recupera 1d6+4 cariche spese ogni giorno all'alba.",
    },
    'holy-avenger': {
        descrizione_it:
"Ottieni un bonus di +3 ai tiri per colpire e ai tiri di danno effettuati con quest'arma magica. Quando colpisci un immondo o un non morto con essa, quella creatura subisce ulteriori 2d10 danni radianti.\n\n" +
"Mentre tieni la spada sguainata, essa crea un'aura del raggio di 3 metri attorno a te. Tu e tutte le creature amichevoli nell'aura avete vantaggio ai tiri salvezza contro incantesimi e altri effetti magici. Se hai 17 o più livelli nella classe paladino, il raggio dell'aura aumenta a 9 metri.",
    },
    'horn-of-blasting': {
        descrizione_it:
"Puoi usare un'azione per pronunciare la parola di comando del corno e poi suonarlo, emettendo una raffica tonante in un cono di 9 metri udibile a 180 metri di distanza. Ogni creatura nel cono deve effettuare un tiro salvezza su Costituzione con CD 15. Se fallisce, subisce 5d6 danni da tuono ed è assordata per 1 minuto. Se ha successo, subisce metà danni e non è assordata. Le creature e gli oggetti di vetro o cristallo hanno svantaggio al tiro salvezza e subiscono 10d6 danni da tuono invece di 5d6.\n\n" +
"Ogni utilizzo della magia del corno ha il 20% di probabilità di farlo esplodere. L'esplosione infligge 10d6 danni da fuoco al suonatore e distrugge il corno.",
    },
    'horn-of-silent-alarm': {
        descrizione_it:
"Questo corno ha 4 cariche. Quando usi un'azione per soffiarci dentro, una creatura a tua scelta può sentirne il suono, purché sia entro 180 metri dal corno e non assordata. Nessun'altra creatura sente alcun suono. Recupera 1d4 cariche spese ogni giorno all'alba.",
    },
    'horn-of-valhalla': {
        descrizione_it:
"Puoi usare un'azione per soffiare in questo corno. In risposta, spiriti guerrieri dal Valhalla appaiono entro 18 metri da te. Usano le statistiche di un berserker. Tornano al Valhalla dopo 1 ora o quando scendono a 0 pf. Una volta usato, il corno non può essere riutilizzato per 7 giorni.\n\n" +
"Esistono quattro tipi di Corno del Valhalla, ciascuno fatto di un metallo diverso. Il tipo determina quanti berserker rispondono e i requisiti per l'uso (il DM sceglie o tira casualmente):\n" +
"- 01-40 Argento: 2d4+2 berserker, nessun requisito\n" +
"- 41-75 Ottone: 3d4+3, competenza in armi semplici\n" +
"- 76-90 Bronzo: 4d4+4, competenza in armature medie\n" +
"- 91-00 Ferro: 5d4+5, competenza in armi da guerra\n\n" +
"Se suoni il corno senza soddisfare il requisito, i berserker evocati ti attaccano. Se lo soddisfi, sono amichevoli verso di te e i tuoi compagni.",
    },
    'horseshoes-of-a-zephyr': {
        descrizione_it:
"Questi quattro ferri di cavallo si applicano agli zoccoli di una creatura simile a un cavallo. Mentre le quattro scarpe sono attaccate, la creatura può muoversi normalmente ma fluttua a 10 cm dal terreno. Questo effetto significa che la creatura attraversa terreno difficile e altre superfici a piacimento, può attraversare l'acqua come se fosse terreno solido, può galleggiare nell'aria, e non viene rallentata dal terreno difficile, dalle sabbie mobili o da effetti simili. Inoltre, può viaggiare alla normale velocità per un massimo di 12 ore al giorno senza subire affaticamento da marcia forzata.",
    },
    'horseshoes-of-speed': {
        descrizione_it:
"Questi ferri di cavallo si applicano agli zoccoli di una creatura simile a un cavallo. Mentre tutti e quattro i ferri sono attaccati, aumentano la velocità di camminata della creatura di 9 metri.",
    },

    // ── Batch I ────────────────────────────────────────────────────────
    'house-of-cards': {
        descrizione_it:
"Questo mazzo di carte è decorato con forme geometriche dal motivo protettivo. Mentre tieni il mazzo, puoi usare un'azione per mescolarlo e far sì che le carte si dispongano da sole trasformandosi in un rifugio fatto di carte. Il rifugio può avere la forma che desideri, ma deve stare in un cubo di 12 metri di lato centrato su un punto entro 9 metri da te. Il rifugio ha una porta e fino a quattro finestre, e solo tu puoi aprirle o chiuderle. Ha un pavimento e un tetto, e mantiene una temperatura confortevole all'interno.\n\n" +
"Il rifugio ha CA 15, 50 punti ferita e immunità ai danni da veleno e psichici. Dura 24 ore, finché non lo dismetti come azione, o finché non viene ridotto a 0 pf. Quando la durata termina, si trasforma di nuovo in un mazzo di carte e appare nella tua mano. Una volta trasformato in rifugio, non riutilizzabile fino all'alba successiva.",
    },
    'iggwilv-s-cauldron': {
        descrizione_it:
"Iggwilv ha forgiato questo meraviglioso calderone con l'aiuto della sua madre adottiva, l'arcifata Baba Yaga. Il calderone ha due forme. Solo Iggwilv o Baba Yaga possono cambiare la forma del calderone (toccandolo come azione), senza necessariamente esserne sintonizzate. Nella prima forma, il calderone è di oro massiccio con immagini di alberi spogli, foglie cadenti e manici di scopa. Nella seconda forma, è di ferro con immagini di pipistrelli, rospi, gatti, lucertole e serpenti — otto di ciascuno. In entrambe le forme misura circa 90 cm di diametro, ha una bocca di 60 cm, un coperchio rotondo con maniglia, e otto piedi artigliati. Pesa 36 kg vuoto e contiene fino a 380 litri di liquido.\n\n" +
"Sintonia. Qualsiasi umanoide che si sintonizzi col calderone deve riuscire in un tiro salvezza su Costituzione con CD 15 o invecchiare fino alla decrepitezza (velocità dimezzata, vista/udito ridotti a 9 metri, svantaggio a tutto). La creatura raggiunge la fine della propria vita naturale in 3d8 giorni. Solo Desiderio o intervento divino può invertire l'invecchiamento. Tre megere possono sintonizzarsi simultaneamente se hanno formato un coven.\n\n" +
"Proprietà Casuali. 1 proprietà benefica minore, 1 proprietà dannosa minore.\n\n" +
"Calderone d'Oro. Versare acqua e mescolare per 1 minuto trasforma in stufato sostanzioso (4 pasti per gallone). Versare vino e mescolare per 10 minuti crea un elisir che concede 10 pf temporanei (4 persone per gallone). Riempito con 90 galloni d'acqua e 10 di vino, funge da focus per Scrutare con CD automaticamente fallita e tra piani diversi. Immergere setole di scopa nell'acqua trasforma la scopa in Scopa Volante per 3 giorni.\n\n" +
"Calderone di Ferro. Urlare nel calderone vuoto evoca uno sciame di pipistrelli che obbedisce per 1 minuto. Versare 1 gallone di sangue e mescolare crea una nuvola che fa svenire ogni umanoide entro 30 metri (per gallone) per 1 ora. Legare una rana morta a un ramo e immergerlo crea una Bacchetta della Metamorfosi con 3 cariche. Toccare il calderone con un corno di unicorno mentre si recita un poema congela nel tempo tutte le creature entro 300 metri.\n\n" +
"Distruggere il Calderone. CA 19, 80 pf, immune a tutto tranne armi Lingua di Fuoco o Spada del Gelo. Frantumarlo in 8 pezzi termina i suoi effetti e fa perdere a tutte le megere del multiverso il tratto Incantesimo Condiviso da coven. Può essere ricostruito con Desiderio se tutti gli 8 pezzi sono entro 1,5 metri.",
    },
    'illuminator-s-tattoo': {
        descrizione_it:
"Prodotto da un ago speciale, questo tatuaggio magico presenta bellissima calligrafia, immagini di strumenti di scrittura e simili.\n\n" +
"Sintonia del Tatuaggio. Per sintonizzarti, premi l'ago contro la pelle. Quando completata, l'ago diventa l'inchiostro del tatuaggio. Se la sintonia termina, il tatuaggio scompare e l'ago riappare.\n\n" +
"Scrittura Magica. Mentre il tatuaggio è sulla tua pelle, puoi scrivere con la punta del dito come se fosse una penna a inchiostro inesauribile.\n\n" +
"Con un'azione, puoi toccare un testo scritto lungo fino a una pagina e pronunciare il nome di una creatura. Lo scritto diventa invisibile a tutti tranne te e la creatura nominata per le successive 24 ore. Entrambi potete dismettere l'invisibilità toccando lo scritto. Non riutilizzabile fino all'alba successiva.",
    },
    'immovable-rod': {
        descrizione_it:
"Quest'asta di ferro piatta ha un pulsante a un'estremità. Puoi usare un'azione per premerlo, facendo sì che l'asta diventi magicamente fissata in posizione. Finché tu o un'altra creatura non usate un'azione per premere di nuovo il pulsante, l'asta non si muove, anche se sfida la gravità. L'asta può sostenere fino a 3.600 kg di peso. Più peso fa cadere l'asta a terra. Una creatura può usare un'azione per effettuare una prova di Forza con CD 30: se ha successo, sposta l'asta fino a 3 metri.",
    },
    'instrument-of-illusions': {
        descrizione_it:
"Mentre suoni questo strumento musicale, puoi creare effetti visivi illusori innocui in una sfera di 1,5 metri di raggio centrata sullo strumento. Se sei un bardo, il raggio aumenta a 4,5 metri. Esempi di effetti visivi: note musicali luminose, una danzatrice spettrale, farfalle, neve che cade dolcemente. Gli effetti magici non hanno né sostanza né suono, e sono ovviamente illusori. Gli effetti terminano quando smetti di suonare.",
    },
    'instrument-of-scribing': {
        descrizione_it:
"Questo strumento musicale ha 3 cariche. Mentre lo suoni, puoi usare un'azione per spendere 1 carica e scrivere un messaggio magico su un oggetto o superficie non magica che vedi entro 9 metri da te. Il messaggio può essere lungo fino a sei parole ed è scritto in un linguaggio che conosci. Se sei un bardo, puoi scrivere ulteriori sette parole e scegliere di far brillare debolmente il messaggio, permettendo di vederlo nell'oscurità non magica. Lanciare Dissolvi Magie sul messaggio lo cancella; altrimenti svanisce dopo 24 ore.\n\n" +
"Lo strumento recupera tutte le cariche spese ogni giorno all'alba.",
    },
    'instrument-of-the-bards': {
        descrizione_it:
"Uno strumento dei bardi è un esempio squisito del suo genere, superiore a uno strumento ordinario sotto ogni aspetto. Esistono sette tipi, ciascuno chiamato come un leggendario collegio bardico. Una creatura che cerca di suonare lo strumento senza essere sintonizzata deve riuscire in un tiro salvezza su Saggezza con CD 15 o subire 2d4 danni psichici.\n\n" +
"Puoi usare un'azione per suonare lo strumento e lanciare uno dei suoi incantesimi. Una volta lanciato un incantesimo dallo strumento, non può essere lanciato di nuovo fino all'alba successiva. Gli incantesimi usano la tua caratteristica di lancio e CD.\n\n" +
"Tutti gli strumenti includono: Volare, Invisibilità, Levitazione, Protezione dal Bene e dal Male, più gli incantesimi specifici:\n" +
"- Arpa Anstruth (Molto Raro): Controllare il Tempo, Cura Ferite (5° liv.), Muro di Spine\n" +
"- Mandolino Canaith (Raro): Cura Ferite (3° liv.), Dissolvi Magie, Protezione dall'Energia (solo fulmine)\n" +
"- Lira Cli (Raro): Plasmare la Pietra, Muro di Fuoco, Muro di Vento\n" +
"- Liuto Doss (Non Comune): Amicizia con gli Animali, Protezione dall'Energia (solo fuoco), Protezione dal Veleno\n" +
"- Bandore Fochlucan (Non Comune): Intralciare, Fuoco Fatato, Shillelagh, Parlare con gli Animali\n" +
"- Cetra Mac-Fuirmidh (Non Comune): Pelle di Corteccia, Cura Ferite, Nube di Nebbia\n" +
"- Arpa Ollamh (Leggendario): Confusione, Controllare il Tempo, Tempesta di Fuoco",
    },
    'ioun-stone': {
        descrizione_it:
"Una Pietra Ioun prende il nome da Ioun, dea della conoscenza e profezia. Esistono molti tipi di pietra Ioun, ciascuna una distinta combinazione di forma e colore.\n\n" +
"Quando usi un'azione per lanciare in aria una di queste pietre, la pietra orbita attorno alla tua testa a una distanza di 0,3-0,9 metri e ti conferisce un beneficio. Una creatura deve usare un'azione per afferrare la pietra (CA 24 al tiro per colpire o prova di Destrezza Acrobazia con CD 24) per separarla. Puoi usare un'azione per afferrare e riporre la pietra.\n\n" +
"Una pietra ha CA 24, 10 pf e resistenza a tutti i danni.\n\n" +
"Tipi noti:\n" +
"- Assorbimento (Molto Raro, ellissoide lavanda pallido): cancella incantesimi di 4° livello o inferiore (max 20 livelli totali) come reazione.\n" +
"- Agilità (Molto Raro, sfera rosso scuro): Destrezza +2 (max 20).\n" +
"- Consapevolezza (Raro, romboide blu scuro): non puoi essere colto di sorpresa.\n" +
"- Fortezza (Molto Raro, romboide rosa): Costituzione +2 (max 20).\n" +
"- Assorbimento Maggiore (Leggendario, ellissoide lavanda/verde marmorizzato): cancella incantesimi di 8° liv. o inferiore (max 50 livelli).\n" +
"- Intuito (Molto Raro, sfera blu incandescente): Saggezza +2 (max 20).\n" +
"- Intelletto (Molto Raro, sfera scarlatta/blu marmorizzata): Intelligenza +2 (max 20).\n" +
"- Comando (Molto Raro, sfera rosa/verde marmorizzata): Carisma +2 (max 20).\n" +
"- Maestria (Leggendario, prisma verde pallido): bonus di competenza +1.\n" +
"- Protezione (Raro, prisma rosa polvere): +1 alla CA.\n" +
"- Rigenerazione (Leggendario, fuso bianco perlaceo): recuperi 15 pf alla fine di ogni ora se hai almeno 1 pf.\n" +
"- Riserva (Raro, prisma viola vibrante): immagazzina fino a 3 livelli di incantesimi.\n" +
"- Forza (Molto Raro, romboide blu pallido): Forza +2 (max 20).\n" +
"- Sostentamento (Raro, fuso trasparente): non hai bisogno di mangiare o bere.",
    },
    'iron-bands-of-bilarro': {
        descrizione_it:
"Questa sfera di ferro arrugginito misura 7,5 cm di diametro e pesa 0,5 kg. Puoi usare un'azione per pronunciare la parola di comando e lanciare la sfera contro una creatura Enorme o inferiore che vedi entro 18 metri da te. Mentre la sfera si muove in aria, si apre in un groviglio di bende metalliche.\n\n" +
"Effettua un tiro per colpire a distanza con bonus pari al tuo modificatore di Destrezza più il tuo bonus di competenza. Se colpisce, il bersaglio è trattenuto finché non usi un'azione bonus per pronunciare di nuovo la parola di comando per liberarlo. Farlo, o mancare l'attacco, fa contrarre le bende che tornano sferiche.\n\n" +
"Una creatura, inclusa quella trattenuta, può usare un'azione per effettuare una prova di Forza con CD 20 per spezzare le bende di ferro. Se ha successo, l'oggetto è distrutto e la creatura liberata. Se fallisce, ulteriori tentativi di quella creatura falliscono automaticamente per 24 ore.\n\n" +
"Una volta usate, le bende non possono essere riutilizzate fino all'alba successiva.",
    },
    'iron-flask': {
        descrizione_it:
"Questa bottiglia di ferro ha un tappo di ottone. Puoi usare un'azione per pronunciare la parola di comando della fiasca, bersagliando una creatura che vedi entro 18 metri da te. Se il bersaglio è nativo di un piano d'esistenza diverso da quello in cui ti trovi, deve riuscire in un tiro salvezza su Saggezza con CD 17 o essere intrappolato nella fiasca. Se è già stato intrappolato in precedenza, ha vantaggio al tiro salvezza. Una volta intrappolata, la creatura rimane finché non viene rilasciata.\n\n" +
"La fiasca contiene una creatura alla volta. Una creatura intrappolata non ha bisogno di respirare, mangiare o bere e non invecchia.\n\n" +
"Puoi usare un'azione per togliere il tappo e rilasciare la creatura. Essa è amichevole verso te e i tuoi compagni per 1 ora e obbedisce ai tuoi comandi per quella durata. Se non emetti comandi o ne emetti uno che probabilmente la ucciderebbe, si difende ma non agisce. Alla fine della durata, agisce secondo la propria disposizione e allineamento normali.\n\n" +
"Un incantesimo Identificare rivela che una creatura è dentro la fiasca, ma il solo modo per determinare il tipo è aprirla. Una fiasca appena scoperta potrebbe già contenere una creatura (vedi tabella d100 nel manuale).",
    },

    // ── Batch J ────────────────────────────────────────────────────────
    'javelin-of-lightning': {
        descrizione_it:
"Questo giavellotto è un'arma magica. Quando lo lanci e pronunci la sua parola di comando, si trasforma in un fulmine, formando una linea larga 1,5 metri che si estende da te a un bersaglio entro 36 metri. Ogni creatura nella linea, escluso te e il bersaglio, deve effettuare un tiro salvezza su Destrezza con CD 13, subendo 4d6 danni da fulmine se fallisce, o la metà se ha successo. Il fulmine torna giavellotto quando raggiunge il bersaglio.\n\n" +
"Effettua un attacco con arma a distanza contro il bersaglio. Se colpisci, il bersaglio subisce i danni del giavellotto più 4d6 danni da fulmine.\n\n" +
"La proprietà del giavellotto non può essere riutilizzata fino all'alba successiva. Nel frattempo, il giavellotto può ancora essere usato come arma magica.",
    },
    'jester-s-mask': {
        descrizione_it:
"Questa colorata maschera arlecchino è bordata di perle. Mentre la indossi ottieni i seguenti benefici:\n\n" +
"Focus Carismatico. Puoi usare la maschera come focus per incantesimi. Ottieni un bonus di +3 ai tiri per colpire e alle CD dei tiri salvezza dei tuoi incantesimi che usano Carisma come caratteristica di lancio.\n\n" +
"Fuga Meravigliosa. Quando una creatura ti colpisce con un tiro per colpire, puoi usare la reazione per scomparire in una nuvola di fumo e scintille colorate. Non subisci danni e invece ti teletrasporti, assieme all'equipaggiamento, in uno spazio libero che vedi entro 9 metri da te. Non riutilizzabile fino all'alba successiva.\n\n" +
"Sottosopra. Quando ottieni 1 al d20, puoi trattare il tiro come se avessi ottenuto 20. Non riutilizzabile fino all'alba successiva.",
    },

    // ── Batch K ────────────────────────────────────────────────────────
    'keoghtom-s-ointment': {
        descrizione_it:
"Questo barattolo di vetro, di 7,5 cm di diametro, contiene 1d4+1 dosi di un denso composto che emana un debole profumo di aloe. Il barattolo e il contenuto pesano 0,2 kg. Con un'azione, una dose di unguento può essere ingerita o applicata sulla pelle. La creatura che la riceve recupera 2d8+2 punti ferita, smette di essere avvelenata, ed è curata da qualsiasi malattia.",
    },

    // ── Batch L ────────────────────────────────────────────────────────
    'lantern-of-revealing': {
        descrizione_it:
"Mentre accesa, questa lanterna a cappuccio brucia per 6 ore con 0,5 litri d'olio, emanando luce intensa entro 9 metri e luce fioca per ulteriori 9 metri. Le creature e gli oggetti invisibili sono visibili finché si trovano nella luce intensa della lanterna. Puoi usare un'azione per abbassare il cappuccio, riducendo la luce a fioca entro 1,5 metri.",
    },
    'lash-of-immolation': {
        descrizione_it:
"L'impugnatura di questa frusta di pelle scura reca la runa del fuoco, e braci danzano attorno alla coda della frusta.\n\n" +
"Ottieni un bonus di +1 ai tiri per colpire e ai tiri di danno effettuati con quest'arma, e con un colpo la frusta infligge ulteriori 1d6 danni da fuoco. Quando ottieni un colpo critico con un attacco usando questa frusta, il bersaglio ha anche la condizione di trattenuto fino all'inizio del tuo prossimo turno, mentre bende infuocate gli si avvolgono.\n\n" +
"Invocare la Runa. Quando effettui un attacco con la frusta e colpisci, puoi usare la reazione per invocare la runa della frusta. Farlo aumenta i danni da fuoco extra inflitti dalla frusta a 2d6. Una volta invocata la runa, non può essere invocata di nuovo fino all'alba successiva.",
    },
    'libram-of-souls-and-flesh': {
        descrizione_it:
"Con copertine di pelle e rifiniture d'osso, questo tomo è freddo al tatto e sussurra debolmente. Quando viene trovato contiene gli incantesimi: Animare Morti, Cerchio della Morte, Falsa Vita, Dito della Morte, Parlare con i Morti, Evocare Non Morti, Tocco Vampirico, che diventano incantesimi da mago per te mentre sei sintonizzato. Funziona da libro degli incantesimi per te.\n\n" +
"Mentre tieni il libro, puoi usarlo come focus per i tuoi incantesimi da mago.\n\n" +
"Il libro ha 3 cariche e recupera 1d3 cariche spese ogni giorno all'alba. Puoi usare le cariche nei seguenti modi:\n" +
"- Se passi 1 minuto a studiare il libro, puoi spendere 1 carica per sostituire uno dei tuoi incantesimi da mago preparati con un incantesimo diverso del libro. Il nuovo incantesimo deve essere della scuola di necromanzia.\n" +
"- Con un'azione, puoi spendere 1 carica per assumere una parvenza di non morto per 10 minuti. Per la durata, hai un aspetto cadaverico, e i non morti sono indifferenti verso di te a meno che non li abbia danneggiati. Appari anche non morto a qualsiasi ispezione esteriore e agli incantesimi che determinano lo stato del bersaglio. L'effetto termina se infliggi danni o forzi una creatura a effettuare un tiro salvezza.",
    },
    'lifewell-tattoo': {
        descrizione_it:
"Prodotto da un ago speciale, questo tatuaggio magico presenta simboli di vita e rinascita.\n\n" +
"Sintonia del Tatuaggio. Per sintonizzarti, premi l'ago contro la pelle. Quando completata, l'ago diventa l'inchiostro del tatuaggio. Se la sintonia termina, il tatuaggio scompare e l'ago riappare.\n\n" +
"Resistenza Necrotica. Hai resistenza ai danni necrotici.\n\n" +
"Protezione di Vita. Quando dovresti essere ridotto a 0 punti ferita, scendi invece a 1 punto ferita. Non riutilizzabile fino all'alba successiva.",
    },
    'lock-of-trickery': {
        descrizione_it:
"Questa serratura appare come una serratura ordinaria (del tipo descritto nel Manuale del Giocatore) e viene fornita con una singola chiave. I cilindretti di questa serratura si regolano magicamente per ostacolare i ladri. Le prove di Destrezza effettuate per scassinare la serratura hanno svantaggio.",
    },
    'longbow-of-the-healing-hearth': {
        descrizione_it:
"Questo arco lungo di avorio è inciso con una preghiera al dio Hiatea, le cui rune si intrecciano con incisioni dorate di spighe di grano e corna di cervo.\n\n" +
"Ottieni un bonus di +3 ai tiri per colpire e ai tiri di danno effettuati con quest'arma. Se non carichi munizioni nell'arma, essa produce le proprie, creando automaticamente una freccia magica quando tendi la corda. La freccia svanisce nell'istante successivo al colpo o al mancato bersaglio.\n\n" +
"L'arco ha 8 cariche per le seguenti proprietà, utilizzabili mentre lo impugni. Recupera 1d4+1 cariche ogni giorno all'alba.\n\n" +
"Freccia Curativa. Quando esegui l'azione di Attacco usando l'arco, puoi spendere 1 carica per sostituire uno dei tuoi attacchi con una freccia ardente di magia curativa, che colpisce automaticamente una creatura che vedi entro 45 metri da te. Il bersaglio può immediatamente spendere e tirare uno dei suoi Dadi Vita non spesi e recuperare un numero di punti ferita pari al risultato più il tuo modificatore di Saggezza (minimo +1). Se il bersaglio non ha Dadi Vita non spesi, non succede nulla. Una freccia curativa per turno.\n\n" +
"Incantesimi. Mentre tieni l'arco, puoi usare un'azione per spendere cariche per lanciare (CD 18): Creare Cibo e Acqua (1), Vincolo di Protezione (2), Guardiano della Fede (3).",
    },
    'luba-s-tarokka-of-souls': {
        descrizione_it:
"Non tutti gli spiriti vaganti sono anime tragiche perdute. Alcuni languono come prigionieri, anime così malvagie che i mortali non osano liberarli. Creato da una figura della leggenda Vistani, il Tarokka delle Anime di Luba ha plasmato il destino di innumerevoli eroi. Le profezie di questo mazzo hanno anche rivelato grandi mali. Mamma Luba intrappolò entità malvagie tra i fili del fato, imprigionandole nel mazzo.\n\n" +
"Come tutti i mazzi tarokka, contiene 54 carte: 14 dell'alto mazzo e 40 divise in quattro semi (monete, glifi, stelle, spade).\n\n" +
"Proprietà Casuali. 2 proprietà dannose minori, 2 proprietà benefiche minori.\n\n" +
"Incantesimi. Mentre tieni il mazzo, puoi usare un'azione per lanciare (CD 18): Comprendere i Linguaggi, Individuazione del Bene e del Male, Individuazione del Magico, Individuazione di Veleni e Malattie, Localizzare Oggetto o Scrutare. Una volta usato, l'incantesimo non riutilizzabile fino all'alba successiva.\n\n" +
"Visione Persistente. Mentre tieni il mazzo, hai successo automatico ai tiri salvezza su Costituzione per mantenere la concentrazione su incantesimi di divinazione.\n\n" +
"Torsione del Fato. Con un'azione, puoi estrarre una carta e influenzare la fortuna di un'altra creatura che vedi entro 4,5 metri:\n" +
"- Bene: la creatura ha vantaggio ai tiri per colpire, alle prove di caratteristica e ai tiri salvezza per la prossima ora.\n" +
"- Male: la creatura ha svantaggio ai tiri per colpire, alle prove di caratteristica e ai tiri salvezza per la prossima ora.\n\n" +
"Due usi al giorno, recuperati all'alba.\n\n" +
"Prigionieri del Fato. Ogni volta che usi Torsione del Fato, c'è una possibilità che una delle 14 anime intrappolate fugga (vedi tabella nel manuale: Flameskull, Wraith, Banshee, Vampiro, Mummia, Cavaliere della Morte, Spettro, Lord Mummia, ecc.). L'anima rilasciata appare entro 16d10 km, beneficia di 'Bene' permanente, e tu e il bersaglio originale subite 'Male' permanente.\n\n" +
"Mescolare Fato. Se passano 7 giorni senza usare Torsione del Fato, la sintonia termina.\n\n" +
"Distruggere il Mazzo. Solo se tutte e 14 le anime vengono liberate e distrutte; appare allora una 15ª anima (un lich); distruggendolo anche essa, il mazzo torna ordinario.",
    },
    'lucent-destroyer': {
        descrizione_it:
"Quest'arma magica è un moschetto di bronzo a tripla canna. Ottieni un bonus di +1 ai tiri per colpire e ai tiri di danno effettuati con essa. Non richiede munizioni, i suoi danni sono radianti invece che perforanti, e non ha la proprietà ricaricare. La base dell'arma è marchiata con la runa della luce.\n\n" +
"Inoltre, mentre sei sintonizzato con l'arma, puoi lanciare a volontà Luci Danzanti dal moschetto.\n\n" +
"Invocare la Runa. Con un'azione, puoi invocare la runa dell'arma per lanciare l'incantesimo Raggio di Sole (CD 17). Una volta invocata la runa, non può essere invocata di nuovo fino all'alba successiva.",
    },
    'luck-blade': {
        descrizione_it:
"Ottieni un bonus di +1 ai tiri per colpire e ai tiri di danno effettuati con quest'arma magica. Mentre la spada è sulla tua persona, ottieni anche un bonus di +1 ai tiri salvezza.\n\n" +
"Fortuna. Se la spada è sulla tua persona, puoi invocare la sua fortuna (nessuna azione richiesta) per ritirare un tiro per colpire, prova di caratteristica o tiro salvezza che non ti è piaciuto. Devi usare il secondo tiro. Non riutilizzabile fino all'alba successiva.\n\n" +
"Desiderio. La spada ha 1d4-1 cariche. Mentre la tieni, puoi usare un'azione per spendere 1 carica e lanciare l'incantesimo Desiderio. Non riutilizzabile fino all'alba successiva. La spada perde questa proprietà se non ha cariche.",
    },
    'lyre-of-building': {
        descrizione_it:
"Mentre tieni questa lira, puoi lanciare Riparare con un'azione. Puoi anche suonare la lira come reazione quando un oggetto o una struttura che vedi entro 90 metri da te subisce danni, rendendola immune a quei danni e a ulteriori danni dello stesso tipo fino all'inizio del tuo prossimo turno.\n\n" +
"Inoltre, puoi suonare la lira con un'azione per lanciare Fabbricare, Smuovere il Terreno, Passamuro o Evocare Costrutto, e quell'incantesimo non può essere lanciato di nuovo fino all'alba successiva.",
    },

    // ── Batch M ────────────────────────────────────────────────────────
    'mace-of-disruption': {
        descrizione_it:
"Quando colpisci un immondo o un non morto con quest'arma magica, quella creatura subisce ulteriori 2d6 danni radianti. Se il bersaglio ha 25 punti ferita o meno dopo aver subito questi danni, deve riuscire in un tiro salvezza su Saggezza con CD 15 o essere distrutto. Se ha successo, la creatura diventa spaventata da te fino alla fine del tuo prossimo turno.\n\n" +
"Mentre tieni quest'arma, emana luce intensa entro 6 metri e luce fioca per ulteriori 6 metri.",
    },
    'mace-of-smiting': {
        descrizione_it:
"Ottieni un bonus di +1 ai tiri per colpire e ai tiri di danno effettuati con quest'arma magica. Il bonus aumenta a +3 quando usi la mazza per attaccare un costrutto.\n\n" +
"Quando ottieni 20 al tiro per colpire effettuato con quest'arma, il bersaglio subisce ulteriori 7 danni contundenti, o 14 danni contundenti se è un costrutto. Se un costrutto ha 25 punti ferita o meno dopo questi danni, viene distrutto.",
    },
    'mace-of-terror': {
        descrizione_it:
"Quest'arma magica ha 3 cariche. Mentre la tieni, puoi usare un'azione e spendere 1 carica per emettere un'ondata di terrore. Ogni creatura a tua scelta in un raggio di 9 metri da te deve riuscire in un tiro salvezza su Saggezza con CD 15 o essere spaventata da te per 1 minuto. Mentre spaventata in questo modo, deve passare i suoi turni cercando di allontanarsi il più possibile da te, e non può volontariamente muoversi entro 9 metri da te. Non può effettuare reazioni. Per la sua azione, può solo Scattare o cercare di sfuggire a un effetto che le impedisce di muoversi. Alla fine di ciascun suo turno, può ripetere il tiro salvezza.\n\n" +
"La mazza recupera 1d3 cariche spese ogni giorno all'alba.",
    },
    'mantle-of-spell-resistance': {
        descrizione_it:
"Hai vantaggio ai tiri salvezza contro gli incantesimi mentre indossi questo mantello.",
    },
    'manual-of-bodily-health': {
        descrizione_it:
"Questo libro contiene consigli di salute e dieta, e le sue parole sono cariche di magia. Se passi 48 ore in un periodo di 6 giorni o meno studiandone i contenuti e praticandone le linee guida, il tuo punteggio di Costituzione aumenta di 2, così come il massimo per quel punteggio. Il manuale perde poi la magia, ma la riacquista in un secolo.",
    },
    'manual-of-gainful-exercise': {
        descrizione_it:
"Questo libro descrive esercizi fisici, e le sue parole sono cariche di magia. Se passi 48 ore in un periodo di 6 giorni o meno studiandone i contenuti e praticandone le linee guida, il tuo punteggio di Forza aumenta di 2, così come il massimo per quel punteggio. Il manuale perde poi la magia, ma la riacquista in un secolo.",
    },
    'manual-of-golems': {
        descrizione_it:
"Questo tomo contiene informazioni e incantesimi necessari per creare un particolare tipo di golem. Il DM sceglie il tipo o lo determina casualmente. Per decifrare e usare il manuale, devi essere un incantatore con almeno due slot incantesimo di 5° livello. Una creatura che non può usare un manuale dei golem e tenta di leggerlo subisce 6d6 danni psichici.\n\n" +
"Tabella tipi:\n" +
"- 1-5 Argilla: 30 giorni, 65.000 mo\n" +
"- 6-17 Carne: 60 giorni, 50.000 mo\n" +
"- 18 Ferro: 120 giorni, 100.000 mo\n" +
"- 19-20 Pietra: 90 giorni, 80.000 mo\n\n" +
"Per creare un golem, devi spendere il tempo indicato in tabella, lavorando senza interruzioni con il manuale a portata di mano e riposando non più di 8 ore al giorno. Devi anche pagare il costo specificato per acquistare i materiali.\n\n" +
"Una volta finito di creare il golem, il libro viene consumato in fiamme arcane. Il golem si anima quando le ceneri del manuale gli vengono cosparse sopra. È sotto il tuo controllo e comprende e obbedisce ai tuoi comandi vocali.",
    },
    'manual-of-quickness-of-action': {
        descrizione_it:
"Questo libro contiene esercizi di coordinazione ed equilibrio, e le sue parole sono cariche di magia. Se passi 48 ore in un periodo di 6 giorni o meno studiandone i contenuti e praticandone le linee guida, il tuo punteggio di Destrezza aumenta di 2, così come il massimo per quel punteggio. Il manuale perde poi la magia, ma la riacquista in un secolo.",
    },
    'mariner-s-armor': {
        descrizione_it:
"Mentre indossi questa armatura, hai una velocità di nuoto pari alla tua velocità di camminata. Inoltre, ogni volta che inizi il tuo turno sott'acqua con 0 punti ferita, l'armatura ti fa risalire di 18 metri verso la superficie. L'armatura è decorata con motivi di pesci e conchiglie.",
    },
    'masquerade-tattoo': {
        descrizione_it:
"Prodotto da un ago speciale, questo tatuaggio magico appare sul tuo corpo come tu desideri.\n\n" +
"Sintonia del Tatuaggio. Per sintonizzarti, premi l'ago contro la pelle. Quando completata, l'ago diventa l'inchiostro del tatuaggio. Se la sintonia termina, il tatuaggio scompare e l'ago riappare.\n\n" +
"Inchiostro Fluido. Con un'azione bonus, puoi modellare il tatuaggio in qualsiasi colore o motivo e spostarlo in qualsiasi area della pelle. Qualunque forma assuma, è sempre evidentemente un tatuaggio. Le dimensioni vanno da non più piccolo di una moneta di rame fino a un'opera d'arte intricata che copre tutta la pelle.\n\n" +
"Camuffarsi. Con un'azione, puoi usare il tatuaggio per lanciare l'incantesimo Camuffarsi (CD 13 per discernere il travestimento). Una volta lanciato, non può essere lanciato di nuovo dal tatuaggio fino all'alba successiva.",
    },
    'medallion-of-thoughts': {
        descrizione_it:
"Il medaglione ha 3 cariche. Mentre lo indossi, puoi usare un'azione e spendere 1 carica per lanciare l'incantesimo Individuazione del Pensiero (CD 13) da esso. Recupera 1d3 cariche spese ogni giorno all'alba.",
    },
    'mighty-servant-of-leuk-o': {
        descrizione_it:
"Chiamato come il signore della guerra che lo impiegò famigeratamente, il Possente Servitore di Leuk-o è una macchina alta 3 metri di fantastico potere che si trasforma in un costrutto animato quando pilotato. Realizzato di una lega nera lucente di origine sconosciuta, il servitore è spesso descritto come una combinazione di un nano sproporzionato e uno scarafaggio sovradimensionato. Contiene spazio per 1 tonnellata di carico e una cabina equipaggio interna, dalla quale fino a due creature Medie possono controllarlo.\n\n" +
"Sintonia Pericolosa. Due creature possono essere sintonizzate al servitore alla volta. La sintonia richiede 2 ore (riposo lungo) durante le quali devi essere all'interno del servitore. Mentre si sintonizzano, qualsiasi creatura o struttura entro 15 metri ha il 25% di essere accidentalmente bersagliata da uno dei suoi attacchi Pugno Distruttivo.\n\n" +
"Controllare il Servitore. Una volta sintonizzati, gli attuati possono aprire il portello facilmente. Altrimenti richiede una prova di Destrezza con strumenti da scasso CD 25. Mentre dentro: muovere il servitore (nessuna azione), aprire/chiudere portello (1 volta per turno, nessuna azione), comandare un'azione del blocco statistiche, o fargli fare un attacco di opportunità con la reazione.\n\n" +
"Spirito nella Macchina. Alla sua morte, l'anima di Leuk-o fu attratta nell'artefatto e ne è la forza animatrice. Una volta ogni 24 ore, il servitore (a discrezione del DM) effettua un'azione anche senza equipaggio. Se perde metà dei pf, ogni creatura sintonizzata deve riuscire in un tiro salvezza su Saggezza CD 20 o essere affascinata per 24 ore in modalità distruttiva.\n\n" +
"Auto-Distruzione. Sequenza segreta di leve/pulsanti su 3 round consecutivi. All'attivazione, esplosione in raggio 30 metri: TS Destrezza CD 25, 87 (25d6) danni da forza + 87 da fulmine + 87 da tuono. Strutture triplo danno. Le creature dentro muoiono. Dopo 2d6 giorni i pezzi cadono dal cielo entro 1.600 km e si ricongiungono se posti entro 1,5 metri.\n\n" +
"Stat block: costrutto Enorme, CA 22, 310 pf, velocità 18 m, FOR 30, DES 14, COS 20, INT 1, SAG 14, CAR 10. Resistenze a perforanti/taglienti. Immunità ad acido, contundenti, freddo, fuoco, fulmine, necrotici, veleno, psichici, radianti. Quasi tutte le condizioni immune. Percezione cieca 36 m. Rigenerazione 10 pf/turno. Pugno Distruttivo: +17 al colpo, mischia 3 m o gittata 36 m, 36 (4d12+10) danni da forza (triplo agli oggetti). Salto di Schiacciamento: dopo aver saltato almeno 7,5 metri, atterra in uno spazio con creature, ognuna TS Destrezza CD 25, 26 (4d12) contundenti e prono se fallisce.",
    },
    'mirror-of-life-trapping': {
        descrizione_it:
"Quando questo specchio alto 1,2 metri viene visto indirettamente, la sua superficie mostra deboli immagini di creature. Pesa 22 kg, e ha CA 11, 10 pf e vulnerabilità ai danni contundenti. Si frantuma e viene distrutto a 0 pf.\n\n" +
"Se lo specchio è appeso a una superficie verticale e sei entro 1,5 metri, puoi usare un'azione per pronunciarne la parola di comando e attivarlo. Rimane attivato finché non usi un'azione per pronunciare di nuovo la parola.\n\n" +
"Qualsiasi creatura tranne te che vede la propria immagine riflessa nello specchio attivato mentre è entro 9 metri da esso deve riuscire in un tiro salvezza su Carisma con CD 15 o essere intrappolata, assieme all'equipaggiamento, in una delle dodici celle extradimensionali dello specchio. Il TS è effettuato con vantaggio se la creatura conosce la natura dello specchio, e i costrutti hanno automaticamente successo.\n\n" +
"Una cella extradimensionale è un'estensione infinita riempita di nebbia densa che riduce la visibilità a 3 metri. Le creature intrappolate non invecchiano e non hanno bisogno di mangiare, bere o dormire. Una creatura intrappolata può fuggire usando magia che permetta viaggio planare. Se lo specchio cattura una creatura ma le 12 celle sono già occupate, libera casualmente una creatura intrappolata.\n\n" +
"Mentre sei entro 1,5 metri dallo specchio, puoi usare un'azione per pronunciare il nome di una creatura intrappolata o chiamare una cella per numero. La creatura appare come immagine sulla superficie e potete comunicare normalmente. In modo simile, puoi usare un'azione per pronunciare una seconda parola di comando e liberare una creatura intrappolata.",
    },
    'mistral-mantle': {
        descrizione_it:
"Questo spesso mantello foderato di pelliccia ha la runa del gelo cucita sull'orlo con filo blu argenteo. Vento gelido vortica attorno al mantello, indipendentemente dal tempo.\n\n" +
"Mentre indossi questo mantello, hai resistenza ai danni da freddo. Inoltre, quando ti muovi entro 1,5 metri da una creatura, puoi far sì che il vento freddo del mantello la colpisca. La creatura deve riuscire in un tiro salvezza su Destrezza con CD 14 o subire 1d6 danni da freddo e avere la condizione di prono. Una creatura può essere influenzata dal mantello solo una volta per turno.\n\n" +
"Invocare la Runa. Con un'azione, puoi invocare la runa del mantello per lanciare l'incantesimo Tempesta di Nevischio (CD 14). Quando usi il mantello per lanciare l'incantesimo, l'area dell'incantesimo non è terreno difficile per te, e puoi vedere attraverso la tempesta, ignorando le penalità normali di un'area pesantemente oscurata. Non riutilizzabile fino all'alba successiva.",
    },
    'mithral-armor': {
        descrizione_it:
"Il mithral è un metallo leggero e flessibile. Una camicia di mithral può essere indossata sotto i vestiti normali. Se l'armatura normalmente impone svantaggio alle prove di Destrezza (Furtività) o ha un requisito minimo di Forza, la versione di mithral non lo fa.",
    },
    'moon-sickle': {
        descrizione_it:
"Questo falcetto dalla lama d'argento brilla dolcemente di luce lunare. Mentre tieni quest'arma magica, ottieni un bonus ai tiri per colpire e ai tiri di danno effettuati con essa, e ottieni un bonus ai tiri per colpire con incantesimo e alle CD dei tiri salvezza dei tuoi incantesimi da druido e ranger. Il bonus è determinato dalla rarità dell'arma. Inoltre, puoi usare il falcetto come focus per i tuoi incantesimi da druido e ranger.\n\n" +
"Quando lanci un incantesimo che ripristina punti ferita, puoi tirare un d4 e aggiungere il numero ottenuto al totale dei punti ferita ripristinati, purché tu stia tenendo il falcetto.",
    },
    'moon-touched-sword': {
        descrizione_it:
"Nell'oscurità, la lama sguainata di questa spada emana luce lunare, creando luce intensa entro 4,5 metri e luce fioca per ulteriori 4,5 metri.",
    },
    'moonblade': {
        descrizione_it:
"Una Lamaluna passa di genitore in figlio. La spada sceglie il suo portatore e rimane legata a quella persona per tutta la vita. Se il portatore muore, un altro erede può reclamare la lama. Se non esiste un erede degno, la spada giace dormiente, funzionando come una normale spada lunga finché un'anima degna non la rivendica. La sintonia richiede uno speciale rituale nella sala del trono di un reggente elfico o in un tempio dedicato agli dei elfici.\n\n" +
"Una Lamaluna non servirà nessuno che consideri vile, instabile, corrotto o in contrasto con la preservazione e protezione della stirpe elfica. Se rifiuta, hai svantaggio per 24 ore. Se accetta, ti sintonizzi e una nuova runa appare sulla lama.\n\n" +
"Una Lamaluna ha una runa per ogni padrone servito (tipicamente 1d6+1). La prima runa concede sempre +1 ai tiri per colpire e ai tiri di danno. Ogni runa successiva concede una proprietà aggiuntiva (vedi tabella nel manuale): aumento del bonus fino a +3, proprietà minore casuale, accuratezza, lanciabile, funziona come Difensore, critico su 19-20, danni extra 1d6 (taglienti o tipo elementale), lampo accecante, anello di immagazzinare incantesimi, evocare ombra elfica, Spada Vorpal.\n\n" +
"Senzienza. Lamaluna è un'arma senziente neutrale buona con Intelligenza 12, Saggezza 10 e Carisma 12. Ha udito e scurovisione fino a 36 metri. Comunica trasmettendo emozioni o, durante trance/sonno, attraverso visioni. Cerca l'avanzamento della stirpe elfica e degli ideali elfici (coraggio, lealtà, bellezza, musica, vita). Difetto: eccessiva sicurezza.",
    },
    'mystery-key': {
        descrizione_it:
"Un punto interrogativo è inciso sulla testa di questa chiave. La chiave ha il 5% di probabilità di sbloccare qualsiasi serratura in cui viene inserita. Una volta sbloccato qualcosa, la chiave scompare.",
    },

    // ── Batch N ────────────────────────────────────────────────────────
    'nature-s-mantle': {
        descrizione_it:
"Questo mantello cambia colore e texture per fondersi col terreno circostante. Mentre indossi il mantello, puoi usarlo come focus per i tuoi incantesimi da druido e ranger.\n\n" +
"Mentre sei in un'area lievemente oscurata, puoi Nasconderti come azione bonus anche se sei direttamente osservato.",
    },
    'necklace-of-adaptation': {
        descrizione_it:
"Mentre indossi questa collana, puoi respirare normalmente in qualsiasi ambiente, e hai vantaggio ai tiri salvezza contro gas e vapori dannosi (come gli effetti di Nube Mortale e Nube Maleodorante, veleni inalati e gli attacchi del soffio di alcuni draghi).",
    },
    'necklace-of-fireballs': {
        descrizione_it:
"Questa collana ha 1d6+3 perline appese. Puoi usare un'azione per staccare una perlina e lanciarla fino a 18 metri. Quando raggiunge la fine della traiettoria, la perlina detona come un incantesimo Palla di Fuoco di 3° livello (CD 15).\n\n" +
"Puoi lanciare più perline, o anche l'intera collana, con una sola azione. Quando lo fai, aumenta il livello della Palla di Fuoco di 1 per ogni perlina oltre la prima.",
    },
    'necklace-of-prayer-beads': {
        descrizione_it:
"Questa collana ha 1d4+2 perline magiche di acquamarina, perla nera o topazio. Ha anche molte perline non magiche di pietre come ambra, diaspro sanguigno, citrino, corallo, giada, perla o quarzo. Se una perlina magica viene rimossa, perde la sua magia.\n\n" +
"Esistono sei tipi di perline magiche. Il DM decide il tipo o lo determina casualmente. Per usarne una, devi indossare la collana. Ogni perlina contiene un incantesimo che puoi lanciare come azione bonus (usando la tua CD se necessario). Una volta lanciato, quella perlina non riutilizzabile fino all'alba successiva.\n\n" +
"Tabella d20:\n" +
"- 1-6 Benedizione: Benedire\n" +
"- 7-12 Cura: Cura Ferite (2° liv.) o Ristorare Inferiore\n" +
"- 13-16 Favore: Ristorare Superiore\n" +
"- 17-18 Castigo: Castigo Marchiante\n" +
"- 19 Evocazione: Alleato Planare\n" +
"- 20 Cammino del Vento: Cammino del Vento",
    },
    'nimbus-coronet': {
        descrizione_it:
"Il design di questo diadema di bronzo ricorda nuvole vorticanti. Al centro è incastonata una pietra blu profondo, sulla quale è incisa la runa della nuvola.\n\n" +
"Mentre indossi questo diadema, non subisci danni dalle cadute. Inoltre, con un'azione bonus, tu e tutto ciò che indossi o porti potete teletrasportarvi in uno spazio libero che vedi entro 4,5 metri da te, riapparendo in uno sbuffo di nuvole scintillanti.\n\n" +
"Invocare la Runa. Con un'azione, puoi invocare la runa del diadema per assumere una forma di nuvola. La forma dura 1 minuto, finché non sei incapacitato, o finché non la dismetti (nessuna azione richiesta). Mentre in forma di nuvola, hai una velocità di volo di 18 metri e resistenza ai danni contundenti, perforanti e taglienti. Non riutilizzabile fino all'alba successiva.",
    },
    'nine-lives-stealer': {
        descrizione_it:
"Ottieni un bonus di +2 ai tiri per colpire e ai tiri di danno effettuati con quest'arma magica.\n\n" +
"La spada ha 1d8+1 cariche. Se ottieni un colpo critico contro una creatura che ha meno di 100 punti ferita, deve riuscire in un tiro salvezza su Costituzione con CD 15 o essere uccisa istantaneamente mentre la spada le strappa la forza vitale dal corpo (un costrutto o un non morto è immune). La spada perde 1 carica se la creatura viene uccisa. Quando la spada non ha più cariche, perde questa proprietà.",
    },
    'nolzur-s-marvelous-pigments': {
        descrizione_it:
"La vernice fluisce dal pennello formando l'oggetto desiderato mentre ti concentri sulla sua immagine.\n\n" +
"Ogni vasetto di vernice è sufficiente a coprire 100 m², il che ti permette di creare oggetti inanimati o caratteristiche del terreno (come una porta, una fossa, fiori, alberi, celle, stanze o armi) fino a 280 m³. Servono 10 minuti per coprire 10 m².\n\n" +
"Quando completi la pittura, l'oggetto o la caratteristica del terreno raffigurato diventa un oggetto reale, non magico. Quindi, dipingere una porta su un muro crea una porta vera che può essere aperta verso ciò che si trova al di là. Dipingere una fossa su un pavimento crea una fossa reale.\n\n" +
"Niente di creato può avere un valore superiore a 25 mo. Se dipingi un oggetto di valore maggiore (come un diamante o un mucchio d'oro), l'oggetto sembra autentico, ma un'ispezione ravvicinata rivela che è fatto di pasta, osso o altro materiale senza valore. Se dipingi una forma di energia come fuoco o fulmine, l'energia appare ma si dissipa appena completi la pittura, senza causare danni.",
    },

    // ── Batch O ────────────────────────────────────────────────────────
    'oathbow': {
        descrizione_it:
"Quando incocchi una freccia su questo arco, sussurra in Elfico: \"Rapida sconfitta ai miei nemici\". Quando usi quest'arma per effettuare un attacco a distanza, puoi, come frase di comando, dire: \"Rapida morte a te che mi hai fatto torto\". Il bersaglio del tuo attacco diventa il tuo nemico giurato finché non muore o fino all'alba di sette giorni dopo. Puoi avere solo un nemico giurato alla volta. Quando il tuo nemico giurato muore, puoi sceglierne uno nuovo dopo l'alba successiva.\n\n" +
"Quando effettui un tiro per colpire a distanza con quest'arma contro il tuo nemico giurato, hai vantaggio al tiro. Inoltre, il tuo bersaglio non ottiene alcun beneficio dalla copertura, tranne la copertura totale, e tu non subisci svantaggio per la lunga distanza. Se l'attacco colpisce, il tuo nemico giurato subisce ulteriori 3d6 danni perforanti.\n\n" +
"Mentre il tuo nemico giurato è vivo, hai svantaggio ai tiri per colpire con tutte le altre armi.",
    },
    'oil-of-etherealness': {
        descrizione_it:
"Questo olio leggermente brillante può coprire una creatura Media, assieme all'equipaggiamento (richiede una fiala aggiuntiva per ogni categoria di taglia oltre Media). Applicarlo richiede 10 minuti. La creatura affetta ottiene poi l'effetto dell'incantesimo Etereità per 1 ora.",
    },
    'oil-of-sharpness': {
        descrizione_it:
"Questo olio gelatinoso trasparente brilla con minuscole, ultrasottili schegge d'argento. L'olio può coprire un'arma tagliente o perforante o fino a 5 munizioni taglienti o perforanti. Applicare l'olio richiede 1 minuto. Per 1 ora, l'oggetto rivestito è magico e ha un bonus di +3 ai tiri per colpire e ai tiri di danno.",
    },
    'oil-of-slipperiness': {
        descrizione_it:
"Questo unguento nero e appiccicoso è denso e pesante nel contenitore, ma scorre velocemente quando versato. L'olio può coprire una creatura Media o inferiore, assieme all'equipaggiamento (una fiala aggiuntiva per ogni categoria di taglia oltre Media). Applicare l'olio richiede 10 minuti. La creatura affetta ottiene poi l'effetto dell'incantesimo Libertà di Movimento per 8 ore.\n\n" +
"In alternativa, l'olio può essere versato a terra come azione, dove copre un quadrato di 3 metri di lato, duplicando l'effetto dell'incantesimo Grasso in quell'area per 8 ore.",
    },
    'orb-of-direction': {
        descrizione_it:
"Mentre tieni questo orbe, puoi usare un'azione per determinare quale direzione è il nord. Questa proprietà funziona solo sul Piano Materiale.",
    },
    'orb-of-dragonkind': {
        descrizione_it:
"Un orbe è un globo di cristallo inciso di circa 25 cm di diametro. Quando viene usato, cresce a circa 50 cm di diametro, e una nebbia vortica al suo interno. Originariamente uno per ogni torre dei maghi, vennero usati per attirare e distruggere draghi durante una guerra. Solo tre si pensa siano sopravvissuti. La loro magia è stata distorta nei secoli; ognuno contiene l'essenza di un drago malvagio che si oppone a chi cerca di usarlo.\n\n" +
"Mentre sintonizzato con un orbe, puoi usare un'azione per scrutare nelle sue profondità e pronunciare la sua parola di comando. Devi poi superare una prova di Carisma con CD 15. Se hai successo, controlli l'orbe finché rimani sintonizzato. Se fallisci, vieni affascinato dall'orbe finché rimani sintonizzato. Mentre affascinato, non puoi terminare volontariamente la sintonia, e l'orbe lancia Suggestione su di te a volontà (CD 18).\n\n" +
"Proprietà Casuali: 2 proprietà benefiche minori, 1 dannosa minore, 1 dannosa maggiore.\n\n" +
"Incantesimi. L'orbe ha 7 cariche e recupera 1d4+3 cariche all'alba. Se controlli l'orbe, puoi spendere cariche per lanciare (CD 18): Cura Ferite (5° liv., 3 cariche), Luce del Giorno (1), Pegno di Morte (2), Scrutare (3). Puoi anche lanciare Individuazione del Magico senza spendere cariche.\n\n" +
"Chiamare Draghi. Mentre controlli l'orbe, puoi usare un'azione per emettere un richiamo telepatico in tutte le direzioni per 64 km. I draghi malvagi nel raggio si sentono compelliti a venire all'orbe il prima possibile. Le divinità draconiche come Tiamat sono inalterate. I draghi attratti potrebbero essere ostili. Una volta usata, non riutilizzabile per 1 ora.\n\n" +
"Distruggere un Orbe. L'orbe appare fragile ma è impervio alla maggior parte dei danni, inclusi attacchi e soffi dei draghi. Un incantesimo Disintegrazione o un buon colpo da un'arma magica +3 è sufficiente per distruggerlo.",
    },
    'orb-of-skoraeus': {
        descrizione_it:
"Si dice infuso con la saggezza e il potere del dio Skoraeus, questo orbe di pietra lucida è venato di cristallo iridescente che sembra brillare dall'interno. L'orbe è di 20 cm di diametro e pesa 3,5 kg, rendendolo un ninnolo per un gigante della pietra ma più ingombrante per una creatura Media.\n\n" +
"Mentre tieni questo orbe, puoi usarlo come focus per i tuoi incantesimi. Ottieni anche i seguenti benefici:\n\n" +
"Componenti Abbondanti. L'orbe ha 3 cariche e recupera tutte le cariche all'alba. Quando lanci un incantesimo mentre tieni questo orbe, puoi spendere fino a 3 cariche per ignorare le componenti materiali dell'incantesimo con costo in monete d'oro, fino a 300 mo per carica spesa.\n\n" +
"Mente Acuta. Ottieni un bonus di +2 a qualsiasi tiro salvezza su Costituzione effettuato per mantenere la concentrazione su un incantesimo.\n\n" +
"Vista Divina. Puoi vedere normalmente nell'oscurità, sia magica che non magica, fino a una distanza di 36 metri.",
    },
    'orb-of-time': {
        descrizione_it:
"Mentre tieni questo orbe, puoi usare un'azione per determinare se all'esterno è mattino, pomeriggio, sera o notte. Questa proprietà funziona solo sul Piano Materiale.",
    },
    // ── Batch P ────────────────────────────────────────────────────────
    'pearl-of-power': {
        descrizione_it:
"Mentre questa perla è sulla tua persona, puoi usare un'azione per pronunciare la sua parola di comando e recuperare uno slot incantesimo speso. Se lo slot speso era di 4° livello o superiore, il nuovo slot è di 3° livello. Una volta usata, la perla non può essere riutilizzata fino all'alba successiva.",
    },
    'perfume-of-bewitching': {
        descrizione_it:
"Questa minuscola fiala contiene un profumo magico, sufficiente per un solo uso. Puoi usare un'azione per applicare il profumo su te stesso, e il suo effetto dura 1 ora. Per la durata, hai vantaggio a tutte le prove di Carisma rivolte a umanoidi di grado di sfida 1 o inferiore. Coloro soggetti all'effetto non sono consapevoli di essere stati influenzati da magia.",
    },
    'periapt-of-health': {
        descrizione_it:
"Sei immune a contrarre qualsiasi malattia mentre indossi questo pendaglio. Se sei già infetto da una malattia, gli effetti della malattia sono soppressi mentre indossi il pendaglio.",
    },
    'periapt-of-proof-against-poison': {
        descrizione_it:
"Questa delicata catena d'argento ha un pendaglio di gemma nera taglio brillante. Mentre lo indossi, i veleni non hanno effetto su di te. Sei immune alla condizione di avvelenato e hai immunità ai danni da veleno.",
    },
    'periapt-of-wound-closure': {
        descrizione_it:
"Mentre indossi questo pendaglio, ti stabilizzi ogni volta che stai morendo all'inizio del tuo turno. Inoltre, ogni volta che tiri un Dado Vita per recuperare punti ferita, raddoppia il numero di punti ferita ripristinati.",
    },
    'philter-of-love': {
        descrizione_it:
"La prossima volta che vedi una creatura entro 10 minuti dopo aver bevuto questo filtro, sei affascinato da quella creatura per 1 ora. Se la creatura è di una specie e genere a cui sei normalmente attratto, la consideri il tuo vero amore mentre sei affascinato. Questo liquido frizzante color rosa contiene una bolla difficile da notare a forma di cuore.",
    },
    'pipe-of-smoke-monsters': {
        descrizione_it:
"Mentre fumi questa pipa, puoi usare un'azione per esalare uno sbuffo di fumo che assume la forma di una singola creatura, come un drago, un flumph o un froghemoth. La forma deve essere abbastanza piccola da entrare in un cubo di 30 cm di lato e perde la sua forma dopo pochi secondi, diventando uno sbuffo di fumo ordinario.",
    },
    'pipes-of-haunting': {
        descrizione_it:
"Devi essere competente negli strumenti a fiato per usare queste cornamuse. Hanno 3 cariche. Puoi usare un'azione per suonarle e spendere 1 carica per creare una melodia inquietante e ammaliante. Ogni creatura entro 9 metri da te che ti sente suonare deve riuscire in un tiro salvezza su Saggezza con CD 15 o essere spaventata da te per 1 minuto. Se vuoi, tutte le creature nell'area che non sono ostili automaticamente hanno successo. Una creatura che fallisce può ripetere il TS alla fine di ciascun suo turno. Una creatura che ha successo è immune all'effetto di queste cornamuse per 24 ore. Le cornamuse recuperano 1d3 cariche spese ogni giorno all'alba.",
    },
    'pipes-of-the-sewers': {
        descrizione_it:
"Devi essere competente negli strumenti a fiato per usare queste cornamuse. Mentre sei sintonizzato, ratti ordinari e ratti giganti sono indifferenti verso di te e non ti attaccheranno a meno che tu non li minacci o li danneggi.\n\n" +
"Le cornamuse hanno 3 cariche. Se le suoni come azione, puoi usare un'azione bonus per spendere da 1 a 3 cariche, evocando uno sciame di ratti per ciascuna carica spesa, purché ci siano abbastanza ratti entro 800 metri da te. Gli sciami evocati si muovono verso la musica per la via più diretta ma non sono altrimenti sotto il tuo controllo. Le cornamuse recuperano 1d3 cariche all'alba.\n\n" +
"Quando uno sciame di ratti non sotto controllo di un'altra creatura viene entro 9 metri da te mentre suoni, puoi effettuare una prova di Carisma contrastata dalla prova di Saggezza dello sciame. Se perdi, lo sciame si comporta normalmente per le successive 24 ore. Se vinci, lo sciame diventa amichevole verso te e i tuoi compagni finché continui a suonare ogni round come azione.",
    },
    'planecaller-s-codex': {
        descrizione_it:
"Le pagine di questo libro sono rilegate in pelle di immondo, e la copertina ha impressa la diagramma della Grande Ruota del multiverso. Quando trovato, contiene gli incantesimi: Bandire, Trova Famiglio, Porta, Cerchio Magico, Vincolo Planare ed Evocare Elementale. Funziona da libro degli incantesimi per te.\n\n" +
"Mentre tieni il libro, puoi usarlo come focus per i tuoi incantesimi da mago.\n\n" +
"Il libro ha 3 cariche e recupera 1d3 cariche spese ogni giorno all'alba. Puoi usare le cariche nei seguenti modi:\n" +
"- Se passi 1 minuto a studiare il libro, puoi spendere 1 carica per sostituire uno dei tuoi incantesimi da mago preparati con un incantesimo diverso del libro. Il nuovo incantesimo deve essere della scuola di evocazione.\n" +
"- Quando lanci un incantesimo di evocazione che evoca o crea una creatura, puoi spendere 1 carica per concedere a quella creatura vantaggio ai tiri per colpire per 1 minuto.",
    },
    'plate-armor-of-etherealness': {
        descrizione_it:
"Mentre indossi questa armatura, puoi pronunciare la sua parola di comando come azione per ottenere l'effetto dell'incantesimo Etereità, che dura 10 minuti o finché non rimuovi l'armatura o usi un'azione per pronunciare di nuovo la parola di comando. Questa proprietà non può essere riutilizzata fino all'alba successiva.",
    },
    'plate-of-knight-s-fellowship': {
        descrizione_it:
"Questa scintillante armatura di piastre argento e oro non si appanna mai.\n\n" +
"Mentre indossi questa armatura, puoi usare un'azione bonus per evocare lo spirito di un guerriero in tuo aiuto. La forma corporea dello spirito si manifesta in uno spazio libero a tua scelta entro 9 metri da te, e usa il blocco statistiche del cavaliere. Lo spirito scompare quando scende a 0 pf o dopo 1 minuto.\n\n" +
"Lo spirito è alleato di te e dei tuoi compagni. In combattimento, condivide la tua iniziativa ma agisce subito dopo di te. Obbedisce ai tuoi comandi (nessuna azione richiesta); se non emetti comandi, esegue Schivata e usa il movimento per evitare pericolo.\n\n" +
"Una volta usata, non riutilizzabile fino all'alba successiva.",
    },
    'platinum-scarf': {
        descrizione_it:
"Questa sciarpa è fatta di tessuto resistente coperto di scaglie color platino.\n\n" +
"Con un'azione, puoi staccare una scaglia dalla sciarpa e pronunciare una parola di comando, scegliendo uno dei seguenti effetti:\n\n" +
"Soffio di Vita. La scaglia scompare, e tu o una creatura che tocchi recupera 10d4 punti ferita.\n\n" +
"Scudo di Platino. Per 1 ora o finché non lo dismetti, la scaglia diventa uno scudo +1, che tu o un'altra creatura potete usare. Una creatura che impugna lo scudo ha immunità ai danni radianti.\n\n" +
"Martello Radiante. Per 1 ora o finché non lo dismetti, la scaglia diventa un martello leggero magico. L'arma infligge 2d4 danni radianti, invece dei danni contundenti normali. Infligge ulteriori 2d4 danni radianti ai draghi cromatici.\n\n" +
"Una volta strappate tre scaglie, non possono esserne rimosse altre fino all'alba successiva, quando tutte le scaglie mancanti ricrescono. Se strappi una scaglia ma non pronunci una parola di comando, scompare dopo 1 minuto.",
    },
    'pole-of-angling': {
        descrizione_it:
"Quando tieni questa asta e pronunci la sua parola di comando, si trasforma in una canna da pesca con una lenza di seta lunga 3,5 metri e un amo magico. L'amo non si stacca dai pesci che cattura finché tu non lo desideri. La canna è particolarmente fortunata e cattura un pesce dopo soli 1d4 minuti se ci sono pesci nelle vicinanze. Una parola di comando ritrasforma l'asta nella sua forma originale.",
    },
    'pole-of-collapsing': {
        descrizione_it:
"Quest'asta lunga 3 metri pesa 1 kg. Puoi usare un'azione per pronunciare la parola di comando, facendola contrarre in un'asta di 30 cm. Pronunciare di nuovo la parola di comando la fa tornare alla lunghezza originale. Ovviamente, contrarre l'asta non danneggia o muove ciò che è attaccato all'estremità.",
    },
    'portable-hole': {
        descrizione_it:
"Questo telo nero, fine come la seta, è ripiegato fino alle dimensioni di un fazzoletto. Si dispiega in un cerchio di 1,8 metri di diametro. Puoi usare un'azione per dispiegarlo e collocarlo su o contro una superficie solida, dove crea un foro extradimensionale profondo 3 metri. Il pozzo cilindrico esiste in uno spazio extradimensionale; qualsiasi creatura o oggetto al suo interno è completamente racchiuso.\n\n" +
"Il foro portatile può essere ripiegato solo se vuoto di tutti gli oggetti e creature. Se viene rovesciato, ribaltato o ripiegato, qualsiasi creatura al suo interno viene espulsa illesa, e il foro deve essere riaperto prima di poter essere usato di nuovo. Se il foro viene piegato, una creatura nello spazio extradimensionale può usare un'azione per fare una prova di Forza CD 10. Se ha successo, una creatura forza l'apertura e fugge nello spazio occupato dall'utente.\n\n" +
"Posizionare il foro all'interno di uno spazio extradimensionale creato da una Sacca di Conservazione, una Sacca Magica o oggetti simili distrugge istantaneamente entrambi gli oggetti e apre un portale al Piano Astrale. Il portale ha origine ovunque sia stato collocato l'oggetto. Qualsiasi creatura entro 3 metri viene risucchiata e depositata in una posizione casuale sul Piano Astrale. Il portale poi si chiude. Il portale è unidirezionale e non può essere riaperto.",
    },
    'pot-of-awakening': {
        descrizione_it:
"Se pianti una pianta ordinaria in questo vaso d'argilla e lo annaffi, la pianta diventa risvegliata 30 giorni dopo, come per l'incantesimo Risveglio. Quando la pianta si risveglia, le sue radici rompono il vaso, distruggendolo. La pianta risvegliata è amichevole verso di te.",
    },
    'prehistoric-figurines-of-wondrous-power': {
        descrizione_it:
"Una statuetta preistorica di potere meraviglioso è una statuetta scolpita di un animale preistorico abbastanza piccola da stare in una tasca. Se usi un'azione per pronunciarne la parola di comando e gettarla entro 18 metri da te, la statuetta diventa una creatura vivente. Se lo spazio dove apparirebbe è occupato, non si trasforma. La creatura è amichevole con te e i tuoi compagni. Capisce le tue lingue e obbedisce ai tuoi comandi vocali. Se non emetti comandi, si difende ma non agisce. Esistono varie versioni con diverse statistiche (vedi tabella nel manuale).",
    },
    'prosthetic-limb': {
        descrizione_it:
"Questo oggetto sostituisce un arto perduto, una mano, un piede, un occhio o qualsiasi altra parte del corpo. La protesi funziona in modo identico alla parte sostituita, comportandosi in tutto e per tutto come parte del corpo naturale e durando per la vita. Se sganciata, la protesi torna inerte.",
    },
    'protective-verses': {
        descrizione_it:
"Mentre indossi o tieni questo pezzo di pergamena con il versetto trascritto, non puoi essere affascinato o spaventato dai non morti.\n\n" +
"Inoltre, puoi usare un'azione per leggere ad alta voce il versetto, terminando la condizione affascinato o spaventato su una creatura che puoi vedere entro 9 metri da te. Una volta usata questa azione, non può essere riutilizzata fino all'alba successiva.",
    },
    'psi-crystal': {
        descrizione_it:
"Mentre tieni questo cristallo, ottieni un bonus di +1 alle prove di Intelligenza. Inoltre, puoi telepaticamente comunicare con qualsiasi creatura entro 9 metri da te, purché parli almeno una lingua o sia altrimenti capace di comunicare.",
    },

    // ── Batch Q ────────────────────────────────────────────────────────
    'quaal-s-feather-token': {
        descrizione_it:
"Questa minuscola piuma magica ha proprietà specifiche basate sul tipo. Esistono diversi tipi: Ancora (impedisce a una nave di muoversi per 24 ore), Albero d'Oro (cresce in un albero di 18 m, dura), Uccello (diventa un roc che ti porta in volo, una volta), Ventaglio (crea un vento favorevole per 8 ore), Cigno (diventa una barca per 24 ore), Frusta (diventa frusta magica per 1 ora). Il DM determina o sceglie il tipo. Una volta usato, il segno scompare.",
    },
    'quiver-of-ehlonna': {
        descrizione_it:
"Ognuno dei tre scomparti di questa faretra si collega a uno spazio extradimensionale che permette di contenere oggetti senza essere ingombri dal loro peso. Il scomparto più corto può contenere fino a sessanta frecce, dardi di balestra o oggetti simili. Il scomparto medio può contenere fino a diciotto giavellotti o oggetti simili. Il scomparto più lungo può contenere fino a sei oggetti lunghi, come archi, mazze o bastoni. Puoi estrarre qualsiasi oggetto dalla faretra come se da una faretra o un fodero ordinari.",
    },

    // ── Batch R ────────────────────────────────────────────────────────
    'reaper-s-scream': {
        descrizione_it:
"Quest'arma magica è una falce di metallo nero con la lama che sussurra. Ottieni un bonus di +3 ai tiri per colpire e ai tiri di danno effettuati con essa. Inoltre, l'arma infligge ulteriori 2d6 danni necrotici quando colpisce.\n\n" +
"Una volta per turno quando colpisci una creatura, puoi forzarla a effettuare un tiro salvezza su Costituzione CD 17. Se fallisce, la creatura viene ridotta a 0 punti ferita se aveva 50 pf o meno. Altrimenti subisce ulteriori 4d8 danni necrotici.\n\n" +
"Mentre tieni l'arma, puoi usare un'azione bonus per emettere un urlo terrificante. Ogni creatura a tua scelta entro 9 metri che possa udirti deve riuscire in un tiro salvezza su Saggezza CD 17 o essere spaventata da te per 1 minuto. Una volta usata, non riutilizzabile fino all'alba successiva.",
    },
    'reveler-s-concertina': {
        descrizione_it:
"Mentre tieni questa fisarmonica, puoi usare un'azione per lanciare l'incantesimo Risata Irresistibile di Tasha (CD 15) da essa. Una volta lanciato, non può essere lanciato di nuovo fino al giorno successivo all'alba.\n\n" +
"Inoltre, puoi suonare la concertina per 10 minuti come parte di un riposo breve per ispirare allegria. Tu e fino a otto creature consenzienti che ti ascoltano ottenete il beneficio dell'incantesimo Eroismo (caratteristica di lancio Carisma) per la durata del riposo, dopodiché la creatura non subisce alcun livello di esaustione che avrebbe altrimenti subito.",
    },
    'rhythm-maker-s-drum': {
        descrizione_it:
"Mentre tieni questo tamburo, puoi usarlo come focus per incantesimi da bardo. Inoltre, ottieni un bonus di +1 ai tiri per colpire con incantesimi e alle CD dei tiri salvezza dei tuoi incantesimi da bardo mentre tieni il tamburo.\n\n" +
"Il tamburo ha 4 cariche. Mentre lo tieni, puoi usare un'azione per spendere 1 o più cariche per lanciare uno dei seguenti incantesimi (CD 13): Charme su Persone (1 carica), Comando (1), Compulsione (4), Suggestione Massima (3) o Suggestione (2).\n\n" +
"Il tamburo recupera 1d4 cariche spese ogni giorno all'alba. Se spendi l'ultima carica, tira un d20. Con un 1, il tamburo diventa un tamburo ordinario.",
    },
    'robe-of-eyes': {
        descrizione_it:
"Questa veste è ricoperta di disegni simili a occhi. Mentre la indossi, ottieni i seguenti benefici:\n\n" +
"- La veste ti permette di vedere in tutte le direzioni, e hai vantaggio alle prove di Saggezza (Percezione) basate sulla vista.\n" +
"- Hai scurovisione fino a 36 metri.\n" +
"- Puoi vedere creature e oggetti invisibili, oltre a vedere nel Piano Etereo, fino a 36 metri.\n\n" +
"Gli occhi sulla veste non possono essere chiusi o distolti. Sebbene tu possa chiudere o coprire i tuoi occhi naturali, non sei mai considerato sorpreso se la veste è intatta.\n\n" +
"L'incantesimo Luce lanciato sulla veste o un effetto Luce del Giorno targato sulla veste accecano sia te che gli occhi della veste per 1 minuto.",
    },
    'robe-of-scintillating-colors': {
        descrizione_it:
"Questa veste ha 3 cariche e recupera 1d3 cariche all'alba. Mentre la indossi, puoi usare un'azione e spendere 1 carica per far sì che la veste mostri un display vorticante di colori scintillanti fino alla fine del tuo prossimo turno. Durante questo tempo, la veste emette luce intensa entro 9 metri e luce fioca per ulteriori 9 metri. Le creature che vedono e sono entro 9 metri da te devono riuscire in un tiro salvezza su Saggezza CD 15 o essere accecate fino alla fine dell'effetto.",
    },
    'robe-of-stars': {
        descrizione_it:
"Questa veste nera o blu scuro è ricamata con piccole stelle bianche o argentee. Ottieni un bonus di +1 ai tiri salvezza mentre la indossi.\n\n" +
"Sei punti potenza. La veste ha sei stelle, sul davanti. Mentre indossi la veste, puoi usare un'azione per estrarre una stella e usarla come una freccia magica +1 (incantesimo Dardo Incantato 5° livello da uno slot, ma uso individuale). Quando una stella viene rimossa, scompare; ricompare nuovamente all'alba successiva.\n\n" +
"Mentre indossi la veste, puoi usare un'azione per entrare nel Piano Astrale, assieme all'equipaggiamento. Rimani nel piano finché non usi un'azione per tornare al piano in cui ti trovavi. Riappari nello spazio che hai lasciato o, se quel spazio è occupato, nello spazio libero più vicino.",
    },
    'robe-of-the-archmagi': {
        descrizione_it:
"Questa elegante veste è fatta di lino bianco, grigio o nero ricamata con simboli arcani. Il colore della veste corrisponde all'allineamento per cui è stata creata. Una veste bianca è fatta per maghi buoni, una grigia per maghi neutri e una nera per maghi malvagi.\n\n" +
"Devi essere un mago, stregone o warlock per sintonizzarti con questa veste. Se cerchi di sintonizzarti con essa e il tuo allineamento non corrisponde a quello della veste, subisci 6d10 danni psichici e non puoi sintonizzarti.\n\n" +
"Mentre indossi la veste, ottieni i seguenti benefici:\n" +
"- Se non indossi armatura, la tua classe armatura di base è 15 + il tuo modificatore di Destrezza.\n" +
"- Hai vantaggio ai tiri salvezza contro incantesimi e altri effetti magici.\n" +
"- La CD del tiro salvezza dei tuoi incantesimi aumenta di 2.",
    },
    'robe-of-useful-items': {
        descrizione_it:
"Questa veste ha vari pezzi di stoffa di forme diverse cuciti su di essa. Mentre la indossi, puoi usare un'azione per staccare una toppa, facendola diventare l'oggetto o la creatura che rappresenta. Una volta che l'ultima toppa viene rimossa, la veste diventa un oggetto ordinario.\n\n" +
"La veste ha le seguenti due toppe ciascuno, più altre 4d4 toppe casuali (vedi tabella nel manuale): pugnale, lanterna a cappuccio (piena di olio e accesa), specchio in acciaio di 30 cm, asta di legno lunga 3 metri, scala di corda di canapa di 7,5 metri, sacco. Le toppe casuali possono includere: borsa di 100 mo, scatola di legno con stoppino di candela, ariete di ferro, finestra di vetro 3x9 m, scala 3 m, mulo (con sacche), prato di 3 m², pozzetto aperto di 3 metri, mastino, porta in legno (con apertura per spaccare), barca a remi 3 m, incantesimi (Pergamena a scelta del DM), spada lunga 2H, finestra di Etereità (per 10 secondi).",
    },
    'rogue-s-mantle': {
        descrizione_it:
"Questo mantello scuro ti consente di muoverti come un'ombra. Mentre lo indossi, ottieni i seguenti benefici:\n\n" +
"- Hai vantaggio alle prove di Destrezza (Furtività).\n" +
"- Hai un bonus di +1 alla CA.\n" +
"- Quando una creatura non vista da te effettua un tiro per colpire contro di te, puoi usare la reazione per imporre svantaggio al tiro. Devi usare questa caratteristica prima di sapere se l'attacco colpisce.",
    },
    'rope-of-climbing': {
        descrizione_it:
"Questa corda di seta lunga 18 metri pesa 1,5 kg e può sostenere fino a 1.500 kg. Se tieni un'estremità della corda e usi un'azione per pronunciare la parola di comando, la corda si anima. Come azione bonus, puoi comandarle di muoversi o fissarsi a un oggetto entro 18 metri da te. Quando arriva all'oggetto, vi si fissa finché non emetti un altro comando.\n\n" +
"La corda può anche slegare nodi. Pronunciare la parola di comando fa sciogliere o scivolare la corda da un nodo, anche se è stato legato saldamente. La corda ha CA 20 e 20 pf. Recupera 1 pf ogni 5 minuti se ha almeno 1 pf. Se la corda scende a 0 pf, viene distrutta.",
    },
    'rope-of-entanglement': {
        descrizione_it:
"Questa corda misura 9 metri di lunghezza. Mentre tieni un'estremità della corda, puoi usare un'azione per pronunciare la parola di comando e far sì che l'altra estremità si lanci verso una creatura entro 6 metri da te. La creatura bersaglio deve riuscire in un tiro salvezza su Destrezza CD 15 o essere trattenuta dalla corda.\n\n" +
"Puoi rilasciare la creatura usando un'azione bonus per pronunciare una seconda parola di comando. Una creatura trattenuta dalla corda può usare un'azione per fare una prova di Forza CD 15. Se ha successo, non è più trattenuta.\n\n" +
"La corda ha CA 20 e 20 pf. Recupera 1 pf ogni 5 minuti se ha almeno 1 pf. Se la corda scende a 0 pf, viene distrutta.",
    },
    'rope-of-mending': {
        descrizione_it:
"Puoi tagliare questa corda di canapa lunga 15 metri in qualsiasi numero di pezzi più piccoli, e poi usare un'azione per pronunciare la parola di comando e far sì che i pezzi si riuniscano magicamente. I pezzi devono essere a portata di mano quando pronunci la parola di comando. Una corda formata in questo modo è indistinguibile da una normale corda di canapa.",
    },
    'ruby-of-the-war-mage': {
        descrizione_it:
"Inciso con motivi marziali, questo rubino di 2,5 cm di diametro ti permette di usare un'arma semplice o da guerra come focus per incantesimi.\n\n" +
"Per la durata della sintonia, puoi attaccare il rubino a un'arma premendolo contro l'arma per almeno 10 minuti. In seguito, finché il rubino rimane attaccato e tu sei sintonizzato con esso, puoi usare quell'arma come focus per i tuoi incantesimi.\n\n" +
"Il rubino cade dall'arma se la tua sintonia con il rubino termina.",
    },
    'ruby-weave-gem': {
        descrizione_it:
"Forgiata da maghi rubino, questa gemma sfaccettata ti dà accesso al filo grezzo della Trama. Mentre la tieni, puoi usarla come focus per i tuoi incantesimi.\n\n" +
"Magia Aumentata. Quando lanci un incantesimo mentre tieni la gemma, puoi lanciarla utilizzando uno slot 1 livello superiore al normale. Una volta usata in questo modo, la gemma non può essere riutilizzata in questo modo fino all'alba successiva.\n\n" +
"Magia Frazionata. Immediatamente dopo aver usato Magia Aumentata, devi riuscire in un tiro salvezza su Costituzione CD 12 o subire 1d12 danni di forza per ogni livello dell'incantesimo lanciato e una caratteristica casuale viene ridotta di 1d4 (recupero con riposo lungo).",
    },
    'ruinous-flail': {
        descrizione_it:
"Quest'arma magica è un mazzafrusto la cui testa è marchiata con la runa della rovina. Ottieni un bonus di +1 ai tiri per colpire e ai tiri di danno effettuati con essa, e ogni colpo infligge ulteriori 1d4 danni necrotici.\n\n" +
"Quando colpisci un costrutto o un oggetto con quest'arma, infligge ulteriori 2d4 danni necrotici (oltre a 1d4 normale).\n\n" +
"Invocare la Runa. Quando colpisci una creatura con quest'arma, puoi usare la reazione per invocare la runa dell'arma. Il bersaglio deve riuscire in un tiro salvezza su Costituzione CD 14 o subire ulteriori 4d8 danni necrotici e essere indebolito (svantaggio ai tiri per colpire e prove di Forza) per 1 minuto. Può ripetere il TS alla fine di ciascun suo turno. Una volta invocata, non riutilizzabile fino all'alba successiva.",
    },

    // ── Batch S ────────────────────────────────────────────────────────
    'saddle-of-the-cavalier': {
        descrizione_it:
"Mentre sei in questa sella su una cavalcatura, non puoi essere disarcionato contro la tua volontà ed hai vantaggio ai tiri salvezza per evitare di cadere dalla cavalcatura.",
    },
    'sage-s-signet': {
        descrizione_it:
"Quest'anello d'argento ha una pietra arcobaleno incastonata. Mentre lo indossi, ottieni i seguenti benefici:\n\n" +
"- Ottieni un bonus di +5 alle prove di Intelligenza.\n" +
"- Una volta al giorno, puoi lanciare l'incantesimo Comunione con la Natura, Localizzare Creatura, Localizzare Oggetto o Visione del Vero senza componenti.\n\n" +
"L'anello ha 5 cariche. Mentre lo indossi, puoi spendere 1 carica come azione per lanciare l'incantesimo Identificare. Recupera 1d4+1 cariche all'alba.",
    },
    'sanctum-amulet': {
        descrizione_it:
"Mentre indossi questo amuleto, puoi usare un'azione per lanciare l'incantesimo Sanctum Privato (CD 17) senza componenti. Una volta usato, non riutilizzabile fino all'alba successiva.\n\n" +
"Inoltre, hai resistenza ai danni psichici e vantaggio ai tiri salvezza contro incantesimi che ti vincolerebbero (come Pacificare Persona).",
    },
    'sapphire-buckler': {
        descrizione_it:
"Mentre tieni questo brocchiero d'argento, ottieni un bonus di +2 alla CA. Questo bonus si aggiunge ai bonus normali dello scudo.\n\n" +
"Inoltre, mentre tieni il brocchiero, ottieni resistenza ai danni da fulmine e tuono. Quando subisci tali danni, puoi usare la reazione per ridurre i danni a 0; il brocchiero ti danneggia per 1d4 punti ferita e la sua protezione termina fino all'alba successiva.",
    },
    'scarab-of-protection': {
        descrizione_it:
"Se tieni questo medaglione in mano per 1 round, una scaglia o un'iscrizione appare su una superficie. Successivamente, devi indossare il medaglione per ottenerne i benefici. Mentre lo indossi, ottieni i seguenti benefici:\n\n" +
"- Hai vantaggio ai tiri salvezza contro incantesimi.\n" +
"- Lo scarabeo ha 12 cariche. Se fallisci un tiro salvezza contro un incantesimo di necromanzia o un effetto dannoso originato da un non morto, puoi usare la reazione per spendere 1 carica e tirare di nuovo, prendendo il nuovo risultato. Se l'ultima carica viene spesa, lo scarabeo cade in polvere e viene distrutto.",
    },
    'scimitar-of-speed': {
        descrizione_it:
"Ottieni un bonus di +2 ai tiri per colpire e ai tiri di danno effettuati con quest'arma magica. Inoltre, puoi effettuare un attacco con essa come azione bonus in ciascuno dei tuoi turni.",
    },
    'sending-stones': {
        descrizione_it:
"Le pietre di messaggio si trovano in coppia, ognuna scolpita o adornata in modo da somigliare all'altra. Mentre tieni una di queste pietre, puoi usare un'azione per lanciare l'incantesimo Inviare. Il bersaglio è il portatore dell'altra pietra. Se nessuna creatura tiene l'altra pietra, sai che prima di lanciare l'incantesimo e non lo lanci.\n\n" +
"Una volta che l'incantesimo Inviare viene lanciato attraverso le pietre, esse non possono essere usate di nuovo fino all'alba successiva. Se una delle pietre della coppia viene distrutta, l'altra diventa non magica.",
    },
    'sentinel-shield': {
        descrizione_it:
"Mentre tieni questo scudo, hai vantaggio alle prove di iniziativa e alle prove di Saggezza (Percezione). Lo scudo è arrigegnato con un occhio, simile a quello di una bestia, sulla parte anteriore.",
    },
    'shadowfell-brand-tattoo': {
        descrizione_it:
"Prodotto da un ago speciale, questo tatuaggio magico raffigura simboli oscuri e legati allo Shadowfell.\n\n" +
"Sintonia del Tatuaggio. Per sintonizzarti, premi l'ago contro la pelle. L'ago diventa l'inchiostro del tatuaggio. Se la sintonia termina, il tatuaggio scompare e l'ago riappare.\n\n" +
"Resistenza Necrotica. Hai resistenza ai danni necrotici.\n\n" +
"Aspetto Inquietante. Hai vantaggio alle prove di Carisma (Intimidire).\n\n" +
"Furtività delle Ombre. Mentre sei in luce fioca o oscurità, puoi usare un'azione bonus per teletrasportarti fino a 9 metri in uno spazio libero che vedi che è anche in luce fioca o oscurità. Una volta usata, non riutilizzabile fino all'alba successiva.",
    },
    'shadowfell-shard': {
        descrizione_it:
"Questo cristallo scuro contiene l'essenza dello Shadowfell. Con un'azione, puoi attaccare la scheggia a un oggetto Minuscolo o staccarla. Cade se la sintonia termina. Puoi usarla come focus per incantesimi.\n\n" +
"Quando lanci un incantesimo che infligge danni necrotici mentre tieni o indossi la scheggia, puoi infliggere ulteriori 1d6 danni necrotici a uno dei bersagli dell'incantesimo. Inoltre, mentre la tieni o indossi, hai resistenza ai danni necrotici.",
    },
    'shield-1-2-or-3': {
        descrizione_it:
"Mentre impugni questo scudo, ottieni un bonus alla CA pari al bonus dello scudo. Questo bonus si aggiunge al bonus normale dello scudo alla CA.",
    },
    'shield-of-expression': {
        descrizione_it:
"La parte anteriore di questo scudo è scolpita nella forma di un volto. Mentre impugni lo scudo, puoi usare un'azione bonus per cambiare l'espressione del volto.",
    },
    'shield-of-missile-attraction': {
        descrizione_it:
"Mentre tieni questo scudo, hai resistenza ai danni dagli attacchi con armi a distanza.\n\n" +
"Maledizione. Questo scudo è maledetto. Sintonizzarsi con esso ti maledice fino a quando rimuovi la maledizione con Rimuovi Maledizione o magia simile. Rimuovere lo scudo non rimuove la maledizione. Ogni volta che un attacco con arma a distanza viene effettuato contro un bersaglio entro 3 metri da te, la maledizione fa diventare te il bersaglio invece.",
    },
    'shield-of-the-blazing-dreadnought': {
        descrizione_it:
"Quest'enorme scudo torre è imbronciato con la runa della furia.\n\n" +
"Mentre impugni questo scudo, ottieni un bonus alla CA pari al bonus dello scudo +2.\n\n" +
"Inoltre, hai resistenza ai danni da fuoco mentre impugni lo scudo.\n\n" +
"Invocare la Runa. Come azione, puoi invocare la runa dello scudo. Per 1 minuto, le creature ostili entro 9 metri da te subiscono 1d6 danni da fuoco all'inizio dei loro turni. Una volta invocata, non riutilizzabile fino all'alba successiva.",
    },
    'shield-of-the-tortoise': {
        descrizione_it:
"Mentre tieni questo scudo, puoi usare un'azione bonus per pronunciare la parola di comando e far sì che lo scudo cresca, fornendoti copertura totale fino all'inizio del tuo prossimo turno. Mentre lo scudo è ingrandito, la tua velocità è 0. Puoi pronunciare di nuovo la parola di comando come azione bonus per restituire lo scudo alle dimensioni normali. Una volta usata, non riutilizzabile fino all'alba successiva.",
    },
    'shrieking-greaves': {
        descrizione_it:
"Questi schinieri di metallo emettono uno stridio quando li indossi e ti muovi.\n\n" +
"Mentre indossi questi schinieri, qualsiasi creatura entro 18 metri da te che possa udire ti percepisce automaticamente, e tu hai svantaggio alle prove di Destrezza (Furtività).\n\n" +
"Tuttavia, hai resistenza ai danni da tuono e immunità alla condizione di assordato.",
    },
    'skull-helm': {
        descrizione_it:
"Mentre indossi questo elmo a forma di teschio, ottieni resistenza ai danni necrotici. Inoltre, ottieni i seguenti benefici:\n\n" +
"Aspetto Terrificante. Hai vantaggio alle prove di Carisma (Intimidire).\n\n" +
"Sguardo Mortale. Come azione, puoi puntare lo sguardo su una creatura entro 9 metri che possa vederti. Il bersaglio deve riuscire in un tiro salvezza su Saggezza CD 15 o essere spaventato da te per 1 minuto. Può ripetere il TS alla fine di ciascun suo turno. Una volta usata, non riutilizzabile fino all'alba successiva.",
    },
    'sling-of-giant-felling': {
        descrizione_it:
"Quest'arma magica ti permette di colpire i giganti con potenza inaspettata. Quando colpisci una creatura con il sottotipo gigante con un attacco effettuato con questa fionda, infligge ulteriori 2d6 danni e la creatura deve riuscire in un tiro salvezza su Forza CD 15 o cadere prona.",
    },
    'slippers-of-spider-climbing': {
        descrizione_it:
"Mentre indossi queste pantofole leggere, puoi muoverti su e giù per superfici verticali e a testa in giù lungo i soffitti, lasciando libere le tue mani. Hai una velocità di scalata pari alla tua velocità di camminata. Tuttavia, le pantofole non funzionano su superfici scivolose, come quelle coperte di ghiaccio o olio.",
    },
    'smoldering-armor': {
        descrizione_it:
"Sottili volute di fumo si elevano da quest'armatura. Il fumo non ti odora ed è inoffensivo. L'armatura ti permette di esalare fumo senza danni anche se è bagnata.",
    },
    'sovereign-glue': {
        descrizione_it:
"Questa sostanza viscosa, lattiginosa e biancastra può tenere insieme due oggetti permanentemente. Deve essere conservata in un vasetto o fiala che è stato rivestito all'interno con olio di scivolosità. Quando trovato, un contenitore contiene 1d6+1 once di colla.\n\n" +
"Un'oncia di colla può coprire un'area di 0,1 m². La colla impiega 1 minuto per fare presa. Una volta che la colla sovrana ha fatto presa, gli oggetti che lega possono essere separati solo applicando solvente universale o olio di etereità, o con un incantesimo Desiderio.",
    },
    'spell-scroll': {
        descrizione_it:
"Una pergamena di incantesimo contiene le parole di un singolo incantesimo, scritte in una scrittura misteriosa, esoterica. Se l'incantesimo è nella tua lista di incantesimi della classe, puoi leggere la pergamena e lanciare il suo incantesimo senza dover fornire componenti materiali. Altrimenti, la pergamena è incomprensibile. Lanciare l'incantesimo dalla pergamena richiede il tempo di lancio normale dell'incantesimo. Una volta lanciato, le parole sulla pergamena svaniscono e la pergamena si autodistrugge. Se il lancio viene interrotto, la pergamena non viene persa.\n\n" +
"Se l'incantesimo è di un livello superiore al livello massimo di incantesimo che puoi lanciare normalmente, devi fare una prova della tua caratteristica di lancio per determinare se lo lanci con successo. La CD è 10 + livello dell'incantesimo. In caso di fallimento, l'incantesimo svanisce dalla pergamena senza altro effetto.",
    },
    'spellguard-shield': {
        descrizione_it:
"Mentre tieni questo scudo, hai vantaggio ai tiri salvezza contro incantesimi e altri effetti magici, e i tiri per colpire con incantesimo hanno svantaggio contro di te.",
    },
    'spellwrought-tattoo': {
        descrizione_it:
"Prodotto da un ago speciale, questo tatuaggio magico ti garantisce l'uso di un singolo incantesimo. Il livello dell'incantesimo determina la rarità del tatuaggio (cantrip = comune, 1° = comune, 2° = non comune, 3° = non comune, 4° = raro, 5° = raro, 6° = molto raro, 7° = molto raro, 8° = molto raro, 9° = leggendario).\n\n" +
"Per applicare il tatuaggio, premi l'ago contro la pelle. L'ago diventa l'inchiostro del tatuaggio.\n\n" +
"Mentre il tatuaggio è sulla pelle, puoi lanciare l'incantesimo del tatuaggio. Una volta lanciato, il tatuaggio svanisce.",
    },
    'sphere-of-annihilation': {
        descrizione_it:
"Questa sfera nera di 60 cm di diametro è un foro nel multiverso, che fluttua nello spazio, stabilizzato dal campo magico che la circonda.\n\n" +
"La sfera annienta tutta la materia con cui entra in contatto. Spazi extradimensionali (come quelli creati da una Sacca Magica o un Buco Portatile) sopravvivono al contatto con essa, ma il loro contenuto viene annichilito.\n\n" +
"Ogni volta che entri in contatto con la sfera o ti muovi a meno di 30 cm da essa, devi riuscire in un tiro salvezza su Destrezza CD 13 o subire 4d10 danni di forza. Gli oggetti che non vengono indossati o trasportati che entrano in contatto con la sfera vengono annichiliti.\n\n" +
"La sfera è ferma finché qualcuno non la controlla. Se sei entro 18 metri dalla sfera incontrollata, puoi usare un'azione per fare una prova di Intelligenza (Arcano) CD 25. Se hai successo, la sfera si muove fino a 1,5 metri per ogni punto del tuo modificatore di Intelligenza (minimo 0). Se fallisci, la sfera si muove di 3 metri verso di te.\n\n" +
"Se la sfera entra in contatto con un portale planare (come quello creato dall'incantesimo Porta) o uno spazio extradimensionale (come quello dentro un Buco Portatile), il DM determina casualmente cosa succede.",
    },
    'spindle-of-fate': {
        descrizione_it:
"Mentre tieni questo fuso magico, puoi usare un'azione per lanciare l'incantesimo Predire (CD 18), o un'azione bonus per imporre vantaggio o svantaggio a una creatura entro 18 metri sul prossimo tiro per colpire o tiro salvezza che effettua entro il tuo prossimo turno.\n\n" +
"Il fuso ha 7 cariche. Le proprietà magiche spendono 1 carica ciascuna. Recupera 1d4+3 cariche all'alba.",
    },
    'starshot-crossbow': {
        descrizione_it:
"Quest'arma magica è una balestra leggera. Quando colpisci con un attacco usando questa balestra, l'attacco infligge ulteriori 1d6 danni radianti.\n\n" +
"Inoltre, mentre tieni la balestra, puoi usare un'azione per evocare un dardo da balestra fatto di luce stellare. Il dardo dura finché non viene sparato dalla balestra o finché non passa 1 minuto.",
    },
    'stone-of-controlling-earth-elementals': {
        descrizione_it:
"Se la pietra è in contatto con la terra, puoi usare un'azione per pronunciarne la parola di comando ed evocare un Elementale della Terra, come se avessi lanciato l'incantesimo Evocazione di Elementali. La pietra non può essere riutilizzata fino all'alba successiva. La pietra pesa 2,5 kg.",
    },
    'stone-of-golorr': {
        descrizione_it:
"La Pietra di Golorr è il vessel di un'aberrazione che si nutre dei sussurri delle ricchezze. Ti concede potere divinatorio sui tesori celati, ma desidera essere usato. Mentre la tieni, puoi usare un'azione per lanciare uno qualsiasi dei seguenti incantesimi (CD 17), senza componenti: Localizzare Oggetto, Identificare, o Predire. Una volta usato un incantesimo, non riutilizzabile fino all'alba successiva.\n\n" +
"Inoltre, l'entità intrappolata nella pietra può comunicare telepaticamente con te e potrebbe rivelare segreti su tesori sepolti. Tuttavia, è ingannevole e cerca la propria libertà.",
    },
    'stone-of-good-luck-luckstone': {
        descrizione_it:
"Mentre questa pietra agata levigata è sulla tua persona, ottieni un bonus di +1 alle prove di caratteristica e ai tiri salvezza.",
    },
    'stonebreaker-s-breastplate': {
        descrizione_it:
"Questa armatura di piastre forgiata da nani è incisa con martelli e picconi. Mentre la indossi, ottieni i seguenti benefici:\n\n" +
"- Hai resistenza ai danni contundenti.\n" +
"- Le tue armi corpo a corpo infliggono ulteriori 1d6 danni contundenti agli oggetti e ai costrutti.\n" +
"- Una volta al giorno, puoi lanciare l'incantesimo Plasmare la Pietra senza componenti.",
    },
    'stonemaker-war-pick': {
        descrizione_it:
"Quest'arma magica è un piccone da guerra. Ottieni un bonus di +2 ai tiri per colpire e ai tiri di danno effettuati con essa.\n\n" +
"Inoltre, mentre tieni il piccone, puoi usare un'azione per lanciare gli incantesimi Plasmare la Pietra o Muro di Pietra (CD 16) senza componenti. Ciascuno può essere lanciato una volta al giorno e si ricarica all'alba.",
    },
    'sun-blade': {
        descrizione_it:
"Questo oggetto sembra inizialmente un'impugnatura di spada lunga. Mentre tieni l'impugnatura, puoi usare un'azione bonus per far apparire o scomparire una lama di pura luminosità solare. Mentre la lama esiste, questa spada lunga magica ha la proprietà di taglio. Se sei competente con la spada corta o la spada lunga, sei competente con la Lama Solare.\n\n" +
"Ottieni un bonus di +2 ai tiri per colpire e ai tiri di danno effettuati con questa spada, che infligge danni radianti invece di danni taglienti. Quando colpisci un non morto con essa, quel bersaglio subisce ulteriori 1d8 danni radianti.\n\n" +
"La lama luminosa emette luce intensa entro 4,5 metri e luce fioca per ulteriori 4,5 metri. La luce è la luce solare. Mentre la lama persiste, puoi usare un'azione per espandere o restringere il raggio di luce intensa e fioca di 1,5 metri ciascuno (massimo 9 metri di luce intensa e ulteriori 9 metri di luce fioca, minimo 3 metri di ciascuna).",
    },
    'sun-staff': {
        descrizione_it:
"Quest'arma magica è un bastone. Ottieni un bonus di +1 ai tiri per colpire e ai tiri di danno effettuati con esso. Inoltre, infligge ulteriori 1d8 danni radianti.\n\n" +
"Mentre tieni il bastone, puoi usare un'azione per fargli emettere luce intensa entro 18 metri e luce fioca per ulteriori 18 metri. La luce è luce solare. Puoi usare un'azione bonus per terminarla.\n\n" +
"Inoltre, mentre tieni il bastone, puoi usare un'azione per lanciare l'incantesimo Luce del Giorno o Raggio di Sole (CD 15). Una volta usato un incantesimo, non riutilizzabile fino all'alba successiva.",
    },
    'sword-of-answering': {
        descrizione_it:
"Esistono nove di queste lame magiche. Ognuna ha un nome proprio in elfico antico, ad esempio \"Risposta\", \"Concordia\", \"Discordia\", ecc. Ciascuna è un'arma simile a una spada lunga, e solo una persona del medesimo allineamento può sintonizzarsi con una particolare spada.\n\n" +
"Ottieni un bonus di +3 ai tiri per colpire e ai tiri di danno effettuati con questa spada magica. Inoltre, mentre la tieni, puoi usare la reazione per effettuare un attacco corpo a corpo con essa contro qualsiasi creatura entro la portata che ti danneggi con un attacco corpo a corpo.",
    },
    'sword-of-kas': {
        descrizione_it:
"La spada di Kas è una spada lunga magica. Originariamente forgiata per Kas il Sanguinario, il prediletto luogotenente del lich Vecna, la spada cospira contro il suo possessore. Ottieni un bonus di +3 ai tiri per colpire e ai tiri di danno effettuati con quest'arma.\n\n" +
"La spada infligge ulteriori 2d10 danni necrotici a qualsiasi creatura colpita. Inoltre, ogni colpo critico ti consente di rigenerare punti ferita pari ai danni inflitti.\n\n" +
"Proprietà Casuali. Ha 4 proprietà benefiche minori, 2 maggiori, 2 dannose minori, 1 dannosa maggiore.\n\n" +
"Senzienza. La Spada di Kas è un'arma senziente caotica malvagia con Intelligenza 15, Saggezza 13 e Carisma 16. Ha udito e scurovisione fino a 36 metri. Comunica telepaticamente con il portatore. Cerca distruzione e di vendicarsi su Vecna.",
    },
    'sword-of-life-stealing': {
        descrizione_it:
"Quando attacchi una creatura con questa spada magica e ottieni 20 al tiro per colpire, quel bersaglio subisce ulteriori 10 danni necrotici se non è un costrutto o un non morto. Tu stesso poi recuperi 10 punti ferita.",
    },
    'sword-of-sharpness': {
        descrizione_it:
"Quando attacchi un oggetto con questa spada magica e colpisci, infliggi il massimo dei danni. Quando attacchi una creatura con quest'arma e ottieni 20 al tiro per colpire, quel bersaglio subisce ulteriori 14 danni taglienti. Inoltre, tira un altro d20. Se ottieni 20, mozzi uno dei tentacoli, una zampa, un braccio o un'altra appendice del bersaglio (a discrezione del DM). Se la creatura non ha appendici da mozzare, mozzi una porzione del corpo.\n\n" +
"Inoltre, puoi pronunciare la parola di comando per far sì che la lama emani luce intensa entro 3 metri e luce fioca per ulteriori 3 metri. Pronunciare di nuovo la parola di comando o riporre la spada termina la luce.",
    },
    'sword-of-the-planes': {
        descrizione_it:
"Ottieni un bonus di +1 ai tiri per colpire e ai tiri di danno effettuati con questa spada lunga magica quando sei sul Piano Materiale. Su un altro piano d'esistenza, ottieni invece un bonus di +3.",
    },
    'sword-of-vengeance': {
        descrizione_it:
"Ottieni un bonus di +1 ai tiri per colpire e ai tiri di danno effettuati con questa spada lunga magica.\n\n" +
"Maledizione. Questa spada è maledetta e posseduta da uno spirito vendicativo. Diventare sintonizzato con essa estende la maledizione su di te. Finché rimani maledetto, sei riluttante a separartene, mantenendola entro portata in ogni momento. Hai anche svantaggio ai tiri per colpire effettuati con armi diverse da quest'una.\n\n" +
"Mentre la spada è sulla tua persona, devi fare una prova di Saggezza CD 15 ogni volta che subisci danni in combattimento. Se fallisci, devi attaccare la creatura che ti ha inflitto i danni finché non muori o non muore. La maledizione si solleva con Rimuovi Maledizione.",
    },
    'sword-of-wounding': {
        descrizione_it:
"I punti ferita persi a causa di un attacco di questa spada magica possono essere recuperati solo attraverso un riposo breve o lungo, piuttosto che attraverso poteri magici.\n\n" +
"Una volta per turno, quando colpisci una creatura con essa, puoi ferirla. Alla fine di ogni turno della creatura ferita, subisce 1d4 danni necrotici per ogni volta che è stata ferita dalla spada, e può quindi fare un tiro salvezza su Costituzione CD 15, terminando l'effetto di tutte le ferite causate da quest'arma se ha successo.",
    },
    'sword-of-zariel': {
        descrizione_it:
"La Spada di Zariel è una spada lunga magica forgiata per la fallen angel Zariel, signore di Avernus. Ottieni un bonus di +3 ai tiri per colpire e ai tiri di danno effettuati con essa, e infligge ulteriori 3d6 danni radianti a qualsiasi creatura colpita.\n\n" +
"Quando attacchi una creatura malvagia con questa spada e ottieni un colpo critico, quel bersaglio deve riuscire in un tiro salvezza su Costituzione CD 18 o subire ulteriori 5d10 danni radianti.\n\n" +
"Mentre tieni la spada, puoi usare un'azione per evocare un'arma a forma di spada celestiale di luce, oppure liberare un'esplosione di luce divina (Sacro Sole, CD 18) entro 9 metri. Una volta usata, non riutilizzabile fino all'alba successiva.\n\n" +
"Senzienza. La spada è senziente e ha allineamento legale buono originariamente, ma cambia a malvagio se brandita da un essere malvagio.",
    },

    // ── Batch T ────────────────────────────────────────────────────────
    'talisman-of-pure-good': {
        descrizione_it:
"Questo talismano è un potente simbolo di bontà. Una creatura malvagia che lo tocca subisce 6d6 danni radianti. Una creatura neutrale che lo tocca subisce 1d6 danni radianti. Solo una creatura buona può sintonizzarsi con esso.\n\n" +
"Mentre indossi il talismano, ottieni un bonus di +2 ai tiri per colpire con incantesimo. Inoltre, se tu o una creatura che puoi vedere entro 9 metri da te effettua un tiro per colpire, puoi usare la reazione per dare a quella creatura un bonus di +2 al tiro per colpire.\n\n" +
"Il talismano ha 7 cariche. Mentre lo indossi, puoi usare un'azione per spendere 1 carica per scegliere una creatura che vedi a terra entro 36 metri da te. Se la creatura è malvagia, una crepa fessurata si apre sotto di essa. La creatura deve riuscire in un tiro salvezza su Destrezza CD 20 o cadere nella crepa e essere distrutta, senza lasciare resti. La crepa poi si chiude. Una volta spese tutte le 7 cariche, il talismano scompare.",
    },
    'talisman-of-the-sphere': {
        descrizione_it:
"Quando effettui una prova di Intelligenza (Arcano) per controllare una Sfera dell'Annientamento mentre tieni questo talismano, raddoppia il tuo bonus di competenza alla prova. Inoltre, se inizi il tuo turno con il controllo di una sfera, puoi usare un'azione per levitare di 3 metri x il tuo modificatore di Intelligenza.",
    },
    'talisman-of-ultimate-evil': {
        descrizione_it:
"Questo oggetto simbolizza male incommensurato. Una creatura buona che tocca il talismano subisce 6d6 danni necrotici. Una creatura neutrale che lo tocca subisce 1d6 danni necrotici. Solo una creatura malvagia può sintonizzarsi con esso.\n\n" +
"Mentre indossi il talismano, ottieni un bonus di +2 ai tiri per colpire con incantesimo. Inoltre, se tu o una creatura che vedi entro 9 metri effettua un tiro per colpire, puoi usare la reazione per dare a quella creatura un bonus di +2 al tiro per colpire.\n\n" +
"Il talismano ha 6 cariche. Mentre lo indossi, puoi usare un'azione per spendere 1 carica per scegliere una creatura che vedi a terra entro 36 metri. Se la creatura è buona, una crepa si apre sotto di essa: TS Destrezza CD 20 o cadere nella crepa ed essere distrutta. Una volta spese tutte le cariche, il talismano scompare.",
    },
    'talking-doll': {
        descrizione_it:
"Mentre tieni questa bambola di porcellana, puoi usare un'azione per pronunciare una delle sue tre parole di comando per far parlare la bambola in una delle seguenti modalità: amichevole, spaventosa o allegra. La bambola parla nella tua lingua e usa frasi adatte al tono. La bambola parla per 1 minuto.",
    },
    'tankard-of-sobriety': {
        descrizione_it:
"Questo boccale ha decorazioni di motivi di balene e felci di mare. Hai vantaggio ai tiri salvezza per evitare gli effetti del consumo di alcol mentre bevi da questo boccale.",
    },
    'teeth-of-dahlver-nar': {
        descrizione_it:
"I Denti di Dahlver-Nar sono trentadue denti collezionati dal sacerdote nano Dahlver-Nar. Ognuno è un artefatto distinto che, quando piantato nel terreno, evoca una creatura specifica (animale, costrutto, drago, immondo, ecc.). I denti possono anche essere consumati per ottenere benefici temporanei, sebbene a costo di salute. La collezione completa è considerata un artefatto di immenso potere.",
    },
    'telescopic-transporter': {
        descrizione_it:
"Questo strumento ottico telescopico misura 30 cm contratto e 90 cm esteso. Mentre lo tieni, puoi usare un'azione per guardare attraverso di esso e teletrasportarti in un punto che vedi attraverso il telescopio (entro 1,5 km). Devi avere lo spazio libero. Una volta usato, non riutilizzabile fino all'alba successiva.",
    },
    'tentacle-rod': {
        descrizione_it:
"Quest'asta magica termina con tre tentacoli flessibili. Mentre la tieni, puoi usare un'azione per fare che i tentacoli attacchino una creatura che puoi vedere entro 4,5 metri da te. Effettua tre tiri per colpire con bonus pari al tuo modificatore di Intelligenza più il tuo bonus di competenza. Ogni colpo infligge 1d6 danni contundenti.\n\n" +
"Se tutti e tre gli attacchi colpiscono una singola creatura, la creatura deve riuscire in un tiro salvezza su Costituzione CD 15. Se fallisce, la velocità della creatura è dimezzata, ha svantaggio ai tiri salvezza su Destrezza, e non può usare reazioni per 1 minuto. Inoltre, in ciascun suo turno, può eseguire un'azione o un'azione bonus, non entrambe. Alla fine di ciascun suo turno, può ripetere il tiro salvezza.",
    },
    'thunderbuss': {
        descrizione_it:
"Quest'arma da fuoco magica è un fucile (o moschettone) marchiato con la runa del tuono. Ottieni un bonus di +1 ai tiri per colpire e ai tiri di danno effettuati con essa, e i danni che infligge sono di tipo tuono.\n\n" +
"Quando colpisci una creatura, può anche essere spinta indietro fino a 3 metri se è di taglia Grande o inferiore.\n\n" +
"Invocare la Runa. Come azione, invochi la runa per sparare un'esplosione conica di 9 metri. Ogni creatura nell'area: TS Costituzione CD 17 o subisce 8d6 danni tuono ed è spinta 3 metri (metà danni con successo). Una volta invocata, non riutilizzabile fino all'alba successiva.",
    },
    'tidecaller-trident': {
        descrizione_it:
"Quest'arma magica è un tridente. Ottieni un bonus di +2 ai tiri per colpire e ai tiri di danno effettuati con essa. Inoltre, infligge ulteriori 1d6 danni da freddo.\n\n" +
"Mentre tieni il tridente, puoi usare un'azione per lanciare uno dei seguenti incantesimi (CD 17), senza componenti: Controllare l'Acqua, Muro d'Acqua, o Forma di Bestia (1 ora). Una volta lanciato un incantesimo, non riutilizzabile fino all'alba successiva.\n\n" +
"Mentre tieni il tridente, hai una velocità di nuoto di 18 metri.",
    },
    'tome-of-clear-thought': {
        descrizione_it:
"Questo libro contiene esercizi di pensiero e memoria, e le sue parole sono cariche di magia. Se passi 48 ore in un periodo di 6 giorni o meno studiandone i contenuti e praticandone le linee guida, il tuo punteggio di Intelligenza aumenta di 2, così come il massimo. Il manuale perde poi la magia, ma la riacquista in un secolo.",
    },
    'tome-of-leadership-and-influence': {
        descrizione_it:
"Questo libro contiene consigli su comando e relazioni interpersonali, e le sue parole sono cariche di magia. Se passi 48 ore in un periodo di 6 giorni o meno studiandone i contenuti e praticandone le linee guida, il tuo punteggio di Carisma aumenta di 2, così come il massimo. Il manuale perde poi la magia, ma la riacquista in un secolo.",
    },
    'tome-of-the-stilled-tongue': {
        descrizione_it:
"Questo tomo nero, sottile e rilegato in pelle, ha cinque lingue umane mummificate fissate alla copertina con uno spillone d'osso. La prima pagina del tomo reca la firma di Vecna. Le pagine restanti sono vuote. Quando trovi il libro, è possibile che le altre pagine vengano riempite con i risultati di rituali e incantesimi che hai esperito.\n\n" +
"Il libro funziona da libro degli incantesimi e da focus arcano per te.\n\n" +
"Mentre tieni il libro, puoi spendere 1 carica come azione bonus per silenziare una creatura che vedi entro 18 metri (TS Carisma CD 17 negato). La creatura non può parlare per 1 minuto.\n\n" +
"Il libro ha 7 cariche e recupera 1d4+3 cariche all'alba.",
    },
    'tome-of-understanding': {
        descrizione_it:
"Questo libro contiene esercizi di consapevolezza e introspezione, e le sue parole sono cariche di magia. Se passi 48 ore in un periodo di 6 giorni o meno studiandone i contenuti e praticandone le linee guida, il tuo punteggio di Saggezza aumenta di 2, così come il massimo. Il manuale perde poi la magia, ma la riacquista in un secolo.",
    },
    'topaz-annihilator': {
        descrizione_it:
"Quest'arma magica è un cannone portatile di topazio. Ottieni un bonus di +2 ai tiri per colpire e ai tiri di danno effettuati con essa, e infligge danni da forza invece di danni perforanti.\n\n" +
"Inoltre, mentre tieni l'arma, puoi usare un'azione per lanciare l'incantesimo Disintegrazione (CD 18) attraverso di essa. Una volta lanciato, non riutilizzabile fino all'alba successiva.",
    },
    'trident-of-fish-command': {
        descrizione_it:
"Questo tridente è un'arma magica. Ha 3 cariche. Mentre lo tieni, puoi usare un'azione e spendere 1 carica per lanciare l'incantesimo Dominare Bestia (CD 15) su una bestia che ha velocità di nuoto innata. Il tridente recupera 1d3 cariche spese ogni giorno all'alba.",
    },

    // ── Batch U ────────────────────────────────────────────────────────
    'unbreakable-arrow': {
        descrizione_it:
"Questa freccia magica non può essere rotta, eccetto quando viene fatta a pezzi all'interno di un'area di un effetto di antimagia.",
    },
    'universal-solvent': {
        descrizione_it:
"Questo tubo contiene un liquido lattiginoso con un odore forte di alcol. Puoi usare un'azione per versarne il contenuto su una superficie entro portata. Il liquido scioglie istantaneamente fino a 30 cm² di adesivo che tocca, includendo Colla Sovrana.",
    },

    // ── Batch V ────────────────────────────────────────────────────────
    'veteran-s-cane': {
        descrizione_it:
"Mentre tieni questo bastone, puoi usare un'azione bonus per pronunciare la sua parola di comando e far sì che si trasformi in una spada lunga +1, o pronunciare di nuovo la parola di comando per restituirlo alla forma di bastone.",
    },
    'vicious-weapon': {
        descrizione_it:
"Quando ottieni 20 al tiro per colpire effettuato con quest'arma magica, il bersaglio subisce ulteriori 7 danni dello stesso tipo dei danni normali dell'arma.",
    },
    'voidwalker-armor': {
        descrizione_it:
"Quest'armatura nera assorbe la luce. Mentre la indossi, ottieni i seguenti benefici:\n\n" +
"- Hai resistenza ai danni necrotici e psichici.\n" +
"- Puoi sopravvivere senza bisogno di aria, cibo o acqua.\n" +
"- Una volta al giorno, puoi usare un'azione per attraversare un solido (fino a 1,5 metri di spessore) come per Passamuro, ma senza creare un foro permanente.",
    },
    'vorpal-sword': {
        descrizione_it:
"Ottieni un bonus di +3 ai tiri per colpire e ai tiri di danno effettuati con questa spada magica. Inoltre, l'arma ignora la resistenza ai danni taglienti.\n\n" +
"Quando attacchi una creatura che ha almeno una testa con quest'arma e ottieni 20 al tiro per colpire, mozzi una delle teste della creatura. La creatura muore se non può sopravvivere senza la testa persa. Una creatura è immune a questo effetto se è immune ai danni taglienti, non ha o non necessita di una testa, ha più teste o è di taglia Enorme o superiore. Tale creatura subisce invece 6d8 danni taglienti extra dal colpo.",
    },

    // ── Batch W ────────────────────────────────────────────────────────
    'walloping-ammunition': {
        descrizione_it:
"Questa munizione confeziona un colpo straordinario. Una creatura colpita dalla munizione deve riuscire in un tiro salvezza su Forza CD 10 o cadere prona.",
    },
    'war-horn-of-valor': {
        descrizione_it:
"Mentre tieni questo corno, puoi usare un'azione per soffiarlo. Tu e tutte le creature alleate entro 18 metri ottenete 1d10 punti ferita temporanei e vantaggio ai tiri salvezza contro essere spaventato per 1 minuto. Una volta usato, non riutilizzabile fino all'alba successiva.",
    },
    'warrior-s-passkey': {
        descrizione_it:
"Mentre tieni questa chiave dorata, puoi usare un'azione per inserirla in qualsiasi serratura ordinaria, che si apre automaticamente. La chiave funziona anche su porte sbarrate magicamente fino al 3° livello (Chiusura Arcana, ad esempio). Una volta usata su una serratura magica, non riutilizzabile fino all'alba successiva.",
    },
    'wave': {
        descrizione_it:
"Onda è un tridente magico. Per ottenere i benefici, devi essere un seguace di un dio del mare. Ottieni un bonus di +3 ai tiri per colpire e ai tiri di danno effettuati con esso. Conta come arma magica con la proprietà di lancio.\n\n" +
"Effetti aggiuntivi:\n" +
"- Quando colpisci una creatura, infligge danni come se fosse un attacco critico (massimi danni dadi).\n" +
"- Recuperi punti ferita pari ai danni necrotici inflitti.\n" +
"- Mentre tieni il tridente, puoi lanciare Creare o Distruggere Acqua, Localizzare Oggetto, Acque Tranquille, Camminare sull'Acqua o Respirare sott'Acqua come azione.\n\n" +
"Senzienza. Onda è un'arma senziente neutrale con Intelligenza 14, Saggezza 10 e Carisma 18. Comunica telepaticamente con il portatore.",
    },
    'wayfarer-s-boots': {
        descrizione_it:
"Mentre indossi questi stivali, puoi usare un'azione per lanciare l'incantesimo Passo Lungo (3 ore di durata, fino al doppio della velocità) su te stesso una volta al giorno. Inoltre, hai vantaggio ai tiri salvezza contro l'esaurimento da viaggi prolungati.",
    },
    'well-of-many-worlds': {
        descrizione_it:
"Questo tessuto nero fine, morbido come la seta, è ripiegato fino alle dimensioni di un fazzoletto. Si dispiega in un cerchio di 1,8 metri di diametro.\n\n" +
"Puoi usare un'azione per dispiegare il tessuto e collocarlo su o contro una superficie solida, dove crea un portale a due vie verso un altro mondo o piano d'esistenza. Ogni volta che il pozzo si apre verso un altro mondo o piano, il DM decide la destinazione. Il portale rimane aperto finché non lo ripieghi (azione, deve essere vuoto). Una volta ripiegato, non riutilizzabile per 1d8 ore.",
    },
    'whelm': {
        descrizione_it:
"Sopraffazione è un martello da guerra magico. Ottieni un bonus di +3 ai tiri per colpire e ai tiri di danno effettuati con esso. Conta come arma magica con la proprietà di lancio (range 6/18 m). Quando lo lanci, torna alla tua mano alla fine del tuo turno.\n\n" +
"Quando colpisci una creatura, infligge ulteriori 1d8 danni contundenti (2d8 ai giganti). Il bersaglio deve riuscire in un TS Costituzione CD 13 o essere stordito fino al tuo prossimo turno.\n\n" +
"Inoltre, mentre tieni l'arma, puoi usare un'azione per lanciare gli incantesimi Identificare, Localizzare Oggetto o Frantumare (CD 13).\n\n" +
"Senzienza. Whelm è senziente, neutrale legale, Intelligenza 15, Saggezza 12, Carisma 15. Comunica telepaticamente. Vuole proteggere i nani e distruggere i giganti e i goblin.",
    },
    'wind-fan': {
        descrizione_it:
"Mentre tieni questo ventaglio, puoi usare un'azione per lanciare l'incantesimo Folata di Vento (CD 13) da esso. Una volta usato, c'è una possibilità del 20% che il ventaglio si rompa e diventi inutile. Altrimenti, può essere usato di nuovo dopo 1 minuto.",
    },
    'winged-ammunition': {
        descrizione_it:
"Quando spari questa munizione magica, la sua portata aumenta di un fattore quattro.",
    },
    'winged-boots': {
        descrizione_it:
"Mentre indossi questi stivali, hai una velocità di volo pari alla tua velocità di camminata. Puoi usarli per volare per un massimo di 4 ore, in qualsiasi combinazione di intervalli (ognuno deve essere di almeno 1 minuto). Se voli quando il tempo finisce, scendi di 9 metri per round finché non atterri.\n\n" +
"Quando non sono usati, recuperano 2 ore di capacità di volo per ogni 12 ore di non utilizzo.",
    },
    'wings-of-flying': {
        descrizione_it:
"Mentre indossi questo mantello, puoi usare un'azione per pronunciare la sua parola di comando. Questo trasforma il mantello in paia di ali di pipistrello o uccello sulla schiena per 1 ora o finché non ripeti la parola di comando come azione. Le ali ti danno una velocità di volo di 18 metri. Quando termina, il mantello non può essere usato di nuovo per 1d12 ore.",
    },
    'wraps-of-unarmed-prowess': {
        descrizione_it:
"Mentre indossi queste bende, ottieni un bonus di +3 ai tiri per colpire e ai tiri di danno effettuati con attacchi senz'armi.",
    },
    'wyrmreaver-gauntlets': {
        descrizione_it:
"Questi guanti pesanti d'acciaio nero sono incrostati di scaglie di drago. Mentre li indossi, ottieni i seguenti benefici:\n\n" +
"- I tuoi attacchi senz'armi infliggono 1d8 danni perforanti invece dei danni normali.\n" +
"- I tuoi attacchi senz'armi e con armi corpo a corpo che usano Forza infliggono ulteriori 2d6 danni ai draghi.\n" +
"- Hai vantaggio ai TS contro l'effetto di paura del Soffio dei draghi.",
    },
    'wyrmskull-throne': {
        descrizione_it:
"Questo trono è scolpito da un singolo teschio di drago, e fissarsi alla sua occhiata produce una sensazione inquietante. Mentre siedi sul trono, ottieni i seguenti benefici:\n\n" +
"- Hai vantaggio alle prove di Carisma effettuate per influenzare creature.\n" +
"- Puoi lanciare gli incantesimi Comando, Suggestione, Suggestione Massima e Modificare Memoria (CD 18) senza componenti.\n" +
"- Una volta al giorno, puoi convocare un drago al tuo trono. Il drago deve essere entro 16 km e si presenta entro un giorno se possibile.\n\n" +
"Tuttavia, sintonizzarsi con il trono ti rende vulnerabile all'influenza del drago il cui teschio fu usato.",
    },

    // ── Batch Z ────────────────────────────────────────────────────────
    'zephyr-armor': {
        descrizione_it:
"Quest'armatura leggera di pelle è incisa con motivi di vento e nuvole. Mentre la indossi, ottieni i seguenti benefici:\n\n" +
"- Hai resistenza ai danni da fulmine e tuono.\n" +
"- La tua velocità di camminata aumenta di 3 metri.\n" +
"- Puoi cadere fino a 30 metri senza subire danni e atterrare in piedi.\n" +
"- Una volta al giorno, puoi lanciare l'incantesimo Velocità (CD 15) su te stesso senza componenti.",
    },

    'outer-essence-shard': {
        descrizione_it:
"Questo cristallo tremolante contiene l'essenza di un Piano Esterno. Con un'azione, puoi attaccare la scheggia a un oggetto Minuscolo o staccarla. Cade se la sintonia termina. Puoi usare la scheggia come focus per incantesimi mentre la tieni o la indossi.\n\n" +
"Tira un d4 per determinare l'essenza e proprietà:\n" +
"d4 | Proprietà\n" +
"1 | Legale. Puoi terminare una delle seguenti condizioni che affligge te o una creatura che vedi entro 9 metri: affascinato, accecato, assordato, spaventato, avvelenato o stordito.\n" +
"2 | Caotico. Scegli una creatura che subisce danni dall'incantesimo. Quel bersaglio ha svantaggio ai tiri per colpire e alle prove di caratteristica effettuati prima dell'inizio del tuo prossimo turno.\n" +
"3 | Buono. Tu o una creatura a tua scelta che vedi entro 9 metri ottieni 3d6 punti ferita temporanei.\n" +
"4 | Malvagio. Scegli una creatura che subisce danni dall'incantesimo. Quel bersaglio subisce ulteriori 3d6 danni necrotici.",
    },
};
