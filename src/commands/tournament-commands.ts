import { Subcommand } from "@sapphire/plugin-subcommands"
import { ActionRowBuilder, AttachmentBuilder, ButtonBuilder, ButtonStyle, ChannelType, Colors, ComponentType, EmbedBuilder, GuildMember, GuildTextBasedChannel, PermissionFlagsBits, PermissionsBitField, Snowflake, TextChannel } from "discord.js";
import { BuildASCIITableAttachment, BuildCSVTableAttachment, BuildEmbedPlayerList, BuildJSONAttachment, BuildTableForChallonge, ClearTournamentPlayerList, EmbedMessage, FinishTournament, GameName, GetRolesToAddArray, GetTournamentFromGuild, IsTournamentEditable, OrderBy, OrderPlayerListBy, SearchTournamentByNameAutocomplete, TetrioRanksArray, TournamentDetailsEmbed } from "../helper-functions/index.js";
import { CommonMessages } from "../helper-functions/common-messages.js";
import { TournamentModel, TournamentStatus } from "../sequelize/Tournaments.js";
import { setTimeout } from "node:timers/promises"

export class TournamentCommands extends Subcommand {

	public constructor(context: Subcommand.LoaderContext, options: Subcommand.Options) {
		super(context, {
			...options,
			subcommands: [
				{
					name: 'abrir-inscripciones',
					chatInputRun: 'chatInputOpenRegistration'
				},
				{
					name: 'comenzar-checkin',
					chatInputRun: 'chatInputBeginCheckin'
				},
				{
					name: 'crear',
					chatInputRun: 'chatInputCreateTournament'
				},
				{
					name: 'editar',
					chatInputRun: 'chatInputEditTournamentInfo'
				},
				{
					name: 'eliminar-jugadores',
					chatInputRun: 'chatInputClearPlayerList'
				},
				{
					name: 'finalizar',
					chatInputRun: "chatInputFinishTournament"
				},
				{
					name: 'listar-jugadores',
					chatInputRun: 'chatInputListPlayers'
				},
				{
					name: 'mencionar-jugadores',
					chatInputRun: "chatInputMentionPlayers"
				},
				{
					name: 're-add-roles',
					chatInputRun: 'chatInputReAddRoles'
				},
			]
		});
	}


	public override registerApplicationCommands(registry: Subcommand.Registry) {
		registry.registerChatInputCommand((builder) => {
			builder.setName("tournament")
				.setDMPermission(false)
				.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
				.setDescription('Comandos especificos de torneos')
				.addSubcommand(beginRegistration =>
					beginRegistration.setName("abrir-inscripciones")
						.setDescription("Abre las inscripciones para un torneo")
						.addStringOption(id =>
							id.setName('nombre-id')
								.setDescription('La id numérica o el nombre del torneo que quieres abrir las inscripciones')
								.setRequired(true)
								.setAutocomplete(true)
						)
						.addChannelOption(channel =>
							channel.setName('canal')
								.setDescription("Canal en el cual los usuarios podran iniciar el proceso de registro")
								.setRequired(true)
								.addChannelTypes(ChannelType.GuildText)
						)
						.addStringOption(message =>
							message.setName('mensaje')
								.setDescription('Mensaje customizado para enviar junto con este mensaje')
								.setMaxLength(1000)
						)
						.addAttachmentOption(banner =>
							banner.setName('tournament-banner')
								.setDescription('Imagen o banner del torneo')
						)
				)
				.addSubcommand((beginCheckin) =>
					beginCheckin.setName("comenzar-checkin")
						.setDescription("Abre el proceso de Check-in para un torneo")
						.addStringOption(tournamentId =>
							tournamentId.setName('nombre-id')
								.setDescription('La id del torneo o una de las opciones del autocompletado')
								.setRequired(true)
								.setAutocomplete(true)
						)
						.addChannelOption(channel =>
							channel.setName('canal')
								.setDescription('Canal en el cual se abrirá el Thread para iniciar el proceso de check-in')
								.setRequired(true)
								.addChannelTypes(ChannelType.GuildText)
						)
				)
				.addSubcommand(create =>
					create.setName("crear")
						.setNameLocalizations({
							"en-US": "create"
						})
						.setDescription("Abre las inscripciones para un torneo")
						.setDescriptionLocalizations({
							"en-US": "Create a new tournament"
						})
						.addStringOption(name =>
							name.setName('nombre')
								.setNameLocalizations({
									"en-US": "name",
								})
								.setDescription('Nombre del torneo')
								.setDescriptionLocalizations({
									"en-US": "The name of the tournament"
								})
								.setRequired(true)
						)
						.addStringOption(game =>
							game.setName('juego')
								.setNameLocalizations({
									"en-US": "game"
								})
								.setDescription("El juego que se usará en este torneo")
								.setDescriptionLocalizations({
									"en-US": "The game that will be played in this tournament"
								})
								.setChoices(
									{
										name: "TETRIO",
										value: "TETRIO",
									},
									{
										name: "Tetris Effect: Connected",
										value: "Tetris Effect: Connected",
									},
									{
										name: "Puyo Puyo Tetris",
										value: "Puyo Puyo Tetris"
									},
									{
										name: "Puyo Puyo Tetris 2",
										value: "Puyo Puyo Tetris 2"
									}
								)
								.setRequired(true)
						)
						.addStringOption(description =>
							description.setName('descripcion')
								.setDescription('La descripción de este torneo (Máximo 2000 caracteres)')
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
						.addStringOption(countryLock =>
							countryLock.setName('pais')
								.setDescription('El pais al cual está cerrado este torneo (ej: CL, AR, US) (TETRIO ONLY)')
								.setMaxLength(2)
						)
						/** TODO: Add maximum and minimum values */
						.addIntegerOption(maxPlayers =>
							maxPlayers.setName('maximo-jugadores')
								.setNameLocalizations({
									"en-US": 'max-players'
								})
								.setDescription('Máximo de jugadores que pueden inscribirse en este torneo')
								.setDescriptionLocalizations({
									"en-US": "Maximum number of players that can join this tournament"
								})
								.setMinValue(8)
								.setMaxValue(256)
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
					editTournament.setName('editar')
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
					finishTournament.setName('finalizar')
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
										value: "csv",
									},
									{
										name: 'JSON',
										value: 'json',
									},
								)
								.setDescription('El formato en el que quieres exportar la lista de jugadores')
						)
						.addStringOption(order =>
							order.setName('ordenar-por')
								.setDescription('El tipo de ordenamiento de los jugadores en la tabla (SOLO TETRIO)')
								.setChoices(
									{
										name: 'Tetra Rating',
										value: 'rating',
									},
									{
										name: 'Rank (e.g: S, S+, SS, X)',
										value: 'rank',
									},
									{
										name: 'APM (Ataque Por Minuto)',
										value: 'apm',
									},
									{
										name: 'PPS (Piezas Por Segundo)',
										value: 'pps',
									},
									{
										name: 'VS (Versus Score)',
										value: 'vs'
									}
								)

						)
						.addBooleanOption(checkedin =>
							checkedin.setName('checked-in')
								.setDescription('Filtrar jugadores que hayan hecho Check-in en el torneo')
						)
				)
				.addSubcommand(mentionPlayers =>
					mentionPlayers.setName('mencionar-jugadores')
						.setDescription('Menciona a todos los jugadores inscritos en este torneo')
						.addStringOption(torneo =>
							torneo.setName('nombre-id')
								.setDescription('ID o nombre del torneo')
								.setAutocomplete(true)
								.setRequired(true)
						)
						.addBooleanOption(checkin =>
							checkin.setName('filtrar-checkin')
								.setDescription('¿Solo mencionar a los jugadores que hayan hecho check-in?')
						)
				)
				.addSubcommand(readdroles =>
					readdroles.setName('re-add-roles')
						.setDescription('Añade el / los roles a los jugadores inscritos en este torneo')
						.addStringOption(id =>
							id.setName('nombre-id')
								.setDescription('El nombre o la id numérica del torneo')
								.setRequired(true)
								.setMaxLength(255)
								.setAutocomplete(true)
						)

				)
		}, { idHints: ["1192271675186749560"] })
	}

	public async chatInputOpenRegistration(interaction: Subcommand.ChatInputCommandInteraction<'cached'>) {
		// Your code goes here
		void await interaction.deferReply({ ephemeral: true })

		const options = {
			idTorneo: +interaction.options.getString('nombre-id', true),
			channel: interaction.options.getChannel('canal', true),
			message: interaction.options.getString('mensaje', false),
			banner: interaction.options.getAttachment('tournament-banner', false)
		}

		const tournament = await GetTournamentFromGuild(interaction.guildId, options.idTorneo)

		if (!tournament) return void await interaction.editReply({
			embeds: [EmbedMessage({
				description: CommonMessages.Tournament.NotFound,
				color: Colors.Yellow
			})]
		})

		if (tournament.status === TournamentStatus.FINISHED)
			return void await interaction.editReply({
				embeds: [EmbedMessage({
					description: CommonMessages.Tournament.IsFinished,
					color: Colors.Red
				})]
			})

		if (tournament.status === TournamentStatus.CLOSED) {
			// Reopen this tournament registrations if it was closed
			await tournament.update('status', TournamentStatus.OPEN)
		}

		// Create a button that users can click to begin the registration flow
		const RegisterButton = new ButtonBuilder()
			.setCustomId(`t-register-${options.idTorneo}`)
			.setLabel('Inscribete aquí')
			.setStyle(ButtonStyle.Primary)
			.setEmoji('📩')

		const UnregisterButton = new ButtonBuilder()
			.setCustomId(`t-unregister-${options.idTorneo}`)
			.setLabel('Retirar inscripción')
			.setStyle(ButtonStyle.Secondary)
			.setEmoji('⬅️')

		// We have to add the button to an action row
		const ActionRow = new ActionRowBuilder<ButtonBuilder>()
			.setComponents(RegisterButton, UnregisterButton)


		// Send the message to the selected channel

		const channel = interaction.options.getChannel('canal', true) as GuildTextBasedChannel

		try {
			const registrationMessage = await channel.send({
				files: [],
				content: interaction.options.getString('mensaje', false) ?? CommonMessages.Tournament.CheckinStartedDefault.replace('{userid}', interaction.user.toString()).replace('{nombre_torneo}', tournament.name),
				components: [ActionRow],
				embeds: [TournamentDetailsEmbed(tournament)]
			})

			await tournament.update({
				registration_message: registrationMessage.id,
				registration_channel: registrationMessage.channel.id
			})

		} catch (e) {

			console.error(e)
			return void await interaction.editReply({ content: 'Ocurrió un error intentando enviar el mensaje en ese canal.' })
		}

		// Confirm to the user that the message was succesfully sent or otherwise
		return void await interaction.editReply({ content: `El mensaje ha sido enviado exitosamente en el canal ${interaction.options.getChannel('canal', true)}` })
	}

	public async chatInputBeginCheckin(interaction: Subcommand.ChatInputCommandInteraction<'cached'>) {
		// Your code goes here

		const options = {
			channel: interaction.options.getChannel('canal', true) as TextChannel,
			idTorneo: +interaction.options.getString('nombre-id', true)
		}
		const tournament = await GetTournamentFromGuild(interaction.guildId, options.idTorneo)

		if (!tournament) return void await interaction.reply({ content: "El mensaje no ha sido enviado por que el torneo no existe." })

		if (tournament.status === TournamentStatus.FINISHED)
			return void await interaction.reply({
				embeds: [EmbedMessage({
					description: CommonMessages.Tournament.IsFinished,
					color: Colors.Red
				})]
			})

		await interaction.deferReply()

		try {

			// Create the thread
			const thread = await options.channel.threads.create({
				name: 'Check In',
			})

			const CheckinButton = new ButtonBuilder()
				.setLabel('Check In')
				.setStyle(ButtonStyle.Primary)
				.setEmoji("➡️")
				.setCustomId(`checkin-${tournament.id}`)

			const CheckinRow = new ActionRowBuilder<ButtonBuilder>()
				.setComponents(CheckinButton)

			const checkinMessage = await thread.send({
				content: `${tournament.add_roles.length > 0 ? `${tournament.add_roles.map(id => `<@&${id}>`).join(", ")}\n` : ""}¡Presiona el botón de abajo para completar el Check-In en el torneo **${tournament.name}**!`,
				components: [CheckinRow]
			})

			tournament.is_checkin_open = true
			tournament.status = TournamentStatus.CLOSED
			tournament.checkin_channel = options.channel.id
			tournament.checkin_threadId = thread.id
			tournament.checkin_message = checkinMessage.id

			console.log(`[CHECKIN] Guardando mensaje de checkin para el torneo ${tournament.game}`);

			await tournament.save()

			console.log(`[CHECKIN] El mensaje ha sido guardado en el torneo.`);

			return void await interaction.editReply({
				content: `✅ ¡El mensaje ha sido enviado en el hilo ${thread}!`
			})
		} catch (e) {
			console.log(e)

			return void await interaction.editReply({
				content: '❌ Ocurrió un error con esta interacción.'
			})
		}


	}

	public async chatInputCreateTournament(interaction: Subcommand.ChatInputCommandInteraction) {

		/** Only accept tournament creation from guilds */
		if (!interaction.inCachedGuild()) return;

		const options = {
			name: interaction.options.getString("nombre", true),
			game: interaction.options.getString("juego", true) as GameName,
			description: interaction.options.getString('descripcion', false),
			rank_cap: interaction.options.getString('rank_cap', false),
			tr_cap: interaction.options.getInteger('tr_cap', false),
			country_lock: interaction.options.getString('pais', false),
			max_players: interaction.options.getInteger('maximo-jugadores', false),
		}

		try {

			const createdTournament = await TournamentModel.create({
				organized_by: interaction.user.id,
				guild_id: interaction.guildId,
				name: options.name,
				game: options.game,
				description: options.description,
				is_rank_capped: !!options.rank_cap,
				rank_cap: options.rank_cap,
				is_country_locked: !!options.country_lock,
				country_lock: options.country_lock,
				is_tr_capped: !!options.tr_cap,
				tr_cap: options.tr_cap,
				max_players: options.max_players,
				players: [],
				checked_in: [],
				// We create this tournament open by default
				status: TournamentStatus.OPEN,
				add_roles: GetRolesToAddArray(interaction)
			})

			return void await interaction.reply({ content: "El torneo ha sido creado exitosamente.", embeds: [TournamentDetailsEmbed(createdTournament)] })
		} catch (e) {
			return void await interaction.reply({ content: 'Ocurrió un error intentando crear este torneo.', ephemeral: true })
		}

	}

	public async chatInputClearPlayerList(interaction: Subcommand.ChatInputCommandInteraction<'cached'>) {
		// Your code goes here

		const idTorneo = +interaction.options.getString('nombre-id', true)
		const tournament = await GetTournamentFromGuild(interaction.guildId, idTorneo)

		if (!tournament)
			return void await interaction.reply({
				embeds: [EmbedMessage({
					description: CommonMessages.Tournament.NotFound,
					color: Colors.Red
				})]
			})

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
			embeds: [
				EmbedMessage({
					description: `✅ ¡La lista de jugadores del torneo **${tournament.name}** ha sido borrada!`,
					color: Colors.Green
				})
			],
			components: []
		})
	}

	/** This is essentially an UPDATE request */
	public async chatInputEditTournamentInfo(interaction: Subcommand.ChatInputCommandInteraction<'cached'>) {

		const tournamentId = +interaction.options.getString('nombre-id', true)

		// Try to get the tournament from this guild
		const tournament = await GetTournamentFromGuild(interaction.guildId, tournamentId)

		if (!tournament) {
			return void await interaction.reply({
				embeds: [
					EmbedMessage({
						description: CommonMessages.Tournament.NotFound,
						color: Colors.Red
					})
				],
				ephemeral: true
			})
		}

		if (!IsTournamentEditable(tournament))
			return void await interaction.reply({
				embeds: [
					EmbedMessage({
						description: CommonMessages.Tournament.NotEditable,
						color: Colors.Red
					})
				],
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
			embeds: [
				EmbedMessage({
					description: `¡El torneo **${tournament.name}** (id ${tournament.id}) ha sido editado con éxito!`,
					color: Colors.Green
				})
			],
			ephemeral: false
		})
	}

	public async chatInputFinishTournament(interaction: Subcommand.ChatInputCommandInteraction<'cached'>) {
		const options = {
			winner: interaction.options.getUser('ganador', false),
			idTorneo: +interaction.options.getString('nombre-id', true)
		}

		const tournament = await GetTournamentFromGuild(interaction.guildId, options.idTorneo)

		if (!tournament)
			return void await interaction.reply({
				ephemeral: true,
				embeds: [
					EmbedMessage({
						description: CommonMessages.Tournament.NotFound,
						color: Colors.Red
					})
				]
			})

		if (tournament.status === TournamentStatus.FINISHED)
			return void await interaction.reply({ embeds: [EmbedMessage({ description: CommonMessages.Tournament.NotEditable, color: Colors.Red })], ephemeral: true })

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
			embeds: [EmbedMessage({
				description: `El torneo **${tournament.name}** ha sido marcado como **FINALIZADO** exitósamente.`,
				color: Colors.Green
			})],
			components: [],
		})
	}

	public async chatInputListPlayers(interaction: Subcommand.ChatInputCommandInteraction<'cached'>) {
		const idTorneo = +interaction.options.getString('nombre-id', true)

		const tournament = await GetTournamentFromGuild(interaction.guildId, idTorneo)

		if (!tournament) return void await interaction.reply({
			ephemeral: true,
			embeds: [EmbedMessage({
				description: CommonMessages.Tournament.NotFound,
				color: Colors.Red
			})]
		})

		const format = interaction.options.getString('formato', false) ?? "embed" // default embed
		const orderBy = (interaction.options.getString('ordenar-por', false) ?? "default") as OrderBy
		const filterCheckedIn = interaction.options.getBoolean('checked_in', false)

		if (tournament.game !== "TETRIO") return void await interaction.reply({
			ephemeral: true,
			embeds: [EmbedMessage({
				description: CommonMessages.FunctionNotImplemented,
				color: Colors.Red
			})]
		})
		// We basically need to skip all the code below if the tournament is not a TETRIO tournament

		const playersSorted = await OrderPlayerListBy(tournament, orderBy, filterCheckedIn)

		if (['embed', 'challonge'].includes(format)) {

			const players = format === 'embed' ?
				BuildEmbedPlayerList(tournament, playersSorted) :
				BuildTableForChallonge(tournament, playersSorted)

			return void await interaction.reply({
				embeds: [
					EmbedMessage({
						description: CommonMessages.AdminCommands.SendPlayerList.Success.replace('{tournament}', tournament.name),
						color: Colors.Green
					}),
					players
				]
			})
		}

		let attachment: AttachmentBuilder | null = null

		if (format === 'csv') {
			attachment = BuildCSVTableAttachment(tournament, playersSorted)
		}

		if (format === 'ascii') {
			attachment = BuildASCIITableAttachment(tournament, playersSorted)
		}

		if (format === 'json') {
			attachment = BuildJSONAttachment(tournament, playersSorted)
		}

		return void await interaction.reply({
			embeds: [
				EmbedMessage({
					description: CommonMessages.AdminCommands.SendPlayerList.Success.replace('{tournament}', tournament.name),
					color: Colors.Green
				})
			],
			files: [attachment!]
		})
	}

	public async chatInputMentionPlayers(interaction: Subcommand.ChatInputCommandInteraction<'cached'>) {
		const options = {
			idTorneo: +interaction.options.getString('nombre-id', true),
			filterCheckedIn: interaction.options.getBoolean('filtrar-checkin', false)
		}

		const tournament = await GetTournamentFromGuild(interaction.guildId, options.idTorneo)

		if (!tournament)
			return void await interaction.reply({
				embeds: [
					EmbedMessage({
						description: CommonMessages.Tournament.NotFound,
						color: Colors.Red
					})
				]
			})

		const mentions = options.filterCheckedIn ?
			tournament.checked_in.map(id => `<@${id}>`).join(" ") :
			tournament.players.map(player => `<@${player.discordId}>`).join(" ");

		return void await interaction.reply({
			content: mentions
		})
	}

	public async chatInputReAddRoles(interaction: Subcommand.ChatInputCommandInteraction<'cached'>) {
		const idTorneo = +interaction.options.getString('nombre-id', true)

		const tournament = await GetTournamentFromGuild(interaction.guildId, idTorneo)

		if (!tournament) return void await interaction.reply({
			embeds: [EmbedMessage({
				description: CommonMessages.Tournament.NotFound,
				color: Colors.Red
			})]
		})

		if (tournament.add_roles.length === 0)
			return void await interaction.reply({ content: '❌ Este torneo no está configurado con roles para añadir.', ephemeral: true })

		await interaction.deferReply()

		const members = await interaction.guild.members.fetch()
		let membersWithoutTheRoles = 0
		const memberQueue: GuildMember[] = []

		for (const player of tournament.players) {
			const member = members.get(player.discordId)

			for (const roleId of tournament.add_roles) {
				if (member?.roles.cache.has(roleId)) continue;

				membersWithoutTheRoles++
				memberQueue.push(member!)
				break;
			}
		}

		await interaction.editReply({
			embeds: [
				EmbedMessage({
					description: `⏳ Añadiendo rol/es a **${membersWithoutTheRoles}** miembros...\n**Tiempo estimado**: ${membersWithoutTheRoles} segundos.`,
					color: Colors.Yellow
				})
			]
		})

		const result = await AddRolesToMembers(memberQueue, tournament.add_roles)

		return void await interaction.editReply({
			embeds: [
				EmbedMessage({
					description: `✅ El comando ha finalizado.\nSe añadieron roles a **${result.success}** miembros.\n**Fallaron**: ${result.errors}`,
					color: Colors.Green
				})
			]
		}).catch(() => console.log("[DEBUG - ADDROLESTOMEMBERS] El mensaje de la interacción ha sido eliminado o no se pudo editar."))

	}

	public async autocompleteRun(interaction: Subcommand.AutocompleteInteraction<'cached'>) {
		if (interaction.options.getFocused(true).name === 'nombre-id')
			return void await SearchTournamentByNameAutocomplete(interaction)
	}
}

async function AddRolesToMembers(queue: GuildMember[], rolesToAdd: Snowflake[]) {

	let errors = 0
	let success = 0
	for (const member of queue) {
		const result = await member.roles.add(rolesToAdd).catch(() => null)

		if (!result) errors++

		success++
		await setTimeout(1000);
	}

	return { errors, success }
}