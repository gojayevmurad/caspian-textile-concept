// Cold-visit benchmark: real Chrome, fresh profile per run, measures what a first-time
// visitor experiences end-to-end (including any interstitial reloads before the real page).
// Usage: node scripts/bench.mjs <outfile.json> <url> [url...]
// Env: RUNS (default 3), CHROME (path to Chrome)
import { chromium } from "@playwright/test";
import fs from "node:fs";

const [out, ...urls] = process.argv.slice(2);
const RUNS = +(process.env.RUNS || 3);
const MAC_CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
// Use local Chrome when present (as for the baseline), else Playwright's Chromium.
const CHROME = process.env.CHROME || (fs.existsSync(MAC_CHROME) ? MAC_CHROME : undefined);
const PROFILES = {
  "mobile-slow4g": {
    ctx: {
      viewport: { width: 412, height: 915 },
      deviceScaleFactor: 2.625,
      isMobile: true,
      hasTouch: true,
      userAgent:
        "Mozilla/5.0 (Linux; Android 11; moto g power) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36",
    },
    net: {
      offline: false,
      latency: 150,
      downloadThroughput: (1.6 * 1024 * 1024) / 8,
      uploadThroughput: (750 * 1024) / 8,
    },
    cpu: 4,
  },
  "desktop-cable": {
    ctx: { viewport: { width: 1440, height: 900 } },
    net: null,
    cpu: 1,
  },
};

const median = (a) => {
  const s = [...a].filter((x) => x != null).sort((x, y) => x - y);
  return s.length ? s[Math.floor(s.length / 2)] : null;
};

// FAST_FAIL_HOSTS=a.local,b.local makes those hosts fail DNS instantly (isolates slow-resolving hosts).
const fastFail = (process.env.FAST_FAIL_HOSTS || "").split(",").filter(Boolean);
const args = fastFail.length
  ? [
      `--host-resolver-rules=${fastFail.map((h) => `MAP ${h} ~NOTFOUND`).join(", ")}`,
    ]
  : [];
const browser = await chromium.launch({
  executablePath: CHROME,
  headless: true,
  args,
});
const results = [];
for (const url of urls)
  for (const [pname, prof] of Object.entries(PROFILES)) {
    const runs = [];
    for (let i = 0; i < RUNS; i++) {
      const ctx = await browser.newContext(prof.ctx);
      const page = await ctx.newPage();
      const cdp = await ctx.newCDPSession(page);
      await cdp.send("Network.enable");
      await cdp.send("Network.setCacheDisabled", { cacheDisabled: true });
      if (prof.net)
        await cdp.send("Network.emulateNetworkConditions", prof.net);
      if (prof.cpu > 1)
        await cdp.send("Emulation.setCPUThrottlingRate", { rate: prof.cpu });
      let bytes = 0,
        requests = 0,
        documents = 0;
      const statuses = [];
      cdp.on("Network.loadingFinished", (e) => {
        bytes += e.encodedDataLength;
      });
      cdp.on("Network.requestWillBeSent", (e) => {
        requests++;
        if (e.type === "Document") documents++;
      });
      cdp.on("Network.responseReceived", (e) => {
        if (e.type === "Document") statuses.push(e.response.status);
      });
      await page.addInitScript(() => {
        window.__lcp = null;
        window.__cls = 0;
        new PerformanceObserver((l) => {
          for (const e of l.getEntries()) window.__lcp = e.startTime;
        }).observe({ type: "largest-contentful-paint", buffered: true });
        new PerformanceObserver((l) => {
          for (const e of l.getEntries())
            if (!e.hadRecentInput) {
              window.__cls += e.value;
              (window.__shifts ||= []).push({ v: +e.value.toFixed(3), t: Math.round(e.startTime), src: e.sources.map((x) => `${x.node?.nodeName}.${String(x.node?.className || "").slice(0, 40)} y${Math.round(x.previousRect.y)}→${Math.round(x.currentRect.y)}`) });
            }
        }).observe({ type: "layout-shift", buffered: true });
      });
      const t0 = Date.now();
      try {
        await page.goto(url, { waitUntil: "load", timeout: 120000 });
        // Wait for any client-side reloads to settle on the final document.
        for (let k = 0; k < 20; k++) {
          await page.waitForLoadState("load");
          await page.waitForTimeout(1500);
          const ready = await page
            .evaluate(
              () =>
                document.readyState === "complete" &&
                document.body &&
                document.body.innerText.length > 200,
            )
            .catch(() => false);
          if (ready) break;
        }
        await page
          .waitForLoadState("networkidle", { timeout: 30000 })
          .catch(() => {});
        const m = await page.evaluate(() => {
          const n = performance.getEntriesByType("navigation")[0];
          return {
            timeOrigin: performance.timeOrigin,
            ttfb: n.responseStart,
            fcp:
              performance.getEntriesByName("first-contentful-paint")[0]
                ?.startTime ?? null,
            lcp: window.__lcp,
            cls: window.__cls,
            load: n.loadEventEnd,
            domNodes: document.querySelectorAll("*").length,
            // Final document only (resource timing; excludes the interstitial response).
            pageTransferKB: Math.round(
              (n.transferSize +
                performance
                  .getEntriesByType("resource")
                  .reduce((a, e) => a + (e.transferSize || 0), 0)) /
                1024,
            ),
            pageRequests: performance.getEntriesByType("resource").length + 1,
          shifts: (window.__shifts || []).sort((a, b) => b.v - a.v).slice(0, 3),
            renderBlocking: performance
              .getEntriesByType("resource")
              .filter((e) => e.renderBlockingStatus === "blocking").length,
          };
        });
        const offset = m.timeOrigin - t0; // time spent before the final document started (interstitials)
        runs.push({
          interstitialMs: Math.max(0, Math.round(offset)),
          ttfbMs: Math.round(offset + m.ttfb),
          fcpMs: m.fcp && Math.round(offset + m.fcp),
          lcpMs: m.lcp && Math.round(offset + m.lcp),
          loadMs: Math.round(offset + m.load),
          cls: +m.cls.toFixed(3),
          transferKB: Math.round(bytes / 1024),
          requests,
          documents,
          documentStatuses: statuses,
          domNodes: m.domNodes,
          pageTransferKB: m.pageTransferKB,
        shifts: m.shifts,
          pageRequests: m.pageRequests,
          renderBlocking: m.renderBlocking,
        });
      } catch (e) {
        runs.push({ error: String(e).slice(0, 300) });
      }
      await ctx.close();
    }
    const ok = runs.filter((r) => !r.error);
    const summary = Object.fromEntries(
      [
        "interstitialMs",
        "ttfbMs",
        "fcpMs",
        "lcpMs",
        "loadMs",
        "cls",
        "transferKB",
        "requests",
        "pageTransferKB",
        "pageRequests",
        "renderBlocking",
        "domNodes",
      ].map((k) => [k, median(ok.map((r) => r[k]))]),
    );
    results.push({ url, profile: pname, runs: RUNS, summary, detail: runs });
    console.log(pname.padEnd(14), url, JSON.stringify(summary));
  }
await browser.close();
fs.writeFileSync(
  out,
  JSON.stringify({ measuredAt: new Date().toISOString(), results }, null, 2),
);
