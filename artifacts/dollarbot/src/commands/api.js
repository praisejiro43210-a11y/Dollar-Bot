const axios = require('axios');

const apiCommands = {
  // ── Pokemon Info ─────────────────────────────────────────────────────────
  async pokemon(sock, msg, args) {
    const jid = msg.key.remoteJid;
    if (!args.length) return sock.sendMessage(jid, { text: '❌ Usage: .pokemon <name/id>' });
    try {
      const res = await axios.get(`https://pokeapi.co/api/v2/pokemon/${args[0].toLowerCase()}`);
      const p = res.data;
      await sock.sendMessage(jid, {
        text: `*🔴 ${p.name.toUpperCase()}*\n\n` +
              `#${p.id}\n` +
              `💪 Height: ${p.height / 10}m\n` +
              `⚖️ Weight: ${p.weight / 10}kg\n` +
              `🎯 Type: ${p.types.map(t => t.type.name).join(', ')}\n` +
              `💢 Abilities: ${p.abilities.map(a => a.ability.name).join(', ')}`
      });
    } catch (e) {
      await sock.sendMessage(jid, { text: `❌ Pokemon not found: ${e.message}` });
    }
  },

  // ── Anime Info ───────────────────────────────────────────────────────────
  async anime(sock, msg, args) {
    const jid = msg.key.remoteJid;
    if (!args.length) return sock.sendMessage(jid, { text: '❌ Usage: .anime <name>' });
    try {
      const res = await axios.get(`https://api.jikan.moe/v4/anime?query=${args.join(' ')}&limit=1`);
      if (!res.data.data.length) return sock.sendMessage(jid, { text: '❌ Anime not found' });
      const anime = res.data.data[0];
      await sock.sendMessage(jid, {
        text: `*📺 ${anime.title}*\n\n` +
              `🔗 Year: ${anime.year}\n` +
              `⭐ Rating: ${anime.score}/10\n` +
              `📊 Episodes: ${anime.episodes || 'N/A'}\n` +
              `🎭 Type: ${anime.type}\n` +
              `📝 Status: ${anime.status}\n` +
              `✨ ${anime.synopsis?.substring(0, 150)}...`
      });
    } catch (e) {
      await sock.sendMessage(jid, { text: `❌ Anime Error: ${e.message}` });
    }
  },

  // ── Manga Info ───────────────────────────────────────────────────────────
  async manga(sock, msg, args) {
    const jid = msg.key.remoteJid;
    if (!args.length) return sock.sendMessage(jid, { text: '❌ Usage: .manga <name>' });
    try {
      const res = await axios.get(`https://api.jikan.moe/v4/manga?query=${args.join(' ')}&limit=1`);
      if (!res.data.data.length) return sock.sendMessage(jid, { text: '❌ Manga not found' });
      const manga = res.data.data[0];
      await sock.sendMessage(jid, {
        text: `*📚 ${manga.title}*\n\n` +
              `⭐ Rating: ${manga.score}/10\n` +
              `📖 Chapters: ${manga.chapters || 'Ongoing'}\n` +
              `📕 Type: ${manga.type}\n` +
              `✨ ${manga.synopsis?.substring(0, 150)}...`
      });
    } catch (e) {
      await sock.sendMessage(jid, { text: `❌ Manga Error: ${e.message}` });
    }
  },

  // ── Books Search ─────────────────────────────────────────────────────────
  async book(sock, msg, args) {
    const jid = msg.key.remoteJid;
    if (!args.length) return sock.sendMessage(jid, { text: '❌ Usage: .book <title>' });
    try {
      const res = await axios.get(`https://openlibrary.org/search.json?title=${args.join(' ')}&limit=1`);
      if (!res.data.docs.length) return sock.sendMessage(jid, { text: '❌ Book not found' });
      const book = res.data.docs[0];
      await sock.sendMessage(jid, {
        text: `*📖 ${book.title}*\n\n` +
              `✍️ Author: ${book.author_name?.[0] || 'N/A'}\n` +
              `📅 Year: ${book.first_publish_year}\n` +
              `💾 Edition: ${book.edition_count}`
      });
    } catch (e) {
      await sock.sendMessage(jid, { text: `❌ Book Error: ${e.message}` });
    }
  },

  // ── Random Joke (Multiple Sources) ───────────────────────────────────────
  async jokepro(sock, msg) {
    const jid = msg.key.remoteJid;
    try {
      const res = await axios.get('https://v2.jokeapi.dev/joke/Any?blacklistFlags=nsfw,religious,political,racist,sexist');
      const joke = res.data;
      const text = joke.type === 'single' ? joke.joke : `${joke.setup}\n\n${joke.delivery}`;
      await sock.sendMessage(jid, { text: `*😂 ${text}*` });
    } catch (e) {
      await sock.sendMessage(jid, { text: `*😂 Why don't scientists trust atoms? Because they make up everything!*` });
    }
  },

  // ── Useless Fact ─────────────────────────────────────────────────────────
  async uselessfact(sock, msg) {
    const jid = msg.key.remoteJid;
    try {
      const res = await axios.get('https://uselessfacts.jsoup.com/random.json');
      await sock.sendMessage(jid, { text: `*💡 ${res.data.text}*` });
    } catch (e) {
      await sock.sendMessage(jid, { text: `*💡 Honey never spoils. Archaeologists have found 3000-year-old honey that was still edible!*` });
    }
  },

  // ── Breaking Bad Quotes ──────────────────────────────────────────────────
  async bbquote(sock, msg) {
    const jid = msg.key.remoteJid;
    try {
      const res = await axios.get('https://www.breakingbadapi.com/api/quotes/random');
      const quote = res.data;
      await sock.sendMessage(jid, {
        text: `*🎬 "${quote.quote}"*\n\n— ${quote.author}`
      });
    } catch (e) {
      await sock.sendMessage(jid, { text: `*🎬 Error fetching quote*` });
    }
  },

  // ── Kanye West Quotes ────────────────────────────────────────────────────
  async kanye(sock, msg) {
    const jid = msg.key.remoteJid;
    try {
      const res = await axios.get('https://api.kanye.rest');
      await sock.sendMessage(jid, { text: `*🎤 "${res.data.quote}"*\n\n— Kanye West` });
    } catch (e) {
      await sock.sendMessage(jid, { text: `*🎤 Error fetching quote*` });
    }
  },

  // ── Advice ──────────────────────────────────────────────────────────────
  async adviceslip(sock, msg) {
    const jid = msg.key.remoteJid;
    try {
      const res = await axios.get('https://api.adviceslip.com/advice');
      await sock.sendMessage(jid, { text: `*💭 ${res.data.slip.advice}*` });
    } catch (e) {
      await sock.sendMessage(jid, { text: `*💭 Error fetching advice*` });
    }
  },

  // ── Random Cat Fact ─────────────────────────────────────────────────────
  async catfact(sock, msg) {
    const jid = msg.key.remoteJid;
    try {
      const res = await axios.get('https://catfact.ninja/fact');
      await sock.sendMessage(jid, { text: `*🐱 ${res.data.fact}*` });
    } catch (e) {
      await sock.sendMessage(jid, { text: `*🐱 Cats spend 70% of their lives sleeping!*` });
    }
  },

  // ── NASA Image of the Day ────────────────────────────────────────────────
  async spacepic(sock, msg) {
    const jid = msg.key.remoteJid;
    try {
      const res = await axios.get('https://api.nasa.gov/planetary/apod?api_key=demo&count=1');
      const pic = res.data[0];
      await sock.sendMessage(jid, {
        text: `*🌌 ${pic.title}*\n\n${pic.explanation}\n\n🔗 ${pic.url}`
      });
    } catch (e) {
      await sock.sendMessage(jid, { text: `❌ NASA Error: ${e.message}` });
    }
  },

  // ── Zen Quote ────────────────────────────────────────────────────────────
  async zenquote(sock, msg) {
    const jid = msg.key.remoteJid;
    try {
      const res = await axios.get('https://zenquotes.io/api/random');
      const quote = res.data[0];
      await sock.sendMessage(jid, {
        text: `*✨ "${quote.q}"*\n\n— ${quote.a}`
      });
    } catch (e) {
      await sock.sendMessage(jid, { text: `*✨ Error fetching quote*` });
    }
  },

  // ── Weather (Open-Meteo - No Key Required) ────────────────────────────────
  async weather2(sock, msg, args) {
    const jid = msg.key.remoteJid;
    if (!args.length) return sock.sendMessage(jid, { text: '❌ Usage: .weather2 <city>' });
    try {
      // Geocode city name
      const geoRes = await axios.get(`https://geocoding-api.open-meteo.com/v1/search?name=${args.join(' ')}&count=1&language=en&format=json`);
      if (!geoRes.data.results?.length) return sock.sendMessage(jid, { text: '❌ City not found' });
      
      const { latitude, longitude, name, country } = geoRes.data.results[0];
      
      // Get weather
      const weatherRes = await axios.get(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code,wind_speed_10m,relative_humidity_2m&temperature_unit=celsius`);
      const current = weatherRes.data.current;
      
      await sock.sendMessage(jid, {
        text: `*🌤️ Weather in ${name}, ${country}*\n\n` +
              `🌡️ Temperature: ${current.temperature_2m}°C\n` +
              `💨 Wind Speed: ${current.wind_speed_10m} km/h\n` +
              `💧 Humidity: ${current.relative_humidity_2m}%\n` +
              `☁️ Condition: ${current.weather_code}`
      });
    } catch (e) {
      await sock.sendMessage(jid, { text: `❌ Weather Error: ${e.message}` });
    }
  },

  // ── IP Geolocation ──────────────────────────────────────────────────────
  async iplocation(sock, msg, args) {
    const jid = msg.key.remoteJid;
    if (!args.length) return sock.sendMessage(jid, { text: '❌ Usage: .iplocation <ip>' });
    try {
      const res = await axios.get(`https://ipapi.co/${args[0]}/json/`);
      await sock.sendMessage(jid, {
        text: `*🌍 IP Location*\n\n` +
              `🌐 IP: ${res.data.ip}\n` +
              `🏙️ City: ${res.data.city}\n` +
              `🗺️ Region: ${res.data.region}\n` +
              `🌏 Country: ${res.data.country_name}\n` +
              `📍 Coordinates: ${res.data.latitude}, ${res.data.longitude}\n` +
              `🔗 ISP: ${res.data.org}`
      });
    } catch (e) {
      await sock.sendMessage(jid, { text: `❌ IP Error: ${e.message}` });
    }
  },

  // ── Crypto Price Tracker ────────────────────────────────────────────────
  async crypto(sock, msg, args) {
    const jid = msg.key.remoteJid;
    if (!args.length) return sock.sendMessage(jid, { text: '❌ Usage: .crypto <bitcoin|ethereum|etc>' });
    try {
      const coin = args[0].toLowerCase();
      const res = await axios.get(`https://api.coingecko.com/api/v3/simple/price?ids=${coin}&vs_currencies=usd,eur,gbp&include_market_cap=true&include_24hr_vol=true`);
      const data = res.data[coin];
      if (!data) return sock.sendMessage(jid, { text: '❌ Coin not found' });
      await sock.sendMessage(jid, {
        text: `*💰 ${coin.toUpperCase()} Price*\n\n` +
              `💵 USD: $${data.usd}\n` +
              `💶 EUR: €${data.eur}\n` +
              `💷 GBP: £${data.gbp}\n` +
              `📊 Market Cap USD: $${data.usd_market_cap?.toLocaleString() || 'N/A'}\n` +
              `📈 24h Volume: $${data.usd_24h_vol?.toLocaleString() || 'N/A'}`
      });
    } catch (e) {
      await sock.sendMessage(jid, { text: `❌ Crypto Error: ${e.message}` });
    }
  },

  // ── URL Info Extractor ──────────────────────────────────────────────────
  async urlinfo(sock, msg, args) {
    const jid = msg.key.remoteJid;
    if (!args.length) return sock.sendMessage(jid, { text: '❌ Usage: .urlinfo <url>' });
    try {
      const url = args[0];
      const res = await axios.head(url, { timeout: 5000 });
      await sock.sendMessage(jid, {
        text: `*🔗 URL Information*\n\n` +
              `📍 Status: ${res.status}\n` +
              `📦 Content Type: ${res.headers['content-type']}\n` +
              `📏 Size: ${res.headers['content-length'] ? (res.headers['content-length'] / 1024).toFixed(2) + ' KB' : 'N/A'}`
      });
    } catch (e) {
      await sock.sendMessage(jid, { text: `❌ URL Error: ${e.message}` });
    }
  },
};

module.exports = apiCommands;
