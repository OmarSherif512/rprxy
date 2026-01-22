const convert = await fetch(
  "https://games.roblox.com/v1/games/multiget-place-details",
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      placeIds: [Number(placeId)]
    })
  }
);

const convertData = await convert.json();

if (!Array.isArray(convertData) || !convertData[0]?.universeId) {
  console.log("Roblox response:", convertData);
  return res.status(400).json({ error: "Invalid Place ID" });
}

const universeId = convertData[0].universeId;
