const fetch = require('node-fetch');
const config = require('../config');
const memory = require('./memory');

async function textGenerate(messages, model = 'llama3-8b-8192') {
  let groqError;
  // Try Groq First
  if (config.groqApiKey && !config.groqApiKey.includes('YOUR_GROQ')) {
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.groqApiKey}`
        },
        body: JSON.stringify({ messages, model }),
        timeout: 45000,
      });
      if (res.ok) {
        const data = await res.json();
        return data.choices[0].message.content.trim();
      } else {
        groqError = `Groq HTTP ${res.status}`;
      }
    } catch (e) {
      groqError = e.message;
    }
  }

  // Fallback to Pollinations
  console.log(`[AI] Groq failed or not configured (${groqError}). Falling back to Pollinations...`);
  const pollinationsRes = await fetch('https://text.pollinations.ai/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, model: 'openai', seed: Math.floor(Math.random() * 99999), private: true }),
    timeout: 45000,
  });
  if (!pollinationsRes.ok) throw new Error(`Primary and Backup AI failed.`);
  return (await pollinationsRes.text()).trim();
}

async function cortex(jid, question) {
  const history = memory.getHistory(jid, 'cortex');
  const messages = [{ role: 'system', content: config.cortexSystemPrompt }, ...history, { role: 'user', content: question }];
  const reply = await textGenerate(messages, 'openai');
  memory.addMessage(jid, 'cortex', 'user', question);
  memory.addMessage(jid, 'cortex', 'assistant', reply);
  return reply;
}

async function mera(jid, question) {
  const history = memory.getHistory(jid, 'mera');
  const messages = [{ role: 'system', content: config.meraSystemPrompt }, ...history, { role: 'user', content: question }];
  const reply = await textGenerate(messages, 'openai');
  memory.addMessage(jid, 'mera', 'user', question);
  memory.addMessage(jid, 'mera', 'assistant', reply);
  return reply;
}

async function codeAI(question) {
  return textGenerate([
    { role: 'system', content: config.codeAISystemPrompt },
    { role: 'user', content: question },
  ], 'openai');
}

async function roast(name) {
  return textGenerate([
    { role: 'system', content: 'You are a savage comedian. Write brutal, funny roasts in 2-3 sentences.' },
    { role: 'user', content: `Roast "${name}" savagely and hilariously.` },
  ], 'openai');
}

async function complimentAI(name) {
  return textGenerate([
    { role: 'system', content: 'You give heartfelt, creative, personalized compliments.' },
    { role: 'user', content: `Give "${name}" a beautiful and unique compliment.` },
  ], 'openai');
}

async function getWeather(city) {
  const res = await fetch(`https://wttr.in/${encodeURIComponent(city)}?format=4`, { timeout: 12000 });
  if (!res.ok) throw new Error('City not found or weather service unavailable');
  return (await res.text()).trim();
}

async function translate(text) {
  return textGenerate([
    { role: 'system', content: 'You are a professional translator. Detect the language and translate to English. If already English, translate to French. Reply format:\nDetected: [language]\nTranslated: [result]' },
    { role: 'user', content: text },
  ], 'openai');
}

function getImageUrl(prompt) {
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=1024&nologo=true&enhance=true&seed=${Math.floor(Math.random() * 99999)}`;
}

// Auto-Reply AI (Human-like)
async function autoReplyAI(jid, text) {
  const history = memory.getHistory(jid, 'autoreply');
  const messages = [
    { role: 'system', content: 'You are a real human chatting casually on WhatsApp. You are not an AI assistant. Be brief, use lowercase mostly, act natural, and be friendly. Never reveal you are a bot.' },
    ...history.slice(-10), // Keep last 10 messages for context
    { role: 'user', content: text }
  ];

  let responseText = '';
  try {
    responseText = await textGenerate(messages, 'openai');
  } catch (err) {
    console.log('[AutoReply] AI completely failed, using fallback...');
    responseText = "Yeah, totally."; // Ultimate fallback
  }

  history.push({ role: 'user', content: text });
  history.push({ role: 'assistant', content: responseText });
  memory.saveHistory(jid, 'autoreply', history);
  return responseText;
}

// TTS: StreamElements (Primary) and Google TTS (Fallback)
async function tts(text) {
  try {
    const encodedText = encodeURIComponent(text.slice(0, 500));
    const res = await fetch(`https://api.streamelements.com/kappa/v2/speech?voice=Brian&text=${encodedText}`, {
      timeout: 30000,
    });
    
    if (res.ok) {
      const buffer = await res.buffer();
      return { buffer, mime: 'audio/mpeg' };
    }
  } catch (err) {
    console.log('[TTS] StreamElements failed:', err.message);
  }

  // Fallback to Google TTS (shorter text limit)
  try {
    const encodedText2 = encodeURIComponent(text.slice(0, 200));
    const res2 = await fetch(`https://translate.google.com/translate_tts?ie=UTF-8&q=${encodedText2}&tl=en&client=tw-ob`, {
      timeout: 10000,
    });
    
    if (res2.ok) {
      const buffer = await res2.buffer();
      return { buffer, mime: 'audio/mpeg' };
    }
  } catch (err) {
    console.log('[TTS] Google TTS failed:', err.message);
  }
  
  throw new Error(`Both StreamElements and Google TTS Failed.`);
}

module.exports = { cortex, mera, codeAI, roast, complimentAI, getWeather, translate, getImageUrl, tts, textGenerate, autoReplyAI };
