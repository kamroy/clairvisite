import { FRENCH_PHONE_REGEX } from './french-phone';

describe('FRENCH_PHONE_REGEX', () => {
  it.each([
    '0611223344',
    '06 11 22 33 44',
    '06.11.22.33.44',
    '06-11-22-33-44',
    '+33611223344',
    '+33 6 11 22 33 44',
    '0122334455', // fixe (01)
  ])('accepte %s', (value) => {
    expect(FRENCH_PHONE_REGEX.test(value)).toBe(true);
  });

  it.each([
    '',
    '123456789',
    '0011223344', // deuxième chiffre 0 invalide
    '061122334', // 9 chiffres
    '06112233445', // 11 chiffres
    '+1 611 223 344', // indicatif étranger
    'abcdefghij',
    '06 11 22 33 4a',
  ])('rejette %s', (value) => {
    expect(FRENCH_PHONE_REGEX.test(value)).toBe(false);
  });
});
