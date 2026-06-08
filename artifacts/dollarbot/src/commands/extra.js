const fetch = require('node-fetch');
const pollinations = require('../lib/pollinations');

// ── Reminder store (in-memory) ────────────────────────────────────────────
const reminders = {};

// ── Riddle store ──────────────────────────────────────────────────────────
const riddleState = {};

const extraCommands = {
  // ── .lyrics <song> ────────────────────────────────────────────────────
  async lyrics(sock, msg, args) {
    if (!args.length) return msg.reply('Usage: .lyrics <song name>\nExample: .lyrics Bohemian Rhapsody');
    await msg.reply(`_Searching lyrics for:_ "${args.join(' ')}"...`);
    try {
      const response = await pollinations.textGenerate([
        { role: 'system', content: 'You are a lyrics assistant. Provide the song lyrics if you know them, or the most well-known verse/chorus. Format with song title in *bold*, then lyrics line by line. If you cannot provide full lyrics, give the chorus and mention where to find full lyrics. WhatsApp formatting only.' },
        { role: 'user', content: `Lyrics for: ${args.join(' ')}` },
      ]);
      await msg.reply(`${response}\n\n_Powered by DollarBot_`);
    } catch (e) {
      await msg.reply(`Lyrics Error: ${e.message}`);
    }
  },

  // ── .recipe <dish> ────────────────────────────────────────────────────
  async recipe(sock, msg, args) {
    if (!args.length) return msg.reply('Usage: .recipe <dish name>\nExample: .recipe jollof rice');
    await msg.reply(`_Finding recipe for:_ "${args.join(' ')}"...`);
    try {
      const response = await pollinations.textGenerate([
        { role: 'system', content: 'You are a professional chef. Give a clear recipe with ingredients and steps. Format: *Dish Name* on first line, then *Ingredients:* as a bullet list (- item), then *Steps:* as numbered list. Keep it concise. WhatsApp formatting only — no tables, no HTML.' },
        { role: 'user', content: `Give me the recipe for: ${args.join(' ')}` },
      ]);
      await msg.reply(`${response}\n\n_Powered by DollarBot_`);
    } catch (e) {
      await msg.reply(`Recipe Error: ${e.message}`);
    }
  },

  // ── .horoscope <sign> ─────────────────────────────────────────────────
  async horoscope(sock, msg, args) {
    const jid = msg.key.remoteJid;
    const signs = ['aries','taurus','gemini','cancer','leo','virgo','libra','scorpio','sagittarius','capricorn','aquarius','pisces'];
    if (!args.length || !signs.includes(args[0].toLowerCase())) {
      return sock.sendMessage(jid, {
        text: `Usage: .horoscope <sign>\nSigns: ${signs.join(', ')}\nExample: .horoscope leo`,
      });
    }
    const sign = args[0].toLowerCase();
    await sock.sendMessage(jid, { text: `_Reading horoscope for ${sign}..._` });
    try {
      const response = await pollinations.textGenerate([
        { role: 'system', content: 'You are an astrologer. Give a fun and positive daily horoscope reading (3-4 sentences). Include *Love*, *Career*, and *Luck* ratings out of 10. WhatsApp formatting only — use *bold* for section labels.' },
        { role: 'user', content: `Daily horoscope for ${sign}` },
      ]);
      await sock.sendMessage(jid, { text: `*${sign.charAt(0).toUpperCase() + sign.slice(1)} Horoscope*\n\n${response}` });
    } catch (e) {
      await msg.reply(`Horoscope Error: ${e.message}`);
    }
  },

  // ── .rizz ─────────────────────────────────────────────────────────────
  async rizz(sock, msg, args) {
    await msg.reply('_Generating rizz..._');
    try {
      const target = args.join(' ') || 'someone special';
      const response = await pollinations.textGenerate([
        { role: 'system', content: 'You generate smooth, charming, creative pickup lines and compliments. Keep it fun and non-offensive. 1-2 sentences max. WhatsApp formatting — use *bold* for punchlines.' },
        { role: 'user', content: `Create a smooth pickup line for: ${target}` },
      ]);
      await msg.reply(`*Rizz Level: 100*\n\n${response}`);
    } catch (e) {
      await msg.reply(`Error: ${e.message}`);
    }
  },

  // ── .roastme ─────────────────────────────────────────────────────────
  async roastme(sock, msg, args) {
    const name = msg.pushName || args.join(' ') || 'You';
    await msg.reply('_Warming up the roaster..._');
    try {
      const response = await pollinations.textGenerate([
        { role: 'system', content: 'You are a savage comedian. Write a brutal, funny, personalized roast in 2-3 sentences. Use *bold* for punchlines. No offensive slurs — keep it funny, not mean. WhatsApp formatting only.' },
        { role: 'user', content: `Roast this person savagely: "${name}"` },
      ]);
      await msg.reply(`*Roasting ${name}*\n\n${response}`);
    } catch (e) {
      await msg.reply(`Error: ${e.message}`);
    }
  },

  // ── .news ─────────────────────────────────────────────────────────────
  async news(sock, msg, args) {
    const jid = msg.key.remoteJid;
    const topic = args.join(' ') || 'world news';
    await sock.sendMessage(jid, { text: `_Fetching news on:_ "${topic}"...` });
    try {
      // Try GNews free API
      let newsText = '';
      try {
        const res = await fetch(
          `https://gnews.io/api/v4/search?q=${encodeURIComponent(topic)}&max=4&lang=en&token=demo`,
          { timeout: 8000 }
        );
        if (res.ok) {
          const data = await res.json();
          if (data.articles?.length) {
            newsText = data.articles.slice(0, 4).map((a, i) =>
              `*${i + 1}. ${a.title}*\n${a.description || ''}`
            ).join('\n\n');
          }
        }
      } catch (_) {}

      // Fallback to AI-generated news summary
      if (!newsText) {
        newsText = await pollinations.textGenerate([
          { role: 'system', content: 'You are a news reporter. Summarize recent notable events for the given topic. Give 4 headline-style news items with 1-sentence descriptions. Use numbered list format. *Bold* for headline. WhatsApp formatting only.' },
          { role: 'user', content: `Latest news about: ${topic}` },
        ]);
      }

      await sock.sendMessage(jid, {
        text: `*News: ${topic}*\n\n${newsText}\n\n_Powered by DollarBot_`,
      });
    } catch (e) {
      await sock.sendMessage(jid, { text: `News Error: ${e.message}` });
    }
  },

  // ── .riddle ───────────────────────────────────────────────────────────
  async riddle(sock, msg, args) {
    const jid = msg.key.remoteJid;
    if (riddleState[jid]) {
      return sock.sendMessage(jid, {
        text: `A riddle is already active!\n\n_${riddleState[jid].question}_\n\nReply with your answer!`,
      });
    }
    await sock.sendMessage(jid, { text: '_Thinking of a riddle..._' });
    try {
      const raw = await pollinations.textGenerate([
        { role: 'system', content: 'Create a fun riddle. Output ONLY in this format (no extra text):\nQUESTION: [riddle question]\nANSWER: [answer]' },
        { role: 'user', content: 'Give me a riddle' },
      ]);
      const qMatch = raw.match(/QUESTION:\s*(.+)/i);
      const aMatch = raw.match(/ANSWER:\s*(.+)/i);
      if (!qMatch || !aMatch) throw new Error('Could not parse riddle');
      const question = qMatch[1].trim();
      const answer = aMatch[1].trim().toLowerCase();

      riddleState[jid] = { question, answer };
      setTimeout(() => {
        if (riddleState[jid]) {
          const ans = riddleState[jid].answer;
          delete riddleState[jid];
          sock.sendMessage(jid, { text: `Time's up! The answer was: *${ans}*` }).catch(() => {});
        }
      }, 30000);

      await sock.sendMessage(jid, {
        text: `*Riddle Time!*\n\n_${question}_\n\nYou have 30 seconds! Reply with your answer.`,
      });
    } catch (e) {
      await sock.sendMessage(jid, { text: `Riddle Error: ${e.message}` });
    }
  },

  // Check riddle answers (called from handler non-command path)
  checkRiddle(jid, text) {
    if (!riddleState[jid]) return false;
    const userAnswer = text.toLowerCase().trim();
    const correct = riddleState[jid].answer;
    if (userAnswer.includes(correct) || correct.includes(userAnswer)) {
      const q = riddleState[jid].question;
      delete riddleState[jid];
      return { correct: true, answer: correct, question: q };
    }
    return { correct: false };
  },

  // ── .ipinfo <ip> ──────────────────────────────────────────────────────
  async ipinfo(sock, msg, args) {
    const jid = msg.key.remoteJid;
    if (!args[0]) return sock.sendMessage(jid, { text: 'Usage: .ipinfo <ip address>\nExample: .ipinfo 8.8.8.8' });
    const ip = args[0].trim();
    await sock.sendMessage(jid, { text: `_Looking up IP:_ ${ip}...` });
    try {
      const res = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,regionName,city,isp,org,lat,lon,timezone,query`, { timeout: 10000 });
      if (!res.ok) throw new Error('IP lookup failed');
      const d = await res.json();
      if (d.status !== 'success') throw new Error('Invalid IP address');
      await sock.sendMessage(jid, {
        text:
          `*IP Info: ${d.query}*\n\n` +
          `- Country: ${d.country}\n` +
          `- Region: ${d.regionName}\n` +
          `- City: ${d.city}\n` +
          `- ISP: ${d.isp}\n` +
          `- Org: ${d.org}\n` +
          `- Timezone: ${d.timezone}\n` +
          `- Coords: ${d.lat}, ${d.lon}`,
      });
    } catch (e) {
      await sock.sendMessage(jid, { text: `IP Error: ${e.message}` });
    }
  },

  // ── .remind <seconds> <message> ───────────────────────────────────────
  async remind(sock, msg, args) {
    if (args.length < 2 || isNaN(args[0])) {
      return msg.reply('Usage: .remind <seconds> <message>\nExample: .remind 30 Take your medicine');
    }
    const secs = Math.min(parseInt(args[0]), 3600); // max 1 hour
    const reminder = args.slice(1).join(' ');
    await msg.reply(`Reminder set for *${secs} seconds*.\n_"${reminder}"_`);
    setTimeout(async () => {
      try {
        await sock.sendMessage(msg.key.remoteJid, { text: `*REMINDER*\n\n${reminder}` });
      } catch (_) {}
    }, secs * 1000);
  },

  // ── .styletext <text> ─────────────────────────────────────────────────
  async styletext(sock, msg, args) {
    if (!args.length) return msg.reply('Usage: .styletext <text>\nExample: .styletext hello world');
    const text = args.join(' ');
    const bold = text.split('').map(c => {
      const code = c.charCodeAt(0);
      if (code >= 65 && code <= 90) return String.fromCodePoint(code + 120211);
      if (code >= 97 && code <= 122) return String.fromCodePoint(code + 120205);
      if (code >= 48 && code <= 57) return String.fromCodePoint(code + 120764);
      return c;
    }).join('');
    await msg.reply(`*Styled Text*\n\nOriginal: ${text}\nStyled: ${bold}`);
  },

  // ── .meme (AI-described meme) ─────────────────────────────────────────
  async meme(sock, msg, args) {
    await msg.reply('_Generating meme..._');
    try {
      const topic = args.join(' ') || 'random';
      const response = await pollinations.textGenerate([
        { role: 'system', content: 'You write funny internet meme-style text. Format as:\nTop text: [top caption]\nBottom text: [bottom caption]\nKeep it funny and relatable. 1-2 lines each.' },
        { role: 'user', content: `Create a meme about: ${topic}` },
      ]);
      await msg.reply(`*Meme*\n\n${response}`);
    } catch (e) {
      await msg.reply(`Meme Error: ${e.message}`);
    }
  },

  // ── .emoji <text> ─────────────────────────────────────────────────────
  async emoji(sock, msg, args) {
    if (!args.length) return msg.reply('Usage: .emoji <text>\nExample: .emoji I love music');
    try {
      const response = await pollinations.textGenerate([
        { role: 'system', content: 'Convert the given text into a fun, expressive emoji representation. Use emojis to tell the same story/meaning. Keep it recognizable but creative. Just output the emojis, no explanation.' },
        { role: 'user', content: `Convert to emojis: ${args.join(' ')}` },
      ]);
      await msg.reply(`*Emoji Version*\n\nOriginal: ${args.join(' ')}\nEmoji: ${response}`);
    } catch (e) {
      await msg.reply(`Error: ${e.message}`);
    }
  },

  // ── .insult <name> (playful only) ────────────────────────────────────
  async insult(sock, msg, args) {
    const target = args.join(' ') || 'the person reading this';
    await msg.reply('_Loading playful insult..._');
    try {
      const response = await pollinations.textGenerate([
        { role: 'system', content: 'You write silly, playful, non-offensive insults meant for friends joking around. Keep it funny and light — no slurs or real meanness. 1-2 sentences make it hardcore like a harsh roast.' },
        { role: 'user', content: `Playful insult for: ${target}` },
      ]);
      await msg.reply(`*Playful Insult*\n\n${response}`);
    } catch (e) {
      await msg.reply(`Error: ${e.message}`);
    }
  },

  // ── .quote ────────────────────────────────────────────────────────────
  async quote(sock, msg, args) {
    const topic = args.join(' ') || 'life';
    await msg.reply('_Finding a quote..._');
    try {
      const response = await pollinations.textGenerate([
        { role: 'system', content: 'You share famous inspirational quotes. Give the quote in _italic_ and *bold* the author name on a new line. Just the quote and author, nothing else.' },
        { role: 'user', content: `Give me a famous quote about: ${topic}` },
      ]);
      await msg.reply(response);
    } catch (e) {
      await msg.reply(`Error: ${e.message}`);
    }
  },
};

module.exports = extraCommands;
