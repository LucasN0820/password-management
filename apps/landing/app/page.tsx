import { headers } from 'next/headers';
import { LandingPage } from './landing-page';
import { localeFromAcceptLanguage } from './i18n';

export default async function Home() {
  const requestHeaders = await headers();
  const initialLocale = localeFromAcceptLanguage(
    requestHeaders.get('accept-language')
  );

  return <LandingPage initialLocale={initialLocale} />;
}
