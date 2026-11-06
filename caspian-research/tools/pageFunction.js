async function pageFunction(context) {
  const { page, request, log } = context;
  const KV = context.Actor || context.Apify;
  // Wait until the real WordPress page has rendered (the site's own JS reload completes in-browser).
  for (let i = 0; i < 30; i++) {
    const ok = await page.evaluate(() => !!document.querySelector('link[href*="wp-content"]')).catch(() => false);
    if (ok) break;
    await page.waitForTimeout(1000);
  }
  await page.waitForLoadState('networkidle').catch(() => {});
  const label = request.userData.label || 'PAGE';
  const keyOf = (u) => u.replace(/^https?:\/\/[^/]+\//, '').replace(/[^a-zA-Z0-9!\-_.'()]/g, '_').slice(-250);

  if (label === 'DATA') {
    const data = await page.evaluate(async () => {
      const all = async (base) => {
        let out = [], p = 1, tp = 1;
        do {
          const r = await fetch(base + (base.includes('?') ? '&' : '?') + 'per_page=100&page=' + p);
          if (!r.ok) return { error: r.status, base };
          tp = +r.headers.get('x-wp-totalpages') || 1;
          out = out.concat(await r.json()); p++;
        } while (p <= tp);
        return out;
      };
      const langs = { en: '', az: '/az', ru: '/ru' };
      const products = await all('/wp-json/wc/store/v1/products');
      const cats = {}, pages = {}, posts = {};
      for (const [l, pre] of Object.entries(langs)) {
        cats[l] = await all(pre + '/wp-json/wc/store/v1/products/categories');
        pages[l] = await all(pre + '/wp-json/wp/v2/pages?_fields=id,slug,link,title,content,excerpt,modified');
        posts[l] = await all(pre + '/wp-json/wp/v2/posts?_fields=id,slug,link,title,date,modified');
      }
      const variations = {};
      for (const p of products) if (p.variations && p.variations.length) {
        const r = await fetch('/wp-json/wc/store/v1/products/' + p.id + '/variations?per_page=100').catch(() => null);
        if (r && r.ok) variations[p.id] = await r.json();
      }
      const attrs = await (await fetch('/wp-json/wc/store/v1/products/attributes')).json();
      const terms = {};
      for (const a of attrs) terms[a.taxonomy] = await (await fetch('/wp-json/wc/store/v1/products/attributes/' + a.id + '/terms?per_page=100')).json();
      const sitemaps = {};
      for (const s of ['sitemap_index.xml','post-sitemap.xml','page-sitemap.xml','product-sitemap.xml','category-sitemap.xml','robots.txt']) {
        const r = await fetch('/' + s); sitemaps[s] = await r.text();
      }
      return { products, cats, pages, posts, variations, attrs, terms, sitemaps };
    });
    await KV.setValue('site-data', data);
    // Collect image URLs: product images, category images, page content images.
    const urls = new Set();
    for (const p of data.products) for (const im of (p.images || [])) urls.add(im.src);
    for (const l of Object.keys(data.cats)) for (const c of (data.cats[l] || [])) if (c.image) urls.add(c.image.src);
    for (const l of Object.keys(data.pages)) for (const pg of (data.pages[l] || [])) {
      const html = (pg.content && pg.content.rendered) || '';
      for (const m of html.matchAll(/https?:\/\/caspiantextile\.com\/wp-content\/uploads\/[^"'\s)]+?\.(?:png|jpe?g|webp|svg|gif)/gi)) urls.add(m[0]);
    }
    const domImgs = await page.evaluate(() => [...document.querySelectorAll('img, [style*="background"]')].flatMap(e => [e.currentSrc || e.src, (getComputedStyle(e).backgroundImage.match(/url\("?(.*?)"?\)/) || [])[1]]).filter(u => u && u.includes('/wp-content/')));
    domImgs.forEach(u => urls.add(u));
    const list = [...urls].filter(u => u.startsWith('https://caspiantextile.com/'));
    log.info('Images to download: ' + list.length);
    const manifest = [];
    const queue = [...list];
    const worker = async () => {
      while (queue.length) {
        const u = queue.shift();
        try {
          const r = await page.request.get(u, { timeout: 60000 });
          const ct = r.headers()['content-type'] || '';
          if (r.status() === 200 && /image/.test(ct)) {
            const buf = await r.body();
            const key = 'img_' + keyOf(u);
            await KV.setValue(key, buf, { contentType: ct });
            manifest.push({ url: u, key, bytes: buf.length, contentType: ct });
          } else manifest.push({ url: u, error: r.status() + ' ' + ct });
        } catch (e) { manifest.push({ url: u, error: String(e).slice(0, 200) }); }
      }
    };
    await Promise.all(Array.from({ length: 4 }, worker));
    await KV.setValue('image-manifest', manifest);
    return { label, products: data.products.length, images: manifest.length, failed: manifest.filter(m => m.error).length };
  }

  // PAGE: rendered text, meta, headings and screenshots for design reference.
  const info = await page.evaluate(() => ({
    url: location.href, title: document.title, lang: document.documentElement.lang,
    metaDescription: document.querySelector('meta[name=description]')?.content,
    canonical: document.querySelector('link[rel=canonical]')?.href,
    hreflang: [...document.querySelectorAll('link[rel=alternate][hreflang]')].map(l => l.hreflang + ' ' + l.href),
    headings: [...document.querySelectorAll('h1,h2,h3')].map(h => h.tagName + ': ' + h.innerText.trim()).slice(0, 80),
    jsonLd: [...document.querySelectorAll('script[type="application/ld+json"]')].map(s => s.textContent.slice(0, 5000)),
    text: document.body.innerText.slice(0, 40000),
    navLinks: [...new Set([...document.querySelectorAll('header a, nav a, footer a')].map(a => a.innerText.trim() + ' | ' + a.href))].slice(0, 200),
    imgsWithoutAlt: [...document.images].filter(i => !i.alt).length,
    images: document.images.length,
  }));
  const k = keyOf(request.url) || 'home';
  await page.setViewportSize({ width: 1440, height: 900 });
  await KV.setValue('shot_desktop_' + k, await page.screenshot({ fullPage: true, type: 'jpeg', quality: 55 }), { contentType: 'image/jpeg' });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(800);
  await KV.setValue('shot_mobile_' + k, await page.screenshot({ fullPage: true, type: 'jpeg', quality: 55 }), { contentType: 'image/jpeg' });
  return { label, ...info };
}
