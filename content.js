(() => {
  const ROOT = document.documentElement;
  const THEME_KEY = "observableTheme";
  const PANEL_ID = "observable-theme-panel";
  const isTopNew = location.hostname === "new.observablehq.com";
  const isNotebookHost = /^[^.]+\.static\.observableusercontent\.com$/.test(location.hostname);
  const isNewNotebook = isNotebookHost && (/^view-source:/.test(location.href) || /\/chat-worker\/index-[^/?#]+\.html$/.test(location.pathname));
  const isOldNotebook = isNotebookHost && !isNewNotebook;
  const isNotebookDoc = isNotebookHost && (isNewNotebook || isOldNotebook);
  const isNew = isTopNew || isNewNotebook;
  const state = {
    theme: "auto"
  };
  const editorCss = isTopNew ? "editor-new.css" : "editor-old.css";
  const notebookCss = isNewNotebook ? "notebook-new.css" : "notebook-old.css";
  const sharedCss = "shared.css";
  const icons = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="16px" height="16px" viewBox="0 -960 960 960" fill="currentColor"><path d="M480-28 346-160H160v-186L28-480l132-134v-186h186l134-132 134 132h186v186l132 134-132 134v186H614L480-28Zm0-252q83 0 141.5-58.5T680-480q0-83-58.5-141.5T480-680v400Zm0 140 100-100h140v-140l100-100-100-100v-140H580L480-820 380-720H240v140L140-480l100 100v140h140l100 100Zm0-340Z"/></svg>`,
    `<svg xmlns="http://www.w3.org/2000/svg" width="16px" height="16px" viewBox="0 -960 960 960" fill="currentColor"><path d="M480-360q50 0 85-35t35-85q0-50-35-85t-85-35q-50 0-85 35t-35 85q0 50 35 85t85 35Zm0 80q-83 0-141.5-58.5T280-480q0-83 58.5-141.5T480-680q83 0 141.5 58.5T680-480q0 83-58.5 141.5T480-280ZM200-440H40v-80h160v80Zm720 0H760v-80h160v80ZM440-760v-160h80v160h-80Zm0 720v-160h80v160h-80ZM256-650l-101-97 57-59 96 100-52 56Zm492 496-97-101 53-55 101 97-57 59Zm-98-550 97-101 59 57-100 96-56-52ZM154-212l101-97 55 53-97 101-59-57Zm326-268Z"/></svg>`,
    `<svg xmlns="http://www.w3.org/2000/svg" width="16px" height="16px" viewBox="0 -960 960 960" fill="currentColor"><path d="M480-120q-150 0-255-105T120-480q0-150 105-255t255-105q14 0 27.5 1t26.5 3q-41 29-65.5 75.5T444-660q0 90 63 153t153 63q55 0 101-24.5t75-65.5q2 13 3 26.5t1 27.5q0 150-105 255T480-120Zm0-80q88 0 158-48.5T740-375q-20 5-40 8t-40 3q-123 0-209.5-86.5T364-660q0-20 3-40t8-40q-78 32-126.5 102T200-480q0 116 82 198t198 82Zm-10-270Z"/></svg>`
  ];
  const buttons = [
    { value: "auto", title: "Auto" },
    { value: "light", title: "Light" },
    { value: "dark", title: "Dark" }
  ];

  const storageGet = () => new Promise((resolve) => {
    const area = globalThis.chrome && chrome.storage && chrome.storage.local;
    if (!area) {
      resolve(localStorage.getItem(THEME_KEY) || "auto");
      return;
    }
    area.get({ [THEME_KEY]: "auto" }, (items) => {
      resolve(items[THEME_KEY] || "auto");
    });
  });

  const storageSet = (value) => {
    try {
      if (globalThis.chrome && chrome.storage && chrome.storage.local) {
        chrome.storage.local.set({ [THEME_KEY]: value });
      }
    } catch {}
    try {
      localStorage.setItem(THEME_KEY, value);
    } catch {}
  };

  const resolveTheme = (value) => {
    if (value === "dark" || value === "light") return value;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  };

  const applyTheme = (value) => {
    const theme = resolveTheme(value);
    ROOT.setAttribute("data-theme", theme);
    return theme;
  };

  const stylesheetId = (name) => `observable-theme-${name}`;

  const ensureStylesheet = (doc, file, id) => {
    if (!doc || doc.getElementById(id)) return;
    const link = doc.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = chrome.runtime.getURL(file);
    (doc.head || doc.documentElement).appendChild(link);
  };

  const updateButtons = (panel, activeValue) => {
    panel.querySelectorAll("button[data-theme-value]").forEach((button) => {
      const active = button.dataset.themeValue === activeValue;
      button.style.color = active ? "var(--theme-foreground)" : "var(--theme-foreground-faint)";
      button.style.outline = active ? "1px solid var(--theme-foreground-faintest)" : "none";
      button.style.zIndex = active ? "2" : "1";
    });
  };

  const createPanel = () => {
    if (document.getElementById(PANEL_ID)) return;
    const panel = document.createElement("div");
    panel.id = PANEL_ID;
    panel.style.cssText = "background:var(--theme-background);display:flex;width:72px;height:24px;aspect-ratio:3;margin-left:auto;outline:1px solid var(--theme-foreground-faintest);border-radius:12px;overflow:hidden";

    buttons.forEach((item, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.themeValue = item.value;
      button.title = item.title;
      button.innerHTML = icons[index];
      button.style.cssText = "background:#0000;color:var(--theme-foreground-faint);display:flex;justify-content:center;align-items:center;width:24px;height:24px;padding:0;border:none;border-radius:12px;z-index:1;cursor:pointer;flex:1;min-width:0";
      button.addEventListener("click", () => setTheme(item.value));
      panel.appendChild(button);
    });
    document.body.appendChild(panel);
    const position = () => {
      const header = document.querySelector("div.top-0.left-0.h-14.items-center.justify-between");
      if (!header) return;
      const first = header.children[0];
      const rect = first.getBoundingClientRect();
      panel.style.position = "fixed";
      panel.style.left = `${rect.right + 8}px`;
      panel.style.top = `${rect.top + (rect.height - panel.offsetHeight) / 2}px`;
      panel.style.zIndex = "999999";
    };
    //position();
    //requestAnimationFrame(() => {
    //  position();
    //});
    setTimeout(position, 100);
    window.addEventListener("resize", position);
    window.addEventListener("scroll", position, true);
    updateButtons(panel, state.theme);
  };

  const setTheme = async (value) => {
    storageSet(value);
    const theme = applyTheme(value);
    const panel = document.getElementById(PANEL_ID);
    if (panel) updateButtons(panel, value);
    syncNotebookFrames(theme);
  };

  const isNotebookSrc = (src) => {
    if (!src) return false;
    return /^https:\/\/[^.]+\.static\.observableusercontent\.com\/next\/worker-[^/?#]+\.html$/.test(src)
        || /^https:\/\/[^.]+\.static\.observableusercontent\.com\/chat-worker\/index-[^/?#]+\.html$/.test(src);
  };

  const isNewNotebookFrame = (src) => /\/chat-worker\/index-[^/?#]+\.html$/.test(src);

  const syncFrame = (frame, theme) => {
    if (!frame || frame.tagName !== "IFRAME") return;
    const src = frame.getAttribute("src") || "";
    if (!isNotebookSrc(src)) return;
    frame.dataset.theme = theme;
    frame.dataset.new = String(isNewNotebookFrame(src));
    try {
      const doc = frame.contentDocument;
      if (doc && doc.documentElement) {
        const frameIsNew = isNewNotebookFrame(src);
        doc.documentElement.setAttribute("data-theme", theme);
        ensureStylesheet(doc, sharedCss, stylesheetId("shared"));
        ensureStylesheet(doc, frameIsNew ? "notebook-new.css" : "notebook-old.css", stylesheetId(frameIsNew ? "notebook-new" : "notebook-old"));
      }
    } catch {}
  };

  const syncNotebookFrames = (theme) => {
    document.querySelectorAll("iframe").forEach((frame) => syncFrame(frame, theme));
  };

  const observeFrames = () => {
    const scan = () => syncNotebookFrames(resolveTheme(state.theme));
    scan();
    const target = document.documentElement;
    if (!target) return;
    const observer = new MutationObserver((mutations) => {
      let changed = false;
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node && node.nodeType === 1 && (node.tagName === "IFRAME" || node.querySelector?.("iframe"))) {
            changed = true;
          }
        }
      }
      if (changed) scan();
    });
    observer.observe(target, { childList: true, subtree: true });
  };

  const initTopLevel = () => {
    ensureStylesheet(document, sharedCss, stylesheetId("shared"));
    ensureStylesheet(document, editorCss, stylesheetId("editor"));
    createPanel();
    observeFrames();
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
      if (state.theme === "auto") applyTheme("auto");
      syncNotebookFrames(resolveTheme(state.theme));
    });
  };

  const initNotebook = () => {
    ensureStylesheet(document, sharedCss, stylesheetId("shared"));
    ensureStylesheet(document, notebookCss, stylesheetId(isNewNotebook ? "notebook-new" : "notebook-old"));
    ROOT.setAttribute("data-theme", resolveTheme(state.theme));
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
      if (state.theme === "auto") applyTheme("auto");
    });
  };

  const start = async () => {
    state.theme = await storageGet();
    applyTheme(state.theme);
    if (isNotebookDoc) {
      initNotebook();
    } else {
      initTopLevel();
    }
    chrome.storage?.onChanged?.addListener((changes, area) => {
      if (area !== "local" || !changes[THEME_KEY]) return;
      const nextTheme = changes[THEME_KEY].newValue || "auto";
      state.theme = nextTheme;
      applyTheme(nextTheme);
      const panel = document.getElementById(PANEL_ID);
      if (panel) updateButtons(panel, nextTheme);
      syncNotebookFrames(resolveTheme(nextTheme));
    });
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();