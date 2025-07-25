# T05_S02 - LoginForm Storybook Stories

## Task Overview
**Duration**: 3 hours  
**Priority**: Medium  
**Dependencies**: T02_S02_Error_Handling_Enhancement  
**Sprint**: S02_M001_INTEGRATION  

## Objective
Create comprehensive Storybook stories for the LoginForm component to document different states, error conditions, and user interactions in an isolated environment.

## Background
The LoginForm component handles critical authentication flows including:
- Standard email/password login
- 2FA verification
- Password reset flows
- Various error states
- Loading states

Storybook stories will provide:
- Visual documentation of all states
- Interactive testing environment
- Component isolation for development
- Accessibility testing support

## Technical Requirements

### 1. Main LoginForm Stories
Create comprehensive stories covering all component states:

```typescript
// components/auth/__stories__/LoginForm.stories.ts
import type { Meta, StoryObj } from '@storybook/vue3'
import { action } from '@storybook/addon-actions'
import { userEvent, within, expect } from '@storybook/testing-library'
import LoginForm from '../LoginForm.vue'

const meta: Meta<typeof LoginForm> = {
  title: 'Auth/LoginForm',
  component: LoginForm,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
# LoginForm Component

The LoginForm component handles user authentication with support for:
- Email/password login
- 2FA verification flow  
- Password reset functionality
- Comprehensive error handling
- Loading states and user feedback

## Usage

\`\`\`vue
<LoginForm 
  @login="handleLogin"
  @forgot-password="handleForgotPassword"
  :loading="isLoading"
  :error="errorMessage"
/>
\`\`\`
        `
      }
    }
  },
  argTypes: {
    loading: {
      control: 'boolean',
      description: 'Show loading state during authentication'
    },
    error: {
      control: 'text',
      description: 'Display error message to user'
    },
    showRememberMe: {
      control: 'boolean',
      description: 'Show remember me checkbox'
    },
    showForgotPassword: {
      control: 'boolean',
      description: 'Show forgot password link'
    },
    onLogin: {
      action: 'login',
      description: 'Fired when user submits login form'
    },
    onForgotPassword: {
      action: 'forgot-password',
      description: 'Fired when user clicks forgot password'
    }
  },
  args: {
    loading: false,
    error: '',
    showRememberMe: true,
    showForgotPassword: true,
    onLogin: action('login'),
    onForgotPassword: action('forgot-password')
  }
}

export default meta
type Story = StoryObj<typeof meta>

// Default state
export const Default: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: 'Default login form with all features enabled'
      }
    }
  }
}

// Loading state
export const Loading: Story = {
  args: {
    loading: true
  },
  parameters: {
    docs: {
      description: {
        story: 'Form in loading state during authentication request'
      }
    }
  }
}

// With error message
export const WithError: Story = {
  args: {
    error: 'メールアドレスまたはパスワードが正しくありません'
  },
  parameters: {
    docs: {
      description: {
        story: 'Form displaying authentication error message'
      }
    }
  }
}

// Validation errors
export const ValidationErrors: Story = {
  args: {},
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    
    // Try to submit empty form
    const submitButton = canvas.getByRole('button', { name: /ログイン/i })
    await userEvent.click(submitButton)
    
    // Expect validation errors to appear
    await expect(canvas.getByText('メールアドレスを入力してください')).toBeInTheDocument()
    await expect(canvas.getByText('パスワードを入力してください')).toBeInTheDocument()
  },
  parameters: {
    docs: {
      description: {
        story: 'Form validation errors when submitting empty fields'
      }
    }
  }
}

// Email validation error
export const EmailValidationError: Story = {
  args: {},
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    
    const emailInput = canvas.getByLabelText('メールアドレス')
    const passwordInput = canvas.getByLabelText('パスワード')
    const submitButton = canvas.getByRole('button', { name: /ログイン/i })
    
    // Enter invalid email
    await userEvent.type(emailInput, 'invalid-email')
    await userEvent.type(passwordInput, 'password123')
    await userEvent.click(submitButton)
    
    // Expect email validation error
    await expect(canvas.getByText('有効なメールアドレスを入力してください')).toBeInTheDocument()
  },
  parameters: {
    docs: {
      description: {
        story: 'Email format validation error'
      }
    }
  }
}

// Password validation error
export const PasswordValidationError: Story = {
  args: {},
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    
    const emailInput = canvas.getByLabelText('メールアドレス')
    const passwordInput = canvas.getByLabelText('パスワード')
    const submitButton = canvas.getByRole('button', { name: /ログイン/i })
    
    // Enter short password
    await userEvent.type(emailInput, 'user@example.com')
    await userEvent.type(passwordInput, '123')
    await userEvent.click(submitButton)
    
    // Expect password validation error
    await expect(canvas.getByText('パスワードは8文字以上で入力してください')).toBeInTheDocument()
  },
  parameters: {
    docs: {
      description: {
        story: 'Password length validation error'
      }
    }
  }
}

// Successful login flow
export const SuccessfulLogin: Story = {
  args: {},
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    
    const emailInput = canvas.getByLabelText('メールアドレス')
    const passwordInput = canvas.getByLabelText('パスワード')
    const rememberMeCheckbox = canvas.getByLabelText('ログイン状態を保持する')
    const submitButton = canvas.getByRole('button', { name: /ログイン/i })
    
    // Fill valid credentials
    await userEvent.type(emailInput, 'lawyer@example.com')
    await userEvent.type(passwordInput, 'password123')
    await userEvent.click(rememberMeCheckbox)
    await userEvent.click(submitButton)
  },
  parameters: {
    docs: {
      description: {
        story: 'User interaction flow for successful login'
      }
    }
  }
}

// Without remember me
export const WithoutRememberMe: Story = {
  args: {
    showRememberMe: false
  },
  parameters: {
    docs: {
      description: {
        story: 'Login form without remember me checkbox'
      }
    }
  }
}

// Without forgot password
export const WithoutForgotPassword: Story = {
  args: {
    showForgotPassword: false
  },
  parameters: {
    docs: {
      description: {
        story: 'Login form without forgot password link'
      }
    }
  }
}

// Minimal form
export const Minimal: Story = {
  args: {
    showRememberMe: false,
    showForgotPassword: false
  },
  parameters: {
    docs: {
      description: {
        story: 'Minimal login form with only essential fields'
      }
    }
  }
}

// Different error types
export const InvalidCredentials: Story = {
  args: {
    error: 'メールアドレスまたはパスワードが正しくありません'
  }
}

export const AccountSuspended: Story = {
  args: {
    error: 'アカウントが停止されています。管理者にお問い合わせください'
  }
}

export const TooManyAttempts: Story = {
  args: {
    error: 'ログイン試行回数が多すぎます。しばらく時間をおいてお試しください'
  }
}

export const NetworkError: Story = {
  args: {
    error: 'ネットワークエラーが発生しました。接続を確認してください'
  }
}
```

### 2. 2FA Component Stories
Create stories for the 2FA verification component:

```typescript
// components/auth/__stories__/TwoFactorForm.stories.ts
import type { Meta, StoryObj } from '@storybook/vue3'
import { action } from '@storybook/addon-actions'
import { userEvent, within, expect } from '@storybook/testing-library'
import TwoFactorForm from '../TwoFactorForm.vue'

const meta: Meta<typeof TwoFactorForm> = {
  title: 'Auth/TwoFactorForm',
  component: TwoFactorForm,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
# TwoFactorForm Component

Handles 2FA token verification after initial login.
        `
      }
    }
  },
  argTypes: {
    loading: {
      control: 'boolean'
    },
    error: {
      control: 'text'
    },
    challenge: {
      control: 'text'
    },
    onVerify: {
      action: 'verify'
    },
    onBack: {
      action: 'back'
    }
  },
  args: {
    loading: false,
    error: '',
    challenge: 'mock-challenge-token',
    onVerify: action('verify'),
    onBack: action('back')
  }
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {}
}

export const Loading: Story = {
  args: {
    loading: true
  }
}

export const WithError: Story = {
  args: {
    error: '認証コードが正しくありません'
  }
}

export const TokenInput: Story = {
  args: {},
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    
    const tokenInput = canvas.getByLabelText('認証コード')
    await userEvent.type(tokenInput, '123456')
    
    const submitButton = canvas.getByRole('button', { name: /確認/i })
    await userEvent.click(submitButton)
  }
}
```

### 3. Password Reset Stories
Create stories for password reset flow:

```typescript
// components/auth/__stories__/PasswordResetForm.stories.ts
import type { Meta, StoryObj } from '@storybook/vue3'
import { action } from '@storybook/addon-actions'
import PasswordResetForm from '../PasswordResetForm.vue'

const meta: Meta<typeof PasswordResetForm> = {
  title: 'Auth/PasswordResetForm',
  component: PasswordResetForm,
  parameters: {
    layout: 'centered'
  },
  argTypes: {
    loading: {
      control: 'boolean'
    },
    success: {
      control: 'boolean'
    },
    error: {
      control: 'text'
    },
    onSubmit: {
      action: 'submit'
    },
    onBack: {
      action: 'back'
    }
  },
  args: {
    loading: false,
    success: false,
    error: '',
    onSubmit: action('submit'),
    onBack: action('back')
  }
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {}
}

export const Loading: Story = {
  args: {
    loading: true
  }
}

export const Success: Story = {
  args: {
    success: true
  }
}

export const WithError: Story = {
  args: {
    error: 'メールアドレスが見つかりません'
  }
}
```

### 4. Authentication Layout Stories
Create stories for the overall auth layout:

```typescript
// layouts/__stories__/AuthLayout.stories.ts
import type { Meta, StoryObj } from '@storybook/vue3'
import AuthLayout from '../auth.vue'
import LoginForm from '~/components/auth/LoginForm.vue'

const meta: Meta<typeof AuthLayout> = {
  title: 'Layouts/AuthLayout',
  component: AuthLayout,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Authentication layout with background and branding'
      }
    }
  }
}

export default meta
type Story = StoryObj<typeof meta>

export const WithLoginForm: Story = {
  render: () => ({
    components: { AuthLayout, LoginForm },
    template: `
      <AuthLayout>
        <LoginForm />
      </AuthLayout>
    `
  })
}

export const Mobile: Story = {
  render: () => ({
    components: { AuthLayout, LoginForm },
    template: `
      <AuthLayout>
        <LoginForm />
      </AuthLayout>
    `
  }),
  parameters: {
    viewport: {
      defaultViewport: 'mobile1'
    }
  }
}

export const Tablet: Story = {
  render: () => ({
    components: { AuthLayout, LoginForm },
    template: `
      <AuthLayout>
        <LoginForm />
      </AuthLayout>
    `
  }),
  parameters: {
    viewport: {
      defaultViewport: 'tablet'
    }
  }
}
```

### 5. Interactive Documentation
Create MDX documentation with interactive examples:

```mdx
<!-- components/auth/__stories__/Authentication.mdx -->
import { Meta, Story, Canvas, ArgsTable } from '@storybook/addon-docs'
import LoginForm from '../LoginForm.vue'

<Meta title="Auth/Authentication Guide" />

# Authentication System

The authentication system provides secure login with 2FA support and comprehensive error handling.

## Login Flow

### 1. Standard Login

<Canvas>
  <Story 
    name="Standard Login"
    args={{}}
    component={LoginForm}
  />
</Canvas>

### 2. With 2FA

When a user has 2FA enabled, they'll be prompted for their authentication code after entering credentials.

### 3. Error Handling

The system handles various error scenarios:

<Canvas>
  <Story 
    name="Invalid Credentials"
    args={{
      error: 'メールアドレスまたはパスワードが正しくありません'
    }}
    component={LoginForm}
  />
</Canvas>

## Accessibility

The login form follows WCAG 2.1 AA guidelines:

- Proper ARIA labels and roles
- Keyboard navigation support
- Screen reader compatibility
- High contrast mode support
- Focus management

## Testing

Use these stories to test:

1. **Visual regression** - Screenshots of all states
2. **Interaction testing** - User flows and form validation
3. **Accessibility testing** - Screen reader and keyboard navigation
4. **Responsive design** - Different viewport sizes

## Usage Examples

```vue
<template>
  <LoginForm 
    @login="handleLogin"
    @forgot-password="handleForgotPassword"
    :loading="isLoading"
    :error="errorMessage"
  />
</template>

<script setup>
const handleLogin = async (credentials) => {
  // Handle login logic
}

const handleForgotPassword = () => {
  // Navigate to password reset
}
</script>
```
```

### 6. Accessibility Testing Stories
Add accessibility-focused stories:

```typescript
// components/auth/__stories__/LoginForm.a11y.stories.ts
import type { Meta, StoryObj } from '@storybook/vue3'
import LoginForm from '../LoginForm.vue'

const meta: Meta<typeof LoginForm> = {
  title: 'Auth/LoginForm/Accessibility',
  component: LoginForm,
  parameters: {
    a11y: {
      config: {
        rules: [
          {
            id: 'color-contrast',
            enabled: true
          },
          {
            id: 'keyboard-navigation',
            enabled: true
          }
        ]
      }
    }
  }
}

export default meta
type Story = StoryObj<typeof meta>

export const HighContrast: Story = {
  parameters: {
    backgrounds: {
      default: 'dark'
    }
  }
}

export const FocusManagement: Story = {
  args: {},
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    
    // Test tab order
    const emailInput = canvas.getByLabelText('メールアドレス')
    const passwordInput = canvas.getByLabelText('パスワード')
    const rememberMe = canvas.getByLabelText('ログイン状態を保持する')
    const submitButton = canvas.getByRole('button', { name: /ログイン/i })
    
    // Focus should move in correct order
    emailInput.focus()
    expect(document.activeElement).toBe(emailInput)
    
    await userEvent.tab()
    expect(document.activeElement).toBe(passwordInput)
    
    await userEvent.tab()
    expect(document.activeElement).toBe(rememberMe)
    
    await userEvent.tab()
    expect(document.activeElement).toBe(submitButton)
  }
}

export const ScreenReaderLabels: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: 'Verify all form elements have proper ARIA labels for screen readers'
      }
    }
  }
}
```

## Implementation Steps

1. **Basic stories setup** (1 hour)
   - Create main LoginForm stories
   - Add different states (loading, error, success)
   - Configure Storybook controls

2. **Interactive stories** (1 hour)
   - Add play functions for user interactions
   - Create validation testing stories
   - Add form submission flows

3. **Comprehensive coverage** (1 hour)
   - 2FA and password reset stories
   - Layout and responsive stories
   - Accessibility testing stories
   - MDX documentation

## Testing Requirements

### Visual Regression Tests
- All component states captured as screenshots
- Different viewport sizes
- High contrast mode
- Error states and loading states

### Interaction Tests
```typescript
// .storybook/test-runner.ts
import { expect } from '@storybook/test'

export default {
  async postRender(page, context) {
    const elementHandler = await page.$('#storybook-root')
    const innerHTML = await elementHandler.innerHTML()
    expect(innerHTML).toMatchSnapshot()
  }
}
```

### Accessibility Tests
- Automated a11y testing with @storybook/addon-a11y
- Color contrast validation
- Keyboard navigation testing
- Screen reader compatibility

## Success Criteria

- [ ] All LoginForm states have Storybook stories
- [ ] Interactive stories demonstrate user flows
- [ ] Accessibility testing passes WCAG 2.1 AA
- [ ] Visual regression tests capture all states
- [ ] MDX documentation explains usage patterns
- [ ] Responsive design stories work on all devices
- [ ] Form validation stories test edge cases
- [ ] Error handling stories cover all error types

## Files to Create

- `components/auth/__stories__/LoginForm.stories.ts`
- `components/auth/__stories__/TwoFactorForm.stories.ts`
- `components/auth/__stories__/PasswordResetForm.stories.ts`
- `components/auth/__stories__/LoginForm.a11y.stories.ts`
- `components/auth/__stories__/Authentication.mdx`
- `layouts/__stories__/AuthLayout.stories.ts`

## Technical References

### Architecture Guidelines
- Reference: `/archived-2025-07-23/frontend/CLAUDE.md` - Storybook development patterns and component documentation standards
- Reference: `/archived-2025-07-23/frontend/docs/developer-guide/architecture.md` - Component testing strategies and accessibility requirements
- Reference: `frontend/app/schemas/auth.ts` - Form validation patterns and Zod schema usage
- Reference: `frontend/app/mocks/handlers/auth.ts` - Mock data patterns for realistic testing scenarios

### Design Patterns
- Follow the Storybook 8 patterns with Vue 3 composition API
- Use the established authentication mock data for realistic stories
- Implement accessibility testing patterns from architecture documentation
- Use the form validation patterns from existing auth schemas

## Related Tasks

- T02_S02_Error_Handling_Enhancement
- T06_S02_AuthStore_Unit_Tests
- T07_S02_E2E_Integration_Tests

---

**Note**: Storybook stories serve as living documentation and testing tools. Ensure all stories are accessible and demonstrate real-world usage scenarios.