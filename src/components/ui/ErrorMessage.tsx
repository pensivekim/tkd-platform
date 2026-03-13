import { AlertTriangle } from 'lucide-react'

interface ErrorMessageProps {
  message: string
  retry?: () => void
}

export default function ErrorMessage({ message, retry }: ErrorMessageProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-12 h-12 rounded-2xl bg-[#E63946]/[0.1] border border-[#E63946]/20 flex items-center justify-center mb-4">
        <AlertTriangle size={20} className="text-[#E63946]" />
      </div>
      <p className="text-sm text-[#909098] mb-4 max-w-xs" style={{ wordBreak: 'keep-all' }}>
        {message}
      </p>
      {retry && (
        <button
          onClick={retry}
          className="inline-flex items-center px-4 py-2 border border-white/[0.1] text-sm font-medium rounded-lg text-[#909098] hover:bg-white/[0.05] hover:text-[#F0F0F5] transition-colors cursor-pointer bg-transparent"
        >
          다시 시도
        </button>
      )}
    </div>
  )
}
