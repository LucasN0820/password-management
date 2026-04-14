import { Skeleton } from './skeleton'

interface LanguageLoaderProps {
  variant?: 'desktop' | 'mobile'
}

/**
 * Full-screen skeleton loader shown while i18n language is being detected.
 * Prevents flash of blank/unstyled content during initialization.
 */
export function LanguageLoader({ variant = 'desktop' }: LanguageLoaderProps) {
  if (variant === 'mobile') {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="text-4xl">🔐</div>
          <Skeleton className="w-24 h-4" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar skeleton */}
      <div className="w-[240px] border-r border-border p-4 flex flex-col gap-4">
        <Skeleton className="w-28 h-6" />
        <div className="flex flex-col gap-2 mt-4">
          <Skeleton className="w-full h-9 rounded-lg" />
          <Skeleton className="w-full h-9 rounded-lg" />
          <Skeleton className="w-full h-9 rounded-lg" />
        </div>
      </div>
      {/* Main content skeleton */}
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="text-4xl">🔐</div>
          <Skeleton className="w-24 h-4" />
        </div>
      </div>
    </div>
  )
}
