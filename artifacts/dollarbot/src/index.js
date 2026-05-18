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

[AUTH_DIR, DATA_DIR].forEach(d => {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
});

const logger = pino({ level: 'silent' });

function ask(prompt) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => rl.question(prompt, ans => { rl.close(); resolve(ans.trim()); }));
}

function printBanner() {
  console.log('\n\x1b[33m╭━━━〔 💵 DOLLARBOT V5 〕━━━⬣\x1b[0m');
  console.log('\x1b[33m┃\x1b[0m ✦ Owner  : Dollar');
  console.log('\x1b[33m┃\x1b[0m ✦ Country: Canada 🇨🇦');
  console.log('\x1b[33m┃\x1b[0m ✦ Engine : Cortex AI');
  console.log('\x1b[33m┃\x1b[0m ✦ Version: 5.0.0');
  console.log('\x1b[33m╰━━━━━━━━━━━━━━━━━━⬣\x1b[0m');
  console.log('\x1b[36m«⚡ Powered By Cortex & Mera AI»\x1b[0m\n');
}

let reconnectDelay = 3000;

async function startBot(usePairingCode, phoneNumber) {
  printBanner();

  const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
  const { version } = await fetchLatestBaileysVersion();

  // Determine login method on very first start only
  const hasSession = fs.existsSync(path.join(AUTH_DIR, 'creds.json'));

  if (!hasSession && usePairingCode === undefined) {
    console.log('\x1b[36m╭━━━〔 🔐 LOGIN METHOD 〕━━━⬣\x1b[0m');
    console.log('\x1b[36m┃\x1b[0m 1. QR Code  — scan with WhatsApp');
    console.log('\x1b[36m┃\x1b[0m 2. Pairing Code — enter phone number');
    console.log('\x1b[36m╰━━━━━━━━━━━━━━━━━━⬣\x1b[0m\n');

    const choice = await ask('Choose method (1 = QR / 2 = Pairing Code): ');
    if (choice === '2') {
      usePairingCode = true;
      const raw = await ask('Enter your WhatsApp number with country code, digits only\n(e.g. Nigeria 2349037855461 / Canada 14378898269): ');
      phoneNumber = raw.replace(/\D/g, '');

      if (phoneNumber.length < 7) {
        console.log('\x1b[31m❌ Invalid number. Please restart and try again.\x1b[0m');
        process.exit(1);
      }

      console.log(`\n\x1b[33m📱 Will generate pairing code for +${phoneNumber}\x1b[0m`);
      console.log('\x1b[33m⏳ Starting connection... code will appear in a moment.\x1b[0m\n');
    } else {
      usePairingCode = false;
      console.log('\n\x1b[33m📷 QR Code will appear below — scan it fast!\x1b[0m\n');
    }
  } else if (hasSession) {
    console.log('\x1b[32m✅ Session found — reconnecting...\x1b[0m\n');
  }

  const sock = makeWASocket({
    version,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, logger),
    },
    logger,
    // Always false — we handle QR display or pairing ourselves
    printQRInTerminal: false,
    browser: ['DollarBot V5', 'Chrome', '120.0.0'],
    connectTimeoutMs: 60000,
    defaultQueryTimeoutMs: 60000,
    keepAliveIntervalMs: 30000,
    retryRequestDelayMs: 500,
    maxMsgRetryCount: 5,
    markOnlineOnConnect: true,
    syncFullHistory: false,
    shouldIgnoreJid: jid => isJidBroadcast(jid),
    getMessage: async () => ({ conversation: '' }),
  });

  // ── Pairing code: request it the moment WhatsApp sends a QR event ──
  // This is the correct timing — the QR event means the server is ready
  let pairingCodeDone = false;

  sock.ev.on('connection.update', async update => {
    const { connection, lastDisconnect, qr } = update;

    // When QR arrives AND we want pairing code → request code instead
    if (qr && usePairingCode && !pairingCodeDone && !hasSession && phoneNumber) {
      pairingCodeDone = true;
      try {
        const code = await sock.requestPairingCode(phoneNumber);
        const formatted = code?.match(/.{1,4}/g)?.join('-') || code;

        console.log('\x1b[32m╭━━━〔 🔑 YOUR PAIRING CODE 〕━━━⬣\x1b[0m');
        console.log(`\x1b[32m┃\x1b[0m`);
        console.log(`\x1b[32m┃\x1b[0m  Code   : \x1b[33;1m ${formatted} \x1b[0m`);
        console.log(`\x1b[32m┃\x1b[0m  Number : +${phoneNumber}`);
        console.log(`\x1b[32m┃\x1b[0m`);
        console.log('\x1b[32m┃\x1b[0m  Steps in WhatsApp:');
        console.log('\x1b[32m┃\x1b[0m  1. Open WhatsApp on your phone');
        console.log('\x1b[32m┃\x1b[0m  2. Tap ⋮ → Settings → Linked Devices');
        console.log('\x1b[32m┃\x1b[0m  3. Tap "Link a Device"');
        console.log('\x1b[32m┃\x1b[0m  4. Tap "Link with phone number instead"');
        console.log(`\x1b[32m┃\x1b[0m  5. Select your country code, enter number`);
        console.log(`\x1b[32m┃\x1b[0m     WITHOUT leading zero`);
        console.log(`\x1b[32m┃\x1b[0m  6. Enter code: \x1b[33;1m${formatted}\x1b[0m`);
        console.log(`\x1b[32m┃\x1b[0m`);
        console.log('\x1b[32m┃\x1b[0m  ⚠️  Code expires in ~3 minutes!');
        console.log('\x1b[32m╰━━━━━━━━━━━━━━━━━━⬣\x1b[0m\n');
      } catch (e) {
        console.error('\x1b[31m❌ Pairing code error:', e.message);
        console.log('💡 Tip: Try restarting and choosing QR Code instead.\x1b[0m');
      }
    }

    // Show QR if not using pairing code
    if (qr && !usePairingCode) {
      try {
        const qrcode = require('qrcode-terminal');
        qrcode.generate(qr, { small: true });
        console.log('\x1b[33m📷 Scan the QR code above with WhatsApp.\x1b[0m');
        console.log('\x1b[33m   WhatsApp → Settings → Linked Devices → Link a Device\x1b[0m\n');
      } catch (_) {
        console.log('\x1b[33mQR:', qr, '\x1b[0m');
      }
    }

    if (connection === 'open') {
      reconnectDelay = 3000;
      console.log('\x1b[32m╭━━━〔 ✅ CONNECTED 〕━━━⬣\x1b[0m');
      console.log('\x1b[32m┃\x1b[0m DollarBot V5 is Online!');
      console.log(`\x1b[32m┃\x1b[0m Engine  : ${config.engine}`);
      console.log(`\x1b[32m┃\x1b[0m Version : ${config.version}`);
      console.log('\x1b[32m╰━━━━━━━━━━━━━━━━━━⬣\x1b[0m\n');
      console.log('\x1b[33m💵 DollarBot V5 — Smart • Fast • Limitless\x1b[0m\n');

      try {
        await sock.sendMessage(config.ownerJid, {
          text:
            `╭━━━〔 💵 DOLLARBOT V5 ONLINE 〕━━━⬣\n` +
            `┃ ✦ Status  : Online ✅\n` +
            `┃ ✦ Engine  : ${config.engine}\n` +
            `┃ ✦ Version : ${config.version}\n` +
            `┃ ✦ AI Mem  : Active 🧠\n` +
            `┃ ✦ Search  : Ready 🔍\n` +
            `╰━━━━━━━━━━━━━━━━━━⬣\n\n` +
            `Type *.menu* to see all commands!\n` +
            `«💵 DollarBot V5 — Smart • Fast • Limitless»`,
        });
      } catch (_) {}
    }

    if (connection === 'close') {
      const statusCode = new Boom(lastDisconnect?.error)?.output?.statusCode;
      const loggedOut = statusCode === DisconnectReason.loggedOut;
      console.log(`\n\x1b[31m⚠️  Connection closed. Code: ${statusCode}\x1b[0m`);

      if (loggedOut) {
        console.log('\x1b[31m🚪 Logged out. Clearing session...\x1b[0m');
        try { fs.rmSync(AUTH_DIR, { recursive: true, force: true }); } catch (_) {}
        fs.mkdirSync(AUTH_DIR, { recursive: true });
        console.log('🔄 Restarting in 3 seconds...');
        setTimeout(() => startBot(undefined, undefined), 3000);
      } else {
        console.log(`\x1b[33m🔄 Reconnecting in ${reconnectDelay / 1000}s...\x1b[0m`);
        setTimeout(() => startBot(usePairingCode, phoneNumber), reconnectDelay);
        reconnectDelay = Math.min(reconnectDelay * 1.5, 30000);
      }
    }
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;
    for (const msg of messages) {
      if (msg.key.fromMe) continue;
      if (!msg.message) continue;
      await handleMessage(sock, msg);
    }
  });

  sock.ev.on('group-participants.update', async update => {
    await handleGroupParticipants(sock, update);
  });

  process.removeAllListeners('uncaughtException');
  process.removeAllListeners('unhandledRejection');

  process.on('uncaughtException', err => {
    if (!err.message?.includes('ECONNRESET') && !err.message?.includes('write EPIPE')) {
      console.error('[Uncaught Exception]', err.message);
    }
  });

  process.on('unhandledRejection', err => {
    const msg = err?.message || String(err);
    if (!msg.includes('ECONNRESET') && !msg.includes('timed out')) {
      console.error('[Unhandled Rejection]', msg);
    }
  });
}

startBot(undefined, undefined).catch(console.error);
