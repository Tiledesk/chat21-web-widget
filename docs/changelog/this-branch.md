# Questo branch: UX bot/umano + disaccoppiamento callout

## Contesto

Questo branch migliora il feedback in conversazione e rende il comportamento del callout indipendente dal sign-in del widget.

## Modifiche incluse

- Aggiunto un **badge Bot/Umano** nella vista conversazione.
  - All'apertura della conversazione analizza **l'ultimo messaggio ricevuto dal server** (escludendo quelli inviati dal client).
  - Classifica il mittente come `Bot` o `Umano`.
  - Regola speciale: se l'ultimo evento di sistema rilevante e' `MEMBER_JOINED_GROUP` (handoff verso operatore), la conversazione viene classificata come **Umano**.

- Aggiunto il feedback temporaneo **"sto pensando..."** dopo l'invio del messaggio da parte del client.
  - Mostrato solo quando la conversazione e' classificata come **Bot**.
  - Nascosto alla prima risposta server, con durata minima visibile di 5 secondi.

- Rimossa l'implementazione temporanea del toast "ciao" nel footer e relativo wiring.

- Abilitato il percorso di avvio widget per i casi guidati da bot quando sono presenti `botsRules`.

## Disaccoppiamento callout (step completati)

- **Step 1**: rimossa la dipendenza da `g.senderId` nel rendering del componente callout in `app.component.html`.
  - Prima: render solo con `g.senderId && !g.isOpenNewMessage`
  - Dopo: render con `!g.isOpenNewMessage`

- **Step 2**: scheduling del callout al caricamento delle impostazioni widget in `AppComponent`.
  - Aggiunto `scheduleCalloutFromSettings()` basato su `g.calloutTimer`.
  - Invocato subito dopo la disponibilita' delle settings (non legato al login).
  - Aggiunta la pulizia del timeout in `ngOnDestroy()`.

- **Step 3**: introdotte precedenze UI e rimossa la duplicazione dello scheduling callout.
  - Aggiunta guardia `canShowCalloutNow()` in `AppComponent`:
    - widget chiuso
    - nessuna preview nuovo messaggio attiva
    - stato callout abilitato
    - callout presente nella configurazione widget
  - Aggiornato `showCallout()` per aprire il callout solo quando le guardie passano e il componente esiste.
  - Rimosso il timer interno (`openIfCallOutTimer`) da `EyeeyeCatcherCardComponent` per evitare doppi trigger.

## Comportamento atteso dopo questo branch

- Il callout puo' essere innescato da configurazione anche senza sign-in.
- Il callout non compare quando il widget e' aperto o quando la preview nuovo messaggio e' attiva.
- La UI della conversazione indica chiaramente se l'ultimo responder e' bot o umano.
- "Sto pensando..." compare solo nelle conversazioni bot e ha un comportamento prevedibile.
