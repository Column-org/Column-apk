
/**
 * Utility to map language codes to country flags (Emoji)
 */

// Mapping of Language Code (ISO 639-1) -> Country Code (ISO 3166-1 alpha-2)
const LANG_TO_COUNTRY: Record<string, string> = {
    'en': 'US', // English -> USA
    'es': 'ES', // Spanish -> Spain
    'zh': 'CN', // Chinese -> China
    'fr': 'FR', // French -> France
    'de': 'DE', // German -> Germany
    'it': 'IT', // Italian -> Italy
    'ja': 'JP', // Japanese -> Japan
    'ko': 'KR', // Korean -> South Korea
    'pt': 'PT', // Portuguese -> Portugal (or BR for Brazil)
    'ru': 'RU', // Russian -> Russia
    'ar': 'SA', // Arabic -> Saudi Arabia
    'hi': 'IN', // Hindi -> India
    'bn': 'BD', // Bengali -> Bangladesh
    'pa': 'PK', // Punjabi -> Pakistan
    'jv': 'ID', // Javanese -> Indonesia
    'ms': 'MY', // Malay -> Malaysia
    'vi': 'VN', // Vietnamese -> Vietnam
    'tr': 'TR', // Turkish -> Turkey
    'pl': 'PL', // Polish -> Poland
    'uk': 'UA', // Ukrainian -> Ukraine
    'nl': 'NL', // Dutch -> Netherlands
    'th': 'TH', // Thai -> Thailand
    'sv': 'SE', // Swedish -> Sweden
    'id': 'ID', // Indonesian -> Indonesia
    'el': 'GR', // Greek -> Greece
    'cs': 'CZ', // Czech -> Czech Republic
    'da': 'DK', // Danish -> Denmark
    'fi': 'FI', // Finnish -> Finland
    'hu': 'HU', // Hungarian -> Hungary
    'no': 'NO', // Norwegian -> Norway
    'ro': 'RO', // Romanian -> Romania
    'he': 'IL', // Hebrew -> Israel
    'ur': 'PK', // Urdu -> Pakistan
    'fa': 'IR', // Persian -> Iran
    'ca': 'ES', // Catalan -> Spain
    'sr': 'RS', // Serbian -> Serbia
    'bg': 'BG', // Bulgarian -> Bulgaria
    'hr': 'HR', // Croatian -> Croatia
    'sk': 'SK', // Slovak -> Slovakia
    'lt': 'LT', // Lithuanian -> Lithuania
    'sl': 'SI', // Slovenian -> Slovenia
    'et': 'EE', // Estonian -> Estonia
    'lv': 'LV', // Latvian -> Latvia
    'hy': 'AM', // Armenian -> Armenia
    'ka': 'GE', // Georgian -> Georgia
    'az': 'AZ', // Azerbaijani -> Azerbaijan
    'eu': 'ES', // Basque -> Spain
    'gl': 'ES', // Galician -> Spain
    'mk': 'MK', // Macedonian -> North Macedonia
    'bs': 'BA', // Bosnian -> Bosnia
    'sq': 'AL', // Albanian -> Albania
    'is': 'IS', // Icelandic -> Iceland
    'af': 'ZA', // Afrikaans -> South Africa
    'sw': 'TZ', // Swahili -> Tanzania
    'tl': 'PH', // Tagalog -> Philippines
    'cy': 'GB', // Welsh -> UK
    'be': 'BY', // Belarusian -> Belarus
    'ga': 'IE', // Irish -> Ireland

    // Defaults for others to UN (United Nations) or generic if needed, 
    // but usually we just fallback to no flag or a generic globe if not found.
    'un': 'UN',
}

/**
 * Converts a country code to a flag emoji
 */
function getFlagEmoji(countryCode: string) {
    const codePoints = countryCode
        .toUpperCase()
        .split('')
        .map(char => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
}

/**
 * Gets the flag emoji for a given language code.
 * Falls back to a globe 🌐 if no specific country mapping is found.
 */
export function getLanguageFlag(langCode: string): string {
    const countryCode = LANG_TO_COUNTRY[langCode.toLowerCase()];
    if (countryCode) {
        return getFlagEmoji(countryCode);
    }
    return '🌐'; // Default fallback
}
