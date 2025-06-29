/**
 * Kanban Demo Data - Static data and development mocks
 * 
 * Provides mock data, demo data generators, and development utilities
 * for testing and development of the kanban board functionality
 */

import { 
    MatterCard,
    KanbanBoard,
    FilterOptions,
    SortOptions,
    ViewPreferences,
    BoardMetrics,
    MatterStatus,
    MatterPriority
} from '@/components/kanban/types'
import { 
    DEFAULT_COLUMNS,
    DEFAULT_VIEW_PREFERENCES,
    DEFAULT_FILTERS,
    DEFAULT_SORTING
} from '@/components/kanban/constants'

// Mock matter data for development
const DEMO_MATTERS: MatterCard[] = [
    {
        id: 'matter-001',
        caseNumber: '2025-CV-0001',
        title: 'Smith vs. Johnson - Contract Dispute',
        description: 'Breach of contract regarding software development services. Client claims incomplete delivery of promised features.',
        clientName: 'ABC Technology Solutions',
        clientContact: 'john.smith@abctech.com',
        opposingParty: 'Johnson Software Inc.',
        courtName: 'Superior Court of California',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        filingDate: '2025-01-15',
        estimatedCompletionDate: '2025-03-15',
        assignedLawyerId: 'lawyer-001',
        assignedLawyerName: 'Sarah Connor',
        assignedClerkId: 'clerk-001',
        assignedClerkName: 'Mike Ross',
        notes: 'Client very responsive. Need to review software specifications by end of week.',
        tags: ['contract', 'software', 'breach'],
        isActive: true,
        isOverdue: false,
        isCompleted: false,
        ageInDays: 35,
        createdAt: '2025-01-15T09:00:00Z',
        updatedAt: '2025-02-18T14:30:00Z',
        createdBy: 'Sarah Connor',
        updatedBy: 'Sarah Connor'
    },
    {
        id: 'matter-002',
        caseNumber: '2025-PI-0001',
        title: 'Martinez Personal Injury Claim',
        description: 'Slip and fall incident at local grocery store. Client sustained back injuries requiring ongoing physical therapy.',
        clientName: 'Maria Martinez',
        clientContact: 'maria.martinez@email.com',
        opposingParty: 'FreshMart Grocery Chain',
        courtName: 'Municipal Court',
        status: 'UNDER_REVIEW',
        priority: 'MEDIUM',
        filingDate: '2025-02-01',
        estimatedCompletionDate: '2025-06-01',
        assignedLawyerId: 'lawyer-002',
        assignedLawyerName: 'Harvey Specter',
        assignedClerkId: 'clerk-002',
        assignedClerkName: 'Rachel Zane',
        notes: 'Medical records received. Surveillance footage still pending from defendant.',
        tags: ['personal-injury', 'slip-fall', 'medical'],
        isActive: true,
        isOverdue: false,
        isCompleted: false,
        ageInDays: 18,
        createdAt: '2025-02-01T10:15:00Z',
        updatedAt: '2025-02-18T16:45:00Z',
        createdBy: 'Harvey Specter',
        updatedBy: 'Rachel Zane'
    },
    {
        id: 'matter-003',
        caseNumber: '2025-DIV-0001',
        title: 'Thompson Divorce Proceedings',
        description: 'Contested divorce with child custody and property division issues. High net worth case with multiple assets.',
        clientName: 'Jennifer Thompson',
        clientContact: 'jennifer.thompson@email.com',
        opposingParty: 'Robert Thompson',
        courtName: 'Family Court',
        status: 'AWAITING_CLIENT',
        priority: 'URGENT',
        filingDate: '2025-01-10',
        estimatedCompletionDate: '2025-07-10',
        assignedLawyerId: 'lawyer-003',
        assignedLawyerName: 'Jessica Pearson',
        assignedClerkId: 'clerk-001',
        assignedClerkName: 'Mike Ross',
        notes: 'Waiting for client to provide additional financial documents. Mediation scheduled for next month.',
        tags: ['divorce', 'custody', 'property', 'mediation'],
        isActive: true,
        isOverdue: true,
        isCompleted: false,
        ageInDays: 40,
        createdAt: '2025-01-10T11:30:00Z',
        updatedAt: '2025-02-15T09:20:00Z',
        createdBy: 'Jessica Pearson',
        updatedBy: 'Mike Ross'
    },
    {
        id: 'matter-004',
        caseNumber: '2025-RE-0001',
        title: 'Downtown Office Lease Agreement',
        description: 'Commercial lease negotiation for 5,000 sq ft office space. Complex terms regarding renovation allowances and renewal options.',
        clientName: 'Metro Business Solutions',
        clientContact: 'ceo@metrobusiness.com',
        opposingParty: 'Downtown Properties LLC',
        courtName: '',
        status: 'DRAFT',
        priority: 'LOW',
        filingDate: '',
        estimatedCompletionDate: '2025-04-01',
        assignedLawyerId: 'lawyer-004',
        assignedLawyerName: 'Louis Litt',
        assignedClerkId: 'clerk-003',
        assignedClerkName: 'Donna Paulsen',
        notes: 'Initial draft completed. Awaiting client review of key terms.',
        tags: ['real-estate', 'commercial', 'lease', 'negotiation'],
        isActive: true,
        isOverdue: false,
        isCompleted: false,
        ageInDays: 12,
        createdAt: '2025-02-07T13:45:00Z',
        updatedAt: '2025-02-18T11:10:00Z',
        createdBy: 'Louis Litt',
        updatedBy: 'Donna Paulsen'
    },
    {
        id: 'matter-005',
        caseNumber: '2025-CR-0001',
        title: 'Williams Corporate Restructuring',
        description: 'LLC formation and corporate restructuring for family business. Tax implications and succession planning included.',
        clientName: 'Williams Family Enterprises',
        clientContact: 'patriarch@williams-family.com',
        opposingParty: '',
        courtName: 'Business Court',
        status: 'COMPLETED',
        priority: 'MEDIUM',
        filingDate: '2024-12-01',
        estimatedCompletionDate: '2025-02-01',
        assignedLawyerId: 'lawyer-001',
        assignedLawyerName: 'Sarah Connor',
        assignedClerkId: 'clerk-001',
        assignedClerkName: 'Mike Ross',
        notes: 'All documents filed successfully. Client very satisfied with outcome.',
        tags: ['corporate', 'restructuring', 'tax', 'succession'],
        isActive: false,
        isOverdue: false,
        isCompleted: true,
        ageInDays: 80,
        createdAt: '2024-12-01T08:00:00Z',
        updatedAt: '2025-02-01T17:30:00Z',
        createdBy: 'Sarah Connor',
        updatedBy: 'Sarah Connor'
    },
    {
        id: 'matter-006',
        caseNumber: '2025-IP-0001',
        title: 'TechStart Trademark Registration',
        description: 'Trademark application for new startup\'s brand and logo. Includes comprehensive trademark search and filing.',
        clientName: 'TechStart Innovation Inc.',
        clientContact: 'legal@techstart.io',
        opposingParty: '',
        courtName: 'USPTO',
        status: 'ON_HOLD',
        priority: 'MEDIUM',
        filingDate: '2025-01-20',
        estimatedCompletionDate: '2025-08-20',
        assignedLawyerId: 'lawyer-002',
        assignedLawyerName: 'Harvey Specter',
        assignedClerkId: 'clerk-002',
        assignedClerkName: 'Rachel Zane',
        notes: 'On hold pending resolution of similar trademark dispute. Monitoring closely.',
        tags: ['intellectual-property', 'trademark', 'startup', 'uspto'],
        isActive: true,
        isOverdue: false,
        isCompleted: false,
        ageInDays: 29,
        createdAt: '2025-01-20T14:20:00Z',
        updatedAt: '2025-02-10T10:15:00Z',
        createdBy: 'Harvey Specter',
        updatedBy: 'Rachel Zane'
    }
]

// Demo board configuration
const DEMO_BOARD: KanbanBoard = {
    id: 'demo-board',
    title: 'Aster Management - Legal Matters Demo',
    columns: DEFAULT_COLUMNS,
    matters: DEMO_MATTERS,
    lastUpdated: new Date().toISOString()
}

// Demo metrics based on mock data
const DEMO_METRICS: BoardMetrics = {
    totalMatters: DEMO_MATTERS.length,
    activeMatters: DEMO_MATTERS.filter(m => m.isActive).length,
    completedMatters: DEMO_MATTERS.filter(m => m.isCompleted).length,
    overdueMatters: DEMO_MATTERS.filter(m => m.isOverdue).length,
    averageCompletionTime: 45, // days
    matterstByStatus: DEMO_MATTERS.reduce((acc, matter) => {
        acc[matter.status] = (acc[matter.status] || 0) + 1
        return acc
    }, {} as Record<string, number>),
    mattersByPriority: DEMO_MATTERS.reduce((acc, matter) => {
        acc[matter.priority] = (acc[matter.priority] || 0) + 1
        return acc
    }, {} as Record<string, number>),
    mattersByAssigned: DEMO_MATTERS.reduce((acc, matter) => {
        const lawyer = matter.assignedLawyerName
        if (lawyer) {
            acc[lawyer] = (acc[lawyer] || 0) + 1
        }
        return acc
    }, {} as Record<string, number>),
    recentActivity: [
        { id: '1', type: 'UPDATE', description: 'Thompson case updated with new notes', timestamp: new Date() },
        { id: '2', type: 'CREATE', description: 'New trademark matter created', timestamp: new Date(Date.now() - 1000 * 60 * 30) },
        { id: '3', type: 'STATUS_CHANGE', description: 'Williams matter marked as completed', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2) }
    ]
}

// Data generators for testing
export const demoDataGenerators = {
    /**
     * Generate a random matter for testing
     */
    generateRandomMatter: (overrides?: Partial<MatterCard>): MatterCard => {
        const statuses: MatterStatus[] = ['DRAFT', 'IN_PROGRESS', 'UNDER_REVIEW', 'AWAITING_CLIENT', 'COMPLETED', 'ON_HOLD', 'CLOSED']
        const priorities: MatterPriority[] = ['LOW', 'MEDIUM', 'HIGH', 'URGENT']
        const lawyers = ['Sarah Connor', 'Harvey Specter', 'Jessica Pearson', 'Louis Litt']
        const clerks = ['Mike Ross', 'Rachel Zane', 'Donna Paulsen']
        const matterTypes = ['Contract', 'Personal Injury', 'Divorce', 'Real Estate', 'Corporate', 'Intellectual Property']
        
        const randomStatus = statuses[Math.floor(Math.random() * statuses.length)]
        const randomPriority = priorities[Math.floor(Math.random() * priorities.length)]
        const randomLawyer = lawyers[Math.floor(Math.random() * lawyers.length)]
        const randomClerk = clerks[Math.floor(Math.random() * clerks.length)]
        const randomType = matterTypes[Math.floor(Math.random() * matterTypes.length)]
        
        const baseId = Math.random().toString(36).substr(2, 9)
        const now = new Date()
        const createdAt = new Date(now.getTime() - Math.random() * 90 * 24 * 60 * 60 * 1000) // Up to 90 days ago
        
        return {
            id: `matter-${baseId}`,
            caseNumber: `2025-${randomType.substring(0, 2).toUpperCase()}-${Math.floor(Math.random() * 9999).toString().padStart(4, '0')}`,
            title: `${randomType} Matter - ${baseId}`,
            description: `Generated demo matter for ${randomType.toLowerCase()} case`,
            clientName: `Demo Client ${baseId}`,
            clientContact: `client-${baseId}@example.com`,
            opposingParty: Math.random() > 0.5 ? `Opposing Party ${baseId}` : '',
            courtName: Math.random() > 0.3 ? `Demo Court ${Math.floor(Math.random() * 10)}` : '',
            status: randomStatus,
            priority: randomPriority,
            filingDate: Math.random() > 0.3 ? createdAt.toISOString().split('T')[0] : '',
            estimatedCompletionDate: new Date(createdAt.getTime() + Math.random() * 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            assignedLawyerId: `lawyer-${Math.floor(Math.random() * 4) + 1}`,
            assignedLawyerName: randomLawyer,
            assignedClerkId: `clerk-${Math.floor(Math.random() * 3) + 1}`,
            assignedClerkName: randomClerk,
            notes: `Demo notes for ${randomType.toLowerCase()} matter`,
            tags: [randomType.toLowerCase(), 'demo', 'generated'],
            isActive: randomStatus !== 'COMPLETED' && randomStatus !== 'CLOSED',
            isOverdue: Math.random() > 0.8,
            isCompleted: randomStatus === 'COMPLETED',
            ageInDays: Math.floor((now.getTime() - createdAt.getTime()) / (24 * 60 * 60 * 1000)),
            createdAt: createdAt.toISOString(),
            updatedAt: new Date(createdAt.getTime() + Math.random() * (now.getTime() - createdAt.getTime())).toISOString(),
            createdBy: randomLawyer,
            updatedBy: Math.random() > 0.5 ? randomLawyer : randomClerk,
            ...overrides
        }
    },

    /**
     * Generate multiple random matters
     */
    generateRandomMatters: (count: number, overrides?: Partial<MatterCard>): MatterCard[] => {
        return Array.from({ length: count }, () => demoDataGenerators.generateRandomMatter(overrides))
    },

    /**
     * Generate demo board with random data
     */
    generateDemoBoard: (matterCount: number = 20): KanbanBoard => {
        const matters = demoDataGenerators.generateRandomMatters(matterCount)
        return {
            id: `demo-board-${Date.now()}`,
            title: `Demo Board - ${new Date().toLocaleDateString()}`,
            columns: DEFAULT_COLUMNS,
            matters,
            lastUpdated: new Date().toISOString()
        }
    }
}

// Development utilities
export const devUtils = {
    /**
     * Get demo data by category
     */
    getDemoData: (category: 'all' | 'active' | 'completed' | 'overdue' = 'all') => {
        switch (category) {
            case 'active':
                return DEMO_MATTERS.filter(m => m.isActive)
            case 'completed':
                return DEMO_MATTERS.filter(m => m.isCompleted)
            case 'overdue':
                return DEMO_MATTERS.filter(m => m.isOverdue)
            default:
                return DEMO_MATTERS
        }
    },

    /**
     * Get matters by status for testing
     */
    getMattersByStatus: (status: MatterStatus) => {
        return DEMO_MATTERS.filter(m => m.status === status)
    },

    /**
     * Get matters by priority for testing
     */
    getMattersByPriority: (priority: MatterPriority) => {
        return DEMO_MATTERS.filter(m => m.priority === priority)
    },

    /**
     * Reset demo data to original state
     */
    resetDemoData: () => {
        return [...DEMO_MATTERS]
    }
}

// Mock API responses for development
export const mockApiResponses = {
    /**
     * Mock paginated matter response
     */
    getMattersResponse: (page: number = 0, size: number = 10) => ({
        content: DEMO_MATTERS.slice(page * size, (page + 1) * size),
        pageable: {
            sort: { sorted: false, unsorted: true, empty: true },
            pageNumber: page,
            pageSize: size,
            offset: page * size,
            paged: true,
            unpaged: false
        },
        totalElements: DEMO_MATTERS.length,
        totalPages: Math.ceil(DEMO_MATTERS.length / size),
        last: (page + 1) * size >= DEMO_MATTERS.length,
        first: page === 0,
        numberOfElements: Math.min(size, DEMO_MATTERS.length - page * size),
        size,
        number: page,
        sort: { sorted: false, unsorted: true, empty: true },
        empty: DEMO_MATTERS.length === 0
    }),

    /**
     * Mock search response
     */
    searchMattersResponse: (query: string, maxResults: number = 10) => {
        const filtered = DEMO_MATTERS.filter(matter =>
            matter.title.toLowerCase().includes(query.toLowerCase()) ||
            matter.clientName.toLowerCase().includes(query.toLowerCase()) ||
            matter.caseNumber.toLowerCase().includes(query.toLowerCase())
        ).slice(0, maxResults)

        return {
            content: filtered.map(matter => ({
                ...matter,
                relevanceScore: Math.random() * 100,
                highlights: query ? [query] : []
            })),
            totalElements: filtered.length,
            query,
            searchType: 'FUZZY' as const
        }
    }
}

// Export static demo data
export const DEMO_DATA = {
    matters: DEMO_MATTERS,
    board: DEMO_BOARD,
    metrics: DEMO_METRICS,
    viewPreferences: DEFAULT_VIEW_PREFERENCES,
    filters: DEFAULT_FILTERS,
    sorting: DEFAULT_SORTING
} as const

// Export all utilities
export const kanbanDemoData = {
    data: DEMO_DATA,
    generators: demoDataGenerators,
    dev: devUtils,
    mockApi: mockApiResponses
}

export default kanbanDemoData