<!--
  Mention List Component
  Displays autocomplete suggestions for @contacts and #matters
-->
<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { User, Hash, Mail, ExternalLink, Clock } from 'lucide-vue-next'
import { Badge } from '~/components/ui/badge'
import { ScrollArea } from '~/components/ui/scroll-area'
import type { MentionItem } from '~/composables/memo/useMentions'

interface Props {
  /** List of mention items */
  items: MentionItem[]
  /** Currently selected item index */
  selectedIndex?: number
  /** Command function from Tiptap */
  command?: (item: MentionItem) => void
  /** Loading state */
  loading?: boolean
  /** Query string */
  query?: string
}

const props = withDefaults(defineProps<Props>(), {
  selectedIndex: 0,
  loading: false,
  query: ''
})

// Local state
const selectedIndex = ref(props.selectedIndex)
const listRef = ref<HTMLElement>()

// Computed
const hasItems = computed(() => props.items.length > 0)

const displayQuery = computed(() => {
  if (props.query.startsWith('@')) return props.query.slice(1)
  if (props.query.startsWith('#')) return props.query.slice(1)
  return props.query
})

const groupedItems = computed(() => {
  const groups: Record<string, MentionItem[]> = {
    contact: [],
    matter: []
  }

  props.items.forEach(item => {
    groups[item.type].push(item)
  })

  return groups
})

// Methods
const selectItem = (index: number) => {
  const item = props.items[index]
  if (item && props.command) {
    props.command(item)
  }
}

const selectItemById = (id: string) => {
  const index = props.items.findIndex(item => item.id === id)
  if (index !== -1) {
    selectItem(index)
  }
}

const onKeyDown = ({ event }: { event: KeyboardEvent }) => {
  if (event.key === 'ArrowUp') {
    selectedIndex.value = selectedIndex.value === 0 
      ? props.items.length - 1 
      : selectedIndex.value - 1
    scrollToSelected()
    return true
  }

  if (event.key === 'ArrowDown') {
    selectedIndex.value = selectedIndex.value === props.items.length - 1 
      ? 0 
      : selectedIndex.value + 1
    scrollToSelected()
    return true
  }

  if (event.key === 'Enter') {
    if (selectedIndex.value >= 0 && selectedIndex.value < props.items.length) {
      selectItem(selectedIndex.value)
    }
    return true
  }

  return false
}

const scrollToSelected = async () => {
  await nextTick()
  
  const selectedElement = listRef.value?.querySelector(`[data-index="${selectedIndex.value}"]`)
  if (selectedElement) {
    selectedElement.scrollIntoView({
      block: 'nearest',
      behavior: 'smooth'
    })
  }
}

const getItemIcon = (type: 'contact' | 'matter') => {
  return type === 'contact' ? User : Hash
}

const getStatusColor = (status?: string) => {
  switch (status) {
    case 'active':
      return 'default'
    case 'pending':
      return 'secondary'
    case 'inactive':
      return 'outline'
    default:
      return 'outline'
  }
}

const highlightText = (text: string, query: string) => {
  if (!query) return text
  
  const regex = new RegExp(`(${query})`, 'gi')
  return text.replace(regex, '<mark>$1</mark>')
}

// Watch for selectedIndex changes from props
watch(() => props.selectedIndex, (newIndex) => {
  selectedIndex.value = newIndex
  scrollToSelected()
})

// Expose methods for Tiptap
defineExpose({
  onKeyDown
})
</script>

<template>
  <div class="mention-list">
    <!-- Loading State -->
    <div v-if="loading" class="mention-loading">
      <div class="loading-spinner" />
      <span class="loading-text">Searching...</span>
    </div>

    <!-- Empty State -->
    <div v-else-if="!hasItems" class="mention-empty">
      <div class="empty-icon">
        <component :is="query.startsWith('@') ? User : Hash" />
      </div>
      <p class="empty-text">
        <template v-if="displayQuery">
          No {{ query.startsWith('@') ? 'contacts' : 'matters' }} found for "{{ displayQuery }}"
        </template>
        <template v-else>
          Type {{ query.startsWith('@') ? '@' : '#' }} to search {{ query.startsWith('@') ? 'contacts' : 'matters' }}
        </template>
      </p>
    </div>

    <!-- Items List -->
    <ScrollArea v-else ref="listRef" class="mention-scroll">
      <div class="mention-items">
        <!-- Grouped by type -->
        <template v-if="groupedItems.contact.length > 0 && groupedItems.matter.length > 0">
          <!-- Contact Group -->
          <div v-if="groupedItems.contact.length > 0" class="mention-group">
            <div class="group-header">
              <User class="group-icon" />
              <span class="group-title">Contacts</span>
            </div>
            <div
              v-for="(item, index) in groupedItems.contact"
              :key="item.id"
              :data-index="props.items.findIndex(i => i.id === item.id)"
              :class="[
                'mention-item',
                { 'is-selected': props.items.findIndex(i => i.id === item.id) === selectedIndex }
              ]"
              @click="selectItemById(item.id)"
            >
              <div class="item-avatar">
                <img
                  v-if="item.avatar"
                  :src="item.avatar"
                  :alt="item.label"
                  class="avatar-image"
                />
                <User v-else class="avatar-fallback" />
              </div>
              
              <div class="item-content">
                <div class="item-header">
                  <span 
                    class="item-label"
                    v-html="highlightText(item.label, displayQuery)"
                  />
                  <Badge v-if="item.status" :variant="getStatusColor(item.status)" class="item-status">
                    {{ item.status }}
                  </Badge>
                </div>
                
                <div class="item-details">
                  <span v-if="item.email" class="item-email">
                    <Mail class="detail-icon" />
                    {{ item.email }}
                  </span>
                  <span v-if="item.description" class="item-description">
                    {{ item.description }}
                  </span>
                </div>
              </div>

              <div class="item-actions">
                <ExternalLink class="action-icon" />
              </div>
            </div>
          </div>

          <!-- Matter Group -->
          <div v-if="groupedItems.matter.length > 0" class="mention-group">
            <div class="group-header">
              <Hash class="group-icon" />
              <span class="group-title">Matters</span>
            </div>
            <div
              v-for="(item, index) in groupedItems.matter"
              :key="item.id"
              :data-index="props.items.findIndex(i => i.id === item.id)"
              :class="[
                'mention-item',
                { 'is-selected': props.items.findIndex(i => i.id === item.id) === selectedIndex }
              ]"
              @click="selectItemById(item.id)"
            >
              <div class="item-icon">
                <Hash class="matter-icon" />
              </div>
              
              <div class="item-content">
                <div class="item-header">
                  <span 
                    class="item-label"
                    v-html="highlightText(item.label, displayQuery)"
                  />
                  <Badge v-if="item.status" :variant="getStatusColor(item.status)" class="item-status">
                    {{ item.status }}
                  </Badge>
                </div>
                
                <div class="item-details">
                  <span v-if="item.metadata?.matterNumber" class="item-matter-number">
                    {{ item.metadata.matterNumber }}
                  </span>
                  <span v-if="item.description" class="item-description">
                    {{ item.description }}
                  </span>
                  <Badge 
                    v-if="item.metadata?.priority" 
                    :variant="item.metadata.priority === 'high' ? 'destructive' : 'outline'"
                    class="priority-badge"
                  >
                    {{ item.metadata.priority }}
                  </Badge>
                </div>
              </div>

              <div class="item-actions">
                <ExternalLink class="action-icon" />
              </div>
            </div>
          </div>
        </template>

        <!-- Single type list -->
        <template v-else>
          <div
            v-for="(item, index) in items"
            :key="item.id"
            :data-index="index"
            :class="[
              'mention-item',
              { 'is-selected': index === selectedIndex }
            ]"
            @click="selectItem(index)"
          >
            <!-- Contact Item -->
            <template v-if="item.type === 'contact'">
              <div class="item-avatar">
                <img
                  v-if="item.avatar"
                  :src="item.avatar"
                  :alt="item.label"
                  class="avatar-image"
                />
                <User v-else class="avatar-fallback" />
              </div>
              
              <div class="item-content">
                <div class="item-header">
                  <span 
                    class="item-label"
                    v-html="highlightText(item.label, displayQuery)"
                  />
                  <Badge v-if="item.status" :variant="getStatusColor(item.status)" class="item-status">
                    {{ item.status }}
                  </Badge>
                </div>
                
                <div class="item-details">
                  <span v-if="item.email" class="item-email">
                    <Mail class="detail-icon" />
                    {{ item.email }}
                  </span>
                  <span v-if="item.description" class="item-description">
                    {{ item.description }}
                  </span>
                </div>
              </div>
            </template>

            <!-- Matter Item -->
            <template v-else-if="item.type === 'matter'">
              <div class="item-icon">
                <Hash class="matter-icon" />
              </div>
              
              <div class="item-content">
                <div class="item-header">
                  <span 
                    class="item-label"
                    v-html="highlightText(item.label, displayQuery)"
                  />
                  <Badge v-if="item.status" :variant="getStatusColor(item.status)" class="item-status">
                    {{ item.status }}
                  </Badge>
                </div>
                
                <div class="item-details">
                  <span v-if="item.metadata?.matterNumber" class="item-matter-number">
                    {{ item.metadata.matterNumber }}
                  </span>
                  <span v-if="item.description" class="item-description">
                    {{ item.description }}
                  </span>
                  <Badge 
                    v-if="item.metadata?.priority" 
                    :variant="item.metadata.priority === 'high' ? 'destructive' : 'outline'"
                    class="priority-badge"
                  >
                    {{ item.metadata.priority }}
                  </Badge>
                </div>
              </div>
            </template>

            <div class="item-actions">
              <ExternalLink class="action-icon" />
            </div>
          </div>
        </template>
      </div>
    </ScrollArea>

    <!-- Footer -->
    <div v-if="hasItems" class="mention-footer">
      <div class="footer-hint">
        <kbd>↑↓</kbd> navigate • <kbd>Enter</kbd> select • <kbd>Esc</kbd> close
      </div>
    </div>
  </div>
</template>

<style scoped>
.mention-list {
  background: hsl(var(--background));
  border: 1px solid hsl(var(--border));
  border-radius: 0.5rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  max-width: 400px;
  max-height: 300px;
  overflow: hidden;
}

/* Loading State */
.mention-loading {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
}

.loading-spinner {
  width: 1rem;
  height: 1rem;
  border: 2px solid hsl(var(--border));
  border-top: 2px solid hsl(var(--primary));
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.loading-text {
  font-size: 0.875rem;
  color: hsl(var(--muted-foreground));
}

/* Empty State */
.mention-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1.5rem;
  text-align: center;
}

.empty-icon {
  width: 2rem;
  height: 2rem;
  color: hsl(var(--muted-foreground));
  margin-bottom: 0.5rem;
}

.empty-text {
  font-size: 0.875rem;
  color: hsl(var(--muted-foreground));
  margin: 0;
}

/* Scroll Area */
.mention-scroll {
  max-height: 240px;
}

/* Groups */
.mention-group {
  border-bottom: 1px solid hsl(var(--border));
}

.mention-group:last-child {
  border-bottom: none;
}

.group-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: hsl(var(--muted) / 0.5);
  border-bottom: 1px solid hsl(var(--border));
}

.group-icon {
  width: 1rem;
  height: 1rem;
  color: hsl(var(--muted-foreground));
}

.group-title {
  font-size: 0.75rem;
  font-weight: 600;
  color: hsl(var(--muted-foreground));
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

/* Items */
.mention-items {
  padding: 0.25rem 0;
}

.mention-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.mention-item:hover,
.mention-item.is-selected {
  background: hsl(var(--muted) / 0.5);
}

.mention-item.is-selected {
  background: hsl(var(--primary) / 0.1);
}

/* Avatar */
.item-avatar {
  flex-shrink: 0;
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  overflow: hidden;
  background: hsl(var(--muted));
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-fallback {
  width: 1rem;
  height: 1rem;
  color: hsl(var(--muted-foreground));
}

/* Icon */
.item-icon {
  flex-shrink: 0;
  width: 2rem;
  height: 2rem;
  border-radius: 0.25rem;
  background: hsl(var(--muted));
  display: flex;
  align-items: center;
  justify-content: center;
}

.matter-icon {
  width: 1rem;
  height: 1rem;
  color: hsl(var(--muted-foreground));
}

/* Content */
.item-content {
  flex: 1;
  min-width: 0;
}

.item-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
}

.item-label {
  font-weight: 500;
  color: hsl(var(--foreground));
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-label :deep(mark) {
  background: hsl(var(--primary) / 0.2);
  color: hsl(var(--primary));
  padding: 0;
  border-radius: 0.125rem;
}

.item-status {
  font-size: 0.625rem;
  height: 1.25rem;
}

.item-details {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.item-email,
.item-description,
.item-matter-number {
  font-size: 0.75rem;
  color: hsl(var(--muted-foreground));
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-email {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.detail-icon {
  width: 0.75rem;
  height: 0.75rem;
}

.priority-badge {
  font-size: 0.625rem;
  height: 1rem;
  align-self: flex-start;
  margin-top: 0.125rem;
}

/* Actions */
.item-actions {
  flex-shrink: 0;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.mention-item:hover .item-actions,
.mention-item.is-selected .item-actions {
  opacity: 1;
}

.action-icon {
  width: 1rem;
  height: 1rem;
  color: hsl(var(--muted-foreground));
}

/* Footer */
.mention-footer {
  border-top: 1px solid hsl(var(--border));
  padding: 0.5rem 1rem;
  background: hsl(var(--muted) / 0.3);
}

.footer-hint {
  font-size: 0.75rem;
  color: hsl(var(--muted-foreground));
  text-align: center;
}

.footer-hint kbd {
  display: inline-block;
  padding: 0.125rem 0.25rem;
  font-size: 0.625rem;
  background: hsl(var(--background));
  border: 1px solid hsl(var(--border));
  border-radius: 0.25rem;
  font-family: ui-monospace, monospace;
}

/* Animations */
@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Accessibility */
@media (prefers-reduced-motion: reduce) {
  .loading-spinner {
    animation: none;
  }
  
  .mention-item {
    transition: none;
  }
}
</style>