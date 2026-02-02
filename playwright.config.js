const { defineConfig } = require("@playwright/test");

module.exports = defineConfig({
  testDir: "tests/e2e",
  use: {
    baseURL: "http://localhost:5000",
    trace: "on-first-retry",
  },
});
