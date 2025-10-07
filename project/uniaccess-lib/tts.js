export class TextToSpeech {
  constructor(options = {}) {
    this.synth = window.speechSynthesis;
    this.options = options;
    this._speaking = false;
  }
  speak(text) {
    if (this._speaking) this.synth.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = this.options.rate || 1;
    utter.pitch = this.options.pitch || 1;
    utter.lang = this.options.lang || 'en-US';
    this.synth.speak(utter);
    this._speaking = true;
    utter.onend = () => { this._speaking = false; };
  }
  stop() {
    this.synth.cancel();
    this._speaking = false;
  }
}