'use client'
import Link from 'next/link'

interface Props {
  title?: string
  description?: string
  backHref?: string
  backLabel?: string
}

export default function ComingSoon({
  title = 'Coming Soon!',
  description = 'We are working hard on this feature. Please check back later.',
  backHref = '/',
  backLabel = '← Go Back'
}: Props) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="text-8xl mb-6">🚧</div>
        <h1 className="text-3xl font-black text-gray-800 mb-3">{title}</h1>
        <p className="text-gray-500 mb-8">{description}</p>
        <div className="bg-orange-50 border-2 border-orange-200 rounded-2xl p-4 mb-8">
          <p className="text-primary font-semibold text-sm">⚠️ This feature is under development</p>
          <p className="text-gray-500 text-xs mt-1">Please do not use this section right now</p>
        </div>
        <Link
          href={backHref}
          className="bg-primary text-white px-8 py-3 rounded-xl font-semibold hover:bg-primary-dark transition-colors inline-block"
        >
          {backLabel}
        </Link>
      </div>
    </div>
  )
}