'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Loader2 } from 'lucide-react'

export interface ConfirmationModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  title: string
  message?: string
  description?: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void | Promise<void>
  isLoading?: boolean
  variant?: 'default' | 'destructive'
  preventAutoClose?: boolean
  trigger?: React.ReactElement
}

export default function ConfirmationModal({
  isOpen,
  onOpenChange,
  title,
  message,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  isLoading = false,
  variant = 'default',
  preventAutoClose = false,
  trigger
}: ConfirmationModalProps) {
  const [internalLoading, setInternalLoading] = useState(false)

  const handleConfirm = async () => {
    try {
      setInternalLoading(true)
      await onConfirm()
      if (!preventAutoClose) {
        onOpenChange(false)
      }
    } catch (error) {
      console.error('Error in confirmation action:', error)
    } finally {
      setInternalLoading(false)
    }
  }

  const isProcessing = isLoading || internalLoading

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          {message && (
            <p className="text-sm text-gray-600 mb-4">
              {message}
            </p>
          )}
          {description && (
            <p className="text-sm text-gray-600">
              {description}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isProcessing}
          >
            {cancelText}
          </Button>
          <Button
            variant={variant}
            onClick={handleConfirm}
            disabled={isProcessing}
            className="min-w-[80px]"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
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