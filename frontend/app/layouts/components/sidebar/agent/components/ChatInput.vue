<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import { Textarea } from '@ui/textarea'
import { Button } from '@ui/button'
import { Send } from 'lucide-vue-next'

const message = ref('')
const textareaRef = ref<HTMLTextAreaElement | null>(null)

const adjustHeight = () => {
  if (textareaRef.value) {
    textareaRef.value.style.height = 'auto'
    nextTick(() => {
      if (textareaRef.value) {
        const scrollHeight = textareaRef.value.scrollHeight
        textareaRef.value.style.height = `${scrollHeight}px`
      }
    })
  }
}

watch(message, adjustHeight)

const sendMessage = () => {
  if (message.value.trim()) {
    console.log('Sending message:', message.value)
    message.value = ''
    nextTick(adjustHeight)
  }
}
</script>

<template>
  <div class="flex items-end gap-2 rounded-lg border bg-background p-2">
    <Textarea
      ref="textareaRef"
      v-model="message"
      placeholder="Type your message here..."
      class="flex-1 resize-none overflow-hidden border-0 bg-transparent px-2 py-1.5 shadow-none focus-visible:ring-0"
      rows="1"
      @keydown.enter.prevent="sendMessage"
    />
    <Button type="submit" size="icon" @click="sendMessage">
      <Send class="h-4 w-4" />
      <span class="sr-only">Send</span>
    </Button>
  </div>
</template>
