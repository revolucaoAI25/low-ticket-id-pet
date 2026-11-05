import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return { rules: [{ userAgent: '*', disallow: ['/kit/', '/admin', '/obrigado', '/p/', '/api/', '/resultado'] }] };
}
