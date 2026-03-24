# This branch: identificazione bot o umano

## Obiettivo

In questo branch e' stata introdotta una logica esplicita per capire, all'apertura della conversazione, se l'ultimo responder lato server e' un **bot** oppure un **umano**.

## Come viene fatta l'identificazione

- La valutazione parte dai messaggi gia' caricati in conversazione.
- Viene cercato l'**ultimo messaggio ricevuto dal server** (non inviato dal client corrente).
- Quel messaggio viene classificato con una funzione dedicata (`classifyMessageSenderKind`) che usa piu' segnali:
  - `attributes.flowAttributes.chatbot_id` (quando presente indica bot)
  - pattern del mittente (es. `senderId` con prefisso bot, quando applicabile)
  - informazioni del mittente (`sender_fullname` e metadati associati)

## Regola speciale per messaggi di sistema

Se l'ultimo messaggio utile e' di tipo `system`, viene fatto un controllo aggiuntivo:

- se in `attributes` e' presente un evento con `messagelabel.key = MEMBER_JOINED_GROUP`
- e rappresenta il passaggio della conversazione a un operatore

allora la conversazione viene forzata a **Umano** anche se altri indizi potrebbero suggerire bot.

## Risultato in UI

- In apertura conversazione viene mostrato un badge con stato:
  - `Bot`
  - `Umano`
- Questo stato viene ricalcolato al variare dei messaggi ricevuti.

## Effetto sui feedback utente

- Il messaggio temporaneo `"sto pensando..."` viene mostrato solo quando la conversazione risulta di tipo **Bot**.
- Alla ricezione della prima risposta dal server, `"sto pensando..."` viene nascosto **immediatamente**.
- Non e' previsto alcun tempo minimo di visualizzazione del messaggio.
