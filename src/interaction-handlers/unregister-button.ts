import { InteractionHandler, InteractionHandlerTypes } from "@sapphire/framework"
import { ButtonInteraction } from "discord.js"
import { TournamentModel, TournamentStatus } from "../sequelize/index.js";
import { RemovePlayerFromTournament, TournamentDetailsEmbed } from "../helper-functions/index.js";


export class ParseExampleInteractionHandler extends InteractionHandler {
	public constructor(ctx: InteractionHandler.LoaderContext, options: InteractionHandler.Options) {
		super(ctx, { interactionHandlerType: InteractionHandlerTypes.Button });
	}

	public async run(interaction: ButtonInteraction, tournamentId: string) {
		const tournament = await TournamentModel.findOne({ where: { id: +tournamentId } })

		if (!tournament) return void await interaction.reply({ content: 'Este torneo no existe.', ephemeral: true })

		if (tournament.status === TournamentStatus.CLOSED) return void await interaction.reply({ content: 'No te puedes desinscribir de este torneo por que ya está cerrado.', ephemeral: true })

		if (!tournament.players.includes(interaction.user.id))
			return void await interaction.reply({ content: 'No estás inscrita/o en este torneo.', ephemeral: true })
		try {
			await RemovePlayerFromTournament(tournament, interaction.user.id)

			void await interaction.message.edit({
				embeds: [TournamentDetailsEmbed(tournament)]
			})

			return void await interaction.reply({
				content: 'Te has desinscrito de este torneo exitosamente!',
				ephemeral: true
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

