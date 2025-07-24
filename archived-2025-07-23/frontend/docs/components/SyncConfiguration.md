# Sync Configuration Component

The `SyncConfiguration` component provides a comprehensive UI for users to configure their background sync preferences in the Aster Management legal case system.

## Features

### 1. Sync Status Display
- Real-time connection status indicator
- Connection quality percentage based on latency
- Last sync timestamp with relative formatting
- Current network type detection (4G, 3G, WiFi, etc.)
- Manual sync button with loading state

### 2. Sync Mode Selection
- **Real-time (Aggressive)**: Updates every 3-5 seconds for critical collaboration
- **Balanced**: Updates every 15-30 seconds, good for everyday use
- **Battery Saver (Conservative)**: Updates every 1-2 minutes to save resources
- **Offline**: No automatic updates, work offline with manual sync
- **Manual**: Full control over when data refreshes

### 3. Impact Estimates
- **Battery Impact**: Shows estimated battery drain per hour and total battery life
- **Data Usage**: Displays estimated daily data consumption and current session usage
- Real-time tracking of sent/received data

### 4. Advanced Settings
- **Data Type Selection**: Choose which data types to sync (matters, kanban, activity, settings)
- **Notification Preferences**: Toggle sync notifications and sounds
- **Sync History**: View recent sync operations with timing and item counts

## Usage

### Basic Implementation

```vue
<template>
  <SyncConfiguration 
    :initial-mode="'balanced'"
    @mode-changed="handleModeChanged"
    @manual-sync="handleManualSync"
  />
</template>

<script setup>
import SyncConfiguration from '~/components/settings/SyncConfiguration.vue'

const handleModeChanged = (mode) => {
  console.log('Sync mode changed to:', mode)
  // Update your application's sync behavior
}

const handleManualSync = () => {
  console.log('Manual sync requested')
  // Trigger data refresh in your application
}
</script>
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `initialMode` | `SyncMode` | `getDefaultSyncMode()` | Initial sync mode selection |

### Events

| Event | Payload | Description |
|-------|---------|-------------|
| `mode-changed` | `SyncMode` | Emitted when user changes sync mode |
| `manual-sync` | `void` | Emitted when user triggers manual sync |

### Types

```typescript
type SyncMode = 'aggressive' | 'balanced' | 'conservative' | 'offline' | 'manual'
```

## Integration with TanStack Query

The component is designed to work seamlessly with TanStack Query. When the sync mode changes:

1. For `offline` mode, it disables all background refetching:
```javascript
queryClient.setDefaultOptions({
  queries: {
    refetchInterval: false,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false
  }
})
```

2. For other modes, it re-enables refetching with appropriate intervals based on the selected mode.

## LocalStorage Persistence

The component automatically saves user preferences to localStorage:
- `sync-mode`: Selected sync mode
- `sync-data-types`: Array of selected data types to sync
- `sync-notifications`: Boolean for notification preference
- `sync-sounds`: Boolean for sound preference

## Accessibility

The component is fully accessible with:
- Proper ARIA labels and roles
- Keyboard navigation support
- Screen reader friendly status announcements
- Color contrast compliant design

## Mobile Optimization

- Responsive layout that works on all screen sizes
- Touch-friendly controls
- Optimized for mobile browsers
- Battery API integration for real device battery monitoring

## Browser APIs Used

1. **Battery Status API** (when available):
   - Shows real device battery level
   - Only available in secure contexts (HTTPS)

2. **Network Information API** (when available):
   - Detects connection type (4G, 3G, WiFi)
   - Shows effective network speed

3. **LocalStorage API**:
   - Persists user preferences across sessions

## Example Pages

- **Settings Page**: `/settings/sync` - Full settings integration
- **Demo Page**: `/examples/sync-configuration-demo` - Interactive demonstration

## Performance Considerations

- Lazy loads advanced settings to improve initial render
- Debounced state updates to prevent excessive re-renders
- Efficient event handling with proper cleanup
- Minimal re-renders using Vue's reactivity system

## Future Enhancements

1. **Push Notifications**: Native push notification support for sync events
2. **Sync Scheduling**: Allow users to schedule sync times
3. **Data Usage Warnings**: Alert users when approaching data limits
4. **Conflict Resolution UI**: Visual interface for resolving sync conflicts
5. **Sync Analytics**: Detailed analytics on sync performance and usage