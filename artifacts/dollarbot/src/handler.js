const fs = require('fs');
const path = require('path');

const config = require('./config');
const store = require('./lib/store');

const userCommands    = require('./commands/user');
const ownerCommands   = require('./commands/owner');
const aiCommands      = require('./commands/ai');
const funCommands     = require('./commands/fun');
const utilityCommands = require('./commands/utility');
const gameCommands    = require('./commands/games');
const groupCommands   = require('./commands/group');
const searchCommands  = require('./commands/search');

const LINK_RE = /(?:https?:\/\/|www\.|chat\.whatsapp\.com\/)[^\s]+/gi;
const MENU_IMG = path.join(__dirname, '../assets/menu.jpg');

// ── Helpers ────────────────────────────────────────────────────────────────

function extractBody(msg) {
  return (
    msg.message?.conversation ||
    msg.message?.extendedTextMessage?.text ||
    msg.message?.imageMessage?.caption ||
    msg.message?.videoMessage?.caption ||
    msg.message?.buttonsResponseMessage?.selectedButtonId ||
    msg.message?.listResponseMessage?.singleSelectReply?.selectedRowId ||
    ''
  );
}

function extractSender(msg, isGroup) {
  return isGroup
    ? (msg.key.participant || msg.key.remoteJid)
    : msg.key.remoteJid;
}

function isOwnerJid(sender) {
  if (!sender) return false;
  const bare = sender.split('@')[0].split(':')[0];
  return bare === config.ownerNumber || sender === config.ownerJid;
}

async function isBotAdmin(sock, jid) {
  try {
    const meta = await sock.groupMetadata(jid);
    const botBare = (sock.user?.id || '').split(':')[0].split('@')[0];
    return meta.participants.some(p => {
      const pBare = p.id.split(':')[0].split('@')[0];
      return pBare === botBare && !!p.admin;
    });
  } catch {
    return false;
  }
}

async function sendMenu(sock, jid) {
  const caption =
    `╭━━━〔 💵 𝐃𝐎𝐋𝐋𝐀𝐑𝐁𝐎𝐓 𝐕5 〕━━━⬣\n` +
    `┃ ✦ Owner   : ${config.ownerName}\n` +
    `┃ ✦ Country : ${config.ownerCountry}\n` +
    `┃ ✦ Prefix  : [ ${config.prefix} ]\n` +
    `┃ ✦ Mode    : Public\n` +
    `┃ ✦ Engine  : ${config.engine}\n` +
    `┃ ✦ Version : ${config.version}\n` +
    `╰━━━━━━━━━━━━━━━━━━⬣\n\n` +
    `«⚡ Developed By Dollar\n⚡ Powered By Cortex & Mera AI»\n\n` +
    `╭━━━〔 👤 USER 〕━━━⬣\n` +
    `┃ .ping .alive .owner .stats\n` +
    `┃ .info .details .time .jid\n` +
    `┃ .runtime .uptime\n` +
    `╰━━━━━━━━━━━━━━━━━━⬣\n\n` +
    `╭━━━〔 🔐 OWNER 〕━━━⬣\n` +
    `┃ .say .sendto .react .delete\n` +
    `┃ .autoreply .vv .broadcast .shutdown\n` +
    `╰━━━━━━━━━━━━━━━━━━⬣\n\n` +
    `╭━━━〔 🧠 AI (with memory) 〕━━━⬣\n` +
    `┃ .cortex .mera .codeai .roast\n` +
    `┃ .complimentai .weather .imagine\n` +
    `┃ .translate .clear\n` +
    `╰━━━━━━━━━━━━━━━━━━⬣\n\n` +
    `╭━━━〔 🔍 SEARCH 〕━━━⬣\n` +
    `┃ .search .wiki .define\n` +
    `╰━━━━━━━━━━━━━━━━━━⬣\n\n` +
    `╭━━━〔 🎭 FUN 〕━━━⬣\n` +
    `┃ .joke .dadjoke .fact .advice\n` +
    `┃ .compliment .8ball .truth .dare\n` +
    `┃ .reverse .hotcheck .smartcheck\n` +
    `┃ .brainlevel .coolcheck .lovecheck\n` +
    `╰━━━━━━━━━━━━━━━━━━⬣\n\n` +
    `╭━━━〔 🛠️ UTILITY 〕━━━⬣\n` +
    `┃ .calculate .genpass .encode\n` +
    `┃ .decode .qr .tinyurl .pingweb\n` +
    `┃ .tts <text>\n` +
    `╰━━━━━━━━━━━━━━━━━━⬣\n\n` +
    `╭━━━〔 🎮 GAMES 〕━━━⬣\n` +
    `┃ .coin .dice .rps .math\n` +
    `┃ .guess .slot .tictactoe\n` +
    `╰━━━━━━━━━━━━━━━━━━⬣\n\n` +
    `╭━━━〔 👥 GROUP (admin) 〕━━━⬣\n` +
    `┃ .kick .promote .demote .mute\n` +
    `┃ .unmute .tagall .everyone\n` +
    `┃ .hidetag .grouplink .groupinfo\n` +
    `┃ .antilink .welcome\n` +
    `╰━━━━━━━━━━━━━━━━━━⬣\n\n` +
    `╭━━━〔 🚀 STATUS 〕━━━⬣\n` +
    `┃ Online & Stable ✅\n` +
    `┃ AI Memory Active 🧠\n` +
    `┃ Search Engine Ready 🔍\n` +
    `┃ TTS Powered by Pollinations 🔊\n` +
    `╰━━━━━━━━━━━━━━━━━━⬣\n\n` +
    `«💵 DollarBot V5 — Smart • Fast • Limitless»`;

  try {
    if (fs.existsSync(MENU_IMG)) {
      const img = fs.readFileSync(MENU_IMG);
      await sock.sendMessage(jid, { image: img, caption });
      return;
    }
  } catch (_) {}
  await sock.sendMessage(jid, { text: caption });
}

function ownerOnly(sock, jid) {
  return sock.sendMessage(jid, { text: '🔐 This command is restricted to the bot owner.' });
}

// ── Main message handler ────────────────────────────────────────────────────

async function handleMessage(sock, msg) {
  try {
    const jid = msg.key.remoteJid;
    if (!jid || jid === 'status@broadcast') return;

    const isGroup = jid.endsWith('@g.us');
    const sender  = extractSender(msg, isGroup);
    const isOwner = isOwnerJid(sender);
    const body    = extractBody(msg);
    if (!body) return;

    const isCmd = body.startsWith(config.prefix);

    if (!isCmd) {
      await handleNonCommand(sock, msg, body, jid, sender, isGroup, isOwner);
      return;
    }

    const [rawCmd, ...args] = body.slice(config.prefix.length).trim().split(/\s+/);
    const cmd = rawCmd.toLowerCase();

    const isAdmin = isGroup ? await isBotAdmin(sock, jid) : false;

    try { await sock.readMessages([msg.key]); } catch (_) {}

    switch (cmd) {
      // Menu
      case 'menu': case 'help': case 'start':
        await sendMenu(sock, jid); break;

      // ── User ──────────────────────────────────────────────────────────────
      case 'ping':    await userCommands.ping(sock, msg); break;
      case 'alive':   await userCommands.alive(sock, msg); break;
      case 'owner':   await userCommands.owner(sock, msg); break;
      case 'stats':   await userCommands.stats(sock, msg); break;
      case 'info':    await userCommands.info(sock, msg); break;
      case 'details': await userCommands.details(sock, msg, sender); break;
      case 'time':    await userCommands.time(sock, msg); break;
      case 'jid':     await userCommands.jid(sock, msg, sender); break;
      case 'runtime': await userCommands.runtime(sock, msg); break;
      case 'uptime':  await userCommands.uptime(sock, msg); break;

      // ── Owner ─────────────────────────────────────────────────────────────
      case 'say':        if (!isOwner) return ownerOnly(sock, jid); await ownerCommands.say(sock, msg, args); break;
      case 'sendto':     if (!isOwner) return ownerOnly(sock, jid); await ownerCommands.sendto(sock, msg, args); break;
      case 'react':      if (!isOwner) return ownerOnly(sock, jid); await ownerCommands.react(sock, msg, args); break;
      case 'delete':     if (!isOwner) return ownerOnly(sock, jid); await ownerCommands.delete(sock, msg); break;
      case 'autoreply':  if (!isOwner) return ownerOnly(sock, jid); await ownerCommands.autoreply(sock, msg, args); break;
      case 'vv':         if (!isOwner) return ownerOnly(sock, jid); await ownerCommands.vv(sock, msg); break;
      case 'broadcast':  if (!isOwner) return ownerOnly(sock, jid); await ownerCommands.broadcast(sock, msg, args); break;
      case 'shutdown':   if (!isOwner) return ownerOnly(sock, jid); await ownerCommands.shutdown(sock, msg); break;

      // ── AI ────────────────────────────────────────────────────────────────
      case 'cortex':       await aiCommands.cortex(sock, msg, args, jid); break;
      case 'mera':         await aiCommands.mera(sock, msg, args, jid); break;
      case 'codeai':       await aiCommands.codeai(sock, msg, args, jid); break;
      case 'roast':        await aiCommands.roast(sock, msg, args, jid); break;
      case 'complimentai': await aiCommands.complimentai(sock, msg, args, jid); break;
      case 'weather':      await aiCommands.weather(sock, msg, args, jid); break;
      case 'imagine':      await aiCommands.imagine(sock, msg, args, jid); break;
      case 'translate':    await aiCommands.translate(sock, msg, args, jid); break;
      case 'clear':        await aiCommands.clear(sock, msg, args, jid); break;

      // ── Search ────────────────────────────────────────────────────────────
      case 'search': await searchCommands.search(sock, msg, args); break;
      case 'wiki':   await searchCommands.wiki(sock, msg, args); break;
      case 'define': await searchCommands.define(sock, msg, args); break;

      // ── Fun ───────────────────────────────────────────────────────────────
      case 'joke':       await funCommands.joke(sock, msg); break;
      case 'dadjoke':    await funCommands.dadjoke(sock, msg); break;
      case 'fact':       await funCommands.fact(sock, msg); break;
      case 'advice':     await funCommands.advice(sock, msg); break;
      case 'compliment': await funCommands.compliment(sock, msg); break;
      case '8ball':      await funCommands.eightball(sock, msg, args); break;
      case 'truth':      await funCommands.truth(sock, msg); break;
      case 'dare':       await funCommands.dare(sock, msg); break;
      case 'reverse':    await funCommands.reverse(sock, msg, args); break;
      case 'hotcheck':   await funCommands.hotcheck(sock, msg, args); break;
      case 'smartcheck': await funCommands.smartcheck(sock, msg, args); break;
      case 'brainlevel': await funCommands.brainlevel(sock, msg, args); break;
      case 'coolcheck':  await funCommands.coolcheck(sock, msg, args); break;
      case 'lovecheck':  await funCommands.lovecheck(sock, msg, args); break;

      // ── Utility ───────────────────────────────────────────────────────────
      case 'calculate': await utilityCommands.calculate(sock, msg, args); break;
      case 'genpass':   await utilityCommands.genpass(sock, msg, args); break;
      case 'encode':    await utilityCommands.encode(sock, msg, args); break;
      case 'decode':    await utilityCommands.decode(sock, msg, args); break;
      case 'qr':        await utilityCommands.qr(sock, msg, args); break;
      case 'tinyurl':   await utilityCommands.tinyurl(sock, msg, args); break;
      case 'pingweb':   await utilityCommands.pingweb(sock, msg, args); break;
      case 'tts':       await utilityCommands.tts(sock, msg, args); break;

      // ── Games ─────────────────────────────────────────────────────────────
      case 'coin':      await gameCommands.coin(sock, msg); break;
      case 'dice':      await gameCommands.dice(sock, msg, args); break;
      case 'rps':       await gameCommands.rps(sock, msg, args); break;
      case 'math':      await gameCommands.math(sock, msg); break;
      case 'guess':     await gameCommands.guess(sock, msg, args); break;
      case 'slot':      await gameCommands.slot(sock, msg); break;
      case 'tictactoe': await gameCommands.tictactoe(sock, msg, args); break;

      // ── Group ─────────────────────────────────────────────────────────────
      case 'kick':      await groupCommands.kick(sock, msg, args, isAdmin); break;
      case 'promote':   await groupCommands.promote(sock, msg, args, isAdmin); break;
      case 'demote':    await groupCommands.demote(sock, msg, args, isAdmin); break;
      case 'mute':      await groupCommands.mute(sock, msg, isAdmin); break;
      case 'unmute':    await groupCommands.unmute(sock, msg, isAdmin); break;
      case 'tagall':    await groupCommands.tagall(sock, msg); break;
      case 'everyone':  await groupCommands.everyone(sock, msg, args); break;
      case 'hidetag':   await groupCommands.hidetag(sock, msg, args); break;
      case 'grouplink': await groupCommands.grouplink(sock, msg, isAdmin); break;
      case 'groupinfo': await groupCommands.groupinfo(sock, msg); break;
      case 'antilink':  await groupCommands.antilink(sock, msg, args); break;
      case 'welcome':   await groupCommands.welcome(sock, msg, args); break;

      default:
        await sock.sendMessage(jid, {
          text: `❓ Unknown command: *.${cmd}*\n\nType *.menu* to see all commands.`,
        });
    }
  } catch (err) {
    console.error('[Handler Error]', err.message);
  }
}

async function handleNonCommand(sock, msg, body, jid, sender, isGroup, isOwner) {
  try {
    // Active math game answer check
    const mathDone = await gameCommands.checkMathAnswer(sock, msg, body);
    if (mathDone) return;

    // Anti-link enforcement
    if (isGroup && !isOwner) {
      const antilinkGroups = store.get('antilinkGroups') || {};
      if (antilinkGroups[jid] && LINK_RE.test(body)) {
        try { await sock.sendMessage(jid, { delete: msg.key }); } catch (_) {}
        await sock.sendMessage(jid, {
          text: `🚫 @${sender?.split('@')[0]}, links are not allowed here!`,
          mentions: [sender],
        });
        return;
      }
    }

    // Auto-reply in DMs
    if (store.get('autoreply') && !isGroup) {
      const replies = [
        `👋 Hey! I'm *DollarBot V5* 🤖\nType *.menu* to see all my features!`,
        `💵 DollarBot V5 is active. Type *.menu* for commands!`,
        `⚡ Online and ready! Type *.menu* to get started.`,
      ];
      await sock.sendMessage(jid, {
        text: replies[Math.floor(Math.random() * replies.length)],
      });
    }
  } catch (_) {}
}

async function handleGroupParticipants(sock, update) {
  try {
    const { id, participants, action } = update;
    const welcomeGroups = store.get('welcomeGroups') || {};
    if (!welcomeGroups[id]) return;

    for (const participant of participants) {
      const tag = `@${participant.split('@')[0]}`;
      if (action === 'add') {
        await sock.sendMessage(id, {
          text:
            `╭━━━〔 👋 WELCOME 〕━━━⬣\n` +
            `┃\n` +
            `┃ Welcome ${tag}! 🎉\n` +
            `┃ Happy you're here.\n` +
            `┃\n` +
            `┃ Type *.menu* for bot commands.\n` +
            `┃\n` +
            `╰━━━━━━━━━━━━━━━━━━⬣`,
          mentions: [participant],
        });
      } else if (action === 'remove') {
        await sock.sendMessage(id, {
          text: `👋 ${tag} has left. Goodbye!`,
          mentions: [participant],
        });
      }
    }
  } catch (_) {}
}

module.exports = { handleMessage, handleGroupParticipants };
