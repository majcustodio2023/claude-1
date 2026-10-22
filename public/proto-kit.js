/* Prototype kit: the working parts every generated prototype shares.
   Mock cart + checkout (GCash, Maya, bank transfer, card, cash), booking calendar, scroll motion,
   mock forms and toasts. Nothing is charged or sent anywhere. Hooks are documented in lib/prototypeBrief.ts. */
(function () {
  "use strict";
  var P = (window.PROTO = window.PROTO || {});
  var doc = document;
  var root = doc.documentElement;
  var slug = P.slug || location.pathname.split("/")[2] || "demo";
  var reduced = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---------- small helpers ----------
  function el(tag, attrs, kids) {
    var n = doc.createElement(tag);
    if (attrs) for (var k in attrs) {
      if (k === "class") n.className = attrs[k];
      else if (k === "html") n.innerHTML = attrs[k];
      else if (k === "text") n.textContent = attrs[k];
      else if (k.slice(0, 2) === "on") n.addEventListener(k.slice(2), attrs[k]);
      else if (attrs[k] != null && attrs[k] !== false) n.setAttribute(k, attrs[k]);
    }
    (kids || []).forEach(function (c) { if (c != null) n.appendChild(typeof c === "string" ? doc.createTextNode(c) : c); });
    return n;
  }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function seeded(seed) {
    var h = 2166136261;
    for (var i = 0; i < seed.length; i++) { h ^= seed.charCodeAt(i); h = Math.imul(h, 16777619); }
    return function () { h += 0x6d2b79f5; var t = h; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  function digits(rand, n) { var s = ""; for (var i = 0; i < n; i++) s += Math.floor(rand() * 10); return s; }
  var currency = root.getAttribute("data-currency") || "PHP";
  var fmt;
  try { fmt = new Intl.NumberFormat(currency === "PHP" ? "en-PH" : undefined, { style: "currency", currency: currency, maximumFractionDigits: 2, minimumFractionDigits: 0 }); } catch (e) { fmt = { format: function (v) { return "₱" + Math.round(v).toLocaleString(); } }; }
  function money(v) { return fmt.format(Math.round(v * 100) / 100); }
  // Pages are served sandboxed (no storage), so the cart rides along in window.name, which survives
  // moving between the prototype's pages in the same tab.
  function store(key, val) {
    var all = {};
    try { all = JSON.parse(window.name || "{}"); if (!all || typeof all !== "object" || all.pk !== slug) all = { pk: slug }; } catch (e) { all = { pk: slug }; }
    if (val === undefined) return all[key] == null ? null : all[key];
    all[key] = val;
    try { window.name = JSON.stringify(all); } catch (e) {}
    return null;
  }
  var bizName = P.name || (doc.querySelector('meta[property="og:site_name"]') || {}).content || doc.title.split(/[|–—-]/)[0].trim() || "Our Shop";

  // Sample payment details: random but the same every visit for this prototype.
  var rnd = seeded(slug);
  var PAY = {
    gcash: "09" + digits(rnd, 2) + " " + digits(rnd, 3) + " " + digits(rnd, 4),
    maya: "09" + digits(rnd, 2) + " " + digits(rnd, 3) + " " + digits(rnd, 4),
    bdo: digits(rnd, 4) + " " + digits(rnd, 4) + " " + digits(rnd, 4),
    bpi: digits(rnd, 4) + " " + digits(rnd, 3) + " " + digits(rnd, 3),
  };

  // ---------- toast ----------
  var toastBox;
  P.toast = function (msg) {
    if (!toastBox) { toastBox = el("div", { class: "pk-toasts", "aria-live": "polite" }); doc.body.appendChild(toastBox); }
    var t = el("div", { class: "pk-toast", text: msg });
    toastBox.appendChild(t);
    setTimeout(function () { t.classList.add("pk-out"); setTimeout(function () { t.remove(); }, 400); }, 2600);
  };

  // ---------- icons (inline SVG) ----------
  var I = {
    bag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 8h14l-1.2 12.2a1 1 0 0 1-1 .8H7.2a1 1 0 0 1-1-.8z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>',
    x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>',
    left: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="m15 6-6 6 6 6"/></svg>',
    right: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="m9 6 6 6-6 6"/></svg>',
    card: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="5.5" width="18" height="13" rx="2.2"/><path d="M3 10h18M7 15h4"/></svg>',
    bank: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M3 9.5 12 4l9 5.5zM5 10v7M9.7 10v7M14.3 10v7M19 10v7M3.5 20h17"/></svg>',
    wallet: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M4 7.5h14a2 2 0 0 1 2 2V18a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/><path d="M4 7.5 15.5 4v3.5M16 14h.01"/></svg>',
    cash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="2.5" y="6.5" width="19" height="11" rx="1.6"/><circle cx="12" cy="12" r="2.6"/></svg>',
    cal: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="3.5" y="5" width="17" height="15.5" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/></svg>',
    minus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 12h12"/></svg>',
    plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 6v12M6 12h12"/></svg>',
  };

  // ---------- modal + drawer shell ----------
  function overlay(kind, title, onClose) {
    var panel = el("div", { class: "pk-panel pk-" + kind, role: "dialog", "aria-modal": "true", "aria-label": title });
    var head = el("div", { class: "pk-head" }, [el("h3", { text: title }), el("button", { class: "pk-x", "aria-label": "Close", html: I.x, onclick: close })]);
    var body = el("div", { class: "pk-body" });
    panel.appendChild(head);
    panel.appendChild(body);
    var wrap = el("div", { class: "pk-overlay pk-overlay-" + kind, onclick: function (e) { if (e.target === wrap) close(); } }, [panel]);
    doc.body.appendChild(wrap);
    root.classList.add("pk-locked");
    requestAnimationFrame(function () { wrap.classList.add("pk-open"); });
    function onKey(e) { if (e.key === "Escape") close(); }
    doc.addEventListener("keydown", onKey);
    function close() {
      wrap.classList.remove("pk-open");
      doc.removeEventListener("keydown", onKey);
      setTimeout(function () { wrap.remove(); if (!doc.querySelector(".pk-overlay")) root.classList.remove("pk-locked"); }, 320);
      if (onClose) onClose();
    }
    return { panel: panel, body: body, head: head, close: close, setTitle: function (t) { head.querySelector("h3").textContent = t; } };
  }

  // ---------- cart ----------
  var cart = store("cart") || [];
  function saveCart() { store("cart", cart); paintCount(); }
  function cartCount() { return cart.reduce(function (s, i) { return s + i.qty; }, 0); }
  function subtotal() { return cart.reduce(function (s, i) { return s + i.qty * i.price; }, 0); }
  var fab;
  function paintCount() {
    var n = cartCount();
    doc.querySelectorAll("[data-cart-count]").forEach(function (c) { c.textContent = n; c.classList.toggle("pk-has", n > 0); });
    if (n > 0 && !doc.querySelector("[data-cart-open]:not(.pk-fab)")) {
      if (!fab) {
        fab = el("button", { class: "pk-fab", "data-cart-open": "", "aria-label": "Open cart", html: I.bag + '<span class="pk-fab-n" data-cart-count></span>' });
        doc.body.appendChild(fab);
      }
      fab.querySelector(".pk-fab-n").textContent = n;
      fab.classList.add("pk-show");
    } else if (fab) fab.classList.toggle("pk-show", n > 0);
  }
  function addToCart(btn) {
    var name = btn.getAttribute("data-name") || (btn.closest("[data-product]") || btn.parentElement).querySelector("h3,h4,strong")?.textContent || "Item";
    var price = parseFloat(String(btn.getAttribute("data-price") || "0").replace(/[^\d.]/g, "")) || 0;
    var found = cart.find(function (i) { return i.name === name; });
    if (found) found.qty++;
    else cart.push({ name: name.trim(), price: price, qty: 1, image: btn.getAttribute("data-image") || "", note: btn.getAttribute("data-note") || "" });
    saveCart();
    btn.classList.add("pk-added");
    setTimeout(function () { btn.classList.remove("pk-added"); }, 900);
    var target = doc.querySelector("[data-cart-open]");
    if (target) { target.classList.remove("pk-bump"); void target.offsetWidth; target.classList.add("pk-bump"); }
    P.toast("Added " + name.trim() + " to your order");
  }
  function openCart() {
    var o = overlay("drawer", "Your order");
    function paint() {
      o.body.innerHTML = "";
      if (!cart.length) {
        o.body.appendChild(el("div", { class: "pk-empty" }, [el("div", { class: "pk-empty-ico", html: I.bag }), el("p", { text: "Your order is empty." }), el("button", { class: "pk-btn pk-ghost", text: "Keep browsing", onclick: o.close })]));
        return;
      }
      var list = el("div", { class: "pk-lines" });
      cart.forEach(function (it, idx) {
        list.appendChild(el("div", { class: "pk-line" }, [
          it.image ? el("img", { src: it.image, alt: "" }) : el("div", { class: "pk-line-ph", html: I.bag }),
          el("div", { class: "pk-line-main" }, [el("strong", { text: it.name }), it.note ? el("small", { text: it.note }) : null, el("span", { class: "pk-muted", text: money(it.price) })]),
          el("div", { class: "pk-qty" }, [
            el("button", { "aria-label": "Less", html: I.minus, onclick: function () { it.qty--; if (it.qty <= 0) cart.splice(idx, 1); saveCart(); paint(); } }),
            el("span", { text: String(it.qty) }),
            el("button", { "aria-label": "More", html: I.plus, onclick: function () { it.qty++; saveCart(); paint(); } }),
          ]),
        ]));
      });
      o.body.appendChild(list);
      o.body.appendChild(el("div", { class: "pk-sum" }, [el("span", { text: "Subtotal" }), el("strong", { text: money(subtotal()) })]));
      o.body.appendChild(el("button", { class: "pk-btn", text: "Checkout · " + money(subtotal()), onclick: function () { o.close(); setTimeout(checkout, 200); } }));
      o.body.appendChild(el("p", { class: "pk-fine", text: "Prototype checkout: no real payment is taken." }));
    }
    paint();
  }

  // ---------- payment step (shared by checkout and bookings) ----------
  function qrSvg(seed) {
    var r = seeded(seed), n = 25, s = 6, out = "";
    function finder(x, y) { out += '<rect x="' + x * s + '" y="' + y * s + '" width="' + 7 * s + '" height="' + 7 * s + '" fill="#111"/><rect x="' + (x + 1) * s + '" y="' + (y + 1) * s + '" width="' + 5 * s + '" height="' + 5 * s + '" fill="#fff"/><rect x="' + (x + 2) * s + '" y="' + (y + 2) * s + '" width="' + 3 * s + '" height="' + 3 * s + '" fill="#111"/>'; }
    for (var y = 0; y < n; y++) for (var x = 0; x < n; x++) {
      var inFinder = (x < 8 && y < 8) || (x > n - 9 && y < 8) || (x < 8 && y > n - 9);
      if (!inFinder && r() > 0.52) out += '<rect x="' + x * s + '" y="' + y * s + '" width="' + s + '" height="' + s + '" fill="#111"/>';
    }
    finder(0, 0); finder(n - 7, 0); finder(0, n - 7);
    return '<svg viewBox="0 0 ' + n * s + " " + n * s + '" width="150" height="150" shape-rendering="crispEdges"><rect width="100%" height="100%" fill="#fff"/>' + out + "</svg>";
  }
  function paymentStep(container, amount, opts, onPaid) {
    var methods = [
      { id: "gcash", label: "GCash", ico: I.wallet, sub: "Scan or send" },
      { id: "maya", label: "Maya", ico: I.wallet, sub: "E-wallet" },
      { id: "card", label: "Card", ico: I.card, sub: "Visa · Mastercard" },
      { id: "bank", label: "Bank transfer", ico: I.bank, sub: "BDO · BPI" },
    ];
    if (opts.cash) methods.push({ id: "cash", label: opts.cash, ico: I.cash, sub: "Pay when you're here" });
    var chosen = "gcash";
    var grid = el("div", { class: "pk-methods", role: "radiogroup" });
    var detail = el("div", { class: "pk-method-detail" });
    var pay = el("button", { class: "pk-btn" });
    function pick(id) {
      chosen = id;
      grid.querySelectorAll("button").forEach(function (b) { b.classList.toggle("pk-on", b.dataset.id === id); b.setAttribute("aria-checked", b.dataset.id === id); });
      detail.innerHTML = "";
      if (id === "gcash" || id === "maya") {
        var num = id === "gcash" ? PAY.gcash : PAY.maya;
        detail.appendChild(el("div", { class: "pk-ewallet" }, [
          el("div", { class: "pk-qr", html: qrSvg(slug + id) }),
          el("div", {}, [
            el("div", { class: "pk-muted", text: "Send " + money(amount) + " to" }),
            el("div", { class: "pk-big", text: num }),
            el("div", { class: "pk-muted", text: bizName }),
            el("p", { class: "pk-fine", text: "Sample " + (id === "gcash" ? "GCash" : "Maya") + " number and QR for this prototype. Don't send real money." }),
          ]),
        ]));
        pay.textContent = "I've sent " + money(amount);
      } else if (id === "bank") {
        detail.appendChild(el("div", { class: "pk-banks" }, [
          el("div", { class: "pk-bank" }, [el("strong", { text: "BDO Unibank" }), el("span", { class: "pk-big", text: PAY.bdo }), el("span", { class: "pk-muted", text: "Account name: " + bizName })]),
          el("div", { class: "pk-bank" }, [el("strong", { text: "BPI" }), el("span", { class: "pk-big", text: PAY.bpi }), el("span", { class: "pk-muted", text: "Account name: " + bizName })]),
        ]));
        detail.appendChild(el("p", { class: "pk-fine", text: "Sample account numbers for this prototype. Upload of the deposit slip happens here in the live site." }));
        pay.textContent = "I've transferred " + money(amount);
      } else if (id === "card") {
        var f = el("div", { class: "pk-cardform" }, [
          field("Card number", "cc-number", "4242 4242 4242 4242", "inputmode=numeric"),
          el("div", { class: "pk-row2" }, [field("Expiry", "cc-exp", "12 / 28"), field("CVC", "cc-csc", "123")]),
          field("Name on card", "cc-name", "Juan Dela Cruz"),
        ]);
        var numIn = f.querySelector("input");
        var brand = el("span", { class: "pk-brand", text: "VISA" });
        numIn.parentElement.appendChild(brand);
        numIn.addEventListener("input", function () {
          var v = numIn.value.replace(/\D/g, "").slice(0, 16);
          numIn.value = v.replace(/(.{4})/g, "$1 ").trim();
          brand.textContent = /^5[1-5]|^2[2-7]/.test(v) ? "MASTERCARD" : /^3[47]/.test(v) ? "AMEX" : "VISA";
        });
        var exp = f.querySelectorAll("input")[1];
        exp.addEventListener("input", function () { var v = exp.value.replace(/\D/g, "").slice(0, 4); exp.value = v.length > 2 ? v.slice(0, 2) + " / " + v.slice(2) : v; });
        detail.appendChild(f);
        detail.appendChild(el("p", { class: "pk-fine", text: "Test mode: any card number works and nothing is charged." }));
        pay.textContent = "Pay " + money(amount);
      } else {
        detail.appendChild(el("p", { class: "pk-muted", text: "No payment now. " + (opts.cashNote || "Pay when you arrive.") }));
        pay.textContent = opts.cashButton || "Confirm";
      }
    }
    methods.forEach(function (m) {
      grid.appendChild(el("button", { type: "button", role: "radio", "data-id": m.id, class: "pk-method", html: '<span class="pk-mi">' + m.ico + "</span><strong>" + esc(m.label) + "</strong><small>" + esc(m.sub) + "</small>", onclick: function () { pick(m.id); } }));
    });
    container.appendChild(el("div", { class: "pk-total" }, [el("span", { text: opts.totalLabel || "Total" }), el("strong", { text: money(amount) })]));
    container.appendChild(grid);
    container.appendChild(detail);
    container.appendChild(pay);
    pay.addEventListener("click", function () {
      if (chosen === "card") {
        var ins = detail.querySelectorAll("input");
        if (ins[0].value.replace(/\D/g, "").length < 12 || !ins[1].value || !ins[2].value) { P.toast("Fill in the card details (any test numbers work)"); return; }
      }
      pay.disabled = true;
      pay.innerHTML = '<span class="pk-spin"></span> Processing…';
      setTimeout(function () { onPaid(methods.find(function (m) { return m.id === chosen; }).label); }, 1500);
    });
    pick(chosen);
  }
  function field(label, auto, ph, extra) {
    var input = el("input", { autocomplete: auto, placeholder: ph || "", name: auto });
    if (extra === "inputmode=numeric") input.setAttribute("inputmode", "numeric");
    return el("label", { class: "pk-field" }, [el("span", { text: label }), el("div", { class: "pk-inwrap" }, [input])]);
  }
  function textField(label, name, ph, type, required) {
    var input = el("input", { name: name, placeholder: ph || "", type: type || "text" });
    if (required) input.required = true;
    return el("label", { class: "pk-field" }, [el("span", { text: label }), el("div", { class: "pk-inwrap" }, [input])]);
  }
  function steps(names, at) {
    return el("ol", { class: "pk-steps" }, names.map(function (n, i) { return el("li", { class: i < at ? "pk-done" : i === at ? "pk-now" : "", text: n }); }));
  }
  function ref(prefix) { return prefix + "-" + Math.random().toString(36).slice(2, 7).toUpperCase(); }

  // ---------- checkout ----------
  function checkout() {
    if (!cart.length) return openCart();
    var o = overlay("modal", "Checkout");
    var info = { mode: "delivery" };
    var fee = 0;
    function details() {
      o.body.innerHTML = "";
      o.body.appendChild(steps(["Details", "Payment", "Done"], 0));
      var toggle = el("div", { class: "pk-toggle" }, ["delivery", "pickup"].map(function (m) {
        return el("button", { type: "button", class: info.mode === m ? "pk-on" : "", text: m === "delivery" ? "Delivery" : "Pickup", onclick: function () { info.mode = m; details(); } });
      }));
      var form = el("form", { class: "pk-form" }, [
        toggle,
        textField("Full name", "name", "Juan Dela Cruz", "text", true),
        el("div", { class: "pk-row2" }, [textField("Mobile", "phone", "0917 123 4567", "tel", true), textField("Email", "email", "you@email.com", "email")]),
        info.mode === "delivery" ? textField("Delivery address", "address", "Street, barangay, city", "text", true) : el("p", { class: "pk-muted", text: "Pick up at " + bizName + ". We'll text you when it's ready." }),
        textField("Notes (optional)", "notes", info.mode === "delivery" ? "Gate code, landmark…" : "Pickup time…"),
      ]);
      fee = info.mode === "delivery" ? (subtotal() >= 1500 ? 0 : 79) : 0;
      var lines = el("div", { class: "pk-mini" }, cart.map(function (i) { return el("div", {}, [el("span", { text: i.qty + " × " + i.name }), el("span", { text: money(i.qty * i.price) })]); }));
      lines.appendChild(el("div", {}, [el("span", { text: info.mode === "delivery" ? "Delivery" : "Pickup" }), el("span", { text: fee ? money(fee) : "Free" })]));
      lines.appendChild(el("div", { class: "pk-mini-total" }, [el("span", { text: "Total" }), el("strong", { text: money(subtotal() + fee) })]));
      form.appendChild(lines);
      form.appendChild(el("button", { class: "pk-btn", text: "Continue to payment" }));
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var fd = new FormData(form);
        info.name = fd.get("name"); info.phone = fd.get("phone"); info.address = fd.get("address");
        payment();
      });
      o.body.appendChild(form);
    }
    function payment() {
      o.body.innerHTML = "";
      o.body.appendChild(steps(["Details", "Payment", "Done"], 1));
      paymentStep(o.body, subtotal() + fee, { cash: info.mode === "delivery" ? "Cash on delivery" : "Pay at pickup", cashButton: "Place order" }, done);
    }
    function done(method) {
      var total = subtotal() + fee;
      var no = ref("ORD");
      var items = cart.slice();
      cart = []; saveCart();
      o.setTitle("Order placed");
      o.body.innerHTML = "";
      o.body.appendChild(steps(["Details", "Payment", "Done"], 3));
      o.body.appendChild(el("div", { class: "pk-success" }, [
        el("div", { class: "pk-tick", html: I.check }),
        el("h4", { text: "Salamat, " + String(info.name || "friend").split(" ")[0] + "!" }),
        el("p", { text: "Order " + no + " is confirmed. " + (info.mode === "delivery" ? "Estimated delivery: 35 to 50 minutes." : "We'll text you when it's ready for pickup.") }),
      ]));
      var receipt = el("div", { class: "pk-mini pk-receipt" }, items.map(function (i) { return el("div", {}, [el("span", { text: i.qty + " × " + i.name }), el("span", { text: money(i.qty * i.price) })]); }));
      receipt.appendChild(el("div", {}, [el("span", { text: "Paid with" }), el("span", { text: method })]));
      receipt.appendChild(el("div", { class: "pk-mini-total" }, [el("span", { text: "Total" }), el("strong", { text: money(total) })]));
      o.body.appendChild(receipt);
      o.body.appendChild(el("button", { class: "pk-btn", text: "Done", onclick: o.close }));
      confetti(o.panel);
    }
    details();
  }

  // ---------- booking ----------
  function bookingConfig(node) {
    var cfg = { mode: "services", services: [], hours: "10:00-19:00", closed: [] };
    var src = node || doc.querySelector("[data-booking]");
    if (src) {
      cfg.mode = src.getAttribute("data-mode") || "services";
      try { cfg.services = JSON.parse(src.getAttribute("data-services") || "[]"); } catch (e) {}
      cfg.hours = src.getAttribute("data-hours") || cfg.hours;
      cfg.closed = (src.getAttribute("data-closed") || "").split(",").filter(function (x) { return x !== ""; }).map(Number);
      cfg.deposit = parseFloat(src.getAttribute("data-deposit") || "");
      cfg.title = src.getAttribute("data-title");
    } else if (window.PROTO_BOOKING) {
      var b = window.PROTO_BOOKING;
      cfg.mode = b.mode || cfg.mode; cfg.services = b.services || []; cfg.hours = b.hours || cfg.hours;
      cfg.closed = (b.closed == null ? [] : String(b.closed).split(",")).filter(function (x) { return x !== ""; }).map(Number);
      cfg.deposit = b.deposit;
    }
    if (cfg.mode === "services" && !cfg.services.length) cfg.services = [{ name: "Consultation", duration: 60, price: 0 }];
    return cfg;
  }
  function slots(hours, step) {
    var m = String(hours).match(/(\d{1,2}):?(\d{2})?\s*-\s*(\d{1,2}):?(\d{2})?/);
    var a = m ? +m[1] * 60 + +(m[2] || 0) : 600, b = m ? +m[3] * 60 + +(m[4] || 0) : 1140;
    var out = [];
    for (var t = a; t + step <= b; t += step) out.push(t);
    return out;
  }
  function hhmm(t) { var h = Math.floor(t / 60), m = t % 60; return ((h + 11) % 12 + 1) + ":" + (m < 10 ? "0" : "") + m + (h < 12 ? " AM" : " PM"); }
  function iso(d) { return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }
  function longDate(d) { return d.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" }); }

  function calendar(state, onPick, range) {
    var box = el("div", { class: "pk-cal" });
    var today = new Date(); today.setHours(0, 0, 0, 0);
    function paint() {
      box.innerHTML = "";
      var first = new Date(state.view.getFullYear(), state.view.getMonth(), 1);
      var head = el("div", { class: "pk-cal-head" }, [
        el("button", { type: "button", "aria-label": "Previous month", html: I.left, disabled: first <= new Date(today.getFullYear(), today.getMonth(), 1) ? "" : null, onclick: function () { state.view = new Date(first.getFullYear(), first.getMonth() - 1, 1); paint(); } }),
        el("strong", { text: first.toLocaleDateString(undefined, { month: "long", year: "numeric" }) }),
        el("button", { type: "button", "aria-label": "Next month", html: I.right, onclick: function () { state.view = new Date(first.getFullYear(), first.getMonth() + 1, 1); paint(); } }),
      ]);
      box.appendChild(head);
      var grid = el("div", { class: "pk-cal-grid" });
      ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].forEach(function (d) { grid.appendChild(el("span", { class: "pk-dow", text: d })); });
      for (var i = 0; i < first.getDay(); i++) grid.appendChild(el("span"));
      var days = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
      for (var d = 1; d <= days; d++) {
        (function (date) {
          var off = date < today || (state.closed || []).indexOf(date.getDay()) >= 0;
          var cls = "pk-day";
          var k = iso(date);
          if (range) {
            if (state.from && k === iso(state.from)) cls += " pk-sel";
            if (state.to && k === iso(state.to)) cls += " pk-sel";
            if (state.from && state.to && date > state.from && date < state.to) cls += " pk-inrange";
          } else if (state.date && k === iso(state.date)) cls += " pk-sel";
          if (k === iso(today)) cls += " pk-today";
          grid.appendChild(el("button", { type: "button", class: cls, disabled: off ? "" : null, text: String(date.getDate()), onclick: function () { onPick(date); paint(); } }));
        })(new Date(first.getFullYear(), first.getMonth(), d));
      }
      box.appendChild(grid);
    }
    paint();
    return box;
  }

  function bookingFlow(container, cfg, opts) {
    opts = opts || {};
    var st = { view: new Date(), closed: cfg.closed, service: null, party: 2, date: null, time: null, from: null, to: null };
    if (opts.service) st.service = cfg.services.find(function (s) { return s.name === opts.service; }) || null;
    var names = cfg.mode === "stay" ? ["Dates", "Details", "Payment", "Done"] : cfg.mode === "table" ? ["Party", "Date & time", "Details", "Done"] : ["Service", "Date & time", "Details", "Payment", "Done"];
    var titleTarget = opts.setTitle || function () {};
    function clear(at) { container.innerHTML = ""; container.appendChild(steps(names, at)); }
    function start() {
      if (cfg.mode === "stay") return stayDates();
      if (cfg.mode === "table") return party();
      if (st.service) return when();
      clear(0);
      var list = el("div", { class: "pk-services" });
      cfg.services.forEach(function (s) {
        list.appendChild(el("button", { type: "button", class: "pk-service", onclick: function () { st.service = s; when(); } }, [
          el("div", {}, [el("strong", { text: s.name }), el("small", { text: [s.duration ? s.duration + " min" : "", s.note || ""].filter(Boolean).join(" · ") })]),
          el("span", { class: "pk-price", text: s.price ? money(s.price) : "Free" }),
        ]));
      });
      container.appendChild(list);
    }
    function party() {
      clear(0);
      var n = el("div", { class: "pk-party" });
      for (var i = 1; i <= 10; i++) (function (k) { n.appendChild(el("button", { type: "button", class: st.party === k ? "pk-on" : "", text: k === 10 ? "10+" : String(k), onclick: function () { st.party = k; when(); } })); })(i);
      container.appendChild(el("p", { class: "pk-muted", text: "How many guests?" }));
      container.appendChild(n);
    }
    function when() {
      clear(1);
      var dur = (st.service && st.service.duration) || 60;
      var times = el("div", { class: "pk-times" });
      function paintTimes() {
        times.innerHTML = "";
        if (!st.date) { times.appendChild(el("p", { class: "pk-muted", text: "Pick a day to see open times." })); return; }
        var r = seeded(slug + iso(st.date) + (st.service ? st.service.name : ""));
        var all = slots(cfg.hours, cfg.mode === "table" ? 30 : Math.min(dur, 60));
        var now = new Date();
        all.forEach(function (t) {
          var past = iso(st.date) === iso(now) && t <= now.getHours() * 60 + now.getMinutes() + 30;
          var taken = past || r() < 0.3;
          times.appendChild(el("button", { type: "button", class: "pk-time" + (st.time === t ? " pk-sel" : ""), disabled: taken ? "" : null, text: hhmm(t), title: taken ? "Taken" : "", onclick: function () { st.time = t; details(); } }));
        });
      }
      var cal = calendar(st, function (d) { st.date = d; st.time = null; paintTimes(); });
      var summary = st.service ? el("div", { class: "pk-chosen" }, [el("strong", { text: st.service.name }), el("span", { text: (st.service.duration ? st.service.duration + " min · " : "") + (st.service.price ? money(st.service.price) : "") }), el("button", { type: "button", class: "pk-link", text: "Change", onclick: function () { st.service = null; start(); } })]) : el("div", { class: "pk-chosen" }, [el("strong", { text: "Table for " + st.party }), el("button", { type: "button", class: "pk-link", text: "Change", onclick: party })]);
      container.appendChild(summary);
      container.appendChild(el("div", { class: "pk-when" }, [cal, times]));
      paintTimes();
    }
    function stayDates() {
      clear(0);
      var note = el("p", { class: "pk-muted", text: "Pick your check-in date." });
      var go = el("button", { class: "pk-btn", text: "Continue", disabled: "", onclick: details });
      var cal = calendar(st, function (d) {
        if (!st.from || st.to || d <= st.from) { st.from = d; st.to = null; note.textContent = "Now pick your check-out date."; go.disabled = true; }
        else { st.to = d; var n = Math.round((st.to - st.from) / 864e5); note.textContent = n + " night" + (n > 1 ? "s" : "") + ": " + longDate(st.from) + " to " + longDate(st.to); go.disabled = false; }
      }, true);
      if (cfg.services.length) {
        var room = el("select", { class: "pk-select", onchange: function () { st.service = cfg.services[room.selectedIndex]; } }, cfg.services.map(function (s) { return el("option", { text: s.name + (s.price ? " · " + money(s.price) + "/night" : "") }); }));
        st.service = st.service || cfg.services[0];
        container.appendChild(room);
      }
      container.appendChild(cal);
      container.appendChild(note);
      container.appendChild(go);
    }
    function amountDue() {
      if (cfg.mode === "stay") { var n = Math.max(1, Math.round((st.to - st.from) / 864e5)); return ((st.service && st.service.price) || 0) * n; }
      return (st.service && st.service.price) || 0;
    }
    function details() {
      clear(cfg.mode === "stay" ? 1 : 2);
      var when = cfg.mode === "stay" ? longDate(st.from) + " to " + longDate(st.to) : longDate(st.date) + " at " + hhmm(st.time);
      container.appendChild(el("div", { class: "pk-chosen" }, [el("strong", { text: st.service ? st.service.name : "Table for " + st.party }), el("span", { text: when }), el("button", { type: "button", class: "pk-link", text: "Change", onclick: start })]));
      var form = el("form", { class: "pk-form" }, [
        textField("Full name", "name", "Juan Dela Cruz", "text", true),
        el("div", { class: "pk-row2" }, [textField("Mobile", "phone", "0917 123 4567", "tel", true), textField("Email", "email", "you@email.com", "email")]),
        textField("Notes (optional)", "notes", cfg.mode === "table" ? "Occasion, seating preference…" : "Anything we should know?"),
        el("button", { class: "pk-btn", text: cfg.mode === "table" || !amountDue() ? "Confirm booking" : "Continue to payment" }),
      ]);
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        st.name = new FormData(form).get("name");
        if (cfg.mode === "table" || !amountDue()) confirm("No payment needed");
        else pay();
      });
      container.appendChild(form);
    }
    function pay() {
      clear(cfg.mode === "stay" ? 2 : 3);
      var full = amountDue();
      var dep = cfg.deposit ? Math.min(full, cfg.deposit) : Math.max(Math.round(full * 0.3), Math.min(full, 300));
      paymentStep(container, dep, { totalLabel: "Deposit to hold your slot (of " + money(full) + ")", cash: "Pay at the venue", cashNote: "Your slot is held for 15 minutes past the time.", cashButton: "Confirm booking" }, confirm);
    }
    function confirm(method) {
      clear(names.length);
      titleTarget("You're booked");
      var code = ref("BK");
      var start = cfg.mode === "stay" ? st.from : new Date(st.date.getFullYear(), st.date.getMonth(), st.date.getDate(), Math.floor(st.time / 60), st.time % 60);
      var end = cfg.mode === "stay" ? st.to : new Date(start.getTime() + (((st.service && st.service.duration) || 90) * 60000));
      var what = (st.service ? st.service.name : "Table for " + st.party) + " · " + bizName;
      container.appendChild(el("div", { class: "pk-success" }, [
        el("div", { class: "pk-tick", html: I.check }),
        el("h4", { text: "See you, " + String(st.name || "friend").split(" ")[0] + "!" }),
        el("p", { text: what }),
        el("p", { class: "pk-big", text: cfg.mode === "stay" ? longDate(st.from) + " to " + longDate(st.to) : longDate(st.date) + ", " + hhmm(st.time) }),
        el("p", { class: "pk-muted", text: "Booking reference " + code + " · " + method + ". A confirmation text is on its way." }),
      ]));
      var ics = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Prototype//EN", "BEGIN:VEVENT", "UID:" + code + "@prototype", "DTSTAMP:" + new Date().toISOString().replace(/[-:]|\.\d+/g, ""), "DTSTART:" + start.toISOString().replace(/[-:]|\.\d+/g, ""), "DTEND:" + end.toISOString().replace(/[-:]|\.\d+/g, ""), "SUMMARY:" + what, "END:VEVENT", "END:VCALENDAR"].join("\r\n");
      var a = el("a", { class: "pk-btn pk-ghost", download: "booking-" + code + ".ics", href: "data:text/calendar;charset=utf-8," + encodeURIComponent(ics), html: I.cal + " Add to calendar" });
      container.appendChild(a);
      if (opts.close) container.appendChild(el("button", { class: "pk-btn", text: "Done", onclick: opts.close }));
      else container.appendChild(el("button", { class: "pk-btn", text: "Book another", onclick: function () { st = { view: new Date(), closed: cfg.closed, party: 2 }; start(); } }));
      confetti(container);
    }
    start();
  }
  function openBooking(btn) {
    var cfg = bookingConfig();
    var o = overlay("modal", btn && btn.getAttribute("data-title") || (cfg.mode === "table" ? "Reserve a table" : cfg.mode === "stay" ? "Book your stay" : "Book an appointment"));
    bookingFlow(o.body, cfg, { service: btn && btn.getAttribute("data-service"), close: o.close, setTitle: o.setTitle });
  }

  // ---------- confetti ----------
  function confetti(host) {
    if (reduced) return;
    var c = el("div", { class: "pk-confetti" });
    var colors = ["var(--proto-accent)", "#ffd166", "#06d6a0", "#ef476f", "#118ab2"];
    for (var i = 0; i < 36; i++) {
      var s = el("i");
      s.style.left = Math.random() * 100 + "%";
      s.style.background = colors[i % colors.length];
      s.style.animationDelay = Math.random() * 0.4 + "s";
      s.style.transform = "rotate(" + Math.random() * 360 + "deg)";
      c.appendChild(s);
    }
    host.appendChild(c);
    setTimeout(function () { c.remove(); }, 2600);
  }

  // ---------- motion ----------
  function reveal() {
    var items = doc.querySelectorAll("[data-reveal]");
    if (!("IntersectionObserver" in window) || reduced) { items.forEach(function (n) { n.classList.add("pk-in"); }); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var n = e.target, d = parseInt(n.getAttribute("data-delay") || "0", 10);
        setTimeout(function () { n.classList.add("pk-in"); }, d);
        io.unobserve(n);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    items.forEach(function (n) { io.observe(n); });
  }
  function counts() {
    var items = doc.querySelectorAll("[data-count]");
    if (!items.length) return;
    function run(n) {
      var to = parseFloat(n.getAttribute("data-count")) || 0, dec = (String(to).split(".")[1] || "").length, suf = n.getAttribute("data-suffix") || "", pre = n.getAttribute("data-prefix") || "", t0 = performance.now();
      function step(t) {
        var p = Math.min(1, (t - t0) / 1600), v = to * (1 - Math.pow(1 - p, 3));
        n.textContent = pre + v.toLocaleString(undefined, { minimumFractionDigits: dec, maximumFractionDigits: dec }) + suf;
        if (p < 1) requestAnimationFrame(step);
      }
      reduced ? (n.textContent = pre + to.toLocaleString() + suf) : requestAnimationFrame(step);
    }
    if (!("IntersectionObserver" in window)) return items.forEach(run);
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { run(e.target); io.unobserve(e.target); } }); }, { threshold: 0.4 });
    items.forEach(function (n) { io.observe(n); });
  }
  function parallax() {
    var items = Array.prototype.slice.call(doc.querySelectorAll("[data-parallax]"));
    if (!items.length || reduced) return;
    var ticking = false;
    function paint() {
      ticking = false;
      var vh = innerHeight;
      items.forEach(function (n) {
        var r = n.getBoundingClientRect();
        if (r.bottom < -200 || r.top > vh + 200) return;
        var k = parseFloat(n.getAttribute("data-parallax")) || 0.2;
        n.style.transform = "translate3d(0," + ((r.top + r.height / 2 - vh / 2) * -k).toFixed(1) + "px,0)";
      });
    }
    addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(paint); } }, { passive: true });
    paint();
  }

  // ---------- wiring ----------
  doc.addEventListener("click", function (e) {
    var t = e.target.closest && e.target.closest("[data-add-to-cart],[data-cart-open],[data-book-open],[data-checkout],a[href^='#']");
    if (!t) return;
    if (t.hasAttribute("data-add-to-cart")) { e.preventDefault(); addToCart(t); }
    else if (t.hasAttribute("data-cart-open")) { e.preventDefault(); openCart(); }
    else if (t.hasAttribute("data-checkout")) { e.preventDefault(); checkout(); }
    else if (t.hasAttribute("data-book-open")) { e.preventDefault(); openBooking(t); }
    else {
      // With a <base> on the page, "#section" would otherwise jump back to the home page.
      var id = t.getAttribute("href").slice(1);
      var target = id ? doc.getElementById(id) : null;
      if (target || !id) { e.preventDefault(); (target || doc.body).scrollIntoView({ behavior: reduced ? "auto" : "smooth" }); }
    }
  });
  doc.addEventListener("submit", function (e) {
    var f = e.target;
    if (!f.hasAttribute || !f.hasAttribute("data-mock-form")) return;
    e.preventDefault();
    var msg = f.getAttribute("data-success") || "Thanks! We'll get back to you shortly.";
    f.innerHTML = '<div class="pk-success pk-inline"><div class="pk-tick">' + I.check + "</div><p>" + esc(msg) + "</p></div>";
  });

  function init() {
    doc.querySelectorAll("[data-booking]").forEach(function (n) {
      n.classList.add("pk-booking-inline");
      bookingFlow(n, bookingConfig(n));
    });
    paintCount();
    reveal();
    counts();
    parallax();
    if (P.badge) doc.body.appendChild(el("div", { class: "pk-badge", text: P.badge }));
    P.openCart = openCart; P.checkout = checkout; P.openBooking = openBooking;
  }
  if (doc.readyState === "loading") doc.addEventListener("DOMContentLoaded", init);
  else init();
})();
