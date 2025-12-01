import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Redis Feature Demo',
  description: 'Demonstration of Redis features with caching examples',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
