const fetch = require('node-fetch');
const config = require('../config');
const memory = require('./memory');

async function textGenerate(messages, model = 'openai') {
  const res = await fetch('https://text.pollinations.ai/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, model, seed: Math.floor(Math.random() * 99999), private: true }),
    timeout: 45000,
  });
  if (!res.ok) throw new Error(`AI service error (${res.status})`);
  return (await res.text()).trim();
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

// TTS: Uses Pollinations OpenAI-compatible audio endpoint
async function tts(text) {
  // Try Pollinations TTS first
  try {
    const res = await fetch('https://text.pollinations.ai/openai/audio/speech', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'tts-1', input: text.slice(0, 4000), voice: 'nova' }),
      timeout: 30000,
    });
    if (res.ok) {
      const ct = res.headers.get('content-type') || '';
      if (ct.includes('audio')) {
        const buffer = await res.buffer();
        return { buffer, mime: 'audio/mpeg' };
      }
    }
  } catch (_) {}

  // Fallback: StreamElements TTS (reliable, free, no key needed)
  const encoded = encodeURIComponent(text.slice(0, 400));
  const url = `https://api.streamelements.com/kappa/v2/speech?voice=Brian&text=${encoded}`;
  const res2 = await fetch(url, { timeout: 20000 });
  if (!res2.ok) throw new Error('TTS service unavailable');
  const ct2 = res2.headers.get('content-type') || '';
  if (!ct2.includes('audio') && !ct2.includes('mpeg') && !ct2.includes('octet')) {
    throw new Error('TTS returned non-audio response');
  }
  const buffer = await res2.buffer();
  return { buffer, mime: 'audio/mpeg' };
}

module.exports = { cortex, mera, codeAI, roast, complimentAI, getWeather, translate, getImageUrl, tts, textGenerate };
