import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/account', '/seller', '/checkout', '/cart'],
    },
    sitemap: 'https://bellmak.vercel.app/sitemap.xml',
  }
}
