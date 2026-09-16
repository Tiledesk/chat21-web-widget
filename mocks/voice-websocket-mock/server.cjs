/**
 * Mock proxy voce WSS: salva l'audio in `temp/` e simula gli eventi del protocollo reale.
 *
 * Eventi JSON inviati al client (`msg.event`):
 *   session_started | listening | transcript | thinking | speaking | done | error
 * Frame binari: piccolo WAV silenzio (TTS simulato), dopo `speaking`.
 *
 * Uso: `npm run voice-mock`
 * Env: VOICE_MOCK_PORT, VOICE_MOCK_PATH, VOICE_MOCK_SILENCE_MS (debounce fine parlato, default 700),
 *      VOICE_MOCK_SEND_ERROR=1 (invia subito `error`)
 */
/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');
const http = require('http');
const { WebSocketServer } = require('ws');

const PORT = parseInt(process.env.VOICE_MOCK_PORT || '4587', 10);
const PATH = process.env.VOICE_MOCK_PATH || '/ws/voice';
const SILENCE_MS = parseInt(process.env.VOICE_MOCK_SILENCE_MS || '700', 10);
const SEND_ERROR = process.env.VOICE_MOCK_SEND_ERROR === '1' || process.env.VOICE_MOCK_SEND_ERROR === 'true';

const here = __dirname;
const outDir = path.join(here, 'temp');
const DEFAULT_TOKEN = 'mock-token-ok';
const DEFAULT_PROJECT = 'mock-project';

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

/** WAV PCM 16-bit mono, silenzio (decodificabile da Web Audio). */
function buildSilenceWav(durationSec = 0.2) {
  const sampleRate = 8000;
  const bitsPerSample = 16;
  const channels = 1;
  const blockAlign = (channels * bitsPerSample) / 8;
  const byteRate = sampleRate * blockAlign;
  const numSamples = Math.floor(sampleRate * durationSec);
  const dataSize = numSamples * blockAlign;
  const buffer = Buffer.alloc(44 + dataSize);
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(channels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(bitsPerSample, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);
  return buffer;
}

const TTS_MOCK_CHUNK = buildSilenceWav(0.25);

function sendJson(ws, obj) {
  if (ws.readyState !== 1) {
    return;
  }
  try {
    ws.send(JSON.stringify(obj));
  } catch (e) {
    console.error('[voice-mock] sendJson failed', e.message);
  }
}

const server = http.createServer((_req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end(
    'Tiledesk voice-websocket-mock. Events: session_started, listening, transcript, thinking, speaking, TTS binary, done, error.\n',
  );
});

const wss = new WebSocketServer({ noServer: true });

server.on('upgrade', (req, socket, head) => {
  const host = (req.headers.host || 'localhost').split(':')[0];
  const u = new URL(req.url, 'http://' + host);
  if (u.pathname !== PATH) {
    socket.destroy();
    return;
  }

  wss.handleUpgrade(req, socket, head, (ws) => {
    wss.emit('connection', ws, req, u);
  });
});

wss.on('connection', (ws, _req, urlObj) => {
  const q = urlObj.searchParams;
  const token = q.get('token') || DEFAULT_TOKEN;
  const projectId = q.get('projectId') || DEFAULT_PROJECT;
  const qRequestId = q.get('requestId') || '';
  const mime = q.get('mimeType') || 'application/octet-stream';
  const ext = mime.indexOf('webm') >= 0 ? 'webm' : 'bin';

  const convId =
    qRequestId && qRequestId !== 'new'
      ? qRequestId
      : `mock-req-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const safeTs = new Date().toISOString().replace(/[:.]/g, '-');
  const outFile = path.join(
    outDir,
    `voice-${safeTs}-p${String(projectId).replace(/[^a-zA-Z0-9._-]/g, '_')}-r${String(convId).replace(/[^a-zA-Z0-9._-]/g, '_')}.${ext}`,
  );
  const fileStream = fs.createWriteStream(outFile, { flags: 'a' });
  const tokenOk = String(token).length > 0;

  let chunkCount = 0;
  let silenceTimer = null;
  let finalPipelineStarted = false;

  function clearSilenceTimer() {
    if (silenceTimer) {
      clearTimeout(silenceTimer);
      silenceTimer = null;
    }
  }

  /** Dopo debounce senza nuovi chunk audio: chiude il turno come farebbe il proxy reale. */
  function runAfterUtteranceEnd() {
    if (finalPipelineStarted || ws.readyState !== 1) {
      return;
    }
    finalPipelineStarted = true;
    clearSilenceTimer();

    sendJson(ws, {
      event: 'transcript',
      text: '[mock] Trascrizione finale simulata.',
      isFinal: true,
    });

    setTimeout(() => {
      sendJson(ws, { event: 'thinking' });
    }, 150);

    setTimeout(() => {
      sendJson(ws, { event: 'speaking' });
      try {
        if (ws.readyState === 1) {
          ws.send(TTS_MOCK_CHUNK, { binary: true });
        }
      } catch (e) {
        console.error('[voice-mock] TTS binary send failed', e.message);
      }
    }, 450);

    setTimeout(() => {
      sendJson(ws, {
        event: 'done',
        url: 'https://example.com/mock-voice-session-complete',
      });
    }, 900);
  }

  function scheduleUtteranceEndCheck() {
    clearSilenceTimer();
    silenceTimer = setTimeout(runAfterUtteranceEnd, SILENCE_MS);
  }

  console.log('[voice-mock] client connected', {
    projectId,
    requestId: convId,
    mimeType: mime,
    outFile,
    token: tokenOk ? 'present' : 'missing',
  });

  if (!tokenOk) {
    sendJson(ws, { event: 'error', message: 'Missing or invalid token' });
    ws.close();
    return;
  }

  if (SEND_ERROR) {
    sendJson(ws, { event: 'error', message: 'VOICE_MOCK_SEND_ERROR is set' });
    setTimeout(() => ws.close(), 100);
    return;
  }

  sendJson(ws, { event: 'session_started', requestId: convId });

  setTimeout(() => {
    sendJson(ws, { event: 'listening' });
  }, 80);

  ws.on('message', (data, isBinary) => {
    if (isBinary || Buffer.isBuffer(data)) {
      const buf = Buffer.isBuffer(data) ? data : Buffer.from(data);
      fileStream.write(buf);
      chunkCount += 1;

      if (chunkCount === 1) {
        sendJson(ws, {
          event: 'transcript',
          text: '[mock] Utterance…',
          isFinal: false,
        });
      } else if (chunkCount === 4) {
        sendJson(ws, {
          event: 'transcript',
          text: '[mock] Utterance parziale aggiornata.',
          isFinal: false,
        });
      }

      finalPipelineStarted = false;
      scheduleUtteranceEndCheck();
      return;
    }

    const line = 'TEXT ' + (typeof data === 'string' ? data : data.toString()) + '\n';
    fileStream.write(Buffer.from(line, 'utf8'));
  });

  ws.on('close', () => {
    clearSilenceTimer();
    fileStream.end();
    const stat = fs.existsSync(outFile) ? fs.statSync(outFile) : null;
    console.log('[voice-mock] client closed, bytes on disk:', stat ? stat.size : 0, outFile);
  });

  ws.on('error', (e) => {
    console.error('[voice-mock] socket error', e);
    clearSilenceTimer();
    try {
      fileStream.end();
    } catch {
      // ignore
    }
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(
    '[voice-mock] listening on ws://127.0.0.1:' + PORT + PATH + ' — output dir: ' + outDir,
  );
  console.log('[voice-mock] silence debounce:', SILENCE_MS, 'ms (fire transcript→thinking→speaking→TTS wav→done)');
});
