import * as dotenv from "dotenv";
dotenv.config();

import { SapphireClient, LogLevel } from "@sapphire/framework";
import "@sapphire/plugin-hmr/register";
import { GatewayIntentBits } from "discord.js";

const client = new SapphireClient({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMembers
	],
	logger: { level: LogLevel.Debug },
});

client.login(process.env.BOT_TOKEN);