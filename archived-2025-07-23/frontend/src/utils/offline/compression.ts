/**
 * Compression Utilities for Offline Storage
 * 
 * @description Provides compression and decompression functions for reducing
 * storage size in IndexedDB. Uses the native CompressionStream API when available
 * with fallback to a lightweight LZ-string implementation.
 * 
 * @author Claude
 * @created 2025-06-26
 */

/**
 * Check if native compression is available
 */
export function isCompressionStreamAvailable(): boolean {
  return typeof window !== 'undefined' && 
    'CompressionStream' in window && 
    'DecompressionStream' in window
}

/**
 * Compress a string using native compression or fallback
 */
export async function compress(data: string): Promise<string> {
  if (isCompressionStreamAvailable()) {
    try {
      // Use native compression
      const encoder = new TextEncoder()
      const stream = new CompressionStream('gzip')
      const writer = stream.writable.getWriter()
      writer.write(encoder.encode(data))
      writer.close()
      
      const compressed = await new Response(stream.readable).arrayBuffer()
      // Convert to base64 for storage
      return btoa(String.fromCharCode(...new Uint8Array(compressed)))
    } catch (error) {
      console.warn('Native compression failed, using fallback:', error)
      return compressFallback(data)
    }
  }
  
  return compressFallback(data)
}

/**
 * Decompress a string using native decompression or fallback
 */
export async function decompress(data: string): Promise<string> {
  if (isCompressionStreamAvailable()) {
    try {
      // Use native decompression
      const compressed = Uint8Array.from(atob(data), c => c.charCodeAt(0))
      const stream = new DecompressionStream('gzip')
      const writer = stream.writable.getWriter()
      writer.write(compressed)
      writer.close()
      
      const decompressed = await new Response(stream.readable).text()
      return decompressed
    } catch (error) {
      console.warn('Native decompression failed, using fallback:', error)
      return decompressFallback(data)
    }
  }
  
  return decompressFallback(data)
}

/**
 * Simple LZ-based compression fallback
 * This is a lightweight implementation for environments without CompressionStream
 */
function compressFallback(data: string): string {
  if (!data) return data
  
  const dict: Record<string, number> = {}
  const out: number[] = []
  let currentChar: string
  let phrase = data.charAt(0)
  let code = 256
  
  for (let i = 1; i < data.length; i++) {
    currentChar = data.charAt(i)
    if (dict[phrase + currentChar] != null) {
      phrase += currentChar
    } else {
      out.push(phrase.length > 1 ? dict[phrase] : phrase.charCodeAt(0))
      dict[phrase + currentChar] = code
      code++
      phrase = currentChar
    }
  }
  
  out.push(phrase.length > 1 ? dict[phrase] : phrase.charCodeAt(0))
  
  // Convert to base64
  const compressed = out.map(n => String.fromCharCode(n)).join('')
  return btoa(compressed)
}

/**
 * Simple LZ-based decompression fallback
 */
function decompressFallback(data: string): string {
  if (!data) return data
  
  try {
    const compressed = atob(data)
    const dict: Record<number, string> = {}
    const chars = compressed.split('')
    let currentChar = chars[0]
    let oldPhrase = currentChar
    const out = [currentChar]
    let code = 256
    let phrase: string
    
    for (let i = 1; i < chars.length; i++) {
      const currentCode = chars[i].charCodeAt(0)
      
      if (currentCode < 256) {
        phrase = chars[i]
      } else {
        phrase = dict[currentCode] || (oldPhrase + currentChar)
      }
      
      out.push(phrase)
      currentChar = phrase.charAt(0)
      dict[code] = oldPhrase + currentChar
      code++
      oldPhrase = phrase
    }
    
    return out.join('')
  } catch (error) {
    console.error('Decompression failed:', error)
    return data
  }
}

/**
 * Calculate compression ratio
 */
export function calculateCompressionRatio(original: string, compressed: string): number {
  const originalSize = new Blob([original]).size
  const compressedSize = new Blob([compressed]).size
  
  if (originalSize === 0) return 0
  
  return 1 - (compressedSize / originalSize)
}

/**
 * Determine if data should be compressed based on size and content
 */
export function shouldCompress(data: string, threshold: number = 1024): boolean {
  // Don't compress if below threshold
  if (new Blob([data]).size < threshold) {
    return false
  }
  
  // Don't compress if already looks compressed (high entropy)
  // Simple heuristic: check character variety
  const uniqueChars = new Set(data).size
  const entropy = uniqueChars / data.length
  
  // If entropy is very high, data might already be compressed
  if (entropy > 0.95) {
    return false
  }
  
  return true
}

/**
 * Compress with size check - only compress if it reduces size
 */
export async function compressIfBeneficial(data: string): Promise<{
  data: string
  compressed: boolean
  ratio?: number
}> {
  try {
    const compressed = await compress(data)
    const ratio = calculateCompressionRatio(data, compressed)
    
    // Only use compression if it saves at least 10%
    if (ratio > 0.1) {
      return {
        data: compressed,
        compressed: true,
        ratio
      }
    }
  } catch (error) {
    console.warn('Compression failed:', error)
  }
  
  return {
    data,
    compressed: false
  }
}