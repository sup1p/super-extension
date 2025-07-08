import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteStaticCopy } from "vite-plugin-static-copy";
import { resolve } from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    viteStaticCopy({
      targets: [
        { src: "src/chrome-extension/manifest.json", dest: "." },
        { src: "src/chrome-extension/public/icon16.png", dest: "./public" },
        { src: "src/chrome-extension/public/icon48.png", dest: "./public" },
        { src: "src/chrome-extension/public/icon128.png", dest: "./public" },

        { src: "src/chrome-extension/public/icon.png", dest: "./public" },
        { src: "src/chrome-extension/public/icon-white-bg.png", dest: "./public" },
        { src: "src/chrome-extension/public/icon-black-bg.png", dest: "./public" },

        { src: "src/chrome-extension/public/notes.png", dest: "./public" },
        { src: "src/chrome-extension/public/chat.png", dest: "./public" },
        { src: "src/chrome-extension/public/voice.png", dest: "./public" },
        { src: "src/chrome-extension/public/translate.png", dest: "./public" },
        { src: "src/chrome-extension/public/tools.png", dest: "./public" },
        { src: "src/chrome-extension/public/settings.png", dest: "./public" },

        { src: "src/chrome-extension/public/notes-white.png", dest: "./public" },
        { src: "src/chrome-extension/public/chat-white.png", dest: "./public" },
        { src: "src/chrome-extension/public/voice-white.png", dest: "./public" },
        { src: "src/chrome-extension/public/translate-white.png", dest: "./public" },
        { src: "src/chrome-extension/public/tools-white.png", dest: "./public" },
        { src: "src/chrome-extension/public/settings-white.png", dest: "./public" },

        { src: "src/chrome-extension/public/notes-active.png", dest: "./public" },
        { src: "src/chrome-extension/public/chat-active.png", dest: "./public" },
        { src: "src/chrome-extension/public/voice-active.png", dest: "./public" },
        { src: "src/chrome-extension/public/translate-active.png", dest: "./public" },
        { src: "src/chrome-extension/public/tools-active.png", dest: "./public" },
        { src: "src/chrome-extension/public/settings-active.png", dest: "./public" },

        { src: "src/chrome-extension/public/notes-white-active.png", dest: "./public" },
        { src: "src/chrome-extension/public/chat-active-white.png", dest: "./public" },
        { src: "src/chrome-extension/public/voice-white-active.png", dest: "./public" },
        { src: "src/chrome-extension/public/translate-white-active.png", dest: "./public" },
        { src: "src/chrome-extension/public/tools-active-white.png", dest: "./public" },
        { src: "src/chrome-extension/public/settings-white-active.png", dest: "./public" },

        { src: "src/chrome-extension/public/summarizer.png", dest: "./public" },
        { src: "src/chrome-extension/public/simplifier.png", dest: "./public" },

        { src: "src/chrome-extension/public/summarize-white.png", dest: "./public" },
        { src: "src/chrome-extension/public/simplify-white.png", dest: "./public" },

        { src: "src/chrome-extension/public/new-chat.png", dest: "./public" },
        { src: "src/chrome-extension/public/history.png", dest: "./public" },

        { src: "src/chrome-extension/public/account.png", dest: "./public" },
        { src: "src/chrome-extension/public/appereance.png", dest: "./public" },

        { src: "src/chrome-extension/public/account-active.png", dest: "./public" },
        { src: "src/chrome-extension/public/appereance-active.png", dest: "./public" },

        { src: "src/chrome-extension/public/account-white.png", dest: "./public" },
        { src: "src/chrome-extension/public/appereance-white.png", dest: "./public" },

        { src: "src/chrome-extension/public/account-white-active.png", dest: "./public" },
        { src: "src/chrome-extension/public/appereance-white-active.png", dest: "./public" }
      ],
    }),
  ],
  server: {
    open: "/popup-local.html",
  },
  build: {
    rollupOptions: {
      input: {
        popup: resolve(__dirname, "popup.html"),
        options: resolve(__dirname, "options.html"),
        background: resolve(__dirname, "src/background.ts"),
        content: resolve(__dirname, "src/content-enhanced.ts"),
      },
      output: {
        entryFileNames: (chunkInfo) => {
          // Переименовываем content-enhanced.js в content.js
          if (chunkInfo.name === 'content-enhanced') {
            return 'content.js';
          }
          return "[name].js";
        },
      },
    },
  },
});
