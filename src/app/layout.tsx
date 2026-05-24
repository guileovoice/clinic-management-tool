import type { Metadata } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { Toaster } from 'react-hot-toast'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
})

export const metadata: Metadata = {
  title: 'Guileo Clinic — Staff Portal',
  description: 'HIPAA-compliant, automated patient scheduling, intelligence CRM, and no-show prevention.',
  icons: {
    icon: '/favicon.svg',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="bg-background text-text-primary antialiased min-h-screen">
        {children}
        
        {/* Global Action Toasters */}
        <Toaster 
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#1A1A24',
              color: '#F1F1F3',
              border: '1px solid #2E2E3F',
              borderRadius: '0.75rem',
              fontSize: '13px',
              fontWeight: '600'
            }
          }}
        />
      </body>
    </html>
  )
}
