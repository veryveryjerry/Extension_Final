// Background script for UniAccess

class AccessibilityBackground {
  constructor() {
    this.init();
  }

  init() {
    // Handle extension installation
    chrome.runtime.onInstalled.addListener((details) => {
      this.handleInstallation(details);
    });

    // Handle tab updates to apply settings
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      this.handleTabUpdate(tabId, changeInfo, tab);
    });

    // Handle messages from popup and content scripts
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sender, sendResponse);
    });
  }

  handleInstallation(details) {
    if (details.reason === 'install') {
      console.log('UniAccess installed');
      this.setDefaultSettings();
    } else if (details.reason === 'update') {
      console.log('UniAccess updated');
      this.migrateSettings();
    }
  }

  async setDefaultSettings() {
    const defaultSettings = {
      'accessibility-dyslexiaFont': false,
      'accessibility-darkMode': false,
      'accessibility-textSize': 'medium',
      'accessibility-colorBlindFilter': 'none',
      'accessibility-highContrast': false,
      'accessibility-contrastLevel': 150,
      'accessibility-tts-voice': '',
      'accessibility-tts-rate': 1,
      'accessibility-tts-pitch': 1,
      'accessibility-tts-volume': 1
    };

    try {
      await chrome.storage.sync.set(defaultSettings);
      console.log('Default accessibility settings initialized');
    } catch (error) {
      console.error('Error setting default settings:', error);
    }
  }

  async migrateSettings() {
    // Handle settings migration for future updates
    try {
      const currentSettings = await chrome.storage.sync.get();
      let needsMigration = false;

      // Example migration logic (can be expanded for future versions)
      if (!currentSettings.hasOwnProperty('accessibility-contrastLevel')) {
        currentSettings['accessibility-contrastLevel'] = 150;
        needsMigration = true;
      }

      if (needsMigration) {
        await chrome.storage.sync.set(currentSettings);
        console.log('Settings migrated successfully');
      }
    } catch (error) {
      console.error('Error migrating settings:', error);
    }
  }

  async handleTabUpdate(tabId, changeInfo, tab) {
    // Apply accessibility settings when a page is loaded
    if (changeInfo.status === 'complete' && tab.url && !tab.url.startsWith('chrome://')) {
      try {
        // Wait a moment for content script to initialize
        setTimeout(() => {
          this.applySettingsToTab(tabId);
        }, 500); // Increased delay to ensure content script is ready
      } catch (error) {
        console.error('Error applying settings to tab:', error);
      }
    }
  }

  async applySettingsToTab(tabId) {
    try {
      const settings = await chrome.storage.sync.get([
        'accessibility-dyslexiaFont',
        'accessibility-darkMode',
        'accessibility-textSize',
        'accessibility-colorBlindFilter',
        'accessibility-highContrast',
        'accessibility-contrastLevel'
      ]);

      // Send settings to content script
      await chrome.tabs.sendMessage(tabId, {
        action: 'applyAllSettings',
        settings: settings
      });
    } catch (error) {
      // Silently fail if content script is not ready or tab is not accessible
      console.debug('Could not apply settings to tab:', tabId, error.message);
    }
  }

  handleMessage(message, sender, sendResponse) {
    try {
      switch (message.action) {
        case 'getSettings':
          this.getSettings().then(sendResponse);
          return true; // Keep message channel open
        
        case 'saveSettings':
          this.saveSettings(message.settings).then(sendResponse);
          return true;
        
        case 'resetSettings':
          this.resetSettings().then(sendResponse);
          return true;
        
        default:
          break;
      }
    } catch (error) {
      console.error('Error handling message:', error);
      sendResponse({ error: error.message });
    }
  }

  async getSettings() {
    try {
      const settings = await chrome.storage.sync.get([
        'accessibility-dyslexiaFont',
        'accessibility-darkMode',
        'accessibility-textSize',
        'accessibility-colorBlindFilter',
        'accessibility-highContrast',
        'accessibility-contrastLevel',
        'accessibility-tts-voice',
        'accessibility-tts-rate',
        'accessibility-tts-pitch',
        'accessibility-tts-volume'
      ]);
      return { success: true, settings };
    } catch (error) {
      console.error('Error getting settings:', error);
      return { success: false, error: error.message };
    }
  }

  async saveSettings(settings) {
    try {
      await chrome.storage.sync.set(settings);
      return { success: true };
    } catch (error) {
      console.error('Error saving settings:', error);
      return { success: false, error: error.message };
    }
  }

  async resetSettings() {
    try {
      await this.setDefaultSettings();
      return { success: true };
    } catch (error) {
      console.error('Error resetting settings:', error);
      return { success: false, error: error.message };
    }
  }
}

// Initialize background script
new AccessibilityBackground();