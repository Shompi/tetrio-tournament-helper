import { Subcommand } from "@sapphire/plugin-subcommands"
import { PlayerModel, Tournament } from "../sequelize/Tournaments.js"
import { TetrioRanksMap, TetrioUserData, TournamentDetailsEmbed } from "../helper-functions/index.js"
import { SearchTournamentByNameAutocomplete, SearchTournamentById } from "../helper-functions/index.js"
import { AsciiTable3 } from "ascii-table3"
import { AttachmentBuilder, Colors, EmbedBuilder, codeBlock } from "discord.js"

type OrderBy = "default" | "apm" | "pps" | "tr" | "rank" | null

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
				{
					name: "lista-jugadores",
					chatInputRun: "chatInputListaJugadores"
				}
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
				.addSubcommand(list =>
					list.setName('lista-jugadores')
						.setDescription('Obtén una lista con los jugadores inscritos en este torneo')
						.addStringOption(name =>
							name.setName('nombre-id')
								.setDescription("El nombre o la Id numérica del torneo")
								.setRequired(true)
								.setAutocomplete(true)
						)
						.addStringOption(order =>
							order.setName('ordenar-por')
								.setDescription('El tipo de ordenamiento de los jugadores en la tabla (SOLO TETRIO)')
								.setChoices(
									{
										name: 'Inscripción',
										value: "default",
									},
									{
										name: 'Rank (e.g: S, S+, SS, X)',
										value: 'rank',
									},
									{
										name: 'Tetra Rating',
										value: 'tr',
									},
									{
										name: 'Ataque Por Minuto (APM)',
										value: 'apm',
									},
									{
										name: 'Piezas Por Segundo (PPS)',
										value: 'pps',
									},
								)

						)
						.addStringOption(format =>
							format.setName('formato')
								.setChoices(
									{
										name: 'Embed',
										value: 'embed'
									},
									{
										name: 'ASCII',
										value: 'ascii',
									},
									{
										name: "CSV",
										value: "cvs",
									},
									{
										name: 'JSON',
										value: 'json',
									},
								)
								.setDescription('El formato en el que quieres exportar la lista de jugadores')
						)

				)
		}, { idHints: ["1179715303735832646"] })
	}

	public async chatInputDetalles(interaction: Subcommand.ChatInputCommandInteraction<'cached'>) {
		// Your code goes here
		const idTorneo = +interaction.options.getString('nombre-id', true)

		if (isNaN(idTorneo))
			return void await interaction.reply({ content: 'Debes ingresar la id numérica de un torneo o **usar una de las opciones del autocompletado**.' })

		const torneo = await SearchTournamentById(idTorneo)
		if (!torneo) return void await interaction.reply({ content: 'No se encontró ningun torneo en la base de datos con los datos ingresados.', ephemeral: true })

		return void await SendDetails(interaction, torneo)
	}

	public async chatInputListaJugadores(interaction: Subcommand.ChatInputCommandInteraction) {
		const idTorneo = +interaction.options.getString('nombre-id', true)

		if (isNaN(idTorneo))
			return void await interaction.reply({ content: 'Debes ingresar la id numérica de un torneo o **usar una de las opciones del autocompletado**.' })

		const torneo = await SearchTournamentById(idTorneo)
		if (!torneo) return void await interaction.reply({ content: 'No se encontró ningun torneo en la base de datos con los datos ingresados.', ephemeral: true })


		const format = interaction.options.getString('formato', false) ?? "ascii" // default ascii

		if (torneo.game !== "TETRIO") return void await interaction.reply({ content: 'El listado de jugadores para torneos que no son de tetrio se implementará prontamente.', ephemeral: true })
		// We basically need to skip all the code below if the tournament is not a TETRIO tournament

		if (format === 'ascii') SendTableASCII(interaction, torneo)

		if (format === 'embed') SendListOfPlayersEmbed(interaction, torneo)

		if (format === 'csv') void await interaction.reply({ content: 'Este formato aún no está implementado.', ephemeral: true })

		if (format === 'json') void await interaction.reply({ content: 'Este formato aún no está implementado.', ephemeral: true })

	}

	public async autocompleteRun(interaction: Subcommand.AutocompleteInteraction<'cached'>) {

		if (interaction.options.getFocused(true).name === 'nombre-id') {
			return void await SearchTournamentByNameAutocomplete(interaction)
		}
	}
}

async function SendDetails(interaction: Subcommand.ChatInputCommandInteraction, tournament: Tournament) {
	return void await interaction.reply({
		content: `Aquí está la información del torneo **${tournament.name}**`,
		embeds: [TournamentDetailsEmbed(tournament)]
	})
}

async function SendListOfPlayersEmbed(interaction: Subcommand.ChatInputCommandInteraction, tournament: Tournament) {
	void await interaction.deferReply()

	const { players } = tournament
	const orderBy = interaction.options.getString('ordenar-por', false) as OrderBy ?? 'default'

	const orderedPlayerList = await OrderPlayerListBy(players, orderBy)

	const table = new AsciiTable3()
		.setHeading("POS", "USERNAME", "RANK", "RATING")
		.setAlignCenter(1)
		.setAlignCenter(2)
		.setAlignCenter(3)

	let pos = 1
	for (const player of orderedPlayerList) {
		table.addRow(pos, player.data.user.username, player.data.user.league.rank.toUpperCase(), player.data.user.league.rating.toFixed(2))
		pos++
	}

	const playersEmbed = new EmbedBuilder()
		.setTitle(tournament.name)
		.setDescription(
			codeBlock(
				table.toString()
			)
		)

	return void await interaction.editReply({ content: 'Aquí está la lista de jugadores', embeds: [playersEmbed] })
}

async function SendTableASCII(interaction: Subcommand.ChatInputCommandInteraction, tournament: Tournament) {

	void await interaction.deferReply()

	const { players } = tournament
	const orderBy = interaction.options.getString('ordenar-por', false) as OrderBy ?? 'default'

	const orderedPlayerList = await OrderPlayerListBy(players, orderBy)

	const table = BuildTableFromPlayerList(tournament, orderedPlayerList)

	const TableFile = new AttachmentBuilder(Buffer.from(table.toString()))
		.setName('playersTable.txt')
		.setDescription(`Tabla de jugadores del torneo ${tournament.name}`)

	return void interaction.editReply({
		content: `Aquí está la lista de jugadores del torneo **${tournament.name}**`,
		files: [TableFile]
	})
}

function BuildTableFromPlayerList(tournament: Tournament, playerList: PlayerDataOrdered[]) {
	// Now we need to build the table

	// We need to check whether or not this is a TETRIO tournament so we can build different tables for other games.
	const table = new AsciiTable3(tournament.name)
		.setTitleAlignCenter()
		.setHeadingAlignCenter()
		.setHeading("POSICION", "DISCORD", "TETRIO ID", "PAIS", "RANK", "TR", "APM", "PPS")
		.setAlignCenter(1)
		.setAlignCenter(2)
		.setAlignCenter(3)
		.setAlignCenter(4)
		.setAlignCenter(5)
		.setAlignCenter(6)
		.setAlignCenter(7)
		.setAlignCenter(8)

	// Good old for loop

	for (let i = 0; i < playerList.length; i++) {
		table.addRow(
			i + 1, // Posicion en la lista
			playerList[i].discordId,
			playerList[i].data.user.username.toUpperCase(),
			playerList[i].data.user.country?.toUpperCase() ?? "OCULTO",
			playerList[i].data.user.league.rank.toUpperCase(),
			playerList[i].data.user.league.rating.toFixed(2),
			playerList[i].data.user.league.apm ?? "0.00",
			playerList[i].data.user.league.pps ?? "0.00",
		)
	}

	return table
}

interface PlayerDataOrdered {
	discordId: string,
	data: TetrioUserData
}

async function OrderPlayerListBy(playerIds: string[], orderBy: OrderBy): Promise<PlayerDataOrdered[]> {
	// We start by getting all the players we need from the database


	const PlayersArray: PlayerDataOrdered[] = []

	for (const id of playerIds) {
		const playerData = await PlayerModel.findByPk(id)

		if (!playerData) {
			console.log(`[DEBUG] Los datos del usuario ${id} no están en la base de datos PLAYER`)
			continue
		}

		PlayersArray.push({ discordId: id, data: playerData.data })
	}

	// At this point we should have a list of players
	if (orderBy === "rank") {

		// We need to remember that ranks are letters here.
		// Sort is INPLACE
		PlayersArray.sort((playerA, playerB) => {

			const rankA = TetrioRanksMap.get(playerA.data.user.league.rank)!.index
			const rankB = TetrioRanksMap.get(playerB.data.user.league.rank)!.index

			return rankB - rankA
		})
	}

	if (orderBy === 'tr') {
		PlayersArray.sort((playerA, playerB) => {
			const ratingA = playerA.data.user.league.rating
			const ratingB = playerB.data.user.league.rating

			return ratingB - ratingA
		})
	}

	if (orderBy === 'apm') {
		PlayersArray.sort((playerA, playerB) => {
			const apmA = playerA.data.user.league.apm ?? 0.00
			const apmB = playerB.data.user.league.apm ?? 0.00

			return apmB - apmA
		})
	}

	if (orderBy === 'pps') {
		PlayersArray.sort((playerA, playerB) => {
			const apmA = playerA.data.user.league.pps ?? 0.00
			const apmB = playerB.data.user.league.pps ?? 0.00

			return apmB - apmA
		})
	}



	return PlayersArray
}