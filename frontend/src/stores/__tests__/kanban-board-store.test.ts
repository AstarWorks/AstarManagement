/**
 * Tests for kanban-board-store
 * Tests board state management, drag/drop operations, and SSR compatibility
 */

import { renderHook, act } from '@testing-library/react'
import { 
    useKanbanBoardStore,
    useBoard,
    useDragContext,
    useBoardActions,
    getBoardServerSnapshot
} from '../kanban/kanban-board-store'
import { DEFAULT_COLUMNS } from '@/components/kanban/constants'
import type { MatterCard } from '@/components/kanban/types'

// Mock matter data for testing
const mockMatters: MatterCard[] = [
    {
        id: 'matter-1',
        caseNumber: '2025-CV-0001',
        title: 'Test Matter 1',
        description: 'Test description',
        clientName: 'Test Client',
        clientContact: '',
        opposingParty: '',
        courtName: '',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        filingDate: '2025-01-01',
        estimatedCompletionDate: '2025-03-01',
        assignedLawyerId: 'lawyer-1',
        assignedLawyerName: 'Test Lawyer',
        assignedClerkId: '',
        assignedClerkName: '',
        notes: '',
        tags: [],
        isActive: true,
        isOverdue: false,
        isCompleted: false,
        ageInDays: 30,
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
        createdBy: 'Test User',
        updatedBy: 'Test User'
    }
]

describe('KanbanBoardStore', () => {
    beforeEach(() => {
        // Reset store state before each test
        useKanbanBoardStore.setState({
            board: null,
            dragContext: {
                activeId: null,
                overId: null,
                isDragging: false
            }
        })
    })

    describe('Board initialization', () => {
        test('initializes board with default values', () => {
            const { result } = renderHook(() => useKanbanBoardStore())
            
            act(() => {
                result.current.initializeBoard()
            })

            expect(result.current.board).toMatchObject({
                id: 'main-board',
                title: 'Aster Management - Legal Matters',
                columns: DEFAULT_COLUMNS,
                matters: [],
                lastUpdated: expect.any(String)
            })
        })

        test('initializes board with provided matters', () => {
            const { result } = renderHook(() => useKanbanBoardStore())
            
            act(() => {
                result.current.initializeBoard(mockMatters)
            })

            expect(result.current.board?.matters).toEqual(mockMatters)
            expect(result.current.board?.matters).toHaveLength(1)
        })

        test('updates lastUpdated timestamp on initialization', () => {
            const { result } = renderHook(() => useKanbanBoardStore())
            const beforeTime = new Date().toISOString()
            
            act(() => {
                result.current.initializeBoard()
            })

            const afterTime = new Date().toISOString()
            const boardTime = result.current.board?.lastUpdated

            expect(boardTime).toBeDefined()
            expect(boardTime! >= beforeTime).toBe(true)
            expect(boardTime! <= afterTime).toBe(true)
        })
    })

    describe('Drag context management', () => {
        test('sets drag context correctly', () => {
            const { result } = renderHook(() => useKanbanBoardStore())
            
            act(() => {
                result.current.setDragContext({
                    activeId: 'matter-1',
                    isDragging: true
                })
            })

            expect(result.current.dragContext).toMatchObject({
                activeId: 'matter-1',
                overId: null,
                isDragging: true
            })
        })

        test('updates partial drag context', () => {
            const { result } = renderHook(() => useKanbanBoardStore())
            
            // Set initial drag state
            act(() => {
                result.current.setDragContext({
                    activeId: 'matter-1',
                    isDragging: true
                })
            })

            // Update only overId
            act(() => {
                result.current.setDragContext({
                    overId: 'column-2'
                })
            })

            expect(result.current.dragContext).toMatchObject({
                activeId: 'matter-1',
                overId: 'column-2',
                isDragging: true
            })
        })

        test('resets drag context', () => {
            const { result } = renderHook(() => useKanbanBoardStore())
            
            // Set drag state
            act(() => {
                result.current.setDragContext({
                    activeId: 'matter-1',
                    overId: 'column-2',
                    isDragging: true
                })
            })

            // Reset
            act(() => {
                result.current.setDragContext({
                    activeId: null,
                    overId: null,
                    isDragging: false
                })
            })

            expect(result.current.dragContext).toMatchObject({
                activeId: null,
                overId: null,
                isDragging: false
            })
        })
    })

    describe('Board updates', () => {
        test('updates board properties', () => {
            const { result } = renderHook(() => useKanbanBoardStore())
            
            // Initialize board first
            act(() => {
                result.current.initializeBoard()
            })

            const originalLastUpdated = result.current.board?.lastUpdated

            // Update board
            act(() => {
                result.current.updateBoard({
                    title: 'Updated Board Title'
                })
            })

            expect(result.current.board?.title).toBe('Updated Board Title')
            expect(result.current.board?.lastUpdated).not.toBe(originalLastUpdated)
        })

        test('handles updates when board is null', () => {
            const { result } = renderHook(() => useKanbanBoardStore())
            
            // Try to update without initializing
            act(() => {
                result.current.updateBoard({
                    title: 'Updated Title'
                })
            })

            // Should not crash and board should remain null
            expect(result.current.board).toBeNull()
        })
    })

    describe('Board ID getter', () => {
        test('returns board ID when board exists', () => {
            const { result } = renderHook(() => useKanbanBoardStore())
            
            act(() => {
                result.current.initializeBoard()
            })

            expect(result.current.getBoardId()).toBe('main-board')
        })

        test('returns null when board does not exist', () => {
            const { result } = renderHook(() => useKanbanBoardStore())
            
            expect(result.current.getBoardId()).toBeNull()
        })
    })

    describe('Selector hooks', () => {
        test('useBoard selector returns board state', () => {
            const { result: storeResult } = renderHook(() => useKanbanBoardStore())
            const { result: selectorResult } = renderHook(() => useBoard())
            
            act(() => {
                storeResult.current.initializeBoard()
            })

            expect(selectorResult.current).toEqual(storeResult.current.board)
        })

        test('useDragContext selector returns drag context', () => {
            const { result: storeResult } = renderHook(() => useKanbanBoardStore())
            const { result: selectorResult } = renderHook(() => useDragContext())
            
            act(() => {
                storeResult.current.setDragContext({
                    activeId: 'matter-1',
                    isDragging: true
                })
            })

            expect(selectorResult.current).toEqual(storeResult.current.dragContext)
        })

        test('useBoardActions selector returns action functions', () => {
            const { result } = renderHook(() => useBoardActions())
            
            expect(result.current).toMatchObject({
                initializeBoard: expect.any(Function),
                setDragContext: expect.any(Function),
                updateBoard: expect.any(Function),
                getBoardId: expect.any(Function)
            })
        })
    })

    describe('SSR compatibility', () => {
        test('getBoardServerSnapshot returns correct initial state', () => {
            const snapshot = getBoardServerSnapshot()
            
            expect(snapshot).toMatchObject({
                board: null,
                dragContext: {
                    activeId: null,
                    overId: null,
                    isDragging: false
                },
                initializeBoard: expect.any(Function),
                setDragContext: expect.any(Function),
                updateBoard: expect.any(Function),
                getBoardId: expect.any(Function)
            })
        })

        test('server snapshot actions are no-ops', () => {
            const snapshot = getBoardServerSnapshot()
            
            // Should not throw
            expect(() => snapshot.initializeBoard()).not.toThrow()
            expect(() => snapshot.setDragContext({})).not.toThrow()
            expect(() => snapshot.updateBoard({})).not.toThrow()
            expect(snapshot.getBoardId()).toBeNull()
        })
    })

    describe('Store persistence', () => {
        test('state persists across hook renders', () => {
            const { result: result1 } = renderHook(() => useKanbanBoardStore())
            
            act(() => {
                result1.current.initializeBoard(mockMatters)
            })

            // Create new hook instance
            const { result: result2 } = renderHook(() => useKanbanBoardStore())
            
            expect(result2.current.board?.matters).toEqual(mockMatters)
        })
    })

    describe('Edge cases', () => {
        test('handles multiple rapid drag context updates', () => {
            const { result } = renderHook(() => useKanbanBoardStore())
            
            act(() => {
                result.current.setDragContext({ activeId: 'matter-1' })
                result.current.setDragContext({ overId: 'column-1' })
                result.current.setDragContext({ isDragging: true })
            })

            expect(result.current.dragContext).toMatchObject({
                activeId: 'matter-1',
                overId: 'column-1',
                isDragging: true
            })
        })

        test('handles board reinitialization', () => {
            const { result } = renderHook(() => useKanbanBoardStore())
            
            // Initialize first time
            act(() => {
                result.current.initializeBoard(mockMatters)
            })

            const firstBoardId = result.current.board?.id

            // Reinitialize
            act(() => {
                result.current.initializeBoard([])
            })

            expect(result.current.board?.id).toBe(firstBoardId)
            expect(result.current.board?.matters).toEqual([])
        })
    })
})