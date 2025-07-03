<template>
  <div class="per-diem-page">
    <!-- Page Header -->
    <header class="page-header">
      <div class="header-content">
        <div class="title-section">
          <h1 class="page-title">Per-Diem Management</h1>
          <p class="page-description">
            Record and manage daily allowances for travel, court visits, and business activities
          </p>
        </div>
        
        <div class="header-actions">
          <button
            @click="showCreateForm = true"
            class="btn btn-primary"
          >
            <PlusIcon class="w-4 h-4" />
            New Per-Diem Entry
          </button>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="page-content">
      <!-- Per-Diem List Section -->
      <section class="per-diem-list-section">
        <div class="section-header">
          <h2 class="section-title">Recent Entries</h2>
          
          <!-- Quick Filters -->
          <div class="quick-filters">
            <select v-model="selectedCategory" class="filter-select">
              <option value="">All Categories</option>
              <option value="COURT_VISIT">Court Visit</option>
              <option value="CLIENT_MEETING">Client Meeting</option>
              <option value="BUSINESS_TRAVEL">Business Travel</option>
              <option value="CONFERENCE">Conference</option>
              <option value="SITE_INSPECTION">Site Inspection</option>
              <option value="DOCUMENT_FILING">Document Filing</option>
              <option value="OTHER">Other</option>
            </select>
            
            <select v-model="approvalFilter" class="filter-select">
              <option value="">All Status</option>
              <option value="approved">Approved</option>
              <option value="pending">Pending Approval</option>
            </select>
          </div>
        </div>

        <!-- Loading State -->
        <div v-if="perDiemQuery.isPending.value" class="loading-state">
          <div class="loading-spinner" />
          <p>Loading per-diem entries...</p>
        </div>

        <!-- Error State -->
        <div v-else-if="perDiemQuery.error.value" class="error-state">
          <p class="error-message">
            Failed to load per-diem entries: {{ perDiemQuery.error.value.message }}
          </p>
          <button @click="perDiemQuery.refetch()" class="btn btn-outline">
            Try Again
          </button>
        </div>

        <!-- Per-Diem Entries -->
        <div v-else-if="perDiemEntries.length" class="per-diem-grid">
          <div
            v-for="entry in perDiemEntries"
            :key="entry.id"
            class="per-diem-card"
            @click="handleEntryClick(entry)"
          >
            <!-- Card Header -->
            <div class="card-header">
              <div class="date-range">
                <span class="start-date">{{ formatDate(entry.dateRange.startDate) }}</span>
                <span v-if="entry.totalDays > 1" class="date-separator">-</span>
                <span v-if="entry.totalDays > 1" class="end-date">{{ formatDate(entry.dateRange.endDate) }}</span>
                <span class="days-badge">{{ entry.totalDays }} day{{ entry.totalDays > 1 ? 's' : '' }}</span>
              </div>
              
              <div class="entry-status">
                <span
                  :class="[
                    'status-badge',
                    entry.isApproved ? 'status-approved' : 'status-pending'
                  ]"
                >
                  {{ entry.isApproved ? 'Approved' : 'Pending' }}
                </span>
              </div>
            </div>

            <!-- Card Content -->
            <div class="card-content">
              <div class="location-purpose">
                <h3 class="location">{{ entry.location }}</h3>
                <p class="purpose">{{ entry.purpose }}</p>
              </div>
              
              <div class="category-badge">
                {{ formatCategory(entry.category) }}
              </div>
            </div>

            <!-- Card Footer -->
            <div class="card-footer">
              <div class="amount-info">
                <span class="daily-amount">¥{{ entry.dailyAmount.toLocaleString() }}/day</span>
                <span class="total-amount">Total: ¥{{ entry.totalAmount.toLocaleString() }}</span>
              </div>
              
              <div class="billing-info">
                <span v-if="entry.isBillable" class="billing-badge billable">Billable</span>
                <span v-if="entry.isReimbursable" class="billing-badge reimbursable">Reimbursable</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-else class="empty-state">
          <div class="empty-icon">
            <CalendarIcon class="w-12 h-12 text-muted-foreground" />
          </div>
          <h3 class="empty-title">No per-diem entries found</h3>
          <p class="empty-description">
            Create your first per-diem entry to track daily allowances for business activities.
          </p>
          <button @click="showCreateForm = true" class="btn btn-primary">
            Create First Entry
          </button>
        </div>

        <!-- Pagination -->
        <div v-if="perDiemData?.hasNext || perDiemData?.hasPrev" class="pagination">
          <button
            @click="previousPage"
            :disabled="!perDiemData?.hasPrev"
            class="pagination-btn"
          >
            Previous
          </button>
          
          <span class="pagination-info">
            Page {{ currentPage }} of {{ totalPages }}
          </span>
          
          <button
            @click="nextPage"
            :disabled="!perDiemData?.hasNext"
            class="pagination-btn"
          >
            Next
          </button>
        </div>
      </section>
    </main>

    <!-- Create Per-Diem Modal -->
    <div v-if="showCreateForm" class="modal-overlay" @click="handleModalOverlayClick">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2 class="modal-title">Create Per-Diem Entry</h2>
          <button @click="showCreateForm = false" class="close-btn">
            <XIcon class="w-5 h-5" />
          </button>
        </div>
        
        <div class="modal-body">
          <PerDiemForm
            mode="create"
            @save="handlePerDiemSave"
            @cancel="showCreateForm = false"
          />
        </div>
      </div>
    </div>

    <!-- Edit Per-Diem Modal -->
    <div v-if="showEditForm && selectedEntry" class="modal-overlay" @click="handleModalOverlayClick">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2 class="modal-title">Edit Per-Diem Entry</h2>
          <button @click="showEditForm = false" class="close-btn">
            <XIcon class="w-5 h-5" />
          </button>
        </div>
        
        <div class="modal-body">
          <PerDiemForm
            mode="edit"
            :per-diem-id="selectedEntry.id"
            :initial-values="selectedEntry"
            @save="handlePerDiemUpdate"
            @cancel="showEditForm = false"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { PlusIcon, CalendarIcon, XIcon } from 'lucide-vue-next'
import { usePerDiemManagement } from '~/composables/usePerDiem'
import type { PerDiemCategory } from '~/schemas/per-diem'
import PerDiemForm from '~/components/expenses/PerDiemForm.vue'

// Page metadata
definePageMeta({
  title: 'Per-Diem Management',
  description: 'Record and manage daily allowances for business activities'
})

// Composables
const { usePerDiemList } = usePerDiemManagement()

// Local state
const showCreateForm = ref(false)
const showEditForm = ref(false)
const selectedEntry = ref<any>(null)
const selectedCategory = ref('')
const approvalFilter = ref('')
const currentPage = ref(1)
const pageSize = ref(20)

// Build query filters
const queryFilters = ref({
  page: 1,
  limit: 20,
  category: undefined as PerDiemCategory | undefined,
  isApproved: undefined as boolean | undefined,
  sortBy: 'dateRange.startDate' as const,
  sortOrder: 'desc' as const
})

// Update filters reactively
watch([currentPage, pageSize, selectedCategory, approvalFilter], () => {
  queryFilters.value = {
    page: currentPage.value,
    limit: pageSize.value,
    category: (selectedCategory.value as PerDiemCategory) || undefined,
    isApproved: approvalFilter.value === 'approved' ? true : 
                approvalFilter.value === 'pending' ? false : undefined,
    sortBy: 'dateRange.startDate' as const,
    sortOrder: 'desc' as const
  }
})

// Per-diem query
const perDiemQuery = usePerDiemList(queryFilters)
const perDiemData = computed(() => perDiemQuery.data.value)
const perDiemEntries = computed(() => perDiemData.value?.data || [])

// Pagination computed properties
const totalPages = computed(() => {
  if (!perDiemData.value) return 1
  return Math.ceil(perDiemData.value.total / pageSize.value)
})

// Methods
const handleEntryClick = (entry: any) => {
  selectedEntry.value = entry
  showEditForm.value = true
}

const handlePerDiemSave = (perDiem: any) => {
  showCreateForm.value = false
  // Refetch the list to show the new entry
  perDiemQuery.refetch()
}

const handlePerDiemUpdate = (perDiem: any) => {
  showEditForm.value = false
  selectedEntry.value = null
  // Refetch the list to show updated entry
  perDiemQuery.refetch()
}

const handleModalOverlayClick = () => {
  showCreateForm.value = false
  showEditForm.value = false
  selectedEntry.value = null
}

const nextPage = () => {
  if (perDiemData.value?.hasNext) {
    currentPage.value += 1
  }
}

const previousPage = () => {
  if (perDiemData.value?.hasPrev) {
    currentPage.value -= 1
  }
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

const formatCategory = (category: string) => {
  const categoryMap: Record<string, string> = {
    COURT_VISIT: 'Court Visit',
    CLIENT_MEETING: 'Client Meeting',
    BUSINESS_TRAVEL: 'Business Travel',
    CONFERENCE: 'Conference',
    SITE_INSPECTION: 'Site Inspection',
    DOCUMENT_FILING: 'Document Filing',
    OTHER: 'Other'
  }
  return categoryMap[category] || category
}

// Reset to first page when filters change
watch([selectedCategory, approvalFilter], () => {
  currentPage.value = 1
})
</script>

<style scoped>
.per-diem-page {
  min-height: 100vh;
  background: hsl(var(--background));
}

.page-header {
  border-bottom: 1px solid hsl(var(--border));
  background: hsl(var(--card));
  padding: 2rem 1rem;
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 2rem;
}

.title-section {
  flex: 1;
}

.page-title {
  margin: 0 0 0.5rem 0;
  font-size: 2rem;
  font-weight: 700;
  color: hsl(var(--foreground));
}

.page-description {
  margin: 0;
  color: hsl(var(--muted-foreground));
  font-size: 1.125rem;
}

.header-actions {
  display: flex;
  gap: 1rem;
}

.page-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1rem;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.section-title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: hsl(var(--foreground));
}

.quick-filters {
  display: flex;
  gap: 1rem;
}

.filter-select {
  padding: 0.5rem 0.75rem;
  border: 1px solid hsl(var(--border));
  border-radius: 0.375rem;
  background: hsl(var(--background));
  color: hsl(var(--foreground));
  font-size: 0.875rem;
}

.loading-state,
.error-state,
.empty-state {
  text-align: center;
  padding: 4rem 2rem;
}

.loading-spinner {
  width: 2rem;
  height: 2rem;
  border: 2px solid hsl(var(--border));
  border-top: 2px solid hsl(var(--primary));
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-message {
  color: hsl(var(--destructive));
  margin-bottom: 1rem;
}

.empty-icon {
  margin-bottom: 1rem;
  display: flex;
  justify-content: center;
}

.empty-title {
  margin: 0 0 0.5rem 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: hsl(var(--foreground));
}

.empty-description {
  margin: 0 0 1.5rem 0;
  color: hsl(var(--muted-foreground));
}

.per-diem-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.per-diem-card {
  background: hsl(var(--card));
  border: 1px solid hsl(var(--border));
  border-radius: 0.5rem;
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.per-diem-card:hover {
  box-shadow: 0 4px 12px hsl(var(--shadow) / 0.15);
  border-color: hsl(var(--ring));
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.date-range {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
  color: hsl(var(--foreground));
}

.date-separator {
  color: hsl(var(--muted-foreground));
}

.days-badge {
  background: hsl(var(--muted));
  color: hsl(var(--muted-foreground));
  padding: 0.125rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 500;
}

.status-badge {
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 500;
}

.status-approved {
  background: hsl(var(--success) / 0.1);
  color: hsl(var(--success));
  border: 1px solid hsl(var(--success) / 0.3);
}

.status-pending {
  background: hsl(var(--warning) / 0.1);
  color: hsl(var(--warning));
  border: 1px solid hsl(var(--warning) / 0.3);
}

.card-content {
  margin-bottom: 1rem;
}

.location {
  margin: 0 0 0.25rem 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: hsl(var(--foreground));
}

.purpose {
  margin: 0 0 0.75rem 0;
  color: hsl(var(--muted-foreground));
  font-size: 0.875rem;
  line-height: 1.4;
}

.category-badge {
  display: inline-block;
  background: hsl(var(--primary) / 0.1);
  color: hsl(var(--primary));
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 500;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
}

.amount-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.daily-amount {
  font-size: 0.875rem;
  color: hsl(var(--muted-foreground));
}

.total-amount {
  font-weight: 600;
  color: hsl(var(--foreground));
}

.billing-info {
  display: flex;
  gap: 0.5rem;
}

.billing-badge {
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
  font-size: 0.625rem;
  font-weight: 500;
}

.billing-badge.billable {
  background: hsl(var(--primary) / 0.1);
  color: hsl(var(--primary));
}

.billing-badge.reimbursable {
  background: hsl(var(--secondary));
  color: hsl(var(--secondary-foreground));
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-top: 2rem;
}

.pagination-btn {
  padding: 0.5rem 1rem;
  border: 1px solid hsl(var(--border));
  border-radius: 0.375rem;
  background: hsl(var(--background));
  color: hsl(var(--foreground));
  cursor: pointer;
  transition: all 0.2s ease;
}

.pagination-btn:hover:not(:disabled) {
  background: hsl(var(--muted));
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination-info {
  font-size: 0.875rem;
  color: hsl(var(--muted-foreground));
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: hsl(var(--background) / 0.8);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
  padding: 1rem;
}

.modal-content {
  background: hsl(var(--card));
  border: 1px solid hsl(var(--border));
  border-radius: 0.5rem;
  width: 100%;
  max-width: 800px;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid hsl(var(--border));
}

.modal-title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: hsl(var(--foreground));
}

.close-btn {
  padding: 0.5rem;
  border: none;
  background: none;
  color: hsl(var(--muted-foreground));
  cursor: pointer;
  border-radius: 0.25rem;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: hsl(var(--muted));
  color: hsl(var(--foreground));
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 0;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: 1px solid transparent;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-primary {
  background: hsl(var(--primary));
  color: hsl(var(--primary-foreground));
}

.btn-primary:hover {
  background: hsl(var(--primary) / 0.9);
}

.btn-outline {
  border: 1px solid hsl(var(--border));
  background: hsl(var(--background));
  color: hsl(var(--foreground));
}

.btn-outline:hover {
  background: hsl(var(--muted));
}

/* Responsive design */
@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    align-items: stretch;
  }
  
  .section-header {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }
  
  .quick-filters {
    flex-direction: column;
  }
  
  .per-diem-grid {
    grid-template-columns: 1fr;
  }
  
  .card-footer {
    flex-direction: column;
    align-items: stretch;
    gap: 0.75rem;
  }
  
  .modal-content {
    margin: 0;
    border-radius: 0;
    max-height: 100vh;
  }
}
</style>