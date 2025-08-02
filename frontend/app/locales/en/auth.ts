/**
 * Authentication translations - English
 * 認証翻訳ファイル - 英語
 */

export default {
  auth: {
    login: {
      title: 'Login',
      subtitle: 'Sign in to your account',
      appTitle: 'Astar Management',
      appSubtitle: 'Legal Office Management System',
      email: {
        label: 'Email Address',
        placeholder: 'Enter your email address'
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
      loading: 'Signing in...',
      debug: {
        title: 'Development Debug Features',
        demoLogin: 'Demo Login',
        twoFactorUser: '2FA Enabled User'
      }
    },
    password: {
      show: 'Show password',
      hide: 'Hide password'
    },
    debug: {
      environmentLabel: 'Development',
      description: 'Auto-fill development credentials',
      demoUser: 'Demo User',
      twoFactorUser: '2FA User',
      adminUser: 'Administrator',
      advancedOptions: 'Advanced Options',
      environment: 'Environment',
      apiEndpoint: 'API Endpoint',
      buildTime: 'Build Time'
    },
    header: {
      title: 'Sign in to your account',
      subtitle: 'Enter your email and password'
    },
    footer: {
      copyright: '© 2024 Astar Management. All rights reserved.',
      privacy: 'Privacy Policy',
      terms: 'Terms of Service'
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
      resend: 'Resend code',
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
    },
    lastLogin: {
      never: 'Never logged in',
      minutesAgo: '{minutes} minutes ago',
      hoursAgo: '{hours} hours ago',
      daysAgo: '{days} days ago'
    },
    status: {
      online: 'Online',
      offline: 'Offline'
    },
    roles: {
      LAWYER: 'Lawyer',
      CLERK: 'Clerk',
      CLIENT: 'Client',
      ADMIN: 'Administrator',
      unknown: 'Unknown',
      guest: 'Guest'
    },
    validation: {
      email: {
        required: 'Email address is required',
        invalid: 'Please enter a valid email address'
      },
      password: {
        required: 'Password is required',
        minLength: 'Password must be at least {min} characters',
        pattern: 'Password must contain lowercase, uppercase, and numeric characters'
      },
      twoFactor: {
        required: 'Two-factor authentication secret is required',
        codeRequired: 'Authentication code must be 6 digits',
        codeInvalid: 'Authentication code must be numeric only'
      },
      passwordReset: {
        tokenRequired: 'Reset token is required',
        confirmRequired: 'Password confirmation is required',
        mismatch: 'Passwords do not match'
      }
    }
  },

  access: {
    denied: {
      title: 'Access Denied',
      subtitle: 'You do not have permission to access this page',
      reasons: {
        insufficientPermissions: 'Insufficient permissions',
        insufficientRole: 'Insufficient role',
        insufficientRolesAll: 'Missing required roles',
        alreadyAuthenticated: 'Already authenticated',
        unauthenticated: 'Authentication required',
        sessionExpired: 'Session expired',
        twoFactorRequired: 'Two-factor authentication required',
        accountDisabled: 'Account disabled',
        maintenanceMode: 'Maintenance mode'
      }
    },
    actions: {
      goBack: 'Go back',
      goToDashboard: 'Go to dashboard',
      goToLogin: 'Go to login',
      contactAdmin: 'Contact system administrator'
    },
    details: {
      reason: 'Reason',
      requiredPermissions: 'Required permissions',
      requiredRoles: 'Required roles',
      currentUser: 'Current user',
      path: 'Access path'
    }
  }
} as const