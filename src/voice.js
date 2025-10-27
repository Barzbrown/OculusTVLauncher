import { startMouthAnimation, stopMouthAnimation } from './avatarAnim.js';

export function speakReply(text) {
  if (typeof window === 'undefined') {
    return;
  }

  if ('speechSynthesis' in window) {
    const utter = new SpeechSynthesisUtterance(text);
    utter.onstart = () => {
      startMouthAnimation();
    };
    utter.onend = () => {
      stopMouthAnimation();
    };
    startMouthAnimation();
    window.speechSynthesis.speak(utter);
  } else {
    startMouthAnimation();
    setTimeout(() => {
      stopMouthAnimation();
    }, Math.min(6000, Math.max(2000, text.length * 80)));
  }
}
