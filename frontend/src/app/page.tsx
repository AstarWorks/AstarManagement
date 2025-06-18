import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowRight, Kanban, Users, Calendar, FileText, BarChart3, Scale } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Scale className="w-8 h-8 text-blue-600" />
            <h1 className="text-4xl font-bold text-gray-900">
              Aster Management
            </h1>
          </div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Comprehensive legal practice management system with modern workflow tools
          </p>
          <Badge variant="secondary" className="mt-2">
            Frontend Demo
          </Badge>
        </div>

        {/* Demo Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {/* Kanban Board Demo */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Kanban className="w-6 h-6 text-blue-600" />
                <CardTitle>Kanban Board</CardTitle>
              </div>
              <CardDescription>
                Visual case management with drag & drop functionality
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Features:</span>
                  <Badge variant="outline">Interactive</Badge>
                </div>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• 7-column workflow</li>
                  <li>• Priority & status tracking</li>
                  <li>• Drag & drop interface</li>
                  <li>• Responsive design</li>
                </ul>
                <Link href="/demo/kanban">
                  <Button className="w-full" size="sm">
                    View Demo
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Matter Management */}
          <Card className="hover:shadow-lg transition-shadow border-dashed border-gray-300">
            <CardHeader>
              <div className="flex items-center gap-2">
                <FileText className="w-6 h-6 text-gray-400" />
                <CardTitle className="text-gray-500">Matter Management</CardTitle>
              </div>
              <CardDescription className="text-gray-400">
                CRUD operations for legal matters
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Badge variant="secondary" className="text-xs">
                  Coming Soon
                </Badge>
                <ul className="text-sm text-gray-400 space-y-1">
                  <li>• Create & edit matters</li>
                  <li>• Document management</li>
                  <li>• Client relationships</li>
                  <li>• Time tracking</li>
                </ul>
                <Button disabled className="w-full" size="sm" variant="outline">
                  Under Development
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* User Management */}
          <Card className="hover:shadow-lg transition-shadow border-dashed border-gray-300">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Users className="w-6 h-6 text-gray-400" />
                <CardTitle className="text-gray-500">User Management</CardTitle>
              </div>
              <CardDescription className="text-gray-400">
                RBAC with lawyer, clerk, and client roles
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Badge variant="secondary" className="text-xs">
                  Coming Soon
                </Badge>
                <ul className="text-sm text-gray-400 space-y-1">
                  <li>• Role-based access</li>
                  <li>• User profiles</li>
                  <li>• Permission management</li>
                  <li>• 2FA authentication</li>
                </ul>
                <Button disabled className="w-full" size="sm" variant="outline">
                  Under Development
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Calendar & Scheduling */}
          <Card className="hover:shadow-lg transition-shadow border-dashed border-gray-300">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Calendar className="w-6 h-6 text-gray-400" />
                <CardTitle className="text-gray-500">Calendar & Scheduling</CardTitle>
              </div>
              <CardDescription className="text-gray-400">
                Court dates, deadlines, and appointments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Badge variant="secondary" className="text-xs">
                  Coming Soon
                </Badge>
                <ul className="text-sm text-gray-400 space-y-1">
                  <li>• Court date tracking</li>
                  <li>• Deadline reminders</li>
                  <li>• Client appointments</li>
                  <li>• SLA monitoring</li>
                </ul>
                <Button disabled className="w-full" size="sm" variant="outline">
                  Under Development
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Reporting & Analytics */}
          <Card className="hover:shadow-lg transition-shadow border-dashed border-gray-300">
            <CardHeader>
              <div className="flex items-center gap-2">
                <BarChart3 className="w-6 h-6 text-gray-400" />
                <CardTitle className="text-gray-500">Analytics</CardTitle>
              </div>
              <CardDescription className="text-gray-400">
                Matter metrics and performance insights
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Badge variant="secondary" className="text-xs">
                  Coming Soon
                </Badge>
                <ul className="text-sm text-gray-400 space-y-1">
                  <li>• Matter statistics</li>
                  <li>• Performance metrics</li>
                  <li>• Time in status</li>
                  <li>• Revenue tracking</li>
                </ul>
                <Button disabled className="w-full" size="sm" variant="outline">
                  Under Development
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Document Management */}
          <Card className="hover:shadow-lg transition-shadow border-dashed border-gray-300">
            <CardHeader>
              <div className="flex items-center gap-2">
                <FileText className="w-6 h-6 text-gray-400" />
                <CardTitle className="text-gray-500">Document Management</CardTitle>
              </div>
              <CardDescription className="text-gray-400">
                OCR, templates, and AI-powered generation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Badge variant="secondary" className="text-xs">
                  Coming Soon
                </Badge>
                <ul className="text-sm text-gray-400 space-y-1">
                  <li>• PDF OCR & search</li>
                  <li>• Template engine</li>
                  <li>• AI document generation</li>
                  <li>• Version control</li>
                </ul>
                <Button disabled className="w-full" size="sm" variant="outline">
                  Under Development
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Current Status */}
        <div className="text-center">
          <Card className="max-w-2xl mx-auto bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-blue-900">Development Status</CardTitle>
              <CardDescription className="text-blue-700">
                Current progress on the Aster Management system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-blue-900">Sprint S02 - Frontend Kanban Board</span>
                  <Badge className="bg-green-100 text-green-800">Completed</Badge>
                </div>
                
                <div className="text-sm text-blue-700 space-y-2">
                  <p>
                    ✅ TypeScript interfaces and type safety infrastructure
                  </p>
                  <p>
                    ✅ Kanban board components with drag & drop functionality
                  </p>
                  <p>
                    ✅ Interactive demo with sample legal matter data
                  </p>
                  <p>
                    ✅ Responsive design with shadcn/ui components
                  </p>
                </div>

                <div className="pt-4 border-t border-blue-200">
                  <p className="text-sm text-blue-600">
                    Built with: Next.js 15, TypeScript, Tailwind CSS, shadcn/ui, @dnd-kit, Zod
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
