import express from "express";
import fetch from "node-fetch";

const app = express();
const PORT = process.env.PORT || 3000;

app.get("/roblox/game/:placeId", async (req, res) => {
  try {
    const placeId = Number(req.params.placeId);

    if (!placeId) {
      return res.status(400).json({ error: "Invalid Place ID" });
    }

    // 1️⃣ PlaceId → UniverseId (POST)
    const convertRes = await fetch(
      "https://games.roblox.com/v1/games/multiget-place-details",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          placeIds: [placeId]
        })
      }
    );

    const convertData = await convertRes.json();

    if (!Array.isArray(convertData) || !convertData[0]?.universeId) {
      return res.status(400).json({
        error: "Invalid Place ID",
        robloxResponse: convertData
      });
    }

    const universeId = convertData[0].universeId;

    // 2️⃣ Game Icon
    const iconRes = await fetch(
      `https://thumbnails.roblox.com/v1/games/icons?universeIds=${universeId}&size=512x512&format=png`
    );
    const iconData = await iconRes.json();

    // 3️⃣ Thumbnails
    const mediaRes = await fetch(
      `https://games.roblox.com/v2/games/${universeId}/media`
    );
    const mediaData = await mediaRes.json();

    res.json({
      placeId,
      universeId,
      icon: iconData?.data?.[0]?.imageUrl ?? null,
      thumbnails: mediaData?.data ?? []
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
