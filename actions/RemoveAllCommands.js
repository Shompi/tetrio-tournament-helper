import { Routes, REST } from "discord.js"

const rest = new REST({ version: '10' }).setToken(process.env.BOT_TOKEN)

/** Remove all Global commands. */
console.log("Removing all Global commands from Discord...")
await rest.put(Routes.applicationCommands(process.env.BOT_ID), { body: [] })
console.log("Done.")
console.log("Removing all Guild commands from Discord...")
await rest.put(Routes.applicationGuildCommands(process.env.BOT_ID, "941843371062861855"), { body: [] })
console.log("Done.");