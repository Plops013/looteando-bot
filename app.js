import "dotenv/config";

import { ActivityType, Client, GatewayIntentBits } from "discord.js";
import { InteractionResponseType, InteractionType } from "discord-interactions";

import { VerifyDiscordRequest } from "./utils.js";
import express from "express";
import fetch from "node-fetch";

const app = express();
const PORT = process.env.PORT || 3000;
const API = {
  USD: "https://api.coing2ecko.com/api/v3/simple/price?ids=usd&vs_currencies=brl",
  WEMIX: "https://api.we2mix.network/price",
  CROW: "https://api.we2mixplay.com/info/v2/coin?page=1&size=10&sort=tradingVolumeWD&search=crow",
};

app.use(express.json({ verify: VerifyDiscordRequest(process.env.PUBLIC_KEY) }));

app.post("/interactions", async function (req, res) {
  performance.mark("start");

  const { type, data } = req.body;

  if (type === InteractionType.PING) {
    return res.send({ type: InteractionResponseType.PONG });
  }

  if (!type === InteractionType.APPLICATION_COMMAND) {
    return res.status(400).send("Bad Request");
  }

  try {
    const { name } = data;

    if (name === "ping") {
      performance.mark("end");
      const ping =
        performance.measure("ping", "start", "end").duration.toFixed(3) * 1000;
      return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: `Pong - ${ping}ms`,
        },
      });
    }

    if (name == "price") {
      const usdToBrl = await getUsdPrice();
      const crowToBrl = await getCrowPrice();

      return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: `
U$ -> R$ ${formatPrice(usdToBrl)}
Crow -> R$ ${formatPrice(crowToBrl)}`,
        },
      });
    }
  } catch (err) {
    return res.send({
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: `Ops! Houve um erro ao consultar preço, tente novamente em instantes ou consulte diretamente [aqui](https://wemixplay.com/en/tokens?search=crow)`,
      },
    });
  }
});

function formatPrice(price) {
  if (typeof price !== "number") return "-,--";
  return price.toLocaleString("pt-BR", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  });
}

async function getUsdPrice() {
  return await fetch(API.USD)
    .then((res) => res.json())
    .then((data) => data?.usd?.brl);
}

async function getCrowPrice() {
  const usdToBrl = await getUsdPrice();
  return await fetch(API.CROW)
    .then((res) => res.json())
    .then(({ data }) => (data?.token?.[0]?.priceData?.price ?? 0) * usdToBrl);
}

async function updateStatus() {
  try {
    const client = new Client({ intents: [GatewayIntentBits.Guilds] });
    await client.login(process.env.DISCORD_TOKEN);

    const crowToBrl = await getCrowPrice();

    const serverDate = new Date();
    const brazilDate = new Date(
      serverDate.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" })
    );

    const nowString =
      brazilDate
        .getHours()
        .toLocaleString("pt-BR", { minimumIntegerDigits: 2 }) +
      ":" +
      brazilDate.getMinutes();

    client.user.setPresence({
      activities: [
        {
          name: "CROW - R$ " + formatPrice(crowToBrl) + " | " + nowString,
          type: ActivityType.Custom,
        },
      ],
      status: "online",
    });
  } catch (err) {
    console.error("[APP.JS] Error updating status: ", err);
  }
}

app.listen(PORT, () => {
  updateStatus();
  setInterval(updateStatus, 60000 * 5);
  console.log("[APP.JS] ", PORT);
});
