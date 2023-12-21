import { Subcommand } from "@sapphire/plugin-subcommands"
import { RegisteredPlayer, Tournament, TournamentStatus } from "../sequelize/Tournaments.js";
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, Colors, codeBlock, ComponentType, EmbedBuilder, PermissionFlagsBits, ChannelType, GuildTextBasedChannel, ColorResolvable } from "discord.js";
import { BuildTableForChallonge, ClearTournamentPlayerList, FinishTournament, GetRolesToAddArray, GetTournamentFromGuild, IsTournamentEditable, OrderBy, SearchTournamentByNameAutocomplete, TetrioRanksArray, TournamentDetailsEmbed } from "../helper-functions/index.js";
import { AsciiTable3 } from "ascii-table3";
import { OrderPlayerListBy } from "../helper-functions/index.js";
import { BuildASCIITableAttachment } from "../helper-functions/index.js";


export class AdminCommands extends Subcommand {

	public constructor(context: Subcommand.LoaderContext, options: Subcommand.Options) {
		super(context, {
			...options,
			subcommands: [
				{
					name: 'anuncio',
					chatInputRun: 'chatInputAnnounce',
				},
				{
					name: 'eliminar-jugadores',
					chatInputRun: 'chatInputClearPlayerList'
				},
				{
					name: 'editar-torneo',
					chatInputRun: 'chatInputEditTournamentInfo'
				},
				{
					name: 'listar-jugadores',
					chatInputRun: 'chatInputListPlayers'
				}
			]
		});
	}


	public override registerApplicationCommands(registry: Subcommand.Registry) {
		registry.registerChatInputCommand((builder) => {
			builder.setName("admin")
				.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
				.setDMPermission(false)
				.setDescription('Varios comandos de utilidad para admins')
				// Announcement command
				.addSubcommand(announce =>
					announce.setName('anuncio')
						.setDescription('Crea y envia un mensaje dentro de un embed a un canal de texto.')
						.addChannelOption(channel =>
							channel.setName('canal')
								.setDescription('Canal al que quieres enviar este anuncio')
								.setRequired(true)
								.addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
						)
						.addStringOption(description =>
							description.setName('descripcion')
								.setDescription('Una detallada descripción de tu anuncio, hasta 1500 caracteres.')
								.setRequired(true)
						)
						.addStringOption(titulo =>
							titulo.setName('titulo')
								.setDescription('El titulo de este anuncio')
								.setRequired(false)
						)
						.addStringOption(color =>
							color.setName('color')
								.setDescription('El color que quieres que tenga el embed (barra lateral izquierda)')
								.addChoices(
									{ name: "Amarillo", value: "Yellow" },
									{ name: "Azul", value: "Blue" },
									{ name: "Blanco", value: "White" },
									{ name: "Dorado", value: "Gold" },
									{ name: "Fucsia", value: "Fuchsia" },
									{ name: "Morado", value: "Purple" },
									{ name: "Naranja", value: "Orange" },
									{ name: "Rojo", value: "Red" },
									{ name: "Verde", value: "Green" },
									{ name: "Verde Oscuro", value: "DarkGreen" },
									{ name: "Random", value: "Random" },
								)
						)
						.addStringOption(imagen =>
							imagen.setName('imagen')
								.setDescription('Si quieres adjuntar una imagen en el embedido, escribe la URL aqui')
								.setRequired(false)
						)
						.addStringOption(thumbnail =>
							thumbnail.setName('miniatura')
								.setDescription('URL de la imagen miniatura del embed')
								.setRequired(false)
						)
						.addStringOption(footer =>
							footer.setName('pie')
								.setDescription('El pié de página de este anuncio')
								.setRequired(false)
						)
						.addMentionableOption(mencion =>
							mencion.setName('mencion1')
								.setDescription('Rol o Usuario que quieres mencionar')
								.setRequired(false)
						)
						.addMentionableOption(mencion =>
							mencion.setName('mencion2')
								.setDescription('Rol o Usuario que quieres mencionar')
								.setRequired(false)
						)
						.addMentionableOption(mencion =>
							mencion.setName('mencion3')
								.setDescription('Rol o Usuario que quieres mencionar')
								.setRequired(false)
						)
				)
				.addSubcommand(clearPlayers =>
					clearPlayers.setName('eliminar-jugadores')
						.setDescription('Elimina a todos los jugadores inscritos en un torneo.')
						.addStringOption(name =>
							name.setName('nombre-id')
								.setDescription('El nombre o la Id numérica del torneo')
								.setAutocomplete(true)
								.setMaxLength(255)
						)
				)
				.addSubcommand(editTournament =>
					editTournament.setName('editar-torneo')
						.setDescription('Edita la información de un torneo que ya está creado.')
						.addStringOption(name =>
							name.setName('nombre-id')
								.setDescription('El nombre o la Id numérica del torneo')
								.setAutocomplete(true)
								.setMaxLength(255)
						)
						.addStringOption(name =>
							name.setName('nombre')
								.setDescription('El nuevo nombre del torneo')
								.setMaxLength(255)
						)
						.addStringOption(description =>
							description.setName('descripcion')
								.setDescription('La nueva descripción del torneo')
								.setMaxLength(1000)
						)
						.addStringOption(rankCap =>
							rankCap.setName('rank_cap')
								.setDescription('El rank máximo que pueden tener los jugadores (SOLO TETRIO)')
								.setDescriptionLocalizations({
									"en-US": "The highest rank allowed to join this tournament (TETRIO ONLY)"
								})
								.addChoices(...TetrioRanksArray.map(rank => ({ name: rank.toUpperCase(), value: rank })))
						)
						.addIntegerOption(trCap =>
							trCap.setName('tr_cap')
								.setDescription('El cap de TR para este torneo (1 - 25000) (SOLO TETRIO)')
								.setMinValue(1)
								.setMaxValue(25000)
						)
						.addIntegerOption(maxPlayers =>
							maxPlayers.setName('maximo-jugadores')
								.setNameLocalizations({
									"en-US": 'max-players'
								})
								.setDescription('Máximo de jugadores que pueden inscribirse en este torneo')
								.setDescriptionLocalizations({
									"en-US": "Maximum number of players that can join this tournament"
								})
						)
						.addRoleOption(role =>
							role.setName('role-1')
								.setDescription('Rol que quieres añadir a los miembros que se unan a este torneo')
						)
						.addRoleOption(role =>
							role.setName('role-2')
								.setDescription('Rol que quieres añadir a los miembros que se unan a este torneo')
						)
						.addRoleOption(role =>
							role.setName('role-3')
								.setDescription('Rol que quieres añadir a los miembros que se unan a este torneo')
						)
				)
				.addSubcommand(finishTournament =>
					finishTournament.setName('finalizar-torneo')
						.setDescription('Marca un torneo como FINALIZADO')
						.addStringOption(name =>
							name.setName('nombre-id')
								.setDescription("El nombre o la Id numérica del torneo")
								.setRequired(true)
								.setAutocomplete(true)
						)
						.addUserOption(winner =>
							winner.setName('ganador')
								.setDescription('El usuario que ganó el torneo')
						)
				)
				.addSubcommand(list =>
					list.setName('listar-jugadores')
						.setDescription('Obtén una lista con los jugadores inscritos en un torneo')
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
										name: 'ASCII',
										value: 'ascii',
									},
									{
										name: 'Embed',
										value: 'embed'
									},
									{
										name: 'Challonge Friendly',
										value: 'challonge'
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
						.addBooleanOption(checkedin =>
							checkedin.setName('checked-in')
								.setDescription('Filtrar jugadores que hayan hecho Check-in en el torneo')
						)

				)
		}, { idHints: ["1183537285761859665"] })
	}

	public async chatInputAnnounce(interaction: Subcommand.ChatInputCommandInteraction<'cached'>) {

		const options = {
			channel: interaction.options.getChannel('canal', true) as GuildTextBasedChannel,
			description: interaction.options.getString('descripcion')?.replace("\\n", "\n"),
			title: interaction.options.getString('titulo', false),
			color: interaction.options.getString('color', false),
			imageURL: interaction.options.getString('imagen', false),
			thumbnailURL: interaction.options.getString('miniatura', false),
			footer: interaction.options.getString('pie', false),
			mention1: interaction.options.getMentionable('mencion1', false) ?? " ",
			mention2: interaction.options.getMentionable('mencion2', false) ?? " ",
			mention3: interaction.options.getMentionable('mencion3', false) ?? " ",
		}

		if (!options.channel.isTextBased())
			return await interaction.reply({ content: 'El canal que has ingresado no es un canal de texto, por favor ejecuta este comando nuevamente y asegúrate de usar un canal de texto.', ephemeral: true });

		if (interaction.guild.members.me?.permissionsIn(options.channel).has("SendMessages")) {

			if (options.description && options.description.length >= 1750)
				return await interaction.reply({ content: 'Lo siento, la cantidad de caracteres que has ingresado en la descripción excede el máximo establecido (1500+).', ephemeral: true })

			if (!(/^.*\.(jpg|gif|png|jpeg|webp)$/i.test(options.imageURL ?? "")))
				options.imageURL = null;

			if (!(/^.*\.(jpg|gif|png|jpeg|webp)$/i.test(options.thumbnailURL ?? "")))
				options.thumbnailURL = null;

			const embed = new EmbedBuilder()
				.setAuthor({
					name: `Anuncio de ${interaction.member.displayName}`,
					iconURL: interaction.member.displayAvatarURL({ size: 64 }) ?? interaction.user.displayAvatarURL({ size: 64 }),
				})
				.setTitle(options.title)
				.setDescription(options.description ?? null)
				.setColor(options.color as ColorResolvable ?? "Random")
				.setFooter(options.footer ? { text: options.footer } : null)
				.setImage(options.imageURL)
				.setThumbnail(options.thumbnailURL)

			// eslint-disable-next-line @typescript-eslint/restrict-template-expressions
			const success = await options.channel.send({ embeds: [embed], content: `${options.mention1} ${options.mention2} ${options.mention3}` }).catch(console.error);

			if (!success)
				return await interaction.reply({ content: 'Ocurrió un error al intentar enviar el anuncio, revisa mis permisos dentro del canal y asegurate de que pueda enviar mensajes.', ephemeral: true });

			return await interaction.reply({ content: 'El anunció fue enviado con éxito.', ephemeral: true });

		}
	}

	public async chatInputClearPlayerList(interaction: Subcommand.ChatInputCommandInteraction<'cached'>) {
		// Your code goes here

		const idTorneo = +interaction.options.getString('nombre-id', true)
		if (isNaN(idTorneo))
			return void await interaction.reply({ content: 'La id ingresada no es una id válida de un torneo. Recuerda usar una de las opciones del autocompletado o directamente usar la id del torneo.', ephemeral: true })

		const tournament = await GetTournamentFromGuild(interaction.guildId, idTorneo)

		if (!tournament)
			return void await interaction.reply({ content: 'El torneo no pertenece a este servidor o la id es incorrecta.', ephemeral: true })

		const ConfirmButton = new ButtonBuilder()
			.setCustomId('pl-eliminar')
			.setLabel('Confirmar')
			.setStyle(ButtonStyle.Danger)

		const ConfirmRow = new ActionRowBuilder<ButtonBuilder>()
			.setComponents(ConfirmButton)

		const tournamentInfo = new EmbedBuilder()
			.setColor(Colors.Blue)
			.setDescription(`**Torneo**: ${tournament.name}\n**Descripción**: ${tournament.description}\n**Jugadores**: ${tournament.players.length}`)

		const initialReply = await interaction.reply({
			content: `¿Estás seguro de que quieres **eliminar a todos los jugadores** de este torneo?\n`,
			embeds: [tournamentInfo],
			components: [ConfirmRow],
		})

		const Action = await initialReply.awaitMessageComponent({
			componentType: ComponentType.Button,
			time: 60_000,
			filter: (bInteraction) => {
				if (bInteraction.user.id !== interaction.user.id) {
					bInteraction.reply({ content: 'Esta interacción no es para ti.', ephemeral: true })
					return false
				}

				return true
			}
		}).catch(_ => null)

		if (!Action)
			return void await interaction.editReply({ components: [], content: "La interacción ha finalizado." })

		await ClearTournamentPlayerList(tournament)

		return void await Action.update({
			content: `✅ ¡La lista de jugadores del torneo **${tournament.name}** ha sido borrada!`,
			embeds: [],
			components: []
		})
	}

	/** This is essentially an UPDATE request */
	public async chatInputEditTournamentInfo(interaction: Subcommand.ChatInputCommandInteraction<'cached'>) {

		const tournamentId = +interaction.options.getString('nombre-id', true)

		if (isNaN(tournamentId))
			return void await interaction.reply({
				content: 'La id del torneo debe ser una id numérica o una de las opciones del autocompletado.',
				ephemeral: true
			})


		// Try to get the tournament from this guild
		const tournament = await GetTournamentFromGuild(interaction.guildId, tournamentId)

		if (!tournament) {
			return void await interaction.reply({
				content: 'Esta guild no tiene ningún torneo con esa id.',
				ephemeral: true
			})
		}

		if (!IsTournamentEditable(tournament))
			return void await interaction.reply({
				content: 'No puedes editar la información de este torneo por que está marcado como **TERMINADO**',
				ephemeral: true
			})

		const options = {
			name: interaction.options.getString('nombre', false),
			description: interaction.options.getString('descripcion', false),
			rankCap: interaction.options.getString('rank_cap', false),
			trCap: interaction.options.getInteger('tr_cap', false),
			maxPlayers: interaction.options.getInteger('maximo-jugadores', false)
		}

		if (options.name) tournament.name = options.name
		if (options.description) tournament.description = options.description

		if (options.rankCap) {
			tournament.rank_cap = options.rankCap
			tournament.is_rank_capped = true
		}

		if (options.trCap) {
			tournament.tr_cap = options.trCap
			tournament.is_tr_capped = true
		}

		if (options.maxPlayers) tournament.max_players = options.maxPlayers

		const newRoles = GetRolesToAddArray(interaction)

		if (newRoles.length > 0) {
			// We are just gonna replace the old roles with the new ones
			tournament.add_roles = newRoles
		}


		// Update the tournament in the database
		await tournament.save()

		return void await interaction.reply({
			content: `¡El torneo **${tournament.name}** (id ${tournament.id}) ha sido editado con éxito!`,
			ephemeral: false
		})
	}

	public async chatInputFinishTournament(interaction: Subcommand.ChatInputCommandInteraction<'cached'>) {
		const options = {
			winner: interaction.options.getUser('ganador', false),
			idTorneo: +interaction.options.getString('nombre-id', true)
		}

		if (isNaN(options.idTorneo))
			return void await interaction.reply({ content: 'La id debe ser un numero o una de las opciones del autocompletado.', ephemeral: true })

		const tournament = await GetTournamentFromGuild(interaction.guildId, options.idTorneo)
		if (!tournament)
			return void await interaction.reply({ content: 'No existe un torneo con esa id en esta guild.', ephemeral: true })

		if (tournament.status === TournamentStatus.FINISHED)
			return void await interaction.reply({ content: 'Este torneo ya está marcado como finalizado.', ephemeral: true })

		// Prompt the user to confirm this action

		const AcceptButton = new ButtonBuilder()
			.setCustomId('accept')
			.setLabel('Confirmar')
			.setStyle(ButtonStyle.Success)
			.setEmoji("✅")

		const CancelButton = new ButtonBuilder()
			.setCustomId('cancel')
			.setLabel('Cancelar')
			.setStyle(ButtonStyle.Secondary)

		const SelectionRow = new ActionRowBuilder<ButtonBuilder>()
			.setComponents(AcceptButton, CancelButton)

		const tournamentInfo = TournamentDetailsEmbed(tournament)

		const initialReply = await interaction.reply({
			content: '¿Estás seguro que quieres marcar este torneo como **FINALIZADO**?\nEsta acción hará que el torneo no sea modificable en el futuro.',
			embeds: [tournamentInfo],
			components: [SelectionRow],
			ephemeral: true
		})

		const action = await initialReply.awaitMessageComponent({
			componentType: ComponentType.Button,
			time: 60_000
		}).catch(() => null)

		if (!action || action.customId === 'cancel')
			return void await interaction.editReply({ content: "La interacción ha sido cancelada.", embeds: [], components: [] })

		void await FinishTournament(tournament, options.winner?.id)

		return void await action.update({
			content: `El torneo **${tournament.name}** ha sido marcado como **FINALIZADO** exitósamente.`,
			embeds: [],
			components: [],
		})
	}

	public async chatInputListPlayers(interaction: Subcommand.ChatInputCommandInteraction<'cached'>) {
		const idTorneo = +interaction.options.getString('nombre-id', true)

		if (isNaN(idTorneo))
			return void await interaction.reply({ content: 'Debes ingresar la id numérica de un torneo o **usar una de las opciones del autocompletado**.' })

		const tournament = await GetTournamentFromGuild(interaction.guildId, idTorneo)
		if (!tournament) return void await interaction.reply({ content: 'Este torneo no existe.', ephemeral: true })

		const format = interaction.options.getString('formato', false) ?? "embed" // default embed
		const orderBy = (interaction.options.getString('ordenar-por', false) ?? "default") as OrderBy
		const filterCheckedIn = interaction.options.getBoolean('checked_in', false)

		if (tournament.game !== "TETRIO") return void await interaction.reply({ content: 'El listado de jugadores para torneos que no son de tetrio se implementará prontamente.', ephemeral: true })
		// We basically need to skip all the code below if the tournament is not a TETRIO tournament

		const orderedPlayerList = await OrderPlayerListBy(tournament, orderBy, filterCheckedIn)

		if (format === 'ascii') {
			const attachment = BuildASCIITableAttachment(tournament, orderedPlayerList)

			// Send the attachment
			return void await interaction.reply({
				content: 'Aquí está la lista de jugadores',
				files: [attachment]
			})
		}

		if (format === 'challonge') {
			const players = await BuildTableForChallonge(tournament, orderedPlayerList)

			return void await interaction.reply({
				content: `¡Aquí está la lista de jugadores del torneo **${tournament.name}**!`,
				embeds: [players]
			})
		}

		if (format === 'embed') {
			const players = BuildEmbedPlayerList(tournament, orderedPlayerList)

			return void await interaction.reply({
				content: `¡Aquí está la lista de jugadores del torneo **${tournament.name}**!`,
				embeds: [players]
			})
		}


		if (format === 'csv') void await interaction.reply({ content: 'Este formato aún no está implementado.', ephemeral: true })
		if (format === 'json') void await interaction.reply({ content: 'Este formato aún no está implementado.', ephemeral: true })
	}

	public async autocompleteRun(interaction: Subcommand.AutocompleteInteraction<'cached'>) {

		if (interaction.options.getFocused(true).name === 'nombre-id') {
			return void await SearchTournamentByNameAutocomplete(interaction)
		}
	}
}


function BuildEmbedPlayerList(tournament: Tournament, players: RegisteredPlayer[]) {

	const table = new AsciiTable3()
		.setHeading("POS", "USERNAME", "RANK", "RATING")
		.setAlignCenter(1)
		.setAlignCenter(2)
		.setAlignCenter(3)

	let pos = 1

	for (const player of players) {
		table.addRow(pos, player.data!.username, player.data!.league.rank.toUpperCase(), player.data!.league.rating.toFixed(2))
		pos++
	}

	return new EmbedBuilder()
		.setTitle(tournament.name)
		.setDescription(
			codeBlock(
				table.toString()
			)
		)
}