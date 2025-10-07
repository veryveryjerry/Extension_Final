import { DarkMode } from './darkmode.js';
import { DyslexiaFont } from './dyslexia.js';
import { ColorFilters } from './colorfilters.js';
import { TextToSpeech } from './tts.js';
import { FloatingButton } from './floatingButton.js';
import { ControlPanel } from './controlPanel.js';

export const UniAccess = {
  features: {},
  ui: {},
  init(config = {}) {
    this.features.darkMode = new DarkMode(config.darkMode);
    this.features.dyslexia = new DyslexiaFont(config.dyslexia);
    this.features.colorFilters = new ColorFilters(config.colorFilters);
    this.features.tts = new TextToSpeech(config.tts);

    this.ui.button = new FloatingButton(config.ui, () => this.togglePanel());
    this.ui.panel = null;
  },
  togglePanel() {
    if (this.ui.panel) {
      this.ui.panel.remove();
      this.ui.panel = null;
    } else {
      this.ui.panel = new ControlPanel(this.features);
    }
  },
  enable(feature) {
    if (this.features[feature]) this.features[feature].enable();
  },
  disable(feature) {
    if (this.features[feature]) this.features[feature].disable();
  },
  speak(text) {
    this.features.tts.speak(text);
  }
};

if (typeof window !== "undefined") {
  window.UniAccess = UniAccess;
}
