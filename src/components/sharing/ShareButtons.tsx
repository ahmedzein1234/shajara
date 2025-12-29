'use client';

import { useState } from 'react';
import {
  Share2,
  MessageCircle,
  Mail,
  Link2,
  Twitter,
  Facebook,
  Check,
  Smartphone,
} from 'lucide-react';
import {
  ShareContent,
  getWhatsAppShareUrl,
  getEmailShareUrl,
  getTwitterShareUrl,
  getFacebookShareUrl,
  getSmsUrl,
  copyToClipboard,
  nativeShare,
  canNativeShare,
} from '@/lib/sharing/share-utils';

interface ShareButtonsProps {
  content: ShareContent;
  locale?: 'ar' | 'en';
  size?: 'sm' | 'md' | 'lg';
  direction?: 'horizontal' | 'vertical';
  showLabels?: boolean;
  className?: string;
}

export function ShareButtons({
  content,
  locale = 'ar',
  size = 'md',
  direction = 'horizontal',
  showLabels = true,
  className = '',
}: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);
  const isRTL = locale === 'ar';

  const t = {
    ar: {
      whatsapp: 'واتساب',
      sms: 'رسالة',
      email: 'بريد',
      twitter: 'تويتر',
      facebook: 'فيسبوك',
      copy: 'نسخ الرابط',
      copied: 'تم النسخ!',
      share: 'مشاركة',
    },
    en: {
      whatsapp: 'WhatsApp',
      sms: 'SMS',
      email: 'Email',
      twitter: 'Twitter',
      facebook: 'Facebook',
      copy: 'Copy Link',
      copied: 'Copied!',
      share: 'Share',
    },
  }[locale];

  const sizeClasses = {
    sm: 'p-2',
    md: 'p-3',
    lg: 'p-4',
  }[size];

  const iconSize = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  }[size];

  const handleCopy = async () => {
    const success = await copyToClipboard(content.url);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleNativeShare = async () => {
    await nativeShare(content, locale);
  };

  const buttons = [
    {
      id: 'whatsapp',
      label: t.whatsapp,
      icon: MessageCircle,
      href: getWhatsAppShareUrl(content, locale),
      className: 'bg-[#25D366] hover:bg-[#20bd5a] text-white',
    },
    {
      id: 'sms',
      label: t.sms,
      icon: Smartphone,
      href: getSmsUrl('', content, locale),
      className: 'bg-blue-500 hover:bg-blue-600 text-white',
    },
    {
      id: 'email',
      label: t.email,
      icon: Mail,
      href: getEmailShareUrl(content, locale),
      className: 'bg-gray-600 hover:bg-gray-700 text-white',
    },
    {
      id: 'twitter',
      label: t.twitter,
      icon: Twitter,
      href: getTwitterShareUrl(content, locale),
      className: 'bg-black hover:bg-gray-800 text-white',
    },
    {
      id: 'facebook',
      label: t.facebook,
      icon: Facebook,
      href: getFacebookShareUrl(content),
      className: 'bg-[#1877F2] hover:bg-[#166fe5] text-white',
    },
    {
      id: 'copy',
      label: copied ? t.copied : t.copy,
      icon: copied ? Check : Link2,
      onClick: handleCopy,
      className: copied
        ? 'bg-green-500 text-white'
        : 'bg-gray-100 hover:bg-gray-200 text-gray-700',
    },
  ];

  // Add native share if available
  if (canNativeShare()) {
    buttons.unshift({
      id: 'native',
      label: t.share,
      icon: Share2,
      onClick: handleNativeShare,
      className: 'bg-islamic-primary hover:bg-islamic-primary/90 text-white',
    });
  }

  return (
    <div
      className={`flex ${direction === 'vertical' ? 'flex-col' : 'flex-row flex-wrap'} gap-2 ${className}`}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {buttons.map((button) => {
        const Icon = button.icon;
        const ButtonContent = (
          <>
            <Icon className={iconSize} />
            {showLabels && (
              <span className="text-sm font-medium">{button.label}</span>
            )}
          </>
        );

        if (button.onClick) {
          return (
            <button
              key={button.id}
              onClick={button.onClick}
              className={`flex items-center gap-2 ${sizeClasses} rounded-lg transition-all ${button.className}`}
            >
              {ButtonContent}
            </button>
          );
        }

        return (
          <a
            key={button.id}
            href={button.href}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center gap-2 ${sizeClasses} rounded-lg transition-all ${button.className}`}
          >
            {ButtonContent}
          </a>
        );
      })}
    </div>
  );
}

// WhatsApp-specific share button (prominent)
export function WhatsAppShareButton({
  content,
  locale = 'ar',
  fullWidth = false,
  className = '',
}: {
  content: ShareContent;
  locale?: 'ar' | 'en';
  fullWidth?: boolean;
  className?: string;
}) {
  const t = {
    ar: { share: 'مشاركة عبر واتساب' },
    en: { share: 'Share via WhatsApp' },
  }[locale];

  return (
    <a
      href={getWhatsAppShareUrl(content, locale)}
      target="_blank"
      rel="noopener noreferrer"
      className={`
        flex items-center justify-center gap-3
        px-6 py-3 rounded-xl
        bg-[#25D366] hover:bg-[#20bd5a]
        text-white font-bold text-lg
        transition-all shadow-lg hover:shadow-xl
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
    >
      <MessageCircle className="w-6 h-6" />
      <span>{t.share}</span>
    </a>
  );
}

// Compact share icon button
export function ShareIconButton({
  content,
  locale = 'ar',
  className = '',
}: {
  content: ShareContent;
  locale?: 'ar' | 'en';
  className?: string;
}) {
  const [showMenu, setShowMenu] = useState(false);

  const handleShare = async () => {
    if (canNativeShare()) {
      const success = await nativeShare(content, locale);
      if (!success) {
        setShowMenu(true);
      }
    } else {
      setShowMenu(true);
    }
  };

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={handleShare}
        className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
        aria-label="Share"
      >
        <Share2 className="w-5 h-5" />
      </button>

      {showMenu && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowMenu(false)}
          />
          <div className="absolute top-full mt-2 right-0 z-50 bg-white rounded-xl shadow-xl border p-3 min-w-[200px]">
            <ShareButtons
              content={content}
              locale={locale}
              size="sm"
              direction="vertical"
              showLabels={true}
            />
          </div>
        </>
      )}
    </div>
  );
}
