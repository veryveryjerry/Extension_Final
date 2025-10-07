var UniAccess = (function (exports) {
  'use strict';

  class DarkMode {
    constructor(options = {}) {
      this.enabled = false;
      this.options = options;
      this.styleId = 'uniaccess-darkmode-style';
    }
    enable() {
      if (this.enabled) return;
      const style = document.createElement('style');
      style.id = this.styleId;
      style.innerText = `
      html, body {
        background: #121212 !important;
        color: #e0e0e0 !important;
      }
      img, video {
        filter: brightness(0.8) contrast(1.2);
      }
    `;
      document.head.appendChild(style);
      this.enabled = true;
    }
    disable() {
      const style = document.getElementById(this.styleId);
      if (style) style.remove();
      this.enabled = false;
    }
  }

  class DyslexiaFont {
    constructor(options = {}) {
      this.enabled = false;
      this.options = options;
      this.styleId = 'uniaccess-dyslexia-style';
      this.fontUrl = options.fontUrl || 'https://cdn.jsdelivr.net/gh/antijingoist/open-dyslexic@latest/OpenDyslexic-Regular.otf';
    }
    enable() {
      if (this.enabled) return;
      const fontFace = `
      @font-face {
        font-family: 'OpenDyslexic';
        src: url('${this.fontUrl}') format('opentype');
      }
      html, body, * {
        font-family: 'OpenDyslexic', Arial, sans-serif !important;
      }
    `;
      const style = document.createElement('style');
      style.id = this.styleId;
      style.innerText = fontFace;
      document.head.appendChild(style);
      this.enabled = true;
    }
    disable() {
      const style = document.getElementById(this.styleId);
      if (style) style.remove();
      this.enabled = false;
    }
  }

  class ColorFilters {
    constructor(options = {}) {
      this.enabled = false;
      this.options = options;
      this.styleId = 'uniaccess-colorfilter-style';
    }
    enable(filter = 'grayscale') {
      if (this.enabled) return;
      const style = document.createElement('style');
      style.id = this.styleId;
      style.innerText = `
      html, body, img, video {
        filter: ${filter}(1) !important;
      }
    `;
      document.head.appendChild(style);
      this.enabled = true;
    }
    disable() {
      const style = document.getElementById(this.styleId);
      if (style) style.remove();
      this.enabled = false;
    }
  }

  class TextToSpeech {
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

  class FloatingButton {
    constructor(options = {}, onClick) {
      this.options = options;
      this.onClick = onClick;
      this.buttonId = 'uniaccess-btn';
      this.render();
    }
    render() {
      if (document.getElementById(this.buttonId)) return;
      const button = document.createElement('button');
      button.id = this.buttonId;
      button.style.position = 'fixed';
      button.style.bottom = this.options.bottom || '20px';
      button.style.right = this.options.right || '20px';
      button.style.zIndex = '9999';
      button.style.background = this.options.color || '#1976d2';
      button.style.color = '#fff';
      button.style.borderRadius = '50%';
      button.style.width = '48px';
      button.style.height = '48px';
      button.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
      button.innerText = '♿';
      button.title = 'Accessibility Controls';
      button.addEventListener('click', () => this.onClick());
      document.body.appendChild(button);
    }
    remove() {
      const btn = document.getElementById(this.buttonId);
      if (btn) btn.remove();
    }
  }

  class ControlPanel {
    constructor(features, options = {}) {
      this.features = features; // {darkMode, dyslexia, colorFilters, tts}
      this.options = options;
      this.panelId = 'uniaccess-panel';
      this.render();
    }
    render() {
      if (document.getElementById(this.panelId)) return;
      const panel = document.createElement('div');
      panel.id = this.panelId;
      panel.style.position = 'fixed';
      panel.style.bottom = '80px';
      panel.style.right = '20px';
      panel.style.zIndex = '10000';
      panel.style.background = '#fff';
      panel.style.color = '#222';
      panel.style.border = '1px solid #ddd';
      panel.style.borderRadius = '6px';
      panel.style.boxShadow = '0 2px 8px rgba(0,0,0,0.18)';
      panel.style.padding = '16px';
      panel.style.minWidth = '200px';
      panel.innerHTML = `
      <div>
        <label><input type="checkbox" id="uniaccess-dark"> Dark Mode</label><br>
        <label><input type="checkbox" id="uniaccess-dyslexia"> Dyslexia Font</label><br>
        <label><input type="checkbox" id="uniaccess-color"> Grayscale</label><br>
        <button id="uniaccess-tts-btn">Read Page</button>
      </div>
      <button id="uniaccess-close" style="margin-top:10px;">Close</button>
    `;
      document.body.appendChild(panel);

      document.getElementById('uniaccess-dark').addEventListener('change', e =>
        e.target.checked ? this.features.darkMode.enable() : this.features.darkMode.disable()
      );
      document.getElementById('uniaccess-dyslexia').addEventListener('change', e =>
        e.target.checked ? this.features.dyslexia.enable() : this.features.dyslexia.disable()
      );
      document.getElementById('uniaccess-color').addEventListener('change', e =>
        e.target.checked ? this.features.colorFilters.enable() : this.features.colorFilters.disable()
      );
      document.getElementById('uniaccess-tts-btn').addEventListener('click', () =>
        this.features.tts.speak(document.body.innerText)
      );
      document.getElementById('uniaccess-close').addEventListener('click', () =>
        panel.remove()
      );
    }
    remove() {
      const panel = document.getElementById(this.panelId);
      if (panel) panel.remove();
    }
  }

  const UniAccess = {
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

  exports.UniAccess = UniAccess;

  return exports;

})({});
//# sourceMappingURL=uniaccess.bundle.js.map
