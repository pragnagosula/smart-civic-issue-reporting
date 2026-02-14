const axios = require('axios');
require('dotenv').config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

/**
 * Translates text into English, Hindi, and Telugu using Gemini API.
 * Returns a JSON object with keys: en, hi, te.
 * Fallback: returns original text in all fields if translation fails.
 */
async function translateText(text) {
    if (!text) return { en: "", hi: "", te: "" };

    try {
        const prompt = `
            Translate the following text into English (en), Hindi (hi), and Telugu (te).
            Output ONLY a valid JSON object with keys "en", "hi", "te".
            Do not include Markdown formatting or code blocks.
            Input text: "${text}"
        `;

        const response = await axios.post(API_URL, {
            contents: [{
                parts: [{ text: prompt }]
            }]
        }, {
            headers: { 'Content-Type': 'application/json' }
        });

        const rawOutput = response.data.candidates[0].content.parts[0].text;

        // Clean up potential markdown code blocks
        const jsonString = rawOutput.replace(/```json/g, '').replace(/```/g, '').trim();

        const translations = JSON.parse(jsonString);

        // Ensure all keys exist
        return {
            en: translations.en || text,
            hi: translations.hi || text,
            te: translations.te || text
        };

    } catch (error) {
        console.error("Translation Service Error:", error.response?.data || error.message);
        // Fallback: return original text for all languages
        return {
            en: text,
            hi: text,
            te: text
        };
    }
}

/**
 * Detects language of the text.
 * Returns language code (en, hi, te, or 'unknown').
 * This can also be done via Gemini or a library.
 * For simplicity/speed/cost, we'll ask Gemini in the same call or separate?
 * User requirement: "Detect language -> Translate -> Store".
 * We can ask Gemini to return detected language in the same JSON.
 */
async function translateAndDetect(text) {
    if (!text) return { translations: { en: "", hi: "", te: "" }, detectedLanguage: "en" };

    try {
        const prompt = `
            Analyze the following text: "${text}"
            1. Detect the language code (e.g., en, hi, te).
            2. Translate it into English (en), Hindi (hi), and Telugu (te).
            Output ONLY a valid JSON object with this structure:
            {
                "detectedOnly": "code",
                "translations": {
                    "en": "...",
                    "hi": "...",
                    "te": "..."
                }
            }
            Do not include Markdown.
        `;

        const response = await axios.post(API_URL, {
            contents: [{
                parts: [{ text: prompt }]
            }]
        });

        const rawOutput = response.data.candidates[0].content.parts[0].text;
        const jsonString = rawOutput.replace(/```json/g, '').replace(/```/g, '').trim();
        const result = JSON.parse(jsonString);

        return {
            translations: result.translations,
            detectedLanguage: result.detectedOnly || 'en'
        };

    } catch (error) {
        console.error("Translation/Detection Error:", error.response?.data || error.message);
        return {
            translations: { en: text, hi: text, te: text },
            detectedLanguage: 'en' // Default fallback
        };
    }
}

module.exports = { translateText, translateAndDetect };
