export default function PaymentsLoading() {
  return (
    <div className="bg-white dark:bg-[#0a0a0a] min-h-screen">
      <header className="bg-white/80 dark:bg-[#0a0a0a]/80 backdrop-blur-md sticky top-0 z-10 border-b border-gray-100 dark:border-white/10">
        <div className="px-6 md:px-8 h-20 flex items-center">
          <h1 className="text-2xl font-black tracking-tight text-black dark:text-white">Payments</h1>
        </div>
      </header>
      <main className="px-6 md:px-8 py-8 max-w-5xl">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-gray-50 rounded-2xl p-6 animate-pulse">
              <div className="h-3 w-20 bg-gray-200 rounded mb-3" />
              <div className="h-7 w-28 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
        <div className="space-y-4">
          {[1, 2].map(i => (
            <div key={i} className="bg-white dark:bg-black rounded-2xl border border-gray-100 dark:border-white/10 p-6 animate-pulse">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-gray-100" />
                <div className="h-4 w-32 bg-gray-200 rounded" />
              </div>
              <div className="grid grid-cols-4 gap-4">
                {[1, 2, 3, 4].map(j => (
                  <div key={j}>
                    <div className="h-2 w-16 bg-gray-100 rounded mb-2" />
                    <div className="h-5 w-20 bg-gray-200 rounded" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
