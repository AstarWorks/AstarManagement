"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface LoadingButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
  loadingText?: string
  icon?: React.ReactNode
  iconPosition?: 'left' | 'right'
}

const LoadingButton = React.forwardRef<HTMLButtonElement, LoadingButtonProps>(
  ({ 
    className, 
    variant, 
    size, 
    asChild = false, 
    loading = false,
    loadingText,
    icon,
    iconPosition = 'left',
    children,
    disabled,
    ...props 
  }, ref) => {
    const Comp = asChild ? Slot : "button"
    
    const isDisabled = disabled || loading
    const displayText = loading && loadingText ? loadingText : children
    
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={isDisabled}
        aria-busy={loading}
        {...props}
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {displayText}
          </>
        ) : (
          <>
            {icon && iconPosition === 'left' && (
              <span className="mr-2">{icon}</span>
            )}
            {displayText}
            {icon && iconPosition === 'right' && (
              <span className="ml-2">{icon}</span>
            )}
          </>
        )}
      </Comp>
    )
  }
)
LoadingButton.displayName = "LoadingButton"

/**
 * Icon button with loading state
 */
export interface LoadingIconButtonProps extends LoadingButtonProps {
  icon: React.ReactNode
  'aria-label': string
}

const LoadingIconButton = React.forwardRef<HTMLButtonElement, LoadingIconButtonProps>(
  ({ loading = false, icon, className, ...props }, ref) => {
    return (
      <LoadingButton
        ref={ref}
        size="icon"
        variant="ghost"
        className={cn("flex-shrink-0", className)}
        loading={loading}
        {...props}
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : icon}
      </LoadingButton>
    )
  }
)
LoadingIconButton.displayName = "LoadingIconButton"

/**
 * Submit button with loading state
 */
export interface SubmitButtonProps extends LoadingButtonProps {
  form?: string
}

const SubmitButton = React.forwardRef<HTMLButtonElement, SubmitButtonProps>(
  ({ loading = false, loadingText = "Submitting...", children = "Submit", ...props }, ref) => {
    return (
      <LoadingButton
        ref={ref}
        type="submit"
        loading={loading}
        loadingText={loadingText}
        {...props}
      >
        {children}
      </LoadingButton>
    )
  }
)
SubmitButton.displayName = "SubmitButton"

/**
 * Async action button with promise handling
 */
export interface AsyncButtonProps extends Omit<LoadingButtonProps, 'loading'> {
  onClick?: () => Promise<void> | void
  onSuccess?: () => void
  onError?: (error: Error) => void
}

const AsyncButton = React.forwardRef<HTMLButtonElement, AsyncButtonProps>(
  ({ onClick, onSuccess, onError, ...props }, ref) => {
    const [loading, setLoading] = React.useState(false)

    const handleClick = React.useCallback(async (e: React.MouseEvent<HTMLButtonElement>) => {
      if (!onClick) return
      
      try {
        setLoading(true)
        const result = onClick()
        
        if (result instanceof Promise) {
          await result
        }
        
        onSuccess?.()
      } catch (error) {
        onError?.(error as Error)
      } finally {
        setLoading(false)
      }
    }, [onClick, onSuccess, onError])

    return (
      <LoadingButton
        ref={ref}
        loading={loading}
        onClick={handleClick}
        {...props}
      />
    )
  }
)
AsyncButton.displayName = "AsyncButton"

export { LoadingButton, LoadingIconButton, SubmitButton, AsyncButton, buttonVariants }