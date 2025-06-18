'use client'

import { useState, useEffect, useCallback } from 'react'

interface ErrorAlertProps {
  error: string | null
  onClose?: () => void
  autoHide?: boolean
  autoHideDelay?: number
  variant?: 'error' | 'warning' | 'info'
  title?: string
  actionLabel?: string
  onAction?: () => void
}

export function ErrorAlert({ 
  error, 
  onClose, 
  autoHide = false,
  autoHideDelay = 5000,
  variant = 'error',
  title,
  actionLabel,
  onAction
}: ErrorAlertProps) {
  const [isVisible, setIsVisible] = useState(!!error)
  const [isAnimating, setIsAnimating] = useState(false)

  const handleClose = useCallback(() => {
    setIsAnimating(false)
    setTimeout(() => {
      setIsVisible(false)
      onClose?.()
    }, 300)
  }, [onClose])

  useEffect(() => {
    if (error) {
      setIsVisible(true)
      setIsAnimating(true)
      
      if (autoHide) {
        const timer = setTimeout(() => {
          handleClose()
        }, autoHideDelay)
        
        return () => clearTimeout(timer)
      }
    } else {
      setIsVisible(false)
      setIsAnimating(false)
    }
  }, [error, autoHide, autoHideDelay, handleClose])


  const getVariantStyles = () => {
    switch (variant) {
      case 'error':
        return {
          container: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
          icon: '❌',
          iconColor: 'text-red-500',
          titleColor: 'text-red-800 dark:text-red-200',
          textColor: 'text-red-700 dark:text-red-300',
          buttonColor: 'text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300'
        }
      case 'warning':
        return {
          container: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
          icon: '⚠️',
          iconColor: 'text-yellow-500',
          titleColor: 'text-yellow-800 dark:text-yellow-200',
          textColor: 'text-yellow-700 dark:text-yellow-300',
          buttonColor: 'text-yellow-600 dark:text-yellow-400 hover:text-yellow-700 dark:hover:text-yellow-300'
        }
      case 'info':
        return {
          container: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
          icon: 'ℹ️',
          iconColor: 'text-blue-500',
          titleColor: 'text-blue-800 dark:text-blue-200',
          textColor: 'text-blue-700 dark:text-blue-300',
          buttonColor: 'text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300'
        }
    }
  }

  const styles = getVariantStyles()

  if (!isVisible || !error) return null

  return (
    <div className={`
      p-4 border rounded-lg transition-all duration-300 ease-in-out transform
      ${styles.container}
      ${isAnimating 
        ? 'opacity-100 scale-100 translate-y-0' 
        : 'opacity-0 scale-95 -translate-y-2'
      }
    `}>
      <div className="flex items-start gap-3">
        <span className={`${styles.iconColor} text-xl mt-0.5 flex-shrink-0`}>
          {styles.icon}
        </span>
        
        <div className="flex-1 min-w-0">
          {title && (
            <h4 className={`font-medium ${styles.titleColor} mb-1`}>
              {title}
            </h4>
          )}
          
          <p className={`${styles.textColor} text-sm leading-relaxed break-words`}>
            {error}
          </p>
          
          {/* Action Buttons */}
          <div className="mt-3 flex items-center gap-4">
            {actionLabel && onAction && (
              <button
                onClick={onAction}
                className={`text-xs font-medium ${styles.buttonColor} underline transition-colors duration-200`}
              >
                {actionLabel}
              </button>
            )}
            
            {onClose && (
              <button
                onClick={handleClose}
                className={`text-xs ${styles.buttonColor} underline transition-colors duration-200`}
              >
                閉じる
              </button>
            )}
          </div>
        </div>
        
        {/* Close Button */}
        {onClose && (
          <button
            onClick={handleClose}
            className={`${styles.iconColor} hover:opacity-70 transition-opacity duration-200 flex-shrink-0`}
            aria-label="閉じる"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}