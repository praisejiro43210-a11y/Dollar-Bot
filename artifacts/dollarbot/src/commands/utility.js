const fetch = require('node-fetch');
const QRCode = require('qrcode');
const pollinations = require('../lib/pollinations');

const utilityCommands = {
  async calculate(sock, msg, args) {
    const jid = msg.key.remoteJid;
    if (!args.length) return sock.sendMessage(jid, { text: 'Usage: .calculate <expression>\nExample: .calculate 25 * 4 + 10' });
    try {
      const expr = args.join(' ').replace(/[^0-9+\-*/.()%\s]/g, '');
      if (!expr.trim()) throw new Error('Invalid expression — only numbers and operators allowed');
      // eslint-disable-next-line no-new-func
      const result = Function('"use strict"; return (' + expr + ')')();
      if (!isFinite(result)) throw new Error('Result is infinite or not a number');
      await sock.sendMessage(jid, {
        text: `*Calculator*\n\n${args.join(' ')} = *${result}*`,
      });
    } catch (e) {
      await sock.sendMessage(jid, { text: `Calculation Error: ${e.message}` });
    }
  },

  async genpass(sock, msg, args) {
    const jid = msg.key.remoteJid;
    const len = Math.min(Math.max(parseInt(args[0]) || 16, 4), 64);
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.?';
    let pw = '';
    for (let i = 0; i < len; i++) pw += chars[Math.floor(Math.random() * chars.length)];
    await sock.sendMessage(jid, {
      text: `*Generated Password*\n\n\`\`\`${pw}\`\`\`\n\nLength: ${len} characters\n_Store it somewhere safe!_`,
    });
  },

  async encode(sock, msg, args) {
    const jid = msg.key.remoteJid;
    if (!args.length) return sock.sendMessage(jid, { text: 'Usage: .encode <text>' });
    const text = args.join(' ');
    const encoded = Buffer.from(text, 'utf8').toString('base64');
    await sock.sendMessage(jid, {
      text: `*Base64 Encode*\n\nOriginal: ${text}\n\nEncoded:\n\`\`\`${encoded}\`\`\``,
    });
  },

  async decode(sock, msg, args) {
    const jid = msg.key.remoteJid;
    if (!args.length) return sock.sendMessage(jid, { text: 'Usage: .decode <base64>' });
    try {
      const raw = args.join(' ').replace(/\s/g, '');
      const decoded = Buffer.from(raw, 'base64').toString('utf8');
      await sock.sendMessage(jid, {
        text: `*Base64 Decode*\n\nInput: \`\`\`${raw.slice(0, 60)}...\`\`\`\n\nDecoded: ${decoded}`,
      });
    } catch {
      await sock.sendMessage(jid, { text: 'Invalid base64 string.' });
    }
  },

  async qr(sock, msg, args) {
    const jid = msg.key.remoteJid;
    if (!args.length) return sock.sendMessage(jid, { text: 'Usage: .qr <text or URL>' });
    const text = args.join(' ');
    await sock.sendMessage(jid, { text: 'Generating QR code...' });
    try {
      const buf = await QRCode.toBuffer(text, { type: 'png', width: 512, margin: 2 });
      await sock.sendMessage(jid, {
        image: buf,
        caption: `*QR Code*\nContent: ${text}`,
      });
    } catch (e) {
      await sock.sendMessage(jid, { text: `QR Error: ${e.message}` });
    }
  },

  async tinyurl(sock, msg, args) {
    const jid = msg.key.remoteJid;
    if (!args[0]) return sock.sendMessage(jid, { text: 'Usage: .tinyurl <URL>' });
    await sock.sendMessage(jid, { text: 'Shortening URL...' });
    try {
      const res = await fetch(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(args[0])}`, { timeout: 12000 });
      if (!res.ok) throw new Error('TinyURL service error');
      const short = await res.text();
      if (!short.startsWith('http')) throw new Error('Invalid response from TinyURL');
      await sock.sendMessage(jid, {
        text: `*URL Shortened!*\n\nOriginal: ${args[0]}\nShort: ${short}`,
      });
    } catch (e) {
      await sock.sendMessage(jid, { text: `TinyURL Error: ${e.message}` });
    }
  },

  async pingweb(sock, msg, args) {
    const jid = msg.key.remoteJid;
    if (!args[0]) return sock.sendMessage(jid, { text: 'Usage: .pingweb <URL>\nExample: .pingweb google.com' });
    let url = args[0];
    if (!url.startsWith('http')) url = 'https://' + url;
    await sock.sendMessage(jid, { text: `Pinging ${url}...` });
    const start = Date.now();
    try {
      const res = await fetch(url, { method: 'HEAD', timeout: 12000 });
      const ms = Date.now() - start;
      await sock.sendMessage(jid, {
        text:
          `🌐 *Ping Result*\n\n` +
          `🔗 URL: ${url}\n` +
          `✅ Status: ${res.status} ${res.statusText || 'OK'}\n` +
          `⚡ Speed: ${ms}ms\n` +
          `📶 Online: ${res.status < 400 ? 'Yes ✅' : 'Issue ⚠️'}`,
      });
    } catch (e) {
      const ms = Date.now() - start;
      await sock.sendMessage(jid, {
        text: `🌐 *Ping Result*\n\n🔗 ${url}\n❌ Unreachable (${ms}ms)\n📶 Offline ❌`,
      });
    }
  },

  async tts(sock, msg, args) {
    const jid = msg.key.remoteJid;
    if (!args.length) {
      return sock.sendMessage(jid, {
        text:
          `╭━━━〔 🔊 TEXT TO SPEECH 〕━━━⬣\n` +
          `┃ Usage: .tts <text>\n` +
          `┃\n` +
          `┃ Converts your text to a voice\n` +
          `┃ message using Pollinations AI.\n` +
          `╰━━━━━━━━━━━━━━━━━━⬣\n\n` +
          `Example: .tts Hello, I am DollarBot V5!`,
      });
    }
    const text = args.join(' ');
    if (text.length > 500) {
      return sock.sendMessage(jid, { text: '❌ Text too long. Maximum 500 characters for TTS.' });
    }
    await sock.sendMessage(jid, { text: '🔊 *Generating voice message...*' });
    try {
      const { buffer, mime } = await pollinations.tts(text);
      await sock.sendMessage(jid, {
        audio: buffer,
        mimetype: mime,
        ptt: true, // Send as voice note
      });
    } catch (e) {
      await sock.sendMessage(jid, { text: `TTS Error: ${e.message}` });
    }
  },
};

module.exports = utilityCommands;
