import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { build, type InlineConfig } from "vite";

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const srcDir = resolve(rootDir, "src");

export type ExtensionTarget = "chromium" | "firefox" | "safari-prep";

const targetManifest: Record<ExtensionTarget, string> = {
  chromium: "chromium.manifest.json",
  firefox: "firefox.manifest.json",
  "safari-prep": "safari.manifest.json"
};

async function copyManifest(target: ExtensionTarget, outDir: string): Promise<void> {
  const manifestPath = resolve(rootDir, "manifest", targetManifest[target]);
  const manifest = await readFile(manifestPath, "utf8");
  await writeFile(resolve(outDir, "manifest.json"), manifest);
}

async function copyStaticAssets(outDir: string): Promise<void> {
  await mkdir(resolve(outDir, "icons"), { recursive: true });
  await cp(resolve(rootDir, "public", "icons"), resolve(outDir, "icons"), {
    recursive: true,
    force: true
  });
}

function baseConfig(outDir: string): InlineConfig {
  return {
    configFile: false,
    root: srcDir,
    publicDir: resolve(rootDir, "public"),
    plugins: [react()],
    build: {
      target: "es2022",
      sourcemap: false,
      minify: false,
      outDir,
      emptyOutDir: false
    }
  };
}

export async function buildExtension(target: ExtensionTarget): Promise<void> {
  const outDir = resolve(rootDir, "dist", target);
  await rm(outDir, { force: true, recursive: true });
  await mkdir(outDir, { recursive: true });

  await build({
    ...baseConfig(outDir),
    build: {
      ...baseConfig(outDir).build,
      emptyOutDir: false,
      rollupOptions: {
        input: {
          sidepanel: resolve(srcDir, "sidepanel", "index.html"),
          options: resolve(srcDir, "options", "index.html"),
          offscreen: resolve(srcDir, "offscreen", "offscreen.html")
        },
        output: {
          entryFileNames: "assets/[name].js",
          chunkFileNames: "assets/[name].js",
          assetFileNames: "assets/[name][extname]"
        }
      }
    }
  });

  await build({
    ...baseConfig(outDir),
    build: {
      ...baseConfig(outDir).build,
      lib: {
        entry: resolve(srcDir, "background", "index.ts"),
        formats: ["es"],
        fileName: () => "background/index.js"
      },
      rollupOptions: {
        output: {
          entryFileNames: "background/index.js",
          chunkFileNames: "background/[name].js"
        }
      }
    }
  });

  await build({
    ...baseConfig(outDir),
    build: {
      ...baseConfig(outDir).build,
      lib: {
        entry: resolve(srcDir, "content", "index.ts"),
        name: "PageVoiceContentScript",
        formats: ["iife"],
        fileName: () => "content/index.js"
      },
      rollupOptions: {
        output: {
          entryFileNames: "content/index.js",
          inlineDynamicImports: true
        }
      }
    }
  });

  await copyManifest(target, outDir);
  await copyStaticAssets(outDir);
}
