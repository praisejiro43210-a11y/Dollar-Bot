const pollinations = require('../lib/pollinations');
const memory = require('../lib/memory');

const aiCommands = {
  async cortex(sock, msg, args, jid) {
    if (!args.length) {
      return sock.sendMessage(jid, {
        text:
          `╭━━━〔 🧠 CORTEX AI 〕━━━⬣\n` +
          `┃ Usage: .cortex <your question>\n` +
          `┃\n` +
          `┃ Expert-level AI with memory.\n` +
          `┃ Adapts personality to any topic.\n` +
          `┃ Ask anything — coding, science,\n` +
          `┃ philosophy, creative writing & more.\n` +
          `┃\n` +
          `┃ 💡 It remembers your conversation!\n` +
          `┃ Type .clear to reset memory.\n` +
          `╰━━━━━━━━━━━━━━━━━━⬣\n\n` +
          `Example: .cortex explain quantum entanglement`,
      });
    }
    await sock.sendMessage(jid, { text: '*Thinking...*' });
    try {
      const response = await pollinations.cortex(jid, args.join(' '));
      await sock.sendMessage(jid, {
        text: `╭━━━〔 CORTEX AI 〕━━━⬣\n\n${response}\n\n╰━━━━━━━━━━━━━━━━━━⬣\n\n⚡ Powered by Cortex AI`,
      });
    } catch (e) {
      await sock.sendMessage(jid, { text: `Cortex Error: ${e.message}` });
    }
  },

  async mera(sock, msg, args, jid) {
    if (!args.length) {
      return sock.sendMessage(jid, {
        text:
          `╭━━━〔 💖 MERA AI 〕━━━⬣\n` +
          `┃ Usage: .mera <your message>\n` +
          `┃\n` +
          `┃ Friendly, warm female AI.\n` +
          `┃ She remembers your chats!\n` +
          `┃ Talk to her about anything.\n` +
          `┃\n` +
          `┃ 💡 Type .clear to reset memory.\n` +
          `╰━━━━━━━━━━━━━━━━━━⬣\n\n` +
          `Example: .mera how are you today?`,
      });
    }
    await sock.sendMessage(jid, { text: '_Mera is typing..._' });
    try {
      const response = await pollinations.mera(jid, args.join(' '));
      await sock.sendMessage(jid, {
        text: `╭━━━〔 MERA AI 〕━━━⬣\n\n${response}\n\n╰━━━━━━━━━━━━━━━━━━⬣\n\n💖 Powered by Mera AI`,
      });
    } catch (e) {
      await sock.sendMessage(jid, { text: `Error: ${e.message}` });
    }
  },

  async codeai(sock, msg, args, jid) {
    if (!args.length) {
      return sock.sendMessage(jid, {
        text:
          `╭━━━〔 💻 CODE AI 〕━━━⬣\n` +
          `┃ Usage: .codeai <question>\n` +
          `┃\n` +
          `┃ Expert coding AI. Supports all\n` +
          `┃ languages — Python, JS, Rust,\n` +
          `┃ Go, C++, SQL and more.\n` +
          `╰━━━━━━━━━━━━━━━━━━⬣\n\n` +
          `Example: .codeai write a REST API in Node.js`,
      });
    }
    await sock.sendMessage(jid, { text: '_CodeAI is generating..._' });
    try {
      const response = await pollinations.codeAI(args.join(' '));
      await sock.sendMessage(jid, {
        text: `╭━━━〔 CODE AI 〕━━━⬣\n\n${response}\n\n╰━━━━━━━━━━━━━━━━━━⬣\n\n⚡ Powered by CodeAI`,
      });
    } catch (e) {
      await sock.sendMessage(jid, { text: `CodeAI Error: ${e.message}` });
    }
  },

  async roast(sock, msg, args, jid) {
    if (!args.length) return sock.sendMessage(jid, { text: 'Usage: .roast <name>' });
    await sock.sendMessage(jid, { text: '_Roasting..._' });
    try {
      const response = await pollinations.roast(args.join(' '));
      await sock.sendMessage(jid, { text: `🔥 *ROAST TIME!*\n\n${response}` });
    } catch (e) {
      await sock.sendMessage(jid, { text: `Error: ${e.message}` });
    }
  },

  async complimentai(sock, msg, args, jid) {
    if (!args.length) return sock.sendMessage(jid, { text: 'Usage: .complimentai <name>' });
    await sock.sendMessage(jid, { text: '_Creating compliment..._' });
    try {
      const response = await pollinations.complimentAI(args.join(' '));
      await sock.sendMessage(jid, { text: `*Compliment*\n\n${response}` });
    } catch (e) {
      await sock.sendMessage(jid, { text: `Error: ${e.message}` });
    }
  },

  async weather(sock, msg, args, jid) {
    if (!args.length) return sock.sendMessage(jid, { text: 'Usage: .weather <city>\nExample: .weather Toronto' });
    await sock.sendMessage(jid, { text: '_Fetching weather..._' });
    try {
      const result = await pollinations.getWeather(args.join(' '));
      await sock.sendMessage(jid, { text: `*Weather*\n\n${result}\n\n_Powered by DollarBot_` });
    } catch (e) {
      await sock.sendMessage(jid, { text: `Weather Error: ${e.message}` });
    }
  },

  async imagine(sock, msg, args, jid) {
    const fetch = require('node-fetch');
    if (!args.length) {
      return sock.sendMessage(jid, {
        text:
          `╭━━━〔 🎨 IMAGINE AI 〕━━━⬣\n` +
          `┃ Usage: .imagine <prompt>\n` +
          `┃\n` +
          `┃ AI image generation from text.\n` +
          `┃ Be descriptive for best results!\n` +
          `╰━━━━━━━━━━━━━━━━━━⬣\n\n` +
          `Example: .imagine a cyberpunk city at night with neon lights`,
      });
    }
    const prompt = args.join(' ');
    await sock.sendMessage(jid, { text: `_Generating image for:_ "${prompt}"\n_May take 15-30 seconds..._` });
    try {
      const imageUrl = pollinations.getImageUrl(prompt);
      const response = await fetch(imageUrl, { timeout: 60000 });
      if (!response.ok) throw new Error('Image generation failed');
      const buffer = await response.buffer();
      await sock.sendMessage(jid, {
        image: buffer,
        caption: `*Generated Image*\nPrompt: ${prompt}\n\n_Powered by Dollar Engine_`,
      });
    } catch (e) {
      await sock.sendMessage(jid, { text: `Image Error: ${e.message}` });
    }
  },

  async translate(sock, msg, args, jid) {
    if (!args.length) return sock.sendMessage(jid, { text: 'Usage: .translate <text>\nExample: .translate Hola como estas' });
    await sock.sendMessage(jid, { text: '_Translating..._' });
    try {
      const result = await pollinations.translate(args.join(' '));
      await sock.sendMessage(jid, { text: `*Translation*\n\n${result}\n\n_Powered by DollarBot_` });
    } catch (e) {
      await sock.sendMessage(jid, { text: `Translation Error: ${e.message}` });
    }
  },

  async story(sock, msg, args, jid) {
    if (!args.length) return sock.sendMessage(jid, { text: 'Usage: .story <topic>\nExample: .story a dragon who lost his fire' });
    await sock.sendMessage(jid, { text: '_Writing your story..._' });
    try {
      const response = await pollinations.textGenerate([
        { role: 'system', content: 'You are a creative storyteller. Write a short engaging story (150-200 words). Use *bold* for character names and key moments. WhatsApp formatting only — no tables, no HTML.' },
        { role: 'user', content: `Write a short story about: ${args.join(' ')}` },
      ]);
      await sock.sendMessage(jid, { text: `*Story*\n\n${response}\n\n_Powered by Dollar AI_` });
    } catch (e) {
      await sock.sendMessage(jid, { text: `Error: ${e.message}` });
    }
  },

  async poem(sock, msg, args, jid) {
    if (!args.length) return sock.sendMessage(jid, { text: 'Usage: .poem <topic>\nExample: .poem the ocean at night' });
    await sock.sendMessage(jid, { text: '_Writing your poem..._' });
    try {
      const response = await pollinations.textGenerate([
        { role: 'system', content: 'You are a poet. Write a short beautiful poem (4-8 lines). Use _italic_ for the title. WhatsApp formatting only — no tables, no HTML.' },
        { role: 'user', content: `Write a poem about: ${args.join(' ')}` },
      ]);
      await sock.sendMessage(jid, { text: `*Poem*\n\n${response}\n\n_Powered by Dollar AI_` });
    } catch (e) {
      await sock.sendMessage(jid, { text: `Error: ${e.message}` });
    }
  },

  async motivate(sock, msg, args, jid) {
    await sock.sendMessage(jid, { text: '_Finding motivation..._' });
    try {
      const response = await pollinations.textGenerate([
        { role: 'system', content: 'You are a motivational coach. Give one powerful genuine motivational message (2-4 sentences). Use *bold* for the key message. WhatsApp formatting only.' },
        { role: 'user', content: 'Give me a powerful motivational message.' },
      ]);
      await sock.sendMessage(jid, { text: `*Daily Motivation*\n\n${response}` });
    } catch (e) {
      await sock.sendMessage(jid, { text: `Error: ${e.message}` });
    }
  },

  async summarize(sock, msg, args, jid) {
    if (!args.length) return sock.sendMessage(jid, { text: 'Usage: .summarize <text>' });
    await sock.sendMessage(jid, { text: '_Summarizing..._' });
    try {
      const response = await pollinations.textGenerate([
        { role: 'system', content: 'You are an expert summarizer. Provide a clear concise summary using bullet points (- item). Use *bold* for key points. WhatsApp formatting only — no tables, no HTML.' },
        { role: 'user', content: `Summarize this:\n${args.join(' ')}` },
      ]);
      await sock.sendMessage(jid, { text: `*Summary*\n\n${response}\n\n_Powered by Dollar AI_` });
    } catch (e) {
      await sock.sendMessage(jid, { text: `Error: ${e.message}` });
    }
  },

  async clear(sock, msg, args, jid) {
    const persona = args[0]?.toLowerCase();
    if (persona && !['cortex', 'mera', 'autoreply'].includes(persona)) {
      return sock.sendMessage(jid, { text: 'Usage: .clear [cortex/mera/autoreply]\nOmit to clear all AI memory.' });
    }
    memory.clearHistory(jid, persona || null);
    const what = persona ? `*${persona}*` : '*all AI*';
    await sock.sendMessage(jid, { text: `Memory cleared for ${what}. Fresh start!` });
  },
};

module.exports = aiCommands;
