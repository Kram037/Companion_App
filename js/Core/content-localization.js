// ============================================================================
// CONTENT LOCALIZATION AND TYPOGRAPHY NORMALIZATION
// ============================================================================
// Runtime compatibility layer for legacy/generated content. It repairs common
// UTF-8 mojibake, normalizes Italian typography, translates spell material
// components and the most common statblock terminology without modifying the
// original English fields.

(function initContentLocalization() {
    if (window.__contentLocalizationLoaded) return;
    window.__contentLocalizationLoaded = true;

    const MOJIBAKE_REPLACEMENTS = [
        ['Ã€', 'À'], ['Ã', 'Á'], ['Ã‚', 'Â'], ['Ãƒ', 'Ã'], ['Ã„', 'Ä'],
        ['Ãˆ', 'È'], ['Ã‰', 'É'], ['ÃŠ', 'Ê'], ['Ã‹', 'Ë'],
        ['ÃŒ', 'Ì'], ['Ã', 'Í'], ['ÃŽ', 'Î'], ['Ã', 'Ï'],
        ['Ã’', 'Ò'], ['Ã“', 'Ó'], ['Ã”', 'Ô'], ['Ã–', 'Ö'],
        ['Ã™', 'Ù'], ['Ãš', 'Ú'], ['Ã›', 'Û'], ['Ãœ', 'Ü'],
        ['Ã ', 'à'], ['Ã¡', 'á'], ['Ã¢', 'â'], ['Ã£', 'ã'], ['Ã¤', 'ä'],
        ['Ã¨', 'è'], ['Ã©', 'é'], ['Ãª', 'ê'], ['Ã«', 'ë'],
        ['Ã¬', 'ì'], ['Ã­', 'í'], ['Ã®', 'î'], ['Ã¯', 'ï'],
        ['Ã²', 'ò'], ['Ã³', 'ó'], ['Ã´', 'ô'], ['Ã¶', 'ö'],
        ['Ã¹', 'ù'], ['Ãº', 'ú'], ['Ã»', 'û'], ['Ã¼', 'ü'],
        ['Ã§', 'ç'], ['Ã±', 'ñ'],
        ['â€™', '’'], ['â€˜', '‘'], ['â€œ', '“'], ['â€', '”'],
        ['â€“', '–'], ['â€”', '—'], ['â€¦', '…'], ['â€¢', '•'],
        ['âˆ’', '−'], ['â‰¥', '≥'], ['â‰¤', '≤'], ['â†’', '→'],
        ['Â°', '°'], ['Â·', '·'], ['Â½', '½'], ['Â¼', '¼'], ['Â¾', '¾'],
        ['Â ', ' '], ['Â', ''],
    ];

    // Casi in cui l'accento e' gia' stato perso ed e' rimasto un "?" dentro
    // una parola italiana. La mappa e' volutamente chiusa: non tocchiamo i
    // punti interrogativi reali, correggiamo solo parole note del lessico app.
    const QUESTION_MARK_WORD_REPAIRS = new Map(Object.entries({
        abilita: 'abilità', agilita: 'agilità', affinita: 'affinità', ambiguita: 'ambiguità',
        attivita: 'attività', capacita: 'capacità', citta: 'città', comunita: 'comunità',
        creativita: 'creatività', difficolta: 'difficoltà', divinita: 'divinità',
        entita: 'entità', eredita: 'eredità', eta: 'età', facolta: 'facoltà',
        fedelta: 'fedeltà', identita: 'identità', immunita: 'immunità', intensita: 'intensità',
        lealta: 'lealtà', liberta: 'libertà', localita: 'località', longevita: 'longevità',
        maesta: 'maestà', meta: 'metà', modalita: 'modalità', negativita: 'negatività',
        opportunita: 'opportunità', possibilita: 'possibilità', proprieta: 'proprietà',
        qualita: 'qualità', quantita: 'quantità', rarita: 'rarità', realta: 'realtà',
        reperibilita: 'reperibilità', sanita: 'sanità', specialita: 'specialità',
        utilita: 'utilità', velocita: 'velocità', verita: 'verità', vitalita: 'vitalità',
        volonta: 'volontà', vulnerabilita: 'vulnerabilità',
        affinche: 'affinché', anziche: 'anziché', benche: 'benché', finche: 'finché',
        perche: 'perché', poiche: 'poiché', sicche: 'sicché',
        cio: 'ciò', gia: 'già', giu: 'giù', piu: 'più', puo: 'può', quaggiu: 'quaggiù',
        quassu: 'quassù', cosi: 'così', li: 'lì', la: 'là', si: 'sì', se: 'sé', ne: 'né',
    }));

    const ITALIAN_TYPOGRAPHY_REPLACEMENTS = [
        [/\babilita(?:'|’)?\b/gi, 'abilità'],
        [/\bimmunita(?:'|’)?\b/gi, 'immunità'],
        [/\bvulnerabilita(?:'|’)?\b/gi, 'vulnerabilità'],
        [/\bvelocita(?:'|’)?\b/gi, 'velocità'],
        [/\bquantita(?:'|’)?\b/gi, 'quantità'],
        [/\bpossibilita(?:'|’)?\b/gi, 'possibilità'],
        [/\bopportunita(?:'|’)?\b/gi, 'opportunità'],
        [/\bvolonta(?:'|’)?\b/gi, 'volontà'],
        [/\bproprieta(?:'|’)?\b/gi, 'proprietà'],
        [/\brarita(?:'|’)?\b/gi, 'rarità'],
        [/\breperibilita(?:'|’)?\b/gi, 'reperibilità'],
        [/\bidentita(?:'|’)?\b/gi, 'identità'],
        [/\butilita(?:'|’)?\b/gi, 'utilità'],
        [/\bmeta\b(?=\s+(?:dei|del|della|delle)\s+dann)/gi, 'metà'],
        [/\bpuo(?:'|’)?\b/gi, 'può'],
        [/\bpiu(?:'|’)?\b/gi, 'più'],
        [/\bperche(?:'|’)?\b/gi, 'perché'],
        [/\bfinche(?:'|’)?\b/gi, 'finché'],
        [/\be(?:'|’)\b(?=\s+(?:immune|incapacitato|accecato|paralizzato|avvelenato|stabile)\b)/gi, 'è'],
        [/\ball\s+inizio\b/gi, 'all’inizio'],
        [/\ball\s+interno\b/gi, 'all’interno'],
        [/\bun\s+altra\b/gi, 'un’altra'],
        [/\bun\s+altro\b/gi, 'un altro'],
        [/\bd\s+Ossa\b/g, 'd’Ossa'],
        [/\bd\s+argento\b/gi, 'd’argento'],
        [/\bd\s+oro\b/gi, 'd’oro'],
        [/\bd\s+avorio\b/gi, 'd’avorio'],
        [/\bl\s+incantesimo\b/gi, 'l’incantesimo'],
        [/\bl\s+effetto\b/gi, 'l’effetto'],
        [/\bl\s+inizio\b/gi, 'l’inizio'],
        [/\bl\s+udito\b/gi, 'l’udito'],
    ];

    const SPELL_MATERIAL_REPLACEMENTS = [
        [/\ba tiny bit of\b/gi, 'un minuscolo pezzetto di'],
        [/\ba bit of\b/gi, 'un pezzetto di'],
        [/\ba pinch of\b/gi, 'un pizzico di'],
        [/\bpinch of\b/gi, 'pizzico di'],
        [/\ba small piece of\b/gi, 'un piccolo pezzo di'],
        [/\ba short piece of\b/gi, 'un breve pezzo di'],
        [/\ba piece of\b/gi, 'un pezzo di'],
        [/\bpiece of\b/gi, 'pezzo di'],
        [/\ba lump of\b/gi, 'una zolla di'],
        [/\ba dollop of\b/gi, 'una cucchiaiata di'],
        [/\ba handful of\b/gi, 'una manciata di'],
        [/\ba few grains of\b/gi, 'alcuni granelli di'],
        [/\ba drop of\b/gi, 'una goccia di'],
        [/\ba wisp of\b/gi, 'un filo di'],
        [/\ba sprig of\b/gi, 'un rametto di'],
        [/\ba tuft of\b/gi, 'un ciuffo di'],
        [/\ba scrap of\b/gi, 'un brandello di'],
        [/\ba sliver of\b/gi, 'una scheggia di'],
        [/\ba strand of\b/gi, 'un filamento di'],
        [/\ba small amount of\b/gi, 'una piccola quantità di'],
        [/\ba small measure of\b/gi, 'una piccola misura di'],
        [/\bworth at least\b/gi, 'del valore di almeno'],
        [/\beach item worth\b/gi, 'ciascuno del valore di'],
        [/\beach worth\b/gi, 'ciascuno del valore di'],
        [/\bworth\b/gi, 'del valore di'],
        [/\bwhich the spell consumes\b/gi, 'che l’incantesimo consuma'],
        [/\bthat (?:the spell )?consumes\b/gi, 'che l’incantesimo consuma'],
        [/\bconsumed by the spell\b/gi, 'consumato dall’incantesimo'],
        [/\bthe spell consumes\b/gi, 'l’incantesimo consuma'],
        [/\bpowdered iron\b/gi, 'ferro in polvere'],
        [/\bpowdered diamond\b/gi, 'diamante in polvere'],
        [/\bpowdered silver\b/gi, 'argento in polvere'],
        [/\bpowdered ruby\b/gi, 'rubino in polvere'],
        [/\bdiamond dust\b/gi, 'polvere di diamante'],
        [/\bdiamond powder\b/gi, 'polvere di diamante'],
        [/\biron filings\b/gi, 'limatura di ferro'],
        [/\bsilver filings\b/gi, 'limatura d’argento'],
        [/\bgem-encrusted bowl\b/gi, 'ciotola tempestata di gemme'],
        [/\bjewel-encrusted dagger\b/gi, 'pugnale tempestato di gemme'],
        [/\bminiature portal\b/gi, 'portale in miniatura'],
        [/\bpolished marble\b/gi, 'marmo lucidato'],
        [/\bsilver cage\b/gi, 'gabbia d’argento'],
        [/\bsilver whistle\b/gi, 'fischietto d’argento'],
        [/\bsilver wire\b/gi, 'filo d’argento'],
        [/\bsilver pin(?:s)?\b/gi, 'spilli d’argento'],
        [/\bsilver spoon\b/gi, 'cucchiaio d’argento'],
        [/\bsilver rod\b/gi, 'bacchetta d’argento'],
        [/\bsilver bell\b/gi, 'campana d’argento'],
        [/\bcopper wire\b/gi, 'filo di rame'],
        [/\bcopper (?:piece|coin)\b/gi, 'moneta di rame'],
        [/\bcopper rod\b/gi, 'bacchetta di rame'],
        [/\bgolden wire\b/gi, 'filo d’oro'],
        [/\bgolden flower\b/gi, 'fiore d’oro'],
        [/\bgolden sickle\b/gi, 'falcetto d’oro'],
        [/\bgolden reliquary\b/gi, 'reliquiario d’oro'],
        [/\bgolden skull\b/gi, 'teschio d’oro'],
        [/\bgolden horn\b/gi, 'corno d’oro'],
        [/\bgilded flower\b/gi, 'fiore dorato'],
        [/\bgilded acorn\b/gi, 'ghianda dorata'],
        [/\bgilded skull\b/gi, 'teschio dorato'],
        [/\bjeweled horn\b/gi, 'corno ingioiellato'],
        [/\bmetal rod\b/gi, 'bacchetta di metallo'],
        [/\bmetal lockbox\b/gi, 'cassetta di metallo'],
        [/\bglass cone\b/gi, 'cono di vetro'],
        [/\bglass eye\b/gi, 'occhio di vetro'],
        [/\bcrystal rod\b/gi, 'bacchetta di cristallo'],
        [/\bcrystal vial\b/gi, 'fiala di cristallo'],
        [/\bcrystal bead\b/gi, 'perlina di cristallo'],
        [/\bivory dagger\b/gi, 'pugnale d’avorio'],
        [/\bivory portal\b/gi, 'portale d’avorio'],
        [/\bblack pearl\b/gi, 'perla nera'],
        [/\bbrown pearl\b/gi, 'perla marrone'],
        [/\bthe petrified eye of a newt\b/gi, 'l’occhio pietrificato di un tritone'],
        [/\beye of a newt\b/gi, 'occhio di tritone'],
        [/\bbat guano\b/gi, 'guano di pipistrello'],
        [/\bsnake['’]s tongue\b/gi, 'lingua di serpente'],
        [/\bmandrake root\b/gi, 'radice di mandragora'],
        [/\brose petals\b/gi, 'petali di rosa'],
        [/\bfish tail\b/gi, 'coda di pesce'],
        [/\bsalt water\b/gi, 'acqua salata'],
        [/\bfine sand\b/gi, 'sabbia fine'],
        [/\bholy water\b/gi, 'acqua santa'],
        [/\bholy symbol\b/gi, 'simbolo sacro'],
        [/\bsacred relic\b/gi, 'reliquia sacra'],
        [/\breligious text\b/gi, 'testo religioso'],
        [/\bplane of existence\b/gi, 'piano di esistenza'],
        [/\bgum arabic\b/gi, 'gomma arabica'],
        [/\bbronze brazier\b/gi, 'braciere di bronzo'],
        [/\bmelee weapon\b/gi, 'arma da mischia'],
        [/\bincense\b/gi, 'incenso'], [/\bbrimstone\b/gi, 'zolfo nero'],
        [/\bfrankincense\b/gi, 'incenso'], [/\bparchment\b/gi, 'pergamena'],
        [/\bvellum\b/gi, 'cartapecora'], [/\bsulfur\b/gi, 'zolfo'],
        [/\bphosphorus\b/gi, 'fosforo'], [/\bmistletoe\b/gi, 'vischio'],
        [/\bholly\b/gi, 'agrifoglio'], [/\boak\b/gi, 'quercia'],
        [/\bsilver\b/gi, 'argento'], [/\bgold\b/gi, 'oro'],
        [/\bcopper\b/gi, 'rame'], [/\biron\b/gi, 'ferro'],
        [/\bsteel\b/gi, 'acciaio'], [/\bbronze\b/gi, 'bronzo'],
        [/\bplatinum\b/gi, 'platino'], [/\bcrystal\b/gi, 'cristallo'],
        [/\bdiamond\b/gi, 'diamante'], [/\bjade\b/gi, 'giada'],
        [/\bquartz\b/gi, 'quarzo'], [/\bruby\b/gi, 'rubino'],
        [/\bemerald\b/gi, 'smeraldo'], [/\bsapphire\b/gi, 'zaffiro'],
        [/\bamber\b/gi, 'ambra'], [/\bonyx\b/gi, 'onice'],
        [/\bpearl\b/gi, 'perla'], [/\bgemstones?\b/gi, 'gemme'],
        [/\bgems?\b/gi, 'gemme'], [/\bivory\b/gi, 'avorio'],
        [/\bmarble\b/gi, 'marmo'], [/\bstone\b/gi, 'pietra'],
        [/\blodestone\b/gi, 'calamita'], [/\blead\b/gi, 'piombo'],
        [/\bmercury\b/gi, 'mercurio'], [/\bquicksilver\b/gi, 'mercurio'],
        [/\bsand\b/gi, 'sabbia'], [/\bdust\b/gi, 'polvere'],
        [/\bpowdered\b/gi, 'in polvere'], [/\bpowder\b/gi, 'polvere'],
        [/\bashes?\b/gi, 'cenere'], [/\bclay\b/gi, 'argilla'],
        [/\bdirt\b/gi, 'terra'], [/\bwater\b/gi, 'acqua'],
        [/\boil\b/gi, 'olio'], [/\bwax\b/gi, 'cera'],
        [/\bcandle\b/gi, 'candela'], [/\bhoney\b/gi, 'miele'],
        [/\bsmoke\b/gi, 'fumo'], [/\bfirefly\b/gi, 'lucciola'],
        [/\bglowworm\b/gi, 'verme luminoso'], [/\bfeather\b/gi, 'piuma'],
        [/\bfur\b/gi, 'pelliccia'], [/\bfleece\b/gi, 'vello'],
        [/\bleather\b/gi, 'cuoio'], [/\bwool\b/gi, 'lana'],
        [/\bcloth\b/gi, 'stoffa'], [/\bsilk\b/gi, 'seta'],
        [/\bcricket\b/gi, 'grillo'], [/\bspider\b/gi, 'ragno'],
        [/\bblood\b/gi, 'sangue'], [/\bbone\b/gi, 'osso'],
        [/\bskull\b/gi, 'teschio'], [/\bheart\b/gi, 'cuore'],
        [/\bacorn\b/gi, 'ghianda'], [/\bberry\b/gi, 'bacca'],
        [/\bberries\b/gi, 'bacche'], [/\bleaf\b/gi, 'foglia'],
        [/\bleaves\b/gi, 'foglie'], [/\btwig\b/gi, 'ramoscello'],
        [/\bpetals?\b/gi, 'petali'], [/\bthorns?\b/gi, 'spine'],
        [/\bstring\b/gi, 'spago'], [/\brope\b/gi, 'corda'],
        [/\bvial\b/gi, 'fiala'], [/\bbowl\b/gi, 'ciotola'],
        [/\bcup\b/gi, 'tazza'], [/\bcontainer\b/gi, 'contenitore'],
        [/\bcoffin\b/gi, 'bara'], [/\bspoon\b/gi, 'cucchiaio'],
        [/\bbell\b/gi, 'campana'], [/\bwhistle\b/gi, 'fischietto'],
        [/\brod\b/gi, 'bacchetta'], [/\bcage\b/gi, 'gabbia'],
        [/\bdagger\b/gi, 'pugnale'], [/\bsickle\b/gi, 'falcetto'],
        [/\bhorn\b/gi, 'corno'], [/\bstatuette\b/gi, 'statuetta'],
        [/\bmirror\b/gi, 'specchio'], [/\bbrazier\b/gi, 'braciere'],
        [/\bbead\b/gi, 'perlina'], [/\bwire\b/gi, 'filo'],
        [/\bwood\b/gi, 'legno'], [/\bweapon\b/gi, 'arma'],
        [/\bammunition\b/gi, 'munizioni'], [/\barrow\b/gi, 'freccia'],
        [/\bsword\b/gi, 'spada'], [/\bquarterstaff\b/gi, 'bastone ferrato'],
        [/\bgp\b/gi, 'mo'], [/\bsp\b/gi, 'ma'], [/\bcp\b/gi, 'mr'],
        [/\bsome\b/gi, 'un po’ di'], [/\bmade of\b/gi, 'fatto di'],
        [/\bfilled with\b/gi, 'riempito di'], [/\bwrapped in\b/gi, 'avvolto in'],
        [/\bsoaked in\b/gi, 'imbevuto in'], [/\bcontaining\b/gi, 'contenente'],
        [/\bsuch as\b/gi, 'come'], [/\bwith\b/gi, 'con'],
        [/\band\b/gi, 'e'], [/\bor\b/gi, 'o'], [/\bof\b/gi, 'di'],
        [/\bfrom\b/gi, 'da'], [/\bthe\b/gi, ''],
    ];

    const STATBLOCK_PHRASE_REPLACEMENTS = [
        [/\bMelee or Ranged Weapon Attack\b/gi, 'Attacco con arma da mischia o a distanza'],
        [/\bMelee or Ranged Spell Attack\b/gi, 'Attacco con incantesimo da mischia o a distanza'],
        [/\bMelee Weapon Attack\b/gi, 'Attacco con arma da mischia'],
        [/\bRanged Weapon Attack\b/gi, 'Attacco con arma a distanza'],
        [/\bMelee Spell Attack\b/gi, 'Attacco con incantesimo da mischia'],
        [/\bRanged Spell Attack\b/gi, 'Attacco con incantesimo a distanza'],
        [/\bHit:\s*/gi, 'Colpito: '], [/\bto hit\b/gi, 'al tiro per colpire'],
        [/\breach\b/gi, 'portata'], [/\brange\b/gi, 'gittata'],
        [/\bone willing creature\b/gi, 'una creatura consenziente'],
        [/\bone prone creature\b/gi, 'una creatura prona'],
        [/\bone target\b/gi, 'un bersaglio'], [/\bone creature\b/gi, 'una creatura'],
        [/\beach creature\b/gi, 'ogni creatura'], [/\bthe target\b/gi, 'il bersaglio'],
        [/\bsaving throws\b/gi, 'tiri salvezza'], [/\bsaving throw\b/gi, 'tiro salvezza'],
        [/\bspell save DC\b/gi, 'CD del tiro salvezza degli incantesimi'],
        [/\bspell attack modifier\b/gi, 'modificatore di attacco con incantesimo'],
        [/\battack rolls\b/gi, 'tiri per colpire'], [/\battack roll\b/gi, 'tiro per colpire'],
        [/\bability checks\b/gi, 'prove di caratteristica'],
        [/\bon a failed save\b/gi, 'se fallisce il tiro salvezza'],
        [/\bon a successful save\b/gi, 'se supera il tiro salvezza'],
        [/\bor half as much damage on a successful one\b/gi, 'o la metà dei danni se lo supera'],
        [/\bhalf as much damage\b/gi, 'la metà dei danni'],
        [/\btemporary hit points\b/gi, 'punti ferita temporanei'],
        [/\bhit points\b/gi, 'punti ferita'], [/\bhit point\b/gi, 'punto ferita'],
        [/\bdamage\b/gi, 'danni'], [/\badvantage\b/gi, 'vantaggio'],
        [/\bdisadvantage\b/gi, 'svantaggio'], [/\bwithin\b/gi, 'entro'],
        [/\bwithout provoking opportunity attacks\b/gi, 'senza provocare attacchi di opportunità'],
        [/\bopportunity attacks\b/gi, 'attacchi di opportunità'],
        [/\bat the start of each of its turns\b/gi, 'all’inizio di ciascun suo turno'],
        [/\bat the start of its turn\b/gi, 'all’inizio del suo turno'],
        [/\bat the end of each of its turns\b/gi, 'alla fine di ciascun suo turno'],
        [/\buntil the start of its next turn\b/gi, 'fino all’inizio del suo prossimo turno'],
        [/\buntil the end of its next turn\b/gi, 'fino alla fine del suo prossimo turno'],
        [/\brequiring no material components\b/gi, 'senza componenti materiali'],
        [/\bCantrips \(at will\):/gi, 'Trucchetti (a volontà):'],
        [/\bAt will:/gi, 'A volontà:'],
        [/\b1\/day each:/gi, '1/giorno ciascuno:'],
        [/\b2\/day each:/gi, '2/giorno ciascuno:'],
        [/\b3\/day each:/gi, '3/giorno ciascuno:'],
        [/\bArmor Class\b/gi, 'Classe Armatura'],
        [/\bHit Points\b/gi, 'Punti Ferita'], [/\bSpeed\b/gi, 'Velocità'],
        [/\bMultiattack\b/gi, 'Multiattacco'], [/\bInnate Spellcasting\b/gi, 'Incantesimi Innati'],
        [/\bSpellcasting\b/gi, 'Incantesimi'], [/\bMagic Resistance\b/gi, 'Resistenza alla Magia'],
        [/\bLegendary Resistance\b/gi, 'Resistenza Leggendaria'],
        [/\bLegendary Actions\b/gi, 'Azioni Leggendarie'], [/\bBonus Actions\b/gi, 'Azioni Bonus'],
        [/\bReactions\b/gi, 'Reazioni'], [/\bActions\b/gi, 'Azioni'],
        [/\bTiny\b/gi, 'Minuscolo'], [/\bSmall\b/gi, 'Piccolo'],
        [/\bMedium\b/gi, 'Medio'], [/\bLarge\b/gi, 'Grande'],
        [/\bHuge\b/gi, 'Enorme'], [/\bGargantuan\b/gi, 'Mastodontico'],
        [/\bacid\b/gi, 'acido'], [/\bbludgeoning\b/gi, 'contundente'],
        [/\bcold\b/gi, 'freddo'], [/\bfire\b/gi, 'fuoco'],
        [/\bforce\b/gi, 'forza'], [/\blightning\b/gi, 'fulmine'],
        [/\bnecrotic\b/gi, 'necrotico'], [/\bpiercing\b/gi, 'perforante'],
        [/\bpoison\b/gi, 'veleno'], [/\bpsychic\b/gi, 'psichico'],
        [/\bradiant\b/gi, 'radioso'], [/\bslashing\b/gi, 'tagliente'],
        [/\bthunder\b/gi, 'tuono'],
    ];

    function isItalian() {
        try {
            return typeof window.getAppLang !== 'function' || window.getAppLang() !== 'en';
        } catch (_) {
            return true;
        }
    }

    function _preserveWordCase(original, repaired) {
        if (!original) return repaired;
        if (original === original.toUpperCase()) return repaired.toUpperCase();
        if (original[0] === original[0].toUpperCase()) return repaired[0].toUpperCase() + repaired.slice(1);
        return repaired;
    }

    function repairSuspiciousQuestionMarks(value) {
        if (value == null) return value;
        return String(value).replace(/\b([A-Za-zÀ-ÖØ-öø-ÿ]{2,})\?(?=\b|[\s.,;:!\)\]\}\"'»]|$)/g, (match, word) => {
            const key = word.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
            const repaired = QUESTION_MARK_WORD_REPAIRS.get(key);
            return repaired ? _preserveWordCase(word, repaired) : match;
        });
    }

    function repairTextEncoding(value) {
        if (value == null) return value;
        let text = String(value);
        MOJIBAKE_REPLACEMENTS.forEach(([bad, good]) => {
            if (text.includes(bad)) text = text.split(bad).join(good);
        });
        text = repairSuspiciousQuestionMarks(text);
        return text
            .replace(/\u00a0/g, ' ')
            .replace(/[ \t]+\n/g, '\n')
            .normalize('NFC');
    }

    function normalizeItalianTypography(value) {
        if (value == null) return value;
        let text = repairTextEncoding(value);
        ITALIAN_TYPOGRAPHY_REPLACEMENTS.forEach(([pattern, replacement]) => {
            text = text.replace(pattern, replacement);
        });
        return text
            .replace(/\s+([,.;:!?])/g, '$1')
            .replace(/([,.;:!?])(?=[A-Za-zÀ-ÖØ-öø-ÿ])/g, '$1 ')
            .replace(/[ \t]{2,}/g, ' ')
            .normalize('NFC');
    }

    function translateSpellComponents(value) {
        if (value == null) return value;
        let text = repairTextEncoding(value);
        if (!isItalian()) return text;
        SPELL_MATERIAL_REPLACEMENTS.forEach(([pattern, replacement]) => {
            text = text.replace(pattern, replacement);
        });
        text = normalizeItalianTypography(text)
            .replace(/\(\s+/g, '(')
            .replace(/\s+\)/g, ')')
            .replace(/,\s*,+/g, ', ')
            .replace(/\s{2,}/g, ' ')
            .replace(/\b([VSM])\s*[,;/]\s*/g, '$1, ')
            .replace(/\b([VSM]),\s*([VSM])\b/g, '$1, $2')
            .trim();
        return text;
    }

    function translateStatblockText(value) {
        if (value == null) return value;
        let text = repairTextEncoding(value);
        if (!isItalian()) return text;
        STATBLOCK_PHRASE_REPLACEMENTS.forEach(([pattern, replacement]) => {
            text = text.replace(pattern, replacement);
        });
        return normalizeItalianTypography(text);
    }

    function normalizeDisplayText(value) {
        return isItalian() ? normalizeItalianTypography(value) : repairTextEncoding(value);
    }

    function localizeSpellRecord(spell) {
        if (!spell || typeof spell !== 'object') return spell;
        const stringFields = ['name', 'school_it', 'casting_time', 'range', 'duration', 'description', 'source'];
        stringFields.forEach((field) => {
            if (typeof spell[field] === 'string') spell[field] = normalizeDisplayText(spell[field]);
        });
        if (typeof spell.components === 'string' || typeof spell.components_en === 'string') {
            spell.components = translateSpellComponents(spell.components || spell.components_en || '');
        }
        if (Array.isArray(spell.classes)) spell.classes = spell.classes.map(normalizeDisplayText);
        return spell;
    }

    function localizeMonsterRecord(monster) {
        if (!monster || typeof monster !== 'object') return monster;
        const plainFields = [
            'nome', 'tipo', 'tipo_linea', 'allineamento', 'allineamento_breve',
            'classe_armatura', 'punti_ferita', 'velocita', 'grado_sfida', 'pe',
            'fonte', 'fonte_breve', 'tiri_salvezza_testo', 'abilita_testo',
            'vulnerabilita_testo', 'resistenze_testo', 'immunita_danni_testo',
            'immunita_condizioni_testo', 'sensi', 'linguaggi',
        ];
        plainFields.forEach((field) => {
            if (typeof monster[field] === 'string') monster[field] = translateStatblockText(monster[field]);
        });
        const richFields = [
            'tratti', 'azioni', 'azioni_bonus', 'reazioni', 'azioni_leggendarie',
            'azioni_mitiche', 'azioni_tana', 'descrizione',
        ];
        richFields.forEach((field) => {
            if (typeof monster[field] === 'string') monster[field] = translateStatblockText(monster[field]);
        });
        [
            'tiri_salvezza', 'resistenze', 'immunita_danni', 'immunita_condizioni',
            'vulnerabilita', 'abilita',
        ].forEach((field) => {
            if (Array.isArray(monster[field])) monster[field] = monster[field].map(translateStatblockText);
        });
        return monster;
    }

    function normalizeGenericRecord(record, seen = new WeakSet(), depth = 0) {
        if (!record || typeof record !== 'object' || seen.has(record) || depth > 8) return record;
        seen.add(record);
        Object.entries(record).forEach(([key, value]) => {
            if (typeof value === 'string') {
                if (!/_en$/.test(key) && !/(?:^|_)(?:id|slug|url|path|src|key)$/i.test(key)) {
                    record[key] = normalizeDisplayText(value);
                }
            } else if (Array.isArray(value)) {
                value.forEach((item, index) => {
                    if (typeof item === 'string') value[index] = normalizeDisplayText(item);
                    else normalizeGenericRecord(item, seen, depth + 1);
                });
            } else if (value && typeof value === 'object') {
                normalizeGenericRecord(value, seen, depth + 1);
            }
        });
        return record;
    }

    function localizeRuntimeDataBundle(key) {
        const normalizedKey = String(key || 'all');
        if (normalizedKey === 'all' || normalizedKey === 'spells') {
            Object.values(window.SPELLS_DATA || {}).forEach(localizeSpellRecord);
        }
        if (normalizedKey === 'all' || normalizedKey === 'monsters') {
            (window.COMP_MONSTERS_DATA || []).forEach(localizeMonsterRecord);
        }
        if (normalizedKey === 'all' || normalizedKey === 'summonStatblocks') {
            (window.COMP_SUMMON_STATBLOCKS_DATA || []).forEach(localizeMonsterRecord);
        }
        const genericGlobals = {
            backgrounds: 'BACKGROUNDS_DATA', classes: 'CLASSES_DATA', feats: 'FEATS_DATA',
            fightingStyles: 'FIGHTING_STYLES_DATA', invocations: 'INVOCATIONS_DATA',
            magicItems: 'OGGETTI_MAGICI_DATA', races: 'RACES_DATA',
            subclassSpells: 'SUBCLASS_SPELLS_DATA', poisons: 'VELENI_DATA',
        };
        if (normalizedKey === 'all') {
            Object.values(genericGlobals).forEach((name) => normalizeGenericRecord(window[name]));
        } else if (genericGlobals[normalizedKey]) {
            normalizeGenericRecord(window[genericGlobals[normalizedKey]]);
        }
        return true;
    }

    const STATBLOCK_CONTAINER_SELECTOR = [
        '.comp-monster-text', '.comp-summon-statblock-modal', '.comp-monster-card',
        '.combat-monster-full-sheet', '#combatMonsterFullModal', '#combatPlaceholderModal',
    ].join(',');

    function shouldSkipNode(node) {
        const parent = node?.parentElement;
        if (!parent) return true;
        return !!parent.closest('script, style, textarea, [contenteditable="true"]');
    }

    function normalizeTextNode(node) {
        if (!node || node.nodeType !== Node.TEXT_NODE || shouldSkipNode(node)) return;
        const parent = node.parentElement;
        const original = node.nodeValue || '';
        let next = normalizeDisplayText(original);
        if (isItalian() && parent?.closest(STATBLOCK_CONTAINER_SELECTOR)) {
            next = translateStatblockText(next);
        }
        if (next !== original) node.nodeValue = next;
    }

    function normalizeElementAttributes(element) {
        if (!(element instanceof Element)) return;
        ['placeholder', 'title', 'aria-label'].forEach((attribute) => {
            if (!element.hasAttribute(attribute)) return;
            const original = element.getAttribute(attribute) || '';
            const next = normalizeDisplayText(original);
            if (next !== original) element.setAttribute(attribute, next);
        });
    }

    function normalizeDomTree(root = document.body) {
        if (!root) return;
        if (root.nodeType === Node.TEXT_NODE) {
            normalizeTextNode(root);
            return;
        }
        if (!(root instanceof Element) && root !== document.body && root !== document.documentElement) return;
        if (root instanceof Element) normalizeElementAttributes(root);
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
        let node;
        while ((node = walker.nextNode())) {
            if (node.nodeType === Node.TEXT_NODE) normalizeTextNode(node);
            else normalizeElementAttributes(node);
        }
    }

    let domScanQueued = false;
    function queueDomScan(root) {
        if (domScanQueued) return;
        domScanQueued = true;
        requestAnimationFrame(() => {
            domScanQueued = false;
            normalizeDomTree(root || document.body);
        });
    }

    window.repairTextEncoding = repairTextEncoding;
    window.repairSuspiciousQuestionMarks = repairSuspiciousQuestionMarks;
    window.normalizeItalianTypography = normalizeItalianTypography;
    window.translateSpellComponents = translateSpellComponents;
    window.translateStatblockText = translateStatblockText;
    window.localizeRuntimeDataBundle = localizeRuntimeDataBundle;
    function start() {
        localizeRuntimeDataBundle('all');
        normalizeDomTree(document.body);
        const observer = new MutationObserver((mutations) => {
            const root = mutations.find(mutation => mutation.addedNodes?.length)?.target || document.body;
            queueDomScan(root instanceof Element ? root : document.body);
        });
        observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    }

    document.addEventListener('appLangChanged', () => {
        localizeRuntimeDataBundle('all');
        queueDomScan(document.body);
    });

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', start, { once: true });
    } else {
        start();
    }
})();
