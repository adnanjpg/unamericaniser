/**
 * Un-American-iser Background Script
 * Handles extension lifecycle and initialization
 */

class BackgroundManager {
    constructor() {
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.initializeSettings();
    }

    /**
     * Set up Chrome extension event listeners
     */
    setupEventListeners() {
        // Handle extension installation
        chrome.runtime.onInstalled.addListener((details) => {
            this.handleInstallation(details);
        });

        // Handle messages from content scripts and popup
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            this.handleMessage(message, sender, sendResponse);
            return true; // Keep message channel open for async responses
        });

        // Handle tab updates to re-inject content script if needed
        chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
            if (changeInfo.status === 'complete' && tab.url) {
                this.handleTabUpdate(tabId, tab);
            }
        });
    }

    /**
     * Handle extension installation and updates
     */
    async handleInstallation(details) {
        console.log('Un-American-iser installed/updated:', details.reason);

        try {
            // Set default settings on first install
            if (details.reason === 'install') {
                const defaultSettings = {
                    temperature: true,
                    distance: true,
                    speed: true,
                    weight: true,
                    dates: true,
                    brands: true
                };

                await chrome.storage.sync.set(defaultSettings);
                console.log('Default settings initialized');

                // Open options page on first install
                chrome.runtime.openOptionsPage();
            }

            // Handle updates
            if (details.reason === 'update') {
                console.log(`Updated from version ${details.previousVersion} to ${chrome.runtime.getManifest().version}`);
            }

        } catch (error) {
            console.error('Error during installation:', error);
        }
    }

    /**
     * Handle messages from other parts of the extension
     */
    async handleMessage(message, sender, sendResponse) {
        try {
            switch (message.action) {
                case 'getSettings':
                    const settings = await this.getSettings();
                    sendResponse({ success: true, settings });
                    break;

                case 'updateSettings':
                    await this.updateSettings(message.settings);
                    sendResponse({ success: true });
                    break;

                case 'checkStatus':
                    const status = await this.checkExtensionStatus(sender.tab);
                    sendResponse({ success: true, status });
                    break;

                default:
                    sendResponse({ success: false, error: 'Unknown action' });
            }
        } catch (error) {
            console.error('Error handling message:', error);
            sendResponse({ success: false, error: error.message });
        }
    }

    /**
     * Handle tab updates
     */
    async handleTabUpdate(tabId, tab) {
        try {
            // Only process valid web pages
            if (!tab.url || (!tab.url.startsWith('http://') && !tab.url.startsWith('https://'))) {
                return;
            }

            // Check if content script is already injected
            try {
                await chrome.tabs.sendMessage(tabId, { action: 'ping' });
            } catch (error) {
                // Content script not available, it will be injected automatically by manifest
                console.log('Content script will be injected automatically for:', tab.url);
            }

        } catch (error) {
            console.error('Error handling tab update:', error);
        }
    }

    /**
     * Initialize default settings if they don't exist
     */
    async initializeSettings() {
        try {
            const defaultSettings = {
                temperature: true,
                distance: true,
                speed: true,
                weight: true,
                dates: true,
                brands: true
            };

            const result = await chrome.storage.sync.get(defaultSettings);

            // Check if any settings are missing and add them
            let needsUpdate = false;
            const updatedSettings = { ...result };

            Object.keys(defaultSettings).forEach(key => {
                if (!(key in result)) {
                    updatedSettings[key] = defaultSettings[key];
                    needsUpdate = true;
                }
            });

            if (needsUpdate) {
                await chrome.storage.sync.set(updatedSettings);
                console.log('Missing settings initialized');
            }

        } catch (error) {
            console.error('Error initializing settings:', error);
        }
    }

    /**
     * Get current settings from storage
     */
    async getSettings() {
        const defaultSettings = {
            temperature: true,
            distance: true,
            speed: true,
            weight: true,
            dates: true,
            brands: true
        };

        try {
            return await chrome.storage.sync.get(defaultSettings);
        } catch (error) {
            console.error('Error getting settings:', error);
            return defaultSettings;
        }
    }

    /**
     * Update settings in storage
     */
    async updateSettings(newSettings) {
        try {
            await chrome.storage.sync.set(newSettings);
            console.log('Settings updated:', newSettings);

            // Notify all tabs about the setting changes
            const tabs = await chrome.tabs.query({});

            tabs.forEach(tab => {
                if (tab.url && (tab.url.startsWith('http://') || tab.url.startsWith('https://'))) {
                    chrome.tabs.sendMessage(tab.id, {
                        action: 'settingsChanged',
                        settings: newSettings
                    }).catch(() => {
                        // Ignore errors for tabs without content script
                    });
                }
            });

        } catch (error) {
            console.error('Error updating settings:', error);
            throw error;
        }
    }

    /**
     * Check extension status for a specific tab
     */
    async checkExtensionStatus(tab) {
        if (!tab || !tab.url) {
            return { active: false, reason: 'No tab information' };
        }

        if (!tab.url.startsWith('http://') && !tab.url.startsWith('https://')) {
            return { active: false, reason: 'Not a web page' };
        }

        try {
            await chrome.tabs.sendMessage(tab.id, { action: 'ping' });
            return { active: true, reason: 'Extension is active' };
        } catch (error) {
            return { active: false, reason: 'Content script not loaded' };
        }
    }
}

// Initialize background manager
new BackgroundManager();
