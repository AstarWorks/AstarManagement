/**
 * i18n Type Definitions
 * TypeScript型定義で型安全な国際化を実現
 */

// 共通UI要素
export interface ICommonMessages {
  confirm: string
  cancel: string
  save: string
  delete: string
  edit: string
  create: string
  update: string
  search: string
  filter: string
  sort: string
  loading: string
  error: string
  success: string
  warning: string
  info: string
  yes: string
  no: string
  close: string
  back: string
  next: string
  previous: string
  submit: string
  reset: string
  clear: string
  select: string
  selectAll: string
  deselectAll: string
  required: string
  optional: string
  show: string
  hide: string
  expand: string
  collapse: string
  refresh: string
  export: string
  import: string
  download: string
  upload: string
  print: string
  copy: string
  cut: string
  paste: string
  undo: string
  redo: string
}

// ナビゲーション
export interface INavigationMessages {
  dashboard: string
  matters: string
  clients: string
  documents: string
  finance: string
  admin: string
  settings: string
  profile: string
  help: string
  logout: string
  home: string
  calendar: string
  feedback: string
  language: {
    switch: string
  }
  breadcrumb: {
    separator: string
    home: string
  }
  sidebar: {
    toggle: string
    collapse: string
    expand: string
    mainMenu: string
    adminMenu: string
    recentPages: string
  }
  menu: {
    user: string
    matters: {
      list: string
      create: string
      kanban: string
    }
    clients: {
      list: string
      create: string
    }
    documents: {
      list: string
      create: string
      templates: string
    }
    finance: {
      dashboard: string
      expenses: string
      billing: string
      reports: string
    }
    admin: {
      users: string
      roles: string
      audit: string
      system: string
    }
  }
}

// 認証関連
export interface IAuthMessages {
  login: {
    title: string
    subtitle: string
    appTitle: string
    appSubtitle: string
    email: {
      label: string
      placeholder: string
    }
    password: {
      label: string
      placeholder: string
      show: string
      hide: string
    }
    rememberMe: string
    forgotPassword: string
    submit: string
    loading: string
    debug: {
      title: string
      demoLogin: string
      twoFactorUser: string
    }
  }
  logout: {
    title: string
    message: string
    confirm: string
    cancel: string
  }
  twoFactor: {
    title: string
    subtitle: string
    code: {
      label: string
      placeholder: string
    }
    submit: string
    resend: string
    loading: string
  }
  errors: {
    invalidCredentials: string
    accountLocked: string
    twoFactorRequired: string
    twoFactorInvalid: string
    sessionExpired: string
    networkError: string
    genericError: string
  }
  lastLogin: {
    never: string
    minutesAgo: string
    hoursAgo: string
    daysAgo: string
  }
  status: {
    online: string
    offline: string
  }
}

// ダッシュボード
export interface IDashboardMessages {
  title: string
  subtitle: string
  stats: {
    activeMatter: string
    totalClients: string
    documentsThisMonth: string
    revenueThisMonth: string
  }
  sections: {
    recentMatters: {
      title: string
      viewAll: string
    }
    upcomingTasks: {
      title: string
      viewAll: string
      dueDate: string
      status: {
        overdue: string
        tomorrow: string
        urgent: string
        normal: string
      }
    }
    quickActions: {
      title: string
      newMatter: string
      newClient: string
      createDocument: string
      addExpense: string
    }
  }
  debug: {
    title: string
    userInfo: string
    permissions: string
    roles: string
  }
}

// 案件管理
export interface IMatterMessages {
  title: string
  list: {
    title: string
    empty: string
  }
  create: {
    title: string
    subtitle: string
  }
  edit: {
    title: string
    subtitle: string
  }
  status: {
    active: string
    completed: string
    pending: string
    cancelled: string
  }
  priority: {
    high: string
    medium: string
    low: string
  }
  fields: {
    title: {
      label: string
      placeholder: string
    }
    description: {
      label: string
      placeholder: string
    }
    client: {
      label: string
      placeholder: string
    }
    status: {
      label: string
    }
    priority: {
      label: string
    }
    dueDate: {
      label: string
    }
  }
}

// 顧客管理
export interface IClientMessages {
  title: string
  list: {
    title: string
    empty: string
  }
  create: {
    title: string
    subtitle: string
  }
  edit: {
    title: string
    subtitle: string
  }
  fields: {
    name: {
      label: string
      placeholder: string
    }
    email: {
      label: string
      placeholder: string
    }
    phone: {
      label: string
      placeholder: string
    }
    address: {
      label: string
      placeholder: string
    }
  }
  type: {
    individual: string
    corporate: string
  }
}

// 文書管理
export interface IDocumentMessages {
  title: string
  list: {
    title: string
    empty: string
  }
  create: {
    title: string
    subtitle: string
  }
  upload: {
    title: string
    dragDrop: string
    browse: string
    maxSize: string
    supportedFormats: string
  }
  fields: {
    title: {
      label: string
      placeholder: string
    }
    description: {
      label: string
      placeholder: string
    }
    category: {
      label: string
    }
    tags: {
      label: string
      placeholder: string
    }
  }
}

// 財務管理
export interface IFinanceMessages {
  title: string
  dashboard: {
    title: string
    subtitle: string
  }
  expenses: {
    title: string
    create: string
    list: string
  }
  billing: {
    title: string
    create: string
    list: string
  }
  reports: {
    title: string
    generate: string
  }
}

// システム管理
export interface IAdminMessages {
  title: string
  users: {
    title: string
    create: string
    list: string
  }
  roles: {
    title: string
    create: string
    list: string
  }
  audit: {
    title: string
    search: string
  }
  system: {
    title: string
    settings: string
  }
}

// エラーメッセージ
export interface IErrorMessages {
  validation: {
    required: string
    email: string
    minLength: string
    maxLength: string
    numeric: string
    alphaNumeric: string
  }
  network: {
    offline: string
    timeout: string
    serverError: string
    notFound: string
    unauthorized: string
    forbidden: string
  }
  generic: {
    somethingWentWrong: string
    tryAgain: string
    contactSupport: string
  }
}

// 通知メッセージ
export interface INotificationMessages {
  title: string
  empty: string
  viewAll: string
  types: {
    matter: string
    document: string
    client: string
    finance: string
    system: string
  }
  priority: {
    high: string
    medium: string
    low: string
  }
  time: {
    now: string
    minutesAgo: string
    hoursAgo: string
    daysAgo: string
  }
}

// アクセス制御
export interface IAccessMessages {
  denied: {
    title: string
    subtitle: string
    reasons: {
      insufficientPermissions: string
      insufficientRole: string
      insufficientRolesAll: string
      alreadyAuthenticated: string
      unauthenticated: string
      sessionExpired: string
      twoFactorRequired: string
      accountDisabled: string
      maintenanceMode: string
    }
  }
  actions: {
    goBack: string
    goToDashboard: string
    goToLogin: string
    contactAdmin: string
  }
  details: {
    reason: string
    requiredPermissions: string
    requiredRoles: string
    currentUser: string
    path: string
  }
}

// メインメッセージ型
export interface IMessages {
  common: ICommonMessages
  navigation: INavigationMessages
  auth: IAuthMessages
  dashboard: IDashboardMessages
  matter: IMatterMessages
  client: IClientMessages
  document: IDocumentMessages
  finance: IFinanceMessages
  admin: IAdminMessages
  error: IErrorMessages
  notification: INotificationMessages
  access: IAccessMessages
}

// フッター
export interface IFooterMessages {
  copyright: string
}

// メインメッセージ型を更新
export interface LocaleMessages {
  common: ICommonMessages
  navigation: INavigationMessages
  auth: IAuthMessages
  dashboard: IDashboardMessages
  matter: IMatterMessages
  client: IClientMessages
  document: IDocumentMessages
  finance: IFinanceMessages
  admin: IAdminMessages
  error: IErrorMessages
  notification: INotificationMessages
  access: IAccessMessages
  footer: IFooterMessages
}

// 後方互換性のためのエイリアス
export interface ILocaleMessages extends LocaleMessages {
  // 各言語で固有の項目があれば追加
}