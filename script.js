const DATA_PATHS = {
  site: "productdata/site.json",
  products: "productdata/products-index.json",
  details: "productdata/details.json",
  catalogs: "productdata/catalogs-index.json"
};

const header = document.querySelector(".site-header");
const inquiryForm = document.querySelector("#inquiryForm");
let siteConfig = {};
let productState = { newProducts: [], allProducts: [], filters: [] };

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function loadJson(path, fallback) {
  const response = await fetch(path, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Cannot load ${path}`);
  }
  const text = await response.text();
  return JSON.parse(text.replace(/^\uFEFF/, ""));
}

function whatsappUrl(message) {
  const phone = siteConfig.whatsapp || "8617716750612";
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

function updateWhatsappLinks() {
  const message = `Hello, I want the ${siteConfig.brandNameEn || "GraceLingerie"} catalog and quotation.`;
  document.querySelectorAll("[data-whatsapp-link]").forEach((link) => {
    link.href = whatsappUrl(message);
  });
}

function applySiteConfig(site) {
  siteConfig = site || {};
  document.title = siteConfig.title || "格蕾丝女性内衣 | GraceLingerie";
  document.querySelector('meta[name="description"]')?.setAttribute("content", siteConfig.description || "");
  document.querySelector("[data-brand-name]").textContent = siteConfig.brandName || "格蕾丝女性内衣";
  document.querySelector("[data-brand-en]").textContent = siteConfig.brandNameEn || "GraceLingerie";
  document.querySelector("[data-hero-eyebrow]").textContent = siteConfig.hero?.eyebrow || "Puning Lingerie Wholesale";
  document.querySelector("[data-hero-intro]").textContent = siteConfig.hero?.intro || "";

  const heading = siteConfig.hero?.headingLines || ["舒适文胸与", "无痕内衣", "批发目录一页看清"];
  document.querySelector("[data-hero-title]").innerHTML = heading
    .map((line, index) => index === heading.length - 1 ? `<span>${escapeHtml(line)}</span>` : `${escapeHtml(line)}<br>`)
    .join("");

  const proof = document.querySelector("[data-proof-list]");
  proof.innerHTML = (siteConfig.proof || []).map((item) => `
    <div>
      <dt>${escapeHtml(item.label)}</dt>
      <dd>${escapeHtml(item.value)}</dd>
    </div>
  `).join("");

  const ticker = document.querySelector("[data-ticker]");
  const tickerItems = siteConfig.ticker || ["Bras", "Panties", "Seamless Underwear", "Shapewear", "Sleepwear", "OEM/ODM"];
  ticker.innerHTML = [...tickerItems, ...tickerItems].map((item) => `<span>${escapeHtml(item)}</span>`).join("");

  updateWhatsappLinks();
}

function productById(id) {
  return productState.allProducts.find((item) => item.id === id);
}

function productCard(product, index = 0) {
  const tags = (product.tags || []).join(" ");
  const featureClass = product.featured ? " feature-card" : "";
  const linkText = product.linkText || "询盘";
  return `
    <article class="product-card${featureClass}" data-tags="${escapeHtml(tags)}" style="--accent:${escapeHtml(product.accent || "#4be683")}; --tilt:${escapeHtml(product.tilt || "0deg")};">
      <div class="media">
        <img src="${escapeHtml(product.cover)}" alt="${escapeHtml(product.title)}" loading="${index ? "lazy" : "eager"}">
      </div>
      <div class="card-copy">
        <span>${escapeHtml(product.subtitle || "Product")}</span>
        <h3>${escapeHtml(product.title)}</h3>
        <p>${escapeHtml(product.description)}</p>
        <a href="#contact">${escapeHtml(linkText)} →</a>
      </div>
    </article>
  `;
}

function renderHeroProducts() {
  const visual = document.querySelector("[data-hero-visual]");
  const featured = productById(siteConfig.hero?.featuredProductId) || productState.newProducts[0] || productState.allProducts[0];
  const floating = (siteConfig.hero?.floatingProductIds || [])
    .map(productById)
    .filter(Boolean);

  if (!featured) {
    visual.innerHTML = '<div class="hero-loading">请先在 productdata/products 中添加产品。</div>';
    return;
  }

  const [firstFloating, secondFloating] = floating;
  visual.innerHTML = `
    <figure class="spotlight-card">
      <img src="${escapeHtml(featured.cover)}" alt="${escapeHtml(featured.title)}">
      <figcaption>
        <span>${escapeHtml(featured.subtitle || "Featured")}</span>
        <strong>${escapeHtml(featured.title)}</strong>
      </figcaption>
    </figure>
    ${firstFloating ? `
      <figure class="floating-card card-a">
        <img src="${escapeHtml(firstFloating.cover)}" alt="${escapeHtml(firstFloating.title)}">
      </figure>
    ` : ""}
    ${secondFloating ? `
      <figure class="floating-card card-b">
        <img src="${escapeHtml(secondFloating.cover)}" alt="${escapeHtml(secondFloating.title)}">
      </figure>
    ` : ""}
  `;
}

function renderDeck(deckId, products, emptyText) {
  const deck = document.querySelector(`#${deckId}`);
  if (!deck) return;
  deck.innerHTML = products.length
    ? products.map(productCard).join("")
    : `<p class="data-status">${escapeHtml(emptyText)}</p>`;
}

function renderFilters() {
  const row = document.querySelector("[data-filter-row]");
  const labels = {
    front: "前扣",
    seamless: "无痕",
    detail: "细节",
    set: "套装",
    bra: "文胸",
    basic: "基础款"
  };
  const filters = productState.filters.filter((item) => item !== "new" && item !== "standard");
  row.innerHTML = [
    '<button class="filter-chip is-active" type="button" data-filter="all" role="tab" aria-selected="true">All</button>',
    ...filters.map((filter) => `<button class="filter-chip" type="button" data-filter="${escapeHtml(filter)}" role="tab" aria-selected="false">${escapeHtml(labels[filter] || filter)}</button>`)
  ].join("");

  row.querySelectorAll(".filter-chip").forEach((button) => {
    button.addEventListener("click", () => {
      const filter = button.dataset.filter;
      row.querySelectorAll(".filter-chip").forEach((item) => {
        const active = item === button;
        item.classList.toggle("is-active", active);
        item.setAttribute("aria-selected", String(active));
      });

      document.querySelectorAll("#standardProductDeck .product-card").forEach((card) => {
        const matches = filter === "all" || card.dataset.tags.split(" ").includes(filter);
        card.classList.toggle("is-hidden", !matches);
      });

      document.querySelector("#standardProductDeck")?.scrollTo({ left: 0, behavior: "smooth" });
    });
  });
}

function renderProductSelect() {
  const select = document.querySelector("[data-product-select]");
  const options = productState.allProducts.map((item) => `<option>${escapeHtml(item.title)}</option>`);
  select.innerHTML = [
    "<option>文胸 / Bras</option>",
    "<option>无痕内衣 / Seamless</option>",
    "<option>OEM/ODM</option>",
    ...options
  ].join("");
}

function renderDetails(details) {
  const grid = document.querySelector("[data-detail-grid]");
  grid.innerHTML = (details || []).map((item, index) => `
    <article class="detail-item reveal" data-delay="${index * 80}">
      <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.title)}" loading="lazy">
      <div>
        <span>${escapeHtml(item.label)}</span>
        <h3>${escapeHtml(item.title)}</h3>
        <p>${escapeHtml(item.description)}</p>
      </div>
    </article>
  `).join("");
}

function renderReport(catalogs) {
  const report = siteConfig.report || {};
  const reportFile = (catalogs.catalogs || []).find((item) => item.type === "quality-report") || (catalogs.catalogs || [])[0];
  document.querySelector("[data-report-copy]").textContent = `报告编号 ${report.reportNo || "240650440"}，样品名称：${report.sample || "文胸"}，款号：${report.styleNo || "188#"}。${report.summary || ""}`;
  document.querySelector("[data-report-link]").href = reportFile?.file || "productdata/catalogs/quality-report-240650440.pdf";
  document.querySelector("[data-report-link]").textContent = reportFile?.buttonText || "打开检测报告 PDF";
  document.querySelector("[data-report-list]").innerHTML = (report.items || []).map((item) => `
    <div>
      <span>${escapeHtml(item.label)}</span>
      <strong>${escapeHtml(item.value)}</strong>
      <em>${escapeHtml(item.note)}</em>
    </div>
  `).join("");
}

function visibleCards(deck) {
  return [...deck.querySelectorAll(".product-card")].filter((card) => !card.classList.contains("is-hidden"));
}

function setupDeckControls() {
  document.querySelectorAll("[data-scroll-deck]").forEach((button) => {
    button.addEventListener("click", () => {
      const deck = document.querySelector(`#${button.dataset.scrollDeck}`);
      const first = deck ? visibleCards(deck)[0] : null;
      const amount = first ? first.getBoundingClientRect().width + 28 : 360;
      deck?.scrollBy({ left: amount * Number(button.dataset.scrollDir || 1), behavior: "smooth" });
    });
  });
}

function setupPointerTilt() {
  if (!window.matchMedia("(pointer:fine)").matches) return;
  document.querySelectorAll(".product-card").forEach((card) => {
    card.addEventListener("pointermove", (event) => {
      const rect = card.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      card.style.transform = `translateY(-8px) rotateX(${y * -4}deg) rotateY(${x * 5}deg)`;
    });

    card.addEventListener("pointerleave", () => {
      card.style.transform = "";
    });
  });
}

function setupReveal() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const delay = entry.target.dataset.delay || 0;
      entry.target.style.setProperty("--delay", `${delay}ms`);
      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.16 });

  document.querySelectorAll(".reveal").forEach((item) => observer.observe(item));
}

function setupInquiryForm() {
  inquiryForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(inquiryForm);
    const product = data.get("product") || "Bras";
    const quantity = data.get("quantity") || "TBD";
    const market = data.get("market") || "TBD";
    const message = [
      `Hello, I want the ${siteConfig.brandNameEn || "GraceLingerie"} catalog and quotation.`,
      `Product: ${product}`,
      `Quantity: ${quantity}`,
      `Market: ${market}`
    ].join("\n");
    window.open(whatsappUrl(message), "_blank", "noopener,noreferrer");
  });
}

async function init() {
  header.dataset.elevated = String(window.scrollY > 12);
  window.addEventListener("scroll", () => {
    header.dataset.elevated = String(window.scrollY > 12);
  }, { passive: true });

  try {
    const [site, products, details, catalogs] = await Promise.all([
      loadJson(DATA_PATHS.site, {}),
      loadJson(DATA_PATHS.products, { newProducts: [], allProducts: [], filters: [] }),
      loadJson(DATA_PATHS.details, []),
      loadJson(DATA_PATHS.catalogs, { catalogs: [] })
    ]);

    productState = products;
    applySiteConfig(site);
    renderHeroProducts();
    renderDeck("newProductDeck", productState.newProducts || [], "暂无新品，请在 productdata/products/new 中添加。");
    renderDeck("standardProductDeck", productState.allProducts || [], "暂无产品，请在 productdata/products 中添加。");
    renderFilters();
    renderProductSelect();
    renderDetails(details);
    renderReport(catalogs);
    setupDeckControls();
    setupPointerTilt();
    setupReveal();
    setupInquiryForm();
  } catch (error) {
    console.error(error);
    document.querySelectorAll(".data-status").forEach((item) => {
      item.textContent = "资料加载失败。请确认 productdata/site.json 与索引文件已上传。";
    });
  }
}

init();
