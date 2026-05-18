const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  isJidBroadcast,
} = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const readline = require('readline');
const path = require('path');
const fs = require('fs');
const pino = require('pino');

const { handleMessage, handleGroupParticipants } = require('./handler');
const config = require('./config');

const AUTH_DIR = path.join(__dirname, '../auth_info_baileys');
const DATA_DIR = path.join(__dirname, '../data');
[AUTH_DIR, DATA_DIR].forEach(d => { if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }); });

const logger = pino({ level: 'silent' });

function ask(prompt) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => rl.question(prompt, ans => { rl.close(); resolve(ans.trim()); }));
}

function banner() {
  console.log('\n\x1b[33m╔══════════════════════════════╗\x1b[0m');
  console.log('\x1b[33m║    💵  DOLLARBOT  V5  💵     ║\x1b[0m');
  console.log('\x1b[33m╠══════════════════════════════╣\x1b[0m');
  console.log('\x1b[33m║\x1b[0m  Owner  : Dollar              \x1b[33m║\x1b[0m');
  console.log('\x1b[33m║\x1b[0m  Country: Canada 🇨🇦           \x1b[33m║\x1b[0m');
  console.log('\x1b[33m║\x1b[0m  Engine : Cortex AI           \x1b[33m║\x1b[0m');
  console.log('\x1b[33m║\x1b[0m  Version: 5.0.0               \x1b[33m║\x1b[0m');
  console.log('\x1b[33m╚══════════════════════════════╝\x1b[0m\n');
}

let reconnectDelay = 3000;
let chosenMethod = undefined;
let chosenPhone = undefined;

async function startBot(method, phone) {
  banner();

  const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
  const { version } = await fetchLatestBaileysVersion();
  const hasSession = fs.existsSync(path.join(AUTH_DIR, 'creds.json'));

  let usePairing = method;
  let phoneNumber = phone;

  if (!hasSession && usePairing === undefined) {
    console.log('\x1b[36m┌─────────────────────────────┐\x1b[0m');
    console.log('\x1b[36m│      LOGIN METHOD           │\x1b[0m');
    console.log('\x1b[36m├─────────────────────────────┤\x1b[0m');
    console.log('\x1b[36m│\x1b[0m  1. QR Code (recommended)   \x1b[36m│\x1b[0m');
    console.log('\x1b[36m│\x1b[0m  2. Pairing Code            \x1b[36m│\x1b[0m');
    console.log('\x1b[36m└─────────────────────────────┘\x1b[0m\n');

    const choice = await ask('Enter 1 or 2: ');

    if (choice === '2') {
      usePairing = true;
      console.log('\n\x1b[33mEnter your WhatsApp number in FULL international format.\x1b[0m');
      console.log('\x1b[33mExamples:\x1b[0m');
      console.log('  Nigeria  → 2349037855461');
      console.log('  Canada   → 14378898269');
      console.log('  US       → 12025550100\n');
      const raw = await ask('Your number (digits only, NO + sign): ');
      phoneNumber = raw.replace(/\D/g, '');
      if (phoneNumber.length < 10) {
        console.log('\x1b[31m❌ Number too short. Restart and try again.\x1b[0m');
        process.exit(1);
      }
      chosenPhone = phoneNumber;
      chosenMethod = true;
      console.log(`\n\x1b[32m✅ Will request pairing code for +${phoneNumber}\x1b[0m`);
      console.log('\x1b[33m⏳ Connecting to WhatsApp servers...\x1b[0m\n');
    } else {
      usePairing = false;
      chosenMethod = false;
      console.log('\n\x1b[33m📷 QR code will appear below. You have 60 seconds to scan.\x1b[0m');
      console.log('\x1b[33m   WhatsApp → Settings → Linked Devices → Link a Device\x1b[0m\n');
    }
  } else if (hasSession) {
    usePairing = chosenMethod || false;
    phoneNumber = chosenPhone;
    console.log('\x1b[32m✅ Session found — reconnecting...\x1b[0m\n');
  }

  const sock = makeWASocket({
    version,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, logger),
    },
    logger,
    printQRInTerminal: !usePairing,
    browser: ['DollarBot V5', 'Chrome', '120.0.0'],
    connectTimeoutMs: 60000,
    defaultQueryTimeoutMs: 60000,
    keepAliveIntervalMs: 25000,
    retryRequestDelayMs: 250,
    maxMsgRetryCount: 5,
    markOnlineOnConnect: true,
    syncFullHistory: false,
    fireInitQueries: true,
    shouldIgnoreJid: jid => isJidBroadcast(jid),
    getMessage: async () => ({ conversation: '' }),
  });

  let pairingDone = false;

  sock.ev.on('connection.update', async update => {
    const { connection, lastDisconnect, qr } = update;

    // Request pairing code at the right moment (when QR is ready = server handshake done)
    if (qr && usePairing && !pairingDone && phoneNumber && !hasSession) {
      pairingDone = true;
      try {
        const code = await sock.requestPairingCode(phoneNumber);
        const fmt = code?.match(/.{1,4}/g)?.join('-') || code;

        console.log('\x1b[32m╔══════════════════════════════╗\x1b[0m');
        console.log('\x1b[32m║      🔑  PAIRING CODE        ║\x1b[0m');
        console.log('\x1b[32m╠══════════════════════════════╣\x1b[0m');
        console.log(`\x1b[32m║\x1b[0m  Code  : \x1b[33;1m${fmt}\x1b[0m         \x1b[32m║\x1b[0m`);
        console.log(`\x1b[32m║\x1b[0m  Number: +${phoneNumber}       \x1b[32m║\x1b[0m`);
        console.log('\x1b[32m╠══════════════════════════════╣\x1b[0m');
        console.log('\x1b[32m║\x1b[0m  HOW TO USE:                 \x1b[32m║\x1b[0m');
        console.log('\x1b[32m║\x1b[0m  1. Open WhatsApp            \x1b[32m║\x1b[0m');
        console.log('\x1b[32m║\x1b[0m  2. ⋮ → Settings →          \x1b[32m║\x1b[0m');
        console.log('\x1b[32m║\x1b[0m     Linked Devices           \x1b[32m║\x1b[0m');
        console.log('\x1b[32m║\x1b[0m  3. Link a Device            \x1b[32m║\x1b[0m');
        console.log('\x1b[32m║\x1b[0m  4. "Link with phone number" \x1b[32m║\x1b[0m');
        console.log('\x1b[32m║\x1b[0m  5. Enter YOUR number &      \x1b[32m║\x1b[0m');
        console.log(`\x1b[32m║\x1b[0m     then code: \x1b[33;1m${fmt}\x1b[0m \x1b[32m║\x1b[0m`);
        console.log('\x1b[32m║\x1b[0m  ⚠️  Expires in ~3 minutes   \x1b[32m║\x1b[0m');
        console.log('\x1b[32m╚══════════════════════════════╝\x1b[0m\n');
      } catch (e) {
        console.error('\x1b[31m❌ Pairing code error:', e.message, '\x1b[0m');
        console.log('\x1b[33m💡 Restart the bot and try QR code instead (option 1).\x1b[0m');
      }
    }

    if (connection === 'open') {
      reconnectDelay = 3000;
      console.log('\x1b[32m╔══════════════════════════════╗\x1b[0m');
      console.log('\x1b[32m║  ✅  DOLLARBOT ONLINE!       ║\x1b[0m');
      console.log('\x1b[32m╠══════════════════════════════╣\x1b[0m');
      console.log(`\x1b[32m║\x1b[0m  Engine : ${config.engine}          \x1b[32m║\x1b[0m`);
      console.log(`\x1b[32m║\x1b[0m  Version: ${config.version}              \x1b[32m║\x1b[0m`);
      console.log('\x1b[32m╚══════════════════════════════╝\x1b[0m\n');

      try {
        await sock.sendMessage(config.ownerJid, {
          text:
            `╭━━━〔 💵 DOLLARBOT V5 ONLINE 〕━━━⬣\n` +
            `┃ ✦ Status  : Online ✅\n` +
            `┃ ✦ Engine  : ${config.engine}\n` +
            `┃ ✦ Version : ${config.version}\n` +
            `┃ ✦ AI Mem  : Active 🧠\n` +
            `┃ ✦ Search  : Ready 🔍\n` +
            `┃ ✦ TTS     : Ready 🔊\n` +
            `╰━━━━━━━━━━━━━━━━━━⬣\n\n` +
            `Type *.menu* to see all commands!\n` +
            `«💵 DollarBot V5 — Smart • Fast • Limitless»`,
        });
      } catch (_) {}
    }

    if (connection === 'close') {
      const code = new Boom(lastDisconnect?.error)?.output?.statusCode;
      const loggedOut = code === DisconnectReason.loggedOut;
      console.log(`\x1b[31m⚠️  Connection closed. Code: ${code}\x1b[0m`);

      if (loggedOut) {
        console.log('\x1b[31m🚪 Logged out. Clearing session and restarting...\x1b[0m');
        try { fs.rmSync(AUTH_DIR, { recursive: true, force: true }); } catch (_) {}
        fs.mkdirSync(AUTH_DIR, { recursive: true });
        chosenMethod = undefined;
        chosenPhone = undefined;
        setTimeout(() => startBot(undefined, undefined), 2000);
      } else {
        console.log(`\x1b[33m🔄 Reconnecting in ${(reconnectDelay / 1000).toFixed(0)}s...\x1b[0m`);
        const delay = reconnectDelay;
        reconnectDelay = Math.min(reconnectDelay * 1.5, 30000);
        setTimeout(() => startBot(usePairing, phoneNumber), delay);
      }
    }
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;
    for (const m of messages) {
      if (m.key.fromMe) continue;
      if (!m.message) continue;
      await handleMessage(sock, m);
    }
  });

  sock.ev.on('group-participants.update', async update => {
    await handleGroupParticipants(sock, update);
  });

  // Clean error handlers
  process.removeAllListeners('uncaughtException');
  process.removeAllListeners('unhandledRejection');
  process.on('uncaughtException', err => {
    if (!/ECONNRESET|EPIPE|timed out/i.test(err.message)) console.error('[Exception]', err.message);
  });
  process.on('unhandledRejection', reason => {
    const m = reason?.message || String(reason);
    if (!/ECONNRESET|EPIPE|timed out/i.test(m)) console.error('[Rejection]', m);
  });
}

startBot(undefined, undefined).catch(console.error);
