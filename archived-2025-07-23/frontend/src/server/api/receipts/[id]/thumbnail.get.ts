import { defineEventHandler, getRouterParam, setHeader } from 'h3'

/**
 * GET /api/receipts/[id]/thumbnail
 * 
 * Serve receipt thumbnail image.
 * Returns a placeholder SVG for demo purposes.
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
    setHeader(event, 'Cache-Control', 'public, max-age=3600') // Cache for 1 hour
    setHeader(event, 'Access-Control-Allow-Origin', '*')

    // Generate a deterministic color based on receipt ID
    const colorHue = parseInt(receiptId.slice(-4), 16) % 360

    // Create a placeholder receipt thumbnail SVG
    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="200" height="200" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="receiptGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:hsl(${colorHue}, 60%, 90%);stop-opacity:1" />
      <stop offset="100%" style="stop-color:hsl(${colorHue}, 60%, 80%);stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- Receipt background -->
  <rect width="160" height="180" x="20" y="10" fill="url(#receiptGradient)" stroke="hsl(${colorHue}, 40%, 60%)" stroke-width="1" rx="4"/>
  
  <!-- Receipt header -->
  <rect width="140" height="20" x="30" y="20" fill="hsl(${colorHue}, 50%, 70%)" rx="2"/>
  
  <!-- Receipt lines -->
  <rect width="120" height="3" x="30" y="50" fill="hsl(${colorHue}, 30%, 60%)" rx="1"/>
  <rect width="100" height="3" x="30" y="60" fill="hsl(${colorHue}, 30%, 60%)" rx="1"/>
  <rect width="80" height="3" x="30" y="70" fill="hsl(${colorHue}, 30%, 60%)" rx="1"/>
  <rect width="90" height="3" x="30" y="80" fill="hsl(${colorHue}, 30%, 60%)" rx="1"/>
  
  <!-- Amount section -->
  <rect width="60" height="12" x="110" y="100" fill="hsl(${colorHue}, 60%, 75%)" rx="2"/>
  
  <!-- Date section -->
  <rect width="80" height="8" x="30" y="120" fill="hsl(${colorHue}, 30%, 65%)" rx="1"/>
  
  <!-- Receipt footer -->
  <rect width="120" height="6" x="30" y="140" fill="hsl(${colorHue}, 30%, 70%)" rx="1"/>
  <rect width="100" height="6" x="30" y="150" fill="hsl(${colorHue}, 30%, 70%)" rx="1"/>
  
  <!-- Receipt icon overlay -->
  <g transform="translate(85, 160)" fill="hsl(${colorHue}, 40%, 50%)" opacity="0.7">
    <path d="M0 0 L8 0 L8 2 L0 2 Z"/>
    <path d="M10 0 L18 0 L18 2 L10 2 Z"/>
    <path d="M0 4 L12 4 L12 6 L0 6 Z"/>
    <path d="M14 4 L20 4 L20 6 L14 6 Z"/>
  </g>
  
  <!-- Receipt ID text -->
  <text x="100" y="195" text-anchor="middle" font-family="monospace" font-size="8" fill="hsl(${colorHue}, 50%, 40%)">
    ${receiptId.slice(-8)}
  </text>
</svg>`

    console.log(`Serving thumbnail for receipt: ${receiptId}`)

    // In real implementation, would:
    // 1. Check if receipt exists
    // 2. Verify user permissions
    // 3. Serve actual thumbnail from object storage
    // 4. Generate thumbnail on-demand if not exists
    // 5. Implement proper caching headers

    return svg

  } catch (error) {
    console.error('Failed to serve receipt thumbnail:', error)
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to serve thumbnail'
    })
  }
})