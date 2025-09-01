/**
 * Un-American-iser Options Page JavaScript
 * Handles saving and loading user preferences
 */

class OptionsManager {
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
        this.bindEvents();
    }

    /**
     * Load settings from Chrome storage and update UI
     */
    async loadSettings() {
        try {
            const result = await chrome.storage.sync.get(this.defaultSettings);

            // Update checkboxes based on stored settings
            Object.keys(this.defaultSettings).forEach(key => {
                const checkbox = document.getElementById(key);
                if (checkbox) {
                    checkbox.checked = result[key];
                }
            });

            console.log('Settings loaded:', result);
        } catch (error) {
            console.error('Error loading settings:', error);
            this.showMessage('Error loading settings', 'error');
        }
    }

    /**
     * Save current settings to Chrome storage
     */
    async saveSettings() {
        try {
            const settings = {};

            // Get current checkbox states
            Object.keys(this.defaultSettings).forEach(key => {
                const checkbox = document.getElementById(key);
                if (checkbox) {
                    settings[key] = checkbox.checked;
                }
            });

            // Save to Chrome storage
            await chrome.storage.sync.set(settings);

            console.log('Settings saved:', settings);
            this.showMessage('Settings saved successfully!', 'success');

            // Notify content scripts of setting changes
            this.notifyContentScripts();

        } catch (error) {
            console.error('Error saving settings:', error);
            this.showMessage('Error saving settings', 'error');
        }
    }

    /**
     * Reset settings to defaults
     */
    async resetSettings() {
        try {
            // Update checkboxes to default values
            Object.keys(this.defaultSettings).forEach(key => {
                const checkbox = document.getElementById(key);
                if (checkbox) {
                    checkbox.checked = this.defaultSettings[key];
                }
            });

            // Save defaults to storage
            await chrome.storage.sync.set(this.defaultSettings);

            console.log('Settings reset to defaults');
            this.showMessage('Settings reset to defaults', 'success');

            // Notify content scripts of setting changes
            this.notifyContentScripts();

        } catch (error) {
            console.error('Error resetting settings:', error);
            this.showMessage('Error resetting settings', 'error');
        }
    }

    /**
     * Notify all content scripts that settings have changed
     */
    async notifyContentScripts() {
        try {
            const tabs = await chrome.tabs.query({});

            tabs.forEach(tab => {
                chrome.tabs.sendMessage(tab.id, {
                    action: 'settingsChanged'
                }).catch(() => {
                    // Ignore errors for tabs that don't have our content script
                });
            });
        } catch (error) {
            console.error('Error notifying content scripts:', error);
        }
    }

    /**
     * Show status message to user
     */
    showMessage(message, type = 'success') {
        const statusElement = document.getElementById('status-message');
        if (!statusElement) return;

        statusElement.textContent = message;
        statusElement.className = `status-message ${type}`;

        // Hide message after 3 seconds
        setTimeout(() => {
            statusElement.style.opacity = '0';
            setTimeout(() => {
                statusElement.className = 'status-message';
            }, 300);
        }, 3000);
    }

    /**
     * Bind event listeners
     */
    bindEvents() {
        // Save button
        const saveBtn = document.getElementById('save-btn');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => this.saveSettings());
        }

        // Reset button
        const resetBtn = document.getElementById('reset-btn');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                if (confirm('Are you sure you want to reset all settings to defaults?')) {
                    this.resetSettings();
                }
            });
        }

        // Auto-save when checkboxes change
        Object.keys(this.defaultSettings).forEach(key => {
            const checkbox = document.getElementById(key);
            if (checkbox) {
                checkbox.addEventListener('change', () => {
                    // Auto-save with a small delay to allow for multiple quick changes
                    clearTimeout(this.autoSaveTimeout);
                    this.autoSaveTimeout = setTimeout(() => {
                        this.saveSettings();
                    }, 500);
                });
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                this.saveSettings();
            }
        });
    }
}

// Initialize options manager when page loads
document.addEventListener('DOMContentLoaded', () => {
    new OptionsManager();
});
