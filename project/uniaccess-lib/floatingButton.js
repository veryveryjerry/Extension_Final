export class FloatingButton {
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