import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ref } from 'vue'
import { useFormNavigationGuard } from '../useFormNavigationGuard'

// Mock form instance
const createMockForm = (isDirty = false, submitCount = 0) => ({
  isDirty: ref(isDirty),
  submitCount: ref(submitCount),
  values: ref({}),
  errors: ref({}),
  isValid: ref(true),
  setValues: vi.fn(),
  submit: vi.fn()
})

// Mock window.confirm
const mockConfirm = vi.fn()
Object.defineProperty(window, 'confirm', {
  value: mockConfirm,
  writable: true
})

// Mock window event listeners
const mockAddEventListener = vi.fn()
const mockRemoveEventListener = vi.fn()
Object.defineProperty(window, 'addEventListener', {
  value: mockAddEventListener,
  writable: true
})
Object.defineProperty(window, 'removeEventListener', {
  value: mockRemoveEventListener,
  writable: true
})

describe('useFormNavigationGuard', () => {
  let mockForm: any

  beforeEach(() => {
    vi.clearAllMocks()
    mockForm = createMockForm()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('initializes with correct default state', () => {
    const guard = useFormNavigationGuard(mockForm)

    expect(guard.isActive.value).toBe(false)
    expect(guard.hasUnsavedChanges.value).toBe(false)
  })

  it('enables navigation guard correctly', () => {
    const guard = useFormNavigationGuard(mockForm)
    
    guard.enable()
    
    expect(guard.isActive.value).toBe(true)
    expect(mockAddEventListener).toHaveBeenCalledWith('beforeunload', expect.any(Function))
  })

  it('disables navigation guard correctly', () => {
    const guard = useFormNavigationGuard(mockForm)
    
    guard.enable()
    guard.disable()
    
    expect(guard.isActive.value).toBe(false)
    expect(mockRemoveEventListener).toHaveBeenCalledWith('beforeunload', expect.any(Function))
  })

  it('tracks form dirty state changes', () => {
    const guard = useFormNavigationGuard(mockForm)
    
    expect(guard.hasUnsavedChanges.value).toBe(false)
    
    // Make form dirty
    mockForm.isDirty.value = true
    
    // Should update unsaved changes state
    expect(guard.hasUnsavedChanges.value).toBe(true)
  })

  it('blocks navigation when form is dirty', async () => {
    mockConfirm.mockReturnValue(false) // User chooses to stay
    
    const guard = useFormNavigationGuard(mockForm)
    mockForm.isDirty.value = true
    guard.enable()
    
    const shouldBlock = await guard.shouldBlockNavigation()
    
    expect(shouldBlock).toBe(true)
    expect(mockConfirm).toHaveBeenCalledWith('You have unsaved changes. Are you sure you want to leave?')
  })

  it('allows navigation when user confirms', async () => {
    mockConfirm.mockReturnValue(true) // User chooses to leave
    
    const guard = useFormNavigationGuard(mockForm)
    mockForm.isDirty.value = true
    guard.enable()
    
    const shouldBlock = await guard.shouldBlockNavigation()
    
    expect(shouldBlock).toBe(false)
  })

  it('does not block navigation when form is clean', async () => {
    const guard = useFormNavigationGuard(mockForm)
    mockForm.isDirty.value = false
    guard.enable()
    
    const shouldBlock = await guard.shouldBlockNavigation()
    
    expect(shouldBlock).toBe(false)
    expect(mockConfirm).not.toHaveBeenCalled()
  })

  it('does not block navigation when guard is disabled', async () => {
    const guard = useFormNavigationGuard(mockForm)
    mockForm.isDirty.value = true
    // Guard is not enabled
    
    const shouldBlock = await guard.shouldBlockNavigation()
    
    expect(shouldBlock).toBe(false)
  })

  it('clears unsaved changes on form submission', () => {
    const guard = useFormNavigationGuard(mockForm)
    mockForm.isDirty.value = true
    
    expect(guard.hasUnsavedChanges.value).toBe(true)
    
    // Simulate form submission
    mockForm.submitCount.value = 1
    
    // Should clear unsaved changes
    expect(guard.hasUnsavedChanges.value).toBe(false)
  })

  it('uses custom confirmation function', async () => {
    const customConfirm = vi.fn().mockResolvedValue(false)
    
    const guard = useFormNavigationGuard(mockForm, {
      confirmNavigation: customConfirm
    })
    
    mockForm.isDirty.value = true
    guard.enable()
    
    await guard.shouldBlockNavigation()
    
    expect(customConfirm).toHaveBeenCalled()
    expect(mockConfirm).not.toHaveBeenCalled()
  })

  it('uses custom message', async () => {
    const customMessage = 'Custom unsaved changes message'
    mockConfirm.mockReturnValue(true)
    
    const guard = useFormNavigationGuard(mockForm, {
      message: customMessage
    })
    
    mockForm.isDirty.value = true
    guard.enable()
    
    await guard.shouldBlockNavigation()
    
    expect(mockConfirm).toHaveBeenCalledWith(customMessage)
  })

  it('calls navigation attempt handler', async () => {
    const onNavigationAttempt = vi.fn().mockReturnValue(true)
    mockConfirm.mockReturnValue(true)
    
    const guard = useFormNavigationGuard(mockForm, {
      onNavigationAttempt
    })
    
    mockForm.isDirty.value = true
    guard.enable()
    
    await guard.shouldBlockNavigation()
    
    expect(onNavigationAttempt).toHaveBeenCalled()
  })

  it('blocks navigation when navigation attempt handler returns false', async () => {
    const onNavigationAttempt = vi.fn().mockReturnValue(false)
    
    const guard = useFormNavigationGuard(mockForm, {
      onNavigationAttempt
    })
    
    mockForm.isDirty.value = true
    guard.enable()
    
    const shouldBlock = await guard.shouldBlockNavigation()
    
    expect(shouldBlock).toBe(true)
    expect(mockConfirm).not.toHaveBeenCalled() // Should not reach confirmation
  })

  it('temporarily allows navigation', () => {
    const guard = useFormNavigationGuard(mockForm)
    guard.enable()
    
    expect(guard.isActive.value).toBe(true)
    
    guard.allowNavigation()
    
    expect(guard.isActive.value).toBe(false)
    
    // Should re-enable after timeout (tested with timer mocks in real implementation)
  })

  it('marks form as saved', () => {
    const guard = useFormNavigationGuard(mockForm)
    mockForm.isDirty.value = true
    
    expect(guard.hasUnsavedChanges.value).toBe(true)
    
    guard.markAsSaved()
    
    expect(guard.hasUnsavedChanges.value).toBe(false)
  })

  it('handles browser beforeunload event', () => {
    const guard = useFormNavigationGuard(mockForm)
    mockForm.isDirty.value = true
    guard.enable()
    
    // Get the beforeunload handler
    const calls = mockAddEventListener.mock.calls
    const beforeunloadCall = calls.find(call => call[0] === 'beforeunload')
    expect(beforeunloadCall).toBeDefined()
    
    const handler = beforeunloadCall[1]
    
    // Simulate beforeunload event
    const mockEvent = {
      preventDefault: vi.fn(),
      returnValue: null
    }
    
    const result = handler(mockEvent)
    
    expect(mockEvent.preventDefault).toHaveBeenCalled()
    expect(mockEvent.returnValue).toBe('You have unsaved changes. Are you sure you want to leave?')
  })

  it('does not show browser dialog when disabled', () => {
    const guard = useFormNavigationGuard(mockForm, {
      showBrowserDialog: false
    })
    
    mockForm.isDirty.value = true
    guard.enable()
    
    // Get the beforeunload handler
    const calls = mockAddEventListener.mock.calls
    const beforeunloadCall = calls.find(call => call[0] === 'beforeunload')
    const handler = beforeunloadCall[1]
    
    // Simulate beforeunload event
    const mockEvent = {
      preventDefault: vi.fn(),
      returnValue: null
    }
    
    const result = handler(mockEvent)
    
    // Should not prevent default when browser dialog is disabled
    expect(mockEvent.preventDefault).not.toHaveBeenCalled()
  })

  it('tracks last navigation attempt', async () => {
    const guard = useFormNavigationGuard(mockForm)
    mockForm.isDirty.value = true
    guard.enable()
    
    expect(guard.lastNavigationAttempt.value).toBeUndefined()
    
    await guard.shouldBlockNavigation()
    
    expect(guard.lastNavigationAttempt.value).toBeInstanceOf(Date)
  })
})