import { InteractionHandler, InteractionHandlerTypes } from "@sapphire/framework"
import { ButtonInteraction } from "discord.js";
import { TournamentModel, TournamentStatus } from "../sequelize/Tournaments.js";

export class ParseExampleInteractionHandler extends InteractionHandler {
	public constructor(ctx: InteractionHandler.LoaderContext, options: InteractionHandler.Options) {
		super(ctx, { interactionHandlerType: InteractionHandlerTypes.Button });
	}

	public async run(interaction: ButtonInteraction<'cached'>, tournamentId: string) {
		const tournament = await TournamentModel.findOne({ where: { id: +tournamentId } })

		if (!tournament) return void await interaction.reply({ content: 'Este torneo no existe.', ephemeral: true })

		if (tournament.status === TournamentStatus.FINISHED)
			return void await interaction.reply({ content: 'No puedes hacer Check-in en este torneo por que ya está finalizado.', ephemeral: true })

		if (!tournament.players.includes(interaction.user.id))
			return void await interaction.reply({ content: 'No puedes hacer Check-in por que no estás inscrito en este torneo.', ephemeral: true })

		// Inscribimos al user en la lista de checked in
		tournament.checked_in.push(interaction.user.id)
		await tournament.save()

		return void await interaction.reply({
			content: '✅ ¡Has hecho check-in exitosamente!',
			ephemeral: true
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
