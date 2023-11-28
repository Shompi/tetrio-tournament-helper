import * as dotenv from "dotenv";
dotenv.config();

import { SapphireClient, LogLevel } from "@sapphire/framework";
import { GatewayIntentBits } from "discord.js";

const client = new SapphireClient({
	intents: [
		GatewayIntentBits.Guilds
	],
	logger: { level: LogLevel.Debug },
});

client.login(process.env.BOT_TOKEN);