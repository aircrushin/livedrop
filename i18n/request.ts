import { getRequestConfig } from 'next-intl/server';
import { cookies, headers } from 'next/headers';

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const localeCookie = cookieStore.get('locale')?.value;

  let locale = 'en';

  if (localeCookie && ['en', 'zh'].includes(localeCookie)) {
    locale = localeCookie;
  } else {
    const headersList = await headers();
    const acceptLanguage = headersList.get('accept-language');

    if (acceptLanguage) {
      const languages = acceptLanguage.split(',').map(lang => {
        const [code] = lang.trim().split(';');
        return code.toLowerCase();
      });

      if (languages.some(lang => lang.startsWith('zh'))) {
        locale = 'zh';
      }
    }
  }

  return {
    locale,
    messages: (await import(`../i18n/messages/${locale}.json`)).default
  };
});
