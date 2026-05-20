const axios = require('axios');

const mediaCommands = {
  // ── Random Cat Image ────────────────────────────────────────────────────
  async randomcat(sock, msg) {
    const jid = msg.key.remoteJid;
    try {
      const res = await axios.get('https://api.thecatapi.com/v1/images/search');
      const imageUrl = res.data[0].url;
      const img = await axios.get(imageUrl, { responseType: 'arraybuffer' });
      await sock.sendMessage(jid, { image: Buffer.from(img.data), caption: '🐱 *Random Cat*' });
    } catch (e) {
      await sock.sendMessage(jid, { text: `❌ Cat Error: ${e.message}` });
    }
  },

  // ── Random Dog Image ────────────────────────────────────────────────────
  async randomdog(sock, msg) {
    const jid = msg.key.remoteJid;
    try {
      const res = await axios.get('https://dog.ceo/api/breeds/image/random');
      const imageUrl = res.data.message;
      const img = await axios.get(imageUrl, { responseType: 'arraybuffer' });
      await sock.sendMessage(jid, { image: Buffer.from(img.data), caption: '🐕 *Random Dog*' });
    } catch (e) {
      await sock.sendMessage(jid, { text: `❌ Dog Error: ${e.message}` });
    }
  },

  // ── ASCII Art Generator ─────────────────────────────────────────────────
  async asciiart(sock, msg, args) {
    const jid = msg.key.remoteJid;
    if (!args.length) return sock.sendMessage(jid, { text: '❌ Usage: .asciiart <text>' });
    try {
      const text = args.join(' ').substring(0, 20);
      const res = await axios.get(`https://artii.herokuapp.com/make?text=${encodeURIComponent(text)}`);
      await sock.sendMessage(jid, { text: `\`\`\`\n${res.data}\`\`\`` });
    } catch (e) {
      await sock.sendMessage(jid, { text: `❌ ASCII Error: ${e.message}` });
    }
  },

  // ── Meme Generator ──────────────────────────────────────────────────────
  async randommeme(sock, msg) {
    const jid = msg.key.remoteJid;
    try {
      const res = await axios.get('https://meme-api.herokuapp.com/gimme');
      const meme = res.data;
      const img = await axios.get(meme.url, { responseType: 'arraybuffer' });
      await sock.sendMessage(jid, { 
        image: Buffer.from(img.data), 
        caption: `🤣 *${meme.title}*\n\n${meme.subreddit}` 
      });
    } catch (e) {
      await sock.sendMessage(jid, { text: `❌ Meme Error: ${e.message}` });
    }
  },

  // ── Random Art (Generative) ────────────────────────────────────────────
  async abstractart(sock, msg) {
    const jid = msg.key.remoteJid;
    const seed = Math.floor(Math.random() * 1000000);
    const size = 400;
    const imageUrl = `https://picsum.photos/${size}/${size}?random=${seed}`;
    try {
      const img = await axios.get(imageUrl, { responseType: 'arraybuffer' });
      await sock.sendMessage(jid, { image: Buffer.from(img.data), caption: '🎨 *Random Art*' });
    } catch (e) {
      await sock.sendMessage(jid, { text: `❌ Art Error: ${e.message}` });
    }
  },

  // ── QR Code Generator ───────────────────────────────────────────────────
  async qrgen(sock, msg, args) {
    const jid = msg.key.remoteJid;
    if (!args.length) return sock.sendMessage(jid, { text: '❌ Usage: .qrgen <text/url>' });
    try {
      const text = args.join(' ');
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(text)}`;
      const img = await axios.get(qrUrl, { responseType: 'arraybuffer' });
      await sock.sendMessage(jid, { image: Buffer.from(img.data), caption: '📱 *QR Code Generated*' });
    } catch (e) {
      await sock.sendMessage(jid, { text: `❌ QR Error: ${e.message}` });
    }
  },

  // ── Unsplash Random Image ───────────────────────────────────────────────
  async unsplashrandom(sock, msg, args) {
    const jid = msg.key.remoteJid;
    const search = args.length ? args.join(' ') : 'nature';
    try {
      const imageUrl = `https://source.unsplash.com/600x400/?${search}`;
      const img = await axios.get(imageUrl, { responseType: 'arraybuffer' });
      await sock.sendMessage(jid, { 
        image: Buffer.from(img.data), 
        caption: `📸 *${search.toUpperCase()}*\n\nFrom Unsplash` 
      });
    } catch (e) {
      await sock.sendMessage(jid, { text: `❌ Unsplash Error: ${e.message}` });
    }
  },

  // ── Flag Generator ──────────────────────────────────────────────────────
  async flagimg(sock, msg, args) {
    const jid = msg.key.remoteJid;
    if (!args.length) return sock.sendMessage(jid, { text: '❌ Usage: .flagimg <country_code>' });
    const code = args[0].toUpperCase();
    if (!/^[A-Z]{2}$/.test(code)) return sock.sendMessage(jid, { text: '❌ Use 2-letter country code (e.g., US, GB, NG)' });
    try {
      const imageUrl = `https://flagcdn.com/w320/${code.toLowerCase()}.png`;
      const img = await axios.get(imageUrl, { responseType: 'arraybuffer' });
      await sock.sendMessage(jid, { image: Buffer.from(img.data), caption: `🚩 *${code} Flag*` });
    } catch (e) {
      await sock.sendMessage(jid, { text: `❌ Flag Error: ${e.message}` });
    }
  },

  // ── Avatar Generator ────────────────────────────────────────────────────
  async avatar(sock, msg, args) {
    const jid = msg.key.remoteJid;
    const name = args.length ? args.join(' ').substring(0, 20) : 'DollarBot';
    try {
      const imageUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff&size=256`;
      const img = await axios.get(imageUrl, { responseType: 'arraybuffer' });
      await sock.sendMessage(jid, { image: Buffer.from(img.data), caption: `👤 *Avatar: ${name}*` });
    } catch (e) {
      await sock.sendMessage(jid, { text: `❌ Avatar Error: ${e.message}` });
    }
  },

  // ── Placeholder Image ────────────────────────────────────────────────────
  async placeholder(sock, msg, args) {
    const jid = msg.key.remoteJid;
    const dimensions = args.length ? args[0] : '400x300';
    if (!/^\d+x\d+$/.test(dimensions)) return sock.sendMessage(jid, { text: '❌ Usage: .placeholder <WIDTHxHEIGHT>' });
    try {
      const imageUrl = `https://via.placeholder.com/${dimensions}`;
      const img = await axios.get(imageUrl, { responseType: 'arraybuffer' });
      await sock.sendMessage(jid, { image: Buffer.from(img.data), caption: `📦 *Placeholder ${dimensions}*` });
    } catch (e) {
      await sock.sendMessage(jid, { text: `❌ Placeholder Error: ${e.message}` });
    }
  },

  // ── Barcode Generator ────────────────────────────────────────────────────
  async barcode(sock, msg, args) {
    const jid = msg.key.remoteJid;
    if (!args.length) return sock.sendMessage(jid, { text: '❌ Usage: .barcode <code>' });
    const code = args.join('').substring(0, 50);
    try {
      const imageUrl = `https://bwipjs.metafloor.com/?bcid=code128&text=${encodeURIComponent(code)}&scale=2&includetext`;
      const img = await axios.get(imageUrl, { responseType: 'arraybuffer' });
      await sock.sendMessage(jid, { image: Buffer.from(img.data), caption: `📊 *Barcode: ${code}*` });
    } catch (e) {
      await sock.sendMessage(jid, { text: `❌ Barcode Error: ${e.message}` });
    }
  },

  // ── Bird Image ──────────────────────────────────────────────────────────
  async randombird(sock, msg) {
    const jid = msg.key.remoteJid;
    try {
      const res = await axios.get('https://api.api-ninjas.com/v1/facts?category=birds');
      const imageUrl = `https://source.unsplash.com/600x400/?bird`;
      const img = await axios.get(imageUrl, { responseType: 'arraybuffer' });
      await sock.sendMessage(jid, { image: Buffer.from(img.data), caption: '🦅 *Random Bird*' });
    } catch (e) {
      await sock.sendMessage(jid, { text: `❌ Bird Error: ${e.message}` });
    }
  },

  // ── Map Screenshot ──────────────────────────────────────────────────────
  async map(sock, msg, args) {
    const jid = msg.key.remoteJid;
    if (!args.length) return sock.sendMessage(jid, { text: '❌ Usage: .map <location>' });
    try {
      const location = args.join('+');
      const imageUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${location}&zoom=12&size=600x400&markers=color:red%7C${location}`;
      const img = await axios.get(imageUrl, { responseType: 'arraybuffer' });
      await sock.sendMessage(jid, { image: Buffer.from(img.data), caption: `🗺️ *Map: ${args.join(' ')}*` });
    } catch (e) {
      await sock.sendMessage(jid, { text: `❌ Map Error: ${e.message}` });
    }
  },

  // ── Gradient Generator ──────────────────────────────────────────────────
  async gradient(sock, msg, args) {
    const jid = msg.key.remoteJid;
    const color1 = args[0]?.replace('#', '') || 'ff0000';
    const color2 = args[1]?.replace('#', '') || '0000ff';
    try {
      const imageUrl = `https://via.placeholder.com/400x300/${color1}/${color2}?text=Gradient`;
      const img = await axios.get(imageUrl, { responseType: 'arraybuffer' });
      await sock.sendMessage(jid, { image: Buffer.from(img.data), caption: `🎨 *Gradient: #${color1} → #${color2}*` });
    } catch (e) {
      await sock.sendMessage(jid, { text: `❌ Gradient Error: ${e.message}` });
    }
  },
};

module.exports = mediaCommands;
