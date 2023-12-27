import { Subcommand } from "@sapphire/plugin-subcommands"
import { TournamentDetailsEmbed } from "../helper-functions/index.js"
import { SearchTournamentByNameAutocomplete, SearchTournamentById } from "../helper-functions/index.js"

export class TournamentCommands extends Subcommand {

	public constructor(context: Subcommand.LoaderContext, options: Subcommand.Options) {
		super(context, {
			...options,
			name: 'torneo',
			subcommands: [
				{
					name: "general",
					chatInputRun: "chatInputDetalles"
				},
			]
		})
	}


	public override registerApplicationCommands(registry: Subcommand.Registry) {
		registry.registerChatInputCommand((builder) => {
			builder.setName("info-torneo")
				.setDescription('Varios comandos relacionados con los torneos')
				.setDMPermission(false)
				.addSubcommand(details =>
					details.setName('general')
						.setDescription('Ve la información de un torneo')
						.addStringOption(name =>
							name.setName('nombre-id')
								.setDescription('El nombre o la Id numérica del torneo')
								.setAutocomplete(true)
								.setMaxLength(255)
						)
				)

		}, { idHints: ["1179715303735832646"] })
	}

	public async chatInputDetalles(interaction: Subcommand.ChatInputCommandInteraction<'cached'>) {
		// Your code goes here
		const idTorneo = +interaction.options.getString('nombre-id', true)

		const tournament = await SearchTournamentById(idTorneo)
		if (!tournament) return void await interaction.reply({ content: 'No se encontró ningun torneo en la base de datos con los datos ingresados.', ephemeral: true })

		return void await interaction.reply({
			content: `Aquí está la información del torneo **${tournament.name}**`,
			embeds: [TournamentDetailsEmbed(tournament)],
			ephemeral: true
		})
	}


	public async autocompleteRun(interaction: Subcommand.AutocompleteInteraction<'cached'>) {

		if (interaction.options.getFocused(true).name === 'nombre-id') {
			return void await SearchTournamentByNameAutocomplete(interaction)
		}
	}
}