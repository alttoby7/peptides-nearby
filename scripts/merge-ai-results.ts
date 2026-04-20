#!/usr/bin/env npx tsx
/**
 * Merges AI classification results back into providers.json
 * Usage: npx tsx scripts/merge-ai-results.ts
 */
import fs from 'fs';
import path from 'path';

const providersPath = 'data/raw/providers.json';
const batchesDir = 'data/batches';

const providers: any[] = JSON.parse(fs.readFileSync(providersPath, 'utf8'));
const resultFiles = fs.readdirSync(batchesDir).filter(f => f.endsWith('-results.json'));

const allResults: Record<string, string[]> = {};
for (const file of resultFiles) {
  const results = JSON.parse(fs.readFileSync(path.join(batchesDir, file), 'utf8'));
  Object.assign(allResults, results);
}

let updated = 0;
let newPeptides = 0;
for (const provider of providers) {
  const aiPeptides = allResults[provider.slug];
  if (!aiPeptides || aiPeptides.length === 0) continue;

  const existing = new Set(provider.peptides || []);
  const before = existing.size;
  aiPeptides.forEach((p: string) => existing.add(p));
  if (existing.size > before) {
    provider.peptides = Array.from(existing);
    updated++;
    newPeptides += existing.size - before;
  }
}

fs.writeFileSync(providersPath, JSON.stringify(providers, null, 2));
console.log(`Updated ${updated} providers, added ${newPeptides} new peptide tags`);
console.log('Result files merged:', resultFiles);
