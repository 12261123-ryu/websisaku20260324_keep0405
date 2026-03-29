(function () {
  const stage = document.getElementById("tubu-stage");
  const sideBar = document.getElementById("side-bar");

  if (!stage || !sideBar) return;

  const IMG_SIZE = 30;
  const INITIAL_COUNT = 5;
  const MAX_COUNT = 30;
  const IMAGE_NAMES = [
    "tubu1.webp", // pink
    "tubu2.webp", // orange
    "tubu3.webp", // vivid-blue
    "tubu4.webp", // green
    "tubu5.webp", // blue
  ];


  //追加
  // ゼミごとのつぶつぶカラーセット定義
  const PROJECT_RECIPES = {
    'A': ["tubu1.webp", "tubu1.webp", "tubu3.webp", "tubu3.webp", "tubu5.webp"],
    'B': ["tubu1.webp", "tubu3.webp", "tubu3.webp", "tubu4.webp", "tubu4.webp"],
    'C': ["tubu2.webp", "tubu3.webp", "tubu4.webp", "tubu4.webp", "tubu4.webp"],
    'D': ["tubu1.webp", "tubu1.webp", "tubu1.webp", "tubu1.webp", "tubu4.webp"],
    'F': ["tubu1.webp", "tubu1.webp", "tubu2.webp", "tubu5.webp", "tubu5.webp"],
    'Y': ["tubu2.webp", "tubu2.webp", "tubu2.webp", "tubu4.webp", "tubu5.webp"],
    'M': ["tubu1.webp", "tubu2.webp", "tubu3.webp", "tubu4.webp", "tubu5.webp"],
    'all': ["tubu1.webp", "tubu2.webp", "tubu3.webp", "tubu4.webp", "tubu5.webp"]
  };
  // 外部（work.jsなど）から色を変えられるようにする関数
  window.updateTubuColors = function(projectKey) {
    const key = PROJECT_RECIPES[projectKey] ? projectKey : 'all';
    const recipe = PROJECT_RECIPES[key];
    
    floaters.forEach((data, i) => {
      const newImgName = recipe[i % recipe.length];
      data.imgName = newImgName;
      const imgEl = data.el.querySelector('img');
      if (imgEl) {
        imgEl.src = `images/tubu/${newImgName}`;
      }
    });
  };





  /** @type {{el:HTMLDivElement,imgName:string,x:number,y:number,vx:number,vy:number,rot:number,shimmerTimer:number|null}[]} */
  const floaters = [];

  function randomBetween(min, max) {
    return min + Math.random() * (max - min);
  }

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function isMenuOpen() {
    return sideBar.classList.contains("is-open");
  }

  function syncInteractivity() {
    if (isMenuOpen()) {
      stage.classList.add("menu-open");
    } else {
      stage.classList.remove("menu-open");
    }
  }

  function scheduleShimmer(data) {
    const delay = randomBetween(2000, 10000);
    data.shimmerTimer = window.setTimeout(() => {
      if (!data.el.isConnected) return;
      if (data.el.classList.contains("spawning")) {
        scheduleShimmer(data);
        return;
      }

      const durationSec = randomBetween(0.7, 1.6);
      data.el.style.setProperty("--shimmer-dur", `${durationSec}s`);
      data.el.classList.remove("shimmering");
      void data.el.offsetWidth;
      data.el.classList.add("shimmering");
      data.el.addEventListener(
        "animationend",
        () => {
          data.el.classList.remove("shimmering");
          scheduleShimmer(data);
        },
        { once: true }
      );
    }, delay);
  }

  function createFloater(imgName, startX, startY, isSpawned, burstX, burstY) {
    const el = document.createElement("div");
    el.className = "tubu-floater";

    const rot = randomBetween(-180, 180);
    el.style.setProperty("--rot", `${rot}deg`);

    const img = document.createElement("img");
    img.src = `images/tubu/${imgName}`;
    img.alt = imgName;
    el.appendChild(img);

    const speed = randomBetween(0.06, 0.16);
    const angle = randomBetween(0, Math.PI * 2);

    const data = {
      el,
      imgName,
      x: startX,
      y: startY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      rot,
      shimmerTimer: null,
    };

    el.style.left = `${startX}px`;
    el.style.top = `${startY}px`;

    if (isSpawned && typeof burstX === "number" && typeof burstY === "number") {
      el.style.setProperty("--bx", `${burstX}px`);
      el.style.setProperty("--by", `${burstY}px`);
      el.classList.add("spawning");
      el.addEventListener(
        "animationend",
        () => {
          el.classList.remove("spawning");
          data.x = clamp(startX + burstX, 0, window.innerWidth - IMG_SIZE);
          data.y = clamp(startY + burstY, 0, window.innerHeight - IMG_SIZE);
          el.style.left = `${data.x}px`;
          el.style.top = `${data.y}px`;
          el.style.transform = `rotate(${rot}deg)`;
        },
        { once: true }
      );
    }

    stage.appendChild(el);
    floaters.push(data);
    scheduleShimmer(data);
    return data;
  }

  function onFloaterClick(data) {
    if (floaters.length >= MAX_COUNT) return;

    const spawnCount = Math.min(2, MAX_COUNT - floaters.length);
    for (let i = 0; i < spawnCount; i += 1) {
      const angle = randomBetween(0, Math.PI * 2);
      const dist = randomBetween(30, 82);
      const bx = Math.cos(angle) * dist;
      const by = Math.sin(angle) * dist;
      createFloater(data.imgName, data.x, data.y, true, bx, by);
    }
  }

  function tick() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    for (const d of floaters) {
      if (d.el.classList.contains("spawning")) continue;

      d.x += d.vx;
      d.y += d.vy;

      if (d.x <= 0) {
        d.x = 0;
        d.vx = Math.abs(d.vx);
      }
      if (d.x >= width - IMG_SIZE) {
        d.x = width - IMG_SIZE;
        d.vx = -Math.abs(d.vx);
      }
      if (d.y <= 0) {
        d.y = 0;
        d.vy = Math.abs(d.vy);
      }
      if (d.y >= height - IMG_SIZE) {
        d.y = height - IMG_SIZE;
        d.vy = -Math.abs(d.vy);
      }

      d.el.style.left = `${d.x}px`;
      d.el.style.top = `${d.y}px`;
    }

    requestAnimationFrame(tick);
  }

  function handleDocumentPointerDown(event) {
    if (!isMenuOpen()) return;

    const target = event.target;
    // メニュー内の「操作対象」（リンク等）は優先して、つぶつぶは増殖しない
    if (
      target &&
      (target.closest("a") ||
        target.closest("button") ||
        target.closest("input") ||
        target.closest("textarea") ||
        target.closest("#menu-icon-toggle"))
    ) {
      return;
    }

    const clientX = event.clientX;
    const clientY = event.clientY;
    if (typeof clientX !== "number" || typeof clientY !== "number") return;

    // クリック位置がどの粒に重なっているか（座標判定）を当てに行く
    // （pointer-events:none にしているため、要素の click イベントは飛んでこない）
    for (let i = floaters.length - 1; i >= 0; i -= 1) {
      const d = floaters[i];
      const rect = d.el.getBoundingClientRect();
      if (
        clientX >= rect.left &&
        clientX <= rect.right &&
        clientY >= rect.top &&
        clientY <= rect.bottom
      ) {
        // 粒をクリックした意図として扱い、メニュー操作を奪わない範囲で伝播を止める
        event.stopPropagation();
        event.preventDefault();
        onFloaterClick(d);
        break;
      }
    }
  }

  function createInitialFloaters() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    const params = new URLSearchParams(window.location.search);
    const filter = params.get('filter');
    const recipeKey = PROJECT_RECIPES[filter] ? filter : 'all';
    const recipe = PROJECT_RECIPES[recipeKey];

    for (let i = 0; i < INITIAL_COUNT; i += 1) {
      const imgName = recipe[i % recipe.length]; // IMAGE_NAMESではなくレシピから選ぶ
      const x = randomBetween(IMG_SIZE * 2, Math.max(IMG_SIZE * 2, width - IMG_SIZE * 3));
      const y = randomBetween(IMG_SIZE * 2, Math.max(IMG_SIZE * 2, height - IMG_SIZE * 3));
      createFloater(imgName, x, y, false);
    }
  }

  function watchMenuState() {
    const observer = new MutationObserver(syncInteractivity);
    observer.observe(sideBar, { attributes: true, attributeFilter: ["class"] });
    syncInteractivity();
  }

  // 追加：戻るボタンへの対応
  window.addEventListener('popstate', () => {
    const params = new URLSearchParams(window.location.search);
    if (window.updateTubuColors) window.updateTubuColors(params.get('filter'));
  });

  function init() {
    createInitialFloaters();
    watchMenuState();
    document.addEventListener("pointerdown", handleDocumentPointerDown, {
      passive: false, //元々trueだがメニュー画面でつぶタップすると警告が出るので、falseに変更中
    });
    requestAnimationFrame(tick);
  }

  init();
})();

