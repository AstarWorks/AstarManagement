/** @type {import('tailwindcss').Config} */
export default {
  content: [
    // Foundation layer (Core business logic and UI components)
    './app/foundation/**/*.{js,vue,ts}',
    
    // Modules (Feature modules)
    './app/modules/**/*.{js,vue,ts}',
    
    // Infrastructure layer (Technical implementations)
    './app/layouts/**/*.vue',
    './app/pages/**/*.vue',
    './app/plugins/**/*.{js,ts}',
    './app/middleware/**/*.{js,ts}',
    
    // Root level files
    './app/app.vue',
    './app/error.vue',
    
    // Components directory (if any legacy components remain)
    './app/components/**/*.{js,vue,ts}'
  ],
  theme: {
    extend: {
      // Custom theme extensions can be added here
    }
  },
  plugins: []
}