import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";

interface Provider {
  slug: string;
  name: string;
  type: string;
  address: { stateCode: string; city: string; state: string };
  services: string[];
  description: string;
  telehealth?: { available: boolean };
}

const SERVICE_KEYWORDS = [
  "telehealth",
  "telemedicine",
  "virtual visit",
  "virtual consultation",
  "remote",
];

const DESCRIPTION_KEYWORDS = [
  "telehealth",
  "telemedicine",
  "virtual visit",
  "virtual consultation",
  "remote consultation",
  "online consultation",
  "virtual care",
  "virtual appointment",
];

interface Detection {
  slug: string;
  name: string;
  stateCode: string;
  city: string;
  source: "services" | "description";
  matchedKeyword: string;
  matchedText: string;
}

function detectTelehealth(providers: Provider[]): Detection[] {
  const detections: Detection[] = [];

  for (const p of providers) {
    // Check services array
    for (const svc of p.services) {
      const svcLower = svc.toLowerCase();
      for (const kw of SERVICE_KEYWORDS) {
        if (svcLower.includes(kw)) {
          detections.push({
            slug: p.slug,
            name: p.name,
            stateCode: p.address.stateCode,
            city: p.address.city,
            source: "services",
            matchedKeyword: kw,
            matchedText: svc,
          });
          break;
        }
      }
    }

    // Check description
    const descLower = p.description.toLowerCase();
    for (const kw of DESCRIPTION_KEYWORDS) {
      if (descLower.includes(kw)) {
        // Only add if not already detected via services
        if (!detections.some((d) => d.slug === p.slug)) {
          detections.push({
            slug: p.slug,
            name: p.name,
            stateCode: p.address.stateCode,
            city: p.address.city,
            source: "description",
            matchedKeyword: kw,
            matchedText: p.description.substring(
              Math.max(0, descLower.indexOf(kw) - 20),
              descLower.indexOf(kw) + kw.length + 20
            ),
          });
        }
        break;
      }
    }
  }

  return detections;
}

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing env: ${name}`);
  return value;
}

async function updateSupabase(detections: Detection[], allSlugs: string[]) {
  const supabaseUrl = requiredEnv("SUPABASE_URL").replace(/\/$/, "");
  const serviceRoleKey = requiredEnv("SUPABASE_SERVICE_ROLE_KEY");

  const detectedSlugs = new Set(detections.map((d) => d.slug));

  let updated = 0;
  let skipped = 0;

  for (const slug of allSlugs) {
    const isDetected = detectedSlugs.has(slug);
    const detection = detections.find((d) => d.slug === slug);

    const telehealth = isDetected
      ? {
          available: true,
          statesServed: [detection!.stateCode],
          visitTypes: ["video"],
        }
      : {
          available: false,
          statesServed: [],
          visitTypes: [],
        };

    const url = `${supabaseUrl}/rest/v1/providers?slug=eq.${slug}`;
    const res = await fetch(url, {
      method: "PATCH",
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({ telehealth }),
    });

    if (!res.ok) {
      console.error(`  FAILED ${slug}: ${res.status} ${await res.text()}`);
      skipped++;
    } else {
      updated++;
    }
  }

  console.log(`\nUpdated ${updated} providers, ${skipped} failed`);
}

function updateJsonFile(filePath: string, detections: Detection[], providers: Provider[]) {
  const detectedSlugs = new Set(detections.map((d) => d.slug));
  const fullProviders = JSON.parse(readFileSync(filePath, "utf-8"));

  for (const p of fullProviders) {
    const detection = detections.find((d) => d.slug === p.slug);
    if (detectedSlugs.has(p.slug)) {
      p.telehealth = {
        available: true,
        statesServed: [detection!.stateCode],
        visitTypes: ["video"],
      };
    }
    // Leave non-detected providers without telehealth field (or keep existing)
  }

  writeFileSync(filePath, JSON.stringify(fullProviders, null, 2) + "\n");
  console.log(`Updated ${filePath}`);
  console.log(`  ${detections.length} providers set to telehealth.available=true`);
}

async function main() {
  const rawPath = resolve(__dirname, "..", "data", "raw", "providers.json");
  const providers: Provider[] = JSON.parse(readFileSync(rawPath, "utf-8"));

  const detections = detectTelehealth(providers);
  const doUpdate = process.argv.includes("--update");

  console.log(`\nScanned ${providers.length} providers`);
  console.log(`Detected ${detections.length} with telehealth signals\n`);

  console.log("TELEHEALTH DETECTED:");
  console.log("─".repeat(80));
  for (const d of detections) {
    console.log(
      `  ${d.name} (${d.city}, ${d.stateCode})` +
        `\n    Source: ${d.source} | Keyword: "${d.matchedKeyword}"` +
        `\n    Match: "${d.matchedText}"\n`
    );
  }

  const nonDetected = providers.length - detections.length;
  console.log(`\n${nonDetected} providers will be set to telehealth=false`);

  if (doUpdate) {
    const hasSupabase = process.env.SUPABASE_URL && !process.env.SUPABASE_URL.includes("your-project");
    if (hasSupabase) {
      console.log("\nUpdating Supabase...");
      await updateSupabase(detections, providers.map((p) => p.slug));
    } else {
      console.log("\nNo Supabase credentials — updating providers.json directly...");
      updateJsonFile(rawPath, detections, providers);
    }
  } else {
    console.log("\nDry run — pass --update to write changes");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
