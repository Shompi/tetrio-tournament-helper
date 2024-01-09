import { InteractionHandler, InteractionHandlerTypes } from "@sapphire/framework"
import { ButtonInteraction, Colors } from "discord.js";
import { TournamentStatus } from "../sequelize/Tournaments.js";
import { PrettyMsg, GetTournamentFromGuild } from "../helper-functions/index.js";
import { CommonMessages } from "../helper-functions/common-messages.js";

export class CheckinButtonHandler extends InteractionHandler {
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

		if (tournament.status === TournamentStatus.FINISHED)
			return void await interaction.reply({
				ephemeral: true,
				embeds: [PrettyMsg({
					description: CommonMessages.Player.CheckInNotAllowed,
					color: Colors.Blue
				})]
			})

		// Check if the player is on the registered players list first
		if (!tournament.players.some(player => player.discordId === interaction.user.id))
			return void await interaction.reply({
				ephemeral: true,
				embeds: [PrettyMsg({
					description: CommonMessages.Player.NotRegistered,
					color: Colors.Blue
				})]
			})

		// Check if the player is already checked-in
		if (tournament.checked_in.includes(interaction.user.id))
			return void await interaction.reply({
				ephemeral: true,
				embeds: [PrettyMsg({
					description: CommonMessages.Player.AlreadyCheckedIn,
					color: Colors.Blue
				})],
			})

		// Inscribimos al user en la lista de checked in
		const checkedIn = tournament.checked_in ? Array.from(tournament.checked_in) : []

		checkedIn.push(interaction.user.id)
		tournament.checked_in = checkedIn
		await tournament.save()

		return void await interaction.reply({
			ephemeral: true,
			embeds: [
				PrettyMsg({
					description: "✅ ¡Has hecho Check-in exitosamente!",
					color: Colors.Green
				})
			]
		})
	}

	public parse(interaction: ButtonInteraction) {
		// Only handle checkin interaction from buttons
		if (interaction.customId.startsWith('checkin')) {
			return this.some(interaction.customId.split("-")[1]);
		}

		return this.none();
	}
}
