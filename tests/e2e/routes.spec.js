const { test, expect } = require("@playwright/test");

function obfuscateKey(key) {
  const pattern = [0x47, 0x82, 0xa1, 0x3f, 0xe5, 0x19, 0x6b, 0xcd];
  let result = "";
  for (let i = 0; i < key.length; i++) {
    const charCode = key.charCodeAt(i) ^ pattern[i % pattern.length];
    result += String.fromCharCode(charCode);
  }
  return Buffer.from(result, "binary").toString("base64");
}

test("rutter renderas och alternativa avgångar öppnas", async ({ page }) => {
  const apiKey = "test-key";
  await page.addInitScript((obfuscated) => {
    localStorage.setItem("trafiklab_api_key", obfuscated);
  }, obfuscateKey(apiKey));

  let routeRequests = 0;

  await page.route("**/api/search**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        StopLocation: [
          { name: "Stockholm C", extId: "740000001", type: "ST" },
          { name: "Göteborg C", extId: "740000002", type: "ST" },
        ],
      }),
    });
  });

  await page.route("**/api/route**", async (route) => {
    routeRequests += 1;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        Trip: [
          {
            LegList: {
              Leg: [
                {
                  type: "JNY",
                  Origin: {
                    name: "Stockholm C",
                    extId: "740000001",
                    date: "2026-02-03",
                    time: "10:00:00",
                  },
                  Destination: {
                    name: "Göteborg C",
                    extId: "740000002",
                    date: "2026-02-03",
                    time: "12:30:00",
                  },
                  Product: [{ catOutS: "JRE", name: "Regionaltåg" }],
                },
              ],
            },
          },
        ],
      }),
    });
  });

  await page.route("**/api/departures**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        Departure: [
          {
            name: "Regionaltåg",
            time: "10:05:00",
            date: "2026-02-03",
            direction: "Göteborg C",
            Product: { catOutS: "JRE", name: "Regionaltåg", line: "1" },
          },
        ],
      }),
    });
  });

  await page.goto("/");

  await page.getByLabel("Från").fill("Stockholm");
  const fromOption = page.locator("#from-suggestions .suggestion-item", {
    hasText: "Stockholm C",
  });
  await expect(fromOption).toBeVisible();
  await fromOption.click();

  await page.getByLabel("Till").fill("Göteborg");
  const toOption = page.locator("#to-suggestions .suggestion-item", {
    hasText: "Göteborg C",
  });
  await expect(toOption).toBeVisible();
  await toOption.click();

  await page.getByRole("button", { name: "Hitta rutter" }).click();
  await expect(page.locator("#results")).toBeVisible();
  await expect(page.locator(".trip-card")).toHaveCount(1);

  await page.locator(".trip-card").first().click();
  await expect(page.locator(".leg-clickable").first()).toBeVisible();
  await page.locator(".leg-clickable").first().click();
  await expect(page.locator("#alternatives-modal")).toBeVisible();
  await expect(page.locator(".alternative-departure")).toHaveCount(1);

  await page.locator(".alternative-departure").first().click();
  await expect.poll(() => routeRequests).toBeGreaterThanOrEqual(2);
});
