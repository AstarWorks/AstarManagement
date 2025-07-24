/**
 * Mentions Composable for Memo Editor
 * Provides @contact and #matter mention functionality with autocomplete
 */

import { ref, computed } from 'vue'
import { Mention } from '@tiptap/extension-mention'
import { VueRenderer } from '@tiptap/vue-3'
import tippy from 'tippy.js'
import { debounce } from 'lodash-es'
import MentionList from '../../components/memo/MentionList.vue'

export interface MentionItem {
  id: string
  label: string
  type: 'contact' | 'matter'
  email?: string
  status?: string
  url?: string
  avatar?: string
  description?: string
  metadata?: Record<string, any>
}

export interface MentionSearchOptions {
  /** Minimum query length to trigger search */
  minLength?: number
  /** Maximum number of results */
  maxResults?: number
  /** Include inactive items */
  includeInactive?: boolean
  /** Custom search endpoint */
  searchEndpoint?: string
}

export function useMentions(options: MentionSearchOptions = {}) {
  const {
    minLength = 2,
    maxResults = 10,
    includeInactive = false,
    searchEndpoint = '/api/mentions/search'
  } = options

  // State
  const searchCache = ref<Map<string, MentionItem[]>>(new Map())
  const recentMentions = ref<MentionItem[]>([])
  const isLoading = ref(false)

  // Search function
  const searchMentionsRaw = async (query: string, type?: 'contact' | 'matter'): Promise<MentionItem[]> => {
    if (query.length < minLength) return []

    const cacheKey = `${query}-${type || 'all'}`
    
    // Check cache first
    if (searchCache.value.has(cacheKey)) {
      return searchCache.value.get(cacheKey) || []
    }

    isLoading.value = true

    try {
      // For now, use mock data
      // In production, replace with actual API call
      const results = await searchMentionsMock(query, type)
      
      // Cache results
      searchCache.value.set(cacheKey, results)
      
      return results.slice(0, maxResults)
    } catch (error) {
      console.error('Failed to search mentions:', error)
      return []
    } finally {
      isLoading.value = false
    }
  }
  
  // Debounced search function
  const searchMentions = debounce(searchMentionsRaw, 300)

  // Mock search function (replace with real API)
  const searchMentionsMock = async (query: string, type?: 'contact' | 'matter'): Promise<MentionItem[]> => {
    const mockContacts: MentionItem[] = [
      {
        id: 'c1',
        label: 'John Smith',
        type: 'contact',
        email: 'john.smith@example.com',
        status: 'active',
        url: '/contacts/c1',
        avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=John%20Smith',
        description: 'Senior Partner'
      },
      {
        id: 'c2',
        label: 'Sarah Johnson',
        type: 'contact',
        email: 'sarah.johnson@client.com',
        status: 'active',
        url: '/contacts/c2',
        avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=Sarah%20Johnson',
        description: 'Client - ABC Corp'
      },
      {
        id: 'c3',
        label: 'Michael Davis',
        type: 'contact',
        email: 'michael.davis@law.com',
        status: 'active',
        url: '/contacts/c3',
        avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=Michael%20Davis',
        description: 'Associate Attorney'
      }
    ]

    const mockMatters: MentionItem[] = [
      {
        id: 'm1',
        label: 'ABC Corp Contract Review',
        type: 'matter',
        status: 'active',
        url: '/matters/m1',
        description: 'Contract review and negotiation',
        metadata: { matterNumber: 'MAT-2024-001', priority: 'high' }
      },
      {
        id: 'm2',
        label: 'Smith vs. Jones Litigation',
        type: 'matter',
        status: 'active',
        url: '/matters/m2',
        description: 'Civil litigation case',
        metadata: { matterNumber: 'MAT-2024-002', priority: 'medium' }
      },
      {
        id: 'm3',
        label: 'Intellectual Property Filing',
        type: 'matter',
        status: 'pending',
        url: '/matters/m3',
        description: 'Patent application filing',
        metadata: { matterNumber: 'MAT-2024-003', priority: 'low' }
      }
    ]

    let results: MentionItem[] = []

    if (!type || type === 'contact') {
      results = results.concat(mockContacts)
    }

    if (!type || type === 'matter') {
      results = results.concat(mockMatters)
    }

    // Filter by query
    const filtered = results.filter(item =>
      item.label.toLowerCase().includes(query.toLowerCase()) ||
      item.description?.toLowerCase().includes(query.toLowerCase()) ||
      item.email?.toLowerCase().includes(query.toLowerCase())
    )

    // Sort by relevance
    return filtered.sort((a, b) => {
      const aIndex = a.label.toLowerCase().indexOf(query.toLowerCase())
      const bIndex = b.label.toLowerCase().indexOf(query.toLowerCase())
      
      if (aIndex !== bIndex) {
        return aIndex - bIndex
      }
      
      return a.label.localeCompare(b.label)
    })
  }

  // Suggestion configuration for Tiptap
  const mentionSuggestion = {
    items: async ({ query }: { query: string }): Promise<MentionItem[]> => {
      // Parse query to determine type
      let searchType: 'contact' | 'matter' | undefined
      let searchQuery = query

      if (query.startsWith('@')) {
        searchType = 'contact'
        searchQuery = query.slice(1)
      } else if (query.startsWith('#')) {
        searchType = 'matter'
        searchQuery = query.slice(1)
      }

      const results = await searchMentions(searchQuery, searchType)
      
      // Add recent mentions if query is empty
      if (!searchQuery && recentMentions.value.length > 0) {
        const filtered = recentMentions.value.filter(item => 
          !searchType || item.type === searchType
        )
        return [...filtered, ...(results || [])].slice(0, maxResults)
      }

      return results || []
    },

    render: () => {
      let component: VueRenderer
      let popup: any

      return {
        onStart: (props: any) => {
          component = new VueRenderer(MentionList, {
            props,
            editor: props.editor,
          })

          if (!props.clientRect) {
            return
          }

          const container = document.createElement('div')
          const tippyInstance = tippy(container, {
            getReferenceClientRect: props.clientRect,
            appendTo: () => document.body,
            content: component.element as Element,
            showOnCreate: true,
            interactive: true,
            trigger: 'manual',
            placement: 'bottom-start',
            theme: 'mention-popup',
            maxWidth: 'none',
            offset: [0, 8],
          })
          popup = [tippyInstance]
        },

        onUpdate(props: any) {
          component.updateProps(props)

          if (!props.clientRect) {
            return
          }

          popup[0].setProps({
            getReferenceClientRect: props.clientRect,
          })
        },

        onKeyDown(props: any) {
          if (props.event.key === 'Escape') {
            popup[0].hide()
            return true
          }

          return component.ref?.onKeyDown(props)
        },

        onExit() {
          popup[0].destroy()
          component.destroy()
        },
      }
    },
  }

  // Contact mention extension
  const contactMentionExtension = Mention.configure({
    HTMLAttributes: {
      class: 'mention mention-contact',
      'data-type': 'contact',
    },
    suggestion: {
      ...mentionSuggestion,
      char: '@',
    },
  })

  // Matter mention extension  
  const matterMentionExtension = Mention.configure({
    HTMLAttributes: {
      class: 'mention mention-matter',
      'data-type': 'matter',
    },
    suggestion: {
      ...mentionSuggestion,
      char: '#',
    },
  })

  // Add mention to recents
  const addToRecents = (mention: MentionItem) => {
    const existing = recentMentions.value.findIndex(item => 
      item.id === mention.id && item.type === mention.type
    )
    
    if (existing !== -1) {
      recentMentions.value.splice(existing, 1)
    }
    
    recentMentions.value.unshift(mention)
    
    // Keep only last 10 recent mentions
    if (recentMentions.value.length > 10) {
      recentMentions.value = recentMentions.value.slice(0, 10)
    }
  }

  // Clear cache
  const clearCache = () => {
    searchCache.value.clear()
  }

  // Clear recents
  const clearRecents = () => {
    recentMentions.value = []
  }

  // Get mention by ID
  const getMentionById = async (id: string, type: 'contact' | 'matter'): Promise<MentionItem | null> => {
    try {
      // In production, make API call to get specific mention
      // const response = await $fetch<MentionItem>(`/api/${type}s/${id}`)
      
      // For now, search in cache or mock data
      for (const [, cached] of Array.from(searchCache.value)) {
        const found = cached.find(item => item.id === id && item.type === type)
        if (found) return found
      }
      
      return null
    } catch (error) {
      console.error('Failed to get mention:', error)
      return null
    }
  }

  // Extract mentions from HTML content
  const extractMentions = (html: string): MentionItem[] => {
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')
    const mentionElements = doc.querySelectorAll('.mention')
    
    const mentions: MentionItem[] = []
    
    mentionElements.forEach(element => {
      const id = element.getAttribute('data-id')
      const type = element.getAttribute('data-type') as 'contact' | 'matter'
      const label = element.textContent || ''
      
      if (id && type && label) {
        mentions.push({
          id,
          type,
          label,
        })
      }
    })
    
    return mentions
  }

  return {
    // State
    isLoading: computed(() => isLoading.value),
    recentMentions: computed(() => recentMentions.value),
    
    // Extensions
    contactMentionExtension,
    matterMentionExtension,
    
    // Methods
    searchMentions,
    addToRecents,
    clearCache,
    clearRecents,
    getMentionById,
    extractMentions,
    
    // Suggestion config
    mentionSuggestion,
  }
}