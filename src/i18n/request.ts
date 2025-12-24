import { getRequestConfig } from 'next-intl/server';
import { headers } from 'next/headers';
import { defaultLocale, isValidLocale, type Locale } from './config';

export default getRequestConfig(async () => {
  const headersList = await headers();
  const pathname = headersList.get('x-pathname') || '';

  // Extract locale from pathname
  const segments = pathname.split('/').filter(Boolean);
  const localeSegment = segments[0];

  let locale: Locale = defaultLocale;

  if (localeSegment && isValidLocale(localeSegment)) {
    locale = localeSegment;
  }

  // Load messages for the locale
  const messages = (await import(`./messages/${locale}.json`)).default;

  return {
    locale,
    messages,
  };
});
