#!/usr/bin/env node

import { Command } from 'commander';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { dirname, join, relative, extname, basename } from 'path';
import { glob } from 'glob';
import chalk from 'chalk';
import ora from 'ora';
import { ReactToVueTransformer } from '../core/transformer.js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const program = new Command();

program
  .name('transform')
  .description('Transform React components to Vue SFCs')
  .version('1.0.0')
  .option('-i, --input <path>', 'Input file or directory')
  .option('-o, --output <path>', 'Output directory', './vue-output')
  .option('-p, --pattern <pattern>', 'Glob pattern for files', '**/*.{tsx,jsx}')
  .option('-t, --typescript', 'Generate TypeScript Vue components', true)
  .option('-d, --dry-run', 'Show what would be transformed without writing files')
  .option('--preserve-structure', 'Preserve directory structure', true)
  .action(async (options) => {
    const spinner = ora('Initializing transformer...').start();
    
    try {
      const transformer = new ReactToVueTransformer();
      
      // Find files to transform
      spinner.text = 'Finding React components...';
      const pattern = options.input 
        ? join(options.input, options.pattern)
        : options.pattern;
      
      const files = await glob(pattern, {
        ignore: ['**/node_modules/**', '**/dist/**', '**/build/**']
      });
      
      if (files.length === 0) {
        spinner.fail('No files found matching the pattern');
        process.exit(1);
      }
      
      spinner.succeed(`Found ${files.length} files to transform`);
      
      // Transform each file
      let successCount = 0;
      let errorCount = 0;
      
      for (const file of files) {
        const fileSpinner = ora(`Transforming ${file}...`).start();
        
        try {
          // Read React component
          const reactCode = await readFile(file, 'utf-8');
          
          // Extract component name from filename
          const componentName = basename(file)
            .replace(extname(file), '')
            .replace(/\.test$/, '')
            .replace(/\.spec$/, '');
          
          // Transform to Vue
          const result = await transformer.transform(reactCode, {
            typescript: options.typescript,
            componentName
          });
          
          if (result.success && result.output) {
            if (!options.dryRun) {
              // Determine output path
              let outputPath: string;
              if (options.preserveStructure && options.input) {
                const relativePath = relative(options.input, file);
                outputPath = join(
                  options.output, 
                  relativePath.replace(/\.(tsx?|jsx?)$/, '.vue')
                );
              } else {
                outputPath = join(
                  options.output,
                  componentName + '.vue'
                );
              }
              
              // Create output directory
              await mkdir(dirname(outputPath), { recursive: true });
              
              // Write Vue component
              await writeFile(outputPath, result.output);
              
              fileSpinner.succeed(
                chalk.green(`✓ ${file} → ${outputPath}`) +
                chalk.gray(` (${result.stats?.linesOfCode} lines)`)
              );
            } else {
              fileSpinner.succeed(chalk.blue(`✓ ${file} (dry run)`));
            }
            
            successCount++;
            
            // Show stats
            if (result.stats) {
              console.log(chalk.gray(`  - Hooks transformed: ${result.stats.hooksTransformed}`));
              console.log(chalk.gray(`  - Props transformed: ${result.stats.propsTransformed}`));
            }
          } else {
            throw new Error(result.errors?.join('\n') || 'Unknown error');
          }
        } catch (error) {
          fileSpinner.fail(chalk.red(`✗ ${file}: ${error instanceof Error ? error.message : error}`));
          errorCount++;
        }
      }
      
      // Summary
      console.log('\n' + chalk.bold('Transformation Summary:'));
      console.log(chalk.green(`  ✓ Success: ${successCount} files`));
      if (errorCount > 0) {
        console.log(chalk.red(`  ✗ Failed: ${errorCount} files`));
      }
      
      if (!options.dryRun && successCount > 0) {
        console.log(chalk.cyan(`\nVue components saved to: ${options.output}`));
      }
      
      process.exit(errorCount > 0 ? 1 : 0);
    } catch (error) {
      spinner.fail(chalk.red('Transformation failed'));
      console.error(error);
      process.exit(1);
    }
  });

program.parse();