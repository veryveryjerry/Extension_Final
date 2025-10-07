export class ColorFilters {
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