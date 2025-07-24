import { defineEventHandler, getRouterParam, readBody } from 'h3'

/**
 * POST /api/receipts/[id]/ocr
 * 
 * Process OCR for a specific receipt.
 * Simulates OCR processing with mock results.
 */

export default defineEventHandler(async (event) => {
  const receiptId = getRouterParam(event, 'id')
  
  if (!receiptId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Receipt ID is required'
    })
  }

  try {
    const body = await readBody(event)
    
    const {
      priority = 'normal',
      options = {}
    } = body

    const {
      extractAmount = true,
      extractDate = true,
      extractVendor = true,
      extractLineItems = false,
      language = 'auto',
      confidence = 0.7
    } = options

    // Mock receipt lookup
    const receipt = {
      id: receiptId,
      originalFilename: 'receipt-example.jpg',
      mimeType: 'image/jpeg',
      ocrStatus: 'PENDING'
    }

    if (!receipt) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Receipt not found'
      })
    }

    console.log('Starting OCR processing for receipt:', {
      id: receiptId,
      filename: receipt.originalFilename,
      priority,
      options
    })

    // Simulate processing delay
    const processingTime = Math.random() * 3000 + 1000 // 1-4 seconds

    await new Promise(resolve => setTimeout(resolve, Math.min(processingTime, 1000))) // Cap at 1s for demo

    // Mock OCR results based on receipt filename patterns
    let mockResult: any = {
      receiptId,
      text: '',
      confidence: 0.85 + Math.random() * 0.1, // 0.85-0.95
      processingTime: Math.round(processingTime),
      extractedData: {},
      rawData: {
        processingDetails: {
          language: language === 'auto' ? 'ja' : language,
          confidence,
          extractOptions: options
        }
      }
    }

    // Generate mock OCR text and extracted data based on common receipt patterns
    const mockPatterns = [
      {
        text: 'レストラン山田\n東京都渋谷区渋谷1-1-1\nランチセット ¥1,200\n消費税 ¥120\n合計 ¥1,320\n2024/01/15 12:30\nありがとうございました',
        vendor: 'レストラン山田',
        amount: 1320,
        date: '2024-01-15'
      },
      {
        text: 'タクシー領収書\n東京タクシー株式会社\n乗車区間: 渋谷駅〜六本木\n料金: ¥850\n2024/01/14 18:20',
        vendor: '東京タクシー株式会社',
        amount: 850,
        date: '2024-01-14'
      },
      {
        text: 'ホテル東京\n宿泊料金 ¥8,500\nサービス料 ¥850\n合計 ¥9,350\n2024/01/13\nチェックアウト',
        vendor: 'ホテル東京',
        amount: 9350,
        date: '2024-01-13'
      },
      {
        text: 'コンビニ領収書\nローソン渋谷店\n文房具 ¥450\n飲み物 ¥150\n合計 ¥600\n2024/01/12 14:30',
        vendor: 'ローソン渋谷店',
        amount: 600,
        date: '2024-01-12'
      },
      {
        text: 'カフェ・ド・パリ\nコーヒー ¥380\nケーキ ¥520\n小計 ¥900\n税込 ¥990\n2024/01/11 09:45',
        vendor: 'カフェ・ド・パリ',
        amount: 990,
        date: '2024-01-11'
      }
    ]

    // Select random pattern or use hash-based selection for consistency
    const patternIndex = parseInt(receiptId.slice(-1), 16) % mockPatterns.length
    const pattern = mockPatterns[patternIndex]

    mockResult.text = pattern.text

    if (extractVendor && pattern.vendor) {
      mockResult.extractedVendor = pattern.vendor
    }

    if (extractAmount && pattern.amount) {
      mockResult.extractedAmount = pattern.amount
    }

    if (extractDate && pattern.date) {
      mockResult.extractedDate = pattern.date
    }

    if (extractLineItems) {
      // Extract line items from text (simplified)
      const lines = pattern.text.split('\n')
      const lineItems = lines
        .filter(line => line.includes('¥') && !line.includes('合計') && !line.includes('小計'))
        .map(line => {
          const match = line.match(/(.+?)\s*¥(\d+(?:,\d+)*)/)
          if (match) {
            return {
              description: match[1].trim(),
              amount: parseInt(match[2].replace(/,/g, '')),
              quantity: 1
            }
          }
          return null
        })
        .filter(item => item !== null)

      if (lineItems.length > 0) {
        mockResult.extractedData.lineItems = lineItems
      }
    }

    // Add merchant info if extracting vendor
    if (extractVendor && pattern.vendor) {
      mockResult.extractedData.merchantInfo = {
        name: pattern.vendor,
        address: '東京都渋谷区',
        phone: '03-1234-5678'
      }
    }

    // Simulate occasional failures
    if (Math.random() < 0.05) { // 5% failure rate
      throw createError({
        statusCode: 422,
        statusMessage: 'OCR processing failed: Unable to extract text from image'
      })
    }

    console.log('OCR processing completed:', {
      id: receiptId,
      confidence: mockResult.confidence,
      extractedAmount: mockResult.extractedAmount,
      extractedVendor: mockResult.extractedVendor,
      processingTime: mockResult.processingTime
    })

    return mockResult

  } catch (error: any) {
    console.error('OCR processing failed:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'OCR processing failed'
    })
  }
})