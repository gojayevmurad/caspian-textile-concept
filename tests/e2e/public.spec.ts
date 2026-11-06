import { test, expect } from "@playwright/test";
import { fixture, seed, testPool } from "../support/e2e-seed";

test.skip(
  !process.env.TEST_DATABASE_URL,
  "Requires the isolated test database",
);
test.beforeAll(async () => {
  const pool = testPool();
  await seed(pool);
  await pool.end();
});

test("Azerbaijani is the default locale; language switch keeps the page", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("lang", "az");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByRole("note").first()).toContainText("Konsept demo");
  await page.goto(`/mehsul/${fixture.slugs.az}`);
  await page.getByRole("link", { name: "EN", exact: true }).first().click();
  await expect(page).toHaveURL(new RegExp(`/en/product/${fixture.slugs.en}$`));
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    fixture.names.en,
  );
});

test("legacy WordPress URLs redirect in one hop; demo posts are gone", async ({
  request,
}) => {
  const r = await request.get("/product/e2e-legacy/", { maxRedirects: 0 });
  expect(r.status()).toBe(301);
  expect(r.headers()["location"]).toContain(`/en/product/${fixture.slugs.en}`);
  expect(
    (await request.get("/demo-blog-post/", { maxRedirects: 0 })).status(),
  ).toBe(410);
  expect((await request.get("/az/kataloq", { maxRedirects: 0 })).status()).toBe(
    308,
  );
});

test("catalogue → product → quote basket → RFQ submission", async ({
  page,
}) => {
  await page.goto("/kataloq");
  await expect(
    page.getByRole("link", { name: fixture.names.az }),
  ).toBeVisible();
  await page.getByRole("link", { name: fixture.names.az }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    fixture.names.az,
  );
  await page.getByRole("button", { name: "Sorğu səbətinə əlavə et" }).click();
  await page
    .getByRole("link", { name: /Sorğu səbəti/ })
    .last()
    .click();
  await expect(page).toHaveURL(/\/sorgu$/);
  await page.getByLabel(/Şirkət adı/).fill("E2E MMC");
  await page.getByLabel(/Əlaqədar şəxs/).fill("Test Person");
  await page.getByLabel(/E-poçt/).fill("buyer@e2e.test");
  await page.getByLabel(/Telefon/).fill("+994 50 000 00 00");
  await page.getByLabel(/razıyam/).check();
  await page.getByRole("button", { name: "Sorğunu göndər" }).click();
  await expect(page.getByRole("status")).toContainText("RFQ-");
});

test("search is typo-tolerant", async ({ page }) => {
  await page.goto("/axtaris");
  await page.getByRole("searchbox").fill("e2e godekce");
  await expect(
    page.getByRole("link", { name: new RegExp(fixture.names.az) }),
  ).toBeVisible();
});

for (const path of ["/", "/kataloq", `/mehsul/${fixture.slugs.az}`, "/sorgu"])
  test(`no horizontal overflow at 360px: ${path}`, async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 780 });
    await page.goto(path);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  });

test("admin requires authentication", async ({ page }) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/sign-in/);
});
