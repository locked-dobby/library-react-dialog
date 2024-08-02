import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import ViteRestart from "vite-plugin-restart";

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        react(),
        ViteRestart({
            restart: ["./.yalc/@locked-dobby/library-react-dialog/yalc.sig"],
        }),
    ],
});
