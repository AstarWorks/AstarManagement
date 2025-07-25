/**
 * 英語翻訳ファイル
 * English Language Messages
 */

import type { LocaleMessages } from '~/types/i18n'

export default {
  common: {
    confirm: 'Confirm',
    cancel: 'Cancel',
    save: 'Save',
    delete: 'Delete',
    edit: 'Edit',
    create: 'Create',
    update: 'Update',
    search: 'Search',
    filter: 'Filter',
    sort: 'Sort',
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    warning: 'Warning',
    info: 'Info',
    yes: 'Yes',
    no: 'No',
    close: 'Close',
    back: 'Back',
    next: 'Next',
    previous: 'Previous',
    submit: 'Submit',
    reset: 'Reset',
    clear: 'Clear',
    select: 'Select',
    selectAll: 'Select All',
    deselectAll: 'Deselect All',
    required: 'Required',
    optional: 'Optional',
    show: 'Show',
    hide: 'Hide',
    expand: 'Expand',
    collapse: 'Collapse',
    refresh: 'Refresh',
    export: 'Export',
    import: 'Import',
    download: 'Download',
    upload: 'Upload',
    print: 'Print',
    copy: 'Copy',
    cut: 'Cut',
    paste: 'Paste',
    undo: 'Undo',
    redo: 'Redo'
  },

  navigation: {
    dashboard: 'Dashboard',
    matters: 'Matter Management',
    clients: 'Client Management',
    documents: 'Document Management',
    finance: 'Finance Management',
    admin: 'System Administration',
    settings: 'Settings',
    profile: 'Profile',
    help: 'Help',
    logout: 'Logout',
    home: 'Home',
    breadcrumb: {
      separator: '/',
      home: 'Home'
    },
    sidebar: {
      toggle: 'Toggle sidebar',
      collapse: 'Collapse sidebar',
      expand: 'Expand sidebar',
      mainMenu: 'Main Menu',
      adminMenu: 'System Administration',
      recentPages: 'Recent Pages'
    },
    menu: {
      matters: {
        list: 'Matter List',
        create: 'New Matter',
        kanban: 'Kanban Board'
      },
      clients: {
        list: 'Client List',
        create: 'New Client'
      },
      documents: {
        list: 'Document List',
        create: 'Create Document',
        templates: 'Templates'
      },
      finance: {
        dashboard: 'Finance Dashboard',
        expenses: 'Expense Management',
        billing: 'Billing Management',
        reports: 'Reports'
      },
      admin: {
        users: 'User Management',
        roles: 'Role Management',
        audit: 'Audit Logs',
        system: 'System Settings'
      }
    }
  },

  auth: {
    login: {
      title: 'Login',
      subtitle: 'Sign in to your account',
      email: {
        label: 'Email Address',
        placeholder: 'example@example.com'
      },
      password: {
        label: 'Password',
        placeholder: 'Enter your password',
        show: 'Show password',
        hide: 'Hide password'
      },
      rememberMe: 'Remember me',
      forgotPassword: 'Forgot your password?',
      submit: 'Sign In',
      loading: 'Signing in...'
    },
    logout: {
      title: 'Logout',
      message: 'Are you sure you want to logout?',
      confirm: 'Logout',
      cancel: 'Cancel'
    },
    twoFactor: {
      title: 'Two-Factor Authentication',
      subtitle: 'Enter the code from your authenticator app',
      code: {
        label: 'Authentication Code',
        placeholder: 'Enter 6-digit code'
      },
      submit: 'Verify',
      resend: 'Resend Code',
      loading: 'Verifying...'
    },
    errors: {
      invalidCredentials: 'Invalid email or password',
      accountLocked: 'Account is locked',
      twoFactorRequired: 'Two-factor authentication required',
      twoFactorInvalid: 'Invalid authentication code',
      sessionExpired: 'Session has expired',
      networkError: 'Network error occurred',
      genericError: 'Login failed'
    }
  },

  dashboard: {
    title: 'Dashboard',
    subtitle: 'Overview and important information at a glance',
    stats: {
      activeMatter: 'Active Matters',
      totalClients: 'Total Clients',
      documentsThisMonth: 'Documents This Month',
      revenueThisMonth: 'Revenue This Month'
    },
    sections: {
      recentMatters: {
        title: 'Recent Matters',
        viewAll: 'View All Matters'
      },
      upcomingTasks: {
        title: 'Upcoming Tasks',
        viewAll: 'View All Tasks',
        dueDate: 'Due',
        status: {
          overdue: 'Overdue',
          tomorrow: 'Tomorrow',
          urgent: 'Urgent',
          normal: 'Normal'
        }
      },
      quickActions: {
        title: 'Quick Actions',
        newMatter: 'New Matter',
        newClient: 'New Client',
        createDocument: 'Create Document',
        addExpense: 'Add Expense'
      }
    },
    debug: {
      title: 'Debug Information',
      userInfo: 'User Information',
      permissions: 'Permissions',
      roles: 'Roles'
    }
  },

  matter: {
    title: 'Matter Management',
    list: {
      title: 'Matter List',
      empty: 'No matters found'
    },
    create: {
      title: 'Create New Matter',
      subtitle: 'Create a new legal matter'
    },
    edit: {
      title: 'Edit Matter',
      subtitle: 'Edit matter information'
    },
    status: {
      active: 'Active',
      completed: 'Completed',
      pending: 'Pending',
      cancelled: 'Cancelled'
    },
    priority: {
      high: 'High',
      medium: 'Medium',
      low: 'Low'
    },
    fields: {
      title: {
        label: 'Matter Title',
        placeholder: 'Enter matter title'
      },
      description: {
        label: 'Matter Description',
        placeholder: 'Enter matter description'
      },
      client: {
        label: 'Client',
        placeholder: 'Select a client'
      },
      status: {
        label: 'Status'
      },
      priority: {
        label: 'Priority'
      },
      dueDate: {
        label: 'Due Date'
      }
    }
  },

  client: {
    title: 'Client Management',
    list: {
      title: 'Client List',
      empty: 'No clients found'
    },
    create: {
      title: 'Register New Client',
      subtitle: 'Register a new client'
    },
    edit: {
      title: 'Edit Client',
      subtitle: 'Edit client information'
    },
    fields: {
      name: {
        label: 'Client Name',
        placeholder: 'Enter client name'
      },
      email: {
        label: 'Email Address',
        placeholder: 'example@example.com'
      },
      phone: {
        label: 'Phone Number',
        placeholder: '+1 (555) 123-4567'
      },
      address: {
        label: 'Address',
        placeholder: 'Enter address'
      }
    },
    type: {
      individual: 'Individual',
      corporate: 'Corporate'
    }
  },

  document: {
    title: 'Document Management',
    list: {
      title: 'Document List',
      empty: 'No documents found'
    },
    create: {
      title: 'Create Document',
      subtitle: 'Create a new document'
    },
    upload: {
      title: 'File Upload',
      dragDrop: 'Drag & drop files here, or click to select files',
      browse: 'Browse Files',
      maxSize: 'Maximum file size',
      supportedFormats: 'Supported formats'
    },
    fields: {
      title: {
        label: 'Document Title',
        placeholder: 'Enter document title'
      },
      description: {
        label: 'Document Description',
        placeholder: 'Enter document description'
      },
      category: {
        label: 'Category'
      },
      tags: {
        label: 'Tags',
        placeholder: 'Enter tags (comma separated)'
      }
    }
  },

  finance: {
    title: 'Finance Management',
    dashboard: {
      title: 'Finance Dashboard',
      subtitle: 'Revenue and expense management'
    },
    expenses: {
      title: 'Expense Management',
      create: 'Add Expense',
      list: 'Expense List'
    },
    billing: {
      title: 'Billing Management',
      create: 'Create Invoice',
      list: 'Invoice List'
    },
    reports: {
      title: 'Reports',
      generate: 'Generate Report'
    }
  },

  admin: {
    title: 'System Administration',
    users: {
      title: 'User Management',
      create: 'Create User',
      list: 'User List'
    },
    roles: {
      title: 'Role Management',
      create: 'Create Role',
      list: 'Role List'
    },
    audit: {
      title: 'Audit Logs',
      search: 'Search Logs'
    },
    system: {
      title: 'System Settings',
      settings: 'Settings'
    }
  },

  error: {
    validation: {
      required: 'This field is required',
      email: 'Please enter a valid email address',
      minLength: 'Must be at least {min} characters',
      maxLength: 'Must be no more than {max} characters',
      numeric: 'Please enter a numeric value',
      alphaNumeric: 'Please enter alphanumeric characters only'
    },
    network: {
      offline: 'You are offline',
      timeout: 'Request timed out',
      serverError: 'Server error occurred',
      notFound: 'Page not found',
      unauthorized: 'Authentication required',
      forbidden: 'Access denied'
    },
    generic: {
      somethingWentWrong: 'Something went wrong',
      tryAgain: 'Please try again',
      contactSupport: 'Please contact support'
    }
  },

  notification: {
    title: 'Notifications',
    empty: 'No new notifications',
    viewAll: 'View All Notifications',
    types: {
      matter: 'Matter',
      document: 'Document',
      client: 'Client',
      finance: 'Finance',
      system: 'System'
    },
    priority: {
      high: 'High',
      medium: 'Normal',
      low: 'Low'
    },
    time: {
      now: 'Just now',
      minutesAgo: '{minutes} minutes ago',
      hoursAgo: '{hours} hours ago',
      daysAgo: '{days} days ago'
    }
  },

  access: {
    denied: {
      title: 'Access Denied',
      subtitle: 'You do not have permission to access this page',
      reasons: {
        insufficientPermissions: 'Insufficient permissions',
        insufficientRole: 'Insufficient role',
        insufficientRolesAll: 'All required roles not met',
        alreadyAuthenticated: 'Already authenticated',
        unauthenticated: 'Authentication required',
        sessionExpired: 'Session expired',
        twoFactorRequired: 'Two-factor authentication required',
        accountDisabled: 'Account disabled',
        maintenanceMode: 'System under maintenance'
      }
    },
    actions: {
      goBack: 'Go Back',
      goToDashboard: 'Go to Dashboard',
      goToLogin: 'Go to Login',
      contactAdmin: 'Please contact system administrator'
    },
    details: {
      reason: 'Reason',
      requiredPermissions: 'Required Permissions',
      requiredRoles: 'Required Roles',
      currentUser: 'Current User',
      path: 'Requested Path'
    }
  }
} as const satisfies LocaleMessages