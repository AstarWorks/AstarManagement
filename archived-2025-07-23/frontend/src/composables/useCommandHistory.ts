/**
 * Command History Composable for Undo/Redo Operations
 * 
 * @description Implements command pattern for reversible operations
 * with undo/redo functionality and keyboard shortcuts.
 * 
 * @author Claude
 * @created 2025-07-03
 * @task T10_S12 - Kanban Multi-Select and Bulk Operations
 */

import { ref, computed } from 'vue'
import { useEventListener, useKeyModifier } from '@vueuse/core'
import { useAccessibility } from '~/composables/useAccessibility'

/**
 * Command interface for reversible operations
 */
export interface Command {
  /** Unique identifier for the command */
  id: string
  /** Human-readable description */
  description: string
  /** Execute the command */
  execute(): Promise<void> | void
  /** Undo the command */
  undo(): Promise<void> | void
  /** Whether this command can be undone */
  canUndo?: boolean
  /** Timestamp when command was executed */
  timestamp: number
  /** Additional metadata */
  metadata?: Record<string, any>
}

/**
 * Command history options
 */
export interface CommandHistoryOptions {
  /** Maximum number of commands to keep in history */
  maxHistory?: number
  /** Enable keyboard shortcuts (Ctrl+Z, Ctrl+Y) */
  enableKeyboardShortcuts?: boolean
  /** Callback when command is executed */
  onCommandExecuted?: (command: Command) => void
  /** Callback when command is undone */
  onCommandUndone?: (command: Command) => void
  /** Callback when command is redone */
  onCommandRedone?: (command: Command) => void
}

/**
 * Command history state
 */
interface CommandHistoryState {
  history: Command[]
  currentIndex: number
  isExecuting: boolean
}

/**
 * Command history composable
 */
export function useCommandHistory(options: CommandHistoryOptions = {}) {
  const {
    maxHistory = 50,
    enableKeyboardShortcuts = true,
    onCommandExecuted,
    onCommandUndone,
    onCommandRedone
  } = options

  const { announceUpdate } = useAccessibility()
  
  // Keyboard modifiers
  const ctrlPressed = useKeyModifier('Control')
  const metaPressed = useKeyModifier('Meta')
  const shiftPressed = useKeyModifier('Shift')

  // Command history state
  const state = ref<CommandHistoryState>({
    history: [],
    currentIndex: -1,
    isExecuting: false
  })

  // Computed properties
  const canUndo = computed(() => 
    state.value.currentIndex >= 0 && 
    state.value.history[state.value.currentIndex]?.canUndo !== false
  )

  const canRedo = computed(() => 
    state.value.currentIndex < state.value.history.length - 1
  )

  const lastCommand = computed(() => 
    state.value.currentIndex >= 0 
      ? state.value.history[state.value.currentIndex]
      : null
  )

  const nextCommand = computed(() => 
    canRedo.value 
      ? state.value.history[state.value.currentIndex + 1]
      : null
  )

  const historySize = computed(() => state.value.history.length)

  /**
   * Execute a command and add it to history
   */
  const executeCommand = async (command: Command): Promise<void> => {
    if (state.value.isExecuting) {
      throw new Error('Cannot execute command while another command is executing')
    }

    state.value.isExecuting = true

    try {
      // Execute the command
      await command.execute()

      // Clear any redo history after current position
      if (state.value.currentIndex < state.value.history.length - 1) {
        state.value.history = state.value.history.slice(0, state.value.currentIndex + 1)
      }

      // Add command to history
      state.value.history.push({
        ...command,
        timestamp: Date.now()
      })

      // Increment current index
      state.value.currentIndex++

      // Trim history if it exceeds max size
      if (state.value.history.length > maxHistory) {
        const excess = state.value.history.length - maxHistory
        state.value.history = state.value.history.slice(excess)
        state.value.currentIndex -= excess
      }

      // Callback
      onCommandExecuted?.(command)

      // Accessibility announcement
      announceUpdate(`Executed: ${command.description}`)

    } catch (error) {
      console.error('Command execution failed:', error)
      throw error
    } finally {
      state.value.isExecuting = false
    }
  }

  /**
   * Undo the last command
   */
  const undo = async (): Promise<void> => {
    if (!canUndo.value || state.value.isExecuting) {
      return
    }

    const command = state.value.history[state.value.currentIndex]
    if (!command) return

    state.value.isExecuting = true

    try {
      await command.undo()
      state.value.currentIndex--

      // Callback
      onCommandUndone?.(command)

      // Accessibility announcement
      announceUpdate(`Undone: ${command.description}`)

    } catch (error) {
      console.error('Undo failed:', error)
      throw error
    } finally {
      state.value.isExecuting = false
    }
  }

  /**
   * Redo the next command
   */
  const redo = async (): Promise<void> => {
    if (!canRedo.value || state.value.isExecuting) {
      return
    }

    const command = state.value.history[state.value.currentIndex + 1]
    if (!command) return

    state.value.isExecuting = true

    try {
      await command.execute()
      state.value.currentIndex++

      // Callback
      onCommandRedone?.(command)

      // Accessibility announcement
      announceUpdate(`Redone: ${command.description}`)

    } catch (error) {
      console.error('Redo failed:', error)
      throw error
    } finally {
      state.value.isExecuting = false
    }
  }

  /**
   * Clear command history
   */
  const clearHistory = (): void => {
    state.value.history = []
    state.value.currentIndex = -1
    announceUpdate('Command history cleared')
  }

  /**
   * Get command at specific index
   */
  const getCommand = (index: number): Command | null => {
    return state.value.history[index] || null
  }

  /**
   * Get recent commands
   */
  const getRecentCommands = (count: number = 10): Command[] => {
    const start = Math.max(0, state.value.history.length - count)
    return state.value.history.slice(start)
  }

  /**
   * Keyboard shortcut handler
   */
  const handleKeyboardShortcuts = (event: KeyboardEvent): void => {
    if (!enableKeyboardShortcuts) return

    const isModifierPressed = ctrlPressed.value || metaPressed.value

    if (isModifierPressed && event.key === 'z') {
      event.preventDefault()
      
      if (shiftPressed.value) {
        // Ctrl+Shift+Z or Cmd+Shift+Z = Redo
        redo()
      } else {
        // Ctrl+Z or Cmd+Z = Undo
        undo()
      }
    } else if (isModifierPressed && event.key === 'y') {
      // Ctrl+Y or Cmd+Y = Redo (Windows/Linux style)
      event.preventDefault()
      redo()
    }
  }

  // Register keyboard event listener
  if (enableKeyboardShortcuts) {
    useEventListener('keydown', handleKeyboardShortcuts)
  }

  return {
    // State
    canUndo,
    canRedo,
    lastCommand,
    nextCommand,
    historySize,
    isExecuting: computed(() => state.value.isExecuting),

    // Methods
    executeCommand,
    undo,
    redo,
    clearHistory,
    getCommand,
    getRecentCommands,

    // Raw state for advanced usage
    state: readonly(state)
  }
}

/**
 * Utility function to create a simple command
 */
export function createCommand(
  id: string,
  description: string,
  execute: () => Promise<void> | void,
  undo: () => Promise<void> | void,
  options: Partial<Command> = {}
): Command {
  return {
    id,
    description,
    execute,
    undo,
    timestamp: 0, // Will be set when executed
    canUndo: true,
    ...options
  }
}

/**
 * Utility function to create a batch command that executes multiple commands
 */
export function createBatchCommand(
  id: string,
  description: string,
  commands: Omit<Command, 'timestamp'>[]
): Command {
  return {
    id,
    description,
    timestamp: 0,
    canUndo: commands.every(cmd => cmd.canUndo !== false),
    
    async execute() {
      // Execute all commands in order
      for (const command of commands) {
        await command.execute()
      }
    },
    
    async undo() {
      // Undo all commands in reverse order
      for (let i = commands.length - 1; i >= 0; i--) {
        await commands[i].undo()
      }
    },
    
    metadata: {
      commandCount: commands.length,
      commandIds: commands.map(cmd => cmd.id)
    }
  }
}

/**
 * Type for the return value of useCommandHistory
 */
export type CommandHistoryInstance = ReturnType<typeof useCommandHistory>