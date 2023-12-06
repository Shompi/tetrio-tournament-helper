import { Command } from "@sapphire/framework"
import { SearchTournamentById, SearchTournamentByNameAutocomplete } from "../helper-functions/index.js";
import { PermissionFlagsBits } from "discord.js";
import { TournamentStatus } from "../sequelize/index.js";


export class CloseRegistrations extends Command {


	public constructor(context: Command.LoaderContext, options: Command.Options) {
		super(context, { ...options });
	}


	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand((builder) => {
			builder.setName("close-registration")
				.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
				.setDescription('Cierra las inscripciones de un torneo')
				.addIntegerOption(idTorneo =>
					idTorneo.setName('id-torneo')
						.setDescription('La id del torneo que quieres cerrar')
						.setMinValue(1)
						.setMaxValue(100_000)
				)
				.addStringOption(nameTorneo =>
					nameTorneo.setName('nombre-torneo')
						.setDescription('Nombre del torneo que quieres cerrar')
						.setAutocomplete(true)
						.setMaxLength(255)
				)

		}, { idHints: ["1181882581931786280"] })


	}
	public async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		// Your code goes here
		const tournamentId = interaction.options.getInteger('id-torneo', false) ?? interaction.options.getString('nombre-torneo', false)

		if (!tournamentId) return void await interaction.reply({ content: 'Debes ingresar al menos una opción para usar este comando.' })

		const torneo = await SearchTournamentById(+tournamentId)
		if (!torneo) return void await interaction.reply({ content: "El torneo no existe.", ephemeral: true })

		await torneo.update({
			status: TournamentStatus.CLOSED
		})

		return void await interaction.reply({
			content: `Las inscripciones al torneo **${torneo.name}** han sido **cerradas**.`
		})
	}

	public async autocompleteRun(interaction: Command.AutocompleteInteraction) {
		if (interaction.options.getFocused(true).name === 'nombre-torneo') {
			return void await SearchTournamentByNameAutocomplete(interaction)
		}
	}
}