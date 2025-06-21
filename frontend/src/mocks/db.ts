import { factory, primaryKey } from '@mswjs/data'
import { faker } from '@faker-js/faker'

export const db = factory({
  matter: {
    id: primaryKey(() => faker.string.uuid()),
    caseNumber: () => `2025-CV-${faker.number.int({ min: 1000, max: 9999 })}`,
    title: () => faker.company.catchPhrase(),
    description: () => faker.lorem.paragraph(),
    clientName: () => faker.person.fullName(),
    clientContact: () => faker.phone.number(),
    opposingParty: () => faker.company.name(),
    status: () => faker.helpers.arrayElement(['NEW', 'IN_PROGRESS', 'PENDING', 'COMPLETED', 'ARCHIVED']),
    priority: () => faker.helpers.arrayElement(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
    assignedLawyer: () => faker.person.fullName(),
    createdAt: () => faker.date.recent({ days: 30 }).toISOString(),
    updatedAt: () => faker.date.recent({ days: 7 }).toISOString(),
    dueDate: () => faker.date.future({ years: 1 }).toISOString(),
    courtDate: () => faker.datatype.boolean() ? faker.date.future({ years: 1 }).toISOString() : null,
    createdBy: () => 'mock-user',
    lastModifiedBy: () => 'mock-user',
    tags: () => faker.helpers.arrayElements(['litigation', 'contract', 'corporate', 'family', 'criminal', 'tax'], { min: 1, max: 3 }),
    documents: () => [],
    memos: () => [],
    activities: () => []
  },
  
  document: {
    id: primaryKey(() => faker.string.uuid()),
    matterId: () => faker.string.uuid(),
    fileName: () => `${faker.word.noun()}-${faker.number.int({ min: 100, max: 999 })}.pdf`,
    fileType: () => 'application/pdf',
    fileSize: () => faker.number.int({ min: 100000, max: 10000000 }),
    uploadedAt: () => faker.date.recent({ days: 10 }).toISOString(),
    uploadedBy: () => faker.person.fullName(),
    tags: () => faker.helpers.arrayElements(['evidence', 'contract', 'correspondence', 'filing', 'motion'], { min: 1, max: 2 }),
    description: () => faker.lorem.sentence()
  },
  
  memo: {
    id: primaryKey(() => faker.string.uuid()),
    matterId: () => faker.string.uuid(),
    type: () => faker.helpers.arrayElement(['CLIENT', 'INTERNAL']),
    subject: () => faker.lorem.sentence(),
    content: () => faker.lorem.paragraphs(2),
    createdAt: () => faker.date.recent({ days: 7 }).toISOString(),
    createdBy: () => faker.person.fullName(),
    isImportant: () => faker.datatype.boolean(),
    tags: () => faker.helpers.arrayElements(['phone-call', 'meeting', 'email', 'research', 'court'], { min: 1, max: 2 })
  },
  
  expense: {
    id: primaryKey(() => faker.string.uuid()),
    matterId: () => faker.string.uuid(),
    type: () => faker.helpers.arrayElement(['EXPENSE', 'PER_DIEM']),
    category: () => faker.helpers.arrayElement(['travel', 'filing', 'research', 'expert', 'misc']),
    amount: () => parseFloat(faker.finance.amount({ min: 50, max: 5000, dec: 2 })),
    currency: () => 'JPY',
    date: () => faker.date.recent({ days: 30 }).toISOString(),
    description: () => faker.lorem.sentence(),
    receiptUrl: () => faker.datatype.boolean() ? faker.image.url() : null,
    createdBy: () => faker.person.fullName(),
    createdAt: () => faker.date.recent({ days: 7 }).toISOString(),
    approvedBy: () => faker.datatype.boolean() ? faker.person.fullName() : null,
    approvedAt: () => faker.datatype.boolean() ? faker.date.recent({ days: 3 }).toISOString() : null
  }
})

// Seed initial data
function seedDatabase() {
  // Create 20 matters
  for (let i = 0; i < 20; i++) {
    const matter = db.matter.create()
    
    // Create 2-5 documents per matter
    const docCount = faker.number.int({ min: 2, max: 5 })
    for (let j = 0; j < docCount; j++) {
      db.document.create({ matterId: matter.id })
    }
    
    // Create 1-3 memos per matter
    const memoCount = faker.number.int({ min: 1, max: 3 })
    for (let j = 0; j < memoCount; j++) {
      db.memo.create({ matterId: matter.id })
    }
    
    // Create 0-4 expenses per matter
    const expenseCount = faker.number.int({ min: 0, max: 4 })
    for (let j = 0; j < expenseCount; j++) {
      db.expense.create({ matterId: matter.id })
    }
  }
}

// Initialize database with seed data
seedDatabase()