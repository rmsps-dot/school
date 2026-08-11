import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export const alt = 'RMSPS - Residential Maa Saraswati Public School'
export const size = {
  width: 1200,
  height: 600,
}

export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#0b0b10',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <img
          src="http://rmsps.vercel.app/logo.jpg"
          alt="RMSPS Logo"
          style={{ width: 250, height: 250, borderRadius: '50%' }}
        />
        <h1
          style={{
            fontSize: 60,
            color: '#fff',
            marginTop: 40,
            fontFamily: 'sans-serif',
            fontWeight: 'bold',
            letterSpacing: '0.1em',
          }}
        >
          RMSPS
        </h1>
        <p
          style={{
            fontSize: 24,
            color: '#9ca3af',
            marginTop: 10,
            fontFamily: 'sans-serif',
          }}
        >
          Residential Maa Saraswati Public School
        </p>
      </div>
    ),
    {
      ...size,
    }
  )
}
