declare module '@vue/runtime-core' {
    interface ComponentCustomProperties {
        $t: (key: string, params?: Record<string, any>) => string
        $tm: (key: string) => string[]
        $n: (value: number, format?: string) => string
        $d: (value: Date | number, format?: string) => string
        $locale: string
    }
}

export {}