# Troubleshooting Guide

This guide covers common issues and solutions when developing with the Aster Management Nuxt.js application.

## Development Issues

### Bun-Related Issues

#### Installation Problems

**Issue**: `bun install` fails with permission errors
```bash
Error: EACCES: permission denied, open '/Users/username/.bun/install/cache'
```

**Solution**:
```bash
# Fix Bun cache permissions
sudo chown -R $(whoami) ~/.bun

# Or clear cache and reinstall
rm -rf ~/.bun/install/cache
bun install
```

**Issue**: Package installation hangs or is extremely slow
```bash
# Bun install seems to hang
bun install
# No progress for minutes
```

**Solution**:
```bash
# Clear Bun cache
bun pm cache rm

# Use verbose mode to see what's happening
bun install --verbose

# Force reinstall
bun install --force

# Check network connectivity
curl -I https://registry.npmjs.org/
```

#### Version Conflicts

**Issue**: Bun version mismatch between local and CI/CD
```
Error: Bun version 1.2.15 is not compatible with lockfile version 1.2.16
```

**Solution**:
```bash
# Update Bun to latest version
curl -fsSL https://bun.sh/install | bash

# Or install specific version
curl -fsSL https://bun.sh/install | bash -s "bun-v1.2.16"

# Update lockfile
rm bun.lock
bun install
```

### Nuxt 3 Issues

#### Build Errors

**Issue**: TypeScript errors during build
```
ERROR  Nuxt build error
[TypeScript] Found 5 errors in 3 files.
```

**Solution**:
```bash
# Run type checking separately
bun run typecheck

# Generate types
bun nuxi prepare

# Clear Nuxt cache
rm -rf .nuxt
bun dev
```

**Issue**: Module resolution errors
```
ERROR  Cannot resolve module '~/components/MyComponent'
```

**Solution**:
```typescript
// nuxt.config.ts - Check auto-imports configuration
export default defineNuxtConfig({
  imports: {
    dirs: [
      'components/**',
      'composables/**',
      'utils/**'
    ]
  },
  
  alias: {
    '~~': '/<rootDir>',
    '@@': '/<rootDir>',
    '~': '/<rootDir>',
    '@': '/<rootDir>',
    'assets': '/<rootDir>/assets',
    'public': '/<rootDir>/public'
  }
})
```

#### SSR/Hydration Issues

**Issue**: Hydration mismatch warnings
```
[Vue warn]: Hydration node mismatch:
- Client vnode: div
- Server rendered DOM: span
```

**Solution**:
```vue
<!-- Use ClientOnly for client-specific content -->
<template>
  <div>
    <!-- SSR-safe content -->
    <h1>{{ title }}</h1>
    
    <!-- Client-only content -->
    <ClientOnly>
      <DatePicker v-model="date" />
      <template #fallback>
        <div>Loading date picker...</div>
      </template>
    </ClientOnly>
  </div>
</template>

<script setup>
// Avoid using process.client in reactive data
const isClient = process.client

// Better: Use onMounted for client-side logic
const showClientContent = ref(false)

onMounted(() => {
  showClientContent.value = true
})
</script>
```

### Vue 3 Composition API Issues

#### Reactivity Problems

**Issue**: Losing reactivity when destructuring
```typescript
// ❌ This loses reactivity
const { name, email } = user.value

// ✅ Use computed instead
const name = computed(() => user.value.name)
const email = computed(() => user.value.email)

// ✅ Or use toRefs
const { name, email } = toRefs(user.value)
```

**Issue**: Ref unwrapping confusion
```typescript
// In template, refs are auto-unwrapped
// {{ count }} ✅ Works

// In script, need .value
// count ❌ Wrong
// count.value ✅ Correct

const increment = () => {
  count.value++ // ✅ Correct
}
```

#### Composable Issues

**Issue**: Composables not working in wrong context
```typescript
// ❌ Using composable outside setup
const router = useRouter() // Error: must be called in setup

export default {
  mounted() {
    const route = useRoute() // ❌ Error
  }
}

// ✅ Use in setup context
const MyComponent = defineComponent({
  setup() {
    const router = useRouter() // ✅ Works
    const route = useRoute() // ✅ Works
    
    return { router, route }
  }
})
```

### State Management Issues

#### Pinia Store Problems

**Issue**: Store not persisting data
```typescript
// Check if you're using the store correctly
const store = useMyStore()

// ❌ Direct mutation (won't trigger reactivity)
store.items.push(newItem)

// ✅ Use store action
store.addItem(newItem)

// ✅ Or use $patch
store.$patch((state) => {
  state.items.push(newItem)
})
```

**Issue**: Store state not reactive in components
```vue
<script setup>
// ❌ This won't be reactive
const items = store.items

// ✅ Use storeToRefs
const { items } = storeToRefs(store)

// ✅ Or computed
const items = computed(() => store.items)
</script>
```

#### TanStack Query Issues

**Issue**: Queries not refetching
```typescript
// Check if query key includes all dependencies
const { data } = useQuery({
  // ❌ Missing dependency
  queryKey: ['matters'],
  queryFn: () => fetchMatters(filters.value)
})

// ✅ Include all dependencies
const { data } = useQuery({
  queryKey: ['matters', filters],
  queryFn: () => fetchMatters(unref(filters))
})
```

### Styling Issues

#### Tailwind CSS Problems

**Issue**: Tailwind classes not working
```bash
# Check if Tailwind is properly configured
cat tailwind.config.js

# Verify content paths
content: [
  "./components/**/*.{js,vue,ts}",
  "./layouts/**/*.vue",
  "./pages/**/*.vue",
  "./plugins/**/*.{js,ts}",
  "./nuxt.config.{js,ts}",
  "./app.vue"
]

# Rebuild CSS
rm -rf .nuxt
bun dev
```

**Issue**: Custom CSS not loading
```typescript
// nuxt.config.ts - Check CSS configuration
export default defineNuxtConfig({
  css: [
    '~/assets/css/main.css'
  ],
  
  postcss: {
    plugins: {
      tailwindcss: {},
      autoprefixer: {}
    }
  }
})
```

### Form Validation Issues

#### VeeValidate Problems

**Issue**: Validation not triggering
```vue
<script setup>
// ❌ Missing validation schema
const { handleSubmit } = useForm()

// ✅ Include validation schema
const { handleSubmit, defineField } = useForm({
  validationSchema: toTypedSchema(mySchema)
})

// ❌ Not binding field correctly
<input v-model="title" />

// ✅ Use defineField
const [title, titleAttrs] = defineField('title')
// ...
<input v-model="title" v-bind="titleAttrs" />
</script>
```

**Issue**: Async validation not working
```typescript
// Ensure async validation is properly handled
const emailSchema = z.string()
  .email()
  .refine(async (email) => {
    const available = await checkEmailAvailability(email)
    return available
  }, 'Email already exists')
```

## Performance Issues

### Slow Load Times

**Diagnosis**:
```bash
# Analyze bundle size
bun run build --analyze

# Check Lighthouse scores
bun run perf:lighthouse

# Profile with browser DevTools
# Network tab -> Check large assets
# Performance tab -> Check JavaScript execution
```

**Solutions**:
```vue
<!-- Lazy load heavy components -->
<script setup>
const HeavyComponent = defineAsyncComponent(
  () => import('~/components/HeavyComponent.vue')
)
</script>

<!-- Optimize images -->
<template>
  <NuxtImg
    src="/large-image.jpg"
    format="webp"
    quality="80"
    :loading="priority ? 'eager' : 'lazy'"
  />
</template>
```

### Memory Leaks

**Issue**: Memory usage keeps growing
```typescript
// ❌ Not cleaning up event listeners
onMounted(() => {
  window.addEventListener('resize', handleResize)
})

// ✅ Clean up properly
onMounted(() => {
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})

// ✅ Or use VueUse
const { pause, resume } = useEventListener(window, 'resize', handleResize)

// ✅ Clean up watchers
const stopWatcher = watch(data, callback)

onUnmounted(() => {
  stopWatcher()
})
```

## Testing Issues

### Test Failures

**Issue**: Tests failing with "Cannot resolve module"
```bash
# Check Vitest configuration
# vitest.config.ts
export default defineConfig({
  test: {
    environment: 'happy-dom',
    alias: {
      '~': resolve(__dirname, './'),
      '@': resolve(__dirname, './')
    }
  }
})
```

**Issue**: Component tests not finding elements
```typescript
// Use data-testid for reliable element selection
// ❌ Fragile selector
wrapper.find('.btn-primary')

// ✅ Stable selector
wrapper.find('[data-testid="submit-button"]')
```

### E2E Test Issues

**Issue**: Playwright tests timing out
```typescript
// Increase timeout for slow operations
test('slow operation', async ({ page }) => {
  test.setTimeout(60000) // 60 seconds
  
  // Or wait for specific conditions
  await page.waitForLoadState('networkidle')
  await page.waitForSelector('[data-testid="loaded"]')
})
```

## API Integration Issues

### CORS Problems

**Issue**: CORS errors in development
```bash
# Configure proxy in Nuxt
# nuxt.config.ts
export default defineNuxtConfig({
  nitro: {
    devProxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true
      }
    }
  }
})
```

### Authentication Issues

**Issue**: Token not being sent with requests
```typescript
// Ensure token is included in requests
const { token } = useAuth()

const api = $fetch.create({
  baseURL: '/api',
  onRequest({ options }) {
    if (token.value) {
      options.headers = {
        ...options.headers,
        Authorization: `Bearer ${token.value}`
      }
    }
  }
})
```

**Issue**: Refresh token not working
```typescript
// Implement automatic token refresh
const api = $fetch.create({
  onResponseError({ response, options }) {
    if (response.status === 401) {
      // Try to refresh token
      return refreshToken().then(() => {
        // Retry original request
        return $fetch(options.url, options)
      })
    }
  }
})
```

## Environment Issues

### Development Environment

**Issue**: Environment variables not loading
```bash
# Check .env file exists and is properly formatted
cat .env

# Verify environment variables are loaded
echo $NUXT_PUBLIC_API_BASE

# Check runtime config
console.log(useRuntimeConfig())
```

**Issue**: Hot reload not working
```bash
# Check file watching limits (Linux)
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
sudo sysctl -p

# Restart development server
bun dev
```

### Production Issues

**Issue**: Application not starting in production
```bash
# Check production build
bun run build

# Test production server locally
bun run preview

# Check logs
docker logs <container-name>

# Verify environment variables in container
docker exec -it <container-name> env
```

## Browser Compatibility

### JavaScript Errors

**Issue**: "Unexpected token" in older browsers
```typescript
// Check browser targets in build configuration
// nuxt.config.ts
export default defineNuxtConfig({
  build: {
    transpile: ['@tanstack/vue-query']
  },
  
  vite: {
    build: {
      target: 'es2015' // Support older browsers
    }
  }
})
```

### CSS Issues

**Issue**: CSS not working in specific browsers
```css
/* Add vendor prefixes */
.element {
  display: -webkit-box;
  display: -ms-flexbox;
  display: flex;
  
  -webkit-transform: translateX(10px);
  -ms-transform: translateX(10px);
  transform: translateX(10px);
}
```

## Debugging Tools

### Vue DevTools
```bash
# Install Vue DevTools browser extension
# Enable in development
# nuxt.config.ts
export default defineNuxtConfig({
  devtools: { enabled: true },
  
  vue: {
    config: {
      devtools: true
    }
  }
})
```

### Console Debugging
```typescript
// Structured logging
const debug = (label: string, data: any) => {
  if (process.dev) {
    console.group(`🐛 ${label}`)
    console.log(data)
    console.trace()
    console.groupEnd()
  }
}

// Performance debugging
const measurePerformance = (label: string, fn: () => void) => {
  const start = performance.now()
  fn()
  const end = performance.now()
  console.log(`⏱️ ${label}: ${end - start}ms`)
}
```

### Network Debugging
```bash
# Test API endpoints
curl -X GET http://localhost:8080/api/matters \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json"

# Check DNS resolution
nslookup api.aster.example.com

# Test connectivity
telnet api.aster.example.com 443
```

## Common Error Messages

### "Cannot find module"
```bash
# Solutions:
1. Check if package is installed: bun list <package-name>
2. Install missing package: bun add <package-name>
3. Clear cache: rm -rf node_modules .nuxt && bun install
4. Check import path: import { ... } from '~/correct/path'
```

### "hydration failed"
```vue
<!-- Solutions: -->
1. Use ClientOnly for client-specific content
2. Avoid using process.client in templates
3. Ensure SSR and client render the same HTML
4. Check for date/time formatting differences
```

### "Maximum call stack size exceeded"
```typescript
// Solutions:
1. Check for circular references in objects
2. Avoid infinite recursion in computed properties
3. Use watch instead of computed for complex logic
4. Check for infinite loops in reactive data
```

## Getting Help

### Internal Resources
1. Check this troubleshooting guide
2. Review architecture documentation
3. Search project issues on GitHub
4. Ask team in Slack #dev-frontend

### External Resources
1. [Nuxt 3 Documentation](https://nuxt.com/docs)
2. [Vue 3 Guide](https://vuejs.org/guide/)
3. [Bun Documentation](https://bun.sh/docs)
4. [TanStack Query Docs](https://tanstack.com/query/latest)

### Reporting Issues
When reporting issues, include:
- Environment details (OS, Node/Bun version)
- Steps to reproduce
- Expected vs actual behavior
- Error messages and stack traces
- Browser/device information
- Screenshots if applicable