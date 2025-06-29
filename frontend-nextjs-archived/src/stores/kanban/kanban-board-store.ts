/**
 * Kanban Board Store - Board state, columns, and drag/drop operations
 * 
 * Handles board initialization, column management, and drag/drop context
 * Separated from main kanban store for better modularity and testing
 */

import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import {
    KanbanBoard,
    MatterCard
} from '@/components/kanban/types'
import {
    DEFAULT_COLUMNS
} from '@/components/kanban/constants'

// Board-specific state interface
interface KanbanBoardState {
    // Board data
    board: KanbanBoard | null
    
    // Drag and drop state
    dragContext: {
        activeId: string | null
        overId: string | null
        isDragging: boolean
    }
    
    // Board actions
    initializeBoard: (matters?: MatterCard[]) => void
    setDragContext: (context: Partial<KanbanBoardState['dragContext']>) => void
    updateBoard: (updates: Partial<KanbanBoard>) => void
    getBoardId: () => string | null
}

// Create the board store
export const useKanbanBoardStore = create<KanbanBoardState>()(
    subscribeWithSelector(
        immer((set, get) => ({
            // Initial state
            board: null,
            dragContext: {
                activeId: null,
                overId: null,
                isDragging: false
            },

            // Board operations
            initializeBoard: (matters = []) => set((state) => {
                state.board = {
                    id: 'main-board',
                    title: 'Aster Management - Legal Matters',
                    columns: DEFAULT_COLUMNS,
                    matters,
                    lastUpdated: new Date().toISOString()
                }
            }),

            setDragContext: (context) => set((state) => {
                Object.assign(state.dragContext, context)
            }),

            updateBoard: (updates) => set((state) => {
                if (state.board) {
                    Object.assign(state.board, updates)
                    state.board.lastUpdated = new Date().toISOString()
                }
            }),

            getBoardId: () => get().board?.id || null
        }))
    )
)

// Selector hooks for optimized re-renders
export const useBoard = () => useKanbanBoardStore((state) => state.board)
export const useDragContext = () => useKanbanBoardStore((state) => state.dragContext)
export const useBoardActions = () => useKanbanBoardStore((state) => ({
    initializeBoard: state.initializeBoard,
    setDragContext: state.setDragContext,
    updateBoard: state.updateBoard,
    getBoardId: state.getBoardId
}))

// SSR-compatible server snapshot
const getServerSnapshot = (): KanbanBoardState => ({
    board: null,
    dragContext: {
        activeId: null,
        overId: null,
        isDragging: false
    },
    initializeBoard: () => {},
    setDragContext: () => {},
    updateBoard: () => {},
    getBoardId: () => null
})

export { getServerSnapshot as getBoardServerSnapshot }