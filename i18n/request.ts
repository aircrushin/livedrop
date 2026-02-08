import { getRequestConfig } from 'next-intl/server';
import { headers } from 'next/headers';

export default getRequestConfig(async () => {
  // Get the user's preferred locale from the Accept-Language header
  const headersList = await headers();
  const acceptLanguage = headersList.get('accept-language');
  
  // Parse the Accept-Language header to get the preferred language
  let locale = 'en'; // default to English
  
  if (acceptLanguage) {
    // Extract the first language preference
    const languages = acceptLanguage.split(',').map(lang => {
      const [code] = lang.trim().split(';');
      return code.toLowerCase();
    });
    
    // Check if Chinese is preferred
    if (languages.some(lang => lang.startsWith('zh'))) {
      locale = 'zh';
    }
  }

  return {
    locale,
    messages: (await import(`../i18n/messages/${locale}.json`)).default
  };
});
