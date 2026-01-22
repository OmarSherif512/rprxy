import express from "express";
import fetch from "node-fetch";
const app = express();
const PORT = 3000;

app.get("/roblox/game/:placeId", async (req, res) => {
  try {
    const placeId = req.params.placeId;

    // 1️⃣ Convert to Universe ID
    const convert = await fetch(`https://games.roblox.com/v1/games/multiget-place-details?placeIds=${placeId}`);
    const convertData = await convert.json();
    if (!convertData?.length) return res.status(404).json({ error: "Invalid Place ID" });
    const universeId = convertData[0].universeId;

    // 2️⃣ Game Icon
    const iconUrl = `https://thumbnails.roblox.com/v1/games/icons?universeIds=${universeId}&size=768x432&format=png`;
    const iconReq = await fetch(iconUrl);
    const iconData = await iconReq.json();

    // 3️⃣ Thumbnails / Media
    const thumbUrl = `https://games.roblox.com/v2/games/${universeId}/media`;
    const thumbReq = await fetch(thumbUrl);
    const thumbData = await thumbReq.json();

    // 📦 Respond with aggregated JSON
    res.json({
      placeId,
      universeId,
      icon: iconData?.data?.[0]?.imageUrl ?? null,
      thumbnails: thumbData ?? []
    });

  } catch (err) {
    console.error(err);
    res.status(500).send("Proxy error");
  }
});

app.listen(PORT, () => console.log(`Roblox proxy running on ${PORT}`));
