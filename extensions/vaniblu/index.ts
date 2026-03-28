// extensions/vaniblu/index.ts
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
import type { OpenClawPluginApi } from "openclaw/plugin-sdk/plugin-entry";

type PluginRuntime = OpenClawPluginApi["runtime"];

export const runtimeStore = createPluginRuntimeStore<PluginRuntime>(
  "VaniBlu: runtime not initialized — make sure the plugin is registered"
);

export default definePluginEntry({
  id: "vaniblu-social-agent",
  name: "VaniBlu Social Agent",
  description: "Social media manager for VaniBlu brand",
  register(api) {
    runtimeStore.setRuntime(api.runtime);
    // Tools registered in later tasks
  },
});
