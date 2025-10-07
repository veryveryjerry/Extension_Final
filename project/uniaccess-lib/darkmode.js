export class DarkMode {
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