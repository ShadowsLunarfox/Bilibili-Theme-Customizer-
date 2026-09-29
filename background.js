importScripts("settings.js");

const BC = globalThis.BiliTheme;
let state;
let queue = Promise.resolve();

async function initialize() {
  if (state) return;
  const saved = await chrome.storage.local.get([BC.KEYS.settings, BC.KEYS.background, "settings"]);
  const record = saved[BC.KEYS.settings];
  if (record?.schemaVersion > BC.DEFAULT.schemaVersion) {
    throw new Error("NEWER_VERSION");
  }
  if (record?.schemaVersion === BC.DEFAULT.schemaVersion) {
    state = { settings: BC.settings(record), background: BC.background(saved[BC.KEYS.background]) };
    return;
  }

  const legacy = saved.settings;
  const settings = { ...BC.settings(legacy), revision: 1 };
  const background = legacy?.backgroundImage
    ? BC.background({ dataUrl: legacy.backgroundImage, name: "原有背景" }, 1)
    : BC.emptyBackground(1);
  const updates = { [BC.KEYS.settings]: settings, [BC.KEYS.background]: background };
  // Clear the old image in the same write to avoid briefly storing two copies.
  if (Object.hasOwn(saved, "settings")) updates.settings = null;
  await chrome.storage.local.set(updates);
  state = { settings, background };
  if (Object.hasOwn(saved, "settings")) {
    await chrome.storage.local.remove("settings").catch(() => {});
  }
}

function transaction(work) {
  const operation = queue.then(async () => {
    await initialize();
    return work();
  });
  queue = operation.catch(() => {});
  return operation;
}

async function commit(settings, background) {
  const updates = { [BC.KEYS.settings]: settings };
  if (background) updates[BC.KEYS.background] = background;
  await chrome.storage.local.set(updates);
  state = { settings, background: background || state.background };
  return background ? { settings, background } : { settings };
}

const handlers = {
  [BC.MESSAGE.GET]: () => transaction(() => structuredClone(state)),
  [BC.MESSAGE.PATCH]: (patch) => transaction(() => {
    const next = BC.patchSettings(state.settings, patch);
    if (BC.FIELDS.every((field) => next[field] === state.settings[field])) {
      return { settings: state.settings };
    }
    next.revision = state.settings.revision + 1;
    return commit(next);
  }),
  [BC.MESSAGE.BACKGROUND]: (input) => transaction(() => {
    const revision = state.settings.revision + 1;
    const background = BC.background(input, revision);
    return commit({ ...state.settings, revision }, background);
  }),
  [BC.MESSAGE.RESET]: () => transaction(() => {
    const revision = state.settings.revision + 1;
    return commit({ ...BC.DEFAULT, revision }, BC.emptyBackground(revision));
  })
};

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (sender.id !== chrome.runtime.id || !Object.hasOwn(handlers, message?.type)) return false;
  Promise.resolve().then(() => handlers[message.type](message.payload))
    .then((data) => sendResponse({ ok: true, data }))
    .catch((error) => sendResponse({ ok: false, error: error.message || "SAVE_ERROR" }));
  return true;
});
