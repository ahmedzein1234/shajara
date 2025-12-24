import { TreeDeciduous } from 'lucide-react';

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-emerald-50">
      <div className="text-center">
        {/* Animated Tree Icon */}
        <div className="relative w-32 h-32 mx-auto mb-8">
          {/* Outer rotating circle */}
          <div className="absolute inset-0 rounded-full border-4 border-emerald-200 border-t-emerald-600 animate-spin"></div>

          {/* Inner tree icon */}
          <div className="absolute inset-0 flex items-center justify-center">
            <TreeDeciduous className="w-12 h-12 text-emerald-600" />
          </div>
        </div>

        {/* Loading Text */}
        <h2 className="text-2xl font-bold text-slate-900 mb-3">
          جاري التحميل...
        </h2>
        <p className="text-slate-600">
          Loading...
        </p>

        {/* Animated Dots */}
        <div className="flex justify-center gap-2 mt-6">
          <div className="w-3 h-3 rounded-full bg-emerald-600 animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-3 h-3 rounded-full bg-emerald-600 animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-3 h-3 rounded-full bg-emerald-600 animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
      </div>
    </div>
  );
}
