(() => {
  if (
    location.hostname !== "observablehq.com" &&
    !location.hostname.endsWith(".static.observableusercontent.com")
  ) return;

  const root = document.documentElement;
  const notebook = location.hostname.endsWith(".static.observableusercontent.com");
  const modes = ["auto", "light", "dark"];

  let theme = "auto";

  const icons = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 -960 960 960" fill="currentColor"><path d="M480-28 346-160H160v-186L28-480l132-134v-186h186l134-132 134 132h186v186l132 134-132 134v186H614L480-28Zm0-252q83 0 141.5-58.5T680-480q0-83-58.5-141.5T480-680v400Zm0 140 100-100h140v-140l100-100-100-100v-140H580L480-820 380-720H240v140L140-480l100 100v140h140l100 100Zm0-340Z"/></svg>`,
    `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 -960 960 960" fill="currentColor"><path d="M480-360q50 0 85-35t35-85q0-50-35-85t-85-35q-50 0-85 35t-35 85q0 50 35 85t85 35Zm0 80q-83 0-141.5-58.5T280-480q0-83 58.5-141.5T480-680q83 0 141.5 58.5T680-480q0 83-58.5 141.5T480-280ZM200-440H40v-80h160v80Zm720 0H760v-80h160v80ZM440-760v-160h80v160h-80Zm0 720v-160h80v160h-80ZM256-650l-101-97 57-59 96 100-52 56Zm492 496-97-101 53-55 101 97-57 59Zm-98-550 97-101 59 57-100 96-56-52ZM154-212l101-97 55 53-97 101-59-57Zm326-268Z"/></svg>`,
    `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 -960 960 960" fill="currentColor"><path d="M480-120q-150 0-255-105T120-480q0-150 105-255t255-105q14 0 27.5 1t26.5 3q-41 29-65.5 75.5T444-660q0 90 63 153t153 63q55 0 101-24.5t75-65.5q2 13 3 26.5t1 27.5q0 150-105 255T480-120Zm0-80q88 0 158-48.5T740-375q-20 5-40 8t-40 3q-123 0-209.5-86.5T364-660q0-20 3-40t8-40q-78 32-126.5 102T200-480q0 116 82 198t198 82Zm-10-270Z"/></svg>`
  ];

  const apply = () => {
    const dark = matchMedia("(prefers-color-scheme: dark)").matches;
    root.dataset.theme = theme === "auto"? (dark?"dark":"light"):theme;
    if (!panel) return;
    [...panel.children].forEach((button, i) => {
      button.style.color =
        modes[i] === theme
          ? "var(--theme-foreground)"
          : "var(--theme-foreground-faint)";
      button.style.outline =
        modes[i] === theme
          ? "1px solid var(--theme-foreground-faintest)"
          : "none";
    });
  };

  const addFrameTheme = (doc) => {
    if (!doc?.head || !doc.documentElement) return;

    doc.documentElement.dataset.theme = root.dataset.theme;

    if (!doc.getElementById("observable-theme-shared")) {
      const shared = doc.createElement("link");
      shared.id = "observable-theme-shared";
      shared.rel = "stylesheet";
      shared.href = chrome.runtime.getURL("shared.css");
      doc.head.appendChild(shared);
    }

    if (!doc.getElementById("observable-theme-notebook")) {
      const css = doc.createElement("link");
      css.id = "observable-theme-notebook";
      css.rel = "stylesheet";
      css.href = chrome.runtime.getURL("notebook.css");
      doc.head.appendChild(css);
    }
  };

  const panel = !notebook && document.createElement("div");

  const position = () => {
    const target = document.querySelector("button[aria-haspopup=\"menu\"]");
    if (!target) return;
    const rect = target.getBoundingClientRect();
    panel.style.left = `${rect.right + 8}px`;
    panel.style.top = `${rect.top + (rect.height - panel.offsetHeight) / 2}px`;
  };

  if (panel) {
    panel.style.cssText = `
      position: fixed;
      z-index: 999999;

      display: flex;
      width: 72px;
      height: 24px;

      background: var(--theme-background);
      outline: 1px solid var(--theme-foreground-faintest);
      border-radius: 12px;
      overflow: hidden;
    `;
    window.addEventListener("resize", position);
    window.addEventListener("scroll", position);

    modes.forEach((mode, i) => {
      const button = document.createElement("button");
      button.innerHTML = icons[i];

      button.style.cssText = `
        width: 24px;
        height: 24px;
        flex: 1;

        padding: 0;
        border: 0;
        border-radius: 12px;

        background: transparent;
        color: var(--theme-foreground-faint);

        display: flex;
        align-items: center;
        justify-content: center;

        cursor: pointer;
      `;

      button.onclick = () => {
        theme = mode;
        chrome.storage.local.set({ theme });
        try {
          localStorage.setItem("theme", theme);
        } catch {}
        apply();
        document.querySelectorAll("iframe").forEach((iframe) => {
          try {
            addFrameTheme(iframe.contentDocument);
          } catch {}
        });
      };
      panel.appendChild(button);
    });
  }

  const start = () => {
    if (notebook) {
      const shared = document.createElement("link");
      shared.rel = "stylesheet";
      shared.href = chrome.runtime.getURL("shared.css");

      const css = document.createElement("link");
      css.rel = "stylesheet";
      css.href = chrome.runtime.getURL("notebook.css");

      document.head.append(shared, css);
    } else {
      const shared = document.createElement("link");
      shared.rel = "stylesheet";
      shared.href = chrome.runtime.getURL("shared.css");

      const editor = document.createElement("link");
      editor.rel = "stylesheet";
      editor.href = chrome.runtime.getURL("editor.css");

      document.head.append(shared, editor);
      document.body.appendChild(panel);

      new MutationObserver(() => {
        position();
        document.querySelectorAll("iframe").forEach((iframe) => {
          if (!iframe.src.includes(".static.observableusercontent.com/")) return;
          try {
            addFrameTheme(iframe.contentDocument);
          } catch {}
        });
      }).observe(document.documentElement, {
        childList: true,
        subtree: true
      });
    }

    chrome.storage.local.get({ theme: "auto" }, (data) => {
      theme = data.theme;
      apply();

      if (!notebook) {
        document.querySelectorAll("iframe").forEach((iframe) => {
          try {
            addFrameTheme(iframe.contentDocument);
          } catch {}
        });
      }
    });
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }

  matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
    if (theme === "auto") {
      apply();
      document.querySelectorAll("iframe").forEach((iframe) => {
        try {
          addFrameTheme(iframe.contentDocument);
        } catch {}
      });
    }
  });

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "local" || !changes.theme) return;
    theme = changes.theme.newValue || "auto";
    apply();
    document.querySelectorAll("iframe").forEach((iframe) => {
      try {
        addFrameTheme(iframe.contentDocument);
      } catch {}
    });
  });
})();