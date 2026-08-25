/* =============================BearsOnInk===================================
   Bears On Ink — main.js
   ========================================================================== */

/* ==========================================================================
   1. CONFIGURATION  —  edit only this block
   ========================================================================== */

var CONFIG = {
  // Official X profile
  X_PROFILE: "https://x.com/BearsOnInk",

  // Pinned post URL. Placeholder for now — replace with the real pinned post.
  X_PINNED_POST: "https://x.com/BearsOnInk/status/2091639066576183572",

  // OpenSea collection URL. Leave empty until Step 3.
  OPENSEA_URL: "",

  // Google Apps Script Web App URL (deploy Code.gs, paste the /exec URL here).
  // Leave empty and the site falls back to local-only storage.
  SHEET_ENDPOINT: "https://script.google.com/macros/s/AKfycbwofrG2RBHEvnbbDfDIvWWVr_kpkJdOJiKYAu3ZPPVE3EN3iR-Q-1oj9WvYRce_ZktgaQ/exec",

  SUPPLY: "3,000",
  NETWORK: "Ink"
};

/* --------------------------------------------------------------------------
   2. NFT IMAGE LIST — add new filenames here. Files live in assets/images/nft/
   -------------------------------------------------------------------------- */

var NFT_FILES = [
  "1.png","2.png","3.png","4.png","5.png","6.png","7.png","8.png","9.png","10.png",
  "11.png","12.png","13.png","14.png","15.png","16.png","17.png","18.png","19.png","20.png",
  "21.png","22.png","23.png","24.png","25.png","26.png","27.png","28.png","29.png"
];

/* ========================================================================== */

(function () {
  "use strict";

  var BASE = document.body.getAttribute("data-base") || "";
  var NFT_DIR = BASE + "assets/images/nft/";
  var RAINBOW = ["#ff2d2d","#ff8a00","#ffd400","#28c76f","#00b7ff","#7a00ff","#ff2ea6"];
  var PURPLE = "#7a00ff";
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function nftSrc(i) { return NFT_DIR + NFT_FILES[i]; }
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }

  /* ---------- in-page messages (never browser alerts) ---------- */

  function toast(title, msg, ms) {
    var layer = $("#toast-layer");
    if (!layer) return;
    var el = document.createElement("div");
    el.className = "toast";
    el.setAttribute("role", "status");
    var t = document.createElement("strong");
    t.textContent = title;
    var p = document.createElement("span");
    p.textContent = msg;
    el.appendChild(t); el.appendChild(p);
    layer.appendChild(el);
    setTimeout(function () {
      el.classList.add("is-out");
      setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 220);
    }, ms || 4200);
  }

  /* ---------- links driven by config ---------- */

  function applyConfigLinks() {
    $$("[data-link='x-profile']").forEach(function (a) { a.href = CONFIG.X_PROFILE; });
    $$("[data-link='x-post']").forEach(function (a) { a.href = CONFIG.X_PINNED_POST; });
    $$("[data-link='opensea']").forEach(function (el) {
      if (CONFIG.OPENSEA_URL) {
        el.setAttribute("href", CONFIG.OPENSEA_URL);
        el.removeAttribute("aria-disabled");
      } else {
        el.setAttribute("aria-disabled", "true");
        el.addEventListener("click", function (e) {
          e.preventDefault();
          toast("OPENSEA", "The OpenSea collection link will be added when the collection goes live.");
        });
      }
    });
  }

  /* ---------- menu ---------- */

  function initMenu() {
    var btn = $("#menu-btn");
    var panel = $("#menu-panel");
    if (!btn || !panel) return;
    var closeBtn = $("#menu-close");

    function open() {
      panel.classList.add("is-open");
      btn.setAttribute("aria-expanded", "true");
      var first = panel.querySelector(".menu-link, .menu-close");
      if (first) first.focus();
    }
    function close() {
      panel.classList.remove("is-open");
      btn.setAttribute("aria-expanded", "false");
      btn.focus();
    }
    btn.addEventListener("click", open);
    if (closeBtn) closeBtn.addEventListener("click", close);
    panel.addEventListener("click", function (e) { if (e.target === panel) close(); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && panel.classList.contains("is-open")) close();
    });

    var locked = $("#menu-staking");
    if (locked) {
      locked.addEventListener("click", function (e) {
        e.preventDefault();
        toast("STAKING LOCKED", "Staking will be activated after the mint is complete.");
      });
    }
  }

  /* ---------- intro animation ---------- */

  function initIntro() {
    var intro = $("#intro");
    if (!intro) return;
    // wait for the pixel font so the sampled text is correct
    if (document.fonts && document.fonts.load) {
      document.fonts.load('16px "Press Start 2P"').then(startIntro, startIntro);
    } else {
      startIntro();
    }
  }

  function startIntro() {
    var intro = $("#intro");
    if (!intro) return;
    if (sessionStorage.getItem("boi_intro") === "1") { intro.parentNode.removeChild(intro); return; }

    var canvas = $("canvas", intro);
    var ctx = canvas.getContext("2d");
    document.body.classList.add("intro-lock");

    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var W = 0, H = 0, cell = 8, blocks = [];

    function build() {
      W = intro.clientWidth; H = intro.clientHeight;
      canvas.width = Math.floor(W * dpr); canvas.height = Math.floor(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.imageSmoothingEnabled = false;

      cell = W < 520 ? 7 : W < 900 ? 9 : 11;

      var lines = W < 720 ? ["BEARS ON", "INK"] : ["BEARS ON INK"];
      var off = document.createElement("canvas");
      off.width = Math.max(1, Math.floor(W)); off.height = Math.max(1, Math.floor(H));
      var octx = off.getContext("2d");
      octx.fillStyle = "#fff";
      octx.textAlign = "center";
      octx.textBaseline = "middle";

      var longest = lines.reduce(function (a, b) { return a.length > b.length ? a : b; });
      var size = 10;
      // grow the font until the longest line fills ~78% of the width
      for (var s = 10; s < 200; s += 2) {
        octx.font = s + 'px "Press Start 2P", monospace';
        if (octx.measureText(longest).width > W * 0.78) break;
        size = s;
      }
      octx.font = size + 'px "Press Start 2P", monospace';
      var lh = size * 1.6;
      var startY = H / 2 - ((lines.length - 1) * lh) / 2;
      lines.forEach(function (ln, i) { octx.fillText(ln, W / 2, startY + i * lh); });

      var data = octx.getImageData(0, 0, off.width, off.height).data;
      blocks = [];
      for (var y = 0; y < off.height; y += cell) {
        for (var x = 0; x < off.width; x += cell) {
          var idx = ((y + (cell >> 1)) * off.width + (x + (cell >> 1))) * 4 + 3;
          if (data[idx] > 128) {
            blocks.push({
              tx: x, ty: y,
              sx: x + (Math.random() * 40 - 20),
              sy: -60 - Math.random() * H * 0.7,
              delay: Math.random() * 900,
              dur: 620 + Math.random() * 280,
              c: RAINBOW[blocks.length % RAINBOW.length]
            });
          }
        }
      }
    }

    build();

    var DUR = 3000, HOLD = 420;
    var t0 = performance.now();

    function lerp(a, b, t) { return a + (b - a) * t; }
    function hexMix(t) {
      // black -> vibrant purple
      var r = Math.round(lerp(0, 0x7a, t)), g = Math.round(lerp(0, 0x00, t)), b = Math.round(lerp(0, 0xff, t));
      return "rgb(" + r + "," + g + "," + b + ")";
    }

    function finish() {
      sessionStorage.setItem("boi_intro", "1");
      intro.classList.add("is-done");
      document.body.classList.remove("intro-lock");
      setTimeout(function () { if (intro.parentNode) intro.parentNode.removeChild(intro); }, 400);
    }

    if (reduced) {
      ctx.fillStyle = PURPLE; ctx.fillRect(0, 0, W, H);
      blocks.forEach(function (b) { ctx.fillStyle = b.c; ctx.fillRect(b.tx, b.ty, cell - 1, cell - 1); });
      setTimeout(finish, 900);
      return;
    }

    function frame(now) {
      var el = now - t0;
      var bg = Math.min(1, el / DUR);
      ctx.fillStyle = hexMix(bg * bg);
      ctx.fillRect(0, 0, W, H);

      for (var i = 0; i < blocks.length; i++) {
        var b = blocks[i];
        var p = (el - b.delay) / b.dur;
        if (p <= 0) continue;
        if (p > 1) p = 1;
        var e = 1 - Math.pow(1 - p, 3);
        ctx.fillStyle = b.c;
        ctx.fillRect(Math.round(lerp(b.sx, b.tx, e)), Math.round(lerp(b.sy, b.ty, e)), cell - 1, cell - 1);
      }
      if (el < DUR + HOLD) requestAnimationFrame(frame);
      else finish();
    }
    requestAnimationFrame(frame);

    window.addEventListener("resize", function () {
      if (!intro.parentNode) return;
      build();
    });
  }

  /* ---------- NFT reveal (reusable component) ---------- */

  function initReveal() {
    var stage = $("#reveal-stage");
    if (!stage) return;
    var img = $("#reveal-img");
    var canvas = $("#reveal-canvas");
    var hint = $("#reveal-hint");
    var counter = $("#reveal-count");
    var ctx = canvas.getContext("2d");

    var order = NFT_FILES.map(function (_, i) { return i; });
    for (var i = order.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = order[i]; order[i] = order[j]; order[j] = tmp;
    }
    var pos = 0;
    var GRID = 14;
    var cells = [];
    var state = "covered"; // covered | opening | open | closing
    var W = 0, H = 0, cw = 0, ch = 0;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);

    function sizeCanvas() {
      W = stage.clientWidth; H = stage.clientHeight;
      canvas.width = Math.floor(W * dpr); canvas.height = Math.floor(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.imageSmoothingEnabled = false;
      cw = W / GRID; ch = H / GRID;
    }

    function buildCells() {
      cells = [];
      for (var y = 0; y < GRID; y++) {
        for (var x = 0; x < GRID; x++) {
          var mix = (x + y) % 5;
          cells.push({
            x: x, y: y,
            color: mix === 0 ? PURPLE : mix === 1 ? "#0b0b0b" : mix === 2 ? RAINBOW[(x + y * 3) % 7] : mix === 3 ? "#0b0b0b" : PURPLE,
            off: 0, alpha: 1,
            delay: (GRID - y) * 22 + Math.random() * 130,
            speed: 0.9 + Math.random() * 0.7
          });
        }
      }
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      for (var i = 0; i < cells.length; i++) {
        var c = cells[i];
        if (c.alpha <= 0) continue;
        ctx.globalAlpha = c.alpha;
        ctx.fillStyle = c.color;
        ctx.fillRect(Math.floor(c.x * cw), Math.floor(c.y * ch + c.off), Math.ceil(cw) + 1, Math.ceil(ch) + 1);
      }
      ctx.globalAlpha = 1;
    }

    function setLabel(txt) { if (hint) hint.textContent = txt; }

    function animate(dir, done) {
      // dir: 1 = fall away, -1 = come back
      var t0 = performance.now();
      var DUR = reduced ? 120 : 760;
      function step(now) {
        var el = now - t0;
        var alive = false;
        for (var i = 0; i < cells.length; i++) {
          var c = cells[i];
          var p = (el - c.delay) / DUR;
          if (p < 0) { p = 0; alive = true; }
          else if (p < 1) alive = true;
          else p = 1;
          var e = p * p;
          if (dir === 1) { c.off = e * (H + 80) * c.speed; c.alpha = 1 - e * 0.9; }
          else { c.off = (1 - e) * -(H + 80) * c.speed; c.alpha = Math.min(1, 0.2 + e); }
        }
        draw();
        if (alive) requestAnimationFrame(step);
        else { done(); }
      }
      requestAnimationFrame(step);
    }

    function loadCurrent() {
      img.src = nftSrc(order[pos]);
      img.alt = "Bears On Ink pixel bear artwork " + (order[pos] + 1);
      if (counter) counter.textContent = "Artwork " + (pos + 1) + " of " + NFT_FILES.length;
    }

    function reveal() {
      if (state !== "covered") return;
      state = "opening";
      setLabel("REVEALING...");
      buildCells();
      animate(1, function () {
        state = "open";
        setLabel("NEXT PIXEL BEAR LOADING");
        setTimeout(function () {
          state = "closing";
          pos = (pos + 1) % NFT_FILES.length;
          buildCells();
          animate(-1, function () {
            loadCurrent();
            cells.forEach(function (c) { c.off = 0; c.alpha = 1; });
            draw();
            state = "covered";
            setLabel("CLICK TO REVEAL");
          });
        }, 2000);
      });
    }

    stage.addEventListener("click", reveal);
    stage.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); reveal(); }
    });

    window.addEventListener("resize", function () { sizeCanvas(); draw(); });

    sizeCanvas();
    buildCells();
    draw();
    loadCurrent();
    setLabel("CLICK TO REVEAL");
  }

  /* ---------- local record store (fallback when no endpoint) ---------- */

  function localRecords() {
    try { return JSON.parse(localStorage.getItem("boi_records") || "[]"); }
    catch (e) { return []; }
  }
  function pushLocalRecord(rec) {
    var all = localRecords();
    all.push(rec);
    try { localStorage.setItem("boi_records", JSON.stringify(all.slice(-50))); } catch (e) {}
  }
  function maskUser(u) {
    var s = String(u || "").replace(/^@/, "");
    if (!s) return "@...";
    return "@" + (s.length > 7 ? s.slice(0, 7) + "..." : s + "...");
  }
  function maskWallet(w) {
    var s = String(w || "");
    return s.length > 10 ? s.slice(0, 6) + "..." + s.slice(-4) : "0x...";
  }

  /* ---------- live terminal ---------- */

  function initTerminal() {
    var term = $("#terminal-body");
    if (!term) return;
    var countEl = $("#term-count");
    var feed = $("#term-feed");
    var bootEl = $("#term-boot");

    var bootLines = [
      "> booting bears_on_ink.whitelist",
      "> network: " + CONFIG.NETWORK,
      "> supply: " + CONFIG.SUPPLY + " NFTs",
      "> listening for new entries"
    ];

    function typeBoot(i) {
      if (i >= bootLines.length) return;
      var line = document.createElement("div");
      bootEl.appendChild(line);
      var text = bootLines[i], k = 0;
      if (reduced) { line.textContent = text; typeBoot(i + 1); return; }
      var iv = setInterval(function () {
        line.textContent = text.slice(0, ++k);
        if (k >= text.length) { clearInterval(iv); setTimeout(function () { typeBoot(i + 1); }, 120); }
      }, 22);
    }
    typeBoot(0);

    function render(count, recent) {
      countEl.textContent = count + (count === 1 ? " PERSON JOINED" : " PEOPLE JOINED");
      feed.textContent = "";
      if (!recent.length) {
        var li = document.createElement("li");
        li.textContent = "> awaiting the first whitelist entries";
        feed.appendChild(li);
        return;
      }
      recent.slice(-6).reverse().forEach(function (r) {
        var li = document.createElement("li");
        var b = document.createElement("b");
        b.textContent = r.user;
        li.appendChild(document.createTextNode("> "));
        li.appendChild(b);
        li.appendChild(document.createTextNode(" secured GTD  " + r.wallet));
        feed.appendChild(li);
      });
    }

    function fromLocal() {
      var recs = localRecords();
      render(recs.length, recs.map(function (r) {
        return { user: maskUser(r.username), wallet: maskWallet(r.wallet) };
      }));
    }

    if (CONFIG.SHEET_ENDPOINT) {
      fetch(CONFIG.SHEET_ENDPOINT, { method: "GET" })
        .then(function (r) { return r.json(); })
        .then(function (d) {
          if (d && typeof d.count === "number") render(d.count, (d.recent || []));
          else fromLocal();
        })
        .catch(fromLocal);
    } else {
      fromLocal();
    }
  }

  /* ---------- roadmap reveal ---------- */

  function initRoadmap() {
    var phases = $$(".phase");
    if (!phases.length) return;
    if (!("IntersectionObserver" in window) || reduced) {
      phases.forEach(function (p) { p.classList.add("is-in"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          var i = phases.indexOf(en.target);
          setTimeout(function () { en.target.classList.add("is-in"); }, (i % 3) * 90);
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.2 });
    phases.forEach(function (p) { io.observe(p); });
  }

  /* ---------- gallery ---------- */

  function initGallery() {
    var grid = $("#gallery-grid");
    if (!grid) return;
    var frag = document.createDocumentFragment();
    NFT_FILES.forEach(function (f, i) {
      var card = document.createElement("div");
      card.className = "card";
      var box = document.createElement("div");
      box.className = "card__img";
      var im = document.createElement("img");
      im.src = NFT_DIR + f;
      im.alt = "Bears On Ink pixel bear artwork " + (i + 1);
      im.loading = "lazy";
      im.decoding = "async";
      box.appendChild(im);
      var foot = document.createElement("div");
      foot.className = "card__foot";
      var a = document.createElement("span"); a.textContent = "#" + String(i + 1).padStart(3, "0");
      var b = document.createElement("span"); b.textContent = CONFIG.NETWORK;
      foot.appendChild(a); foot.appendChild(b);
      card.appendChild(box); card.appendChild(foot);
      frag.appendChild(card);
    });
    grid.appendChild(frag);
    var c = $("#gallery-count");
    if (c) c.textContent = NFT_FILES.length + " artworks shown of " + CONFIG.SUPPLY + " total supply";
  }

  /* ---------- validation ---------- */

  var RE_X_POST = /^https?:\/\/(www\.)?(x|twitter)\.com\/[A-Za-z0-9_]{1,15}\/status\/\d{5,25}(\?.*)?$/i;
  var RE_EVM = /^0x[a-fA-F0-9]{40}$/;
  var RE_USER = /^@?[A-Za-z0-9_]{1,15}$/;

  /* ---------- whitelist flow ---------- */

  function initWhitelist() {
    var root = $("#wl");
    if (!root) return;

    var TOTAL = 5; // 4 tasks + wallet submission
    var current = 1;
    var data = { username: "", comment: "", wallet: "" };

    var steps = $$("[data-step]", root);
    var bar = $("#wl-progress");
    var label = $("#wl-progress-label");
    var checklist = $$("#wl-checklist li");

    function paint() {
      steps.forEach(function (s) {
        s.classList.toggle("is-current", Number(s.getAttribute("data-step")) === current);
      });
      $$("i", bar).forEach(function (b, i) {
        b.classList.toggle("is-done", i + 1 < current);
        b.classList.toggle("is-active", i + 1 === current);
      });
      checklist.forEach(function (li, i) {
        var done = i + 1 < current;
        li.classList.toggle("done", done);
        $(".mark", li).textContent = done ? "[x]" : i + 1 === current ? "[>]" : "[ ]";
      });
      if (current <= TOTAL) {
        label.textContent = "Step " + current + " of " + TOTAL + " — " +
          (current === 5 ? "wallet submission" : "task " + current + " of 4");
      } else {
        label.textContent = "All steps complete";
      }
      window.scrollTo(0, 0);
    }

    function go(n) { current = n; paint(); }

    /* verification loading bar */
    function runLoader(stepEl, ms, done) {
      var panel = $(".loading-state", stepEl);
      var body = $(".step-body", stepEl);
      var bars = $$(".loadbar i", panel);
      bars.forEach(function (b) { b.classList.remove("on"); });
      body.style.display = "none";
      panel.classList.add("is-on");
      var i = 0;
      var tick = ms / bars.length;
      var iv = setInterval(function () {
        if (bars[i]) bars[i].classList.add("on");
        i++;
        if (i > bars.length) {
          clearInterval(iv);
          panel.classList.remove("is-on");
          body.style.display = "";
          done();
        }
      }, reduced ? 20 : tick);
    }

    /* --- Task 1 --- */
    var u1 = $("#wl-username");
    var e1 = $("#wl-username-err");
    var visit1 = $("#wl-visit-1");
    var verify1 = $("#wl-verify-1");

    u1.addEventListener("input", function () {
      var ok = RE_USER.test(u1.value.trim());
      e1.textContent = "";
      visit1.toggleAttribute("data-ready", ok);
    });

    visit1.addEventListener("click", function (e) {
      var v = u1.value.trim();
      if (!RE_USER.test(v)) {
        e.preventDefault();
        e1.textContent = "Enter your X username first (letters, numbers, underscore).";
        u1.focus();
        return;
      }
      data.username = v.replace(/^@/, "");
      verify1.removeAttribute("disabled");
      toast("TASK 1", "Follow @BearsOnInk on X, then come back and press Verify.");
    });

    verify1.addEventListener("click", function () {
      var v = u1.value.trim();
      if (!RE_USER.test(v)) { e1.textContent = "Enter your X username first."; return; }
      data.username = v.replace(/^@/, "");
      runLoader(steps[0], 2000, function () { go(2); });
    });

    /* --- Task 2 & 3 --- */
    [2, 3].forEach(function (n) {
      var open = $("#wl-open-" + n);
      var verify = $("#wl-verify-" + n);
      open.addEventListener("click", function () {
        verify.removeAttribute("disabled");
        toast("TASK " + n, n === 2
          ? "Like the pinned post, then come back and press Verify."
          : "Repost the pinned post, then come back and press Verify.");
      });
      verify.addEventListener("click", function () {
        runLoader(steps[n - 1], 2000, function () { go(n + 1); });
      });
    });

    /* --- Task 4 --- */
    var open4 = $("#wl-open-4");
    var link4 = $("#wl-comment");
    var err4 = $("#wl-comment-err");
    var verify4 = $("#wl-verify-4");

    open4.addEventListener("click", function () {
      toast("TASK 4", "Tag 3 friends and say something about Bears On Ink, then paste your comment link.");
    });
    verify4.addEventListener("click", function () {
      var v = link4.value.trim();
      if (!RE_X_POST.test(v)) {
        err4.textContent = "That is not a valid X post link. It should look like https://x.com/name/status/1234567890";
        link4.focus();
        return;
      }
      err4.textContent = "";
      data.comment = v;
      runLoader(steps[3], 2000, function () { go(5); });
    });

    /* --- Wallet submission --- */
    var wallet = $("#wl-wallet");
    var errW = $("#wl-wallet-err");
    var submit = $("#wl-submit");

    submit.addEventListener("click", function () {
      var v = wallet.value.trim();
      if (!RE_EVM.test(v)) {
        errW.textContent = "Enter a valid EVM wallet address (0x followed by 40 characters).";
        wallet.focus();
        return;
      }
      errW.textContent = "";
      data.wallet = v;
      submit.setAttribute("disabled", "disabled");

      runLoader(steps[4], 1600, function () {
        send(data).then(function (res) {
          pushLocalRecord({ username: data.username, wallet: data.wallet, t: Date.now() });
          go(6);
          successScreen();
          if (!res.stored) {
            toast("SAVED LOCALLY", "Your entry is recorded on this device. The submission endpoint is not connected yet.");
          }
        }).catch(function () {
          submit.removeAttribute("disabled");
          errW.textContent = "Submission could not be sent. Please check your connection and try again.";
        });
      });
    });

    function send(d) {
      if (!CONFIG.SHEET_ENDPOINT) return Promise.resolve({ stored: false });
      return fetch(CONFIG.SHEET_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({
          username: d.username,
          commentLink: d.comment,
          wallet: d.wallet
        })
      }).then(function (r) { return r.json(); })
        .then(function (j) { return { stored: !!(j && j.ok) }; })
        .catch(function () { return { stored: false }; });
    }

    /* --- success celebration --- */
    function successScreen() {
      var mask = $("#wl-success-wallet");
      if (mask) mask.textContent = maskWallet(data.wallet);
      var mu = $("#wl-success-user");
      if (mu) mu.textContent = maskUser(data.username);

      var canvas = $("#success-canvas");
      if (!canvas) return;
      var ctx = canvas.getContext("2d");
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      var W = canvas.clientWidth, H = 170;
      canvas.width = W * dpr; canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.imageSmoothingEnabled = false;

      var parts = [];
      for (var i = 0; i < 70; i++) {
        parts.push({
          x: Math.random() * W, y: -Math.random() * H,
          vy: 0.6 + Math.random() * 1.6,
          s: 6 + Math.floor(Math.random() * 3) * 2,
          c: RAINBOW[i % RAINBOW.length]
        });
      }
      var frames = 0;
      function step() {
        ctx.fillStyle = "#0b0b0b";
        ctx.fillRect(0, 0, W, H);
        parts.forEach(function (p) {
          p.y += p.vy;
          if (p.y > H) { p.y = -8; p.x = Math.random() * W; }
          ctx.fillStyle = p.c;
          ctx.fillRect(Math.floor(p.x), Math.floor(p.y), p.s, p.s);
        });
        ctx.fillStyle = "#ffffff";
        ctx.font = '14px "Press Start 2P", monospace';
        ctx.textAlign = "center";
        ctx.fillText("GTD SECURED", W / 2, H / 2 + 6);
        frames++;
        if (!reduced && frames < 60 * 22) requestAnimationFrame(step);
      }
      step();
    }

    paint();
  }

  /* ---------- staking locked page ---------- */

  function initStakingPage() {
    var b = $("#staking-try");
    if (!b) return;
    b.addEventListener("click", function () {
      toast("STAKING LOCKED", "Staking will be activated after the mint is complete.");
    });
  }

  /* ---------- boot ---------- */

  function boot() {
    applyConfigLinks();
    initMenu();
    initIntro();
    initReveal();
    initTerminal();
    initRoadmap();
    initGallery();
    initWhitelist();
    initStakingPage();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
