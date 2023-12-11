import { Command } from "@sapphire/framework"
import { SearchTournamentById, SearchTournamentByNameAutocomplete } from "../helper-functions/index.js";
import { PermissionFlagsBits } from "discord.js";
import { TournamentStatus } from "../sequelize/Tournaments.js";


export class CloseRegistrations extends Command {


	public constructor(context: Command.LoaderContext, options: Command.Options) {
		super(context, { ...options });
	}


	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand((builder) => {
			builder.setName("close-registration")
				.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
				.setDMPermission(false)
				.setDescription('Cierra las inscripciones de un torneo')
				.addStringOption(nameTorneo =>
					nameTorneo.setName('nombre-id')
						.setDescription('Nombre o id del torneo que quieres cerrar')
						.setAutocomplete(true)
						.setMaxLength(255)
				)

		}, { idHints: ["1181882581931786280"] })


	}
	public async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		// Your code goes here
		const tournamentId = +interaction.options.getString('nombre-id', true)

		if (isNaN(tournamentId))
			return void await interaction.reply({ content: 'Debes ingresar la id numérica de un torneo o **usar una de las opciones del autocompletado**.' })

		const torneo = await SearchTournamentById(tournamentId)
		if (!torneo) return void await interaction.reply({ content: "El torneo no existe.", ephemeral: true })

		await torneo.update({
			status: TournamentStatus.CLOSED
		})

		return void await interaction.reply({
			content: `Las inscripciones al torneo **${torneo.name}** han sido **cerradas**.`
		})
	}

	public async autocompleteRun(interaction: Command.AutocompleteInteraction) {
		if (interaction.options.getFocused(true).name === 'nombre-id') {
			return void await SearchTournamentByNameAutocomplete(interaction)
		}
	}
}