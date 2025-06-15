import { z } from 'zod'

// Authentication schemas
export const LoginSchema = z.object({
  email: z.string()
    .min(1, 'Email is required')
    .email('Must be a valid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be less than 128 characters'),
  remember: z.boolean().default(false)
})

export const RegisterSchema = z.object({
  email: z.string()
    .min(1, 'Email is required')
    .email('Must be a valid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be less than 128 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
           'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  confirmPassword: z.string(),
  firstName: z.string()
    .min(1, 'First name is required')
    .max(50, 'First name must be less than 50 characters'),
  lastName: z.string()
    .min(1, 'Last name is required')
    .max(50, 'Last name must be less than 50 characters'),
  role: z.enum(['LAWYER', 'CLERK']),
  acceptTerms: z.boolean().refine(val => val === true, {
    message: 'You must accept the terms and conditions'
  })
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
})

export const ForgotPasswordSchema = z.object({
  email: z.string()
    .min(1, 'Email is required')
    .email('Must be a valid email address')
})

export const ResetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be less than 128 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
           'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
})

// User profile schemas
export const UserProfileSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  role: z.enum(['LAWYER', 'CLERK', 'CLIENT', 'ADMIN']),
  avatar: z.string().url().optional(),
  phone: z.string().optional(),
  department: z.string().optional(),
  bio: z.string().max(500).optional(),
  preferences: z.object({
    language: z.enum(['en', 'jp']).default('en'),
    theme: z.enum(['light', 'dark', 'system']).default('system'),
    notifications: z.object({
      email: z.boolean().default(true),
      browser: z.boolean().default(true),
      mobile: z.boolean().default(false)
    }).default({})
  }).default({}),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
})

export const UpdateProfileSchema = z.object({
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  phone: z.string().optional(),
  department: z.string().optional(),
  bio: z.string().max(500).optional(),
  avatar: z.string().url().optional(),
  preferences: z.object({
    language: z.enum(['en', 'jp']).optional(),
    theme: z.enum(['light', 'dark', 'system']).optional(),
    notifications: z.object({
      email: z.boolean().optional(),
      browser: z.boolean().optional(),
      mobile: z.boolean().optional()
    }).optional()
  }).optional()
})

// File upload schemas
export const FileUploadSchema = z.object({
  file: z.any().refine((file) => file instanceof File, 'Must be a valid file'),
  name: z.string().optional(),
  description: z.string().optional(),
  tags: z.array(z.string()).default([])
})

export const MultipleFileUploadSchema = z.object({
  files: z.array(z.any()).refine(
    (files) => files.every(file => file instanceof File),
    'All items must be valid files'
  ).refine(
    (files) => files.length <= 10,
    'Maximum 10 files allowed'
  ),
  folder: z.string().optional(),
  description: z.string().optional()
})

// API error schema
export const ApiErrorSchema = z.object({
  type: z.string(),
  title: z.string(),
  status: z.number(),
  detail: z.string(),
  instance: z.string(),
  timestamp: z.string().datetime(),
  errors: z.array(z.object({
    field: z.string(),
    message: z.string(),
    code: z.string().optional()
  })).optional()
})

// Pagination schema
export const PaginationSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  total: z.number().min(0),
  totalPages: z.number().min(0)
})

// Search schema
export const SearchSchema = z.object({
  query: z.string().min(1, 'Search query is required'),
  type: z.enum(['matters', 'documents', 'clients', 'all']).default('all'),
  filters: z.record(z.any()).optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20)
})

// Settings schemas
export const SystemSettingsSchema = z.object({
  siteName: z.string().min(1),
  siteDescription: z.string().optional(),
  defaultLanguage: z.enum(['en', 'jp']).default('en'),
  defaultTheme: z.enum(['light', 'dark', 'system']).default('system'),
  maintenanceMode: z.boolean().default(false),
  registrationEnabled: z.boolean().default(false),
  maxFileSize: z.number().min(1).max(100).default(10), // MB
  allowedFileTypes: z.array(z.string()).default(['pdf', 'doc', 'docx', 'txt']),
  sessionTimeout: z.number().min(15).max(1440).default(480) // minutes
})

// Contact form schema
export const ContactFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Must be a valid email address'),
  subject: z.string().min(1, 'Subject is required').max(200),
  message: z.string().min(10, 'Message must be at least 10 characters').max(1000),
  urgency: z.enum(['low', 'medium', 'high']).default('medium'),
  category: z.enum(['general', 'technical', 'billing', 'legal']).default('general')
})

// Type exports
export type LoginRequest = z.infer<typeof LoginSchema>
export type RegisterRequest = z.infer<typeof RegisterSchema>
export type ForgotPasswordRequest = z.infer<typeof ForgotPasswordSchema>
export type ResetPasswordRequest = z.infer<typeof ResetPasswordSchema>
export type UserProfile = z.infer<typeof UserProfileSchema>
export type UpdateProfile = z.infer<typeof UpdateProfileSchema>
export type FileUpload = z.infer<typeof FileUploadSchema>
export type MultipleFileUpload = z.infer<typeof MultipleFileUploadSchema>
export type ApiError = z.infer<typeof ApiErrorSchema>
export type Pagination = z.infer<typeof PaginationSchema>
export type SearchRequest = z.infer<typeof SearchSchema>
export type SystemSettings = z.infer<typeof SystemSettingsSchema>
export type ContactForm = z.infer<typeof ContactFormSchema>

// Validation helper functions
export const validateLogin = (data: unknown) => LoginSchema.safeParse(data)
export const validateRegister = (data: unknown) => RegisterSchema.safeParse(data)
export const validateUserProfile = (data: unknown) => UserProfileSchema.safeParse(data)
export const validateUpdateProfile = (data: unknown) => UpdateProfileSchema.safeParse(data)
export const validateFileUpload = (data: unknown) => FileUploadSchema.safeParse(data)
export const validateSearch = (data: unknown) => SearchSchema.safeParse(data)
export const validateContactForm = (data: unknown) => ContactFormSchema.safeParse(data)