import { Loader2 } from 'lucide-react'

export default function Loading() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-white">
      <Loader2 className="w-8 h-8 text-black animate-spin" />
    </div>
  )
}
