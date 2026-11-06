import { test, expect, type Page } from "@playwright/test";
import { fixture, seed, testPool } from "../support/e2e-seed";

test.skip(
  !process.env.TEST_DATABASE_URL,
  "Requires the isolated test database",
);
let productId = 0;
test.beforeAll(async () => {
  const pool = testPool();
  productId = await seed(pool);
  await pool.end();
});

async function login(page: Page, who: { email: string; password: string }) {
  await page.goto("/sign-in");
  await page.getByLabel("Email address").fill(who.email);
  await page.getByLabel("Password", { exact: true }).fill(who.password);
  await page.getByRole("button", { name: /sign in/i }).click();
  await expect(page).toHaveURL(/\/admin/);
}

test("demo account is read-only on the server, not just in the UI", async ({
  page,
}) => {
  await login(page, fixture.demo);
  await expect(page.getByRole("note")).toContainText("yalnız baxış");
  await page.goto(`/admin/products/${productId}`);
  // Bypass the disabled UI and submit the real Server Action anyway.
  await page.evaluate(() =>
    document
      .querySelectorAll("fieldset[disabled]")
      .forEach((f) => f.removeAttribute("disabled")),
  );
  await page.locator('input[name="az.name"]').fill("HACKED BY DEMO");
  await page.getByRole("button", { name: "Yadda saxla və dərc et" }).click();
  await expect(page).toHaveURL(/denied=1/);
  const pool = testPool();
  const r = await pool.query(
    "select name from product_translation where product_id=$1 and locale='az'",
    [productId],
  );
  await pool.end();
  expect(r.rows[0].name).toBe(fixture.names.az);
  // Users list is hidden from the demo role.
  await page.goto("/admin/users");
  await expect(page.getByText("yalnız admin üçündür")).toBeVisible();
});

test("admin can edit a product and the change is audited", async ({ page }) => {
  await login(page, fixture.admin);
  await page.goto(`/admin/products/${productId}`);
  const name = `${fixture.names.az} ✓`;
  await page.locator('input[name="az.name"]').fill(name);
  await page.getByRole("button", { name: "Yadda saxla və dərc et" }).click();
  await expect(page).toHaveURL(/saved=1/);
  const pool = testPool();
  const r = await pool.query(
    "select name from product_translation where product_id=$1 and locale='az'",
    [productId],
  );
  const audit = await pool.query(
    "select action from audit_log where entity='product' and entity_id=$1 order by id desc limit 1",
    [String(productId)],
  );
  await pool.query(
    "update product_translation set name=$2 where product_id=$1 and locale='az'",
    [productId, fixture.names.az],
  );
  await pool.end();
  expect(r.rows[0].name).toBe(name);
  expect(audit.rows[0].action).toBe("product.update");
});
