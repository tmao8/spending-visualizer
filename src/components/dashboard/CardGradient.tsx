'use client'

export function CardGradient() {
  return (
    <div className="relative w-full aspect-[1.586/1] rounded-3xl overflow-hidden shadow-2xl shadow-gray-200 border border-white/20">
      <div className="absolute inset-0 bg-gradient-to-br from-white via-gray-100 to-gray-200" />
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-blue-400/20 blur-[80px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-orange-400/20 blur-[80px] rounded-full" />
      <div className="absolute top-[20%] right-[10%] w-[40%] h-[40%] bg-purple-400/10 blur-[80px] rounded-full" />
      
      <div className="absolute inset-0 p-8 flex flex-col justify-between">
        <div className="flex justify-between items-start">
          <div className="w-12 h-10 bg-white/40 rounded-lg backdrop-blur-md border border-white/40" />
          <div className="text-gray-400 font-bold tracking-widest text-xs uppercase">Titanium</div>
        </div>
        
        <div className="space-y-1">
          <div className="text-gray-400 text-[10px] font-bold tracking-widest uppercase opacity-60">Total Balance</div>
          <div className="text-4xl font-bold tracking-tighter text-black/80 flex items-start">
            <span className="text-xl mt-1 mr-0.5 opacity-60">$</span>
            <span id="card-total-value">0.00</span>
          </div>
        </div>
      </div>
    </div>
  )
}
