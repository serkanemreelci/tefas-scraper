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
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--single-process",
        "--no-zygote"
      ]
    });

    const page = await browser.newPage();

    const url = `https://www.tefas.gov.tr/FonAnaliz.aspx?FonKod=${fundCode}`;

    await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 45000
    });

    await new Promise(resolve => setTimeout(resolve, 5000));

    const result = await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll("div, p, span"));

      let lastPrice = null;

      for (let i = 0; i < elements.length; i++) {
        const text = elements[i].innerText?.trim();

        if (text === "Son Fiyat (TL)") {
          lastPrice = elements[i + 1]?.innerText?.trim();
          break;
        }
      }

      return { lastPrice };
    });

    res.json({
      fundCode,
      lastPrice: result.lastPrice
    });

  } catch (err) {
    console.error("SCRAPER ERROR:", err);

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
