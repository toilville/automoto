import { reactRouter } from "@react-router/dev/vite";
import { defineConfig } from "vite";
import { cjsInterop } from "vite-plugin-cjs-interop";
import griffel from "@griffel/vite-plugin";
import path from "path";

export default defineConfig(({ command }) => ({
  plugins: [
    ...reactRouter(),
    cjsInterop({
      dependencies: ["@fluentui/react-components"],
    }),
    command === "build" && griffel(),
  ].filter(Boolean),

  resolve: {
    alias: {
      "~": path.resolve(__dirname, "./app"),
    },
    dedupe: [
      "react",
      "react-dom",
      "@fluentui/react-components",
      "@fluentui/react-icons",
    ],
  },

  ssr: {
    noExternal: [
      "@fluentui/react-icons",
      "react-markdown",
      "remark-gfm",
      "rehype-sanitize",
    ],
  },

  optimizeDeps: {
    include: [
      "@fluentui/react-components",
      "@fluentui/react-icons",
      "react",
      "react-dom",
      "react-router",
      "react-markdown",
      "remark-gfm",
      "rehype-sanitize",
    ],
  },
}));
