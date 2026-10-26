import { readFileSync } from "node:fs";
import vm from "node:vm";

export const settingsSource = readFileSync(new URL("../settings.js", import.meta.url), "utf8");

// The real service worker runs unchanged in a fresh JS context. Only Chrome's
// transport/storage boundary is replaced, so migration and transactions are real.
export function createRuntime(initial = {}) {
  const data = structuredClone(initial);
  const listeners = new Set();
  let handler;
  let writes = 0;
  let failNextWrite = false;
  const chrome = {
    runtime: {
      id: "theme-test",
      onMessage: { addListener(listener) { handler = listener; } },
      sendMessage(message) {
        return new Promise((resolve, reject) => {
          if (!handler(message, { id: "theme-test" }, (response) => resolve(structuredClone(response)))) {
            reject(new Error("No handler"));
          }
        });
      }
    },
    storage: {
      onChanged: {
        addListener(listener) { listeners.add(listener); },
        removeListener(listener) { listeners.delete(listener); }
      },
      local: {
        async get(keys) {
          return structuredClone(Object.fromEntries(keys.filter((key) => key in data).map((key) => [key, data[key]])));
        },
        async set(updates) {
          if (failNextWrite) { failNextWrite = false; throw new Error("SAVE_ERROR"); }
          writes += 1;
          const changes = {};
          for (const [key, value] of Object.entries(updates)) {
            changes[key] = { oldValue: data[key], newValue: structuredClone(value) };
            data[key] = structuredClone(value);
          }
          for (const listener of listeners) listener(structuredClone(changes), "local");
        },
        async remove(key) { delete data[key]; }
      }
    }
  };
  const context = vm.createContext({ chrome, structuredClone });
  vm.runInContext(settingsSource, context, { filename: "settings.js" });
  return {
    BC: context.BiliTheme, chrome, data, listeners,
    get writes() { return writes; },
    failWrite() { failNextWrite = true; },
    send(type, payload) { return chrome.runtime.sendMessage({ type, payload }); },
    receive(message, sender) { return handler(message, sender, () => {}); }
  };
}
