import { defineEventHandler } from 'h3'

/**
 * Get per-diem templates
 * 
 * @route GET /api/per-diem/templates
 * @description Fetches available per-diem templates for quick entry
 */
export default defineEventHandler(async (event) => {
  // Mock per-diem templates
  const templates = [
    {
      id: 'template-1',
      name: 'Tokyo Court Visit',
      description: 'Standard template for Tokyo District Court visits',
      category: 'COURT_VISIT',
      location: 'Tokyo District Court',
      purpose: 'Court hearing attendance',
      dailyAmount: 8000,
      transportationMode: 'TRAIN',
      accommodationType: 'NONE',
      accommodationRequired: false,
      isBillable: true,
      isReimbursable: false,
      isPublic: true,
      createdBy: 'admin',
      createdAt: '2025-01-01T00:00:00Z',
      tags: ['court', 'tokyo', 'standard']
    },
    {
      id: 'template-2',
      name: 'Osaka Client Meeting',
      description: 'Template for client meetings in Osaka business district',
      category: 'CLIENT_MEETING',
      location: 'Osaka Business District',
      purpose: 'Client consultation meeting',
      dailyAmount: 10000,
      transportationMode: 'TRAIN',
      accommodationType: 'NONE',
      accommodationRequired: false,
      isBillable: true,
      isReimbursable: false,
      isPublic: true,
      createdBy: 'admin',
      createdAt: '2025-01-01T00:00:00Z',
      tags: ['client', 'osaka', 'meeting']
    },
    {
      id: 'template-3',
      name: 'Multi-day Conference',
      description: 'Template for multi-day legal conferences with accommodation',
      category: 'CONFERENCE',
      location: 'Convention Center',
      purpose: 'Legal conference attendance',
      dailyAmount: 15000,
      transportationMode: 'TRAIN',
      accommodationType: 'HOTEL',
      accommodationRequired: true,
      isBillable: false,
      isReimbursable: true,
      isPublic: true,
      createdBy: 'admin',
      createdAt: '2025-01-01T00:00:00Z',
      tags: ['conference', 'education', 'accommodation']
    },
    {
      id: 'template-4',
      name: 'Site Inspection',
      description: 'Template for property site inspections',
      category: 'SITE_INSPECTION',
      location: 'Property Site',
      purpose: 'On-site property inspection',
      dailyAmount: 12000,
      transportationMode: 'CAR',
      accommodationType: 'NONE',
      accommodationRequired: false,
      isBillable: true,
      isReimbursable: false,
      isPublic: true,
      createdBy: 'admin',
      createdAt: '2025-01-01T00:00:00Z',
      tags: ['inspection', 'property', 'site']
    },
    {
      id: 'template-5',
      name: 'Document Filing',
      description: 'Template for legal document filing at government offices',
      category: 'DOCUMENT_FILING',
      location: 'Legal Affairs Bureau',
      purpose: 'Document filing and registration procedures',
      dailyAmount: 6000,
      transportationMode: 'TRAIN',
      accommodationType: 'NONE',
      accommodationRequired: false,
      isBillable: true,
      isReimbursable: false,
      isPublic: true,
      createdBy: 'admin',
      createdAt: '2025-01-01T00:00:00Z',
      tags: ['filing', 'documents', 'government']
    },
    {
      id: 'template-6',
      name: 'Regional Court Visit',
      description: 'Template for visits to regional courts outside Tokyo',
      category: 'COURT_VISIT',
      location: 'Regional District Court',
      purpose: 'Court hearing attendance',
      dailyAmount: 12000,
      transportationMode: 'TRAIN',
      accommodationType: 'BUSINESS_HOTEL',
      accommodationRequired: true,
      isBillable: true,
      isReimbursable: false,
      isPublic: true,
      createdBy: 'admin',
      createdAt: '2025-01-01T00:00:00Z',
      tags: ['court', 'regional', 'overnight']
    }
  ]

  return templates
})