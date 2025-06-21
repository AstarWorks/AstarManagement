# Vue Library Demo Implementations

This document contains demo code for critical Vue library replacements to validate functionality and migration patterns.

## 1. Drag & Drop with vue-draggable-plus

### Current React Implementation (@dnd-kit)
```tsx
// React Kanban Board with @dnd-kit
import { DndContext, closestCenter, DragOverlay } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

function KanbanBoard() {
  const [items, setItems] = useState(initialItems);
  const [activeId, setActiveId] = useState(null);

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      // Reorder logic
    }
  };

  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      {columns.map(column => (
        <SortableContext items={column.items} strategy={verticalListSortingStrategy}>
          {/* Column content */}
        </SortableContext>
      ))}
      <DragOverlay>{activeId ? <Card id={activeId} /> : null}</DragOverlay>
    </DndContext>
  );
}
```

### Vue Implementation (vue-draggable-plus)
```vue
<!-- KanbanBoard.vue -->
<template>
  <div class="kanban-board">
    <div v-for="column in columns" :key="column.id" class="kanban-column">
      <h3>{{ column.title }}</h3>
      <VueDraggable
        v-model="column.items"
        group="kanban"
        :animation="200"
        :disabled="false"
        :ghost-class="'ghost-card'"
        @start="onDragStart"
        @end="onDragEnd"
        item-key="id"
      >
        <template #item="{ element }">
          <div class="kanban-card" :data-id="element.id">
            <MatterCard :matter="element" />
          </div>
        </template>
      </VueDraggable>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { VueDraggable } from 'vue-draggable-plus'
import MatterCard from './MatterCard.vue'

const columns = ref([
  { id: 'pending', title: 'Pending', items: [...] },
  { id: 'in-progress', title: 'In Progress', items: [...] },
  { id: 'completed', title: 'Completed', items: [...] }
])

const onDragStart = (evt) => {
  console.log('Drag started:', evt.item.dataset.id)
}

const onDragEnd = (evt) => {
  const { from, to, oldIndex, newIndex } = evt
  console.log('Moved from', from.dataset.columnId, 'to', to.dataset.columnId)
  // API call to update backend
}
</script>

<style scoped>
.ghost-card {
  opacity: 0.5;
}

.kanban-card {
  cursor: move;
  margin-bottom: 8px;
}
</style>
```

### Migration Notes
- vue-draggable-plus uses v-model for two-way binding
- Events are simpler: @start, @end instead of complex context
- Ghost class replaces DragOverlay component
- Group prop enables cross-column dragging
- Built-in animation support

## 2. Form Validation with VeeValidate + Zod

### Current React Implementation (React Hook Form + Zod)
```tsx
// React form with validation
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const matterSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  clientName: z.string().min(1, 'Client name is required'),
  description: z.string().optional(),
  dueDate: z.date().min(new Date(), 'Due date must be in the future'),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED'])
});

function CreateMatterForm() {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(matterSchema)
  });

  const onSubmit = async (data) => {
    await createMatter(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('title')} />
      {errors.title && <span>{errors.title.message}</span>}
      {/* More fields */}
    </form>
  );
}
```

### Vue Implementation (VeeValidate + Zod)
```vue
<!-- CreateMatterForm.vue -->
<template>
  <form @submit="onSubmit">
    <div class="form-group">
      <label for="title">Title</label>
      <input
        id="title"
        v-model="title"
        v-bind="titleAttrs"
        type="text"
        class="form-control"
        :class="{ 'is-invalid': errors.title }"
      />
      <span v-if="errors.title" class="error">{{ errors.title }}</span>
    </div>

    <div class="form-group">
      <label for="clientName">Client Name</label>
      <input
        id="clientName"
        v-model="clientName"
        v-bind="clientNameAttrs"
        type="text"
        class="form-control"
        :class="{ 'is-invalid': errors.clientName }"
      />
      <span v-if="errors.clientName" class="error">{{ errors.clientName }}</span>
    </div>

    <div class="form-group">
      <label for="status">Status</label>
      <select
        id="status"
        v-model="status"
        v-bind="statusAttrs"
        class="form-control"
      >
        <option value="PENDING">Pending</option>
        <option value="IN_PROGRESS">In Progress</option>
        <option value="COMPLETED">Completed</option>
      </select>
    </div>

    <button type="submit" :disabled="!meta.valid">
      Create Matter
    </button>
  </form>
</template>

<script setup lang="ts">
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'

// Same Zod schema - no changes needed!
const matterSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  clientName: z.string().min(1, 'Client name is required'),
  description: z.string().optional(),
  dueDate: z.date().min(new Date(), 'Due date must be in the future'),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED'])
})

const { handleSubmit, defineField, errors, meta } = useForm({
  validationSchema: toTypedSchema(matterSchema)
})

// Define fields with v-model support
const [title, titleAttrs] = defineField('title')
const [clientName, clientNameAttrs] = defineField('clientName')
const [description, descriptionAttrs] = defineField('description')
const [dueDate, dueDateAttrs] = defineField('dueDate')
const [status, statusAttrs] = defineField('status')

const onSubmit = handleSubmit(async (values) => {
  try {
    await createMatter(values)
    // Handle success
  } catch (error) {
    // Handle error
  }
})
</script>
```

### Migration Notes
- Zod schemas remain unchanged
- defineField provides v-model and validation attrs
- Built-in error handling with errors object
- meta object provides form-wide validation state
- Similar API surface to React Hook Form

## 3. State Management with Pinia

### Current React Implementation (Zustand)
```tsx
// React Zustand store
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

interface KanbanStore {
  matters: Matter[];
  filters: FilterState;
  setMatters: (matters: Matter[]) => void;
  updateMatter: (id: string, updates: Partial<Matter>) => void;
  moveMatter: (matterId: string, newStatus: string) => void;
  setFilter: (filter: Partial<FilterState>) => void;
}

export const useKanbanStore = create<KanbanStore>()(
  immer((set) => ({
    matters: [],
    filters: { search: '', status: 'all' },
    
    setMatters: (matters) => set(state => {
      state.matters = matters;
    }),
    
    updateMatter: (id, updates) => set(state => {
      const index = state.matters.findIndex(m => m.id === id);
      if (index !== -1) {
        Object.assign(state.matters[index], updates);
      }
    }),
    
    moveMatter: (matterId, newStatus) => set(state => {
      const matter = state.matters.find(m => m.id === matterId);
      if (matter) {
        matter.status = newStatus;
      }
    }),
    
    setFilter: (filter) => set(state => {
      Object.assign(state.filters, filter);
    })
  }))
);
```

### Vue Implementation (Pinia)
```ts
// stores/kanban.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Matter, FilterState } from '@/types'

export const useKanbanStore = defineStore('kanban', () => {
  // State
  const matters = ref<Matter[]>([])
  const filters = ref<FilterState>({
    search: '',
    status: 'all'
  })

  // Getters (computed)
  const filteredMatters = computed(() => {
    return matters.value.filter(matter => {
      if (filters.value.status !== 'all' && matter.status !== filters.value.status) {
        return false
      }
      if (filters.value.search) {
        const searchLower = filters.value.search.toLowerCase()
        return matter.title.toLowerCase().includes(searchLower) ||
               matter.clientName.toLowerCase().includes(searchLower)
      }
      return true
    })
  })

  const mattersByStatus = computed(() => {
    const grouped = {
      PENDING: [],
      IN_PROGRESS: [],
      COMPLETED: []
    }
    
    filteredMatters.value.forEach(matter => {
      grouped[matter.status].push(matter)
    })
    
    return grouped
  })

  // Actions
  function setMatters(newMatters: Matter[]) {
    matters.value = newMatters
  }

  function updateMatter(id: string, updates: Partial<Matter>) {
    const index = matters.value.findIndex(m => m.id === id)
    if (index !== -1) {
      matters.value[index] = { ...matters.value[index], ...updates }
    }
  }

  function moveMatter(matterId: string, newStatus: string) {
    const matter = matters.value.find(m => m.id === matterId)
    if (matter) {
      matter.status = newStatus
    }
  }

  function setFilter(filter: Partial<FilterState>) {
    filters.value = { ...filters.value, ...filter }
  }

  // Async actions with error handling
  async function fetchMatters() {
    try {
      const response = await api.getMatters()
      setMatters(response.data)
    } catch (error) {
      console.error('Failed to fetch matters:', error)
      throw error
    }
  }

  return {
    // State
    matters: readonly(matters),
    filters: readonly(filters),
    
    // Getters
    filteredMatters,
    mattersByStatus,
    
    // Actions
    setMatters,
    updateMatter,
    moveMatter,
    setFilter,
    fetchMatters
  }
})

// Usage in component
import { useKanbanStore } from '@/stores/kanban'
import { storeToRefs } from 'pinia'

const kanbanStore = useKanbanStore()
const { filteredMatters, filters } = storeToRefs(kanbanStore)
const { updateMatter, setFilter } = kanbanStore
```

### Migration Notes
- Pinia uses composition API syntax
- Built-in TypeScript support
- No need for immer - Vue's reactivity handles updates
- storeToRefs maintains reactivity when destructuring
- Getters become computed properties
- Better devtools integration

## 4. Data Fetching with TanStack Query

### Current React Implementation
```tsx
// React Query usage
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

function MatterList() {
  const queryClient = useQueryClient();
  
  const { data: matters, isLoading, error } = useQuery({
    queryKey: ['matters'],
    queryFn: fetchMatters,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const updateMutation = useMutation({
    mutationFn: updateMatter,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matters'] });
    }
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {matters.map(matter => (
        <MatterCard 
          key={matter.id} 
          matter={matter}
          onUpdate={(updates) => updateMutation.mutate({ id: matter.id, ...updates })}
        />
      ))}
    </div>
  );
}
```

### Vue Implementation
```vue
<!-- MatterList.vue -->
<template>
  <div>
    <div v-if="isLoading">Loading...</div>
    <div v-else-if="error">Error: {{ error.message }}</div>
    <div v-else>
      <MatterCard
        v-for="matter in matters"
        :key="matter.id"
        :matter="matter"
        @update="(updates) => updateMutation.mutate({ id: matter.id, ...updates })"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { fetchMatters, updateMatter } from '@/api/matters'
import MatterCard from './MatterCard.vue'

const queryClient = useQueryClient()

// Nearly identical to React version!
const { data: matters, isLoading, error } = useQuery({
  queryKey: ['matters'],
  queryFn: fetchMatters,
  staleTime: 5 * 60 * 1000, // 5 minutes
})

const updateMutation = useMutation({
  mutationFn: updateMatter,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['matters'] })
  }
})
</script>
```

### Alternative: Nuxt's Built-in useFetch
```vue
<!-- Using Nuxt's native data fetching -->
<template>
  <div>
    <div v-if="pending">Loading...</div>
    <div v-else-if="error">Error: {{ error.message }}</div>
    <div v-else>
      <MatterCard
        v-for="matter in matters"
        :key="matter.id"
        :matter="matter"
        @update="handleUpdate"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
// Nuxt auto-imports useFetch
const { data: matters, pending, error, refresh } = await useFetch('/api/matters', {
  // SSR-friendly by default
  lazy: true,
  server: true,
  
  // Caching
  getCachedData(key) {
    const data = nuxtApp.payload.data[key] || nuxtApp.static.data[key]
    if (!data) return
    
    const expirationDate = new Date(data.fetchedAt)
    expirationDate.setTime(expirationDate.getTime() + 5 * 60 * 1000) // 5 minutes
    const isExpired = expirationDate.getTime() < Date.now()
    if (isExpired) return
    
    return data
  }
})

const handleUpdate = async (matter, updates) => {
  await $fetch(`/api/matters/${matter.id}`, {
    method: 'PATCH',
    body: updates
  })
  // Refresh the list
  await refresh()
}
</script>
```

## 5. Component Documentation with Histoire

### Current React Storybook
```tsx
// MatterCard.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { MatterCard } from './MatterCard';

const meta: Meta<typeof MatterCard> = {
  title: 'Components/MatterCard',
  component: MatterCard,
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    status: {
      control: 'select',
      options: ['PENDING', 'IN_PROGRESS', 'COMPLETED']
    }
  }
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    matter: {
      id: '1',
      title: 'Contract Review',
      clientName: 'Acme Corp',
      status: 'IN_PROGRESS',
      dueDate: new Date('2024-12-31')
    }
  }
};
```

### Vue Histoire Implementation
```vue
<!-- MatterCard.story.vue -->
<script setup lang="ts">
import MatterCard from './MatterCard.vue'
import type { Matter } from '@/types'

const sampleMatter: Matter = {
  id: '1',
  title: 'Contract Review',
  clientName: 'Acme Corp',
  status: 'IN_PROGRESS',
  dueDate: new Date('2024-12-31')
}
</script>

<template>
  <Story title="Components/MatterCard" :layout="{ type: 'grid', width: 400 }">
    <Variant title="Default">
      <MatterCard :matter="sampleMatter" />
    </Variant>

    <Variant title="Interactive" :init-state="() => ({ status: 'IN_PROGRESS' })">
      <template #default="{ state }">
        <MatterCard
          :matter="{ ...sampleMatter, status: state.status }"
          @update="(updates) => Object.assign(state, updates)"
        />
      </template>
      <template #controls="{ state }">
        <HstSelect
          v-model="state.status"
          title="Status"
          :options="[
            { label: 'Pending', value: 'PENDING' },
            { label: 'In Progress', value: 'IN_PROGRESS' },
            { label: 'Completed', value: 'COMPLETED' }
          ]"
        />
      </template>
    </Variant>

    <Variant title="All Statuses">
      <div class="grid gap-4">
        <MatterCard
          v-for="status in ['PENDING', 'IN_PROGRESS', 'COMPLETED']"
          :key="status"
          :matter="{ ...sampleMatter, status }"
        />
      </div>
    </Variant>
  </Story>
</template>

<style scoped>
.grid {
  display: grid;
  grid-template-columns: 1fr;
}
</style>
```

### Migration Notes
- Histoire uses single-file story components
- More concise than Storybook
- Better Vue integration and HMR
- Built-in controls without configuration
- Faster build times

## Demo Setup Instructions

### 1. Create Demo Project
```bash
# Create Nuxt 3 project
npx nuxi@latest init vue-migration-demos
cd vue-migration-demos

# Install dependencies
npm install @nuxtjs/tailwindcss shadcn-vue @tanstack/vue-query
npm install vue-draggable-plus vee-validate @vee-validate/zod zod
npm install pinia @pinia/nuxt lucide-vue-next vue-sonner
npm install -D @histoire/plugin-nuxt histoire
```

### 2. Configure Nuxt
```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: [
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt',
    'shadcn-vue/nuxt'
  ],
  css: ['~/assets/css/main.css'],
  typescript: {
    strict: true
  }
})
```

### 3. Run Demos
```bash
# Development
npm run dev

# Histoire (component docs)
npm run story:dev

# Build for production
npm run build
```

## Migration Complexity Summary

Based on the demos:

1. **Lowest Effort** (Drop-in replacements)
   - lucide-react → lucide-vue-next
   - sonner → vue-sonner
   - @tanstack/react-query → @tanstack/vue-query

2. **Medium Effort** (API differences but similar concepts)
   - React Hook Form → VeeValidate (keep Zod schemas)
   - Zustand → Pinia (cleaner API)
   - @dnd-kit → vue-draggable-plus (simpler API)

3. **Highest Effort** (Framework-level changes)
   - JSX → Vue templates
   - React hooks → Vue composables
   - Next.js routing → Nuxt file-based routing

The demos confirm that the selected Vue libraries provide excellent feature parity with simpler, more Vue-idiomatic APIs.