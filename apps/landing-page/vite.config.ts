import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import alchemy from "alchemy/cloudflare/tanstack-start";
import { defineConfig, type PluginOption } from "vite";

const config = defineConfig(({ command }) => ({
  resolve: { tsconfigPaths: true },
  plugins: [
    tailwindcss(),
    ...(command === "build" ? [alchemy() as PluginOption] : []),
    tanstackStart(),
    viteReact(),
    {
      name: "optimize-images",
      buildStart() {
        const genDir = resolve("public/images/gen");
        if (!existsSync(genDir)) {
          console.log("\n🖼️  Generating optimized images...");
          try {
            execSync("bun scripts/optimize-images.ts", { stdio: "inherit" });
          } catch {
            console.error(
              "⚠️  Image optimization failed, continuing without it."
            );
          }
        }
      },
    } satisfies PluginOption,
  ],
}));

export default config;
