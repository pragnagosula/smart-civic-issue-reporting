const axios = require('axios');

const AI_BASE = process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000';

async function translateToEnglishAndDetect(text) {
    if (!text) {
        return {
            translatedText: '',
            detectedLanguage: 'en',
            wasTranslated: false
        };
    }

    try {
        const response = await axios.post(
            `${AI_BASE}/translate`,
            { text },
            { timeout: 15000 }
        );

        return {
            translatedText: response.data.translated_text || text,
            detectedLanguage: response.data.detected_language || 'unknown',
            wasTranslated: Boolean(response.data.was_translated)
        };
    } catch (error) {
        console.error('Translation Service Error:', error.response?.data || error.message);
        return {
            translatedText: text,
            detectedLanguage: 'unknown',
            wasTranslated: false
        };
    }
}

/**
 * Returns translated variants for compatibility with existing schema.
 * Hindi/Telugu are preserved as source text when local translation only targets English.
 */
async function translateText(text) {
    if (!text) return { en: '', hi: '', te: '' };

    const result = await translateToEnglishAndDetect(text);
    const english = result.translatedText || text;

    return {
        en: english,
        hi: text,
        te: text
    };
}

async function translateAndDetect(text) {
    if (!text) {
        return {
            translations: { en: '', hi: '', te: '' },
            detectedLanguage: 'en'
        };
    }

    const result = await translateToEnglishAndDetect(text);
    const english = result.translatedText || text;
    const detectedLanguage = result.detectedLanguage === 'unknown' ? 'en' : result.detectedLanguage;

    return {
        translations: {
            en: english,
            hi: text,
            te: text
        },
        detectedLanguage
    };
}

module.exports = { translateText, translateAndDetect };
