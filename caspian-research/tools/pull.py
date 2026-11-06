"""Download the Apify run output (KV store + dataset) into a local folder and normalize products.
Usage: python3 -I pull.py <kv_store_id> <dataset_id> <out_dir>   (token from APIFY_API_KEY)"""
import concurrent.futures as cf
import html
import json
import os
import re
import sys
import urllib.parse
import urllib.request

kv, ds, out = sys.argv[1:4]
TOKEN = os.environ["APIFY_API_KEY"]
API = "https://api.apify.com/v2"


def get(url, raw=False):
    sep = "&" if "?" in url else "?"
    with urllib.request.urlopen(f"{url}{sep}token={TOKEN}", timeout=120) as r:
        b = r.read()
    return b if raw else json.loads(b)


os.makedirs(f"{out}/raw", exist_ok=True)
os.makedirs(f"{out}/images", exist_ok=True)
os.makedirs(f"{out}/screenshots", exist_ok=True)

keys, cursor = [], None
while True:
    q = f"{API}/key-value-stores/{kv}/keys?limit=1000" + (f"&exclusiveStartKey={urllib.parse.quote(cursor)}" if cursor else "")
    d = get(q)["data"]
    keys += [i["key"] for i in d["items"]]
    if not d["isTruncated"]:
        break
    cursor = d["nextExclusiveStartKey"]
print("kv keys:", len(keys))

site = get(f"{API}/key-value-stores/{kv}/records/site-data")
manifest = get(f"{API}/key-value-stores/{kv}/records/image-manifest")
json.dump(site, open(f"{out}/raw/site-data.json", "w"), ensure_ascii=False, indent=1)
json.dump(manifest, open(f"{out}/raw/image-manifest.json", "w"), ensure_ascii=False, indent=1)
pages = get(f"{API}/datasets/{ds}/items?clean=true&format=json")
json.dump(pages, open(f"{out}/raw/rendered-pages.json", "w"), ensure_ascii=False, indent=1)

url2local = {}


def fetch(k):
    if k.startswith("img_"):
        m = next((m for m in manifest if m.get("key") == k), None)
        path = urllib.parse.unquote(urllib.parse.urlparse(m["url"]).path) if m else k[4:]
        rel = path.split("/wp-content/uploads/")[-1] if "/wp-content/uploads/" in path else "_other/" + path.lstrip("/")
        rel = os.path.normpath(rel).lstrip("./")
        assert not rel.startswith("..")
        dest = os.path.join(out, "images", rel)
        os.makedirs(os.path.dirname(dest), exist_ok=True)
        if not os.path.exists(dest):
            open(dest, "wb").write(get(f"{API}/key-value-stores/{kv}/records/{urllib.parse.quote(k)}", raw=True))
        return (m["url"] if m else k, "images/" + rel)
    if k.startswith("shot_"):
        dest = os.path.join(out, "screenshots", k[5:] + ".jpg")
        if not os.path.exists(dest):
            open(dest, "wb").write(get(f"{API}/key-value-stores/{kv}/records/{urllib.parse.quote(k)}", raw=True))
    return None


with cf.ThreadPoolExecutor(8) as ex:
    for r in ex.map(fetch, keys):
        if r:
            url2local[r[0]] = r[1]

# ---- Normalize products: group WPML translations by SKU, detect language from permalink.
def lang_of(link):
    p = urllib.parse.urlparse(link).path
    return "az" if p.startswith("/az/") else "ru" if p.startswith("/ru/") else "en"


def clean(s):
    s = html.unescape(re.sub(r"<[^>]+>", " ", s or ""))
    return re.sub(r"\s+", " ", s).strip()


variations = site.get("variations", {})
groups = {}
for p in site["products"]:
    key = (p.get("sku") or "").strip() or f"nosku-{p['slug']}"
    lang = lang_of(p["permalink"])
    g = groups.setdefault(key, {"sku": p.get("sku") or None, "translations": {}, "images": [], "issues": []})
    if lang in g["translations"]:
        g["issues"].append(f"duplicate {lang} translation id={p['id']}")
    g["translations"][lang] = {
        "sourceId": p["id"], "name": html.unescape(p["name"]), "slug": p["slug"], "sourceUrl": p["permalink"],
        "shortDescription": clean(p.get("short_description")), "descriptionHtml": p.get("description"),
        "categories": [{"name": html.unescape(c["name"]), "slug": c["slug"]} for c in p.get("categories", [])],
        "tags": [t.get("name") for t in p.get("tags", [])],
    }
    if not g["images"]:
        g["images"] = [{"src": im["src"], "local": url2local.get(im["src"]), "alt": im.get("alt") or "", "w": None} for im in p.get("images", [])]
    pr = p.get("prices", {})
    minor = int(pr.get("currency_minor_unit", 2))
    g.setdefault("price", {"amount": int(pr["price"]) / 10**minor if pr.get("price") else None, "currency": pr.get("currency_code")})
    g.setdefault("type", p.get("type"))
    g.setdefault("attributes", [{"name": a["name"], "terms": [t["name"] for t in a.get("terms", [])]} for a in p.get("attributes", [])])
    g.setdefault("brands", [b.get("name") for b in p.get("brands", [])])
    g.setdefault("variations", variations.get(str(p["id"])) or [])
    g.setdefault("inStock", p.get("is_in_stock"))

for g in groups.values():
    missing = [l for l in ("az", "en", "ru") if l not in g["translations"]]
    if missing:
        g["issues"].append("missing translations: " + ",".join(missing))
    names = {l: t["name"] for l, t in g["translations"].items()}
    if len(set(names.values())) == 1 and len(names) > 1:
        g["issues"].append("name not translated (identical across languages)")
    if any(i["local"] is None for i in g["images"]):
        g["issues"].append("some images not downloaded")

products = sorted(groups.values(), key=lambda g: g["sku"] or "")
json.dump(products, open(f"{out}/products.normalized.json", "w"), ensure_ascii=False, indent=1)
json.dump(site["cats"], open(f"{out}/categories.json", "w"), ensure_ascii=False, indent=1)
json.dump({l: [{"slug": p["slug"], "link": p["link"], "title": html.unescape(p["title"]["rendered"]), "text": clean(p["content"]["rendered"])[:20000]} for p in (site["pages"].get(l) or [])] for l in site["pages"]}, open(f"{out}/pages.json", "w"), ensure_ascii=False, indent=1)
json.dump({"attributes": site["attrs"], "terms": site["terms"]}, open(f"{out}/attributes.json", "w"), ensure_ascii=False, indent=1)
json.dump(url2local, open(f"{out}/image-map.json", "w"), ensure_ascii=False, indent=1)

langs = {l: sum(1 for g in products if l in g["translations"]) for l in ("az", "en", "ru")}
print(json.dumps({
    "rawProducts": len(site["products"]), "uniqueProducts": len(products), "byLang": langs,
    "withIssues": sum(1 for g in products if g["issues"]),
    "untranslatedNames": sum(1 for g in products if any("not translated" in i for i in g["issues"])),
    "images": len(url2local), "imagesFailed": sum(1 for m in manifest if m.get("error")),
    "imageMB": round(sum(m.get("bytes", 0) for m in manifest) / 1e6, 1),
    "categories": {l: len(v or []) for l, v in site["cats"].items()},
    "posts": {l: [html.unescape(p["title"]["rendered"]) for p in (v or [])] for l, v in site["posts"].items()},
    "pagesRendered": len(pages),
}, ensure_ascii=False, indent=1))
