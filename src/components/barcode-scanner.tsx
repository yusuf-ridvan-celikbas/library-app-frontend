'use client';

import { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader, type IScannerControls } from '@zxing/browser';
import { BarcodeFormat, DecodeHintType } from '@zxing/library';

interface BarcodeScannerProps {
  onDetected: (code: string) => void;
  /** Tarama sırasında bir hata (kamera izni reddi vb.) olursa çağrılır. */
  onError?: (message: string) => void;
}

/**
 * Kameradan canlı görüntü alıp EAN-13 (ISBN) barkodlarını okur.
 *
 * ÖNEMLİ: getUserMedia (kamera erişimi) yalnızca localhost veya HTTPS
 * bağlantılarında çalışır. Uygulamayı yerel ağ IP'si üzerinden (örn.
 * Tailscale) http:// ile açarsanız kamera izni tarayıcı tarafından
 * otomatik reddedilir — bu durumda `tailscale cert` ile HTTPS
 * sertifikası alınmalı.
 */
export function BarcodeScanner({ onDetected, onError }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const [status, setStatus] = useState<'starting' | 'scanning' | 'error'>('starting');

  useEffect(() => {
    // ISBN barkodları her zaman EAN-13 formatındadır; taramayı bu formatla
    // sınırlamak hem yanlış-pozitifleri azaltır hem de kod çözmeyi hızlandırır.
    const hints = new Map();
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.EAN_13]);
    // TRY_HARDER: ZXing zorlu/net olmayan karelerde daha fazla hesaplama
    // gücü harcayarak ek denemeler yapar. Sürekli tarama modunda (her
    // karede çalıştığı için) CPU maliyeti kabul edilebilir; başarı
    // oranını belirgin şekilde artırır.
    hints.set(DecodeHintType.TRY_HARDER, true);
    const reader = new BrowserMultiFormatReader(hints);

    let cancelled = false;

    async function start() {
      if (!videoRef.current) return;

      try {
        const controls = await reader.decodeFromConstraints(
          {
            video: {
              facingMode: 'environment', // mobilde arka kamera tercih edilir
              // Çözünürlük belirtilmezse taraycı genelde düşük bir
              // varsayılana (örn. 640x480) düşer — barkodun ince
              // çizgilerini ayırt etmek için bu yetersiz kalır. 'ideal'
              // olduğu için cihaz desteklemese bile hata vermez, sadece
              // en yakın desteklenen değeri kullanır.
              width: { ideal: 1920 },
              height: { ideal: 1080 },
              // Sürekli otomatik odaklanma — çoğu telefon zaten varsayılan
              // olarak yapar, ama bazı taraycılarda açıkça istemek gerekir.
              // Desteklenmeyen cihazlarda sessizce yok sayılır.
              advanced: [{ focusMode: 'continuous' } as MediaTrackConstraintSet],
            },
          },
          videoRef.current,
          (result) => {
            if (result && !cancelled) {
              onDetected(result.getText());
            }
          },
        );
        if (cancelled) {
          controls.stop();
          return;
        }
        controlsRef.current = controls;
        setStatus('scanning');
      } catch (err) {
        setStatus('error');
        const message =
          err instanceof Error && err.name === 'NotAllowedError'
            ? 'Kamera izni reddedildi. Tarayıcı ayarlarından izin verip tekrar deneyin.'
            : 'Kameraya erişilemedi. HTTPS veya localhost üzerinden eriştiğinizden emin olun.';
        onError?.(message);
      }
    }

    start();

    return () => {
      cancelled = true;
      controlsRef.current?.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    // aspect-[3/4] yerine daha geniş bir alan: dar bir kutu, kameranın
    // geniş görüş alanını object-cover ile kırparken barkodu kenardan
    // kesebiliyordu. Ekranın büyük kısmını kaplayan bir alan bu riski
    // azaltır.
    <div className="relative h-[70vh] w-full overflow-hidden rounded-sm bg-ink">
      <video ref={videoRef} className="h-full w-full object-cover" muted playsInline />

      {/* Hedefleme çerçevesi — imza öge: bir büyüteç/loupe hissi */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="h-36 w-[92%] rounded-sm border-2 border-brass shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]" />
      </div>

      {status === 'starting' && (
        <p className="absolute inset-x-0 bottom-4 text-center text-sm text-paper/80">Kamera açılıyor…</p>
      )}
      {status === 'scanning' && (
        <p className="absolute inset-x-0 bottom-4 px-6 text-center text-sm text-paper/80">
          Barkodu çerçeveye hizalayın · ~20 cm uzaklıkta, sabit tutun
        </p>
      )}
    </div>
  );
}
