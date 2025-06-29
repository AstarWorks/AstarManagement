declare module 'vue-virtual-scroller' {
  import { DefineComponent } from 'vue'

  export interface VirtualScrollerProps {
    items: any[]
    itemSize?: number | string | ((index: number) => number)
    buffer?: number
    poolSize?: number
    keyField?: string
    direction?: 'vertical' | 'horizontal'
    listTag?: string
    itemTag?: string
    listClass?: string | object | any[]
    itemClass?: string | object | any[]
    gridItems?: number
    prerender?: number
    emit?: boolean
  }

  export interface VirtualScrollerEvents {
    resize: () => void
    visible: () => void
    hidden: () => void
    update: (startIndex: number, endIndex: number) => void
  }

  export interface VirtualScrollerSlots {
    default: (props: {
      item: any
      index: number
      active: boolean
    }) => any
    before?: () => any
    after?: () => any
  }

  export interface RecycleScrollerMethods {
    scrollToItem(index: number): void
    scrollToPosition(position: number): void
  }

  export const RecycleScroller: DefineComponent<
    VirtualScrollerProps,
    {},
    {},
    {},
    {},
    {},
    {},
    VirtualScrollerEvents,
    string,
    {},
    {},
    string,
    VirtualScrollerSlots
  > & RecycleScrollerMethods

  export const DynamicScroller: DefineComponent<
    VirtualScrollerProps & {
      minItemSize: number | string
    },
    {},
    {},
    {},
    {},
    {},
    {},
    VirtualScrollerEvents,
    string,
    {},
    {},
    string,
    VirtualScrollerSlots
  >

  export const DynamicScrollerItem: DefineComponent<
    {
      item: any
      active?: boolean
      sizeDependencies?: any[]
      watchData?: boolean
      tag?: string
      emit?: boolean
    },
    {},
    {},
    {},
    {},
    {},
    {},
    {
      resize: () => void
    },
    string,
    {},
    {},
    string,
    {
      default: () => any
    }
  >
}