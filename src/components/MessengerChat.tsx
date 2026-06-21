"use client";

import { useSiteTexts } from '@/lib/site-texts-context';

function parseMessengerUrl(input: string): string {
  if (!input) return '';

  const trimmed = input.trim();

  // Already a full m.me URL
  if (trimmed.startsWith('https://m.me/') || trimmed.startsWith('http://m.me/')) {
    return trimmed;
  }

  // m.me/shortcode or just shortcode
  const mMeMatch = trimmed.match(/^m\.me\/(.+)$/);
  if (mMeMatch) {
    return `https://m.me/${mMeMatch[1]}`;
  }

  // facebook.com/messages/username or facebook.com/username
  const fbMatch = trimmed.match(
    /(?:facebook\.com\/messages\/|facebook\.com\/)([^\/\?]+)/
  );
  if (fbMatch) {
    return `https://m.me/${fbMatch[1]}`;
  }

  // Bare username or page name (no slashes) — assume it's a m.me shortcode
  if (!trimmed.includes('/') && !trimmed.includes(' ')) {
    return `https://m.me/${trimmed}`;
  }

  // Fallback: treat as-is
  return trimmed;
}

export function MessengerChat() {
  const { get } = useSiteTexts();
  const rawLink = get('messenger_link', ''); 

  if (!rawLink) return null;

  const messengerUrl = parseMessengerUrl(rawLink);

  return (
    <a
      href={messengerUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Nhắn tin qua Messenger"
      className="fixed bottom-6 right-6 z-50 group"
    >
      <div className="relative w-14 h-14 rounded-full bg-black shadow-xl flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-2xl">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-6 h-6 text-white"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M12 0C5.373 0 0 4.975 0 11.111c0 3.498 1.744 6.614 4.469 8.654V24l4.088-2.242c1.092.301 2.246.464 3.443.464 6.627 0 12-4.975 12-11.111S18.627 0 12 0zm1.191 14.963l-3.055-3.26-5.963 3.26L10.732 8.2l3.131 3.26L19.752 8.2z" />
        </svg>
      </div>

      <div className="absolute inset-0 rounded-full bg-black/20 animate-ping pointer-events-none" />

      <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
        <div className="bg-black text-white text-xs font-medium px-3 py-1.5 rounded-full shadow-lg">
          Chat qua Messenger
        </div>
      </div>
    </a>
  );
}
