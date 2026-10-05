import babel from "@rolldown/plugin-babel";
import tailwindcss from "@tailwindcss/vite";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
    server: {
        port: 3000,
        strictPort: true,
        // Proxy API calls to the gateway so the browser only ever talks to this origin (no CORS, works from any host)
        proxy: {
            "/api": {
                target: process.env.API_PROXY_TARGET ?? "http://localhost:8080",
                changeOrigin: true
            }
        }
    },
    plugins: [react(), tailwindcss(), babel({ presets: [reactCompilerPreset()] })]
});
