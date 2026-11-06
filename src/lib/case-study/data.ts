import "server-only";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

type Summary = Record<string, number | null>;
type Bench = {
  measuredAt: string;
  results: {
    url: string;
    profile: string;
    summary: Summary;
    invalid?: boolean;
  }[];
};

async function load(name: string): Promise<Bench | null> {
  try {
    return JSON.parse(
      await readFile(join(process.cwd(), "data/benchmarks", name), "utf8"),
    );
  } catch {
    return null;
  }
}

const pageOf = (url: string) => {
  const p = new URL(url).pathname;
  if (p === "/" || p === "") return "home";
  if (/shop|kataloq|catalog/.test(p)) return "catalog";
  return "product";
};

export type Row = {
  page: "home" | "catalog" | "product";
  profile: string;
  before: Summary;
  after: Summary | null;
};

/** Pairs old-site and new-site measurements taken with the same script (scripts/bench.mjs). */
export async function getBenchmarks() {
  const [baseline, production, local] = await Promise.all([
    load("baseline.json"),
    load("after-production.json"),
    load("after-local.json"),
  ]);
  const after = production ?? local;
  const rows: Row[] = [];
  for (const b of baseline?.results ?? []) {
    const page = pageOf(b.url) as Row["page"];
    const a = after?.results.find(
      (r) => pageOf(r.url) === page && r.profile === b.profile,
    );
    rows.push({
      page,
      profile: b.profile,
      before: b.summary,
      after: a?.summary ?? null,
    });
  }
  return {
    rows,
    baselineAt: baseline?.measuredAt ?? null,
    afterAt: after?.measuredAt ?? null,
    afterSource: production ? "production" : local ? "local" : null,
  };
}
