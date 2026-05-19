import type { Metadata } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { Sidebar } from '@/components/layout/Sidebar'
import { Topbar } from '@/components/layout/Topbar'
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
  title: 'Guileo Clinics - Voice-First Customer Intelligence Platform',
  description: 'HIPAA-compliant, automated patient scheduling, intelligence CRM, and no-show prevention.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="bg-background text-text-primary antialiased min-h-screen">
        <div className="flex">
          {/* Sidebar */}
          <Sidebar />

          {/* Main Workspace Area */}
          <div className="flex-1 pl-64 h-screen flex flex-col overflow-hidden">
            <Topbar />
            <main className="flex-1 p-8 overflow-y-auto">
              {children}
            </main>
          </div>
        </div>

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
