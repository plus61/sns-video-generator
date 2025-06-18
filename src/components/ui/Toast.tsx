'use client'

import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'

export interface ToastMessage {
  id: string
  message: string
  type: 'success' | 'error' | 'warning' | 'info'
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

interface ToastProps {
  toast: ToastMessage
  onClose: (id: string) => void
}

interface ToastContainerProps {
  toasts: ToastMessage[]
  onClose: (id: string) => void
}

function Toast({ toast, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(false)

  const handleClose = useCallback(() => {
    setIsVisible(false)
    setTimeout(() => {
      onClose(toast.id)
    }, 300)
  }, [toast.id, onClose])

  useEffect(() => {
    // Trigger entrance animation
    const timer = setTimeout(() => setIsVisible(true), 100)
    
    // Auto-hide timer
    const hideTimer = setTimeout(() => {
      handleClose()
    }, toast.duration || 5000)

    return () => {
      clearTimeout(timer)
      clearTimeout(hideTimer)
    }
  }, [toast.duration, handleClose])

  const getTypeStyles = () => {
    switch (toast.type) {
      case 'success':
        return {
          container: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
          icon: '✅',
          iconColor: 'text-green-500',
          textColor: 'text-green-800 dark:text-green-200',
          actionColor: 'text-green-600 hover:text-green-700'
        }
      case 'error':
        return {
          container: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
          icon: '❌',
          iconColor: 'text-red-500',
          textColor: 'text-red-800 dark:text-red-200',
          actionColor: 'text-red-600 hover:text-red-700'
        }
      case 'warning':
        return {
          container: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
          icon: '⚠️',
          iconColor: 'text-yellow-500',
          textColor: 'text-yellow-800 dark:text-yellow-200',
          actionColor: 'text-yellow-600 hover:text-yellow-700'
        }
      case 'info':
        return {
          container: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
          icon: 'ℹ️',
          iconColor: 'text-blue-500',
          textColor: 'text-blue-800 dark:text-blue-200',
          actionColor: 'text-blue-600 hover:text-blue-700'
        }
    }
  }

  const styles = getTypeStyles()

  return (
    <div className={`
      pointer-events-auto w-full max-w-sm overflow-hidden rounded-lg border shadow-lg
      transition-all duration-300 ease-in-out transform
      ${styles.container}
      ${isVisible 
        ? 'translate-x-0 opacity-100' 
        : 'translate-x-full opacity-0'
      }
    `}>
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <span className={`${styles.iconColor} text-lg`}>
              {styles.icon}
            </span>
          </div>
          
          <div className="ml-3 w-0 flex-1">
            <p className={`text-sm font-medium ${styles.textColor}`}>
              {toast.message}
            </p>
            
            {toast.action && (
              <div className="mt-2">
                <button
                  onClick={toast.action.onClick}
                  className={`text-sm font-medium ${styles.actionColor} transition-colors duration-200`}
                >
                  {toast.action.label}
                </button>
              </div>
            )}
          </div>
          
          <div className="ml-4 flex flex-shrink-0">
            <button
              onClick={handleClose}
              className={`inline-flex rounded-md ${styles.iconColor} hover:opacity-70 transition-opacity duration-200`}
            >
              <span className="sr-only">閉じる</span>
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export function ToastContainer({ toasts, onClose }: ToastContainerProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center px-4 py-6 pointer-events-none sm:items-start sm:justify-end sm:p-6">
      <div className="w-full flex flex-col items-center space-y-4 sm:items-end">
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} onClose={onClose} />
        ))}
      </div>
    </div>,
    document.body
  )
}

// Toast manager hook
export function useToast() {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const addToast = (message: string, type: ToastMessage['type'] = 'info', options?: {
    duration?: number
    action?: ToastMessage['action']
  }) => {
    const id = Math.random().toString(36).substr(2, 9)
    const newToast: ToastMessage = {
      id,
      message,
      type,
      duration: options?.duration,
      action: options?.action
    }
    
    setToasts(prev => [...prev, newToast])
    return id
  }

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }

  const clearAll = () => {
    setToasts([])
  }

  // Convenience methods
  const success = (message: string, options?: { duration?: number; action?: ToastMessage['action'] }) => 
    addToast(message, 'success', options)
  
  const error = (message: string, options?: { duration?: number; action?: ToastMessage['action'] }) => 
    addToast(message, 'error', options)
  
  const warning = (message: string, options?: { duration?: number; action?: ToastMessage['action'] }) => 
    addToast(message, 'warning', options)
  
  const info = (message: string, options?: { duration?: number; action?: ToastMessage['action'] }) => 
    addToast(message, 'info', options)

  return {
    toasts,
    addToast,
    removeToast,
    clearAll,
    success,
    error,
    warning,
    info,
    ToastContainer: () => <ToastContainer toasts={toasts} onClose={removeToast} />
  }
}