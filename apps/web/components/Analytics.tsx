import Script from 'next/script';

import { ga4Id } from '@/lib/site';

/**
 * Google Analytics 4.
 *
 * Renders nothing when `NEXT_PUBLIC_GA4_MEASUREMENT_ID` is unset, so local
 * development and the demo state never ship a tracker.
 *
 * `afterInteractive` keeps gtag off the critical path — analytics must not
 * cost Core Web Vitals, which are themselves a ranking signal.
 */
export function Analytics() {
  if (!ga4Id) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${ga4Id}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${ga4Id}', { send_page_view: true });
        `}
      </Script>
    </>
  );
}
