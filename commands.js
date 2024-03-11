import "dotenv/config";

import { DiscordRequest } from "./utils.js";

const PING_COMMAND = {
  name: "ping",
  description: "Ping the bot to check if it is online",
  type: 1,
};

const PRICE_COMMAND = {
  name: "price",
  description: "Get the price of all (WEMADE) Night Crows Tokens",
  type: 1,
};

const ALL_COMMANDS = [PING_COMMAND, PRICE_COMMAND];

async function InstallGlobalCommands(appId, commands) {
  console.log("[COMMAND.JS] Starting");
  console.table(commands);
  
  const endpoint = `applications/${appId}/commands`;

  try {
    await DiscordRequest(endpoint, { method: "PUT", body: commands });
    console.log("[COMMAND.JS] Commands Registered!");
  } catch (err) {
    console.error("[COMMAND.JS] Error installing commands: ", err);
  }
}

InstallGlobalCommands(process.env.APP_ID, ALL_COMMANDS);
