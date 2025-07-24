import { defineEventHandler, readBody } from 'h3'

/**
 * Create new per-diem entry
 * 
 * @route POST /api/per-diem
 * @description Creates a new per-diem entry and generates corresponding expense records
 */
export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  
  // Simulate per-diem creation logic
  const {
    dateRange,
    location,
    purpose,
    category,
    dailyAmount,
    currency = 'JPY',
    matterId,
    transportationMode,
    accommodationType = 'NONE',
    accommodationRequired = false,
    notes,
    isBillable = true,
    isReimbursable = false,
    saveAsTemplate = false
  } = body

  // Calculate total days and amount
  const startDate = new Date(dateRange.startDate)
  const endDate = new Date(dateRange.endDate)
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime())
  const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
  const totalAmount = totalDays * dailyAmount

  // Generate unique ID for the per-diem entry
  const perDiemId = `per-diem-${Date.now()}`
  
  // Create the per-diem entry
  const newPerDiemEntry = {
    id: perDiemId,
    dateRange,
    location,
    purpose,
    category,
    dailyAmount,
    currency,
    matterId,
    transportationMode,
    accommodationType,
    accommodationRequired,
    totalAmount,
    totalDays,
    isBillable,
    isReimbursable,
    requiresApproval: true,
    isApproved: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'current-user-id', // This would come from authentication
    notes
  }

  // Generate individual daily expense entries
  const expenseEntries = []
  for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
    const dateString = date.toISOString().split('T')[0]
    
    expenseEntries.push({
      id: `expense-${perDiemId}-${dateString}`,
      date: dateString,
      amount: dailyAmount,
      description: `${purpose} - ${location}`,
      expense_type: 'TRAVEL',
      matterId,
      location,
      purpose,
      notes,
      receipt_required: false,
      isBillable,
      isReimbursable,
      category,
      transportationMode,
      accommodationType,
      perDiemId, // Link back to per-diem entry
      createdAt: new Date().toISOString(),
      createdBy: 'current-user-id'
    })
  }

  // If saveAsTemplate is true, also save as a template
  if (saveAsTemplate) {
    const template = {
      id: `template-${Date.now()}`,
      name: `${category} - ${location}`,
      description: `Template for ${category.toLowerCase()} at ${location}`,
      category,
      location,
      purpose,
      dailyAmount,
      transportationMode,
      accommodationType,
      accommodationRequired,
      isBillable,
      isReimbursable,
      isPublic: false,
      createdBy: 'current-user-id',
      createdAt: new Date().toISOString()
    }
    
    // In a real implementation, this would be saved to the database
    console.log('Template saved:', template)
  }

  // Simulate database save
  // In a real implementation, this would:
  // 1. Save the per-diem entry to the database
  // 2. Create corresponding expense records
  // 3. Trigger approval workflow if required
  // 4. Send notifications to relevant parties

  console.log('Per-diem entry created:', newPerDiemEntry)
  console.log('Expense entries generated:', expenseEntries)

  // Return the created per-diem entry
  return {
    success: true,
    data: newPerDiemEntry,
    expenseEntries,
    message: `Per-diem entry created successfully for ${totalDays} day(s)`
  }
})