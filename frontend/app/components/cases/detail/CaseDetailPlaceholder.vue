<template>
  <Card>
    <CardHeader>
      <CardTitle class="text-lg">
        {{ title }}
      </CardTitle>
      <CardDescription>
        {{ description }}
      </CardDescription>
    </CardHeader>
    <CardContent>
      <div class="placeholder-content text-center py-8">
        <Icon :name="iconName" class="h-12 w-12 text-muted-foreground mx-auto mb-3" />
        <p class="text-muted-foreground">
          {{ placeholderText }}
        </p>
      </div>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
interface Props {
  title: string
  description: string
  iconName: string
  placeholderText: string
}

defineProps<Props>()
</script>

<style scoped>
.placeholder-content {
  min-height: 200px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
</style>