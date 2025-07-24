# Routing Migration: Next.js App Router to Nuxt.js Pages

This guide covers the migration from Next.js App Router to Nuxt.js file-based routing system for the Aster Management application.

## Routing Architecture Comparison

### Next.js App Router Structure
```
frontend-nextjs/
├── app/
│   ├── layout.tsx                 # Root layout
│   ├── page.tsx                   # Home page (/)
│   ├── loading.tsx                # Loading UI
│   ├── error.tsx                  # Error UI
│   ├── not-found.tsx             # 404 page
│   ├── kanban/
│   │   ├── layout.tsx             # Kanban layout
│   │   ├── page.tsx               # Kanban page (/kanban)
│   │   └── [id]/
│   │       ├── page.tsx           # Kanban detail (/kanban/[id])
│   │       └── edit/
│   │           └── page.tsx       # Edit kanban (/kanban/[id]/edit)
│   ├── matters/
│   │   ├── page.tsx               # Matters list (/matters)
│   │   ├── new/
│   │   │   └── page.tsx           # New matter (/matters/new)
│   │   └── [id]/
│   │       ├── page.tsx           # Matter detail (/matters/[id])
│   │       └── edit/
│   │           └── page.tsx       # Edit matter (/matters/[id]/edit)
│   └── api/
│       └── matters/
│           └── route.ts           # API route
```

### Nuxt.js Pages Structure
```
frontend-nuxt-poc/
├── layouts/
│   ├── default.vue                # Default layout
│   └── kanban.vue                 # Kanban-specific layout
├── pages/
│   ├── index.vue                  # Home page (/)
│   ├── kanban/
│   │   ├── index.vue              # Kanban page (/kanban)
│   │   └── [id]/
│   │       ├── index.vue          # Kanban detail (/kanban/[id])
│   │       └── edit.vue           # Edit kanban (/kanban/[id]/edit)
│   ├── matters/
│   │   ├── index.vue              # Matters list (/matters)
│   │   ├── new.vue                # New matter (/matters/new)
│   │   └── [id]/
│   │       ├── index.vue          # Matter detail (/matters/[id])
│   │       └── edit.vue           # Edit matter (/matters/[id]/edit)
│   └── [...slug].vue              # Catch-all route
├── middleware/
│   ├── auth.ts                    # Authentication middleware
│   └── role.ts                    # Role-based middleware
├── server/
│   └── api/
│       └── matters/
│           └── index.get.ts       # API route
└── error.vue                      # Error page
```

## Key Migration Patterns

### 1. Page Component Migration

#### Next.js App Router Page
```tsx
// app/matters/page.tsx
import { Metadata } from 'next'
import { Suspense } from 'react'
import MattersList from '@/components/MattersList'
import MattersLoading from '@/components/MattersLoading'

export const metadata: Metadata = {
  title: 'Legal Matters | Aster Management',
  description: 'Manage all your legal matters in one place'
}

interface PageProps {
  searchParams: { 
    status?: string
    priority?: string
    page?: string
  }
}

export default function MattersPage({ searchParams }: PageProps) {
  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Legal Matters</h1>
        <Button asChild>
          <Link href="/matters/new">New Matter</Link>
        </Button>
      </div>
      
      <Suspense fallback={<MattersLoading />}>
        <MattersList searchParams={searchParams} />
      </Suspense>
    </div>
  )
}
```

#### Nuxt.js Page
```vue
<!-- pages/matters/index.vue -->
<script setup lang="ts">
// SEO and meta
useSeoMeta({
  title: 'Legal Matters | Aster Management',
  description: 'Manage all your legal matters in one place'
})

// Route params and query
const route = useRoute()
const router = useRouter()

// Extract query parameters
const searchParams = computed(() => ({
  status: route.query.status as string,
  priority: route.query.priority as string,
  page: route.query.page as string
}))

// Server-side data fetching
const { data: matters, pending, error, refresh } = await useFetch('/api/matters', {
  query: searchParams,
  key: 'matters-list'
})

// Client-side navigation
const navigateToNew = () => {
  router.push('/matters/new')
}
</script>

<template>
  <div class="container mx-auto py-6">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-3xl font-bold">Legal Matters</h1>
      <Button @click="navigateToNew">
        New Matter
      </Button>
    </div>
    
    <!-- Loading state -->
    <MattersLoading v-if="pending" />
    
    <!-- Error state -->
    <div v-else-if="error" class="text-red-500">
      Error loading matters: {{ error.message }}
    </div>
    
    <!-- Success state -->
    <MattersList v-else :matters="matters" :search-params="searchParams" />
  </div>
</template>
```

### 2. Dynamic Route Migration

#### Next.js Dynamic Route
```tsx
// app/matters/[id]/page.tsx
import { notFound } from 'next/navigation'
import { Metadata } from 'next'

interface PageProps {
  params: { id: string }
  searchParams: { tab?: string }
}

// Generate metadata
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const matter = await fetch(`/api/matters/${params.id}`).then(res => res.json())
  
  return {
    title: `${matter.title} | Aster Management`,
    description: matter.description
  }
}

export default async function MatterDetailPage({ params, searchParams }: PageProps) {
  const matter = await fetch(`/api/matters/${params.id}`)
    .then(res => res.json())
    .catch(() => null)
  
  if (!matter) {
    notFound()
  }
  
  return (
    <div className="container mx-auto py-6">
      <MatterDetail matter={matter} activeTab={searchParams.tab} />
    </div>
  )
}
```

#### Nuxt.js Dynamic Route
```vue
<!-- pages/matters/[id]/index.vue -->
<script setup lang="ts">
const route = useRoute()
const { id } = route.params

// Validate route parameter
if (typeof id !== 'string') {
  throw createError({
    statusCode: 400,
    statusMessage: 'Invalid matter ID'
  })
}

// Server-side data fetching
const { data: matter, error } = await useFetch(`/api/matters/${id}`, {
  key: `matter-${id}`
})

// Handle not found
if (error.value?.statusCode === 404) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Matter not found'
  })
}

// Dynamic SEO based on data
useSeoMeta({
  title: () => matter.value ? `${matter.value.title} | Aster Management` : 'Matter | Aster Management',
  description: () => matter.value?.description || 'Legal matter details'
})

// Get active tab from query
const activeTab = computed(() => route.query.tab as string || 'overview')
</script>

<template>
  <div class="container mx-auto py-6">
    <MatterDetail 
      v-if="matter" 
      :matter="matter" 
      :active-tab="activeTab" 
    />
  </div>
</template>
```

### 3. Layout Migration

#### Next.js Layout
```tsx
// app/layout.tsx (Root Layout)
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/Providers'
import { Navigation } from '@/components/Navigation'
import { Toaster } from '@/components/ui/toaster'

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <div className="min-h-screen bg-background">
            <Navigation />
            <main className="flex-1">
              {children}
            </main>
          </div>
          <Toaster />
        </Providers>
      </body>
    </html>
  )
}

// app/kanban/layout.tsx (Nested Layout)
export default function KanbanLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="kanban-layout">
      <KanbanSidebar />
      <div className="kanban-content">
        {children}
      </div>
    </div>
  )
}
```

#### Nuxt.js Layout
```vue
<!-- layouts/default.vue -->
<script setup lang="ts">
import '@/assets/css/main.css'

// Global providers setup
const { $pinia } = useNuxtApp()

// Theme management
const colorMode = useColorMode()
</script>

<template>
  <div class="min-h-screen bg-background">
    <Navigation />
    <main class="flex-1">
      <slot />
    </main>
    <Toaster />
  </div>
</template>

<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

body {
  font-family: 'Inter', sans-serif;
}
</style>
```

```vue
<!-- layouts/kanban.vue -->
<script setup lang="ts">
// Kanban-specific layout logic
const kanbanStore = useKanbanStore()
const { sidebarOpen } = storeToRefs(kanbanStore)
</script>

<template>
  <div class="kanban-layout">
    <KanbanSidebar :open="sidebarOpen" />
    <div class="kanban-content" :class="{ 'sidebar-open': sidebarOpen }">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.kanban-layout {
  display: flex;
  height: 100vh;
}

.kanban-content {
  flex: 1;
  transition: margin-left 0.3s ease;
}

.kanban-content.sidebar-open {
  margin-left: 280px;
}
</style>
```

### 4. Navigation and Link Migration

#### Next.js Navigation
```tsx
// components/Navigation.tsx
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'

export function Navigation() {
  const router = useRouter()
  const pathname = usePathname()
  
  const handleNavigate = (path: string) => {
    router.push(path)
  }
  
  const isActive = (path: string) => pathname === path
  
  return (
    <nav className="border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="font-bold text-xl">
            Aster Management
          </Link>
          
          <div className="flex space-x-4">
            <Link 
              href="/kanban" 
              className={`px-3 py-2 rounded ${isActive('/kanban') ? 'bg-primary text-primary-foreground' : ''}`}
            >
              Kanban
            </Link>
            <Link 
              href="/matters" 
              className={`px-3 py-2 rounded ${isActive('/matters') ? 'bg-primary text-primary-foreground' : ''}`}
            >
              Matters
            </Link>
          </div>
          
          <Button onClick={() => handleNavigate('/matters/new')}>
            New Matter
          </Button>
        </div>
      </div>
    </nav>
  )
}
```

#### Nuxt.js Navigation
```vue
<!-- components/Navigation.vue -->
<script setup lang="ts">
const route = useRoute()
const router = useRouter()

const handleNavigate = (path: string) => {
  router.push(path)
}

const isActive = (path: string) => route.path === path
</script>

<template>
  <nav class="border-b">
    <div class="container mx-auto px-4">
      <div class="flex items-center justify-between h-16">
        <NuxtLink to="/" class="font-bold text-xl">
          Aster Management
        </NuxtLink>
        
        <div class="flex space-x-4">
          <NuxtLink 
            to="/kanban" 
            :class="['px-3 py-2 rounded', isActive('/kanban') ? 'bg-primary text-primary-foreground' : '']"
          >
            Kanban
          </NuxtLink>
          <NuxtLink 
            to="/matters" 
            :class="['px-3 py-2 rounded', isActive('/matters') ? 'bg-primary text-primary-foreground' : '']"
          >
            Matters
          </NuxtLink>
        </div>
        
        <Button @click="handleNavigate('/matters/new')">
          New Matter
        </Button>
      </div>
    </div>
  </nav>
</template>
```

### 5. Middleware Migration

#### Next.js Middleware
```typescript
// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyJWT } from '@/lib/auth'

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  
  // Public paths that don't require authentication
  const publicPaths = ['/login', '/signup', '/']
  if (publicPaths.includes(pathname)) {
    return NextResponse.next()
  }
  
  // Check authentication
  const token = request.cookies.get('auth-token')?.value
  
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  
  try {
    const payload = await verifyJWT(token)
    
    // Role-based access control
    if (pathname.startsWith('/admin') && payload.role !== 'admin') {
      return NextResponse.redirect(new URL('/unauthorized', request.url))
    }
    
    return NextResponse.next()
  } catch (error) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
```

#### Nuxt.js Middleware
```typescript
// middleware/auth.global.ts
export default defineNuxtRouteMiddleware((to, from) => {
  // Public paths that don't require authentication
  const publicPaths = ['/login', '/signup', '/']
  if (publicPaths.includes(to.path)) {
    return
  }
  
  // Check authentication
  const { $auth } = useNuxtApp()
  const user = useCookie('auth-user')
  
  if (!user.value) {
    return navigateTo('/login')
  }
  
  // Role-based access control
  if (to.path.startsWith('/admin') && user.value.role !== 'admin') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Access denied'
    })
  }
})
```

```typescript
// middleware/role.ts (Named middleware)
export default defineNuxtRouteMiddleware((to, from) => {
  const user = useCookie('auth-user')
  const requiredRole = to.meta.requiresRole
  
  if (requiredRole && user.value?.role !== requiredRole) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Insufficient permissions'
    })
  }
})
```

```vue
<!-- pages/admin/index.vue -->
<script setup lang="ts">
// Apply named middleware
definePageMeta({
  middleware: 'role',
  requiresRole: 'admin'
})
</script>
```

### 6. API Routes Migration

#### Next.js API Route
```typescript
// app/api/matters/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getMattersByUser, createMatter } from '@/lib/matters'

const createMatterSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high'])
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    const matters = await getMattersByUser(userId)
    return NextResponse.json(matters)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch matters' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = createMatterSchema.parse(body)
    
    const matter = await createMatter(validatedData)
    return NextResponse.json(matter, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to create matter' },
      { status: 500 }
    )
  }
}
```

#### Nuxt.js API Route
```typescript
// server/api/matters/index.get.ts
import { z } from 'zod'
import { getMattersByUser } from '~/server/lib/matters'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const userId = query.userId as string
    
    const matters = await getMattersByUser(userId)
    return matters
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch matters'
    })
  }
})
```

```typescript
// server/api/matters/index.post.ts
import { z } from 'zod'
import { createMatter } from '~/server/lib/matters'

const createMatterSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high'])
})

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const validatedData = createMatterSchema.parse(body)
    
    const matter = await createMatter(validatedData)
    
    setResponseStatus(event, 201)
    return matter
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Validation failed',
        data: error.errors
      })
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to create matter'
    })
  }
})
```

### 7. Error Handling Migration

#### Next.js Error Handling
```tsx
// app/error.tsx
'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="container mx-auto py-6 text-center">
      <h2 className="text-2xl font-bold mb-4">Something went wrong!</h2>
      <p className="text-muted-foreground mb-4">
        {error.message || 'An unexpected error occurred'}
      </p>
      <Button onClick={reset}>Try again</Button>
    </div>
  )
}

// app/not-found.tsx
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="container mx-auto py-6 text-center">
      <h2 className="text-2xl font-bold mb-4">Not Found</h2>
      <p className="text-muted-foreground mb-4">
        Could not find requested resource
      </p>
      <Button asChild>
        <Link href="/">Return Home</Link>
      </Button>
    </div>
  )
}
```

#### Nuxt.js Error Handling
```vue
<!-- error.vue -->
<script setup lang="ts">
interface Props {
  error: {
    statusCode: number
    statusMessage: string
    message: string
    stack?: string
  }
}

const props = defineProps<Props>()

// Log error for debugging
console.error('Application error:', props.error)

// Handle different error types
const errorTitle = computed(() => {
  switch (props.error.statusCode) {
    case 404:
      return 'Page Not Found'
    case 403:
      return 'Access Denied'
    case 500:
      return 'Server Error'
    default:
      return 'Something went wrong'
  }
})

const errorMessage = computed(() => {
  return props.error.statusMessage || props.error.message || 'An unexpected error occurred'
})

// Clear error and navigate home
const handleRetry = async () => {
  await clearError({ redirect: '/' })
}
</script>

<template>
  <div class="container mx-auto py-6 text-center">
    <h1 class="text-2xl font-bold mb-4">{{ errorTitle }}</h1>
    <p class="text-muted-foreground mb-4">{{ errorMessage }}</p>
    
    <div class="flex gap-4 justify-center">
      <Button @click="handleRetry">Go Home</Button>
      <Button variant="outline" @click="$router.back()">Go Back</Button>
    </div>
    
    <!-- Development error details -->
    <details v-if="$dev && error.stack" class="mt-8 text-left">
      <summary class="cursor-pointer font-semibold">Error Details</summary>
      <pre class="mt-2 p-4 bg-muted rounded text-sm overflow-auto">{{ error.stack }}</pre>
    </details>
  </div>
</template>
```

## Migration Benefits

### Performance Improvements
- **File-based routing**: Automatic code splitting
- **Server-side rendering**: Better SEO and initial load times
- **Automatic optimization**: Built-in performance optimizations
- **Smaller bundle**: More efficient routing system

### Developer Experience
- **Simpler routing**: No complex routing configuration
- **Auto-imports**: Pages and layouts auto-imported
- **Better TypeScript**: Improved type inference for routes
- **Hot module replacement**: Faster development reloads

### Feature Advantages
- **Middleware system**: More flexible route protection
- **Layout system**: Better layout composition
- **Error handling**: More comprehensive error boundaries
- **SEO optimization**: Built-in SEO features

## Migration Checklist

### Pre-Migration
- [ ] Audit existing route structure
- [ ] Identify dynamic routes and parameters
- [ ] Map Next.js layouts to Nuxt.js layouts
- [ ] Plan middleware migration strategy

### Route Migration
- [ ] Create pages directory structure
- [ ] Migrate page components to .vue files
- [ ] Convert dynamic routes ([id] → [id])
- [ ] Update route parameters access
- [ ] Migrate nested routes

### Layout Migration
- [ ] Create layouts directory
- [ ] Convert React layouts to Vue layouts
- [ ] Update layout composition
- [ ] Test layout inheritance

### Navigation Migration
- [ ] Replace Next.js Link with NuxtLink
- [ ] Update navigation components
- [ ] Migrate programmatic navigation
- [ ] Test route transitions

### Middleware Migration
- [ ] Create middleware directory
- [ ] Convert Next.js middleware to Nuxt middleware
- [ ] Test authentication flows
- [ ] Verify role-based access control

### API Routes
- [ ] Create server/api directory
- [ ] Migrate API route handlers
- [ ] Update request/response handling
- [ ] Test API functionality

### Error Handling
- [ ] Create error.vue component
- [ ] Test error boundaries
- [ ] Verify 404 handling
- [ ] Test error recovery

## Common Pitfalls

### 1. Route Parameter Access
```typescript
// ❌ Wrong - Next.js pattern
const { id } = useParams()

// ✅ Correct - Nuxt.js pattern
const route = useRoute()
const { id } = route.params
```

### 2. Query Parameters
```typescript
// ❌ Wrong - Next.js pattern
const searchParams = useSearchParams()
const status = searchParams.get('status')

// ✅ Correct - Nuxt.js pattern
const route = useRoute()
const status = route.query.status
```

### 3. Programmatic Navigation
```typescript
// ❌ Wrong - Next.js pattern
const router = useRouter()
router.push('/matters/123')

// ✅ Correct - Nuxt.js pattern
const router = useRouter()
await router.push('/matters/123')
// or
await navigateTo('/matters/123')
```

### 4. Layout Definition
```vue
<!-- ❌ Wrong - layouts not working -->
<script setup>
// Missing layout definition
</script>

<!-- ✅ Correct - proper layout usage -->
<script setup>
definePageMeta({
  layout: 'kanban'
})
</script>
```

## Conclusion

The migration from Next.js App Router to Nuxt.js pages resulted in:

- **Simpler routing logic** with file-based conventions
- **Better performance** with automatic optimizations
- **Improved developer experience** with auto-imports and hot reloading
- **More flexible middleware system** for route protection
- **Better SEO capabilities** with built-in optimizations

Nuxt.js provides a more intuitive and powerful routing system that reduces boilerplate code while maintaining all the functionality of the original Next.js implementation.