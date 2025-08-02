/**
 * Business domain translations - English
 * ビジネスドメイン翻訳ファイル - 英語
 */

export default {
  cases: {
    status: {
      new: 'New',
      accepted: 'Accepted',
      investigation: 'Investigation',
      preparation: 'Preparation',
      negotiation: 'Negotiation',
      trial: 'Trial',
      completed: 'Completed'
    },
    data: {
      loadSuccess: 'Successfully loaded case data ({count} cases)',
      loadError: 'Failed to load case data',
      statusUpdateSuccess: 'Moved case {caseId} from {oldStatus} to {newStatus}',
      statusUpdateError: 'Failed to update case status',
      createSuccess: 'Created case "{title}"',
      createError: 'Failed to create case',
      deleteSuccess: 'Deleted case "{title}"',
      deleteError: 'Failed to delete case'
    },
    dragDrop: {
      dragStarted: 'Started dragging case {caseId} ({status})',
      dragEnded: 'Ended dragging',
      invalidTransition: 'Move from {from} to {to} is not allowed',
      sameColumn: 'Move within same column was skipped',
      transitionNotAllowed: 'Move from {from} to {to} is not allowed',
      moveSuccess: 'Moved case {caseId} from {from} to {to}',
      moveError: 'Failed to move case'
    },
    card: {
      progress: 'Progress',
      dueDate: {
        notSet: 'No due date',
        overdue: '{days} days overdue',
        today: 'Due today',
        tomorrow: 'Due tomorrow',
        daysLeft: '{days} days left'
      }
    },
    detail: {
      basicInfo: {
        title: 'Basic Information',
        client: 'Client',
        assignedLawyer: 'Assigned Lawyer',
        dueDate: 'Due Date',
        tags: 'Tags'
      },
      info: {
        caseNumber: 'Case Number'
      },
      progress: {
        title: 'Progress',
        currentStatus: 'Current Status',
        createdAt: 'Created',
        updatedAt: 'Last Updated',
        actions: {
          changeStatus: 'Change Status',
          edit: 'Edit Case'
        }
      },
      description: {
        title: 'Case Details',
        subtitle: 'Detailed description and special notes for this case.',
        noDescription: 'No detailed description has been added yet.'
      }
    }
  },
  dashboard: {
    title: 'Dashboard',
    subtitle: 'Overview and important information',
    stats: {
      activeMatter: 'Active Cases',
      totalClients: 'Total Clients',
      documentsThisMonth: 'Documents This Month',
      revenueThisMonth: 'Revenue This Month'
    },
    sections: {
      recentMatters: {
        title: 'Recent Cases',
        viewAll: 'View All Cases'
      },
      upcomingTasks: {
        title: 'Upcoming Tasks',
        viewAll: 'View All Tasks',
        dueDate: 'Due Date',
        status: {
          overdue: 'Overdue',
          tomorrow: 'Tomorrow',
          urgent: 'Urgent',
          normal: 'Normal'
        }
      },
      quickActions: {
        title: 'Quick Actions',
        newMatter: 'New Case',
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
    title: 'Case Management',
    list: {
      title: 'Case List',
      empty: 'No cases found'
    },
    kanban: {
      title: 'Case Management Kanban Board',
      subtitle: 'Visualize case progress and manage efficiently',
      actions: {
        filter: 'Filter',
        newCase: 'New Case',
        addCase: 'Add Case',
        columnSettings: 'Column Settings'
      },
      columns: {
        new: {
          title: 'New',
          description: 'Case Intake',
          empty: 'No new cases'
        },
        accepted: {
          title: 'Accepted',
          description: 'Formally Accepted',
          empty: 'No accepted cases'
        },
        investigation: {
          title: 'Investigation',
          description: 'Evidence Collection',
          empty: 'No cases under investigation'
        },
        preparation: {
          title: 'Preparation',
          description: 'Case Preparation',
          empty: 'No cases in preparation'
        },
        negotiation: {
          title: 'Negotiation',
          description: 'Settlement Negotiation',
          empty: 'No cases in negotiation'
        },
        trial: {
          title: 'Trial',
          description: 'Court Proceedings',
          empty: 'No cases in trial'
        },
        completed: {
          title: 'Completed',
          description: 'Case Closed',
          empty: 'No completed cases'
        }
      },
      dragDrop: {
        dropHere: 'Drop here to move to "{status}"'
      }
    },
    filters: {
      title: 'Filters',
      search: {
        label: 'Search',
        placeholder: 'Search by case name, number, or client...'
      },
      clientType: {
        label: 'Client Type',
        options: {
          all: 'All',
          individual: 'Individual',
          corporate: 'Corporate'
        }
      },
      priority: {
        label: 'Priority',
        options: {
          all: 'All',
          high: 'High',
          medium: 'Medium',
          low: 'Low'
        }
      },
      assignedLawyer: {
        label: 'Assigned Lawyer',
        options: {
          all: 'All'
        }
      },
      dateRange: {
        label: 'Due Date',
        options: {
          all: 'All Dates',
          overdue: 'Overdue',
          today: 'Due Today',
          thisWeek: 'Due This Week',
          thisMonth: 'Due This Month'
        },
        custom: {
          label: 'Custom Range',
          startDate: 'Start Date',
          endDate: 'End Date'
        }
      },
      tags: {
        label: 'Tags'
      },
      sort: {
        label: 'Sort',
        by: {
          dueDate: 'Due Date',
          priority: 'Priority',
          createdAt: 'Created Date',
          updatedAt: 'Updated Date',
          title: 'Case Name'
        },
        order: {
          asc: 'Ascending',
          desc: 'Descending'
        }
      },
      actions: {
        clear: 'Clear',
        advanced: 'Advanced',
        apply: 'Apply'
      },
      activeFilters: {
        search: 'Search: {query}',
        clientType: 'Type: {type}',
        priority: 'Priority: {priority}'
      }
    },
    create: {
      title: 'Create New Case',
      subtitle: 'Create a new case'
    },
    edit: {
      title: 'Edit Case',
      subtitle: 'Edit case information'
    },
    detail: {
      tabs: {
        overview: 'Overview',
        timeline: 'Timeline',
        documents: 'Documents',
        communications: 'Communications',
        billing: 'Billing'
      },
      basicInfo: {
        title: 'Basic Information',
        client: 'Client',
        assignedLawyer: 'Assigned Lawyer',
        dueDate: 'Due Date',
        tags: 'Tags'
      },
      progress: {
        title: 'Progress',
        currentStatus: 'Current Status',
        createdAt: 'Created',
        updatedAt: 'Last Updated',
        actions: {
          changeStatus: 'Change Status',
          edit: 'Edit Case'
        }
      },
      description: {
        title: 'Case Details',
        subtitle: 'Detailed description and special notes for this case.',
        noDescription: 'No detailed description has been added yet.'
      },
      actions: {
        changeStatus: 'Change Status',
        edit: 'Edit Case',
        close: 'Close'
      },
      placeholders: {
        timeline: 'Timeline feature is under development',
        documents: 'Document management feature is under development',
        communications: 'Communication history feature is under development',
        billing: 'Billing management feature is under development'
      },
      sections: {
        timelineTitle: 'Case Timeline',
        timelineDesc: 'Display important events and change history for this case in chronological order.',
        documentsTitle: 'Related Documents',
        documentsDesc: 'Manage documents and files related to this case.',
        communicationsTitle: 'Communication History',
        communicationsDesc: 'Manage communication records with clients and related parties.',
        billingTitle: 'Billing & Time Management',
        billingDesc: 'Manage billing information and work hours for this case.'
      }
    },
    status: {
      new: 'New',
      accepted: 'Accepted',
      investigation: 'Investigation',
      preparation: 'Preparation',
      negotiation: 'Negotiation',
      trial: 'Trial',
      completed: 'Completed',
      active: 'Active',
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
        label: 'Case Name',
        placeholder: 'Enter case name'
      },
      description: {
        label: 'Case Description',
        placeholder: 'Enter case description'
      },
      client: {
        label: 'Client',
        placeholder: 'Select client'
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
      title: 'New Client Registration',
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
        placeholder: '090-1234-5678'
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
      dragDrop: 'Drag & drop files here or click to select',
      browse: 'Select Files',
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
    title: 'Financial Management',
    dashboard: {
      title: 'Financial Dashboard',
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

  settings: {
    title: 'Settings',
    subtitle: 'Manage system and personal settings',
    sections: {
      profile: 'Profile Settings',
      preferences: 'Preferences',
      security: 'Security Settings',
      notifications: 'Notification Settings'
    }
  },

  admin: {
    title: 'System Administration',
    dashboard: {
      title: 'Admin Dashboard',
      subtitle: 'System management and monitoring'
    },
    users: {
      title: 'User Management',
      create: 'Create User',
      list: 'User List'
    },
    settings: {
      title: 'System Settings',
      subtitle: 'Manage system-wide settings'
    },
    roles: {
      title: 'Role Management',
      create: 'Create Role',
      list: 'Role List'
    },
    audit: {
      title: 'Audit Log',
      search: 'Search Logs'
    },
    system: {
      title: 'System Settings',
      settings: 'Settings'
    }
  },

  notification: {
    title: 'Notifications',
    empty: 'No new notifications',
    viewAll: 'View All Notifications',
    types: {
      matter: 'Case',
      document: 'Document',
      client: 'Client',
      finance: 'Finance',
      system: 'System'
    },
    priority: {
      high: 'High',
      medium: 'Medium',
      low: 'Low'
    },
    time: {
      now: 'Just now',
      minutesAgo: '{minutes} minutes ago',
      hoursAgo: '{hours} hours ago',
      daysAgo: '{days} days ago'
    }
  }
} as const