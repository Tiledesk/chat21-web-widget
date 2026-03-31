# Questo branch: UX bot/umano + disaccoppiamento callout

## Contesto

Questo branch migliora il feedback in conversazione e rende il comportamento del callout indipendente dal sign-in del widget.

## Modifiche incluse

- Aggiunto un **badge Bot/Umano** nella vista conversazione.
  - All'apertura della conversazione (e ad ogni nuovo messaggio) analizza i messaggi e determina il tipo conversazione.

## Come viene identificato Bot/Umano

La logica vive in `ConversationComponent` e in un modulo pure di supporto (`src/app/utils/conversation-sender-classifier.ts`).

### Regole (in ordine)

1) **Selezione del messaggio “server” più recente**
- Si considerano solo i messaggi **non inviati dal client corrente** (si scartano quelli con `sender === senderId`).
- L’“ultimo” messaggio server viene determinato in modo robusto usando `timestamp` (equivalente a ordinare per timestamp decrescente).

2) **Regola speciale: handoff a operatore (Umano)**
- Se l’ultimo messaggio server è `system` e rappresenta un handoff verso umano:
  - `attributes.subtype === "info"`
  - `attributes.updateconversation === true`
  - `attributes.messagelabel.key === "MEMBER_JOINED_GROUP"`
  - `attributes.messagelabel.parameters.member_id` **non** è `system`, **non** inizia con `bot_`, e **non** coincide con il `senderId` del client
- allora la conversazione viene forzata a **Umano**.

3) **Se l’ultimo messaggio server non è system**
- viene classificato come **Bot** se:
  - è presente `attributes.flowAttributes.chatbot_id` (segnale forte, anche se diverso da `sender`), oppure
  - euristiche legacy: `sender` contiene `bot_` oppure `sender_fullname` contiene “bot”
- altrimenti come **Umano**.

4) **Se l’ultimo messaggio server è system (ma non handoff umano)**
- si cerca il messaggio server **precedente non-system** e si applica la classificazione Bot/Umano su quello.

### Risultato in UI
- Il badge mostra **Bot** o **Umano** in base all’ultimo responder server **non-system**, con precedenza della regola handoff.

- Aggiunto il feedback temporaneo **"sto pensando..."** dopo l'invio del messaggio da parte del client.
  - Mostrato solo quando la conversazione e' classificata come **Bot**.
  - Nascosto alla prima risposta server (nessuna durata minima).

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

## Checklist regressioni (bot/umano)
- **Bot con `flowAttributes.chatbot_id` diverso da `sender`** (caso reale):
  - Atteso: classificazione **Bot** (non Human).
- **System → bot joined** (`MEMBER_JOINED_GROUP` con `member_id` che inizia per `bot_`):
  - Atteso: non forzare Umano (non è handoff verso operatore).
- **System → handoff umano** (`MEMBER_JOINED_GROUP` con `member_id` umano):
  - Atteso: forzare **Umano** anche se messaggi precedenti indicavano bot.
- **Conversazione con soli messaggi system** (dopo aver escluso quelli del client):
  - Atteso: nessun crash; badge Bot/Umano può essere nascosto, ma la classificazione dell’ultimo messaggio server deve restare coerente.
