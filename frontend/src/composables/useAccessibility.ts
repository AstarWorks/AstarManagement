/**
 * Composable for accessibility features and screen reader announcements
 * Used primarily for announcing dynamic content changes to screen readers
 */
export function useAccessibility() {
  /**
   * Generate a unique ID for accessibility purposes
   * @param prefix - Optional prefix for the ID
   */
  const generateId = (prefix = 'a11y') => {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Announce a message to screen readers using ARIA live regions
   * @param message - The message to announce
   * @param priority - The priority of the announcement ('polite' or 'assertive')
   */
  const announceUpdate = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const announcement = document.createElement('div')
    announcement.setAttribute('aria-live', priority)
    announcement.setAttribute('aria-atomic', 'true')
    announcement.className = 'sr-only'
    announcement.textContent = message
    document.body.appendChild(announcement)
    
    // Remove the announcement after a delay to clean up the DOM
    setTimeout(() => {
      document.body.removeChild(announcement)
    }, 1000)
  }

  /**
   * Alias for announceUpdate for consistency with other components
   */
  const announceToScreenReader = announceUpdate

  /**
   * Announce the start of a drag operation
   * @param itemName - The name of the item being dragged
   */
  const announceDragStart = (itemName: string) => {
    announceUpdate(`Started dragging ${itemName}`)
  }

  /**
   * Announce the end of a drag operation
   * @param itemName - The name of the item that was dragged
   * @param success - Whether the drag operation was successful
   */
  const announceDragEnd = (itemName: string, success: boolean = true) => {
    const message = success 
      ? `Finished dragging ${itemName}`
      : `Cancelled dragging ${itemName}`
    announceUpdate(message)
  }

  /**
   * Announce a drop operation
   * @param itemName - The name of the dropped item
   * @param targetName - The name of the drop target
   */
  const announceDrop = (itemName: string, targetName: string) => {
    announceUpdate(`Dropped ${itemName} into ${targetName}`, 'assertive')
  }

  /**
   * Announce upload progress
   * @param fileName - The name of the file being uploaded
   * @param progress - The upload progress (0-100)
   */
  const announceUploadProgress = (fileName: string, progress: number) => {
    if (progress === 0) {
      announceUpdate(`Started uploading ${fileName}`)
    } else if (progress === 100) {
      announceUpdate(`Finished uploading ${fileName}`, 'assertive')
    } else if (progress % 25 === 0) {
      announceUpdate(`${fileName} upload ${progress}% complete`)
    }
  }

  /**
   * Announce file validation errors
   * @param fileName - The name of the invalid file
   * @param errors - Array of validation error messages
   */
  const announceValidationErrors = (fileName: string, errors: string[]) => {
    const errorCount = errors.length
    const message = `${fileName} rejected. ${errorCount} error${errorCount !== 1 ? 's' : ''}: ${errors.join(', ')}`
    announceUpdate(message, 'assertive')
  }

  /**
   * Announce batch operation results
   * @param operation - The type of operation (upload, delete, etc.)
   * @param count - Number of items affected
   * @param success - Whether the operation was successful
   */
  const announceBatchOperation = (operation: string, count: number, success = true) => {
    const status = success ? 'completed' : 'failed'
    const message = `Batch ${operation} ${status}. ${count} file${count !== 1 ? 's' : ''} affected.`
    announceUpdate(message, 'assertive')
  }

  return {
    generateId,
    announceUpdate,
    announceToScreenReader,
    announceDragStart,
    announceDragEnd,
    announceDrop,
    announceUploadProgress,
    announceValidationErrors,
    announceBatchOperation
  }
}