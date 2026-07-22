/**
 * Generic shimmer LQIP for next/image `blurDataURL` — an inline SVG gradient,
 * base64-encoded, so every image gets a soft placeholder without needing a
 * real per-image blur hash computed at build/upload time.
 */
function shimmer(w: number, h: number) {
  return `
<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="g">
      <stop stop-color="#F1F5F0" offset="20%" />
      <stop stop-color="#E5EBE3" offset="50%" />
      <stop stop-color="#F1F5F0" offset="70%" />
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="#F1F5F0" />
  <rect id="r" width="${w}" height="${h}" fill="url(#g)" />
</svg>`
}

function toBase64(str: string) {
  return typeof window === 'undefined'
    ? Buffer.from(str).toString('base64')
    : window.btoa(str)
}

/** `blurDataURL` for next/image — pass roughly the image's aspect ratio. */
export function shimmerBlurDataURL(w = 700, h = 475): string {
  return `data:image/svg+xml;base64,${toBase64(shimmer(w, h))}`
}
