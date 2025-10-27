import { speakReply } from './voice.js';
import { updateSpeechBubbleText } from './boards.js';

const JSON_HEADERS = {
  'Content-Type': 'application/json'
};

async function handleResponse(res) {
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Request failed: ${res.status}`);
  }
  return res.json();
}

export async function sendChat(text) {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify({
      messages: [
        { role: 'user', content: text }
      ]
    })
  });
  const data = await handleResponse(response);
  const reply = data.text || '';
  if (reply) {
    updateSpeechBubbleText(reply);
    speakReply(reply);
  }
  return reply;
}

export async function webSearch(payload) {
  const response = await fetch('/api/web', {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify(payload)
  });
  return handleResponse(response);
}

export async function generateImage(promptText) {
  const response = await fetch('/api/image', {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify({ prompt: promptText })
  });
  return handleResponse(response);
}

export async function uploadFile(file) {
  const form = new FormData();
  form.append('file', file);
  const response = await fetch('/api/upload', {
    method: 'POST',
    body: form
  });
  return handleResponse(response);
}

export async function fetchMemory() {
  const response = await fetch('/api/memory', {
    method: 'GET'
  });
  return handleResponse(response);
}

export function openExternalBrowser(url) {
  if (typeof window !== 'undefined') {
    window.open(url, '_blank');
  }
}
