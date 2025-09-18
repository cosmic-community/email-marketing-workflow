'use client'

import { createContext, useContext, ReactNode } from 'react'
import { Toaster } from '@/components/ui/toaster'

const ToastContext = createContext<{}>({})

interface ToastProviderProps {
  children: ReactNode
}

export default function ToastProvider({ children }: ToastProviderProps) {
  return (
    <ToastContext.Provider value={{}}>
      {children}
      <Toaster />
    </ToastContext.Provider>
  )
}

export const useToastContext = () => useContext(ToastContext)