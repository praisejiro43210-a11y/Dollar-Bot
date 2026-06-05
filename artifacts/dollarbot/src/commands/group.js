const store = require('../lib/store');
const { getMentionedJids, getQuotedParticipant } = require('../lib/messages');

function getTargetUsers(msg) {
  const mentioned = getMentionedJids(msg);
  const quotedParticipant = getQuotedParticipant(msg);
  return mentioned.length ? mentioned : quotedParticipant ? [quotedParticipant] : [];
}

const groupCommands = {
  // sanitize mention payloads to avoid WhatsApp “not-acceptable”
  _filterJids(members) {
    if (!Array.isArray(members)) return [];
    return members
      .filter(j => typeof j === 'string')
      .filter(j => /@((s|g)\.whatsapp\.net|g\.us)$/i.test(j));
  },

  async kick(sock, msg, args, isAdmin) {
    const jid = msg.key.remoteJid;
    if (!jid.endsWith('@g.us')) return msg.reply('❌ This command works only in groups.');
    if (!isAdmin) return msg.reply('❌ Bot must be an admin to kick members.');

    const mentioned = this._filterJids(getTargetUsers(msg));
    if (!mentioned.length) return msg.reply('❌ Usage: .kick @user (or reply to their message)');

    for (const user of mentioned) {
      try {
        await sock.groupParticipantsUpdate(jid, [user], 'remove');
        await msg.reply(`✅ Kicked: @${user.split('@')[0]}`, { mentions: [user] });
      } catch (e) {
        await msg.reply(`❌ Failed to kick @${user.split('@')[0]}: ${e.message}`, { mentions: [user] });
      }
    }
  },

  async promote(sock, msg, args, isAdmin) {
    const jid = msg.key.remoteJid;
    if (!jid.endsWith('@g.us')) return msg.reply('❌ Groups only.');
    if (!isAdmin) return msg.reply('❌ Bot must be an admin.');

    const mentioned = this._filterJids(getTargetUsers(msg));
    if (!mentioned.length) return msg.reply('❌ Usage: .promote @user (or reply to their message)');

    for (const user of mentioned) {
      try {
        await sock.groupParticipantsUpdate(jid, [user], 'promote');
        await msg.reply(`⬆️ Promoted @${user.split('@')[0]} to admin!`, { mentions: [user] });
      } catch (e) {
        await msg.reply(`❌ Failed: ${e.message}`);
      }
    }
  },

  async demote(sock, msg, args, isAdmin) {
    const jid = msg.key.remoteJid;
    if (!jid.endsWith('@g.us')) return msg.reply('❌ Groups only.');
    if (!isAdmin) return msg.reply('❌ Bot must be an admin.');

    const mentioned = this._filterJids(getTargetUsers(msg));
    if (!mentioned.length) return msg.reply('❌ Usage: .demote @user (or reply to their message)');

    for (const user of mentioned) {
      try {
        await sock.groupParticipantsUpdate(jid, [user], 'demote');
        await msg.reply(`⬇️ Demoted @${user.split('@')[0]} from admin.`, { mentions: [user] });
      } catch (e) {
        await msg.reply(`❌ Failed: ${e.message}`);
      }
    }
  },

  async mute(sock, msg, isAdmin) {
    const jid = msg.key.remoteJid;
    if (!jid.endsWith('@g.us')) return msg.reply('❌ Groups only.');
    if (!isAdmin) return msg.reply('❌ Bot must be an admin.');
    try {
      await sock.groupSettingUpdate(jid, 'announcement');
      await msg.reply('🔇 Group has been *muted*. Only admins can send messages.');
    } catch (e) {
      await msg.reply(`❌ Error: ${e.message}`);
    }
  },

  async unmute(sock, msg, isAdmin) {
    const jid = msg.key.remoteJid;
    if (!jid.endsWith('@g.us')) return msg.reply('❌ Groups only.');
    if (!isAdmin) return msg.reply('❌ Bot must be an admin.');
    try {
      await sock.groupSettingUpdate(jid, 'not_announcement');
      await msg.reply('🔊 Group has been *unmuted*. Everyone can send messages.');
    } catch (e) {
      await msg.reply(`❌ Error: ${e.message}`);
    }
  },

  async tagall(sock, msg) {
    const jid = msg.key.remoteJid;
    if (!jid.endsWith('@g.us')) return msg.reply('❌ Groups only.');

    try {
      const meta = await sock.groupMetadata(jid);
      const members = meta.participants.map(p => p.id);
      const safeMentions = this._filterJids(members);
      const text = safeMentions.map(m => `@${m.split('@')[0]}`).join(' ');

      await msg.reply(`📢 *Tagging everyone!*\n\n${text}`, { mentions: safeMentions });
    } catch (e) {
      await msg.reply(`❌ Error: ${e.message}`);
    }
  },

  async everyone(sock, msg, args) {
    const jid = msg.key.remoteJid;
    if (!jid.endsWith('@g.us')) return msg.reply('❌ Groups only.');

    const message = args.join(' ') || '👋 Attention everyone!';
    try {
      const meta = await sock.groupMetadata(jid);
      const members = meta.participants.map(p => p.id);
      const safeMentions = this._filterJids(members);
      const tags = safeMentions.map(m => `@${m.split('@')[0]}`).join(' ');

      await msg.reply(`📣 ${message}\n\n${tags}`, { mentions: safeMentions });
    } catch (e) {
      await msg.reply(`❌ Error: ${e.message}`);
    }
  },

  async hidetag(sock, msg, args) {
    const jid = msg.key.remoteJid;
    if (!jid.endsWith('@g.us')) return msg.reply('❌ Groups only.');

    const message = args.join(' ') || '📯 Announcement';
    try {
      const meta = await sock.groupMetadata(jid);
      const members = meta.participants.map(p => p.id);
      const safeMentions = this._filterJids(members);

      await msg.reply(message, { mentions: safeMentions });
    } catch (e) {
      await msg.reply(`❌ Error: ${e.message}`);
    }
  },

  async grouplink(sock, msg, isAdmin) {
    const jid = msg.key.remoteJid;
    if (!jid.endsWith('@g.us')) return msg.reply('❌ Groups only.');
    if (!isAdmin) return msg.reply('❌ Bot must be an admin to get invite link.');
    try {
      const link = await sock.groupInviteCode(jid);
      await msg.reply(`🔗 *Group Invite Link*\n\nhttps://chat.whatsapp.com/${link}`);
    } catch (e) {
      await msg.reply(`❌ Error: ${e.message}`);
    }
  },

  async groupinfo(sock, msg) {
    const jid = msg.key.remoteJid;
    if (!jid.endsWith('@g.us')) return msg.reply('❌ Groups only.');

    try {
      const meta = await sock.groupMetadata(jid);
      const admins = meta.participants.filter(p => p.admin).map(p => p.id);
      const safeAdmins = this._filterJids(admins);

      const adminText = safeAdmins
        .map(a => `@${a.split('@')[0]}`)
        .join(', ') || 'None';

      const created = new Date(meta.creation * 1000).toDateString();
      const text =
        `╭━━━〔 👥 GROUP INFO 〕━━━⬣\n` +
        `┃ ✦ Name : ${meta.subject}\n` +
        `┃ ✦ ID : ${jid}\n` +
        `┃ ✦ Members : ${meta.participants.length}\n` +
        `┃ ✦ Admins : ${adminText}\n` +
        `┃ ✦ Created : ${created}\n` +
        `┃ ✦ Description :\n` +
        `┃   ${meta.desc || 'None'}\n` +
        `╰━━━━━━━━━━━━━━━━━━⬣`;

      await msg.reply(text, { mentions: safeAdmins });
    } catch (e) {
      await msg.reply(`❌ Error: ${e.message}`);
    }
  },

  async antilink(sock, msg, args) {
    const jid = msg.key.remoteJid;
    if (!jid.endsWith('@g.us')) return msg.reply('❌ Groups only.');

    const setting = args[0]?.toLowerCase();
    if (!['on', 'off'].includes(setting)) {
      return msg.reply('❌ Usage: .antilink on/off');
    }

    const antilinkGroups = (await store.get('antilinkGroups')) || {};
    antilinkGroups[jid] = setting === 'on';
    await store.set('antilinkGroups', antilinkGroups);

    await msg.reply(
      `🔗 Anti-Link is now *${setting.toUpperCase()}* ${setting === 'on' ? '✅' : '❌'}\n${setting === 'on' ? 'Members sending links will be removed.' : 'Link detection disabled.'}`
    );
  },

  async welcome(sock, msg, args) {
    const jid = msg.key.remoteJid;
    if (!jid.endsWith('@g.us')) return msg.reply('❌ Groups only.');

    const setting = args[0]?.toLowerCase();
    if (!['on', 'off'].includes(setting)) {
      return msg.reply('❌ Usage: .welcome on/off');
    }

    const welcomeGroups = (await store.get('welcomeGroups')) || {};
    welcomeGroups[jid] = setting === 'on';
    await store.set('welcomeGroups', welcomeGroups);

    await msg.reply(`👋 Welcome message is now *${setting.toUpperCase()}* ${setting === 'on' ? '✅' : '❌'}`);
  },
};

module.exports = groupCommands;

