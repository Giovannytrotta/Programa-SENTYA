
// countries.js - Lista de países con códigos y banderas

// Función para generar emojis de banderas a partir del código de país ISO
function getFlagEmoji(countryCode) {
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt());
  return String.fromCodePoint(...codePoints);
}

// Lista completa de países
export const countries = [
  { code: '+34', country: 'España', countryCode: 'ES', flag: getFlagEmoji('ES') },
  { code: '+33', country: 'Francia', countryCode: 'FR', flag: getFlagEmoji('FR') },
  { code: '+39', country: 'Italia', countryCode: 'IT', flag: getFlagEmoji('IT') },
  { code: '+49', country: 'Alemania', countryCode: 'DE', flag: getFlagEmoji('DE') },
  { code: '+351', country: 'Portugal', countryCode: 'PT', flag: getFlagEmoji('PT') },
  { code: '+44', country: 'Reino Unido', countryCode: 'GB', flag: getFlagEmoji('GB') },
  { code: '+1', country: 'Estados Unidos', countryCode: 'US', flag: getFlagEmoji('US') },
  { code: '+1', country: 'Canadá', countryCode: 'CA', flag: getFlagEmoji('CA') },
  { code: '+52', country: 'México', countryCode: 'MX', flag: getFlagEmoji('MX') },
  { code: '+54', country: 'Argentina', countryCode: 'AR', flag: getFlagEmoji('AR') },
  { code: '+55', country: 'Brasil', countryCode: 'BR', flag: getFlagEmoji('BR') },
  { code: '+56', country: 'Chile', countryCode: 'CL', flag: getFlagEmoji('CL') },
  { code: '+57', country: 'Colombia', countryCode: 'CO', flag: getFlagEmoji('CO') },
  { code: '+58', country: 'Venezuela', countryCode: 'VE', flag: getFlagEmoji('VE') },
  { code: '+51', country: 'Perú', countryCode: 'PE', flag: getFlagEmoji('PE') },
  { code: '+593', country: 'Ecuador', countryCode: 'EC', flag: getFlagEmoji('EC') },
  { code: '+595', country: 'Paraguay', countryCode: 'PY', flag: getFlagEmoji('PY') },
  { code: '+598', country: 'Uruguay', countryCode: 'UY', flag: getFlagEmoji('UY') },
  { code: '+591', country: 'Bolivia', countryCode: 'BO', flag: getFlagEmoji('BO') },
  { code: '+31', country: 'Países Bajos', countryCode: 'NL', flag: getFlagEmoji('NL') },
  { code: '+32', country: 'Bélgica', countryCode: 'BE', flag: getFlagEmoji('BE') },
  { code: '+41', country: 'Suiza', countryCode: 'CH', flag: getFlagEmoji('CH') },
  { code: '+43', country: 'Austria', countryCode: 'AT', flag: getFlagEmoji('AT') },
  { code: '+45', country: 'Dinamarca', countryCode: 'DK', flag: getFlagEmoji('DK') },
  { code: '+46', country: 'Suecia', countryCode: 'SE', flag: getFlagEmoji('SE') },
  { code: '+47', country: 'Noruega', countryCode: 'NO', flag: getFlagEmoji('NO') },
  { code: '+48', country: 'Polonia', countryCode: 'PL', flag: getFlagEmoji('PL') },
  { code: '+420', country: 'República Checa', countryCode: 'CZ', flag: getFlagEmoji('CZ') },
  { code: '+421', country: 'Eslovaquia', countryCode: 'SK', flag: getFlagEmoji('SK') },
  { code: '+36', country: 'Hungría', countryCode: 'HU', flag: getFlagEmoji('HU') },
  { code: '+40', country: 'Rumanía', countryCode: 'RO', flag: getFlagEmoji('RO') },
  { code: '+359', country: 'Bulgaria', countryCode: 'BG', flag: getFlagEmoji('BG') },
  { code: '+30', country: 'Grecia', countryCode: 'GR', flag: getFlagEmoji('GR') },
  { code: '+90', country: 'Turquía', countryCode: 'TR', flag: getFlagEmoji('TR') },
]

// Países más populares para mostrar primero
export const popularCountries = [
  { code: '+34', country: 'España', countryCode: 'ES', flag: getFlagEmoji('ES') },
  { code: '+33', country: 'Francia', countryCode: 'FR', flag: getFlagEmoji('FR') },
  { code: '+39', country: 'Italia', countryCode: 'IT', flag: getFlagEmoji('IT') },
  { code: '+49', country: 'Alemania', countryCode: 'DE', flag: getFlagEmoji('DE') },
  { code: '+351', country: 'Portugal', countryCode: 'PT', flag: getFlagEmoji('PT') },
  { code: '+44', country: 'Reino Unido', countryCode: 'GB', flag: getFlagEmoji('GB') },
  { code: '+1', country: 'Estados Unidos', countryCode: 'US', flag: getFlagEmoji('US') },
  { code: '+52', country: 'México', countryCode: 'MX', flag: getFlagEmoji('MX') }
];