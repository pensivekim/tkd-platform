type Size = 'sm' | 'md' | 'lg'

const sizeMap: Record<Size, string> = {
  sm: 'w-4 h-4 border-2',
  md: 'w-8 h-8 border-4',
  lg: 'w-12 h-12 border-4',
}

export default function LoadingSpinner({ size = 'md' }: { size?: Size }) {
  return (
    <div className="flex items-center justify-center w-full py-8">
      <div
        className={`${sizeMap[size]} rounded-full border-red-200 border-t-red-600 animate-spin`}
        role="status"
        aria-label="로딩 중"
      />
    </div>
  )
}
