import { useState, useEffect } from 'preact/hooks';

interface Props {
  url: string;
  title: string;
  description: string;
  image: string;
}

export default function ShareBar({ url, title, description, image }: Props) {
  const [copied, setCopied] = useState(false);
  const [canShare, setCanShare] = useState(false);

  useEffect(() => {
    setCanShare(typeof navigator !== 'undefined' && !!navigator.share);
  }, []);

  const copyLink = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const nativeShare = () => {
    navigator.share({ title, text: description, url });
  };

  const encoded = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(`${title} — bulk.recipes`);
  const encodedDesc = encodeURIComponent(description);
  const encodedImage = encodeURIComponent(image);

  const btn = 'w-10 h-10 rounded-full bg-surface-container-highest flex items-center justify-center hover:bg-surface-container-high hover:scale-110 active:scale-95 transition-all';

  return (
    <div class="flex items-center gap-3 mt-6 mb-2">
      <span class="text-xs font-bold text-on-surface-variant uppercase tracking-widest mr-1">Share</span>

      {/* Copy link */}
      <button onClick={copyLink} class={btn} aria-label="Copy link" title={copied ? 'Copied!' : 'Copy link'}>
        <span class="material-symbols-outlined text-lg" style={copied ? 'font-variation-settings: "FILL" 1' : ''}>
          {copied ? 'check' : 'link'}
        </span>
      </button>

      {/* Native share (mobile) */}
      {canShare && (
        <button onClick={nativeShare} class={btn} aria-label="Share">
          <span class="material-symbols-outlined text-lg">share</span>
        </button>
      )}

      {/* Pinterest */}
      <a
        href={`https://pinterest.com/pin/create/button/?url=${encoded}&description=${encodedDesc}&media=${encodedImage}`}
        target="_blank"
        rel="noopener noreferrer"
        class={btn}
        aria-label="Share on Pinterest"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z"/></svg>
      </a>

      {/* X / Twitter */}
      <a
        href={`https://twitter.com/intent/tweet?url=${encoded}&text=${encodedTitle}`}
        target="_blank"
        rel="noopener noreferrer"
        class={btn}
        aria-label="Share on X"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
      </a>

      {/* Facebook */}
      <a
        href={`https://www.facebook.com/sharer/sharer.php?u=${encoded}`}
        target="_blank"
        rel="noopener noreferrer"
        class={btn}
        aria-label="Share on Facebook"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
      </a>
    </div>
  );
}
