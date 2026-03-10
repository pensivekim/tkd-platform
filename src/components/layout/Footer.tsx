export default function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white mt-auto">
      <div className="max-w-5xl mx-auto px-4 py-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-gray-500">
        <div className="flex flex-col items-center sm:items-start gap-1">
          <span className="font-semibold text-gray-700">주식회사 제노믹</span>
          <a
            href="mailto:contact@genomic.cc"
            className="hover:text-red-600 transition-colors"
          >
            contact@genomic.cc
          </a>
        </div>
        <p className="text-xs text-gray-400">
          &copy; 2025 Genomic Inc. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
