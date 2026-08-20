import type { MetadataRoute } from 'next';

/**
 * Next.js'in App Router'daki native manifest dosya konvansiyonu — ayrı
 * bir manifest.json elle yazmaya ya da next-pwa gibi bir pakete gerek
 * kalmadan /manifest.webmanifest otomatik olarak üretilir ve
 * <head>'e bağlanır.
 *
 * Kapsam notu: Bu, uygulamanın "ana ekrana eklenebilir" ve tam ekran
 * (adres çubuğusuz) açılabilir olmasını sağlar — kişisel kütüphane
 * kontrolü zaten canlı API verisi gerektirdiği için (kitapçıdayken
 * "evde var mı" sorgusu network'süz anlamsız), kapsamlı bir offline
 * service worker/cache katmanı bilinçli olarak eklenmedi. İleride
 * gerçek offline ihtiyaç doğarsa @ducanh2912/next-pwa eklenebilir.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Kütüphanem',
    short_name: 'Kütüphanem',
    description: 'Kişisel kütüphane yönetimi',
    start_url: '/',
    display: 'standalone',
    background_color: '#efeae0', // paper
    theme_color: '#3b2a1e', // oak
    orientation: 'portrait',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
