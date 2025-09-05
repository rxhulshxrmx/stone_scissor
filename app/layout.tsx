import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Stone Paper Scissors - Real-time Multiplayer',
  description: 'Play Stone Paper Scissors with friends in real-time!',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen">
        {children}
      </body>
    </html>
  )
}
