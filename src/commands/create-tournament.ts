import { Command } from "@sapphire/framework";
import { PermissionsBitField } from "discord.js";
import { TournamentModel, TournamentStatus } from "../sequelize/Tournaments.js";
import { GameName, TetrioRanksArray } from "../helper-functions/index.js";
import { TournamentDetailsEmbed } from "../helper-functions/index.js";
import { GetRolesToAddArray } from "../helper-functions/index.js";
export class CreateTournament extends Command {

	public constructor(context: Command.LoaderContext, options: Command.Options) {
		super(context, { ...options });
	}

	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand((builder) => {

			builder
		}, { idHints: ["1178881110046941236"] })
	}

}