import { defineEventHandler, getRouterParam, setHeader } from 'h3'

/**
 * GET /api/receipts/[id]/image
 * 
 * Serve full-size receipt image.
 * Returns a larger placeholder SVG for demo purposes.
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
    // Set appropriate headers for image response
    setHeader(event, 'Content-Type', 'image/svg+xml')
    setHeader(event, 'Cache-Control', 'public, max-age=86400') // Cache for 24 hours
    setHeader(event, 'Access-Control-Allow-Origin', '*')

    // Generate a deterministic color and content based on receipt ID
    const colorHue = parseInt(receiptId.slice(-4), 16) % 360
    const receiptType = ['restaurant', 'taxi', 'hotel', 'office', 'cafe'][parseInt(receiptId.slice(-2), 16) % 5]

    // Create a larger, more detailed receipt SVG
    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="600" height="800" viewBox="0 0 600 800" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="paperGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#ffffff;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#f8f9fa;stop-opacity:1" />
    </linearGradient>
    <pattern id="paperTexture" patternUnits="userSpaceOnUse" width="4" height="4">
      <rect width="4" height="4" fill="#ffffff"/>
      <circle cx="2" cy="2" r="0.3" fill="#f0f0f0" opacity="0.3"/>
    </pattern>
  </defs>
  
  <!-- Paper background -->
  <rect width="500" height="700" x="50" y="50" fill="url(#paperGradient)" stroke="#e0e0e0" stroke-width="1" rx="8"/>
  <rect width="500" height="700" x="50" y="50" fill="url(#paperTexture)" rx="8"/>
  
  <!-- Header section -->
  <rect width="450" height="80" x="75" y="80" fill="hsl(${colorHue}, 40%, 95%)" rx="4"/>
  
  <!-- Store name -->
  <text x="300" y="110" text-anchor="middle" font-family="serif" font-size="24" font-weight="bold" fill="hsl(${colorHue}, 60%, 30%)">
    ${getStoreName(receiptType)}
  </text>
  
  <!-- Store address -->
  <text x="300" y="135" text-anchor="middle" font-family="sans-serif" font-size="14" fill="hsl(${colorHue}, 40%, 40%)">
    東京都渋谷区渋谷1-1-1
  </text>
  <text x="300" y="155" text-anchor="middle" font-family="sans-serif" font-size="14" fill="hsl(${colorHue}, 40%, 40%)">
    TEL: 03-1234-5678
  </text>
  
  <!-- Receipt details -->
  <g transform="translate(100, 200)">
    <!-- Date and time -->
    <text x="0" y="20" font-family="monospace" font-size="16" fill="#333">
      日時: 2024/01/15 12:30
    </text>
    
    <!-- Receipt number -->
    <text x="0" y="45" font-family="monospace" font-size="16" fill="#333">
      領収書No: ${receiptId.slice(-8)}
    </text>
    
    <!-- Separator line -->
    <line x1="0" y1="65" x2="400" y2="65" stroke="#ccc" stroke-width="1"/>
    
    <!-- Items -->
    ${getReceiptItems(receiptType, colorHue)}
    
    <!-- Total section -->
    <g transform="translate(0, 400)">
      <line x1="250" y1="0" x2="400" y2="0" stroke="#333" stroke-width="2"/>
      <text x="250" y="25" font-family="sans-serif" font-size="18" font-weight="bold" fill="#333">合計</text>
      <text x="400" y="25" text-anchor="end" font-family="monospace" font-size="18" font-weight="bold" fill="#333">
        ¥${getReceiptTotal(receiptType)}
      </text>
    </g>
    
    <!-- Payment method -->
    <text x="0" y="470" font-family="sans-serif" font-size="14" fill="#666">
      お支払い: 現金
    </text>
    
    <!-- Thank you message -->
    <text x="200" y="520" text-anchor="middle" font-family="sans-serif" font-size="16" fill="hsl(${colorHue}, 50%, 40%)">
      ありがとうございました
    </text>
  </g>
  
  <!-- Receipt stamp/seal -->
  <circle cx="450" cy="650" r="40" fill="none" stroke="hsl(${colorHue}, 60%, 50%)" stroke-width="2"/>
  <text x="450" y="650" text-anchor="middle" font-family="serif" font-size="12" fill="hsl(${colorHue}, 60%, 50%)">領収</text>
  <text x="450" y="665" text-anchor="middle" font-family="serif" font-size="10" fill="hsl(${colorHue}, 60%, 50%)">済</text>
  
  <!-- QR code placeholder -->
  <rect width="60" height="60" x="120" y="670" fill="#333" rx="4"/>
  <rect width="50" height="50" x="125" y="675" fill="white" rx="2"/>
  <g transform="translate(130, 680)" fill="#333">
    <rect width="5" height="5" x="0" y="0"/>
    <rect width="5" height="5" x="10" y="0"/>
    <rect width="5" height="5" x="20" y="0"/>
    <rect width="5" height="5" x="35" y="0"/>
    <rect width="5" height="5" x="0" y="10"/>
    <rect width="5" height="5" x="35" y="10"/>
    <rect width="5" height="5" x="15" y="15"/>
    <rect width="5" height="5" x="25" y="15"/>
    <rect width="5" height="5" x="0" y="35"/>
    <rect width="5" height="5" x="10" y="35"/>
    <rect width="5" height="5" x="20" y="35"/>
    <rect width="5" height="5" x="35" y="35"/>
  </g>
</svg>`

    console.log(`Serving full image for receipt: ${receiptId} (${receiptType})`)

    // In real implementation, would:
    // 1. Check if receipt exists
    // 2. Verify user permissions
    // 3. Serve actual image from object storage
    // 4. Handle different image formats (JPEG, PNG, etc.)
    // 5. Implement proper content-disposition headers for downloads

    return svg

  } catch (error) {
    console.error('Failed to serve receipt image:', error)
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to serve image'
    })
  }
})

function getStoreName(type: string): string {
  switch (type) {
    case 'restaurant': return 'レストラン山田'
    case 'taxi': return '東京タクシー株式会社'
    case 'hotel': return 'ホテル東京'
    case 'office': return 'オフィス用品店'
    case 'cafe': return 'カフェ・ド・パリ'
    default: return 'お店の名前'
  }
}

function getReceiptItems(type: string, colorHue: number): string {
  const itemColor = `hsl(${colorHue}, 30%, 50%)`
  
  switch (type) {
    case 'restaurant':
      return `
        <text x="0" y="100" font-family="sans-serif" font-size="16" fill="${itemColor}">ランチセット</text>
        <text x="400" y="100" text-anchor="end" font-family="monospace" font-size="16" fill="${itemColor}">¥1,200</text>
        <text x="0" y="125" font-family="sans-serif" font-size="16" fill="${itemColor}">ドリンク</text>
        <text x="400" y="125" text-anchor="end" font-family="monospace" font-size="16" fill="${itemColor}">¥300</text>
        <text x="0" y="150" font-family="sans-serif" font-size="14" fill="#666">消費税 (10%)</text>
        <text x="400" y="150" text-anchor="end" font-family="monospace" font-size="14" fill="#666">¥150</text>
      `
    case 'taxi':
      return `
        <text x="0" y="100" font-family="sans-serif" font-size="16" fill="${itemColor}">乗車料金</text>
        <text x="400" y="100" text-anchor="end" font-family="monospace" font-size="16" fill="${itemColor}">¥850</text>
        <text x="0" y="125" font-family="sans-serif" font-size="14" fill="#666">乗車区間: 渋谷駅〜六本木</text>
      `
    case 'hotel':
      return `
        <text x="0" y="100" font-family="sans-serif" font-size="16" fill="${itemColor}">宿泊料金</text>
        <text x="400" y="100" text-anchor="end" font-family="monospace" font-size="16" fill="${itemColor}">¥8,500</text>
        <text x="0" y="125" font-family="sans-serif" font-size="16" fill="${itemColor}">サービス料</text>
        <text x="400" y="125" text-anchor="end" font-family="monospace" font-size="16" fill="${itemColor}">¥850</text>
        <text x="0" y="150" font-family="sans-serif" font-size="14" fill="#666">1泊 / シングルルーム</text>
      `
    case 'office':
      return `
        <text x="0" y="100" font-family="sans-serif" font-size="16" fill="${itemColor}">ボールペン (5本)</text>
        <text x="400" y="100" text-anchor="end" font-family="monospace" font-size="16" fill="${itemColor}">¥250</text>
        <text x="0" y="125" font-family="sans-serif" font-size="16" fill="${itemColor}">ノート (3冊)</text>
        <text x="400" y="125" text-anchor="end" font-family="monospace" font-size="16" fill="${itemColor}">¥450</text>
        <text x="0" y="150" font-family="sans-serif" font-size="14" fill="#666">消費税 (10%)</text>
        <text x="400" y="150" text-anchor="end" font-family="monospace" font-size="14" fill="#666">¥70</text>
      `
    case 'cafe':
      return `
        <text x="0" y="100" font-family="sans-serif" font-size="16" fill="${itemColor}">コーヒー</text>
        <text x="400" y="100" text-anchor="end" font-family="monospace" font-size="16" fill="${itemColor}">¥380</text>
        <text x="0" y="125" font-family="sans-serif" font-size="16" fill="${itemColor}">ケーキ</text>
        <text x="400" y="125" text-anchor="end" font-family="monospace" font-size="16" fill="${itemColor}">¥520</text>
        <text x="0" y="150" font-family="sans-serif" font-size="14" fill="#666">消費税 (10%)</text>
        <text x="400" y="150" text-anchor="end" font-family="monospace" font-size="14" fill="#666">¥90</text>
      `
    default:
      return `
        <text x="0" y="100" font-family="sans-serif" font-size="16" fill="${itemColor}">商品</text>
        <text x="400" y="100" text-anchor="end" font-family="monospace" font-size="16" fill="${itemColor}">¥1,000</text>
      `
  }
}

function getReceiptTotal(type: string): string {
  switch (type) {
    case 'restaurant': return '1,650'
    case 'taxi': return '850'
    case 'hotel': return '9,350'
    case 'office': return '770'
    case 'cafe': return '990'
    default: return '1,000'
  }
}