class AccessibilityPopup {
  constructor() {
    this.settings = {};
    this.voices = [];
    this.speechSynthesis = null;
    this.currentUtterance = null;
    this.isPlaying = false;
    this.isPaused = false;
    
    this.init();
  }

  async init() {
    await this.loadSettings();
    this.initializeElements();
    this.loadVoices();
    this.setupEventListeners();
    this.updateUI();
    this.setupTTS();
  }

  initializeElements() {
    // Visual settings
    this.dyslexiaFontToggle = document.getElementById('dyslexiaFont');
    this.darkModeToggle = document.getElementById('darkMode');
    this.textSizeSelect = document.getElementById('textSizeSelect');
    this.textSizeDecrease = document.getElementById('textSizeDecrease');
    this.textSizeIncrease = document.getElementById('textSizeIncrease');
    this.colorFilterSelect = document.getElementById('colorFilter');
    this.highContrastToggle = document.getElementById('highContrast');
    this.contrastSlider = document.getElementById('contrastLevel');
    this.contrastValue = document.getElementById('contrastValue');
    this.contrastContainer = document.getElementById('contrastSliderContainer');

    // TTS settings
    this.voiceSelect = document.getElementById('voiceSelect');
    this.hoverToSpeakToggle = document.getElementById('hoverToSpeak');
    this.playBtn = document.getElementById('playBtn');
    this.pauseBtn = document.getElementById('pauseBtn');
    this.stopBtn = document.getElementById('stopBtn');
    this.speechRateSlider = document.getElementById('speechRate');
    this.speechPitchSlider = document.getElementById('speechPitch');
    this.speechVolumeSlider = document.getElementById('speechVolume');
    this.rateValue = document.getElementById('rateValue');
    this.pitchValue = document.getElementById('pitchValue');
    this.volumeValue = document.getElementById('volumeValue');

    // Close button
    this.closeBtn = document.getElementById('closeBtn');
  }

  async loadSettings() {
    try {
      const result = await chrome.storage.sync.get([
        'accessibility-dyslexiaFont',
        'accessibility-darkMode',
        'accessibility-textSize',
        'accessibility-colorBlindFilter',
        'accessibility-highContrast',
        'accessibility-contrastLevel',
        'accessibility-tts-voice',
        'accessibility-tts-rate',
        'accessibility-tts-pitch',
        'accessibility-tts-volume',
        'accessibility-hover-to-speak'
      ]);

      this.settings = {
        dyslexiaFont: result['accessibility-dyslexiaFont'] || false,
        darkMode: result['accessibility-darkMode'] || false,
        textSize: result['accessibility-textSize'] || 'medium',
        colorBlindFilter: result['accessibility-colorBlindFilter'] || 'none',
        highContrast: result['accessibility-highContrast'] || false,
        contrastLevel: result['accessibility-contrastLevel'] || 150,
        ttsVoice: result['accessibility-tts-voice'] || '',
        ttsRate: result['accessibility-tts-rate'] || 1,
        ttsPitch: result['accessibility-tts-pitch'] || 1,
        ttsVolume: result['accessibility-tts-volume'] || 1,
        hoverToSpeak: result['accessibility-hover-to-speak'] || false
      };
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  }

  async saveSettings() {
    try {
      await chrome.storage.sync.set({
        'accessibility-dyslexiaFont': this.settings.dyslexiaFont,
        'accessibility-darkMode': this.settings.darkMode,
        'accessibility-textSize': this.settings.textSize,
        'accessibility-colorBlindFilter': this.settings.colorBlindFilter,
        'accessibility-highContrast': this.settings.highContrast,
        'accessibility-contrastLevel': this.settings.contrastLevel,
        'accessibility-tts-voice': this.settings.ttsVoice,
        'accessibility-tts-rate': this.settings.ttsRate,
        'accessibility-tts-pitch': this.settings.ttsPitch,
        'accessibility-tts-volume': this.settings.ttsVolume,
        'accessibility-hover-to-speak': this.settings.hoverToSpeak
      });
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  }

  loadVoices() {
    if ('speechSynthesis' in window) {
      this.speechSynthesis = window.speechSynthesis;
      
      const loadVoicesCallback = () => {
        this.voices = this.speechSynthesis.getVoices();
        this.populateVoiceSelect();
      };

      // Load voices immediately if available
      loadVoicesCallback();
      
      // Also listen for voice changes (some browsers load voices asynchronously)
      this.speechSynthesis.onvoiceschanged = loadVoicesCallback;
    }
  }

  populateVoiceSelect() {
    const voiceSelect = this.voiceSelect;
    voiceSelect.innerHTML = '';

    if (this.voices.length === 0) {
      voiceSelect.innerHTML = '<option value="">No voices available</option>';
      return;
    }

    // Prioritize high-quality voices
    const priorityKeywords = ['Google', 'Microsoft', 'Apple', 'Premium', 'Enhanced', 'Natural'];
    const prioritizedVoices = this.voices.sort((a, b) => {
      const aScore = priorityKeywords.reduce((score, keyword) => 
        score + (a.name.includes(keyword) ? 1 : 0), 0);
      const bScore = priorityKeywords.reduce((score, keyword) => 
        score + (b.name.includes(keyword) ? 1 : 0), 0);
      return bScore - aScore;
    });

    // Add default option
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'Default Voice';
    voiceSelect.appendChild(defaultOption);

    // Add voice options
    prioritizedVoices.forEach((voice, index) => {
      const option = document.createElement('option');
      option.value = index;
      option.textContent = `${voice.name} (${voice.lang})`;
      voiceSelect.appendChild(option);
    });

    // Set saved voice if available
    if (this.settings.ttsVoice) {
      voiceSelect.value = this.settings.ttsVoice;
    }
  }

  setupTTS() {
    if (!this.speechSynthesis) return;

    // Set up speech synthesis event handlers
    this.speechSynthesis.onvoiceschanged = () => {
      this.loadVoices();
    };
  }

  setupEventListeners() {
    // Visual settings
    this.dyslexiaFontToggle.addEventListener('change', (e) => {
      this.settings.dyslexiaFont = e.target.checked;
      this.saveSettings();
      this.sendMessageToContent('dyslexiaFont', e.target.checked);
    });

    this.darkModeToggle.addEventListener('change', (e) => {
      this.settings.darkMode = e.target.checked;
      this.saveSettings();
      this.sendMessageToContent('darkMode', e.target.checked);
    });

    this.textSizeSelect.addEventListener('change', (e) => {
      this.settings.textSize = e.target.value;
      this.saveSettings();
      this.sendMessageToContent('textSize', e.target.value);
    });

    this.textSizeDecrease.addEventListener('click', () => {
      this.changeTextSize(-1);
    });

    this.textSizeIncrease.addEventListener('click', () => {
      this.changeTextSize(1);
    });

    this.colorFilterSelect.addEventListener('change', (e) => {
      this.settings.colorBlindFilter = e.target.value;
      this.saveSettings();
      this.sendMessageToContent('colorBlindFilter', e.target.value);
    });

    this.highContrastToggle.addEventListener('change', (e) => {
      this.settings.highContrast = e.target.checked;
      this.contrastContainer.classList.toggle('visible', e.target.checked);
      this.saveSettings();
      this.sendMessageToContent('highContrast', {
        enabled: e.target.checked,
        level: this.settings.contrastLevel
      });
    });

    this.contrastSlider.addEventListener('input', (e) => {
      const value = parseInt(e.target.value);
      this.settings.contrastLevel = value;
      this.contrastValue.textContent = `${value}%`;
      this.saveSettings();
      if (this.settings.highContrast) {
        this.sendMessageToContent('highContrast', {
          enabled: true,
          level: value
        });
      }
    });

    // TTS controls
    this.hoverToSpeakToggle.addEventListener('change', (e) => {
      this.settings.hoverToSpeak = e.target.checked;
      this.saveSettings();
      this.sendMessageToContent('hoverToSpeak', e.target.checked);
    });

    this.voiceSelect.addEventListener('change', (e) => {
      this.settings.ttsVoice = e.target.value;
      this.saveSettings();
      this.sendMessageToContent('updateTTSSettings', {
        voice: e.target.value,
        rate: this.settings.ttsRate,
        pitch: this.settings.ttsPitch,
        volume: this.settings.ttsVolume
      });
    });

    this.playBtn.addEventListener('click', () => {
      this.playTTS();
    });

    this.pauseBtn.addEventListener('click', () => {
      this.pauseTTS();
    });

    this.stopBtn.addEventListener('click', () => {
      this.stopTTS();
    });

    // TTS sliders
    this.speechRateSlider.addEventListener('input', (e) => {
      const value = parseFloat(e.target.value);
      this.settings.ttsRate = value;
      this.rateValue.textContent = `${value.toFixed(1)}x`;
      this.saveSettings();
      this.sendMessageToContent('updateTTSSettings', {
        voice: this.settings.ttsVoice,
        rate: value,
        pitch: this.settings.ttsPitch,
        volume: this.settings.ttsVolume
      });
    });

    this.speechPitchSlider.addEventListener('input', (e) => {
      const value = parseFloat(e.target.value);
      this.settings.ttsPitch = value;
      this.pitchValue.textContent = `${value.toFixed(1)}x`;
      this.saveSettings();
      this.sendMessageToContent('updateTTSSettings', {
        voice: this.settings.ttsVoice,
        rate: this.settings.ttsRate,
        pitch: value,
        volume: this.settings.ttsVolume
      });
    });

    this.speechVolumeSlider.addEventListener('input', (e) => {
      const value = parseFloat(e.target.value);
      this.settings.ttsVolume = value;
      this.volumeValue.textContent = `${Math.round(value * 100)}%`;
      this.saveSettings();
      this.sendMessageToContent('updateTTSSettings', {
        voice: this.settings.ttsVoice,
        rate: this.settings.ttsRate,
        pitch: this.settings.ttsPitch,
        volume: value
      });
    });

    // Close button
    this.closeBtn.addEventListener('click', () => {
      window.close();
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        window.close();
      }
    });
  }

  changeTextSize(direction) {
    const sizes = ['small', 'medium', 'large', 'xl'];
    const currentIndex = sizes.indexOf(this.settings.textSize);
    const newIndex = Math.max(0, Math.min(sizes.length - 1, currentIndex + direction));
    
    if (newIndex !== currentIndex) {
      this.settings.textSize = sizes[newIndex];
      this.textSizeSelect.value = this.settings.textSize;
      this.saveSettings();
      this.sendMessageToContent('textSize', this.settings.textSize);
    }
  }

  updateUI() {
    // Update visual settings
    this.dyslexiaFontToggle.checked = this.settings.dyslexiaFont;
    this.darkModeToggle.checked = this.settings.darkMode;
    this.textSizeSelect.value = this.settings.textSize;
    this.colorFilterSelect.value = this.settings.colorBlindFilter;
    this.highContrastToggle.checked = this.settings.highContrast;
    this.contrastSlider.value = this.settings.contrastLevel;
    this.contrastValue.textContent = `${this.settings.contrastLevel}%`;
    this.contrastContainer.classList.toggle('visible', this.settings.highContrast);

    // Update TTS settings
    this.hoverToSpeakToggle.checked = this.settings.hoverToSpeak;
    this.speechRateSlider.value = this.settings.ttsRate;
    this.speechPitchSlider.value = this.settings.ttsPitch;
    this.speechVolumeSlider.value = this.settings.ttsVolume;
    this.rateValue.textContent = `${this.settings.ttsRate.toFixed(1)}x`;
    this.pitchValue.textContent = `${this.settings.ttsPitch.toFixed(1)}x`;
    this.volumeValue.textContent = `${Math.round(this.settings.ttsVolume * 100)}%`;
  }

  async sendMessageToContent(action, value) {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab || !tab.id || !tab.url ||
          tab.url.startsWith('chrome://') ||
          tab.url.startsWith('chrome-extension://') ||
          tab.url.startsWith('https://chrome.google.com/webstore')) {
        // Show a user-friendly message in the popup
        this.showUnavailableMessage();
        return;
      }
      await chrome.tabs.sendMessage(tab.id, { action, value });
    } catch (error) {
      console.error('Error sending message to content script:', error);
      this.showUnavailableMessage();
    }
  }

  showUnavailableMessage() {
    // Remove any existing message
    let msg = document.getElementById('unavailable-message');
    if (!msg) {
      msg = document.createElement('div');
      msg.id = 'unavailable-message';
      msg.style.background = 'var(--color-error, #EF5350)';
      msg.style.color = '#fff';
      msg.style.padding = '12px';
      msg.style.margin = '12px 0';
      msg.style.borderRadius = '8px';
      msg.style.textAlign = 'center';
      msg.style.fontWeight = '600';
      msg.textContent = 'Accessibility features are not available on this page.';
      const container = document.querySelector('.popup-content') || document.body;
      container.prepend(msg);
    }
  }

  async playTTS() {
    if (!this.speechSynthesis) return;

    try {
      if (this.isPaused && this.currentUtterance) {
        this.speechSynthesis.resume();
        this.isPaused = false;
        this.updateTTSButtons();
        return;
      }

      // Get content from active tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab) return;

      const response = await chrome.tabs.sendMessage(tab.id, { action: 'getContent' });
      const content = response?.content || '';

      if (!content.trim()) {
        console.warn('No content found to read');
        return;
      }

      // Stop any existing speech
      this.speechSynthesis.cancel();

      // Create new utterance
      this.currentUtterance = new SpeechSynthesisUtterance(content);
      
      // Set voice if selected
      if (this.settings.ttsVoice && this.voices[this.settings.ttsVoice]) {
        this.currentUtterance.voice = this.voices[this.settings.ttsVoice];
      }

      // Set speech parameters
      this.currentUtterance.rate = this.settings.ttsRate;
      this.currentUtterance.pitch = this.settings.ttsPitch;
      this.currentUtterance.volume = this.settings.ttsVolume;

      // Event handlers
      this.currentUtterance.onstart = () => {
        this.isPlaying = true;
        this.isPaused = false;
        this.updateTTSButtons();
      };

      this.currentUtterance.onend = () => {
        this.isPlaying = false;
        this.isPaused = false;
        this.currentUtterance = null;
        this.updateTTSButtons();
      };

      this.currentUtterance.onerror = (event) => {
        console.error('Speech synthesis error:', event);
        this.isPlaying = false;
        this.isPaused = false;
        this.currentUtterance = null;
        this.updateTTSButtons();
      };

      // Start speaking
      this.speechSynthesis.speak(this.currentUtterance);

    } catch (error) {
      console.error('Error playing TTS:', error);
    }
  }

  pauseTTS() {
    if (!this.speechSynthesis || !this.isPlaying) return;

    if (this.isPaused) {
      this.speechSynthesis.resume();
      this.isPaused = false;
    } else {
      this.speechSynthesis.pause();
      this.isPaused = true;
    }
    
    this.updateTTSButtons();
  }

  stopTTS() {
    if (!this.speechSynthesis) return;

    this.speechSynthesis.cancel();
    this.isPlaying = false;
    this.isPaused = false;
    this.currentUtterance = null;
    this.updateTTSButtons();
  }

  updateTTSButtons() {
    this.playBtn.classList.toggle('active', this.isPlaying && !this.isPaused);
    this.pauseBtn.classList.toggle('active', this.isPaused);
    
    // Update button text
    this.pauseBtn.querySelector('.btn-icon').textContent = this.isPaused ? '▶' : '⏸';
  }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new AccessibilityPopup();
});