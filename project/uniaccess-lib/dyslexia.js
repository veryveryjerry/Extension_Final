export class DyslexiaFont {
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