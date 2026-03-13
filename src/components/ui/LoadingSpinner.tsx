type Size = 'sm' | 'md' | 'lg'

const sizeMap: Record<Size, string> = {
  sm: 'w-4 h-4 border-2',
  md: 'w-8 h-8 border-[3px]',
  lg: 'w-12 h-12 border-4',
}

export default function LoadingSpinner({ size = 'md' }: { size?: Size }) {
  return (
    <div className="flex items-center justify-center w-full py-10">
      <div
        className={`${sizeMap[size]} rounded-full border-white/[0.1] border-t-[#E63946] animate-spin`}
        role="status"
        aria-label="로딩 중"
      />
    </div>
  )
}
