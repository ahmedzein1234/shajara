'use client';

import { useEffect } from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-white to-orange-50 px-4">
      <div className="max-w-md w-full text-center">
        {/* Error Icon */}
        <div className="w-32 h-32 mx-auto mb-8 relative">
          <div className="absolute inset-0 bg-red-100 rounded-full animate-pulse"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <AlertCircle className="w-16 h-16 text-red-600" />
          </div>
        </div>

        {/* Error Message */}
        <h1 className="text-4xl font-bold text-slate-900 mb-4">
          حدث خطأ ما
        </h1>
        <p className="text-xl text-slate-700 mb-2">
          Something went wrong
        </p>

        <p className="text-slate-600 mb-8 leading-relaxed">
          نعتذر عن الإزعاج. حدث خطأ غير متوقع.
          <br />
          We apologize for the inconvenience. An unexpected error occurred.
        </p>

        {/* Error Details (Development only) */}
        {process.env.NODE_ENV === 'development' && error.message && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg text-left">
            <p className="text-sm font-mono text-red-800 break-all">
              {error.message}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-emerald-700 transition-smooth shadow-md hover:shadow-lg"
          >
            <RefreshCw className="w-5 h-5" />
            <span>حاول مرة أخرى / Try Again</span>
          </button>

          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 bg-white text-slate-700 px-6 py-3 rounded-lg font-semibold border-2 border-slate-300 hover:bg-slate-50 transition-smooth"
          >
            <Home className="w-5 h-5" />
            <span>الصفحة الرئيسية / Home</span>
          </Link>
        </div>

        {/* Help Text */}
        <p className="mt-8 text-sm text-slate-500">
          إذا استمرت المشكلة، يرجى الاتصال بالدعم
          <br />
          If the problem persists, please contact support
        </p>
      </div>
    </div>
  );
}
