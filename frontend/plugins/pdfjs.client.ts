// PDF.js configuration for Nuxt
import * as pdfjsLib from 'pdfjs-dist'

export default defineNuxtPlugin(() => {
  // Configure PDF.js worker for client-side rendering
  if (process.client) {
    // Set the worker source for PDF.js
    pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js'
    
    // Configure PDF.js global options
    pdfjsLib.GlobalWorkerOptions.verbosity = pdfjsLib.VerbosityLevel.ERRORS
    
    // Enable text layer rendering
    pdfjsLib.GlobalWorkerOptions.isEvalSupported = false
    
    // Configure CMap URL for character mapping
    pdfjsLib.GlobalWorkerOptions.cMapUrl = '/cmaps/'
    pdfjsLib.GlobalWorkerOptions.cMapPacked = true
  }
})