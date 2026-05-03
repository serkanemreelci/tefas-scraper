const express = require("express");
const puppeteer = require("puppeteer");
const cors = require("cors");

const app = express();
app.use(cors());

app.get("/", (req, res) => {
  res.send("TEFAS scraper is running");
});

app.get("/fund/:code", async (req, res) => {
  const fundCode = req.params.code.toUpperCase();
  let browser;

  try {
    browser = await puppeteer.launch({
      headless: "new",
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--disable-software-rasterizer",
        "--disable-extensions"
      ]
    });

    const page = await browser.newPage();

    const url = `https://www.tefas.gov.tr/FonAnaliz.aspx?FonKod=${fundCode}`;

    await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 60000
    });

    await new Promise(resolve => setTimeout(resolve, 7000));

    const result = await page.evaluate(() => {
      const text = document.body.innerText;
      const lines = text
        .split("\n")
        .map(x => x.trim())
        .filter(Boolean);

      let lastPrice = null;

      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes("Son Fiyat")) {
          for (let j = i + 1; j < Math.min(i + 6, lines.length); j++) {
            if (/^[0-9.,]+$/.test(lines[j])) {
              lastPrice = lines[j];
              break;
            }
          }
        }

        if (lastPrice) break;
      }

      return {
        lastPrice,
        sampleText: lines.slice(0, 80)
      };
    });

    res.json({
      fundCode,
      lastPrice: result.lastPrice,
      debug: result.sampleText
    });

  } catch (err) {
    res.status(500).json({
      error: true,
      message: err.message
    });

  } finally {
    if (browser) {
      await browser.close();
    }
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
