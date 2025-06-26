/**
 * Visual Regression Baseline Management Utility
 * 
 * This utility provides comprehensive baseline management for visual regression testing,
 * including baseline generation, comparison, approval workflows, and performance monitoring.
 */

import { promises as fs } from 'fs'
import path from 'path'
import { execSync } from 'child_process'
import { glob } from 'glob'

interface BaselineInfo {
  name: string
  path: string
  size: number
  created: Date
  lastModified: Date
  hash: string
  metadata?: {
    component?: string
    theme?: string
    breakpoint?: string
    browser?: string
  }
}

interface ComparisonResult {
  passed: boolean
  differences: number
  diffPercentage: number
  diffImagePath?: string
  threshold: number
}

interface BaselineReport {
  total: number
  updated: number
  new: number
  removed: number
  failed: number
  details: Array<{
    name: string
    status: 'updated' | 'new' | 'removed' | 'failed' | 'unchanged'
    reason?: string
  }>
}

export class BaselineManager {
  private baselinePath: string
  private currentPath: string
  private diffPath: string
  
  constructor(basePath = 'visual-tests') {
    this.baselinePath = path.join(basePath, 'baselines')
    this.currentPath = path.join(basePath, 'current')
    this.diffPath = path.join(basePath, 'diff')
  }
  
  /**
   * Initialize baseline directory structure
   */
  async initialize(): Promise<void> {
    const directories = [
      this.baselinePath,
      this.currentPath,
      this.diffPath,
      path.join(this.baselinePath, 'components'),
      path.join(this.baselinePath, 'pages'),
      path.join(this.baselinePath, 'responsive'),
      path.join(this.baselinePath, 'themes'),
      path.join(this.currentPath, 'components'),
      path.join(this.currentPath, 'pages'),
      path.join(this.currentPath, 'responsive'),
      path.join(this.currentPath, 'themes'),
      path.join(this.diffPath, 'components'),
      path.join(this.diffPath, 'pages'),
      path.join(this.diffPath, 'responsive'),
      path.join(this.diffPath, 'themes')
    ]
    
    for (const dir of directories) {
      await fs.mkdir(dir, { recursive: true })
    }
    
    // Create .gitkeep files for empty directories
    for (const dir of directories) {
      const gitkeepPath = path.join(dir, '.gitkeep')
      try {
        await fs.access(gitkeepPath)
      } catch {
        await fs.writeFile(gitkeepPath, '')
      }
    }
    
    console.log('✅ Baseline directory structure initialized')
  }
  
  /**
   * Get all baseline images with metadata
   */
  async getAllBaselines(): Promise<BaselineInfo[]> {
    const pattern = path.join(this.baselinePath, '**/*.png')
    const files = await glob(pattern)
    
    const baselines: BaselineInfo[] = []
    
    for (const file of files) {
      try {
        const stats = await fs.stat(file)
        const relativePath = path.relative(this.baselinePath, file)
        const name = path.basename(file, '.png')
        
        // Extract metadata from filename
        const metadata = this.parseMetadataFromFilename(name)
        
        // Calculate hash for change detection
        const hash = await this.calculateFileHash(file)
        
        baselines.push({
          name,
          path: relativePath,
          size: stats.size,
          created: stats.birthtime,
          lastModified: stats.mtime,
          hash,
          metadata
        })
      } catch (error) {
        console.warn(`Warning: Could not process baseline ${file}:`, error)
      }
    }
    
    return baselines.sort((a, b) => a.name.localeCompare(b.name))
  }
  
  /**
   * Generate initial baselines from current screenshots
   */
  async generateBaselines(options?: {
    force?: boolean
    pattern?: string
    dryRun?: boolean
  }): Promise<BaselineReport> {
    const { force = false, pattern = '**/*.png', dryRun = false } = options || {}
    
    console.log('🔄 Generating baselines from current screenshots...')
    
    const currentPattern = path.join(this.currentPath, pattern)
    const currentFiles = await glob(currentPattern)
    
    const report: BaselineReport = {
      total: currentFiles.length,
      updated: 0,
      new: 0,
      removed: 0,
      failed: 0,
      details: []
    }
    
    for (const currentFile of currentFiles) {
      const relativePath = path.relative(this.currentPath, currentFile)
      const baselineFile = path.join(this.baselinePath, relativePath)
      const name = path.basename(currentFile, '.png')
      
      try {
        // Check if baseline exists
        const baselineExists = await this.fileExists(baselineFile)
        
        if (baselineExists && !force) {
          report.details.push({
            name,
            status: 'unchanged',
            reason: 'Baseline exists, use --force to overwrite'
          })
          continue
        }
        
        if (!dryRun) {
          // Ensure directory exists
          await fs.mkdir(path.dirname(baselineFile), { recursive: true })
          
          // Copy current to baseline
          await fs.copyFile(currentFile, baselineFile)
        }
        
        if (baselineExists) {
          report.updated++
          report.details.push({
            name,
            status: 'updated',
            reason: 'Baseline overwritten'
          })
        } else {
          report.new++
          report.details.push({
            name,
            status: 'new',
            reason: 'New baseline created'
          })
        }
      } catch (error) {
        report.failed++
        report.details.push({
          name,
          status: 'failed',
          reason: `Error: ${error instanceof Error ? error.message : String(error)}`
        })
      }
    }
    
    if (!dryRun) {
      console.log('✅ Baseline generation complete')
    } else {
      console.log('📋 Dry run complete - no files were modified')
    }
    
    return report
  }
  
  /**
   * Compare current screenshots with baselines
   */
  async compareWithBaselines(options?: {
    threshold?: number
    generateDiffs?: boolean
    pattern?: string
  }): Promise<Array<{ name: string; result: ComparisonResult }>> {
    const { 
      threshold = 0.1, 
      generateDiffs = true, 
      pattern = '**/*.png' 
    } = options || {}
    
    console.log('🔍 Comparing current screenshots with baselines...')
    
    const currentPattern = path.join(this.currentPath, pattern)
    const currentFiles = await glob(currentPattern)
    
    const results: Array<{ name: string; result: ComparisonResult }> = []
    
    for (const currentFile of currentFiles) {
      const relativePath = path.relative(this.currentPath, currentFile)
      const baselineFile = path.join(this.baselinePath, relativePath)
      const name = path.basename(currentFile, '.png')
      
      if (!(await this.fileExists(baselineFile))) {
        results.push({
          name,
          result: {
            passed: false,
            differences: -1,
            diffPercentage: -1,
            threshold,
            diffImagePath: undefined
          }
        })
        continue
      }
      
      try {
        const comparison = await this.compareImages(
          baselineFile,
          currentFile,
          threshold,
          generateDiffs ? path.join(this.diffPath, relativePath) : undefined
        )
        
        results.push({ name, result: comparison })
      } catch (error) {
        console.error(`Error comparing ${name}:`, error)
        results.push({
          name,
          result: {
            passed: false,
            differences: -1,
            diffPercentage: -1,
            threshold,
            diffImagePath: undefined
          }
        })
      }
    }
    
    return results
  }
  
  /**
   * Generate approval workflow for visual changes
   */
  async generateApprovalWorkflow(comparisons: Array<{ name: string; result: ComparisonResult }>): Promise<void> {
    const failedComparisons = comparisons.filter(c => !c.result.passed)
    
    if (failedComparisons.length === 0) {
      console.log('✅ All visual comparisons passed - no approval needed')
      return
    }
    
    const approvalFile = path.join(this.diffPath, 'approval-required.json')
    const approvalData = {
      timestamp: new Date().toISOString(),
      totalFailed: failedComparisons.length,
      changes: failedComparisons.map(c => ({
        name: c.name,
        diffPercentage: c.result.diffPercentage,
        differences: c.result.differences,
        diffImagePath: c.result.diffImagePath
      }))
    }
    
    await fs.writeFile(approvalFile, JSON.stringify(approvalData, null, 2))
    
    // Generate HTML report for visual review
    const htmlReport = await this.generateHtmlApprovalReport(failedComparisons)
    const htmlFile = path.join(this.diffPath, 'approval-report.html')
    await fs.writeFile(htmlFile, htmlReport)
    
    console.log(`📋 Approval workflow generated:`)
    console.log(`   - Changes requiring review: ${failedComparisons.length}`)
    console.log(`   - Approval data: ${approvalFile}`)
    console.log(`   - HTML report: ${htmlFile}`)
  }
  
  /**
   * Clean up old screenshots and diffs
   */
  async cleanup(options?: {
    olderThanDays?: number
    keepRecent?: number
    cleanupDiffs?: boolean
  }): Promise<{ removed: number; freed: number }> {
    const { 
      olderThanDays = 7, 
      keepRecent = 10,
      cleanupDiffs = true 
    } = options || {}
    
    console.log('🧹 Cleaning up old visual test artifacts...')
    
    let removed = 0
    let freed = 0
    
    // Clean up current screenshots
    const currentFiles = await glob(path.join(this.currentPath, '**/*.png'))
    const cutoffDate = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000)
    
    // Sort by modification time, newest first
    const fileStats = await Promise.all(
      currentFiles.map(async file => ({
        file,
        stats: await fs.stat(file)
      }))
    )
    
    fileStats.sort((a, b) => b.stats.mtime.getTime() - a.stats.mtime.getTime())
    
    // Remove files older than cutoff, keeping recent ones
    for (let i = keepRecent; i < fileStats.length; i++) {
      const { file, stats } = fileStats[i]
      
      if (stats.mtime < cutoffDate) {
        try {
          freed += stats.size
          await fs.unlink(file)
          removed++
        } catch (error) {
          console.warn(`Warning: Could not remove ${file}:`, error)
        }
      }
    }
    
    // Clean up diff images if requested
    if (cleanupDiffs) {
      const diffFiles = await glob(path.join(this.diffPath, '**/*.png'))
      for (const diffFile of diffFiles) {
        try {
          const stats = await fs.stat(diffFile)
          if (stats.mtime < cutoffDate) {
            freed += stats.size
            await fs.unlink(diffFile)
            removed++
          }
        } catch (error) {
          console.warn(`Warning: Could not remove ${diffFile}:`, error)
        }
      }
    }
    
    console.log(`✅ Cleanup complete: ${removed} files removed, ${(freed / 1024 / 1024).toFixed(2)}MB freed`)
    
    return { removed, freed }
  }
  
  /**
   * Generate comprehensive baseline report
   */
  async generateReport(): Promise<void> {
    console.log('📊 Generating visual regression testing report...')
    
    const baselines = await this.getAllBaselines()
    const totalSize = baselines.reduce((sum, b) => sum + b.size, 0)
    
    // Group by category
    const byCategory = baselines.reduce((acc, baseline) => {
      const category = baseline.metadata?.component ? 'components' : 
                     baseline.path.includes('responsive') ? 'responsive' :
                     baseline.path.includes('themes') ? 'themes' : 'other'
      
      if (!acc[category]) acc[category] = []
      acc[category].push(baseline)
      return acc
    }, {} as Record<string, BaselineInfo[]>)
    
    // Generate report
    const report = {
      generated: new Date().toISOString(),
      summary: {
        totalBaselines: baselines.length,
        totalSize: totalSize,
        totalSizeMB: (totalSize / 1024 / 1024).toFixed(2),
        categories: Object.keys(byCategory).map(category => ({
          name: category,
          count: byCategory[category].length,
          size: byCategory[category].reduce((sum, b) => sum + b.size, 0)
        }))
      },
      baselines: baselines,
      byCategory
    }
    
    const reportFile = path.join(this.diffPath, 'baseline-report.json')
    await fs.writeFile(reportFile, JSON.stringify(report, null, 2))
    
    // Generate markdown report
    const markdownReport = this.generateMarkdownReport(report)
    const markdownFile = path.join(this.diffPath, 'baseline-report.md')
    await fs.writeFile(markdownFile, markdownReport)
    
    console.log(`✅ Report generated:`)
    console.log(`   - JSON: ${reportFile}`)
    console.log(`   - Markdown: ${markdownFile}`)
    console.log(`   - Total baselines: ${baselines.length}`)
    console.log(`   - Total size: ${(totalSize / 1024 / 1024).toFixed(2)}MB`)
  }
  
  // Private helper methods
  
  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath)
      return true
    } catch {
      return false
    }
  }
  
  private async calculateFileHash(filePath: string): Promise<string> {
    try {
      const { createHash } = await import('crypto')
      const fileBuffer = await fs.readFile(filePath)
      return createHash('md5').update(fileBuffer).digest('hex')
    } catch {
      return 'unknown'
    }
  }
  
  private parseMetadataFromFilename(filename: string): BaselineInfo['metadata'] {
    const parts = filename.split('-')
    const metadata: BaselineInfo['metadata'] = {}
    
    // Look for theme indicators
    if (parts.includes('dark')) metadata.theme = 'dark'
    if (parts.includes('light')) metadata.theme = 'light'
    
    // Look for breakpoint indicators
    if (parts.includes('mobile')) metadata.breakpoint = 'mobile'
    if (parts.includes('tablet')) metadata.breakpoint = 'tablet'
    if (parts.includes('desktop')) metadata.breakpoint = 'desktop'
    
    // Look for browser indicators
    if (parts.includes('chrome')) metadata.browser = 'chrome'
    if (parts.includes('firefox')) metadata.browser = 'firefox'
    if (parts.includes('safari')) metadata.browser = 'safari'
    
    // Component name is typically the first part
    if (parts.length > 0) {
      metadata.component = parts[0]
    }
    
    return metadata
  }
  
  private async compareImages(
    baselinePath: string,
    currentPath: string,
    threshold: number,
    diffPath?: string
  ): Promise<ComparisonResult> {
    try {
      // Use pixelmatch for image comparison
      const pixelmatch = await import('pixelmatch')
      const { PNG } = await import('pngjs')
      
      const baseline = PNG.sync.read(await fs.readFile(baselinePath))
      const current = PNG.sync.read(await fs.readFile(currentPath))
      
      const { width, height } = baseline
      const diff = new PNG({ width, height })
      
      const differences = pixelmatch.default(
        baseline.data,
        current.data,
        diff.data,
        width,
        height,
        { threshold: threshold * 255 }
      )
      
      const totalPixels = width * height
      const diffPercentage = (differences / totalPixels) * 100
      const passed = diffPercentage <= threshold * 100
      
      // Save diff image if requested and there are differences
      if (diffPath && differences > 0) {
        await fs.mkdir(path.dirname(diffPath), { recursive: true })
        await fs.writeFile(diffPath, PNG.sync.write(diff))
      }
      
      return {
        passed,
        differences,
        diffPercentage,
        diffImagePath: diffPath,
        threshold: threshold * 100
      }
    } catch (error) {
      console.error('Image comparison error:', error)
      return {
        passed: false,
        differences: -1,
        diffPercentage: -1,
        threshold: threshold * 100
      }
    }
  }
  
  private async generateHtmlApprovalReport(
    failedComparisons: Array<{ name: string; result: ComparisonResult }>
  ): Promise<string> {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Visual Regression Approval Required</title>
    <style>
        body { font-family: system-ui, sans-serif; max-width: 1200px; margin: 0 auto; padding: 20px; }
        .header { border-bottom: 2px solid #e5e7eb; padding-bottom: 20px; margin-bottom: 30px; }
        .change { border: 1px solid #d1d5db; border-radius: 8px; padding: 20px; margin-bottom: 20px; }
        .change-header { display: flex; justify-content: between; align-items: center; margin-bottom: 15px; }
        .change-name { font-size: 18px; font-weight: 600; }
        .change-stats { color: #6b7280; }
        .images { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; }
        .image-container { text-align: center; }
        .image-container img { max-width: 100%; border: 1px solid #d1d5db; border-radius: 4px; }
        .approve-btn, .reject-btn { 
            padding: 8px 16px; border-radius: 4px; border: none; cursor: pointer; margin: 5px;
        }
        .approve-btn { background: #10b981; color: white; }
        .reject-btn { background: #ef4444; color: white; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Visual Regression Approval Required</h1>
        <p>Review the following visual changes and approve or reject them.</p>
        <p><strong>Changes requiring review:</strong> ${failedComparisons.length}</p>
    </div>
    
    ${failedComparisons.map(comparison => `
        <div class="change">
            <div class="change-header">
                <div class="change-name">${comparison.name}</div>
                <div class="change-stats">
                    ${comparison.result.diffPercentage.toFixed(2)}% different 
                    (${comparison.result.differences} pixels)
                </div>
            </div>
            <div class="images">
                <div class="image-container">
                    <h4>Baseline</h4>
                    <img src="../baselines/${comparison.name}.png" alt="Baseline" />
                </div>
                <div class="image-container">
                    <h4>Current</h4>
                    <img src="../current/${comparison.name}.png" alt="Current" />
                </div>
                <div class="image-container">
                    <h4>Difference</h4>
                    <img src="${comparison.result.diffImagePath}" alt="Difference" />
                </div>
            </div>
            <div style="margin-top: 15px;">
                <button class="approve-btn" onclick="approve('${comparison.name}')">
                    Approve Change
                </button>
                <button class="reject-btn" onclick="reject('${comparison.name}')">
                    Reject Change
                </button>
            </div>
        </div>
    `).join('')}
    
    <script>
        function approve(name) {
            console.log('Approved:', name);
            // Integration with approval workflow
        }
        
        function reject(name) {
            console.log('Rejected:', name);
            // Integration with rejection workflow
        }
    </script>
</body>
</html>
    `
  }
  
  private generateMarkdownReport(report: any): string {
    return `
# Visual Regression Testing Report

Generated: ${report.generated}

## Summary

- **Total Baselines:** ${report.summary.totalBaselines}
- **Total Size:** ${report.summary.totalSizeMB} MB

## Breakdown by Category

${report.summary.categories.map((cat: any) => `
### ${cat.name.charAt(0).toUpperCase() + cat.name.slice(1)}
- Count: ${cat.count}
- Size: ${(cat.size / 1024 / 1024).toFixed(2)} MB
`).join('')}

## All Baselines

${report.baselines.map((baseline: BaselineInfo) => `
### ${baseline.name}
- Path: ${baseline.path}
- Size: ${(baseline.size / 1024).toFixed(1)} KB
- Last Modified: ${baseline.lastModified.toISOString()}
- Component: ${baseline.metadata?.component || 'Unknown'}
- Theme: ${baseline.metadata?.theme || 'Default'}
- Breakpoint: ${baseline.metadata?.breakpoint || 'Default'}
`).join('')}
    `
  }
}

// CLI Interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const command = process.argv[2]
  const manager = new BaselineManager()
  
  switch (command) {
    case 'init':
      await manager.initialize()
      break
      
    case 'generate':
      const force = process.argv.includes('--force')
      const dryRun = process.argv.includes('--dry-run')
      const report = await manager.generateBaselines({ force, dryRun })
      console.log('Generation Report:', report)
      break
      
    case 'compare':
      const threshold = parseFloat(process.argv.find(arg => arg.startsWith('--threshold='))?.split('=')[1] || '0.1')
      const comparisons = await manager.compareWithBaselines({ threshold })
      const failed = comparisons.filter(c => !c.result.passed)
      console.log(`Comparison complete: ${failed.length}/${comparisons.length} failed`)
      
      if (failed.length > 0) {
        await manager.generateApprovalWorkflow(comparisons)
      }
      break
      
    case 'report':
      await manager.generateReport()
      break
      
    case 'cleanup':
      const days = parseInt(process.argv.find(arg => arg.startsWith('--days='))?.split('=')[1] || '7')
      const result = await manager.cleanup({ olderThanDays: days })
      console.log('Cleanup result:', result)
      break
      
    default:
      console.log(`
Visual Regression Baseline Manager

Commands:
  init                    Initialize directory structure
  generate [--force]      Generate baselines from current screenshots
  compare [--threshold=N] Compare current with baselines
  report                  Generate comprehensive report
  cleanup [--days=N]      Clean up old artifacts

Options:
  --force                 Overwrite existing baselines
  --dry-run               Show what would be done without making changes
  --threshold=N           Comparison threshold (default: 0.1)
  --days=N                Days to keep during cleanup (default: 7)
      `)
  }
}

export default BaselineManager