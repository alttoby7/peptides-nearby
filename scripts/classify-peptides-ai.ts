#!/usr/bin/env npx tsx
/**
 * AI-based peptide classification using Claude Sonnet
 * Processes a batch file of provider slugs and adds peptide tags
 * Usage: npx tsx scripts/classify-peptides-ai.ts --batch data/batches/batch-0.json
 */
import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';
import path from 'path';

const PEPTIDE_LIST = [
  'semaglutide', 'tirzepatide', 'sermorelin', 'bpc-157', 'pt-141',
  'nad-plus', 'ghk-cu', 'tb-500', 'hexarelin', 'tesamorelin',
  'cjc-1295-ipamorelin', 'mots-c', 'selank', 'epithalon', 'semax',
  'kisspeptin', 'ghrp-6'
];

const PEPTIDE_ALIASES: Record<string, string[]> = {
  'semaglutide': ['semaglutide', 'ozempic', 'wegovy', 'rybelsus'],
  'tirzepatide': ['tirzepatide', 'mounjaro', 'zepbound'],
  'nad-plus': ['nad+', 'nad plus', 'nad iv', 'nicotinamide adenine dinucleotide'],
  'bpc-157': ['bpc-157', 'bpc 157', 'bpc157', 'body protection compound'],
  'pt-141': ['pt-141', 'pt141', 'bremelanotide', 'vyleesi'],
  'tb-500': ['tb-500', 'tb500', 'thymosin beta'],
  'ghk-cu': ['ghk-cu', 'ghk copper', 'copper peptide', 'copper tripeptide'],
  'sermorelin': ['sermorelin'],
  'hexarelin': ['hexarelin'],
  'tesamorelin': ['tesamorelin', 'egrifta'],
  'cjc-1295-ipamorelin': ['cjc-1295', 'ipamorelin'],
  'mots-c': ['mots-c', 'mots c'],
  'selank': ['selank'],
  'epithalon': ['epithalon', 'epitalon'],
  'semax': ['semax'],
  'kisspeptin': ['kisspeptin'],
  'ghrp-6': ['ghrp-6', 'ghrp 6'],
};

async function classifyProvider(client: Anthropic, providerName: string, websiteText: string, description: string): Promise<string[]> {
  const truncated = websiteText.slice(0, 4000);

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 200,
    system: `You identify which peptides or related compounds a medical/wellness provider offers based on their website text. Only return peptides that are clearly mentioned or strongly implied by brand names. Be conservative — do not guess.`,
    messages: [{
      role: 'user',
      content: `Provider: ${providerName}
Description: ${description || 'N/A'}

Website text (truncated):
${truncated}

Which of these peptides does this provider offer? Return ONLY a JSON array of matching slugs from this exact list, or [] if none:
${JSON.stringify(PEPTIDE_LIST)}

Consider these brand name mappings:
- ozempic/wegovy/rybelsus = semaglutide
- mounjaro/zepbound = tirzepatide
- egrifta = tesamorelin
- vyleesi/bremelanotide = pt-141
- nad+ / NAD iv therapy = nad-plus

Return only valid JSON array, nothing else.`
    }]
  });

  const text = (response.content[0] as any).text.trim();
  try {
    const parsed = JSON.parse(text);
    return Array.isArray(parsed) ? parsed.filter((p: string) => PEPTIDE_LIST.includes(p)) : [];
  } catch {
    return [];
  }
}

async function main() {
  const batchArg = process.argv.find(a => a.startsWith('--batch='))?.split('=')[1]
    || process.argv[process.argv.indexOf('--batch') + 1];

  if (!batchArg) {
    console.error('Usage: npx tsx scripts/classify-peptides-ai.ts --batch data/batches/batch-N.json');
    process.exit(1);
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) { console.error('ANTHROPIC_API_KEY not set'); process.exit(1); }

  const client = new Anthropic({ apiKey });

  const providers = JSON.parse(fs.readFileSync('data/raw/providers.json', 'utf8'));
  const cache: Record<string, any> = JSON.parse(fs.readFileSync('data/website-text-cache.json', 'utf8'));
  const batchSlugs: string[] = JSON.parse(fs.readFileSync(batchArg, 'utf8'));

  const outputFile = batchArg.replace('.json', '-results.json');
  const results: Record<string, string[]> = fs.existsSync(outputFile)
    ? JSON.parse(fs.readFileSync(outputFile, 'utf8'))
    : {};

  let processed = 0;
  let found = 0;

  for (const slug of batchSlugs) {
    if (results[slug] !== undefined) { processed++; continue; } // resume

    const provider = providers.find((p: any) => p.slug === slug);
    if (!provider) { results[slug] = []; continue; }

    const cacheEntry = cache[slug] || cache[provider.website];
    const text = cacheEntry?.text || '';

    try {
      const peptides = await classifyProvider(client, provider.name || slug, text, provider.description || '');
      results[slug] = peptides;
      if (peptides.length > 0) {
        found++;
        console.log(`✓ ${slug}: ${peptides.join(', ')}`);
      } else {
        process.stdout.write('.');
      }
    } catch (err: any) {
      console.error(`\nError on ${slug}: ${err.message}`);
      results[slug] = [];
    }

    processed++;
    if (processed % 10 === 0) {
      fs.writeFileSync(outputFile, JSON.stringify(results, null, 2));
      console.log(`\n[${processed}/${batchSlugs.length}] saved checkpoint, ${found} with peptides`);
    }
  }

  fs.writeFileSync(outputFile, JSON.stringify(results, null, 2));
  console.log(`\nDone: ${processed} processed, ${found} with peptides tagged`);
  console.log(`Results: ${outputFile}`);
}

main().catch(console.error);
