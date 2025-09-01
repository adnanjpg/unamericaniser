/**
 * Un-American-iser Content Script
 * Scans and replaces American measurements and terms with international equivalents
 */

class UnAmericaniser {
    constructor() {
        this.settings = {
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
        this.processPage();
    }

    async loadSettings() {
        try {
            const result = await chrome.storage.sync.get(this.settings);
            this.settings = { ...this.settings, ...result };
        } catch (error) {
            console.log('Using default settings');
        }
    }

    /**
     * Conversion utility functions
     */
    conversions = {
        // Temperature: Fahrenheit to Celsius
        fahrenheitToCelsius: (f) => Math.round((f - 32) * 5 / 9),

        // Distance: Miles to Kilometers
        milesToKm: (miles) => Math.round(miles * 1.60934 * 100) / 100,

        // Weight: Pounds to Kilograms
        lbsToKg: (lbs) => Math.round(lbs * 0.453592 * 100) / 100,

        // Speed: MPH to KM/H
        mphToKmh: (mph) => Math.round(mph * 1.60934),

        // Date: MM/DD/YYYY to DD Month YYYY
        formatDate: (month, day, year) => {
            const months = [
                'January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December'
            ];
            return `${day} ${months[parseInt(month) - 1]} ${year}`;
        }
    };

    /**
     * Regex patterns for matching American formats
     */
    patterns = {
        temperature: /(\b\d+(?:\.\d+)?)\s*°?F\b/gi,
        distance: /(\b\d+(?:\.\d+)?)\s*miles?\b/gi,
        speed: /(\b\d+(?:\.\d+)?)\s*mph\b/gi,
        weight: /(\b\d+(?:\.\d+)?)\s*lbs?\b/gi,
        dates: /\b(\d{1,2})\/(\d{1,2})\/(\d{4})\b/g,
        brands: /\b(Apple|McDonald's|Walmart|Starbucks|Nike|Coca-Cola|Pepsi|KFC|Burger King|Subway)\b/gi
    };

    /**
     * Brand information mapping
     */
    brandInfo = {
        'apple': 'US tech company',
        'mcdonald\'s': 'US fast food chain',
        'walmart': 'US retail corporation',
        'starbucks': 'US coffeehouse chain',
        'nike': 'US sportswear brand',
        'coca-cola': 'US beverage company',
        'pepsi': 'US beverage company',
        'kfc': 'US fast food chain',
        'burger king': 'US fast food chain',
        'subway': 'US sandwich chain'
    };

    /**
     * Check if element should be processed
     */
    shouldProcessElement(element) {
        const excludedTags = ['SCRIPT', 'STYLE', 'TEXTAREA', 'INPUT', 'SELECT', 'OPTION'];
        const excludedTypes = ['email', 'password', 'number', 'tel', 'url'];

        if (excludedTags.includes(element.tagName)) {
            return false;
        }

        if (element.tagName === 'INPUT' && excludedTypes.includes(element.type)) {
            return false;
        }

        if (element.isContentEditable) {
            return false;
        }

        return true;
    }

    /**
     * Check if text has already been processed by looking for conversion patterns
     */
    isAlreadyProcessed(text) {
        // Check for existing conversion patterns to avoid double processing
        const conversionPatterns = [
            /\(\d+(?:\.\d+)?\s*°C\)/, // Temperature conversions
            /\(\d+(?:\.\d+)?\s*km\)/, // Distance conversions  
            /\(\d+(?:\.\d+)?\s*km\/h\)/, // Speed conversions
            /\(\d+(?:\.\d+)?\s*kg\)/, // Weight conversions
            /\(\d{1,2}\s+\w+\s+\d{4}\)/, // Date conversions
            /\(US\s+\w+.*?\)/ // Brand conversions
        ];

        return conversionPatterns.some(pattern => pattern.test(text));
    }

    /**
     * Process text content for conversions
     */
    processText(text) {
        // Skip if already processed
        if (this.isAlreadyProcessed(text)) {
            return text;
        }

        let processedText = text;

        // Temperature conversions
        if (this.settings.temperature) {
            processedText = processedText.replace(this.patterns.temperature, (match, temp) => {
                const celsius = this.conversions.fahrenheitToCelsius(parseFloat(temp));
                return `${match} (${celsius}°C)`;
            });
        }

        // Distance conversions
        if (this.settings.distance) {
            processedText = processedText.replace(this.patterns.distance, (match, distance) => {
                const km = this.conversions.milesToKm(parseFloat(distance));
                return `${match} (${km} km)`;
            });
        }

        // Speed conversions
        if (this.settings.speed) {
            processedText = processedText.replace(this.patterns.speed, (match, speed) => {
                const kmh = this.conversions.mphToKmh(parseFloat(speed));
                return `${match} (${kmh} km/h)`;
            });
        }

        // Weight conversions
        if (this.settings.weight) {
            processedText = processedText.replace(this.patterns.weight, (match, weight) => {
                const kg = this.conversions.lbsToKg(parseFloat(weight));
                return `${match} (${kg} kg)`;
            });
        }

        // Date conversions
        if (this.settings.dates) {
            processedText = processedText.replace(this.patterns.dates, (match, month, day, year) => {
                const formattedDate = this.conversions.formatDate(month, day, year);
                return `${match} (${formattedDate})`;
            });
        }

        // Brand conversions
        if (this.settings.brands) {
            processedText = processedText.replace(this.patterns.brands, (match) => {
                const brandKey = match.toLowerCase();
                const info = this.brandInfo[brandKey];
                return info ? `${match} (${info})` : match;
            });
        }

        return processedText;
    }

    /**
     * Process a single text node
     */
    processTextNode(textNode) {
        // Skip if this node has already been processed
        if (textNode.parentElement && textNode.parentElement.dataset.unamericanised) {
            return;
        }

        const originalText = textNode.textContent;
        const processedText = this.processText(originalText);

        if (originalText !== processedText) {
            textNode.textContent = processedText;
            // Mark the parent element as processed to avoid reprocessing
            if (textNode.parentElement) {
                textNode.parentElement.dataset.unamericanised = 'true';
            }
        }
    }

    /**
     * Recursively process all text nodes in an element
     */
    processElement(element) {
        if (!this.shouldProcessElement(element)) {
            return;
        }

        // Process direct text nodes
        const walker = document.createTreeWalker(
            element,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode: (node) => {
                    // Skip if parent element is already processed or should not be processed
                    if (node.parentElement && node.parentElement.dataset.unamericanised) {
                        return NodeFilter.FILTER_REJECT;
                    }
                    return this.shouldProcessElement(node.parentElement)
                        ? NodeFilter.FILTER_ACCEPT
                        : NodeFilter.FILTER_REJECT;
                }
            }
        );

        const textNodes = [];
        let node;
        while (node = walker.nextNode()) {
            textNodes.push(node);
        }

        textNodes.forEach(textNode => {
            this.processTextNode(textNode);
        });
    }

    /**
     * Process the entire page
     */
    processPage() {
        // Mark that we've processed this page to avoid reprocessing
        if (document.body.dataset.unamericanised) {
            return;
        }
        document.body.dataset.unamericanised = 'true';

        this.processElement(document.body);

        // Set up mutation observer for dynamic content
        this.setupMutationObserver();
    }

    /**
     * Set up mutation observer to handle dynamically added content
     */
    setupMutationObserver() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    // Only process new nodes that haven't been processed yet
                    if (node.nodeType === Node.ELEMENT_NODE && !node.dataset.unamericanised) {
                        this.processElement(node);
                    } else if (node.nodeType === Node.TEXT_NODE &&
                        node.parentElement &&
                        !node.parentElement.dataset.unamericanised) {
                        this.processTextNode(node);
                    }
                });
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }
}

// Initialize the extension when the page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new UnAmericaniser());
} else {
    new UnAmericaniser();
}
