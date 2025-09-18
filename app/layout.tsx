import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Layout from '@/components/Layout'
import ToastProvider from '@/components/ToastProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Email Marketing Workflow',
  description: 'Advanced email marketing platform with workflow automation',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ToastProvider>
          <Layout>
            {children}
          </Layout>
        </ToastProvider>
      </body>
    </html>
  )
}