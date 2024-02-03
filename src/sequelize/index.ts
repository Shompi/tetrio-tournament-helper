import { BlocklistModel, BlocklistedUser } from "./Blocklist.js";
import { GuildConfigs, GuildModel } from "./Guilds.js";
import { RegisteredPlayer, Tournament, TournamentModel, TournamentStatus, TournamentStatusStrings } from "./Tournaments.js";


/** Sync the models */

console.log("[SEQUELIZE] Sincronizando modelo TournamentModel");
await TournamentModel.sync({ alter: true })
console.log("[SEQUELIZE] Sincronizando modelo GuildModel");
await GuildModel.sync({ alter: true })
console.log("[SEQUELIZE] Sincronizando modelo BlocklistModel");
await BlocklistModel.sync()
console.log("[SEQUELIZE] La sincronización de los modelos ha terminado.")

export {
	BlocklistModel,
	GuildModel,
	TournamentModel
}

export {
	BlocklistedUser,
	GuildConfigs,
	RegisteredPlayer,
	Tournament, TournamentStatus, TournamentStatusStrings,
}

