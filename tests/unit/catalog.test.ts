import { describe, it, expect } from "vitest";
import { localePath, slugify, toInternalPath } from "@/src/lib/i18n/config";
import { cleanDescription, firstSentences } from "@/src/lib/catalog/clean-html";
import { normalizeColor } from "@/src/lib/catalog/taxonomy";
import { defaultSizes } from "@/src/lib/catalog/sizes";
import { normalizePath } from "@/src/lib/redirects/table";
import { sniffImageType } from "@/src/lib/media/process";

describe("localized routing", () => {
  it("serves az at the root and maps localized segments to internal routes", () => {
    expect(toInternalPath("/")).toEqual({ locale: "az", internal: "/az" });
    expect(toInternalPath("/kataloq")).toEqual({
      locale: "az",
      internal: "/az/catalog",
    });
    expect(toInternalPath("/ru/tovar/kurtka")).toEqual({
      locale: "ru",
      internal: "/ru/product/kurtka",
    });
    expect(toInternalPath("/en/industries/x")).toEqual({
      locale: "en",
      internal: "/en/industries/x",
    });
  });
  it("redirects the non-canonical /az prefix", () => {
    expect(toInternalPath("/az/kataloq")).toEqual({
      canonicalRedirect: "/kataloq",
    });
  });
  it("marks unknown segments (legacy URLs) for the redirect table", () => {
    expect(
      toInternalPath("/product/deepblue-workwear-suit").internal,
    ).toContain("/__unknown/");
    expect(toInternalPath("/ru/product/x").internal).toContain("/__unknown/");
  });
  it("builds public paths per locale", () => {
    expect(localePath("az", "product", "jilet")).toBe("/mehsul/jilet");
    expect(localePath("en", "catalog")).toBe("/en/catalog");
    expect(localePath("ru")).toBe("/ru");
  });
  it("transliterates Azerbaijani and Russian slugs to ASCII", () => {
    expect(slugify("İstiləşdirilmiş iş gödəkçəsi")).toBe(
      "istileshdirilmish-ish-godekchesi",
    );
    expect(slugify("Утеплённая куртка")).toBe("uteplennaya-kurtka");
    expect(slugify("Chef & Waiter")).toBe("chef-and-waiter");
  });
});

describe("legacy content cleanup", () => {
  const html = `<figure><img src="x.png"></figure><h4 data-x="1">Insulated Suit</h4><p>Warm.</p>
    <h4>Product Details</h4><ul><li>A</li></ul><h4>Product Details</h4><ul><li>B</li></ul>
    <h4>Care Instructions</h4><p>Wash.</p><h4>Our Commitment</h4><p>We develops…</p><script>alert(1)</script>`;
  const out = cleanDescription(html);
  it("drops images, scripts and boilerplate sections", () => {
    expect(out).not.toMatch(
      /img|figure|script|Care Instructions|Commitment|Wash/,
    );
  });
  it("merges duplicate headings and keeps semantic structure", () => {
    expect(out.match(/<h3>Product Details<\/h3>/g)).toHaveLength(1);
    expect(out).toContain("<li>A</li>");
    expect(out).toContain("<li>B</li>");
    expect(out).not.toContain("data-x");
  });
  it("summarizes to whole sentences", () => {
    expect(firstSentences("One. Two. Three.", 2)).toBe("One. Two.");
  });
  it("normalizes colours across languages", () => {
    expect(normalizeColor("Göy")).toBe("blue");
    expect(normalizeColor("Синий")).toBe("blue");
    expect(normalizeColor("unknown")).toBeNull();
  });
  it("picks default sizes by product type", () => {
    expect(defaultSizes(["type:footwear"])).toContain("43");
    expect(defaultSizes(["type:jackets"])).toContain("XL");
    expect(defaultSizes(["type:head-protection"])).toEqual([]);
  });
  it("normalizes legacy paths for lookup", () => {
    expect(normalizePath("/az/%C9%99laq%C9%99/")).toBe("/az/əlaqə");
    expect(normalizePath("/Product/X/")).toBe("/product/x");
  });
});

describe("upload validation", () => {
  it("sniffs real image types from magic bytes", () => {
    expect(
      sniffImageType(
        Buffer.from([0x89, 0x50, 0x4e, 0x47, 0, 0, 0, 0, 0, 0, 0, 0]),
      ),
    ).toBe("image/png");
    expect(
      sniffImageType(Buffer.from("<svg onload=alert(1)>      ")),
    ).toBeNull();
    expect(sniffImageType(Buffer.from("GIF89a......"))).toBeNull();
  });
});
