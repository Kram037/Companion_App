# Procedura migrazione pagina React

Questa procedura serve per migrare una pagina legacy verso React senza cambiare
aspetto, routing o comportamento percepito dall'utente.

## Regola zero

La migrazione tecnica non deve cambiare il design.

Prima di iniziare apri
[`../ui/UI_BASELINE_CHECKPOINT.md`](../ui/UI_BASELINE_CHECKPOINT.md) e considera
lo stato grafico attuale come vincolo. Se una card, un titolo, una search bar,
una tab, un FAB o una sidebar cambiano dimensione, posizione, colore, spaziatura
o icona, la migrazione non e' finita: e' una regressione.

## Procedura corretta

1. Identifica il renderer legacy reale.

   Cerca la funzione che oggi disegna la pagina, le classi CSS usate e gli
   handler collegati:

   ```powershell
   rg "nome-pagina|classe-card|funzioneRenderer" js css src tests
   ```

   Non partire da React. Parti dal markup legacy che funziona.

2. Copia la struttura DOM legacy, non reinventarla.

   Il componente React deve riusare le stesse classi, la stessa gerarchia e gli
   stessi attributi `data-*` quando quei selettori sono gia' usati da CSS,
   bookmark, split view o handler legacy.

   Esempio corretto per una card migrata:

   ```tsx
   <article className="campagna-card" data-campagna-id={campaign.id}>
     <div className="campagna-header">...</div>
     <div className="campagna-info">...</div>
   </article>
   ```

   Esempio da evitare:

   ```tsx
   <article className="campagna-card">
     <button className="react-campaign-main">...</button>
   </article>
   ```

   Anche se sembra equivalente, cambia il layout perche' il CSS legacy si
   aspetta figli e classi precisi.

3. Non aggiungere CSS React se il CSS legacy basta.

   Prima usa le classi esistenti. Aggiungi CSS solo quando serve davvero per il
   bridge React, e tienilo isolato. Se una regola React sostituisce il layout
   legacy, e' quasi certamente il bug.

4. Mantieni un solo owner della pagina.

   Una route React posseduta deve renderizzare dentro `ReactPage`, che imposta
   `body[data-react-owner]` e nasconde la pagina legacy equivalente.

   Una pagina non ancora migrata deve invece restare legacy: niente
   `ReactPage`, niente duplicato React visibile, niente secondo renderer.

5. Routing: scegli esplicitamente chi possiede la destinazione.

   Se anche la destinazione e' React, usa `buildAppPath(...)` e `navigate(...)`.

   Se la destinazione e' ancora legacy, usa l'ingresso legacy esistente:

   ```tsx
   onOpen={id => window.openCampagnaDetails?.(id)}
   ```

   Non navigare direttamente a una route legacy profonda se quella pagina non e'
   ancora posseduta da React. Il rischio e' aggiornare l'URL senza preparare
   `AppState`, quindi la pagina legacy ricarica la lista o resta vuota.

6. Rispetta il bridge `LegacyNavigationSync`.

   Il bridge traduce URL React e stato legacy:

   - `legacyNavigationFromPath(pathname)` legge l'URL;
   - `pathFromLegacyNavigation(snapshot)` genera l'URL;
   - `navigateToPage(page, { pushHistory: false })` attiva il DOM legacy senza
     creare loop di history;
   - `ReactPage` deve smontare quando si entra in una route legacy.

   Quando aggiungi una route o un deep link, aggiorna i test in
   `src/router/*.test.ts` e gli e2e di navigazione.

7. Handler e click: non rompere la propagazione legacy.

   Se una card intera apre un dettaglio ma contiene bottoni azione, ferma la
   propagazione solo sui bottoni:

   ```tsx
   onClick={event => {
     event.stopPropagation();
     action();
   }}
   ```

   Non mettere un `button` full-card dentro una card che contiene altri button:
   cambia layout e semantica.

8. Dati: passa da API typed, non da Supabase nel componente.

   I componenti React devono usare query/API in `src/api`, `src/features` e
   `src/query`. Non chiamare `supabase.from(...)` direttamente nella pagina.
   Le guardie di `npm.cmd run check` bloccano questo errore.

9. Rendering: niente `innerHTML` nei componenti React.

   Se il legacy usava stringhe HTML, traduci in JSX statico. Per icone SVG usa
   elementi JSX, non `dangerouslySetInnerHTML`.

10. Verifica prima del push.

   Minimo:

   ```powershell
   npm.cmd run check
   npm.cmd test
   npm.cmd run e2e -- tests/e2e/react-page-regressions.spec.ts
   npm.cmd run e2e -- tests/e2e/navigation.spec.ts
   ```

   Se tocchi layout mobile/desktop o shell globale, aggiungi:

   ```powershell
   npm.cmd run e2e -- tests/e2e/smoke.spec.ts
   ```

   Non lanciare due suite e2e in parallelo: entrambe buildano in `dist` e si
   pestano i file.

## Checklist rapida

- [ ] Il markup React usa classi e gerarchia legacy.
- [ ] Nessuna differenza visiva rispetto al checkpoint UI.
- [ ] Una sola pagina visibile: React oppure legacy, mai entrambe.
- [ ] Deep link, back button e toolbar aggiornano URL e `AppState`.
- [ ] Le pagine legacy ancora non migrate vengono aperte tramite funzioni legacy.
- [ ] I bottoni interni fermano la propagazione senza bloccare la card.
- [ ] Nessun `dangerouslySetInnerHTML`.
- [ ] Nessun accesso Supabase diretto dal componente.
- [ ] Test mirati aggiornati.
- [ ] `npm.cmd run check` verde prima del commit.

## Errori gia' visti da non ripetere

- Card React con wrapper nuovo: cambia dimensioni e disposizione anche se la
  classe esterna e' uguale.
- Route React verso dettaglio legacy con solo `navigate(...)`: l'URL cambia ma
  il legacy puo' tornare alla lista perche' manca lo stato.
- E2E lanciati in parallelo: falliscono in build per collisione su `dist`.
- Fix CSS globale per correggere un problema React locale: rischia di cambiare
  tutta l'app.
