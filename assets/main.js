(() => {
  const isEn = document.documentElement.lang === "en";
  const header = document.querySelector(".site-header");
  if (header) {
    const onScroll = () => header.classList.toggle("is-scrolled", window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  const revealTargets = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      },
      { rootMargin: "0px 0px -8% 0px" }
    );
    revealTargets.forEach((el) => io.observe(el));
  } else {
    revealTargets.forEach((el) => el.classList.add("is-visible"));
  }

  // ページ内のナビ（トップのヘッダー、詳細ページの目次）で、いま読んでいる節に印を付ける
  const spyLinks = [...document.querySelectorAll("[data-spy] a[href^='#']")];
  const spySections = spyLinks
    .map((a) => document.getElementById(decodeURIComponent(a.hash.slice(1))))
    .filter(Boolean);
  if (spySections.length && "IntersectionObserver" in window) {
    const visible = new Map();
    const mark = () => {
      let current = null;
      for (const section of spySections) {
        if (visible.get(section)) { current = section; break; }
      }
      spyLinks.forEach((a) => {
        const on = current && a.hash.slice(1) === current.id;
        if (on) a.setAttribute("aria-current", "true");
        else a.removeAttribute("aria-current");
      });
    };
    const spy = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => visible.set(e.target, e.isIntersecting));
        mark();
      },
      { rootMargin: "-30% 0px -60% 0px" }
    );
    spySections.forEach((s) => spy.observe(s));
  }

  // メールアドレスのコピー
  document.querySelectorAll("[data-copy]").forEach((button) => {
    const status = document.getElementById(button.getAttribute("aria-describedby"));
    button.addEventListener("click", async () => {
      const text = button.getAttribute("data-copy");
      try {
        await navigator.clipboard.writeText(text);
        if (status) status.textContent = isEn ? "Copied" : "コピーしました";
      } catch {
        if (status) status.textContent = text;
      }
      if (status) setTimeout(() => { status.textContent = ""; }, 2400);
    });
  });

  // 見えているあいだだけ、無音のループ動画を流す。動きを減らす設定なら止めておき、ボタンで流せる
  document.querySelectorAll("video.js-autoplay").forEach((video) => {
    const button = video.closest(".feature-media-wrap")?.querySelector(".feature-toggle");
    let userPaused = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const syncButton = () => {
      if (!button) return;
      if (isEn) {
        button.textContent = video.paused ? "Play" : "Pause";
        button.setAttribute("aria-label", video.paused ? "Play video" : "Pause video");
      } else {
        button.textContent = video.paused ? "再生" : "一時停止";
        button.setAttribute("aria-label", video.paused ? "動画を再生" : "動画を一時停止");
      }
    };
    const play = () => {
      video.preload = "auto";
      const p = video.play();
      if (p) p.catch(() => {});
    };
    video.addEventListener("play", syncButton);
    video.addEventListener("pause", syncButton);
    button?.addEventListener("click", () => {
      userPaused = !video.paused;
      if (userPaused) video.pause();
      else play();
    });
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting && !userPaused) play();
            else if (!entry.isIntersecting) video.pause();
          }
        },
        { threshold: 0.25 }
      ).observe(video);
    }
    syncButton();
  });
})();
