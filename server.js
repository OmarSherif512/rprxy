const express = require("express");
const axios = require("axios");
const app = express();

const PORT = process.env.PORT || 10000;

app.get("/universes/v1/places/:placeId/universe", async (req, res) => {
    const placeId = req.params.placeId;

    try {
        // Step 1: get universeId
        const uniResp = await axios.get(`https://apis.roblox.com/universes/v1/places/${placeId}/universe`);
        const universeId = uniResp.data.universeId;

        // Step 2: get game info
        const gameResp = await axios.get(`https://games.roblox.com/v1/games?universeIds=${universeId}`);

        // Step 3: get game thumbnail (optional)
        const thumbResp = await axios.get(`https://thumbnails.roblox.com/v1/games/icons?universeIds=${universeId}&size=150x150&format=Png&isCircular=false`);

        res.json({
            gameInfo: gameResp.data,
            thumbnail: thumbResp.data
        });

    } catch (err) {
        console.error(err);
        res.status(500).send("Proxying failed");
    }
});

app.listen(PORT, () => console.log(`Proxy server running on port ${PORT}`));
