import { InteractionHandler, InteractionHandlerTypes } from "@sapphire/framework"
import { ButtonInteraction, Colors } from "discord.js"
import { TournamentStatus } from "../sequelize/Tournaments.js";
import { EmbedMessage, GetTournamentFromGuild, RemovePlayerFromTournament, TournamentDetailsEmbed } from "../helper-functions/index.js";
import { CommonMessages } from "../helper-functions/common-messages.js";


export class UnregisterButtonHandler extends InteractionHandler {
	public constructor(ctx: InteractionHandler.LoaderContext, options: InteractionHandler.Options) {
		super(ctx, { interactionHandlerType: InteractionHandlerTypes.Button });
	}

	public async run(interaction: ButtonInteraction<'cached'>, tournamentId: string) {
		const tournament = await GetTournamentFromGuild(interaction.guildId, +tournamentId)

		if (!tournament) return void await interaction.reply({
			ephemeral: true,
			embeds: [
				EmbedMessage({
					description: CommonMessages.GuildTournamentNotFound,
					color: Colors.Red
				})
			]
		})

		if (tournament.status === TournamentStatus.CLOSED || tournament.status === TournamentStatus.FINISHED) {
			return void await interaction.reply({
				ephemeral: true,
				embeds: [
					EmbedMessage({
						description: CommonMessages.TournamentNotLeaveable,
						color: Colors.Red
					})
				]
			})
		}

		if (!tournament.players.some(player => player.discordId === interaction.user.id)) {
			return void await interaction.reply({
				ephemeral: true,
				embeds: [
					EmbedMessage({
						description: CommonMessages.PlayerNotRegistered,
						color: Colors.Blue
					})
				]
			})
		}

		try {

			await RemovePlayerFromTournament(tournament, interaction.user.id)

			// Remove roles from member, if tournament has any
			if (tournament.add_roles.length > 0) {
				console.log(`[ACTION ON PLAYER] Quitando roles al jugador ${interaction.user.id}...`);
				await interaction.member.roles.remove(tournament.add_roles)
				console.log("[ACTION ON PLAYER] Los roles han sido quitados.");

			}

			void await interaction.reply({
				ephemeral: true,
				embeds: [
					EmbedMessage({
						description: '✅ Te has desinscrito de este torneo exitosamente!',
						color: Colors.Blue
					})
				]
			})

			return void await interaction.message.edit({
				embeds: [TournamentDetailsEmbed(tournament)]
			})

		} catch (e) {
			void await interaction.reply({
				content: 'Ocurrió un error con esta interacción.',
				ephemeral: true
			})
		}
	}

	public parse(interaction: ButtonInteraction) {
		// Only handle checkin interaction from buttons
		if (interaction.customId.startsWith('t-unregister-')) {
			return this.some(interaction.customId.split("-")[2]);
		}

		return this.none();
	}
}

