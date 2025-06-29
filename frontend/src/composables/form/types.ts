/**
 * Core type definitions for template variable parsing and field type detection
 */

/**
 * Represents a detected field type with optional variants and formatting
 */
export interface FieldType {
  /** Base field type */
  base: 'text' | 'number' | 'date' | 'select' | 'checkbox' | 'email' | 'phone' | 'custom'
  /** Specific variant of the base type (e.g., 'textarea', 'currency', 'datetime') */
  variant?: string
  /** Format specification (e.g., date format, number format) */
  format?: string
  /** Additional type-specific options */
  options?: Record<string, any>
}

/**
 * Represents a parsed template variable with metadata
 */
export interface TemplateVariable {
  /** Original variable name from template (e.g., "client.name") */
  name: string
  /** Nested path array (e.g., ["client", "name"]) */
  path: string[]
  /** Detected field type */
  type: FieldType
  /** Auto-generated display label */
  label: string
  /** Auto-generated placeholder text */
  placeholder?: string
  /** Whether the field is required */
  required?: boolean
  /** Default value if any */
  defaultValue?: any
  /** Validation rules detected from context */
  validation?: ValidationRule[]
  /** Additional metadata parsed from template */
  metadata?: Record<string, any>
  /** Whether this is an array field for repeating sections */
  isArray?: boolean
  /** Array index if this is part of an array */
  arrayIndex?: number
}

/**
 * Validation rule for template variables
 */
export interface ValidationRule {
  /** Type of validation */
  type: 'required' | 'minLength' | 'maxLength' | 'pattern' | 'min' | 'max' | 'custom'
  /** Validation value or parameter */
  value?: any
  /** Error message */
  message?: string
}

/**
 * Template parsing options
 */
export interface TemplateParseOptions {
  /** Custom variable delimiters (default: ["{{", "}}"]) */
  delimiters?: [string, string]
  /** Whether to include metadata comments */
  includeMetadata?: boolean
  /** Whether to deduplicate variables */
  deduplicate?: boolean
  /** Custom field type detection rules */
  customRules?: Record<string, RegExp>
}

/**
 * Field type detection result with confidence
 */
export interface FieldTypeDetectionResult {
  /** Detected field type */
  type: FieldType
  /** Confidence level (0-1) */
  confidence: number
  /** Reason for detection */
  reason?: string
}

/**
 * Template metadata extracted from comments
 */
export interface TemplateMetadata {
  /** Field-specific metadata */
  fields: Record<string, FieldMetadata>
  /** Global template metadata */
  global?: Record<string, any>
}

/**
 * Metadata for a specific field
 */
export interface FieldMetadata {
  /** Explicit type hint */
  type?: string
  /** Field label */
  label?: string
  /** Placeholder text */
  placeholder?: string
  /** Whether field is required */
  required?: boolean
  /** Validation rules */
  validation?: ValidationRule[]
  /** Help text */
  helpText?: string
  /** Default value */
  defaultValue?: any
}

/**
 * Legal-specific field types
 */
export type LegalFieldType = 
  | 'case-number'
  | 'court-name'
  | 'judge-name'
  | 'attorney-name'
  | 'party-name'
  | 'jurisdiction'
  | 'filing-date'
  | 'hearing-date'
  | 'statute-citation'
  | 'legal-amount'

/**
 * Predefined legal field patterns
 */
export const LEGAL_FIELD_PATTERNS: Record<LegalFieldType, RegExp> = {
  'case-number': /case[_\-\s]?(number|no|id)|docket|matter[_\-\s]?(number|no|id)/i,
  'court-name': /court|tribunal|judiciary|bench/i,
  'judge-name': /judge|magistrate|justice|honorable/i,
  'attorney-name': /attorney|lawyer|counsel|advocate|solicitor/i,
  'party-name': /plaintiff|defendant|petitioner|respondent|appellant|appellee/i,
  'jurisdiction': /jurisdiction|venue|district|prefecture|county/i,
  'filing-date': /fil(ing|ed)[_\-\s]?date|submission[_\-\s]?date/i,
  'hearing-date': /hearing[_\-\s]?date|trial[_\-\s]?date|proceeding[_\-\s]?date/i,
  'statute-citation': /statute|law|code|regulation|ordinance|citation/i,
  'legal-amount': /damages|compensation|settlement|award|fine|penalty|fee/i
}

/**
 * Common field type patterns
 */
export const COMMON_FIELD_PATTERNS: Record<string, RegExp> = {
  email: /email|mail|e[\-_]?mail/i,
  phone: /phone|tel|mobile|fax|contact[_\-\s]?(number|no)/i,
  date: /date|born|created|updated|deadline|due|expire|start|end|when/i,
  time: /time|hour|minute|duration|period/i,
  number: /amount|price|quantity|age|count|number|fee|rate|percentage|total|sum/i,
  currency: /price|cost|fee|amount|payment|balance|total|sum|salary|wage/i,
  percentage: /percent|rate|ratio|proportion/i,
  url: /url|link|website|site|web/i,
  textarea: /description|comment|note|detail|summary|content|message|remark|observation/i,
  select: /status|type|category|priority|state|level|grade|rank|option/i,
  checkbox: /agree|accept|confirm|acknowledge|consent|authorize|yes|no/i,
  file: /file|document|attachment|upload|pdf|image|photo/i,
  address: /address|street|city|state|zip|postal|location/i,
  name: /name|title|first|last|middle|surname|given/i
}