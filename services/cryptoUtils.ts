import CryptoJS from 'crypto-js';
import { AES_KEY_STR, AES_IV_HEX } from '../constants';

const KEY = CryptoJS.enc.Utf8.parse(AES_KEY_STR);
const IV = CryptoJS.enc.Hex.parse(AES_IV_HEX);

/**
 * Encrypts text using AES-128-CBC with PKCS7 padding.
 * Matches Python: AES.new(KEY, AES.MODE_CBC, IV).encrypt(pad(text))
 */
export const encryptAES = (text: string): CryptoJS.lib.CipherParams => {
  return CryptoJS.AES.encrypt(text, KEY, {
    iv: IV,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });
};

/**
 * Returns the raw bytes (WordArray) of encryption, then handled for Base64 if needed.
 * But usually we need the Base64 string directly for the API headers.
 */
export const encryptAndBase64 = (text: string): string => {
  const encrypted = encryptAES(text);
  // CryptoJS.AES.encrypt returns an object where .toString() is Base64 by default
  return encrypted.toString();
};