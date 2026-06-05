# Schema dati mostri del compendio

Questo schema raccoglie solo dati di gioco/statblock. Le descrizioni narrative dei manuali non vengono importate.

## Campi principali

- `id`: identificatore stabile generato da fonte, nome e pagina PDF.
- `nome`: nome italiano del mostro.
- `fonte`: nome completo della fonte.
- `fonte_breve`: abbreviazione della fonte, per esempio `MM`.
- `pagina_pdf`: pagina fisica del PDF da cui e' stato rilevato lo statblock.
- `tipo_linea`: riga originale tipo/taglia/allineamento, utile per audit.
- `tipo`: categoria del mostro, per esempio `Immondo`, `Non morto`, `Aberrazione`.
- `taglia`: taglia del mostro.
- `tag`: sottotipo o tag tra parentesi, se presente.
- `allineamento`: allineamento completo.
- `allineamento_breve`: abbreviazione per le card, per esempio `NM`.
- `classe_armatura`, `punti_ferita`, `velocita`: valori testuali dello statblock.
- `caratteristiche`: oggetto con `forza`, `destrezza`, `costituzione`, `intelligenza`, `saggezza`, `carisma`.
- `grado_sfida`: GS come stringa, incluse frazioni.
- `pe`: punti esperienza.

## Campi per filtri

- `tiri_salvezza`: array di abilita' abbreviate (`FOR`, `DES`, `COS`, `INT`, `SAG`, `CAR`).
- `vulnerabilita`: array di tipi danno.
- `resistenze`: array di tipi danno.
- `immunita_danni`: array di tipi danno.
- `immunita_condizioni_testo`: testo originale normalizzato, pronto per un filtro condizioni futuro.
- `fonte_breve`: usato anche come filtro fonte.

I filtri multiselezione richiesti per TS, vulnerabilita', resistenze e immunita' useranno logica OR.

## Campi dettaglio statblock

- `tiri_salvezza_testo`
- `abilita_testo`
- `vulnerabilita_testo`
- `resistenze_testo`
- `immunita_danni_testo`
- `immunita_condizioni_testo`
- `sensi`
- `linguaggi`
- `tratti`
- `azioni`
- `reazioni`
- `azioni_leggendarie`

## Audit

- `needs_review`: elenco di campi sospetti dopo l'estrazione automatica.

Un record con `needs_review` non va considerato pronto finche' non viene controllato manualmente o corretto con una regola di parsing dedicata.
