import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Clarity'
export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#000',
          borderRadius: '22%',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Subtle background glow */}
        <div
          style={{
            position: 'absolute',
            top: '-20%',
            left: '-20%',
            width: '140%',
            height: '140%',
            background: 'radial-gradient(circle at center, #333 0%, #000 70%)',
          }}
        />
        
        {/* Prism Gradient "C" */}
        <div
          style={{
            display: 'flex',
            fontSize: 22,
            fontWeight: 900,
            fontFamily: 'sans-serif',
            letterSpacing: '-0.05em',
            background: 'linear-gradient(135deg, #60a5fa 0%, #a855f7 50%, #fb923c 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            color: 'transparent',
            lineHeight: 1,
          }}
        >
          C
        </div>

        {/* Glossy overlay effect */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '50%',
            background: 'linear-gradient(to bottom, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 100%)',
          }}
        />
      </div>
    ),
    { ...size }
  )
}
