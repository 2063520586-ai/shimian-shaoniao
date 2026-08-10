/* 失眠烧鸟 · 页面交互 */
(function () {
  "use strict";

  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };

  var prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- 预载动画 ---------- */
  function initPreloader() {
    var pre = $("#preloader");
    if (!pre) return;
    var hide = function () { pre.classList.add("hide"); };
    var timer = setTimeout(hide, 2800);
    window.addEventListener("load", function () {
      clearTimeout(timer);
      setTimeout(hide, 350);
    });
  }

  /* ---------- 滚动：进度条 / 导航 / 回到顶部 ---------- */
  function initScrollFx() {
    var header = $("#header");
    var progress = $("#scroll-progress");
    var toTop = $("#toTop");
    if (!header) return;

    var onScroll = function () {
      var y = window.scrollY || window.pageYOffset;
      header.classList.toggle("scrolled", y > 40);
      if (toTop) toTop.classList.toggle("show", y > 640);
      if (progress) {
        var max = document.documentElement.scrollHeight - window.innerHeight;
        progress.style.width = (max > 0 ? (y / max) * 100 : 0) + "%";
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    if (toTop) {
      toTop.addEventListener("click", function () {
        window.scrollTo({ top: 0, behavior: prefersReduced ? "auto" : "smooth" });
      });
    }
  }

  /* ---------- 光标光斑 ---------- */
  function initCursorGlow() {
    var glow = $("#cursor-glow");
    if (!glow || !window.matchMedia("(pointer: fine)").matches) return;
    var ticking = false;
    window.addEventListener("mousemove", function (e) {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        glow.style.transform = "translate3d(" + e.clientX + "px," + e.clientY + "px,0)";
        ticking = false;
      });
    }, { passive: true });
  }

  /* ---------- 移动端菜单 ---------- */
  function initMobileNav() {
    var burger = $("#burger");
    var links = $("#navLinks");
    if (!burger || !links) return;

    var setOpen = function (open) {
      burger.classList.toggle("open", open);
      links.classList.toggle("open", open);
      document.body.classList.toggle("menu-open", open);
      burger.setAttribute("aria-expanded", open ? "true" : "false");
      burger.setAttribute("aria-label", open ? "关闭菜单" : "打开菜单");
    };

    burger.addEventListener("click", function () {
      setOpen(!links.classList.contains("open"));
    });

    $$("a", links).forEach(function (a) {
      a.addEventListener("click", function () { setOpen(false); });
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") setOpen(false);
    });
  }

  /* ---------- 炭火余烬 ---------- */
  function initEmbers() {
    var hero = $("#hero");
    var canvas = $("#embers");
    if (!hero || !canvas || !canvas.getContext || prefersReduced) return;

    var ctx = canvas.getContext("2d");
    var particles = [];
    var w = 0, h = 0;
    var running = true;
    var rafId = null;
    var last = performance.now();

    var resize = function () {
      w = canvas.width = hero.clientWidth;
      h = canvas.height = hero.clientHeight;
      var count = Math.min(90, Math.round(w / 16));
      particles = [];
      for (var i = 0; i < count; i++) particles.push(makeParticle(true));
    };

    var makeParticle = function (anywhere) {
      return {
        x: Math.random() * w,
        y: anywhere ? Math.random() * h : h + Math.random() * 24,
        r: 0.6 + Math.random() * 1.9,
        vy: -(0.25 + Math.random() * 0.75),
        vx: (Math.random() - 0.5) * 0.22,
        phase: Math.random() * Math.PI * 2,
        life: 0.5 + Math.random() * 0.5,
        fade: 0.004 + Math.random() * 0.006
      };
    };

    var step = function (now) {
      var dt = Math.min(50, now - last);
      last = now;
      ctx.clearRect(0, 0, w, h);

      for (var i = 0; i < particles.length; i++) {
        var p = particles[i];
        p.x += p.vx + Math.sin(now * 0.001 + p.phase) * 0.12;
        p.y += p.vy * (dt / 16.7);
        p.life -= p.fade * (dt / 16.7);

        if (p.y < -10 || p.life <= 0) {
          particles[i] = makeParticle(false);
          continue;
        }

        var alpha = Math.max(0, Math.min(1, p.life)) * (0.35 + 0.65 * Math.abs(Math.sin(now * 0.002 + p.phase)));
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * 2.6, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255, 140, 60, " + alpha * 0.14 + ")";
        ctx.fill();
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255, 180, 90, " + alpha + ")";
        ctx.fill();
      }

      if (running) rafId = requestAnimationFrame(step);
    };

    resize();
    window.addEventListener("resize", resize, { passive: true });

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        var visible = entries[0].isIntersecting;
        if (visible && !running) {
          running = true;
          last = performance.now();
          rafId = requestAnimationFrame(step);
        } else if (!visible && running) {
          running = false;
          if (rafId) cancelAnimationFrame(rafId);
        }
      }, { threshold: 0.02 }).observe(hero);
    } else {
      rafId = requestAnimationFrame(step);
    }

    document.addEventListener("visibilitychange", function () {
      if (document.hidden && running) {
        running = false;
        if (rafId) cancelAnimationFrame(rafId);
      } else if (!document.hidden && !running) {
        running = true;
        last = performance.now();
        rafId = requestAnimationFrame(step);
      }
    });
  }

  /* ---------- 滚动显现 ---------- */
  function initReveal() {
    var items = $$(".reveal");
    if (!("IntersectionObserver" in window) || prefersReduced) {
      items.forEach(function (el) { el.classList.add("in"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.14, rootMargin: "0px 0px -36px 0px" });
    items.forEach(function (el) { io.observe(el); });
  }

  /* ---------- 菜单数据与渲染 ---------- */
  var MENU = [
    {
      id: "yakitori",
      jp: "やきとり",
      name: "烧鸟",
      img: "assets/img/yakitori-main.jpg",
      alt: "炭火烤制的烧鸟串",
      featureJp: "やきとり",
      featureName: "炭火烧鸟",
      featureDesc: "备长炭现烤，酱烧或盐烤任选，烤好即上，趁热吃。",
      items: [
        { cn: "鸡腿肉串", jp: "もも", desc: "备长炭现烤，酱汁三刷，皮脆肉嫩", price: 18, tag: "人气" },
        { cn: "手打鸡肉丸", jp: "つくね", desc: "每日现打，配兰皇鸡蛋黄", price: 16 },
        { cn: "葱段鸡肉", jp: "ねぎま", desc: "鸡腿肉与京葱交替，盐烤", price: 15 },
        { cn: "鸡皮", jp: "かわ", desc: "慢烤至酥，只撒七味唐辛子", price: 12 },
        { cn: "鸡尾肉", jp: "ぼんじり", desc: "油脂丰腴，建议配一杯清酒", price: 15 },
        { cn: "鸡肝", jp: "レバー", desc: "微焦流心，酱烧", price: 13 },
        { cn: "白肝", jp: "しろレバー", desc: "每日限量，入口即化", price: 19, tag: "限量" },
        { cn: "盐烤厚切牛舌", jp: "たん", desc: "厚切 1.2cm，柠汁提鲜", price: 38, tag: "招牌" }
      ]
    },
    {
      id: "sashimi",
      jp: "さしみ・すし",
      name: "刺身 · 寿司",
      img: "assets/img/sashimi.jpg",
      alt: "当日鲜鱼刺身拼盘",
      featureJp: "さしみ",
      featureName: "当日刺身",
      featureDesc: "清晨到港的鱼，傍晚出现在案板上，卖完即止。",
      items: [
        { cn: "刺身五种盛", jp: "さしみ ごしゅもり", desc: "当日鲜鱼五种，随季节更换", price: 168, tag: "招牌" },
        { cn: "三文鱼刺身", jp: "サーモン", desc: "厚切，纹理分明", price: 48 },
        { cn: "金枪鱼中腹", jp: "まぐろ ちゅうとろ", desc: "蓝鳍金枪鱼，霜降纹理", price: 88, tag: "限量" },
        { cn: "北海道带子", jp: "ホタテ", desc: "刺身级，鲜甜弹牙", price: 58 },
        { cn: "鰤鱼", jp: "ぶり", desc: "冬季油脂最丰的旬鱼", price: 52 },
        { cn: "加州卷", jp: "カリフォルニア", desc: "牛油果与蟹柳", price: 28 },
        { cn: "三文鱼籽军舰", jp: "いくら", desc: "咸鲜爆汁", price: 38 },
        { cn: "甜虾三只", jp: "あまえび", desc: "活冻甜虾，虾头可盐烤", price: 36 }
      ]
    },
    {
      id: "food",
      jp: "しょくじ",
      name: "食事",
      img: "assets/img/ramen.jpg",
      alt: "深夜一碗鸡白汤拉面",
      featureJp: "しょくじ",
      featureName: "深夜食事",
      featureDesc: "烧鸟吃不够，还有一碗热汤面等着收尾。",
      items: [
        { cn: "亲子丼", jp: "おやこどん", desc: "半熟蛋液裹住鸡腿肉", price: 32 },
        { cn: "炭火鸡肉釜饭", jp: "かまめし", desc: "米饭吸饱鸡油与炭香", price: 36, tag: "人气" },
        { cn: "鸡白汤拉面", jp: "ラーメン", desc: "熬足八小时的鸡白汤", price: 42 },
        { cn: "深夜茶泡饭", jp: "ちゃづけ", desc: "明太子 / 梅子二选一", price: 22 },
        { cn: "出汁乌冬", jp: "うどん", desc: "昆布柴鱼高汤，清淡收尾", price: 26 },
        { cn: "关东煮", jp: "おでん", desc: "萝卜、竹轮、溏心蛋", price: 18 },
        { cn: "炭烤饭团", jp: "おにぎり", desc: "酱烤至表面微焦", price: 12 },
        { cn: "焦糖布丁", jp: "プリン", desc: "深夜甜点，微微苦", price: 18 }
      ]
    },
    {
      id: "drink",
      jp: "さけ",
      name: "酒水",
      img: "assets/img/sake.jpg",
      alt: "清酒与酒杯",
      featureJp: "さけ",
      featureName: "深夜酒场",
      featureDesc: "十七款清酒，从淡丽到醇厚；不懂酒也没关系，告诉师傅今晚的心情。",
      items: [
        { cn: "獭祭 纯米大吟酿", jp: "だっさい", desc: "一杯量，冰饮", price: 88, tag: "限定" },
        { cn: "朝日生啤", jp: "アサヒ", desc: "超爽口，配串正好", price: 18 },
        { cn: "嗨棒", jp: "ハイボール", desc: "威士忌 + 苏打", price: 22 },
        { cn: "梅酒", jp: "うめしゅ", desc: "陈年青梅酒，加冰", price: 25 },
        { cn: "柚子酒", jp: "ゆずしゅ", desc: "和歌山柚子，酸甜清新", price: 28 },
        { cn: "无酒精柚子苏打", jp: "ゆずソーダ", desc: "开车也安心", price: 15 },
        { cn: "日本威士忌", jp: "ウイスキー", desc: "三款可选，纯饮或加冰", price: 48 },
        { cn: "热清酒", jp: "あつかん", desc: "冬季限定，暖胃", price: 20 }
      ]
    }
  ];

  function renderMenu() {
    var tabs = $("#menuTabs");
    var list = $("#menuList");
    var img = $("#menuFeatureImg");
    var jp = $("#menuFeatureJp");
    var name = $("#menuFeatureName");
    var desc = $("#menuFeatureDesc");
    if (!tabs || !list || !img) return;

    var current = MENU[0];

    function renderTabs() {
      tabs.innerHTML = "";
      MENU.forEach(function (tab) {
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "menu-tab" + (tab === current ? " active" : "");
        btn.setAttribute("role", "tab");
        btn.setAttribute("aria-selected", tab === current ? "true" : "false");
        btn.innerHTML = "<b>" + tab.name + "</b><small>" + tab.jp + "</small>";
        btn.addEventListener("click", function () { switchTab(tab, btn); });
        tabs.appendChild(btn);
      });
    }

    function renderList() {
      list.innerHTML = "";
      current.items.forEach(function (item) {
        var li = document.createElement("li");
        li.className = "menu-item";
        var tag = item.tag ? '<span class="menu-item-tag">' + item.tag + "</span>" : "";
        li.innerHTML =
          '<div class="menu-item-top">' +
          '<span class="menu-item-name">' + item.cn + tag + "</span>" +
          '<span class="menu-item-jp">' + item.jp + "</span>" +
          '<span class="menu-item-dots"></span>' +
          '<span class="menu-item-price">¥' + item.price + "</span>" +
          "</div>" +
          '<p class="menu-item-desc">' + item.desc + "</p>";
        list.appendChild(li);
      });
    }

    function renderFeature() {
      img.src = current.img;
      img.alt = current.alt;
      jp.textContent = current.featureJp;
      name.textContent = current.featureName;
      desc.textContent = current.featureDesc;
    }

    function switchTab(tab, btn) {
      if (tab === current) return;
      current = tab;
      $$(".menu-tab", tabs).forEach(function (b) {
        b.classList.toggle("active", b === btn);
        b.setAttribute("aria-selected", b === btn ? "true" : "false");
      });
      var body = $("#menuBody");
      body.classList.add("fading");
      setTimeout(function () {
        renderFeature();
        renderList();
        body.classList.remove("fading");
      }, 220);
    }

    renderTabs();
    renderFeature();
    renderList();
  }

  /* ---------- 订座表单 ---------- */
  function initForm() {
    var form = $("#reserveForm");
    if (!form) return;

    var success = $("#reserveSuccess");
    var summary = $("#successSummary");
    var again = $("#reserveAgain");

    var setInvalid = function (input, invalid) {
      input.classList.toggle("invalid", invalid);
      if (invalid) {
        input.style.borderColor = "var(--ember)";
      } else {
        input.style.borderColor = "";
      }
    };

    $$("input, select, textarea", form).forEach(function (field) {
      field.addEventListener("input", function () { setInvalid(field, false); });
      field.addEventListener("change", function () { setInvalid(field, false); });
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var name = $("#rName");
      var phone = $("#rPhone");
      var date = $("#rDate");
      var time = $("#rTime");
      var ok = true;

      [name, phone, date, time].forEach(function (f) { setInvalid(f, false); });

      if (!name.value.trim()) { setInvalid(name, true); name.focus(); ok = false; }
      else if (!/^1[3-9]\d{9}$/.test(phone.value.trim())) { setInvalid(phone, true); phone.focus(); ok = false; }
      else if (!date.value) { setInvalid(date, true); date.focus(); ok = false; }
      else {
        var chosen = new Date(date.value + "T00:00:00");
        var today = new Date();
        today.setHours(0, 0, 0, 0);
        if (chosen < today) { setInvalid(date, true); date.focus(); ok = false; }
      }
      if (!time.value) { setInvalid(time, true); time.focus(); ok = false; }

      if (!ok) return;

      var guests = $("#rGuests").value;
      var seat = $("#rSeat").value;
      var note = $("#rNote").value.trim();
      var weekdays = ["日", "一", "二", "三", "四", "五", "六"];
      var d = new Date(date.value + "T00:00:00");
      var dateText = d.getMonth() + 1 + "月" + d.getDate() + "日（周" + weekdays[d.getDay()] + "）";

      summary.innerHTML =
        "已收到 <b>" + name.value.trim() + "</b> 的预约：<br>" +
        dateText + " " + time.value + " · " + guests + " · " + seat +
        (note ? "<br>备注：" + note : "") +
        "<br>我们会在十五分钟内短信确认，请保持电话畅通。";

      form.hidden = true;
      success.hidden = false;
    });

    if (again) {
      again.addEventListener("click", function () {
        form.reset();
        form.hidden = false;
        success.hidden = true;
      });
    }
  }

  /* ---------- 导航高亮 ---------- */
  function initNavSpy() {
    var links = $$("#navLinks a");
    if (!links.length || !("IntersectionObserver" in window)) return;
    var map = {};
    links.forEach(function (a) {
      var id = a.getAttribute("href").slice(1);
      if (id) map[id] = a;
    });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        links.forEach(function (a) {
          a.style.color = a === map[entry.target.id] ? "var(--amber-soft)" : "";
        });
      });
    }, { rootMargin: "-42% 0px -52% 0px" });
    Object.keys(map).forEach(function (id) {
      var sec = document.getElementById(id);
      if (sec) io.observe(sec);
    });
  }

  /* ---------- 页脚年份 ---------- */
  function initYear() {
    var el = $("#year");
    if (el) el.textContent = String(new Date().getFullYear());
  }

  /* ---------- 启动 ---------- */
  document.addEventListener("DOMContentLoaded", function () {
    initPreloader();
    initScrollFx();
    initCursorGlow();
    initMobileNav();
    initEmbers();
    initReveal();
    renderMenu();
    initForm();
    initNavSpy();
    initYear();
  });
})();
