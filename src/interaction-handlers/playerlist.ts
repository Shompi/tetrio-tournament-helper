import { InteractionHandler, InteractionHandlerTypes } from "@sapphire/framework"
import { ButtonInteraction, Colors } from "discord.js";
import { PrettyMsg, GetTournamentFromGuild, AllowedGames, BuildPlayerListEmbed } from "../helper-functions/index.js";
import { CommonMessages } from "../helper-functions/common-messages.js";
import { codeBlock } from "@sapphire/utilities";

export class PlayerListButtonHandler extends InteractionHandler {
	public constructor(ctx: InteractionHandler.LoaderContext, options: InteractionHandler.Options) {
		super(ctx, { interactionHandlerType: InteractionHandlerTypes.Button });
	}

	public async run(interaction: ButtonInteraction<'cached'>, tournamentId: string) {
		const tournament = await GetTournamentFromGuild(interaction.guildId, +tournamentId)

		if (!tournament) return void await interaction.reply({
			ephemeral: true,
			embeds: [
				PrettyMsg({
					description: CommonMessages.Tournament.NotFound,
					color: Colors.Red
				})
			]
		})

		if (tournament.game === AllowedGames.TETRIO) {

			return void await interaction.reply({
				ephemeral: true,
				embeds: [BuildPlayerListEmbed(tournament)]
			})

		} else {

			return void await interaction.reply({
				ephemeral: true,
				embeds: [
					PrettyMsg({
						description: codeBlock(tournament.players.map((player, index) => `${index}° ${player.dUsername}`).join("\n"))
					})
				]
			})
		}
	}

	public parse(interaction: ButtonInteraction) {
		// Only handle checkin interaction from buttons
		if (interaction.customId.startsWith('t-playerlist')) {
			return this.some(interaction.customId.split("-")[2]);
		}

		return this.none();
	}
}
