/**
 * Un-American-iser Popup JavaScript
 * Handles popup interface and quick settings
 */

class PopupManager {
    constructor() {
        this.defaultSettings = {
            temperature: true,
            distance: true,
            speed: true,
            weight: true,
            dates: true,
            brands: true
        };

        this.init();
    }

    async init() {
        await this.loadSettings();
        await this.checkPageStatus();
        this.bindEvents();
    }

    /**
     * Load settings from Chrome storage and update popup UI
     */
    async loadSettings() {
        try {
            const result = await chrome.storage.sync.get(this.defaultSettings);

            // Update popup toggles based on stored settings
            Object.keys(this.defaultSettings).forEach(key => {
                const checkbox = document.getElementById(`popup-${key}`);
                if (checkbox) {
                    checkbox.checked = result[key];
                }
            });

        } catch (error) {
            console.error('Error loading settings:', error);
        }
    }

    /**
     * Save settings when toggles are changed
     */
    async saveSettings() {
        try {
            const settings = {};

            // Get current checkbox states
            Object.keys(this.defaultSettings).forEach(key => {
                const checkbox = document.getElementById(`popup-${key}`);
                if (checkbox) {
                    settings[key] = checkbox.checked;
                }
            });

            // Save to Chrome storage
            await chrome.storage.sync.set(settings);

            // Notify content scripts of setting changes
            this.notifyContentScripts();

        } catch (error) {
            console.error('Error saving settings:', error);
        }
    }

    /**
     * Check if the extension is active on the current page
     */
    async checkPageStatus() {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

            if (!tab) return;

            // Check if the page is a valid web page (not chrome:// or extension pages)
            const isValidPage = tab.url &&
                (tab.url.startsWith('http://') || tab.url.startsWith('https://'));

            const statusDot = document.getElementById('status-dot');
            const statusText = document.getElementById('status-text');

            if (isValidPage) {
                statusDot.classList.add('active');
                statusText.textContent = 'Active on this page';
            } else {
                statusDot.classList.remove('active');
                statusText.textContent = 'Not available on this page';
            }

        } catch (error) {
            console.error('Error checking page status:', error);
            const statusDot = document.getElementById('status-dot');
            const statusText = document.getElementById('status-text');
            statusDot.classList.remove('active');
            statusText.textContent = 'Status unknown';
        }
    }

    /**
     * Notify all content scripts that settings have changed
     */
    async notifyContentScripts() {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

            if (tab) {
                chrome.tabs.sendMessage(tab.id, {
                    action: 'settingsChanged'
                }).catch(() => {
                    // Ignore errors for tabs that don't have our content script
                });
            }
        } catch (error) {
            console.error('Error notifying content scripts:', error);
        }
    }

    /**
     * Refresh the current page
     */
    async refreshPage() {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

            if (tab) {
                await chrome.tabs.reload(tab.id);
                window.close(); // Close popup after refreshing
            }
        } catch (error) {
            console.error('Error refreshing page:', error);
        }
    }

    /**
     * Open the full options page
     */
    openOptionsPage() {
        chrome.runtime.openOptionsPage();
        window.close(); // Close popup after opening options
    }

    /**
     * Bind event listeners
     */
    bindEvents() {
        // Quick toggle checkboxes
        Object.keys(this.defaultSettings).forEach(key => {
            const checkbox = document.getElementById(`popup-${key}`);
            if (checkbox) {
                checkbox.addEventListener('change', () => {
                    this.saveSettings();
                });
            }
        });

        // Refresh page button
        const refreshBtn = document.getElementById('refresh-page');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.refreshPage());
        }

        // Open options button
        const optionsBtn = document.getElementById('open-options');
        if (optionsBtn) {
            optionsBtn.addEventListener('click', () => this.openOptionsPage());
        }
    }
}

// Initialize popup manager when page loads
document.addEventListener('DOMContentLoaded', () => {
    new PopupManager();
});
