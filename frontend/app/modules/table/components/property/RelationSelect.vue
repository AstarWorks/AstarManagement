<template>
  <Select v-model="selectedId" :disabled="loading">
    <SelectTrigger>
      <SelectValue :placeholder="placeholder">
        {{ selectedRecord?.data?.[displayField] || selectedRecord?.id || placeholder }}
      </SelectValue>
    </SelectTrigger>
    <SelectContent>
      <SelectItem 
        v-for="record in records" 
        :key="record.id" 
        :value="record.id!"
      >
        {{ record.data?.[displayField] || record.id }}
      </SelectItem>
    </SelectContent>
  </Select>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useTable } from '~/composables/useTable'
import type { RecordResponse } from '~/types'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/foundation/components/ui/select'

interface Props {
  modelValue: string | null
  targetTableId: string
  displayField?: string
  placeholder?: string
}

const props = withDefaults(defineProps<Props>(), {
  displayField: 'name',
  placeholder: 'Select record'
})

const emit = defineEmits<{
  'update:modelValue': [value: string | null]
}>()

const table = useTable()
const records = ref<RecordResponse[]>([])
const loading = ref(false)

const selectedId = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const selectedRecord = computed(() => 
  records.value.find((r: RecordResponse) => r.id === props.modelValue)
)

const loadRecords = async () => {
  if (!props.targetTableId || loading.value) return
  
  loading.value = true
  try {
    // 既存のlistRecords APIを使用
    const response = await table.listRecords(props.targetTableId, {
      pageSize: 100 // リレーション選択用なので多めに取得
    })
    records.value = response.records || []
  } catch (error) {
    console.error('Failed to load relation records:', error)
    records.value = []
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadRecords()
})
</script>