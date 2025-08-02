<template>
  <Avatar :class="avatarClass">
    <AvatarImage :src="user?.avatar || ''" :alt="user?.name || 'User'" />
    <AvatarFallback :class="fallbackClass">
      {{ getUserInitials(user?.name) }}
    </AvatarFallback>
  </Avatar>
</template>

<script setup lang="ts">
import type { IUser } from '~/types/auth'

interface Props {
  user: IUser | null
  size?: 'sm' | 'md' | 'lg'
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md'
})

const avatarClass = computed(() => {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8', 
    lg: 'h-12 w-12'
  }
  return sizeClasses[props.size]
})

const fallbackClass = computed(() => {
  const baseClasses = 'bg-blue-100 text-blue-700 font-medium'
  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-lg'
  }
  return `${baseClasses} ${sizeClasses[props.size]}`
})

const getUserInitials = (name?: string): string => {
  if (!name) return '?'
  
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length >= 2 && parts[0] && parts[1]) {
    return (parts[0][0] || '') + (parts[1][0] || '')
  }
  return parts[0]?.[0] || '?'
}
</script>