const express = require("express");
const puppeteer = require("puppeteer");
const cors = require("cors");

const app = express();
app.use(cors());

app.get("/fund/:code", async (req, res) => {
  const fundCode = req.params.code.toUpperCase();

  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  try {
    const page = await browser.newPage();

    const url = `https://www.tefas.gov.tr/FonAnaliz.aspx?FonKod=${fundCode}`;

    await page.goto(url, { waitUntil: "networkidle2" });

    const result = await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll("div, p, span"));

      let lastPrice = null;

      for (let i = 0; i < elements.length; i++) {
        if (elements[i].innerText.trim() === "Son Fiyat (TL)") {
          lastPrice = elements[i + 1]?.innerText.trim();
          break;
        }
      }

      return { lastPrice };
    });

    await browser.close();

    res.json({
      fundCode,
      lastPrice: result.lastPrice
    });

  } catch (err) {
    await browser.close();
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running"));
