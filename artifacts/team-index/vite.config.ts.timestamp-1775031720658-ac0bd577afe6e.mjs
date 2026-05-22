// vite.config.ts
import { defineConfig } from "file:///Users/babar/Downloads/ERC-4626%20vault/Page-Builder/node_modules/.pnpm/vite@7.3.1_@types+node@25.3.5_jiti@2.6.1_lightningcss@1.31.1_tsx@4.21.0_yaml@2.8.2/node_modules/vite/dist/node/index.js";
import react from "file:///Users/babar/Downloads/ERC-4626%20vault/Page-Builder/node_modules/.pnpm/@vitejs+plugin-react@5.1.4_vite@7.3.1_@types+node@25.3.5_jiti@2.6.1_lightningcss@1.31.1_tsx@4.21.0_yaml@2.8.2_/node_modules/@vitejs/plugin-react/dist/index.js";
import tailwindcss from "file:///Users/babar/Downloads/ERC-4626%20vault/Page-Builder/node_modules/.pnpm/@tailwindcss+vite@4.2.1_vite@7.3.1_@types+node@25.3.5_jiti@2.6.1_lightningcss@1.31.1_tsx@4.21.0_yaml@2.8.2_/node_modules/@tailwindcss/vite/dist/index.mjs";
import path from "path";
import runtimeErrorOverlay from "file:///Users/babar/Downloads/ERC-4626%20vault/Page-Builder/node_modules/.pnpm/@replit+vite-plugin-runtime-error-modal@0.0.6/node_modules/@replit/vite-plugin-runtime-error-modal/dist/index.mjs";
var __vite_injected_original_dirname = "/Users/babar/Downloads/ERC-4626 vault/Page-Builder/artifacts/team-index";
var rawPort = process.env.PORT;
if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided."
  );
}
var port = Number(rawPort);
if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}
var basePath = process.env.BASE_PATH;
if (!basePath) {
  throw new Error(
    "BASE_PATH environment variable is required but was not provided."
  );
}
var vite_config_default = defineConfig({
  base: basePath,
  plugins: [
    react(),
    tailwindcss(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("file:///Users/babar/Downloads/ERC-4626%20vault/Page-Builder/node_modules/.pnpm/@replit+vite-plugin-cartographer@0.5.1/node_modules/@replit/vite-plugin-cartographer/dist/index.mjs").then(
        (m) => m.cartographer({
          root: path.resolve(__vite_injected_original_dirname, "..")
        })
      ),
      await import("file:///Users/babar/Downloads/ERC-4626%20vault/Page-Builder/node_modules/.pnpm/@replit+vite-plugin-dev-banner@0.1.2/node_modules/@replit/vite-plugin-dev-banner/dist/index.mjs").then(
        (m) => m.devBanner()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "src"),
      "@assets": path.resolve(__vite_injected_original_dirname, "..", "..", "attached_assets")
    },
    dedupe: ["react", "react-dom"]
  },
  root: path.resolve(__vite_injected_original_dirname),
  build: {
    outDir: path.resolve(__vite_injected_original_dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  },
  preview: {
    port,
    host: "0.0.0.0",
    allowedHosts: true
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlUm9vdCI6ICJmaWxlOi8vL1VzZXJzL2JhYmFyL0Rvd25sb2Fkcy9FUkMtNDYyNiUyMHZhdWx0L1BhZ2UtQnVpbGRlci9hcnRpZmFjdHMvdGVhbS1pbmRleC8iLAogICJzb3VyY2VzQ29udGVudCI6IFsiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIi9Vc2Vycy9iYWJhci9Eb3dubG9hZHMvRVJDLTQ2MjYgdmF1bHQvUGFnZS1CdWlsZGVyL2FydGlmYWN0cy90ZWFtLWluZGV4XCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvVXNlcnMvYmFiYXIvRG93bmxvYWRzL0VSQy00NjI2IHZhdWx0L1BhZ2UtQnVpbGRlci9hcnRpZmFjdHMvdGVhbS1pbmRleC92aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vVXNlcnMvYmFiYXIvRG93bmxvYWRzL0VSQy00NjI2JTIwdmF1bHQvUGFnZS1CdWlsZGVyL2FydGlmYWN0cy90ZWFtLWluZGV4L3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSBcInZpdGVcIjtcbmltcG9ydCByZWFjdCBmcm9tIFwiQHZpdGVqcy9wbHVnaW4tcmVhY3RcIjtcbmltcG9ydCB0YWlsd2luZGNzcyBmcm9tIFwiQHRhaWx3aW5kY3NzL3ZpdGVcIjtcbmltcG9ydCBwYXRoIGZyb20gXCJwYXRoXCI7XG5pbXBvcnQgcnVudGltZUVycm9yT3ZlcmxheSBmcm9tIFwiQHJlcGxpdC92aXRlLXBsdWdpbi1ydW50aW1lLWVycm9yLW1vZGFsXCI7XG5cbmNvbnN0IHJhd1BvcnQgPSBwcm9jZXNzLmVudi5QT1JUO1xuXG5pZiAoIXJhd1BvcnQpIHtcbiAgdGhyb3cgbmV3IEVycm9yKFxuICAgIFwiUE9SVCBlbnZpcm9ubWVudCB2YXJpYWJsZSBpcyByZXF1aXJlZCBidXQgd2FzIG5vdCBwcm92aWRlZC5cIixcbiAgKTtcbn1cblxuY29uc3QgcG9ydCA9IE51bWJlcihyYXdQb3J0KTtcblxuaWYgKE51bWJlci5pc05hTihwb3J0KSB8fCBwb3J0IDw9IDApIHtcbiAgdGhyb3cgbmV3IEVycm9yKGBJbnZhbGlkIFBPUlQgdmFsdWU6IFwiJHtyYXdQb3J0fVwiYCk7XG59XG5cbmNvbnN0IGJhc2VQYXRoID0gcHJvY2Vzcy5lbnYuQkFTRV9QQVRIO1xuXG5pZiAoIWJhc2VQYXRoKSB7XG4gIHRocm93IG5ldyBFcnJvcihcbiAgICBcIkJBU0VfUEFUSCBlbnZpcm9ubWVudCB2YXJpYWJsZSBpcyByZXF1aXJlZCBidXQgd2FzIG5vdCBwcm92aWRlZC5cIixcbiAgKTtcbn1cblxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcbiAgYmFzZTogYmFzZVBhdGgsXG4gIHBsdWdpbnM6IFtcbiAgICByZWFjdCgpLFxuICAgIHRhaWx3aW5kY3NzKCksXG4gICAgcnVudGltZUVycm9yT3ZlcmxheSgpLFxuICAgIC4uLihwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIgJiZcbiAgICBwcm9jZXNzLmVudi5SRVBMX0lEICE9PSB1bmRlZmluZWRcbiAgICAgID8gW1xuICAgICAgICAgIGF3YWl0IGltcG9ydChcIkByZXBsaXQvdml0ZS1wbHVnaW4tY2FydG9ncmFwaGVyXCIpLnRoZW4oKG0pID0+XG4gICAgICAgICAgICBtLmNhcnRvZ3JhcGhlcih7XG4gICAgICAgICAgICAgIHJvb3Q6IHBhdGgucmVzb2x2ZShpbXBvcnQubWV0YS5kaXJuYW1lLCBcIi4uXCIpLFxuICAgICAgICAgICAgfSksXG4gICAgICAgICAgKSxcbiAgICAgICAgICBhd2FpdCBpbXBvcnQoXCJAcmVwbGl0L3ZpdGUtcGx1Z2luLWRldi1iYW5uZXJcIikudGhlbigobSkgPT5cbiAgICAgICAgICAgIG0uZGV2QmFubmVyKCksXG4gICAgICAgICAgKSxcbiAgICAgICAgXVxuICAgICAgOiBbXSksXG4gIF0sXG4gIHJlc29sdmU6IHtcbiAgICBhbGlhczoge1xuICAgICAgXCJAXCI6IHBhdGgucmVzb2x2ZShpbXBvcnQubWV0YS5kaXJuYW1lLCBcInNyY1wiKSxcbiAgICAgIFwiQGFzc2V0c1wiOiBwYXRoLnJlc29sdmUoaW1wb3J0Lm1ldGEuZGlybmFtZSwgXCIuLlwiLCBcIi4uXCIsIFwiYXR0YWNoZWRfYXNzZXRzXCIpLFxuICAgIH0sXG4gICAgZGVkdXBlOiBbXCJyZWFjdFwiLCBcInJlYWN0LWRvbVwiXSxcbiAgfSxcbiAgcm9vdDogcGF0aC5yZXNvbHZlKGltcG9ydC5tZXRhLmRpcm5hbWUpLFxuICBidWlsZDoge1xuICAgIG91dERpcjogcGF0aC5yZXNvbHZlKGltcG9ydC5tZXRhLmRpcm5hbWUsIFwiZGlzdC9wdWJsaWNcIiksXG4gICAgZW1wdHlPdXREaXI6IHRydWUsXG4gIH0sXG4gIHNlcnZlcjoge1xuICAgIHBvcnQsXG4gICAgaG9zdDogXCIwLjAuMC4wXCIsXG4gICAgYWxsb3dlZEhvc3RzOiB0cnVlLFxuICAgIGZzOiB7XG4gICAgICBzdHJpY3Q6IHRydWUsXG4gICAgICBkZW55OiBbXCIqKi8uKlwiXSxcbiAgICB9LFxuICB9LFxuICBwcmV2aWV3OiB7XG4gICAgcG9ydCxcbiAgICBob3N0OiBcIjAuMC4wLjBcIixcbiAgICBhbGxvd2VkSG9zdHM6IHRydWUsXG4gIH0sXG59KTtcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBeVksU0FBUyxvQkFBb0I7QUFDdGEsT0FBTyxXQUFXO0FBQ2xCLE9BQU8saUJBQWlCO0FBQ3hCLE9BQU8sVUFBVTtBQUNqQixPQUFPLHlCQUF5QjtBQUpoQyxJQUFNLG1DQUFtQztBQU16QyxJQUFNLFVBQVUsUUFBUSxJQUFJO0FBRTVCLElBQUksQ0FBQyxTQUFTO0FBQ1osUUFBTSxJQUFJO0FBQUEsSUFDUjtBQUFBLEVBQ0Y7QUFDRjtBQUVBLElBQU0sT0FBTyxPQUFPLE9BQU87QUFFM0IsSUFBSSxPQUFPLE1BQU0sSUFBSSxLQUFLLFFBQVEsR0FBRztBQUNuQyxRQUFNLElBQUksTUFBTSx3QkFBd0IsT0FBTyxHQUFHO0FBQ3BEO0FBRUEsSUFBTSxXQUFXLFFBQVEsSUFBSTtBQUU3QixJQUFJLENBQUMsVUFBVTtBQUNiLFFBQU0sSUFBSTtBQUFBLElBQ1I7QUFBQSxFQUNGO0FBQ0Y7QUFFQSxJQUFPLHNCQUFRLGFBQWE7QUFBQSxFQUMxQixNQUFNO0FBQUEsRUFDTixTQUFTO0FBQUEsSUFDUCxNQUFNO0FBQUEsSUFDTixZQUFZO0FBQUEsSUFDWixvQkFBb0I7QUFBQSxJQUNwQixHQUFJLFFBQVEsSUFBSSxhQUFhLGdCQUM3QixRQUFRLElBQUksWUFBWSxTQUNwQjtBQUFBLE1BQ0UsTUFBTSxPQUFPLG9MQUFrQyxFQUFFO0FBQUEsUUFBSyxDQUFDLE1BQ3JELEVBQUUsYUFBYTtBQUFBLFVBQ2IsTUFBTSxLQUFLLFFBQVEsa0NBQXFCLElBQUk7QUFBQSxRQUM5QyxDQUFDO0FBQUEsTUFDSDtBQUFBLE1BQ0EsTUFBTSxPQUFPLGdMQUFnQyxFQUFFO0FBQUEsUUFBSyxDQUFDLE1BQ25ELEVBQUUsVUFBVTtBQUFBLE1BQ2Q7QUFBQSxJQUNGLElBQ0EsQ0FBQztBQUFBLEVBQ1A7QUFBQSxFQUNBLFNBQVM7QUFBQSxJQUNQLE9BQU87QUFBQSxNQUNMLEtBQUssS0FBSyxRQUFRLGtDQUFxQixLQUFLO0FBQUEsTUFDNUMsV0FBVyxLQUFLLFFBQVEsa0NBQXFCLE1BQU0sTUFBTSxpQkFBaUI7QUFBQSxJQUM1RTtBQUFBLElBQ0EsUUFBUSxDQUFDLFNBQVMsV0FBVztBQUFBLEVBQy9CO0FBQUEsRUFDQSxNQUFNLEtBQUssUUFBUSxnQ0FBbUI7QUFBQSxFQUN0QyxPQUFPO0FBQUEsSUFDTCxRQUFRLEtBQUssUUFBUSxrQ0FBcUIsYUFBYTtBQUFBLElBQ3ZELGFBQWE7QUFBQSxFQUNmO0FBQUEsRUFDQSxRQUFRO0FBQUEsSUFDTjtBQUFBLElBQ0EsTUFBTTtBQUFBLElBQ04sY0FBYztBQUFBLElBQ2QsSUFBSTtBQUFBLE1BQ0YsUUFBUTtBQUFBLE1BQ1IsTUFBTSxDQUFDLE9BQU87QUFBQSxJQUNoQjtBQUFBLEVBQ0Y7QUFBQSxFQUNBLFNBQVM7QUFBQSxJQUNQO0FBQUEsSUFDQSxNQUFNO0FBQUEsSUFDTixjQUFjO0FBQUEsRUFDaEI7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=

// uhukhkjbdjkewd hgjhb