/**
 * Custom image loader for Cloudflare Pages
 * This loader is used to optimize images on Cloudflare's edge network
 */

export default function cloudflareImageLoader({
  src,
  width,
  quality,
}: {
  src: string;
  width: number;
  quality?: number;
}) {
  // For external URLs, return as-is
  if (src.startsWith('http://') || src.startsWith('https://')) {
    return src;
  }

  // For local images, we can use Cloudflare's image resizing
  // If you have Cloudflare Images enabled, you can use their transformation API
  // For now, we'll return the original image path
  const params = new URLSearchParams();
  params.set('width', width.toString());
  if (quality) {
    params.set('quality', quality.toString());
  }

  // You can customize this URL based on your Cloudflare setup
  // For example, if using Cloudflare Images:
  // return `https://imagedelivery.net/<account_hash>/${src}?${params.toString()}`

  // For R2 storage with image resizing:
  return `${src}?${params.toString()}`;
}
