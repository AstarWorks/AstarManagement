/**
 * Common translations - English
 * 共通翻訳ファイル - 英語
 */

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
    info: 'Information',
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
    user: 'User',
    guest: 'Guest',
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
    redo: 'Redo',
    dateNotSet: 'Not Set'
  },

  error: {
    validation: {
      required: 'This field is required',
      email: 'Please enter a valid email address',
      minLength: 'Must be at least {min} characters',
      maxLength: 'Must be {max} characters or less',
      numeric: 'Please enter a numeric value',
      alphaNumeric: 'Please enter alphanumeric characters only'
    },
    network: {
      offline: 'You are offline',
      timeout: 'Connection timed out',
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

  language: {
    switcher: {
      ariaLabel: 'Switch language',
      toggleLabel: 'Open language selection menu',
      title: 'Language / 言語',
      currentLanguage: 'Current language: {language}'
    }
  },

  header: {
    search: {
      placeholder: 'Search cases, clients, documents...',
      label: 'Global search'
    },
    notifications: {
      label: 'Notifications',
      count: 'You have {count} notifications'
    },
    sidebar: {
      toggle: 'Toggle sidebar',
      openMobileMenu: 'Open mobile menu'
    }
  },

  footer: {
    copyright: '© 2025 Astar Management. All rights reserved.'
  }
} as const