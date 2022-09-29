import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import GlobalsPolyfills from "@esbuild-plugins/node-globals-polyfill";
import NodeModulesPolyfills from "@esbuild-plugins/node-modules-polyfill";
import AutoImport from "unplugin-auto-import/vite";
import Components from "unplugin-vue-components/vite";
import { NaiveUiResolver } from "unplugin-vue-components/resolvers";

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        vue(),
        AutoImport({
            imports: [
                "vue",
                {
                    "naive-ui": [
                        "useDialog",
                        "useMessage",
                        "useNotification",
                        "useLoadingBar"
                    ]
                }
            ]
        }),
        Components({
            resolvers: [NaiveUiResolver()]
        })
    ],
    optimizeDeps: {
        esbuildOptions: {
            plugins: [
                NodeModulesPolyfills.default(),
                GlobalsPolyfills.default({
                    process: true,
                    buffer: true
                })
            ],
            define: {
                global: "globalThis"
            }
        }
    },
    server: {
        host: "127.0.0.1"
    }
});
