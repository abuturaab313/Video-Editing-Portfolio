import { defineConfig } from "vite";

/**
 * The cloud preview hostname changes between sessions. Vite refuses unknown
 * Host headers by default, so we allow exactly the hostname passed in at
 * start-up instead of a wildcard.
 */
const allowedHost = process.env.VITE_ALLOWED_HOST;

export default defineConfig({
  base: "./",
  server: {
    host: "0.0.0.0",
    port: Number(process.env.PORT) || 3000,
    strictPort: false,
    allowedHosts: allowedHost ? [allowedHost] : [],
  },
  build: {
    target: "es2020",
  },
});
