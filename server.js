const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());

app.get("/", (req, res) => {
  res.send("TEFAS API proxy is running");
});

app.get("/fund/:code", async (req, res) => {
  const fundCode = req.params.code.toUpperCase();

  try {
    const response = await fetch("https://www.tefas.gov.tr/api/funds/fonFiyatBilgiGetir", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "User-Agent": "Mozilla/5.0"
      },
      body: JSON.stringify({
        fonKodu: fundCode,
        dil: "TR",
        periyod: 12
      })
    });

    const data = await response.json();
    const list = data.resultList || [];

    if (!list.length) {
      return res.status(404).json({
        fundCode,
        error: true,
        message: "No price data found"
      });
    }

    const latest = list[list.length - 1];

    res.json({
      fundCode,
      fundName: latest.fonUnvan,
      date: latest.tarih,
      lastPrice: latest.fiyat
    });

  } catch (err) {
    res.status(500).json({
      error: true,
      message: err.message
    });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
