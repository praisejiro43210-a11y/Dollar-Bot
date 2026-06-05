function unwrapMessageContent(message) {
  let content = message || {};

  for (let i = 0; i < 10; i++) {
    const next =
      content.ephemeralMessage?.message ||
      content.viewOnceMessage?.message ||
      content.viewOnceMessageV2?.message ||
      content.viewOnceMessageV2Extension?.message ||
      content.documentWithCaptionMessage?.message ||
      content.protocolMessage?.editedMessage ||
      content.editedMessage?.message;

    if (!next || next === content) break;
    content = next;
  }

  return content || {};
}

function getMessageContent(msg) {
  return unwrapMessageContent(msg?.message || msg || {});
}

function parseNativeFlowResponse(response) {
  const raw = response?.paramsJson;
  if (!raw) return '';

  try {
    const parsed = JSON.parse(raw);
    return parsed.id || parsed.title || parsed.name || raw;
  } catch {
    return raw;
  }
}

function extractBody(msg) {
  if (msg && typeof msg === 'object' && msg._cachedBody !== undefined) return msg._cachedBody;

  const content = getMessageContent(msg);
  const body =
    content.conversation ||
    content.extendedTextMessage?.text ||
    content.imageMessage?.caption ||
    content.videoMessage?.caption ||
    content.documentMessage?.caption ||
    content.buttonsResponseMessage?.selectedButtonId ||
    content.listResponseMessage?.singleSelectReply?.selectedRowId ||
    content.templateButtonReplyMessage?.selectedId ||
    parseNativeFlowResponse(content.interactiveResponseMessage?.nativeFlowResponseMessage) ||
    '';

  if (msg && typeof msg === 'object') msg._cachedBody = body;
  return body;
}

function getContextInfo(msg) {
  const content = getMessageContent(msg);
  return (
    content.extendedTextMessage?.contextInfo ||
    content.imageMessage?.contextInfo ||
    content.videoMessage?.contextInfo ||
    content.documentMessage?.contextInfo ||
    content.audioMessage?.contextInfo ||
    content.stickerMessage?.contextInfo ||
    content.buttonsResponseMessage?.contextInfo ||
    content.listResponseMessage?.contextInfo ||
    content.templateButtonReplyMessage?.contextInfo ||
    content.interactiveResponseMessage?.contextInfo ||
    null
  );
}

function getMentionedJids(msg) {
  const mentioned = getContextInfo(msg)?.mentionedJid;
  return Array.isArray(mentioned) ? mentioned : [];
}

function getQuotedParticipant(msg) {
  return getContextInfo(msg)?.participant;
}

module.exports = {
  extractBody,
  getContextInfo,
  getMentionedJids,
  getMessageContent,
  getQuotedParticipant,
  unwrapMessageContent,
};
