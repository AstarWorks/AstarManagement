/**
 * Composable for accessibility features and screen reader announcements
 * Used primarily for announcing dynamic content changes to screen readers
 */
export function useAccessibility() {
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

  return {
    announceUpdate,
    announceDragStart,
    announceDragEnd,
    announceDrop
  }
}