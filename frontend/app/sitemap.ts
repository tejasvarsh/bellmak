import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://bellmak.vercel.app'

  const staticRoutes = [
    '', '/products', '/category', '/about', '/contact',
    '/help', '/sell', '/privacy-policy', '/terms',
  ].map(route => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1 : 0.8,
  }))

  return staticRoutes
}