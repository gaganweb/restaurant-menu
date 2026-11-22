import { defineConfig } from "@playwright/test";

const viewport = { width: 390, height: 844 };

export default defineConfig({
  testDir: "./tests",
  use: { baseURL: "http://localhost:3100", viewport, hasTouch: true, isMobile: true, screenshot: "only-on-failure" },
  projects: [
    { name: "android-chrome", use: { browserName: "chromium" } },
    { name: "ios-safari", use: { browserName: "webkit" } },
  ],
  webServer: { command: "npx next start -p 3100", url: "http://localhost:3100", reuseExistingServer: false },
});
