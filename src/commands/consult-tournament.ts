import { Subcommand } from "@sapphire/plugin-subcommands"
import { Tournament, TournamentModel } from "../sequelize/index.js"
import { TournamentDetailsEmbed } from "../helper-functions/index.js"

export class TournamentCommands extends Subcommand {

	public constructor(context: Subcommand.LoaderContext, options: Subcommand.Options) {
		super(context, {
			...options,
			name: 'torneo',
			subcommands: [
				{
					name: "detalles",
					chatInputRun: "chatInputDetalles"
				},
			]
		})
	}


	public override registerApplicationCommands(registry: Subcommand.Registry) {
		registry.registerChatInputCommand((builder) => {
			builder.setName("torneo")
				.setDescription('Varios comandos relacionados con los torneos')
				.setDMPermission(false)
				.addSubcommand(details =>
					details.setName('detalles')
						.setDescription('Ve la información de un torneo')
						.addIntegerOption(id =>
							id.setName('id-torneo')
								.setDescription('La id numérica del torneo')
								.setMaxValue(100000)
								.setMinValue(1)
						)
						.addStringOption(name =>
							name.setName('nombre-torneo')
								.setDescription('El nombre del torneo')
								.setAutocomplete(true)
								.setMaxLength(255)
						)
				)
		}, { idHints: ["1179715303735832646"] })


	}
	public async chatInputDetalles(interaction: Subcommand.ChatInputCommandInteraction) {
		// Your code goes here

		const idTorneo = interaction.options.getInteger('id-torneo') ?? interaction.options.getString('nombre-torneo');

		if (!idTorneo) return void await interaction.reply({ content: "Debes usar este comando con almenos un argumento, la id numérica o el nombre del torneo.\nLa id tiene prioridad por sobre el nombre.\nSi intentaste buscar un torneo por su nombre, asegurate de esperar a que se muestren las opciones en la opción `nombre-torneo` y escogerla desde las opciones, ya que la búsqueda se hará con el nombre completo del torneo.", ephemeral: true })

		const torneo = await SearchTournament(+idTorneo)

		if (!torneo) return void await interaction.reply({ content: 'No se encontró ningun torneo en la base de datos con los datos ingresados.', ephemeral: true })

		return void await SendDetails(interaction, torneo);

	} // End ChatInputRun

	public async autocompleteRun(interaction: Subcommand.AutocompleteInteraction) {

		const subcommand = interaction.options.getSubcommand()

		if (subcommand === 'detalles') return void await detallesAutocomplete(interaction)
	}
}

async function detallesAutocomplete(interaction: Subcommand.AutocompleteInteraction) {
	const focusedOption = interaction.options.getFocused(true)

	if (focusedOption.name === 'nombre-torneo') {
		/** This should be okay for now, since we will probably not have too many tournaments stored */
		const torneos = await TournamentModel.findAll()

		return void await interaction.respond(
			torneos.filter(torneo => torneo.name.toLowerCase().includes(
				focusedOption.value.toLowerCase()
			)).map(torneo => ({ name: torneo.name, value: torneo.id.toString() }))
		)
	}

}

async function SearchTournament(id: number) {
	return await TournamentModel.findOne({ where: { id } })
}

async function SendDetails(interaction: Subcommand.ChatInputCommandInteraction, torneo: Tournament) {
	return void await interaction.reply({
		content: `Aquí está la información del torneo **${torneo.name}**`,
		embeds: [TournamentDetailsEmbed(torneo)]
	})
}