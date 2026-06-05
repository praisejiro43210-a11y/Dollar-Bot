const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

const devCommands = {
  // ── JSON Minify ─────────────────────────────────────────────────────────
  async jsonminify(sock, msg, args) {
    if (!args.length) return msg.reply('❌ Usage: .jsonminify <json>');
    try {
      const json = JSON.parse(args.join(' '));
      const minified = JSON.stringify(json);
      await msg.reply(`\`\`\`\n${minified}\`\`\``);
    } catch (e) {
      await msg.reply(`❌ Invalid JSON: ${e.message}`);
    }
  },

  // ── Timestamp Converter ──────────────────────────────────────────────────
  async timestamp(sock, msg, args) {
    let date;
    if (!args.length) {
      date = new Date();
    } else if (args[0] === 'now') {
      date = new Date();
    } else if (/^\d+$/.test(args[0])) {
      date = new Date(parseInt(args[0]) * 1000);
    } else {
      date = new Date(args.join(' '));
    }
    
    if (isNaN(date)) return msg.reply('❌ Invalid date');
    
    await msg.reply(`*⏰ Timestamp Converter*\n\n` +
          `📅 Date: ${date.toISOString()}\n` +
          `⏱️ Unix: ${Math.floor(date.getTime() / 1000)}\n` +
          `📊 Milliseconds: ${date.getTime()}`);
  },

  // ── Base32 Encoder/Decoder ──────────────────────────────────────────────
  async base32(sock, msg, args) {
    if (!args.length) return msg.reply('❌ Usage: .base32 <text>');
    try {
      const text = args.join(' ');
      const encoded = Buffer.from(text).toString('base64');
      const decoded = Buffer.from(encoded, 'base64').toString();
      await msg.reply(`*📝 Base32 Conversion*\n\n` +
            `Original: ${text}\n` +
            `Encoded: \`${encoded}\``);
    } catch (e) {
      await msg.reply(`❌ Base32 Error: ${e.message}`);
    }
  },

  // ── JWT Decoder ─────────────────────────────────────────────────────────
  async jwtdecode(sock, msg, args) {
    if (!args.length) return msg.reply('❌ Usage: .jwtdecode <token>');
    try {
      const parts = args[0].split('.');
      if (parts.length !== 3) return msg.reply('❌ Invalid JWT format');
      
      const header = JSON.parse(Buffer.from(parts[0], 'base64').toString());
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
      
      await msg.reply(`*🔐 JWT Decoded*\n\n` +
            `Header: \`${JSON.stringify(header)}\`\n\n` +
            `Payload: \`${JSON.stringify(payload)}\``);
    } catch (e) {
      await msg.reply(`❌ JWT Error: ${e.message}`);
    }
  },

  // ── Regex Tester ────────────────────────────────────────────────────────
  async regextest(sock, msg, args) {
    if (args.length < 2) return msg.reply('❌ Usage: .regextest <pattern> <text>');
    try {
      const pattern = args[0];
      const text = args.slice(1).join(' ');
      const regex = new RegExp(pattern);
      const matches = text.match(regex) || [];
      
      await msg.reply(`*🔍 Regex Test*\n\n` +
            `Pattern: ${pattern}\n` +
            `Text: ${text}\n` +
            `Matches: ${matches.length}\n` +
            `Result: ${matches.length > 0 ? '✅ Match found!' : '❌ No match'}`);
    } catch (e) {
      await msg.reply(`❌ Regex Error: ${e.message}`);
    }
  },

  // ── URL Encoder/Decoder ─────────────────────────────────────────────────
  async urlencode(sock, msg, args) {
    if (!args.length) return msg.reply('❌ Usage: .urlencode <text>');
    const text = args.join(' ');
    const encoded = encodeURIComponent(text);
    const decoded = decodeURIComponent(encoded);
    await msg.reply(`*🔗 URL Encoding*\n\n` +
          `Original: ${text}\n` +
          `Encoded: \`${encoded}\`\n` +
          `Decoded: \`${decoded}\``);
  },

  // ── UUID v4 Generator ────────────────────────────────────────────────────
  async uuidgen(sock, msg) {
    const uuids = [uuidv4(), uuidv4(), uuidv4(), uuidv4(), uuidv4()];
    await msg.reply(`*🆔 UUID v4 Generated*\n\n${uuids.map((u, i) => `${i + 1}. \`${u}\``).join('\n')}`);
  },

  // ── HTTP Status Checker ─────────────────────────────────────────────────
  async httpstatus(sock, msg, args) {
    if (!args.length) return msg.reply('❌ Usage: .httpstatus <code>');
    const codes = {
      '200': '✅ OK',
      '201': '✅ Created',
      '204': '✅ No Content',
      '301': '🔄 Moved Permanently',
      '302': '🔄 Found',
      '304': '📦 Not Modified',
      '400': '❌ Bad Request',
      '401': '🔐 Unauthorized',
      '403': '🚫 Forbidden',
      '404': '❌ Not Found',
      '500': '💥 Internal Server Error',
      '502': '💥 Bad Gateway',
      '503': '💥 Service Unavailable',
    };
    const status = codes[args[0]] || '❓ Unknown Status Code';
    await msg.reply(`*📊 HTTP ${args[0]}*\n\n${status}`);
  },

  // ── MIME Type Lookup ────────────────────────────────────────────────────
  async mime(sock, msg, args) {
    if (!args.length) return msg.reply('❌ Usage: .mime <extension>');
    const mimes = {
      'js': 'application/javascript',
      'json': 'application/json',
      'html': 'text/html',
      'css': 'text/css',
      'txt': 'text/plain',
      'pdf': 'application/pdf',
      'zip': 'application/zip',
      'png': 'image/png',
      'jpg': 'image/jpeg',
      'gif': 'image/gif',
      'svg': 'image/svg+xml',
      'mp3': 'audio/mpeg',
      'mp4': 'video/mp4',
    };
    const ext = args[0].toLowerCase();
    const mime = mimes[ext] || '❌ Unknown extension';
    await msg.reply(`*${ext.toUpperCase()} MIME Type*\n\n${mime}`);
  },

  // ── Code Syntax Highlighter Info ────────────────────────────────────────
  async langinfo(sock, msg, args) {
    const langs = {
      'js': '📱 JavaScript',
      'python': '🐍 Python',
      'java': '☕ Java',
      'c': 'C',
      'cpp': '⚡ C++',
      'rust': '🦀 Rust',
      'go': '🐹 Go',
      'php': '🐘 PHP',
      'ruby': '💎 Ruby',
      'swift': '🍎 Swift',
    };
    const lang = args[0]?.toLowerCase();
    if (!lang || !langs[lang]) {
      return msg.reply(`*📚 Available Languages*\n\n${Object.entries(langs).map(([k, v]) => `${k} → ${v}`).join('\n')}`);
    }
    await msg.reply(`*${langs[lang]}*\n\nPopular programming language`);
  },

  // ── Random Port Generator ────────────────────────────────────────────────
  async randomport(sock, msg) {
    const ports = [];
    for (let i = 0; i < 5; i++) {
      ports.push(Math.floor(Math.random() * (65535 - 1024 + 1)) + 1024);
    }
    await msg.reply(`*🔌 Random Ports*\n\n${ports.map((p, i) => `${i + 1}. ${p}`).join('\n')}`);
  },

  // ── NPM Package Info ────────────────────────────────────────────────────
  async npmpkg(sock, msg, args) {
    if (!args.length) return msg.reply('❌ Usage: .npmpkg <package_name>');
    try {
      const pkg = args[0];
      const res = await axios.get(`https://registry.npmjs.org/${pkg}`);
      await msg.reply(`*📦 NPM Package: ${res.data.name}*\n\n` +
            `🔖 Latest: ${res.data['dist-tags'].latest}\n` +
            `📮 Downloads: ${res.data.description?.substring(0, 50)}\n` +
            `🔗 ${res.data.homepage || res.data.repository?.url || 'No URL'}`);
    } catch (e) {
      await msg.reply(`❌ NPM Error: ${e.message}`);
    }
  },

  // ── Markdown to HTML Preview ────────────────────────────────────────────
  async mdpreview(sock, msg, args) {
    if (!args.length) return msg.reply('❌ Usage: .mdpreview <markdown>');
    const md = args.join(' ');
    // Simple markdown preview
    const preview = md
      .replace(/^# (.*)/gm, '<h1>$1</h1>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/_(.+?)_/g, '<em>$1</em>');
    await msg.reply(`*📝 Markdown Preview*\n\n${preview}`);
  },

  // ── Git Commit Message Generator ────────────────────────────────────────
  async gitcommit(sock, msg, args) {
    const types = ['feat', 'fix', 'docs', 'style', 'refactor', 'perf', 'test', 'chore'];
    const type = types[Math.floor(Math.random() * types.length)];
    const scopes = ['api', 'ui', 'auth', 'db', 'core', 'utils'];
    const scope = scopes[Math.floor(Math.random() * scopes.length)];
    const messages = ['improve performance', 'add new feature', 'refactor code', 'fix bug', 'update docs'];
    const msg_text = messages[Math.floor(Math.random() * messages.length)];
    
    const commit = `${type}(${scope}): ${msg_text}`;
    await msg.reply(`*📝 Git Commit*\n\n\`${commit}\``);
  },
};

module.exports = devCommands;
