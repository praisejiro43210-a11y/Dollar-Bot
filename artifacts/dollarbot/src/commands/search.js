const fetch = require('node-fetch');
const { searchWithAI } = require('../lib/pollinations');

// ── DuckDuckGo Instant Answer ─────────────────────────────────────────────
async function duckSearch(query) {
  const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;
  const res = await fetch(url, { timeout: 10000 });
  if (!res.ok) throw new Error('DuckDuckGo search failed');
  const data = await res.json();

  const results = [];
  if (data.AbstractText) {
    results.push({ title: data.Heading || query, snippet: data.AbstractText, url: data.AbstractURL });
  }
  if (data.RelatedTopics) {
    for (const t of data.RelatedTopics.slice(0, 4)) {
      if (t.Text && t.FirstURL) {
        results.push({ title: t.Text.split(' - ')[0] || '', snippet: t.Text, url: t.FirstURL });
      }
    }
  }
  return results;
}

// ── Wikipedia Summary ─────────────────────────────────────────────────────
async function wikiSearch(query) {
  const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&srlimit=1`;
  const searchRes = await fetch(searchUrl, { timeout: 10000 });
  if (!searchRes.ok) throw new Error('Wikipedia search failed');
  const searchData = await searchRes.json();
  const results = searchData?.query?.search;
  if (!results?.length) throw new Error('No Wikipedia results found');

  const title = results[0].title;
  const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
  const summaryRes = await fetch(summaryUrl, { timeout: 10000 });
  if (!summaryRes.ok) throw new Error('Failed to get Wikipedia summary');
  const summary = await summaryRes.json();
  return {
    title: summary.title,
    extract: summary.extract || summary.description || 'No summary available.',
    url: summary.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodeURIComponent(title)}`,
  };
}

// ── Dictionary ────────────────────────────────────────────────────────────
async function defineWord(word) {
  const url = `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`;
  const res = await fetch(url, { timeout: 10000 });
  if (!res.ok) throw new Error(`No definition found for "${word}"`);
  const data = await res.json();
  const entry = data[0];
  const meanings = entry.meanings.slice(0, 2).map(m => {
    const def = m.definitions[0];
    return `*${m.partOfSpeech}:* ${def.definition}${def.example ? `\n_Example: ${def.example}_` : ''}`;
  });
  const phonetic = entry.phonetic || entry.phonetics?.[0]?.text || '';
  return { word: entry.word, phonetic, meanings };
}

const searchCommands = {
  async search(sock, msg, args) {
    const jid = msg.key.remoteJid;
    if (!args.length) {
      return sock.sendMessage(jid, {
        text:
          `*WEB SEARCH*\n\n` +
          `Usage: .search <query>\n\n` +
          `Searches the web and summarizes results using AI.\n` +
          `Example: .search best programming languages 2025`,
      });
    }
    const query = args.join(' ');
    await sock.sendMessage(jid, { text: `*Searching...*` });
    try {
      const ddgResults = await duckSearch(query);

      // If DuckDuckGo has a meaningful abstract, use it
      if (ddgResults.length && ddgResults[0].snippet && ddgResults[0].snippet.length > 50) {
        let text = `*Search: ${query}*\n\n`;
        ddgResults.slice(0, 3).forEach((r, i) => {
          text += `*${i + 1}. ${r.title.slice(0, 60)}*\n`;
          text += `${r.snippet.slice(0, 200)}${r.snippet.length > 200 ? '...' : ''}\n\n`;
        });
        text += `_Powered by DollarBot Search_`;
        return await sock.sendMessage(jid, { text });
      }

      // Fallback: Ask AI directly for a clean, formatted answer
      console.log('[Search] DuckDuckGo returned thin results — using AI fallback');
      const aiAnswer = await searchWithAI(query);
      const text = `*Search: ${query}*\n\n${aiAnswer}\n\n_Powered by DollarBot AI Search_`;
      await sock.sendMessage(jid, { text });
    } catch (e) {
      // If DDG fails completely, still try AI
      try {
        const aiAnswer = await searchWithAI(query);
        await sock.sendMessage(jid, {
          text: `*Search: ${query}*\n\n${aiAnswer}\n\n_Powered by DollarBot AI Search_`,
        });
      } catch (e2) {
        await sock.sendMessage(jid, { text: `Search failed: ${e2.message}` });
      }
    }
  },

  async wiki(sock, msg, args) {
    const jid = msg.key.remoteJid;
    if (!args.length) {
      return sock.sendMessage(jid, {
        text:
          `╭━━━〔 📖 WIKIPEDIA 〕━━━⬣\n` +
          `┃ Usage: .wiki <topic>\n` +
          `┃\n` +
          `┃ Get a Wikipedia summary on any\n` +
          `┃ topic, person, place or thing.\n` +
          `╰━━━━━━━━━━━━━━━━━━⬣\n\n` +
          `Example: .wiki Black holes`,
      });
    }
    const query = args.join(' ');
    await sock.sendMessage(jid, { text: `📖 *Looking up Wikipedia:* "${query}"...` });
    try {
      const result = await wikiSearch(query);
      const extract = result.extract.slice(0, 900) + (result.extract.length > 900 ? '...' : '');
      const text =
        `╭━━━〔 📖 WIKIPEDIA 〕━━━⬣\n` +
        `┃ *${result.title}*\n` +
        `┃\n` +
        `${extract.split('\n').map(l => '┃ ' + l).join('\n')}\n` +
        `┃\n` +
        `┃ 📌 Read more: ${result.url}\n` +
        `╰━━━━━━━━━━━━━━━━━━⬣\n\n⚡ Source: Wikipedia`;
      await sock.sendMessage(jid, { text });
    } catch (e) {
      await sock.sendMessage(jid, { text: `Wikipedia Error: ${e.message}` });
    }
  },

  async define(sock, msg, args) {
    const jid = msg.key.remoteJid;
    if (!args.length) {
      return sock.sendMessage(jid, { text: 'Usage: .define <word>\nExample: .define serendipity' });
    }
    const word = args[0];
    await sock.sendMessage(jid, { text: `Looking up: _"${word}"_...` });
    try {
      const result = await defineWord(word);
      let text = `╭━━━〔 📚 DICTIONARY 〕━━━⬣\n`;
      text += `┃ *${result.word}*`;
      if (result.phonetic) text += ` /${result.phonetic}/`;
      text += `\n┃\n`;
      result.meanings.forEach((m, i) => { text += `┃ ${i + 1}. ${m}\n┃\n`; });
      text += `╰━━━━━━━━━━━━━━━━━━⬣`;
      await sock.sendMessage(jid, { text });
    } catch (e) {
      await sock.sendMessage(jid, { text: `${e.message}` });
    }
  },
};

module.exports = searchCommands;
