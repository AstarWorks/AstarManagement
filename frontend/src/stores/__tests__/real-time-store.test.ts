/**
 * Tests for real-time-store
 * Tests polling, sync operations, offline queue, and connection management
 */

import { renderHook, act } from '@testing-library/react'
import { 
    useRealTimeStore,
    useSyncStatus,
    useConnectionStatus,
    usePollingStatus,
    useAutoRefreshStatus,
    useOfflineQueue,
    useRealTimeActions,
    getRealTimeServerSnapshot
} from '../kanban/real-time-store'

// Mock timers for testing
jest.useFakeTimers()

describe('RealTimeStore', () => {
    beforeEach(() => {
        // Reset store state before each test
        useRealTimeStore.setState({
            isOnline: true,
            lastSyncTime: null,
            syncInProgress: false,
            syncError: null,
            pollingEnabled: false,
            pollingInterval: 30000,
            pollingTimerId: null,
            autoRefreshEnabled: true,
            autoRefreshInterval: 300000,
            lastRefreshTime: null,
            connectionStatus: 'connected',
            reconnectAttempts: 0,
            maxReconnectAttempts: 5,
            offlineQueue: []
        })
        
        jest.clearAllTimers()
        jest.clearAllMocks()
    })

    afterEach(() => {
        // Clean up any running timers
        jest.clearAllTimers()
    })

    describe('Initial state', () => {
        test('has correct initial state', () => {
            const { result } = renderHook(() => useRealTimeStore())
            
            expect(result.current).toMatchObject({
                isOnline: true,
                lastSyncTime: null,
                syncInProgress: false,
                syncError: null,
                pollingEnabled: false,
                pollingInterval: 30000,
                pollingTimerId: null,
                autoRefreshEnabled: true,
                autoRefreshInterval: 300000,
                lastRefreshTime: null,
                connectionStatus: 'connected',
                reconnectAttempts: 0,
                maxReconnectAttempts: 5,
                offlineQueue: []
            })
        })
    })

    describe('Polling operations', () => {
        test('startPolling enables polling and sets timer', () => {
            const { result } = renderHook(() => useRealTimeStore())
            
            act(() => {
                result.current.startPolling(10000)
            })

            expect(result.current.pollingEnabled).toBe(true)
            expect(result.current.pollingInterval).toBe(10000)
            expect(result.current.pollingTimerId).toBeTruthy()
        })

        test('startPolling uses default interval', () => {
            const { result } = renderHook(() => useRealTimeStore())
            
            act(() => {
                result.current.startPolling()
            })

            expect(result.current.pollingInterval).toBe(30000)
        })

        test('startPolling clears existing timer', () => {
            const { result } = renderHook(() => useRealTimeStore())
            
            // Start polling first
            act(() => {
                result.current.startPolling(5000)
            })

            const firstTimerId = result.current.pollingTimerId

            // Start again with different interval
            act(() => {
                result.current.startPolling(10000)
            })

            expect(result.current.pollingTimerId).not.toBe(firstTimerId)
            expect(result.current.pollingInterval).toBe(10000)
        })

        test('stopPolling disables polling and clears timer', () => {
            const { result } = renderHook(() => useRealTimeStore())
            
            // Start polling first
            act(() => {
                result.current.startPolling()
            })

            act(() => {
                result.current.stopPolling()
            })

            expect(result.current.pollingEnabled).toBe(false)
            expect(result.current.pollingTimerId).toBeNull()
        })

        test('setPollingInterval updates interval and restarts if enabled', () => {
            const { result } = renderHook(() => useRealTimeStore())
            
            // Start polling first
            act(() => {
                result.current.startPolling(5000)
            })

            act(() => {
                result.current.setPollingInterval(15000)
            })

            expect(result.current.pollingInterval).toBe(15000)
            expect(result.current.pollingEnabled).toBe(true)
        })

        test('setPollingInterval when polling disabled', () => {
            const { result } = renderHook(() => useRealTimeStore())
            
            act(() => {
                result.current.setPollingInterval(15000)
            })

            expect(result.current.pollingInterval).toBe(15000)
            expect(result.current.pollingEnabled).toBe(false)
        })
    })

    describe('Auto-refresh operations', () => {
        test('enableAutoRefresh enables auto-refresh', () => {
            const { result } = renderHook(() => useRealTimeStore())
            
            act(() => {
                result.current.enableAutoRefresh(60000)
            })

            expect(result.current.autoRefreshEnabled).toBe(true)
            expect(result.current.autoRefreshInterval).toBe(60000)
        })

        test('enableAutoRefresh starts polling if not enabled', () => {
            const { result } = renderHook(() => useRealTimeStore())
            
            act(() => {
                result.current.enableAutoRefresh(60000)
            })

            expect(result.current.pollingEnabled).toBe(true)
        })

        test('disableAutoRefresh disables auto-refresh', () => {
            const { result } = renderHook(() => useRealTimeStore())
            
            act(() => {
                result.current.disableAutoRefresh()
            })

            expect(result.current.autoRefreshEnabled).toBe(false)
        })

        test('triggerRefresh calls performSync when online', async () => {
            const { result } = renderHook(() => useRealTimeStore())
            
            // Mock performSync to avoid actual API call
            const performSyncSpy = jest.spyOn(result.current, 'performSync').mockResolvedValue()
            
            await act(async () => {
                await result.current.triggerRefresh()
            })

            expect(performSyncSpy).toHaveBeenCalled()
            performSyncSpy.mockRestore()
        })

        test('triggerRefresh does nothing when offline', async () => {
            const { result } = renderHook(() => useRealTimeStore())
            
            // Set offline
            act(() => {
                useRealTimeStore.setState({ isOnline: false })
            })

            const performSyncSpy = jest.spyOn(result.current, 'performSync').mockResolvedValue()
            
            await act(async () => {
                await result.current.triggerRefresh()
            })

            expect(performSyncSpy).not.toHaveBeenCalled()
            performSyncSpy.mockRestore()
        })
    })

    describe('Sync operations', () => {
        test('performSync updates sync state', async () => {
            const { result } = renderHook(() => useRealTimeStore())
            
            await act(async () => {
                await result.current.performSync()
            })

            expect(result.current.syncInProgress).toBe(false)
            expect(result.current.lastSyncTime).toBeInstanceOf(Date)
            expect(result.current.lastRefreshTime).toBeInstanceOf(Date)
            expect(result.current.syncError).toBeNull()
            expect(result.current.connectionStatus).toBe('connected')
            expect(result.current.reconnectAttempts).toBe(0)
        })

        test('performSync handles errors and sets reconnect', async () => {
            const { result } = renderHook(() => useRealTimeStore())
            
            // Mock processOfflineQueue to throw error
            const processQueueSpy = jest.spyOn(result.current, 'processOfflineQueue')
                .mockRejectedValue(new Error('Sync failed'))
            
            await act(async () => {
                try {
                    await result.current.performSync()
                } catch (error) {
                    // Expected to throw
                }
            })

            expect(result.current.syncInProgress).toBe(false)
            expect(result.current.syncError).toBe('Sync failed')
            expect(result.current.connectionStatus).toBe('disconnected')
            
            processQueueSpy.mockRestore()
        })
    })

    describe('Offline queue', () => {
        test('addToOfflineQueue adds action to queue', () => {
            const { result } = renderHook(() => useRealTimeStore())
            
            const action = {
                id: 'action-1',
                action: 'CREATE' as const,
                entityType: 'MATTER' as const,
                data: { title: 'Test Matter' },
                timestamp: new Date()
            }

            act(() => {
                result.current.addToOfflineQueue(action)
            })

            expect(result.current.offlineQueue).toHaveLength(1)
            expect(result.current.offlineQueue[0]).toMatchObject(action)
        })

        test('addToOfflineQueue generates ID if not provided', () => {
            const { result } = renderHook(() => useRealTimeStore())
            
            const action = {
                action: 'UPDATE' as const,
                entityType: 'MATTER' as const,
                data: { title: 'Updated Matter' },
                timestamp: new Date()
            }

            act(() => {
                result.current.addToOfflineQueue(action as any)
            })

            expect(result.current.offlineQueue[0].id).toBeDefined()
            expect(typeof result.current.offlineQueue[0].id).toBe('string')
        })

        test('processOfflineQueue processes all actions', async () => {
            const { result } = renderHook(() => useRealTimeStore())
            
            // Add multiple actions
            const actions = [
                { id: '1', action: 'CREATE' as const, entityType: 'MATTER' as const, data: {}, timestamp: new Date() },
                { id: '2', action: 'UPDATE' as const, entityType: 'MATTER' as const, data: {}, timestamp: new Date() }
            ]

            act(() => {
                useRealTimeStore.setState({ offlineQueue: actions })
            })

            await act(async () => {
                await result.current.processOfflineQueue()
            })

            expect(result.current.offlineQueue).toHaveLength(0)
        })

        test('processOfflineQueue handles empty queue', async () => {
            const { result } = renderHook(() => useRealTimeStore())
            
            await act(async () => {
                await result.current.processOfflineQueue()
            })

            // Should not throw
            expect(result.current.offlineQueue).toHaveLength(0)
        })

        test('clearOfflineQueue empties queue', () => {
            const { result } = renderHook(() => useRealTimeStore())
            
            // Add action first
            act(() => {
                result.current.addToOfflineQueue({
                    id: 'test',
                    action: 'CREATE',
                    entityType: 'MATTER',
                    data: {},
                    timestamp: new Date()
                })
            })

            act(() => {
                result.current.clearOfflineQueue()
            })

            expect(result.current.offlineQueue).toHaveLength(0)
        })
    })

    describe('Connection management', () => {
        test('setConnectionStatus updates status', () => {
            const { result } = renderHook(() => useRealTimeStore())
            
            act(() => {
                result.current.setConnectionStatus('disconnected')
            })

            expect(result.current.connectionStatus).toBe('disconnected')
        })

        test('handleReconnect attempts reconnection', async () => {
            const { result } = renderHook(() => useRealTimeStore())
            
            await act(async () => {
                await result.current.handleReconnect()
            })

            expect(result.current.connectionStatus).toBe('connected')
        })

        test('handleReconnect handles max attempts', async () => {
            const { result } = renderHook(() => useRealTimeStore())
            
            // Set to max attempts
            act(() => {
                useRealTimeStore.setState({ reconnectAttempts: 5 })
            })

            // Mock performSync to fail
            const performSyncSpy = jest.spyOn(result.current, 'performSync')
                .mockRejectedValue(new Error('Connection failed'))

            await act(async () => {
                await result.current.handleReconnect()
            })

            expect(result.current.connectionStatus).toBe('disconnected')
            
            performSyncSpy.mockRestore()
        })

        test('resetReconnectAttempts resets attempts', () => {
            const { result } = renderHook(() => useRealTimeStore())
            
            // Set attempts first
            act(() => {
                useRealTimeStore.setState({ reconnectAttempts: 3 })
            })

            act(() => {
                result.current.resetReconnectAttempts()
            })

            expect(result.current.reconnectAttempts).toBe(0)
        })
    })

    describe('Network status', () => {
        test('setOnlineStatus updates online state', () => {
            const { result } = renderHook(() => useRealTimeStore())
            
            act(() => {
                result.current.setOnlineStatus(false)
            })

            expect(result.current.isOnline).toBe(false)
        })

        test('setOnlineStatus triggers sync when coming online', () => {
            const { result } = renderHook(() => useRealTimeStore())
            
            // Set offline first
            act(() => {
                result.current.setOnlineStatus(false)
            })

            const performSyncSpy = jest.spyOn(result.current, 'performSync').mockResolvedValue()

            act(() => {
                result.current.setOnlineStatus(true)
            })

            // Fast-forward timer
            jest.advanceTimersByTime(1000)

            expect(performSyncSpy).toHaveBeenCalled()
            performSyncSpy.mockRestore()
        })

        test('setOnlineStatus stops polling when going offline', () => {
            const { result } = renderHook(() => useRealTimeStore())
            
            // Start polling first
            act(() => {
                result.current.startPolling()
            })

            const stopPollingSpy = jest.spyOn(result.current, 'stopPolling')

            act(() => {
                result.current.setOnlineStatus(false)
            })

            expect(stopPollingSpy).toHaveBeenCalled()
            stopPollingSpy.mockRestore()
        })
    })

    describe('Error handling', () => {
        test('setSyncError updates error state', () => {
            const { result } = renderHook(() => useRealTimeStore())
            
            act(() => {
                result.current.setSyncError('Test error')
            })

            expect(result.current.syncError).toBe('Test error')
        })

        test('clearSyncError resets error state', () => {
            const { result } = renderHook(() => useRealTimeStore())
            
            // Set error first
            act(() => {
                result.current.setSyncError('Test error')
            })

            act(() => {
                result.current.clearSyncError()
            })

            expect(result.current.syncError).toBeNull()
        })
    })

    describe('Selector hooks', () => {
        test('selector hooks return correct values', () => {
            const { result: syncResult } = renderHook(() => useSyncStatus())
            const { result: connectionResult } = renderHook(() => useConnectionStatus())
            const { result: pollingResult } = renderHook(() => usePollingStatus())
            const { result: autoRefreshResult } = renderHook(() => useAutoRefreshStatus())
            const { result: queueResult } = renderHook(() => useOfflineQueue())

            expect(syncResult.current).toMatchObject({
                isOnline: true,
                lastSyncTime: null,
                syncInProgress: false,
                syncError: null
            })
            expect(connectionResult.current).toMatchObject({
                connectionStatus: 'connected',
                reconnectAttempts: 0,
                maxReconnectAttempts: 5
            })
            expect(pollingResult.current).toMatchObject({
                pollingEnabled: false,
                pollingInterval: 30000
            })
            expect(autoRefreshResult.current).toMatchObject({
                autoRefreshEnabled: true,
                autoRefreshInterval: 300000,
                lastRefreshTime: null
            })
            expect(queueResult.current).toMatchObject({
                queue: [],
                queueSize: 0
            })
        })
    })

    describe('SSR compatibility', () => {
        test('getRealTimeServerSnapshot returns correct initial state', () => {
            const snapshot = getRealTimeServerSnapshot()
            
            expect(snapshot).toMatchObject({
                isOnline: true,
                lastSyncTime: null,
                syncInProgress: false,
                syncError: null,
                pollingEnabled: false,
                pollingInterval: 30000,
                pollingTimerId: null,
                autoRefreshEnabled: true,
                autoRefreshInterval: 300000,
                lastRefreshTime: null,
                connectionStatus: 'connected',
                reconnectAttempts: 0,
                maxReconnectAttempts: 5,
                offlineQueue: [],
                startPolling: expect.any(Function),
                stopPolling: expect.any(Function),
                performSync: expect.any(Function)
            })
        })

        test('server snapshot actions are no-ops', async () => {
            const snapshot = getRealTimeServerSnapshot()
            
            // Should not throw
            expect(() => snapshot.startPolling()).not.toThrow()
            expect(() => snapshot.stopPolling()).not.toThrow()
            expect(() => snapshot.setOnlineStatus(false)).not.toThrow()
            expect(await snapshot.performSync()).toBeUndefined()
        })
    })
})