<template>
  <div class="container mx-auto p-8 space-y-8">
    <h1 class="text-3xl font-bold mb-8">Form Input Components Test Page</h1>

    <!-- Input Component Tests -->
    <section>
      <h2 class="text-2xl font-semibold mb-4">Input Component</h2>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="space-y-4">
          <div>
            <Label for="basic-input">Basic Input</Label>
            <Input 
              id="basic-input"
              v-model="inputValue" 
              placeholder="Enter text..." 
            />
          </div>

          <div>
            <Label for="error-input" :error="true">Input with Error</Label>
            <Input 
              id="error-input"
              v-model="errorInputValue" 
              placeholder="This has an error..."
              error="This field is required"
            />
          </div>

          <div>
            <Label for="prefix-input">Input with Prefix</Label>
            <Input 
              id="prefix-input"
              v-model="prefixInputValue" 
              placeholder="Amount"
            >
              <template #prefix>
                <DollarSign class="h-4 w-4" />
              </template>
            </Input>
          </div>

          <div>
            <Label for="suffix-input">Input with Suffix</Label>
            <Input 
              id="suffix-input"
              v-model="suffixInputValue" 
              placeholder="Search"
            >
              <template #suffix>
                <Search class="h-4 w-4" />
              </template>
            </Input>
          </div>
        </div>

        <div class="space-y-4">
          <div>
            <Label for="email-input">Email Input</Label>
            <Input 
              id="email-input"
              v-model="emailValue" 
              type="email"
              placeholder="user@example.com"
            />
          </div>

          <div>
            <Label for="password-input">Password Input</Label>
            <Input 
              id="password-input"
              v-model="passwordValue" 
              type="password"
              placeholder="Enter password..."
            />
          </div>

          <div>
            <Label for="number-input">Number Input</Label>
            <Input 
              id="number-input"
              v-model="numberValue" 
              type="number"
              placeholder="Enter number..."
            />
          </div>

          <div>
            <Label for="disabled-input">Disabled Input</Label>
            <Input 
              id="disabled-input"
              v-model="disabledValue" 
              placeholder="Disabled input"
              disabled
            />
          </div>
        </div>
      </div>
    </section>

    <!-- Textarea Component Tests -->
    <section>
      <h2 class="text-2xl font-semibold mb-4">Textarea Component</h2>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="space-y-4">
          <div>
            <Label for="basic-textarea">Basic Textarea</Label>
            <Textarea 
              id="basic-textarea"
              v-model="textareaValue" 
              placeholder="Enter your message..."
            />
          </div>

          <div>
            <Label for="auto-resize-textarea">Auto-resize Textarea</Label>
            <Textarea 
              id="auto-resize-textarea"
              v-model="autoResizeValue" 
              placeholder="This textarea auto-resizes..."
              :auto-resize="true"
              :min-rows="2"
              :max-rows="6"
            />
          </div>
        </div>

        <div class="space-y-4">
          <div>
            <Label for="char-count-textarea">Textarea with Character Count</Label>
            <Textarea 
              id="char-count-textarea"
              v-model="charCountValue" 
              placeholder="Type something..."
              :show-character-count="true"
              :max-length="100"
            />
          </div>

          <div>
            <Label for="error-textarea" :error="true">Textarea with Error</Label>
            <Textarea 
              id="error-textarea"
              v-model="errorTextareaValue" 
              placeholder="This has an error..."
              error="Message is required"
            />
          </div>
        </div>
      </div>
    </section>

    <!-- Select Component Tests -->
    <section>
      <h2 class="text-2xl font-semibold mb-4">Select Component</h2>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="space-y-4">
          <div>
            <Label for="basic-select">Basic Select</Label>
            <Select v-model="selectValue" placeholder="Choose an option...">
              <SelectItem value="option1">Option 1</SelectItem>
              <SelectItem value="option2">Option 2</SelectItem>
              <SelectItem value="option3">Option 3</SelectItem>
            </Select>
          </div>

          <div>
            <Label for="grouped-select">Grouped Select</Label>
            <Select v-model="groupedSelectValue" placeholder="Choose a fruit...">
              <SelectGroup label="Fruits">
                <SelectItem value="apple">Apple</SelectItem>
                <SelectItem value="banana">Banana</SelectItem>
                <SelectItem value="orange">Orange</SelectItem>
              </SelectGroup>
              <SelectGroup label="Vegetables">
                <SelectItem value="carrot">Carrot</SelectItem>
                <SelectItem value="lettuce">Lettuce</SelectItem>
                <SelectItem value="tomato">Tomato</SelectItem>
              </SelectGroup>
            </Select>
          </div>
        </div>

        <div class="space-y-4">
          <div>
            <Label for="error-select" :error="true">Select with Error</Label>
            <Select 
              v-model="errorSelectValue" 
              placeholder="This has an error..."
              error="Please select an option"
            >
              <SelectItem value="option1">Option 1</SelectItem>
              <SelectItem value="option2">Option 2</SelectItem>
            </Select>
          </div>

          <div>
            <Label for="disabled-select">Disabled Select</Label>
            <Select 
              v-model="disabledSelectValue" 
              placeholder="Disabled select"
              disabled
            >
              <SelectItem value="option1">Option 1</SelectItem>
              <SelectItem value="option2">Option 2</SelectItem>
            </Select>
          </div>
        </div>
      </div>
    </section>

    <!-- Checkbox Component Tests -->
    <section>
      <h2 class="text-2xl font-semibold mb-4">Checkbox Component</h2>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="space-y-4">
          <div>
            <Checkbox v-model="basicCheckbox">
              Basic Checkbox
            </Checkbox>
          </div>

          <div>
            <Checkbox v-model="checkedCheckbox">
              Pre-checked Checkbox
            </Checkbox>
          </div>

          <div>
            <Checkbox v-model="indeterminateCheckbox" :indeterminate="true">
              Indeterminate Checkbox
            </Checkbox>
          </div>

          <div>
            <Checkbox v-model="disabledCheckbox" disabled>
              Disabled Checkbox
            </Checkbox>
          </div>
        </div>

        <div class="space-y-4">
          <div>
            <Checkbox v-model="errorCheckbox" error="This field is required">
              Checkbox with Error
            </Checkbox>
          </div>

          <div>
            <Checkbox v-model="customIconCheckbox" :custom-icon="Heart">
              Custom Icon Checkbox
            </Checkbox>
          </div>

          <div class="space-y-2">
            <Label>Checkbox Group</Label>
            <div class="space-y-2">
              <Checkbox v-model="checkboxGroup.option1">Option 1</Checkbox>
              <Checkbox v-model="checkboxGroup.option2">Option 2</Checkbox>
              <Checkbox v-model="checkboxGroup.option3">Option 3</Checkbox>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Switch Component Tests -->
    <section>
      <h2 class="text-2xl font-semibold mb-4">Switch Component</h2>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="space-y-4">
          <div class="flex items-center space-x-2">
            <Switch v-model="basicSwitch" />
            <Label>Basic Switch</Label>
          </div>

          <div class="flex items-center space-x-2">
            <Switch v-model="enabledSwitch" />
            <Label>Pre-enabled Switch</Label>
          </div>

          <div class="flex items-center space-x-2">
            <Switch v-model="disabledSwitch" disabled />
            <Label>Disabled Switch</Label>
          </div>

          <div class="flex items-center space-x-2">
            <Switch v-model="loadingSwitch" loading />
            <Label>Loading Switch</Label>
          </div>
        </div>

        <div class="space-y-4">
          <div class="space-y-2">
            <Label>Switch Sizes</Label>
            <div class="flex items-center space-x-4">
              <div class="flex items-center space-x-2">
                <Switch v-model="smallSwitch" size="sm" />
                <Label>Small</Label>
              </div>
              <div class="flex items-center space-x-2">
                <Switch v-model="defaultSwitch" />
                <Label>Default</Label>
              </div>
              <div class="flex items-center space-x-2">
                <Switch v-model="largeSwitch" size="lg" />
                <Label>Large</Label>
              </div>
            </div>
          </div>

          <div>
            <Switch v-model="errorSwitch" error="Toggle is required" />
            <Label>Switch with Error</Label>
          </div>
        </div>
      </div>
    </section>

    <!-- Form Integration Example -->
    <section>
      <h2 class="text-2xl font-semibold mb-4">Form Integration Example</h2>
      
      <Card class="p-6">
        <form @submit.prevent="handleFormSubmit" class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label for="form-name" :required="true">Name</Label>
              <Input 
                id="form-name"
                v-model="formData.name" 
                placeholder="Enter your name"
                :error="formErrors.name"
              />
            </div>

            <div>
              <Label for="form-email" :required="true">Email</Label>
              <Input 
                id="form-email"
                v-model="formData.email" 
                type="email"
                placeholder="Enter your email"
                :error="formErrors.email"
              />
            </div>

            <div>
              <Label for="form-role">Role</Label>
              <Select v-model="formData.role" placeholder="Select your role">
                <SelectItem value="developer">Developer</SelectItem>
                <SelectItem value="designer">Designer</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
              </Select>
            </div>

            <div>
              <Label for="form-phone">Phone</Label>
              <Input 
                id="form-phone"
                v-model="formData.phone" 
                placeholder="Enter phone number"
              >
                <template #prefix>
                  <Phone class="h-4 w-4" />
                </template>
              </Input>
            </div>
          </div>

          <div>
            <Label for="form-message">Message</Label>
            <Textarea 
              id="form-message"
              v-model="formData.message" 
              placeholder="Enter your message..."
              :auto-resize="true"
              :show-character-count="true"
              :max-length="500"
            />
          </div>

          <div class="space-y-2">
            <Checkbox v-model="formData.subscribe">
              Subscribe to newsletter
            </Checkbox>
            
            <div class="flex items-center space-x-2">
              <Switch v-model="formData.notifications" />
              <Label>Enable notifications</Label>
            </div>
          </div>

          <div class="flex space-x-2">
            <Button type="submit" :loading="formSubmitting">
              Submit Form
            </Button>
            <Button type="button" variant="outline" @click="resetForm">
              Reset
            </Button>
          </div>
        </form>

        <!-- Form State Display -->
        <div class="mt-6 p-4 bg-muted rounded-md">
          <h3 class="font-semibold mb-2">Form State:</h3>
          <pre class="text-sm">{{ JSON.stringify(formData, null, 2) }}</pre>
        </div>
      </Card>
    </section>

    <!-- Theme Testing -->
    <section>
      <h2 class="text-2xl font-semibold mb-4">Theme Testing</h2>
      <div class="flex items-center gap-4">
        <Button @click="toggleTheme" variant="outline">
          <Sun v-if="!isDark" class="mr-2 h-4 w-4" />
          <Moon v-else class="mr-2 h-4 w-4" />
          Toggle Theme
        </Button>
        <Badge>Current: {{ isDark ? 'Dark' : 'Light' }} Mode</Badge>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { 
  DollarSign, Search, Heart, Phone, Sun, Moon 
} from 'lucide-vue-next'

const { isDark, toggleTheme } = useTheme()

// Input values
const inputValue = ref('')
const errorInputValue = ref('')
const prefixInputValue = ref('')
const suffixInputValue = ref('')
const emailValue = ref('')
const passwordValue = ref('')
const numberValue = ref('')
const disabledValue = ref('Cannot edit this')

// Textarea values
const textareaValue = ref('')
const autoResizeValue = ref('')
const charCountValue = ref('')
const errorTextareaValue = ref('')

// Select values
const selectValue = ref('')
const groupedSelectValue = ref('')
const errorSelectValue = ref('')
const disabledSelectValue = ref('')

// Checkbox values
const basicCheckbox = ref(false)
const checkedCheckbox = ref(true)
const indeterminateCheckbox = ref(false)
const disabledCheckbox = ref(false)
const errorCheckbox = ref(false)
const customIconCheckbox = ref(false)
const checkboxGroup = reactive({
  option1: false,
  option2: true,
  option3: false
})

// Switch values
const basicSwitch = ref(false)
const enabledSwitch = ref(true)
const disabledSwitch = ref(false)
const loadingSwitch = ref(false)
const smallSwitch = ref(false)
const defaultSwitch = ref(false)
const largeSwitch = ref(false)
const errorSwitch = ref(false)

// Form data
const formData = reactive({
  name: '',
  email: '',
  role: '',
  phone: '',
  message: '',
  subscribe: false,
  notifications: true
})

const formErrors = reactive({
  name: '',
  email: ''
})

const formSubmitting = ref(false)

const handleFormSubmit = async () => {
  // Reset errors
  formErrors.name = ''
  formErrors.email = ''

  // Validate
  if (!formData.name) {
    formErrors.name = 'Name is required'
  }
  if (!formData.email) {
    formErrors.email = 'Email is required'
  }

  if (formErrors.name || formErrors.email) {
    return
  }

  // Simulate submission
  formSubmitting.value = true
  await new Promise(resolve => setTimeout(resolve, 2000))
  formSubmitting.value = false
  
  alert('Form submitted successfully!')
}

const resetForm = () => {
  Object.assign(formData, {
    name: '',
    email: '',
    role: '',
    phone: '',
    message: '',
    subscribe: false,
    notifications: true
  })
  
  formErrors.name = ''
  formErrors.email = ''
}
</script>