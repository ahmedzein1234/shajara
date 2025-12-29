'use client';

import { useState, useEffect, useRef } from 'react';
import { Download, Printer, Share2 } from 'lucide-react';
import QRCode from 'qrcode';

interface QRCodeGeneratorProps {
  value: string;
  size?: number;
  title?: string;
  subtitle?: string;
  locale?: 'ar' | 'en';
  showActions?: boolean;
  className?: string;
}

export function QRCodeGenerator({
  value,
  size = 200,
  title,
  subtitle,
  locale = 'ar',
  showActions = true,
  className = '',
}: QRCodeGeneratorProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const isRTL = locale === 'ar';

  const t = {
    ar: {
      download: 'تحميل',
      print: 'طباعة',
      share: 'مشاركة',
      scanToJoin: 'امسح للانضمام',
      error: 'خطأ في إنشاء رمز QR',
    },
    en: {
      download: 'Download',
      print: 'Print',
      share: 'Share',
      scanToJoin: 'Scan to join',
      error: 'Error generating QR code',
    },
  }[locale];

  useEffect(() => {
    generateQR();
  }, [value, size]);

  const generateQR = async () => {
    try {
      const dataUrl = await QRCode.toDataURL(value, {
        width: size,
        margin: 2,
        color: {
          dark: '#1a5f4a', // Islamic green
          light: '#ffffff',
        },
        errorCorrectionLevel: 'H',
      });
      setQrDataUrl(dataUrl);
      setError(null);
    } catch (err) {
      console.error('QR generation error:', err);
      setError(t.error);
    }
  };

  const handleDownload = () => {
    if (!qrDataUrl) return;

    const link = document.createElement('a');
    link.download = `qr-${title?.replace(/\s+/g, '-') || 'code'}.png`;
    link.href = qrDataUrl;
    link.click();
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="${isRTL ? 'rtl' : 'ltr'}">
      <head>
        <title>${title || 'QR Code'}</title>
        <style>
          body {
            font-family: 'Tajawal', 'Cairo', Arial, sans-serif;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            margin: 0;
            padding: 20px;
            box-sizing: border-box;
          }
          .qr-container {
            text-align: center;
            border: 3px solid #1a5f4a;
            border-radius: 16px;
            padding: 30px;
            background: white;
          }
          .qr-title {
            font-size: 24px;
            font-weight: bold;
            color: #1a5f4a;
            margin-bottom: 8px;
          }
          .qr-subtitle {
            font-size: 16px;
            color: #666;
            margin-bottom: 20px;
          }
          .qr-image {
            margin: 20px 0;
          }
          .scan-text {
            font-size: 14px;
            color: #888;
            margin-top: 16px;
          }
          @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
        </style>
      </head>
      <body>
        <div class="qr-container">
          ${title ? `<div class="qr-title">${title}</div>` : ''}
          ${subtitle ? `<div class="qr-subtitle">${subtitle}</div>` : ''}
          <img src="${qrDataUrl}" class="qr-image" width="${size}" height="${size}" />
          <div class="scan-text">${t.scanToJoin}</div>
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const handleShare = async () => {
    if (!navigator.share || !qrDataUrl) return;

    try {
      // Convert data URL to blob
      const response = await fetch(qrDataUrl);
      const blob = await response.blob();
      const file = new File([blob], 'qr-code.png', { type: 'image/png' });

      await navigator.share({
        title: title || 'QR Code',
        text: subtitle || t.scanToJoin,
        files: [file],
      });
    } catch (err) {
      console.error('Share error:', err);
    }
  };

  if (error) {
    return (
      <div className={`text-center p-4 bg-red-50 rounded-lg ${className}`}>
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center ${className}`} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* QR Code Display */}
      <div className="bg-white p-4 rounded-xl shadow-md border-2 border-islamic-primary/20">
        {title && (
          <h3 className="text-lg font-bold text-islamic-primary text-center mb-2">
            {title}
          </h3>
        )}
        {subtitle && (
          <p className="text-sm text-gray-600 text-center mb-4">
            {subtitle}
          </p>
        )}

        {qrDataUrl ? (
          <img
            src={qrDataUrl}
            alt="QR Code"
            width={size}
            height={size}
            className="mx-auto"
          />
        ) : (
          <div
            className="bg-gray-100 animate-pulse rounded-lg mx-auto"
            style={{ width: size, height: size }}
          />
        )}

        <p className="text-xs text-gray-400 text-center mt-3">
          {t.scanToJoin}
        </p>
      </div>

      {/* Action Buttons */}
      {showActions && qrDataUrl && (
        <div className="flex gap-2 mt-4">
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-4 py-2 bg-islamic-primary text-white rounded-lg hover:bg-islamic-primary/90 transition-colors text-sm"
          >
            <Download className="w-4 h-4" />
            {t.download}
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
          >
            <Printer className="w-4 h-4" />
            {t.print}
          </button>

          {typeof navigator !== 'undefined' && typeof navigator.share === 'function' && (
            <button
              onClick={handleShare}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
            >
              <Share2 className="w-4 h-4" />
              {t.share}
            </button>
          )}
        </div>
      )}

      {/* Hidden canvas for advanced operations */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}

// Compact QR code for inline use
export function QRCodeCompact({
  value,
  size = 80,
  className = '',
}: {
  value: string;
  size?: number;
  className?: string;
}) {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  useEffect(() => {
    QRCode.toDataURL(value, {
      width: size,
      margin: 1,
      color: {
        dark: '#1a5f4a',
        light: '#ffffff',
      },
    }).then(setQrDataUrl).catch(console.error);
  }, [value, size]);

  if (!qrDataUrl) {
    return (
      <div
        className={`bg-gray-100 animate-pulse rounded ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <img
      src={qrDataUrl}
      alt="QR Code"
      width={size}
      height={size}
      className={`rounded ${className}`}
    />
  );
}
