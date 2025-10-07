// Prevent multiple injections by checking if already initialized
if (window.accessibilityContentScriptLoaded) {
  console.debug('Accessibility content script already loaded');
} else {
  window.accessibilityContentScriptLoaded = true;

  class AccessibilityContentScript {
    constructor() {
      this.settings = {};
      this.styleElement = null;
      this.hoverToSpeakEnabled = false;
      this.currentHoverElement = null;
      this.hoverTimeout = null;
      this.speechSynthesis = null;
      this.currentUtterance = null;
      this.ttsSettings = {
        voice: '',
        rate: 1,
        pitch: 1,
        volume: 1
      };
      this.init();
    }

    async init() {
      await this.loadSettings();
      this.createStyleElement();
      this.applyAllSettings();
      this.setupMessageListener();
      this.initializeTTS();
      this.setupHoverToSpeak();
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
          'accessibility-hover-to-speak',
          'accessibility-tts-voice',
          'accessibility-tts-rate',
          'accessibility-tts-pitch',
          'accessibility-tts-volume'
        ]);

        this.settings = {
          dyslexiaFont: result['accessibility-dyslexiaFont'] || false,
          darkMode: result['accessibility-darkMode'] || false,
          textSize: result['accessibility-textSize'] || 'medium',
          colorBlindFilter: result['accessibility-colorBlindFilter'] || 'none',
          highContrast: result['accessibility-highContrast'] || false,
          contrastLevel: result['accessibility-contrastLevel'] || 150
        };

        this.hoverToSpeakEnabled = result['accessibility-hover-to-speak'] || false;
        this.ttsSettings = {
          voice: result['accessibility-tts-voice'] || '',
          rate: result['accessibility-tts-rate'] || 1,
          pitch: result['accessibility-tts-pitch'] || 1,
          volume: result['accessibility-tts-volume'] || 1
        };
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    }

    createStyleElement() {
      // Remove existing style element if it exists
      const existingStyle = document.getElementById('accessibility-styles');
      if (existingStyle) {
        existingStyle.remove();
      }

      // Create new style element
      this.styleElement = document.createElement('style');
      this.styleElement.id = 'accessibility-styles';
      this.styleElement.type = 'text/css';
      document.head.appendChild(this.styleElement);
    }

    applyAllSettings() {
      this.applyDyslexiaFont(this.settings.dyslexiaFont);
      this.applyDarkMode(this.settings.darkMode);
      this.applyTextSize(this.settings.textSize);
      this.applyColorBlindFilter(this.settings.colorBlindFilter);
      this.applyHighContrast({
        enabled: this.settings.highContrast,
        level: this.settings.contrastLevel
      });
    }

    setupMessageListener() {
      // Remove existing listener if it exists
      if (window.accessibilityMessageListener) {
        chrome.runtime.onMessage.removeListener(window.accessibilityMessageListener);
      }

      window.accessibilityMessageListener = (message, sender, sendResponse) => {
        try {
          switch (message.action) {
            case 'dyslexiaFont':
              this.applyDyslexiaFont(message.value);
              break;
            case 'darkMode':
              this.applyDarkMode(message.value);
              break;
            case 'textSize':
              this.applyTextSize(message.value);
              break;
            case 'colorBlindFilter':
              this.applyColorBlindFilter(message.value);
              break;
            case 'highContrast':
              this.applyHighContrast(message.value);
              break;
            case 'hoverToSpeak':
              this.hoverToSpeakEnabled = message.value;
              this.setupHoverToSpeak();
              break;
            case 'updateTTSSettings':
              this.ttsSettings = { ...this.ttsSettings, ...message.value };
              break;
            case 'applyAllSettings':
              if (message.settings) {
                this.settings = {
                  dyslexiaFont: message.settings['accessibility-dyslexiaFont'] || false,
                  darkMode: message.settings['accessibility-darkMode'] || false,
                  textSize: message.settings['accessibility-textSize'] || 'medium',
                  colorBlindFilter: message.settings['accessibility-colorBlindFilter'] || 'none',
                  highContrast: message.settings['accessibility-highContrast'] || false,
                  contrastLevel: message.settings['accessibility-contrastLevel'] || 150
                };
                this.applyAllSettings();
              }
              break;
            case 'getContent':
              const content = this.extractMainContent();
              sendResponse({ content });
              return true; // Keep message channel open for async response
          }
        } catch (error) {
          console.error('Error handling message:', error);
        }
      };

      chrome.runtime.onMessage.addListener(window.accessibilityMessageListener);
    }

    applyDyslexiaFont(enabled) {
      const css = enabled ? `
        *, *::before, *::after {
          font-family: 'Comic Sans MS', cursive, sans-serif !important;
          letter-spacing: 0.05em !important;
          line-height: 1.6 !important;
        }
        
        h1, h2, h3, h4, h5, h6 {
          font-weight: bold !important;
        }
      ` : '';
      
      this.updateStyles('dyslexia', css);
    }

    applyDarkMode(enabled) {
      const css = enabled ? `
        html {
          filter: invert(1) hue-rotate(180deg) !important;
        }
        
        img, video, iframe, canvas, svg, embed, object {
          filter: invert(1) hue-rotate(180deg) !important;
        }
        
        [style*="background-image"] {
          filter: invert(1) hue-rotate(180deg) !important;
        }
        
        /* Preserve some elements that shouldn't be inverted */
        [data-accessibility-preserve] {
          filter: none !important;
        }
      ` : '';
      
      this.updateStyles('darkMode', css);
    }

    applyTextSize(size) {
      const sizeMap = {
        small: '14px',
        medium: '16px',
        large: '18px',
        xl: '20px'
      };

      const baseFontSize = sizeMap[size] || '16px';
      const css = `
        html {
          font-size: ${baseFontSize} !important;
        }
        
        body {
          font-size: 1rem !important;
        }
        
        h1 { font-size: 2.5rem !important; }
        h2 { font-size: 2rem !important; }
        h3 { font-size: 1.75rem !important; }
        h4 { font-size: 1.5rem !important; }
        h5 { font-size: 1.25rem !important; }
        h6 { font-size: 1.125rem !important; }
        
        p, div, span, a, li {
          font-size: inherit !important;
        }
      `;
      
      this.updateStyles('textSize', css);
    }

    applyColorBlindFilter(filter) {
      const filterMap = {
        none: '',
        protanopia: 'sepia(100%) saturate(50%) hue-rotate(320deg)',
        deuteranopia: 'sepia(100%) saturate(60%) hue-rotate(60deg)',
        tritanopia: 'sepia(100%) saturate(80%) hue-rotate(180deg)'
      };

      const filterValue = filterMap[filter] || '';
      const css = filterValue ? `
        html {
          filter: ${filterValue} !important;
        }
      ` : '';
      
      this.updateStyles('colorBlind', css);
    }

    applyHighContrast(options) {
      const { enabled, level } = options;
      const css = enabled ? `
        html {
          filter: contrast(${level}%) !important;
        }
      ` : '';
      
      this.updateStyles('highContrast', css);
    }

    updateStyles(category, css) {
      if (!this.styleElement) return;

      // Store styles by category to avoid conflicts
      if (!this.styleElement.stylesByCategory) {
        this.styleElement.stylesByCategory = {};
      }
      
      this.styleElement.stylesByCategory[category] = css;
      
      // Combine all styles
      const allStyles = Object.values(this.styleElement.stylesByCategory).join('\n');
      this.styleElement.textContent = allStyles;
    }

    extractMainContent() {
      // Priority selectors for main content
      const contentSelectors = [
        'article',
        'main',
        '[role="main"]',
        '.content',
        '#content',
        '.post-content',
        '.entry-content',
        '.article-content',
        '.story-body',
        '.post-body'
      ];

      // Selectors to exclude
      const excludeSelectors = [
        'nav',
        'header',
        'footer',
        'aside',
        '.sidebar',
        '.advertisement',
        '.ad',
        '.ads',
        '.social-share',
        '.comments',
        '.related-posts',
        'script',
        'style',
        'noscript'
      ];

      let content = '';

      // Try to find main content area
      for (const selector of contentSelectors) {
        const element = document.querySelector(selector);
        if (element) {
          content = this.extractTextFromElement(element, excludeSelectors);
          if (content.trim().length > 100) { // Ensure we have substantial content
            break;
          }
        }
      }

      // Fallback to body if no main content found
      if (!content.trim()) {
        content = this.extractTextFromElement(document.body, excludeSelectors);
      }

      // Clean up the content
      content = content
        .replace(/\s+/g, ' ') // Normalize whitespace
        .replace(/\n\s*\n/g, '\n') // Remove empty lines
        .trim();

      return content;
    }

    extractTextFromElement(element, excludeSelectors) {
      if (!element) return '';

      // Clone the element to avoid modifying the original
      const clone = element.cloneNode(true);

      // Remove excluded elements
      excludeSelectors.forEach(selector => {
        const excludedElements = clone.querySelectorAll(selector);
        excludedElements.forEach(el => el.remove());
      });

      // Get text content
      let text = clone.textContent || '';

      // Clean up common issues
      text = text
        .replace(/\s+/g, ' ') // Normalize whitespace
        .replace(/\n\s*/g, '\n') // Clean up line breaks
        .trim();

      return text;
    }

    initializeTTS() {
      if ('speechSynthesis' in window) {
        this.speechSynthesis = window.speechSynthesis;
      }
    }

    setupHoverToSpeak() {
      // Remove existing event listeners if any
      if (this.hoverToSpeakEnabled) {
        this.addHoverListeners();
      } else {
        this.removeHoverListeners();
      }
      
      // Set up keyboard shortcut (Ctrl+Shift+H) to toggle hover-to-speak
      this.setupKeyboardShortcuts();
    }

    setupKeyboardShortcuts() {
      document.addEventListener('keydown', (event) => {
        // Ctrl+Shift+H to toggle hover-to-speak
        if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === 'h') {
          event.preventDefault();
          this.toggleHoverToSpeak();
        }
        
        // Escape key to stop current speech
        if (event.key === 'Escape' && this.currentUtterance) {
          this.stopHoverSpeech();
        }
      });
    }

    toggleHoverToSpeak() {
      this.hoverToSpeakEnabled = !this.hoverToSpeakEnabled;
      
      // Save the setting
      chrome.storage.sync.set({
        'accessibility-hover-to-speak': this.hoverToSpeakEnabled
      });
      
      // Apply the change
      this.setupHoverToSpeak();
      
      // Show a brief notification
      this.showNotification(`Hover to Speak ${this.hoverToSpeakEnabled ? 'Enabled' : 'Disabled'}`);
    }

    showNotification(message) {
      // Create a simple notification
      const notification = document.createElement('div');
      notification.style.cssText = `
        position: fixed !important;
        top: 20px !important;
        right: 20px !important;
        background: #4FC3F7 !important;
        color: white !important;
        padding: 12px 20px !important;
        border-radius: 8px !important;
        font-family: Arial, sans-serif !important;
        font-size: 14px !important;
        font-weight: 600 !important;
        z-index: 2147483647 !important;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3) !important;
        transition: all 0.3s ease !important;
      `;
      notification.textContent = message;
      
      document.body.appendChild(notification);
      
      // Remove after 3 seconds
      setTimeout(() => {
        if (notification.parentNode) {
          notification.style.opacity = '0';
          notification.style.transform = 'translateY(-20px)';
          setTimeout(() => {
            if (notification.parentNode) {
              notification.parentNode.removeChild(notification);
            }
          }, 300);
        }
      }, 3000);
    }

    addHoverListeners() {
      // Target elements that typically contain readable text
      const textElements = 'p, h1, h2, h3, h4, h5, h6, span, div, a, li, td, th, blockquote, article, section';
      
      document.addEventListener('mouseover', this.handleMouseOver.bind(this), true);
      document.addEventListener('mouseout', this.handleMouseOut.bind(this), true);
    }

    removeHoverListeners() {
      document.removeEventListener('mouseover', this.handleMouseOver.bind(this), true);
      document.removeEventListener('mouseout', this.handleMouseOut.bind(this), true);
      
      // Clear any pending hover timeout
      if (this.hoverTimeout) {
        clearTimeout(this.hoverTimeout);
        this.hoverTimeout = null;
      }
      
      // Stop any current speech
      this.stopHoverSpeech();
      
      // Remove hover highlighting
      this.removeHoverHighlight();
    }

    handleMouseOver(event) {
      if (!this.hoverToSpeakEnabled) return;

      const element = event.target;
      
      // Skip if element is not suitable for reading
      if (!this.isReadableElement(element)) return;

      // Don't re-trigger on the same element
      if (this.currentHoverElement === element) return;

      // Clear any existing timeout
      if (this.hoverTimeout) {
        clearTimeout(this.hoverTimeout);
      }

      // Stop any current speech
      this.stopHoverSpeech();

      // Remove previous highlighting
      this.removeHoverHighlight();

      // Set the current hover element
      this.currentHoverElement = element;

      // Add hover delay to prevent accidental triggering
      this.hoverTimeout = setTimeout(() => {
        if (this.currentHoverElement === element && document.contains(element)) {
          this.speakElementText(element);
          this.addHoverHighlight(element);
        }
      }, 500); // 500ms delay
    }

    handleMouseOut(event) {
      if (!this.hoverToSpeakEnabled) return;

      const element = event.target;
      
      if (this.currentHoverElement === element) {
        // Clear the timeout if mouse leaves before delay
        if (this.hoverTimeout) {
          clearTimeout(this.hoverTimeout);
          this.hoverTimeout = null;
        }

        // Stop speaking and remove highlight
        this.stopHoverSpeech();
        this.removeHoverHighlight();
        this.currentHoverElement = null;
      }
    }

    isReadableElement(element) {
      // Skip if element has no text content
      const text = this.getElementText(element);
      if (!text || text.trim().length < 3) return false;

      // Skip certain element types
      const tagName = element.tagName.toLowerCase();
      const skipTags = ['script', 'style', 'noscript', 'iframe', 'canvas', 'svg', 'input', 'button', 'select', 'textarea', 'nav', 'header', 'footer'];
      if (skipTags.includes(tagName)) return false;

      // Skip elements with certain classes or roles that are likely decorative
      const skipClasses = ['ad', 'advertisement', 'social-share', 'breadcrumb', 'pagination', 'menu', 'navbar'];
      const elementClasses = element.className.toLowerCase();
      if (skipClasses.some(skipClass => elementClasses.includes(skipClass))) return false;

      // Skip if element is hidden
      const style = window.getComputedStyle(element);
      if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return false;

      // Skip if element is too small (likely decorative)
      const rect = element.getBoundingClientRect();
      if (rect.width < 10 || rect.height < 10) return false;

      // Skip if text is just numbers or single characters (likely UI elements)
      if (/^\d+$/.test(text.trim()) || text.trim().length === 1) return false;

      return true;
    }

    getElementText(element) {
      // Get text content, but prioritize certain attributes for links and images
      let text = '';
      
      if (element.tagName.toLowerCase() === 'img') {
        text = element.alt || element.title || '';
      } else if (element.tagName.toLowerCase() === 'a') {
        text = element.textContent.trim() || element.title || element.href;
      } else {
        // For other elements, get direct text content (not from children)
        text = element.childNodes.length > 0 ? 
          Array.from(element.childNodes)
            .filter(node => node.nodeType === Node.TEXT_NODE)
            .map(node => node.textContent.trim())
            .join(' ') : '';
        
        // If no direct text, get all text content
        if (!text.trim()) {
          text = element.textContent.trim();
        }
      }

      return text.trim();
    }

    speakElementText(element) {
      if (!this.speechSynthesis) return;

      const text = this.getElementText(element);
      if (!text || text.length < 3) return;

      // Stop any current speech
      this.speechSynthesis.cancel();

      // Create utterance
      this.currentUtterance = new SpeechSynthesisUtterance(text);
      
      // Apply TTS settings
      this.currentUtterance.rate = this.ttsSettings.rate;
      this.currentUtterance.pitch = this.ttsSettings.pitch;
      this.currentUtterance.volume = this.ttsSettings.volume;

      // Set voice if specified
      if (this.ttsSettings.voice) {
        const voices = this.speechSynthesis.getVoices();
        const selectedVoice = voices[this.ttsSettings.voice];
        if (selectedVoice) {
          this.currentUtterance.voice = selectedVoice;
        }
      }

      // Speak the text
      this.speechSynthesis.speak(this.currentUtterance);
    }

    stopHoverSpeech() {
      if (this.speechSynthesis) {
        this.speechSynthesis.cancel();
      }
      this.currentUtterance = null;
    }

    addHoverHighlight(element) {
      element.classList.add('accessibility-hover-speak-active');
    }

    removeHoverHighlight() {
      const highlighted = document.querySelectorAll('.accessibility-hover-speak-active');
      highlighted.forEach(el => el.classList.remove('accessibility-hover-speak-active'));
    }
  }

  // Initialize content script
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.accessibilityInstance = new AccessibilityContentScript();
    });
  } else {
    window.accessibilityInstance = new AccessibilityContentScript();
  }
}