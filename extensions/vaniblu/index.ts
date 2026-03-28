// extensions/vaniblu/index.ts
import { definePluginEntry } from "@openclaw/sdk/plugin";
import { createPluginRuntimeStore } from "@openclaw/sdk/runtime";

export const runtimeStore = createPluginRuntimeStore();

export default definePluginEntry({
  name: "vaniblu-social-agent",
  register(api) {
    runtimeStore.set(api.runtime);
    // Tools registered in later tasks
  },
});
