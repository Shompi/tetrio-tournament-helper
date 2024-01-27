import { BlocklistModel, BlocklistedUser } from "./Blocklist.js";
import { CategoryModel, TournamentCategory } from "./Category.js";
import { GuildConfigs, GuildModel } from "./Guilds.js";
import { RegisteredPlayer, Tournament, TournamentModel, TournamentStatus, TournamentStatusStrings } from "./Tournaments.js";

/** Models have not been initialized at this point nor synced. */

CategoryModel.hasOne(TournamentModel)

/** Sync the models */
await CategoryModel.sync()
await TournamentModel.sync()
await GuildModel.sync()
await BlocklistModel.sync()

export {
	BlocklistModel,
	CategoryModel,
	GuildModel,
	TournamentModel
}

export {
	BlocklistedUser,
	TournamentCategory,
	GuildConfigs,
	RegisteredPlayer, Tournament, TournamentStatus, TournamentStatusStrings
}

