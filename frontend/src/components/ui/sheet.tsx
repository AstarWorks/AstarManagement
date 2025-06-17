/**
 * Bottom Sheet component for mobile interfaces
 * 
 * @description A slide-up modal component optimized for mobile touch interactions.
 * Provides native-like bottom sheet behavior with backdrop, drag handle, and smooth animations.
 */

import * as React from 'react'
import { cn } from '@/lib/utils'
import { X } from 'lucide-react'

interface SheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
  className?: string
}

interface SheetContentProps {
  side?: 'bottom' | 'top' | 'left' | 'right'
  className?: string
  children: React.ReactNode
  onClose?: () => void
}

interface SheetHeaderProps {
  className?: string
  children: React.ReactNode
}

interface SheetTitleProps {
  className?: string
  children: React.ReactNode
}

interface SheetDescriptionProps {
  className?: string
  children: React.ReactNode
}

// Context for sharing sheet state
const SheetContext = React.createContext<{
  open: boolean
  onOpenChange: (open: boolean) => void
} | null>(null)

function useSheetContext() {
  const context = React.useContext(SheetContext)
  if (!context) {
    throw new Error('Sheet components must be used within a Sheet')
  }
  return context
}

/**
 * Sheet Root Component
 */
function Sheet({ open, onOpenChange, children, className }: SheetProps) {
  return (
    <SheetContext.Provider value={{ open, onOpenChange }}>
      <div className={cn(className)}>
        {children}
      </div>
    </SheetContext.Provider>
  )
}

/**
 * Sheet Content - The actual modal/sheet
 */
function SheetContent({ 
  side = 'bottom', 
  className, 
  children, 
  onClose 
}: SheetContentProps) {
  const { open, onOpenChange } = useSheetContext()
  const contentRef = React.useRef<HTMLDivElement>(null)
  const [startY, setStartY] = React.useState<number>(0)
  const [currentY, setCurrentY] = React.useState<number>(0)
  const [isDragging, setIsDragging] = React.useState<boolean>(false)

  // Handle backdrop click
  const handleBackdropClick = React.useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onOpenChange(false)
      onClose?.()
    }
  }, [onOpenChange, onClose])

  // Handle escape key
  React.useEffect(() => {
    if (!open) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onOpenChange(false)
        onClose?.()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [open, onOpenChange, onClose])

  // Handle touch gestures for bottom sheet
  const handleTouchStart = React.useCallback((e: React.TouchEvent) => {
    if (side !== 'bottom') return
    
    setStartY(e.touches[0].clientY)
    setCurrentY(e.touches[0].clientY)
    setIsDragging(true)
  }, [side])

  const handleTouchMove = React.useCallback((e: React.TouchEvent) => {
    if (!isDragging || side !== 'bottom') return
    
    const newY = e.touches[0].clientY
    setCurrentY(newY)
    
    // Prevent scrolling when dragging down
    if (newY > startY) {
      e.preventDefault()
    }
  }, [isDragging, startY, side])

  const handleTouchEnd = React.useCallback(() => {
    if (!isDragging || side !== 'bottom') return
    
    const deltaY = currentY - startY
    const threshold = 50 // pixels
    
    if (deltaY > threshold) {
      onOpenChange(false)
      onClose?.()
    }
    
    setIsDragging(false)
    setStartY(0)
    setCurrentY(0)
  }, [isDragging, currentY, startY, onOpenChange, onClose, side])

  // Prevent body scroll when sheet is open
  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = 'unset'
      }
    }
  }, [open])

  if (!open) return null

  const slideDistance = isDragging ? Math.max(0, currentY - startY) : 0

  const slideClasses = {
    bottom: 'inset-x-0 bottom-0 border-t',
    top: 'inset-x-0 top-0 border-b',
    left: 'inset-y-0 left-0 border-r',
    right: 'inset-y-0 right-0 border-l'
  }

  const animationClasses = {
    bottom: open ? 'animate-in slide-in-from-bottom-full' : 'animate-out slide-out-to-bottom-full',
    top: open ? 'animate-in slide-in-from-top-full' : 'animate-out slide-out-to-top-full',
    left: open ? 'animate-in slide-in-from-left-full' : 'animate-out slide-out-to-left-full',
    right: open ? 'animate-in slide-in-from-right-full' : 'animate-out slide-out-to-right-full'
  }

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 transition-opacity duration-200"
        onClick={handleBackdropClick}
      />
      
      {/* Sheet Content */}
      <div
        ref={contentRef}
        className={cn(
          "fixed bg-background shadow-lg transition-transform duration-200 ease-out",
          slideClasses[side],
          animationClasses[side],
          side === 'bottom' && "max-h-[85vh] rounded-t-xl",
          side === 'top' && "max-h-[85vh] rounded-b-xl",
          side === 'left' && "max-w-[85vw] h-full",
          side === 'right' && "max-w-[85vw] h-full",
          className
        )}
        style={{
          transform: side === 'bottom' && isDragging 
            ? `translateY(${slideDistance}px)` 
            : undefined
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Drag Handle for bottom sheet */}
        {side === 'bottom' && (
          <div className="flex justify-center pt-2 pb-1">
            <div className="w-10 h-1 bg-muted-foreground/30 rounded-full" />
          </div>
        )}
        
        {children}
      </div>
    </div>
  )
}

/**
 * Sheet Header
 */
function SheetHeader({ className, children }: SheetHeaderProps) {
  return (
    <div className={cn("space-y-2 p-4 pb-0", className)}>
      {children}
    </div>
  )
}

/**
 * Sheet Title
 */
function SheetTitle({ className, children }: SheetTitleProps) {
  return (
    <h3 className={cn("text-lg font-semibold leading-none tracking-tight", className)}>
      {children}
    </h3>
  )
}

/**
 * Sheet Description
 */
function SheetDescription({ className, children }: SheetDescriptionProps) {
  return (
    <p className={cn("text-sm text-muted-foreground", className)}>
      {children}
    </p>
  )
}

/**
 * Sheet Close Button
 */
function SheetClose({ className, children, ...props }: React.ComponentProps<'button'>) {
  const { onOpenChange } = useSheetContext()
  
  return (
    <button
      className={cn(
        "absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100",
        "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        "disabled:pointer-events-none",
        className
      )}
      onClick={() => onOpenChange(false)}
      {...props}
    >
      {children || <X className="h-4 w-4" />}
      <span className="sr-only">Close</span>
    </button>
  )
}

export {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetClose
}