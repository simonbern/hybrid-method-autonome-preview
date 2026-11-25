(() => {
  const table = JSON.parse(document.getElementById("i18n").textContent);
  // Storage throws when blocked (private mode, blocked site data): never let it stop the page.
  const get = () => { try { return localStorage.getItem("lang"); } catch (e) { return null; } };
  const set = (l) => { try { localStorage.setItem("lang", l); } catch (e) {} };
  const stored = get();
  const initial = ["fr", "en"].includes(stored) ? stored : (navigator.language.startsWith("fr") ? "fr" : "en");
  const ATTRS = ["alt", "content", "aria-label"]; // data-i18n-<attr>="key" sets that attribute
  function apply(lang) {
    const t = table[lang];
    document.documentElement.lang = lang;
    for (const el of document.querySelectorAll("[data-i18n]")) {
      if (el.dataset.i18n in t) el.textContent = t[el.dataset.i18n];
    }
    for (const a of ATTRS) {
      for (const el of document.querySelectorAll(`[data-i18n-${a}]`)) {
        const k = el.getAttribute(`data-i18n-${a}`);
        if (k in t) el.setAttribute(a, t[k]);
      }
    }
    document.getElementById("lang-toggle").textContent = lang === "fr" ? "EN" : "FR";
    set(lang);
  }
  document.getElementById("lang-toggle").addEventListener("click", () =>
    apply(document.documentElement.lang === "fr" ? "en" : "fr"));
  apply(initial);
})();

// Reveal on scroll, strictly in DOM order: when an item enters view, every
// earlier hidden item is revealed with it, so nothing appears out of order.
(() => {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) return;
  const items = [...document.querySelectorAll(".rv")];
  document.documentElement.classList.add("js");
  let next = 0;
  const io = new IntersectionObserver((entries) => {
    let last = -1;
    for (const e of entries) if (e.isIntersecting) last = Math.max(last, items.indexOf(e.target));
    // stagger by 80ms, capped so a jump down the page (anchor link) never waits seconds
    for (let delay = 0; next <= last; next++, delay = Math.min(delay + 80, 400)) {
      items[next].style.transitionDelay = delay + "ms";
      items[next].classList.add("in");
      const el = items[next];
      setTimeout(() => { el.style.transitionDelay = ""; }, delay + 650); // after the 600ms reveal
      io.unobserve(items[next]);
    }
  }, { rootMargin: "0px 0px -8% 0px" });
  items.forEach((el) => io.observe(el));
})();

// Progression chart: give the line its length so CSS can draw it in when the figure reveals.
for (const path of document.querySelectorAll(".chart .draw")) {
  path.style.setProperty("--len", Math.ceil(path.getTotalLength()));
}

// Program picker: one card at a time. The choice rides along to the plans as ?program=<id>.
(() => {
  const cards = [...document.querySelectorAll("[data-program]")];
  const bar = document.getElementById("chosen");
  const name = document.getElementById("chosen-name");
  const go = document.getElementById("chosen-go");
  const plans = [...document.querySelectorAll("a[data-plan]")];
  function withProgram(href, id) {
    if (/^https?:/i.test(href)) { const u = new URL(href); u.searchParams.set("program", id); return u.href; }
    // "#whop-monthly" style placeholders: drop any earlier program, then append
    const bare = href.replace(/([?&])program=[\w-]*&?/, "$1").replace(/[?&]$/, "");
    return bare + (bare.includes("?") ? "&" : "?") + "program=" + id;
  }
  function pick(id) {
    const card = cards.find((c) => c.dataset.program === id);
    if (!card) return;
    for (const c of cards) {
      c.classList.toggle("sel", c === card);
      c.querySelector(".pick").setAttribute("aria-pressed", String(c === card));
    }
    bar.hidden = false;
    name.textContent = card.querySelector("h3").textContent;
    go.setAttribute("href", "#plans?program=" + id);
    for (const a of plans) a.setAttribute("href", withProgram(a.getAttribute("href"), id));
  }
  for (const c of cards) c.addEventListener("click", () => pick(c.dataset.program));
  go.addEventListener("click", (e) => {
    e.preventDefault(); // "#plans?program=x" is not an element id, so scroll ourselves
    const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.getElementById("plans").scrollIntoView({ behavior: still ? "auto" : "smooth" });
    history.replaceState(null, "", go.getAttribute("href"));
  });
  const fromUrl = location.hash.match(/program=([\w-]+)/);
  if (fromUrl) pick(fromUrl[1]);
})();

// Header: dark glass once the page scrolls; burger opens the menu below 1100px, any link closes it.
(() => {
  const nav = document.getElementById("nav");
  const burger = document.getElementById("burger");
  const onScroll = () => nav.classList.toggle("solid", scrollY > 40);
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();
  const setOpen = (open) => { nav.classList.toggle("open", open); burger.setAttribute("aria-expanded", String(open)); };
  burger.addEventListener("click", () => setOpen(!nav.classList.contains("open")));
  for (const a of nav.querySelectorAll(".menu a, .nav-cta")) a.addEventListener("click", () => setOpen(false));
  addEventListener("keydown", (e) => { if (e.key === "Escape") setOpen(false); });
})();
