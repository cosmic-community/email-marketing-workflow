'use client'

import { useState, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { AlertTriangle, Loader2 } from 'lucide-react'

export interface ConfirmationModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  title: string
  message?: string
  description?: string
  confirmText?: string
  cancelText?: string
  variant?: 'default' | 'destructive'
  onConfirm: () => void | Promise<void>
  isLoading?: boolean
  preventAutoClose?: boolean
  trigger?: ReactNode
}

export default function ConfirmationModal({
  isOpen,
  onOpenChange,
  title,
  message,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'default',
  onConfirm,
  isLoading = false,
  preventAutoClose = false,
  trigger
}: ConfirmationModalProps) {
  const [isConfirming, setIsConfirming] = useState(false)

  const handleConfirm = async () => {
    if (isConfirming || isLoading) return
    
    setIsConfirming(true)
    try {
      await onConfirm()
      if (!preventAutoClose) {
        onOpenChange(false)
      }
    } catch (error) {
      console.error('Error in confirmation action:', error)
    } finally {
      setIsConfirming(false)
    }
  }

  const handleCancel = () => {
    if (!isConfirming && !isLoading) {
      onOpenChange(false)
    }
  }

  const displayMessage = message || description
  const loading = isConfirming || isLoading

  if (trigger) {
    return (
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        {trigger}
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {variant === 'destructive' && (
                <AlertTriangle className="h-5 w-5 text-red-500" />
              )}
              {title}
            </DialogTitle>
          </DialogHeader>
          
          {displayMessage && (
            <div className="py-4">
              <p className="text-sm text-gray-600">
                {displayMessage}
              </p>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={loading}
            >
              {cancelText}
            </Button>
            <Button
              variant={variant}
              onClick={handleConfirm}
              disabled={loading}
              className="min-w-[100px]"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {variant === 'destructive' ? 'Deleting...' : 'Loading...'}
                </>
              ) : (
                confirmText
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {variant === 'destructive' && (
              <AlertTriangle className="h-5 w-5 text-red-500" />
            )}
            {title}
          </DialogTitle>
        </DialogHeader>
        
        {displayMessage && (
          <div className="py-4">
            <p className="text-sm text-gray-600">
              {displayMessage}
            </p>
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={loading}
          >
            {cancelText}
          </Button>
          <Button
            variant={variant}
            onClick={handleConfirm}
            disabled={loading}
            className="min-w-[100px]"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {variant === 'destructive' ? 'Deleting...' : 'Loading...'}
              </>
            ) : (
              confirmText
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}