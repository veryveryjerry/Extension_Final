export class ControlPanel {
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