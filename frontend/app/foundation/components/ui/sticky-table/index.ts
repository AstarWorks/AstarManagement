export { default as StickyTable } from "./StickyTable.vue"
export { default as StickyTableHeader } from "./StickyTableHeader.vue"

// 既存のTableコンポーネントも再エクスポート（互換性のため）
export { 
  Table,
  TableHeader,
  TableBody,
  TableCell,
  TableRow,
  TableHead,
  TableFooter,
  TableCaption,
  TableEmpty 
} from "../table"