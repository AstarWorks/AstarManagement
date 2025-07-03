/**
 * Financial Data Download API Endpoint
 * 
 * Serves exported financial files for download.
 * In a real implementation, this would serve actual generated files.
 */

export default defineEventHandler(async (event) => {
  const filename = getRouterParam(event, 'filename')
  
  if (!filename) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Filename is required'
    })
  }
  
  // Extract file extension
  const extension = filename.split('.').pop()?.toLowerCase()
  
  // Validate file extension
  if (!extension || !['csv', 'json', 'pdf'].includes(extension)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid file format'
    })
  }
  
  // Simulate file existence check
  if (Math.random() < 0.1) { // 10% chance file not found
    throw createError({
      statusCode: 404,
      statusMessage: 'File not found or has expired'
    })
  }
  
  // Generate mock file content based on format
  const content = generateMockFileContent(extension)
  const contentType = getContentType(extension)
  
  // Set appropriate headers
  setHeader(event, 'Content-Type', contentType)
  setHeader(event, 'Content-Disposition', `attachment; filename="${filename}"`)
  setHeader(event, 'Content-Length', content.length.toString())
  setHeader(event, 'Cache-Control', 'no-cache, no-store, must-revalidate')
  
  return content
})

function generateMockFileContent(format: string): string | Buffer {
  const timestamp = new Date().toISOString()
  
  switch (format) {
    case 'csv':
      return generateMockCSV()
    case 'json':
      return generateMockJSON()
    case 'pdf':
      return generateMockPDF()
    default:
      throw createError({
        statusCode: 400,
        statusMessage: 'Unsupported file format'
      })
  }
}

function generateMockCSV(): string {
  const headers = ['Date', 'Category', 'Matter', 'Lawyer', 'Amount', 'Description']
  const rows = [
    ['2024-01-15', 'Legal Research', 'Corporate Merger - ABC Corp', 'Tanaka, Hiroshi', '¥125,000', 'Case law research for merger agreement'],
    ['2024-01-16', 'Court Fees', 'Patent Dispute - XYZ Inc', 'Sato, Yuki', '¥45,000', 'Filing fees for patent application'],
    ['2024-01-17', 'Travel', 'Litigation - GHI Corp', 'Yamamoto, Kenji', '¥78,000', 'Business trip to Tokyo court'],
    ['2024-01-18', 'Technology', 'Contract Review - DEF Ltd', 'Tanaka, Hiroshi', '¥32,000', 'Legal database subscription'],
    ['2024-01-19', 'Office Supplies', 'Corporate Merger - ABC Corp', 'Sato, Yuki', '¥15,000', 'Document printing and binding'],
    ['2024-01-20', 'Legal Research', 'Patent Dispute - XYZ Inc', 'Yamamoto, Kenji', '¥95,000', 'Prior art search and analysis'],
    ['2024-01-21', 'Court Fees', 'Litigation - GHI Corp', 'Tanaka, Hiroshi', '¥67,000', 'Expert witness fees'],
    ['2024-01-22', 'Travel', 'Contract Review - DEF Ltd', 'Sato, Yuki', '¥54,000', 'Client meeting in Osaka'],
    ['2024-01-23', 'Technology', 'Corporate Merger - ABC Corp', 'Yamamoto, Kenji', '¥28,000', 'Document management software'],
    ['2024-01-24', 'Legal Research', 'Litigation - GHI Corp', 'Tanaka, Hiroshi', '¥110,000', 'Regulatory compliance research']
  ]
  
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n')
  
  return csvContent
}

function generateMockJSON(): string {
  const data = {
    exportInfo: {
      generatedAt: new Date().toISOString(),
      format: 'JSON',
      version: '1.0',
      filters: {
        period: 'month',
        includeProjected: false
      }
    },
    summary: {
      totalExpenses: 1250000,
      totalRevenue: 2150000,
      profitMargin: 41.86,
      budgetUtilization: 83.33,
      billableHours: 1850,
      nonBillableHours: 420
    },
    expensesByCategory: {
      'Legal Research': 450000,
      'Court Fees': 280000,
      'Office Supplies': 120000,
      'Travel': 180000,
      'Technology': 220000
    },
    expensesByMatter: {
      'Corporate Merger - ABC Corp': 380000,
      'Patent Dispute - XYZ Inc': 295000,
      'Contract Review - DEF Ltd': 145000,
      'Litigation - GHI Corp': 430000
    },
    monthlyTrends: [
      { month: 'Jan', expenses: 95000, revenue: 165000, profit: 70000 },
      { month: 'Feb', expenses: 102000, revenue: 178000, profit: 76000 },
      { month: 'Mar', expenses: 98000, revenue: 172000, profit: 74000 },
      { month: 'Apr', expenses: 105000, revenue: 185000, profit: 80000 },
      { month: 'May', expenses: 110000, revenue: 190000, profit: 80000 },
      { month: 'Jun', expenses: 108000, revenue: 188000, profit: 80000 }
    ],
    transactions: [
      {
        id: 'txn_001',
        date: '2024-01-15',
        category: 'Legal Research',
        matter: 'Corporate Merger - ABC Corp',
        lawyer: 'Tanaka, Hiroshi',
        amount: 125000,
        description: 'Case law research for merger agreement',
        billable: true
      },
      {
        id: 'txn_002',
        date: '2024-01-16',
        category: 'Court Fees',
        matter: 'Patent Dispute - XYZ Inc',
        lawyer: 'Sato, Yuki',
        amount: 45000,
        description: 'Filing fees for patent application',
        billable: true
      }
      // ... more transactions would be included in a real export
    ]
  }
  
  return JSON.stringify(data, null, 2)
}

function generateMockPDF(): Buffer {
  // In a real implementation, you would use a PDF library like PDFKit or Puppeteer
  // For this mock, we'll return a minimal PDF structure
  const pdfContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
/Resources <<
/Font <<
/F1 <<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
>>
>>
>>
endobj

4 0 obj
<<
/Length 200
>>
stream
BT
/F1 12 Tf
50 750 Td
(Financial Report - ${new Date().toLocaleDateString()}) Tj
0 -20 Td
(This is a mock PDF export for demonstration purposes.) Tj
0 -20 Td
(In a real implementation, this would contain) Tj
0 -20 Td
(comprehensive financial charts and data.) Tj
ET
endstream
endobj

xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000344 00000 n 
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
595
%%EOF`
  
  return Buffer.from(pdfContent, 'utf8')
}

function getContentType(extension: string): string {
  switch (extension) {
    case 'csv':
      return 'text/csv; charset=utf-8'
    case 'json':
      return 'application/json; charset=utf-8'
    case 'pdf':
      return 'application/pdf'
    default:
      return 'application/octet-stream'
  }
}