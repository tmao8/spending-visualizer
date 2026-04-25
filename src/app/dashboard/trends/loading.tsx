export default function TrendsLoading() {
  return (
    <div className="min-h-screen bg-white pb-20">
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-10 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center gap-4">
          <div className="w-8 h-8 rounded-full bg-gray-100 animate-pulse" />
          <h1 className="text-2xl font-bold tracking-tight text-black">Spending Trends</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 mt-12 space-y-12">
        <div className="flex items-center justify-center p-1 bg-gray-100 rounded-2xl w-fit mx-auto animate-pulse">
          <div className="w-24 h-8 bg-gray-200 rounded-xl mx-1" />
          <div className="w-24 h-8 bg-white rounded-xl mx-1 shadow-sm" />
          <div className="w-24 h-8 bg-gray-200 rounded-xl mx-1" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-12">
            <div className="bg-gray-50/50 rounded-3xl p-10 border border-gray-100 h-[450px] animate-pulse" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white h-32 rounded-3xl border border-gray-100 animate-pulse" />
              <div className="bg-white h-32 rounded-3xl border border-gray-100 animate-pulse" />
              <div className="bg-white h-32 rounded-3xl border border-gray-100 animate-pulse" />
            </div>
          </div>
          <div className="space-y-8">
            <div className="bg-gray-50/50 rounded-3xl p-10 border border-gray-100 h-[350px] animate-pulse" />
            <div className="bg-white h-64 rounded-3xl border border-gray-100 animate-pulse" />
          </div>
        </div>
      </main>
    </div>
  )
}
