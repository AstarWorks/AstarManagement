/**
 * Navigation Configuration
 * 
 * @description Defines the main navigation structure for the application
 * including menu items, permissions, and hierarchy.
 */

import type { NavItem } from '~/types/navigation'

export const navigationGroups = [
  {
    title: 'Main',
    items: [
      {
        id: 'dashboard',
        label: 'Dashboard',
        icon: 'Home',
        path: '/',
        exact: true
      }
    ]
  },
  {
    title: 'Case Management',
    items: [
      {
        id: 'matters',
        label: 'Matters',
        icon: 'Briefcase',
        children: [
          {
            id: 'matters-list',
            label: 'All Matters',
            path: '/matters',
            icon: 'List'
          },
          {
            id: 'matters-kanban',
            label: 'Kanban Board',
            path: '/matters/kanban',
            icon: 'Columns'
          },
          {
            id: 'matters-create',
            label: 'Create Matter',
            path: '/matters/create',
            icon: 'Plus',
            permissions: ['matter.create']
          }
        ]
      },
      {
        id: 'documents',
        label: 'Documents',
        icon: 'FileText',
        children: [
          {
            id: 'documents-list',
            label: 'All Documents',
            path: '/documents'
          },
          {
            id: 'documents-upload',
            label: 'Upload Document',
            path: '/documents/upload',
            permissions: ['document.create']
          }
        ]
      },
      {
        id: 'clients',
        label: 'Clients',
        icon: 'Users',
        path: '/clients'
      }
    ]
  },
  {
    title: 'Communications',
    items: [
      {
        id: 'communications',
        label: 'Communications',
        icon: 'MessageSquare',
        children: [
          {
            id: 'communications-memos',
            label: 'Client Memos',
            path: '/communications/memos',
            icon: 'MessageSquare'
          },
          {
            id: 'communications-notes',
            label: 'Internal Notes',
            path: '/communications/notes',
            icon: 'StickyNote'
          },
          {
            id: 'communications-emails',
            label: 'Emails',
            path: '/communications/emails',
            icon: 'Mail'
          },
          {
            id: 'communications-messages',
            label: 'Messages',
            path: '/communications/messages',
            icon: 'MessageCircle'
          },
          {
            id: 'communications-calls',
            label: 'Phone Calls',
            path: '/communications/calls',
            icon: 'Phone'
          },
          {
            id: 'communications-timeline',
            label: 'Timeline',
            path: '/communications/timeline',
            icon: 'Clock'
          }
        ]
      }
    ]
  },
  {
    title: 'Tools',
    items: [
      {
        id: 'calendar',
        label: 'Calendar',
        icon: 'Calendar',
        path: '/calendar',
        badge: {
          value: 3,
          variant: 'warning' as const
        }
      },
      {
        id: 'reports',
        label: 'Reports',
        icon: 'BarChart',
        path: '/reports',
        permissions: ['reports.view']
      }
    ]
  },
  {
    title: 'Administration',
    items: [
      {
        id: 'admin',
        label: 'Administration',
        icon: 'Settings',
        permissions: ['admin'],
        children: [
          {
            id: 'admin-users',
            label: 'Users',
            path: '/admin/users',
            icon: 'Users'
          },
          {
            id: 'admin-roles',
            label: 'Roles & Permissions',
            path: '/admin/roles',
            icon: 'Shield'
          },
          {
            id: 'admin-settings',
            label: 'Settings',
            path: '/admin/settings',
            icon: 'Cog'
          }
        ]
      }
    ]
  }
]

// Legacy flat structure for compatibility  
// @ts-ignore - Complex type inference issue, runtime works correctly
export const mainNavigation: NavItem[] = navigationGroups.flatMap(group => group.items)

export const mobileNavigation: NavItem[] = [
  {
    id: 'home',
    label: 'Home',
    icon: 'Home',
    path: '/'
  },
  {
    id: 'matters',
    label: 'Matters',
    icon: 'Briefcase',
    path: '/matters'
  },
  {
    id: 'documents',
    label: 'Documents',
    icon: 'FileText',
    path: '/documents'
  },
  {
    id: 'calendar',
    label: 'Calendar',
    icon: 'Calendar',
    path: '/calendar'
  },
  {
    id: 'more',
    label: 'More',
    icon: 'Menu',
    path: '/menu'
  }
]

export const userMenuItems: NavItem[] = [
  {
    id: 'profile',
    label: 'Profile',
    icon: 'User',
    path: '/profile'
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: 'Settings',
    path: '/settings'
  },
  {
    id: 'help',
    label: 'Help & Support',
    icon: 'HelpCircle',
    path: '/help'
  },
  {
    id: 'logout',
    label: 'Logout',
    icon: 'LogOut',
    path: '/logout'
  }
]