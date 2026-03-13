import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "~": path.resolve(__dirname, "app"),
      "@msr/channel-adapter": path.resolve(
        __dirname,
        "../../packages/channel-adapter/src/index.ts",
      ),
      "@msr/chat-ui": path.resolve(
        __dirname,
        "../../packages/chat-ui/src/index.ts",
      ),
      "@msr/data-client": path.resolve(
        __dirname,
        "../../packages/data-client/src/index.ts",
      ),
      "@msr/analytics": path.resolve(
        __dirname,
        "../../packages/analytics/src/index.ts",
      ),
    },
  },
  test: {
    root: __dirname,
    environment: "jsdom",
    include: ["app/**/*.test.ts", "app/**/*.test.tsx"],
    setupFiles: [],
  },
});
