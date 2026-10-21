// code  = language code sent to the translation service
// ocr   = matching Tesseract OCR language pack
export const LANGUAGES = [
  { code: 'en', label: 'English', ocr: 'eng' },
  { code: 'tl', label: 'Filipino (Tagalog)', ocr: 'tgl' },
  { code: 'es', label: 'Spanish', ocr: 'spa' },
  { code: 'fr', label: 'French', ocr: 'fra' },
  { code: 'de', label: 'German', ocr: 'deu' },
  { code: 'it', label: 'Italian', ocr: 'ita' },
  { code: 'pt', label: 'Portuguese', ocr: 'por' },
  { code: 'ru', label: 'Russian', ocr: 'rus' },
  { code: 'ja', label: 'Japanese', ocr: 'jpn' },
  { code: 'ko', label: 'Korean', ocr: 'kor' },
  { code: 'zh-CN', label: 'Chinese (Simplified)', ocr: 'chi_sim' },
  { code: 'ar', label: 'Arabic', ocr: 'ara' },
  { code: 'hi', label: 'Hindi', ocr: 'hin' },
  { code: 'id', label: 'Indonesian', ocr: 'ind' },
  { code: 'vi', label: 'Vietnamese', ocr: 'vie' },
  { code: 'th', label: 'Thai', ocr: 'tha' },
];

export const languageByCode = (code) => LANGUAGES.find((l) => l.code === code) || LANGUAGES[0];