const axios = require('axios');
const crypto = require('crypto');

const toolsCommands = {
  // ── Hash Generator ──────────────────────────────────────────────────────
  async hash(sock, msg, args) {
    const jid = msg.key.remoteJid;
    if (!args.length) return sock.sendMessage(jid, { text: '❌ Usage: .hash <text>\nFormats: MD5, SHA1, SHA256' });
    const text = args.join(' ');
    const md5 = crypto.createHash('md5').update(text).digest('hex');
    const sha1 = crypto.createHash('sha1').update(text).digest('hex');
    const sha256 = crypto.createHash('sha256').update(text).digest('hex');
    await sock.sendMessage(jid, {
      text: `*🔐 Hash Results*\n\n📝 Text: ${text}\n\n*MD5:* \`${md5}\`\n*SHA1:* \`${sha1}\`\n*SHA256:* \`${sha256}\``
    });
  },

  // ── UUID Generator ──────────────────────────────────────────────────────
  async uuid(sock, msg) {
    const jid = msg.key.remoteJid;
    const { v4 } = require('uuid');
    const id = v4();
    await sock.sendMessage(jid, { text: `*🆔 UUID Generated*\n\`${id}\`` });
  },

  // ── JSON Formatter ──────────────────────────────────────────────────────
  async jsonformat(sock, msg, args) {
    const jid = msg.key.remoteJid;
    if (!args.length) return sock.sendMessage(jid, { text: '❌ Usage: .jsonformat <json>' });
    try {
      const json = JSON.parse(args.join(' '));
      const formatted = JSON.stringify(json, null, 2);
      await sock.sendMessage(jid, { text: `\`\`\`json\n${formatted}\`\`\`` });
    } catch (e) {
      await sock.sendMessage(jid, { text: `❌ Invalid JSON: ${e.message}` });
    }
  },

  // ── Text Statistics ──────────────────────────────────────────────────────
  async textstats(sock, msg, args) {
    const jid = msg.key.remoteJid;
    if (!args.length) return sock.sendMessage(jid, { text: '❌ Usage: .textstats <text>' });
    const text = args.join(' ');
    const stats = {
      characters: text.length,
      charactersNoSpace: text.replace(/\s/g, '').length,
      words: text.split(/\s+/).filter(w => w.length > 0).length,
      lines: text.split('\n').length,
      sentences: (text.match(/[.!?]/g) || []).length,
      paragraphs: text.split('\n\n').length,
      vowels: (text.match(/[aeiouAEIOU]/g) || []).length,
      consonants: (text.match(/[bcdfghjklmnpqrstvwxyzBCDFGHJKLMNPQRSTVWXYZ]/g) || []).length,
    };
    await sock.sendMessage(jid, {
      text: `*📊 Text Statistics*\n\n` +
            `📝 Characters: ${stats.characters}\n` +
            `🔤 Chars (no space): ${stats.charactersNoSpace}\n` +
            `📄 Words: ${stats.words}\n` +
            `📋 Sentences: ${stats.sentences}\n` +
            `🔊 Vowels: ${stats.vowels}\n` +
            `🔤 Consonants: ${stats.consonants}\n` +
            `📄 Lines: ${stats.lines}\n` +
            `📚 Paragraphs: ${stats.paragraphs}`
    });
  },

  // ── DNS Lookup ──────────────────────────────────────────────────────────
  async dns(sock, msg, args) {
    const jid = msg.key.remoteJid;
    if (!args.length) return sock.sendMessage(jid, { text: '❌ Usage: .dns <domain>' });
    try {
      const dns = require('dns').promises;
      const domain = args[0];
      const records = await dns.resolve4(domain);
      await sock.sendMessage(jid, {
        text: `*🌐 DNS Records for ${domain}*\n\n${records.map((ip, i) => `${i + 1}. ${ip}`).join('\n')}`
      });
    } catch (e) {
      await sock.sendMessage(jid, { text: `❌ DNS Error: ${e.message}` });
    }
  },

  // ── Color Generator ──────────────────────────────────────────────────────
  async color(sock, msg, args) {
    const jid = msg.key.remoteJid;
    const generateColorPalette = () => {
      const colors = [];
      for (let i = 0; i < 5; i++) {
        const hex = '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
        const rgb = hex.match(/\w\w/g).map(x => parseInt(x, 16)).join(', ');
        colors.push(`${hex} (RGB: ${rgb})`);
      }
      return colors;
    };
    const palette = generateColorPalette();
    await sock.sendMessage(jid, {
      text: `*🎨 Color Palette*\n\n${palette.map((c, i) => `${i + 1}. ${c}`).join('\n')}`
    });
  },

  // ── Random Country Info ──────────────────────────────────────────────────
  async country(sock, msg, args) {
    const jid = msg.key.remoteJid;
    try {
      let country;
      if (args.length) {
        const res = await axios.get(`https://restcountries.com/v3.1/name/${args.join(' ')}`);
        country = res.data[0];
      } else {
        const res = await axios.get(`https://restcountries.com/v3.1/all`);
        country = res.data[Math.floor(Math.random() * res.data.length)];
      }
      const name = country.name.common;
      const capital = country.capital?.[0] || 'N/A';
      const region = country.region;
      const population = country.population.toLocaleString();
      const flag = country.flag;
      const area = country.area.toLocaleString();
      await sock.sendMessage(jid, {
        text: `*${flag} Country Info: ${name}*\n\n` +
              `🏛️ Capital: ${capital}\n` +
              `🌍 Region: ${region}\n` +
              `👥 Population: ${population}\n` +
              `📐 Area: ${area} km²`
      });
    } catch (e) {
      await sock.sendMessage(jid, { text: `❌ Country Error: ${e.message}` });
    }
  },

  // ── Age Guesser (Agify) ──────────────────────────────────────────────────
  async ageguess(sock, msg, args) {
    const jid = msg.key.remoteJid;
    if (!args.length) return sock.sendMessage(jid, { text: '❌ Usage: .ageguess <name>' });
    try {
      const res = await axios.get(`https://api.agify.io?name=${args[0]}`);
      const age = res.data.age || 'N/A';
      const count = res.data.count;
      await sock.sendMessage(jid, {
        text: `*👤 Age Prediction for "${args[0]}"*\n\n` +
              `📊 Estimated Age: ${age}\n` +
              `🔍 Data Points: ${count}`
      });
    } catch (e) {
      await sock.sendMessage(jid, { text: `❌ Error: ${e.message}` });
    }
  },

  // ── Gender Predictor (Genderize) ─────────────────────────────────────────
  async genderpredict(sock, msg, args) {
    const jid = msg.key.remoteJid;
    if (!args.length) return sock.sendMessage(jid, { text: '❌ Usage: .genderpredict <name>' });
    try {
      const res = await axios.get(`https://api.genderize.io?name=${args[0]}`);
      const gender = res.data.gender || 'Unknown';
      const probability = (res.data.probability * 100).toFixed(2);
      const count = res.data.count;
      await sock.sendMessage(jid, {
        text: `*👥 Gender Prediction for "${args[0]}"*\n\n` +
              `⚖️ Gender: ${gender === 'male' ? '👨 Male' : '👩 Female'}\n` +
              `📊 Probability: ${probability}%\n` +
              `🔍 Data Points: ${count}`
      });
    } catch (e) {
      await sock.sendMessage(jid, { text: `❌ Error: ${e.message}` });
    }
  },

  // ── Nickname Generator ──────────────────────────────────────────────────
  async nickname(sock, msg, args) {
    const jid = msg.key.remoteJid;
    if (!args.length) return sock.sendMessage(jid, { text: '❌ Usage: .nickname <name>' });
    const names = ['Mighty', 'Cyber', 'Shadow', 'Blaze', 'Thunder', 'Phoenix', 'Titan', 'Ninja', 'Viper', 'Silent', 'Ghost', 'Storm'];
    const name = args.join(' ');
    const nicknames = [
      `${names[Math.floor(Math.random() * names.length)]} ${name}`,
      `${name} The ${names[Math.floor(Math.random() * names.length)]}`,
      `${name.charAt(0).toUpperCase()}${Math.random().toString(36).substring(7)}`,
    ];
    await sock.sendMessage(jid, {
      text: `*🎭 Nicknames for ${name}*\n\n${nicknames.map((n, i) => `${i + 1}. ${n}`).join('\n')}`
    });
  },

  // ── Random Animal Fact ──────────────────────────────────────────────────
  async animalfact(sock, msg) {
    const jid = msg.key.remoteJid;
    try {
      const res = await axios.get('https://api.api-ninjas.com/v1/facts?category=animal', {
        headers: { 'X-Api-Key': 'free' }
      });
      const fact = res.data.length > 0 ? res.data[0].fact : 'Animals are amazing!';
      await sock.sendMessage(jid, { text: `*🦁 Animal Fact*\n\n${fact}` });
    } catch (e) {
      await sock.sendMessage(jid, { text: `*🦁 Random Animal Fact*\n\n🐺 Wolves can hear sounds up to 10 km away!` });
    }
  },

  // ── Password Strength Checker ──────────────────────────────────────────
  async passcheck(sock, msg, args) {
    const jid = msg.key.remoteJid;
    if (!args.length) return sock.sendMessage(jid, { text: '❌ Usage: .passcheck <password>' });
    const pass = args.join('');
    let strength = 0;
    let feedback = [];
    if (pass.length >= 8) { strength += 20; } else { feedback.push('⚠️ At least 8 characters'); }
    if (pass.length >= 12) { strength += 10; }
    if (/[a-z]/.test(pass)) { strength += 20; } else { feedback.push('⚠️ Add lowercase letters'); }
    if (/[A-Z]/.test(pass)) { strength += 20; } else { feedback.push('⚠️ Add uppercase letters'); }
    if (/[0-9]/.test(pass)) { strength += 15; } else { feedback.push('⚠️ Add numbers'); }
    if (/[^A-Za-z0-9]/.test(pass)) { strength += 15; } else { feedback.push('⚠️ Add special chars'); }
    
    const level = strength >= 90 ? '🟢 Very Strong' : strength >= 70 ? '🟡 Strong' : strength >= 50 ? '🟠 Medium' : '🔴 Weak';
    await sock.sendMessage(jid, {
      text: `*🔐 Password Strength*\n\n${level}\nStrength: ${strength}%\n\n${feedback.length ? feedback.join('\n') : '✅ Excellent password!'}`
    });
  },
};

module.exports = toolsCommands;
