// Core form components
export { MultiStepForm, createStepConfig } from './multi-step-form'
export type { StepConfig, MultiStepFormProps } from './multi-step-form'

export { ConditionalField, SimpleConditionalField, useConditionalField, withConditionalField, conditionalLogic } from './conditional-field'
export type { ConditionalFieldProps, ConditionalLogic, ConditionFunction } from './conditional-field'

export { FieldArray, SimpleFieldArray, useFieldArrayHelpers, fieldArrayValidators } from './field-array'
export type { FieldArrayProps, FieldArrayInstance } from './field-array'

// Hooks
export { useAutoSave, useSimpleAutoSave } from '../hooks/useAutoSave'
export type { AutoSaveOptions, AutoSaveState, AutoSaveInstance } from '../hooks/useAutoSave'

export { useFormPersistence } from '../hooks/useFormPersistence'

// Examples
export { MatterCreationMultiStepForm } from './examples/matter-creation-multi-step'
export { DocumentUploadForm } from './examples/document-upload-form'

// Existing components
export { CreateMatterForm } from './matter/CreateMatterForm'
export { EditMatterForm } from './matter/EditMatterForm'
export { MatterFormFields } from './matter/MatterFormFields'
export { FieldError } from './FieldError'