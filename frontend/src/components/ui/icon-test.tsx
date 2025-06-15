import { ChevronDown, Search, User, Settings, Home, FileText, Scale } from 'lucide-react'
import { Button } from './button'

/**
 * Test component to verify Lucide-React integration
 * This component demonstrates common legal case management icons
 */
export function IconTest() {
  return (
    <div className="p-6 space-y-4">
      <h2 className="text-xl font-semibold">Lucide-React Icon Integration Test</h2>
      
      {/* Basic icon display */}
      <div className="flex gap-4 items-center">
        <Home className="size-5" />
        <Search className="size-5" />
        <User className="size-5" />
        <Settings className="size-5" />
        <FileText className="size-5" />
        <Scale className="size-5" />
      </div>
      
      {/* Icons in buttons */}
      <div className="flex gap-2">
        <Button>
          <Home />
          Home
        </Button>
        <Button variant="outline">
          <Search />
          Search
        </Button>
        <Button variant="secondary">
          <FileText />
          Documents
        </Button>
        <Button variant="ghost">
          <Scale />
          Legal
        </Button>
      </div>
      
      {/* Icon-only buttons */}
      <div className="flex gap-2">
        <Button size="icon" variant="outline">
          <Settings />
        </Button>
        <Button size="icon">
          <User />
        </Button>
        <Button size="icon" variant="ghost">
          <ChevronDown />
        </Button>
      </div>
      
      {/* Different sizes */}
      <div className="flex gap-4 items-center">
        <FileText className="size-3" />
        <FileText className="size-4" />
        <FileText className="size-5" />
        <FileText className="size-6" />
        <FileText className="size-8" />
      </div>
    </div>
  )
}