import { Subcommand } from "@sapphire/plugin-subcommands";
import {
	ActionRowBuilder,
	AttachmentBuilder,
	ButtonBuilder,
	ButtonComponent,
	ButtonStyle,
	ChannelType,
	Colors,
	ComponentType,
	EmbedBuilder,
	GuildMember,
	GuildTextBasedChannel,
	PermissionFlagsBits,
	Snowflake,
	TextChannel
} from "discord.js";
import {
	AddPlayerToTournament,
	AllowedGames,
	BuildPlayerListAscii,
	BuildPlayerListCSV,
	BuildPlayerListChallonge,
	BuildPlayerListJSON,
	BuildPlayerListTetrioEmbed,
	CheckIfCategoryBelongsToGuild,
	ClearTournamentPlayerList,
	FinishTournament,
	GameName,
	GetSingleTournament,
	GetUserDataFromTetrio,
	IsTournamentEditable,
	OrderBy,
	OrderPlayerListBy,
	PrettyMsg,
	RemovePlayerFromTournament,
	SearchTournamentByNameAutocomplete,
	TetrioRanksArray,
	TetrioUserProfileEmbed,
	TournamentDetailsEmbed,
} from "../helper-functions/index.js";

import { setTimeout } from "node:timers/promises";
import { CommonMessages } from "../helper-functions/common-messages.js";
import { Tournament, TournamentModel, TournamentStatus } from "../sequelize/index.js";

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
					name: 'cerrar-inscripciones',
					chatInputRun: 'chatInputCloseRegistration'
				},
				{
					name: 'comenzar-checkin',
					chatInputRun: 'chatInputBeginCheckin'
				},
				{
					name: 'cerrar-checkin',
					chatInputRun: 'chatInputCloseCheckin'
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
					name: 'quitar-jugador',
					chatInputRun: 'chatInputRemovePlayer'
				},
				{
					name: 'inscribir-jugador',
					chatInputRun: 'chatInputRegisterPlayer'
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
			builder.setName("torneo")
				.setDMPermission(false)
				.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
				.setDescription('Comandos especificos de torneos')
				.addSubcommand(beginRegistration =>
					beginRegistration.setName("abrir-inscripciones")
						.setDescription("Abre las inscripciones para un torneo.")
						.addStringOption(id =>
							id.setName('nombre-id')
								.setDescription('La ID numérica o el nombre del torneo.')
								.setRequired(true)
								.setAutocomplete(true)
						)
						.addChannelOption(channel =>
							channel.setName('canal')
								.setDescription("Canal donde irá el mensaje de inscripción.")
								.setRequired(true)
								.addChannelTypes(ChannelType.GuildText)
						)
						.addStringOption(message =>
							message.setName('mensaje')
								.setDescription('Mensaje personalizado.')
								.setMaxLength(1000)
						)
						.addAttachmentOption(banner =>
							banner.setName('tournament-banner')
								.setDescription('Imagen o banner del torneo.')
						)
				)
				.addSubcommand(closeRegistration =>
					closeRegistration.setName("cerrar-inscripciones")
						.setDescription('Cierra las inscripciones de un torneo.')
						.addStringOption(idTorneo =>
							idTorneo.setName('nombre-id')
								.setDescription('Nombre o ID del torneo.')
								.setAutocomplete(true)
								.setMaxLength(255)
						)
				)
				.addSubcommand(beginCheckin =>
					beginCheckin.setName("comenzar-checkin")
						.setDescription("Abre el proceso de check-in para un torneo.")
						.addStringOption(tournamentId =>
							tournamentId.setName('nombre-id')
								.setDescription('La ID del torneo o una de las opciones del autocompletado.')
								.setRequired(true)
								.setAutocomplete(true)
						)
						.addChannelOption(channel =>
							channel.setName('canal')
								.setDescription('Canal en el cual se abrirá el Thread para iniciar el proceso de check-in.')
								.setRequired(true)
								.addChannelTypes(ChannelType.GuildText)
						)
				)
				.addSubcommand(closeCheckin =>
					closeCheckin.setName("cerrar-checkin")
						.setDescription('Cierra el proceso de check-in para un torneo.')
						.addStringOption(tournamentId =>
							tournamentId.setName('nombre-id')
								.setDescription('La ID numérica de un torneo o una de las opciones del autocompletado.')
								.setRequired(true)
								.setAutocomplete(true)
						)
				)
				.addSubcommand(create =>
					create.setName("crear")
						.setDescription("Crea un nuevo torneo.")
						.addStringOption(name =>
							name.setName('nombre')
								.setDescription('Nombre del torneo.')
								.setRequired(true)
						)
						.addStringOption(game =>
							game.setName('juego')
								.setDescription("El juego que se usará en este torneo.")
								.setChoices(
									{
										name: AllowedGames.TETRIO,
										value: AllowedGames.TETRIO,
									},
									{
										name: AllowedGames.TETRISEFFECT,
										value: AllowedGames.TETRISEFFECT,
									},
									{
										name: AllowedGames.PuyoTetris,
										value: AllowedGames.PuyoTetris
									},
									{
										name: AllowedGames.PuyoTetrisTwo,
										value: AllowedGames.PuyoTetrisTwo
									},
									{
										name: AllowedGames.Cultris,
										value: AllowedGames.Cultris
									},
									{
										name: AllowedGames.Jstris,
										value: AllowedGames.Jstris
									}
								)
								.setRequired(true)
						)
						.addStringOption(category =>
							category.setName('categoria')
								.setAutocomplete(true)
								.setDescription('La categoría a la que pertenece este torneo.')
								.setMaxLength(150)
						)
						.addStringOption(description =>
							description.setName('descripcion')
								.setDescription('La descripción de este torneo.')
								.setMaxLength(1000)
						)
						.addIntegerOption(srCap =>
							srCap.setName('generic-cap')
								.setDescription('El cap de SR/RH/RATE para torneos genéricos.')
								.setMinValue(1)
								.setMaxValue(50000)
						)
						.addStringOption(rankCap =>
							rankCap.setName('rank-cap')
								.setDescription('El rank máximo que pueden tener los jugadores.')
								.addChoices(...TetrioRanksArray.map(rank => ({ name: rank.toUpperCase(), value: rank })))
						)
						.addIntegerOption(trCap =>
							trCap.setName('tr-cap')
								.setDescription('El cap de TR para este torneo (1 - 25000).')
								.setMinValue(1)
								.setMaxValue(25000)
						)
						.addStringOption(countryLock =>
							countryLock.setName('pais')
								.setDescription('El país al cual está cerrado este torneo (ej: CL, AR, US).')
								.setMaxLength(2)
						)
						/** TODO: Add maximum and minimum values */
						.addIntegerOption(maxPlayers =>
							maxPlayers.setName('maximo-jugadores')
								.setDescription('Máximo de jugadores que pueden inscribirse en este torneo.')
								.setMinValue(8)
								.setMaxValue(256)
						)
						.addRoleOption(role =>
							role.setName('role-1')
								.setDescription('Rol a asignar con la inscripción.')
						)
						.addRoleOption(role =>
							role.setName('role-2')
								.setDescription('Rol a asignar con la inscripción.')
						)
						.addRoleOption(role =>
							role.setName('role-3')
								.setDescription('Rol a asignar con la inscripción.')
						)
				)
				.addSubcommand(clearPlayers =>
					clearPlayers.setName('eliminar-jugadores')
						.setDescription('Elimina a todos los jugadores inscritos en un torneo.')
						.addStringOption(name =>
							name.setName('nombre-id')
								.setDescription('El nombre o la ID numérica del torneo.')
								.setAutocomplete(true)
								.setMaxLength(255)
						)
				)
				.addSubcommand(editTournament =>
					editTournament.setName('editar')
						.setDescription('Edita la información de un torneo.')
						.addStringOption(name =>
							name.setName('nombre-id')
								.setDescription('Nombre o la ID numérica del torneo.')
								.setAutocomplete(true)
								.setMaxLength(255)
								.setRequired(true)
						)
						.addStringOption(name =>
							name.setName('nombre')
								.setDescription('Nombre del torneo')
								.setMaxLength(255)
						)
						.addStringOption(description =>
							description.setName('descripcion')
								.setDescription('Descripción del torneo.')
								.setMaxLength(1000)
						)
						.addIntegerOption(srCap =>
							srCap.setName('generic-cap')
								.setDescription('El cap de SR/RH/RATE para torneos genéricos.')
								.setMinValue(1)
								.setMaxValue(50000)
						)
						.addStringOption(rankCap =>
							rankCap.setName('rank-cap')
								.setDescription('El rank máximo que pueden tener los jugadores.')
								.addChoices(...TetrioRanksArray.map(rank => ({ name: rank.toUpperCase(), value: rank })))
						)
						.addIntegerOption(trCap =>
							trCap.setName('tr-cap')
								.setDescription('El cap de TR para este torneo (1 - 25000).')
								.setMinValue(1)
								.setMaxValue(25000)
						)
						.addIntegerOption(maxPlayers =>
							maxPlayers.setName('maximo-jugadores')
								.setDescription('Máximo de jugadores que pueden inscribirse en este torneo.')
						)
						.addRoleOption(role =>
							role.setName('role-1')
								.setDescription('Rol para añadir.')
						)
						.addRoleOption(role =>
							role.setName('role-2')
								.setDescription('Rol para añadir.')
						)
						.addRoleOption(role =>
							role.setName('role-3')
								.setDescription('Rol para añadir.')
						)
				)
				.addSubcommand(finishTournament =>
					finishTournament.setName('finalizar')
						.setDescription('Marca un torneo como FINALIZADO.')
						.addStringOption(name =>
							name.setName('nombre-id')
								.setDescription("El nombre o la ID numérica del torneo.")
								.setRequired(true)
								.setAutocomplete(true)
						)
						.addUserOption(winner =>
							winner.setName('ganador')
								.setDescription('El usuario que ganó el torneo.')
						)
				)
				.addSubcommand(register =>
					register.setName('inscribir-jugador')
						.setDescription('Inscribe a un jugador de forma manual.')
						.addStringOption(nameOrId =>
							nameOrId.setName('nombre-id')
								.setDescription('ID del torneo (Puedes usar las opciones del autocompletado).')
								.setRequired(true)
								.setMaxLength(255)
								.setAutocomplete(true)
						)
						.addUserOption(discordid =>
							discordid.setName('discord-id')
								.setDescription('La ID de Discord del jugador que estás inscribiendo.')
								.setRequired(true)
						)
						.addStringOption(tetrioId =>
							tetrioId.setName('tetrio-id')
								.setDescription('La ID o username de un jugador de TETRIO.')
								.setMaxLength(100)
						)
						.addStringOption(challongeId =>
							challongeId.setName('challonge-id')
								.setDescription('La ID de challonge de este usuario (OPCIONAL).')
								.setMaxLength(100)
						)
				)
				.addSubcommand(unregister =>
					unregister.setName('quitar-jugador')
						.setDescription('Elimina la inscripción de un jugador.')
						.addStringOption(nameOrId =>
							nameOrId.setName('nombre-id')
								.setDescription('El nombre o la ID numérica de un torneo.')
								.setRequired(true)
								.setMaxLength(255)
								.setAutocomplete(true)
						)
						.addUserOption(dId =>
							dId.setName('discord-id')
								.setDescription('ID de Discord del jugador que quieres quitar del torneo.')
								.setRequired(true)
						)
				)
				.addSubcommand(list =>
					list.setName('listar-jugadores')
						.setDescription('Obtén una lista con los jugadores inscritos en un torneo.')
						.addStringOption(name =>
							name.setName('nombre-id')
								.setDescription("El nombre o la ID numérica del torneo.")
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
								.setDescription('El formato en el que quieres exportar la lista de jugadores.')
						)
						.addStringOption(order =>
							order.setName('ordenar-por')
								.setDescription('El tipo de orden de los jugadores en la tabla (SOLO TETRIO).')
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
								.setDescription('Filtrar jugadores que hayan hecho check-in en el torneo.')
						)
				)
				.addSubcommand(mentionPlayers =>
					mentionPlayers.setName('mencionar-jugadores')
						.setDescription('Menciona a todos los jugadores inscritos en este torneo.')
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
						.setDescription('Añade el / los roles a los jugadores inscritos en este torneo.')
						.addStringOption(id =>
							id.setName('nombre-id')
								.setDescription('El nombre o la ID numérica del torneo.')
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

		const tournament = await GetSingleTournament(interaction.guildId, options.idTorneo)

		if (!tournament) return void await interaction.editReply({
			embeds: [PrettyMsg({
				description: CommonMessages.Tournament.NotFound,
				color: Colors.Yellow
			})]
		})

		if (tournament.status === TournamentStatus.FINISHED)
			return void await interaction.editReply({
				embeds: [PrettyMsg({
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

		const PlayerListButton = new ButtonBuilder()
			.setCustomId(`t-playerlist-${options.idTorneo}`)
			.setLabel('Lista de Jugadores')
			.setEmoji('👤')
			.setStyle(ButtonStyle.Secondary)

		// We have to add the button to an action row
		const ActionRowPrimary = new ActionRowBuilder<ButtonBuilder>()
			.setComponents(RegisterButton, UnregisterButton)

		const ActionRowSecondary = new ActionRowBuilder<ButtonBuilder>()
			.setComponents(PlayerListButton)


		// Send the message to the selected channel

		const channel = interaction.options.getChannel('canal', true) as GuildTextBasedChannel

		try {
			const registrationMessage = await channel.send({
				files: options.banner ? [options.banner] : [],
				content: interaction.options.getString('mensaje', false) ?? CommonMessages.Tournament.CheckinStartedDefault.replace('{userid}', interaction.user.toString()).replace('{nombre_torneo}', tournament.name),
				components: [ActionRowPrimary, ActionRowSecondary],
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
		return void await interaction.editReply({ content: `El mensaje ha sido enviado exitosamente en el canal ${interaction.options.getChannel('canal', true)}.` })
	}

	public async chatInputCloseRegistration(interaction: Subcommand.ChatInputCommandInteraction<'cached'>) {
		// Your code goes here
		const tournamentId = +interaction.options.getString('nombre-id', true)

		const torneo = await GetSingleTournament(interaction.guildId, tournamentId)
		if (!torneo) return void await interaction.reply({ content: "El torneo no existe.", ephemeral: true })

		await torneo.update({
			status: TournamentStatus.CLOSED
		})

		return void await interaction.reply({
			content: `Las inscripciones al torneo **${torneo.name}** han sido **cerradas**.`
		})
	}

	public async chatInputBeginCheckin(interaction: Subcommand.ChatInputCommandInteraction<'cached'>) {
		// Your code goes here

		const options = {
			channel: interaction.options.getChannel('canal', true) as TextChannel,
			idTorneo: +interaction.options.getString('nombre-id', true)
		}
		const tournament = await GetSingleTournament(interaction.guildId, options.idTorneo)

		if (!tournament) return void await interaction.reply({ content: "El mensaje no ha sido enviado por que el torneo no existe." })

		if (tournament.status === TournamentStatus.FINISHED)
			return void await interaction.reply({
				embeds: [PrettyMsg({
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
				content: `${tournament.add_roles.length > 0 ? `${tournament.add_roles.map(id => `<@&${id}>`).join(", ")}\n` : ""}¡Presiona el botón de abajo para completar el check-in en el torneo **${tournament.name}**!`,
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

	public async chatInputCloseCheckin(interaction: Subcommand.ChatInputCommandInteraction<'cached'>) {
		// Your code goes here

		const idTorneo = +interaction.options.getString('nombre-id', true)

		const tournament = await GetSingleTournament(interaction.guildId, idTorneo)

		if (!tournament) return void await interaction.editReply({ content: "No se puede cerrar el check-in de este torneo por que no se ha encontrado." })

		if (tournament.status === TournamentStatus.FINISHED)
			return void await interaction.reply({
				embeds: [
					PrettyMsg({
						description: CommonMessages.Tournament.IsFinished,
						color: Colors.Red
					})
				]
			})

		if (!tournament.is_checkin_open)
			return void await interaction.reply({
				embeds: [PrettyMsg({
					description: CommonMessages.Tournament.CheckinNotStarted,
					color: Colors.Red
				})]
			})

		await interaction.deferReply()

		// El check in está abierto, y debemos cerrarlo
		const checkinChannel = interaction.client.channels.cache.get(tournament.checkin_channel!) as TextChannel
		const checkinThread = await checkinChannel.threads.fetch(tournament.checkin_threadId!)

		if (!checkinThread) {
			tournament.is_checkin_open = false
			tournament.checkin_message = null
			tournament.checkin_threadId = null
			tournament.checkin_channel = null

			await tournament.save()

			return void await interaction.reply({
				embeds: [
					PrettyMsg({
						description: `✅ El check-in ha sido cerrado.`,
						color: Colors.Green
					})
				]
			})
		}

		const checkinMessage = await checkinThread.messages.fetch(tournament.checkin_message!)

		const disabledButton = ButtonBuilder.from(checkinMessage.resolveComponent(`checkin-${tournament.id}`) as ButtonComponent)
		disabledButton.setDisabled(true)
			.setCustomId('checkin-disabled')

		const newRow = new ActionRowBuilder<ButtonBuilder>()
			.setComponents(disabledButton)

		await checkinMessage.edit({
			content: 'El check-in para este torneo ha finalizado.',
			components: [newRow]
		})

		return void await interaction.editReply({
			content: `✅ ¡El check-in para el torneo **${tournament.name}** ha sido cerrado!`
		})
	}

	public async chatInputCreateTournament(interaction: Subcommand.ChatInputCommandInteraction) {

		/** Only accept tournament creation from guilds */
		if (!interaction.inCachedGuild()) return;

		const options = {
			name: interaction.options.getString("nombre", true),
			game: interaction.options.getString("juego", true) as GameName,
			category: parseInt(interaction.options.getString('categoria', false) ?? "-1"),
			description: interaction.options.getString('descripcion', false),
			rank_cap: interaction.options.getString('rank-cap', false),
			tr_cap: interaction.options.getInteger('tr-cap', false),
			sr_cap: interaction.options.getInteger('generic-cap', false),
			country_lock: interaction.options.getString('pais', false),
			max_players: interaction.options.getInteger('maximo-jugadores', false),
		}
		let createdTournament: Tournament | null = null

		if (options.category !== -1) {

			/** Check if this category is from this guild */
			const isValidCategory = await CheckIfCategoryBelongsToGuild({ category: options.category, guildId: interaction.guildId })

			if (!isValidCategory) {
				return void await interaction.reply({
					embeds: [
						PrettyMsg({
							description: `❌ **La categoría que ingresaste no existe en este servidor.**\nDebes crearla usando el comando \`/categorias crear\` y luego **seleccionarla en las opciones del autocompletado** de este comando.`,
							color: Colors.Red
						})
					]
				})
			}
		}

		try {
			if (options.game === AllowedGames.TETRIO) {
				createdTournament = await TournamentModel.create({
					organized_by: interaction.user.id,
					guild_id: interaction.guildId,
					name: options.name,
					game: options.game,
					category: options.category,
					description: options.description,
					status: TournamentStatus.OPEN,
					players: [],
					max_players: options.max_players,
					checked_in: [],
					add_roles: GetRolesToAddArray(interaction),
					is_rank_capped: !!options.rank_cap,
					rank_cap: options.rank_cap,
					is_country_locked: !!options.country_lock,
					country_lock: options.country_lock,
					is_tr_capped: !!options.tr_cap,
					tr_cap: options.tr_cap,
					// We create this tournament open by default
				})
			}
			else {
				createdTournament = await TournamentModel.create({
					organized_by: interaction.user.id,
					guild_id: interaction.guildId,
					name: options.name,
					game: options.game,
					category: options.category,
					description: options.description,
					status: TournamentStatus.OPEN,
					players: [],
					max_players: options.max_players,
					checked_in: [],
					add_roles: GetRolesToAddArray(interaction),
					general_rate_cap: options.sr_cap,
				})
			}

			return void await interaction.reply({ content: "El torneo ha sido creado exitosamente.", embeds: [TournamentDetailsEmbed(createdTournament)] })
		} catch (e) {
			console.error("[ERROR ON TOURNAMENT CREATION] =>", e)
			return void await interaction.reply({ content: 'Ocurrió un error intentando crear este torneo.', ephemeral: true })
		}

	}

	public async chatInputClearPlayerList(interaction: Subcommand.ChatInputCommandInteraction<'cached'>) {
		// Your code goes here

		const idTorneo = +interaction.options.getString('nombre-id', true)
		const tournament = await GetSingleTournament(interaction.guildId, idTorneo)

		if (!tournament)
			return void await interaction.reply({
				embeds: [PrettyMsg({
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
				PrettyMsg({
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
		const tournament = await GetSingleTournament(interaction.guildId, tournamentId)

		if (!tournament) {
			return void await interaction.reply({
				embeds: [
					PrettyMsg({
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
					PrettyMsg({
						description: CommonMessages.Tournament.NotEditable,
						color: Colors.Red
					})
				],
				ephemeral: true
			})

		const options = {
			name: interaction.options.getString('nombre', false),
			description: interaction.options.getString('descripcion', false),
			srCap: interaction.options.getInteger('generic-cap', false),
			rankCap: interaction.options.getString('rank-cap', false),
			trCap: interaction.options.getInteger('tr-cap', false),
			maxPlayers: interaction.options.getInteger('maximo-jugadores', false)
		}

		if (options.name) tournament.name = options.name
		if (options.description) tournament.description = options.description

		// If this is not a tetrio tournament these values shouldn't be editable
		if (tournament.game !== AllowedGames.TETRIO) {
			options.rankCap = null
			options.trCap = null
		} else {
			options.srCap = null
		}

		if (options.rankCap) {
			tournament.rank_cap = options.rankCap
			tournament.is_rank_capped = true
		}

		if (options.trCap) {
			tournament.tr_cap = options.trCap
			tournament.is_tr_capped = true
		}

		if (options.srCap) {
			tournament.general_rate_cap = options.srCap
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
				PrettyMsg({
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

		const tournament = await GetSingleTournament(interaction.guildId, options.idTorneo)

		if (!tournament)
			return void await interaction.reply({
				ephemeral: true,
				embeds: [
					PrettyMsg({
						description: CommonMessages.Tournament.NotFound,
						color: Colors.Red
					})
				]
			})

		if (tournament.status === TournamentStatus.FINISHED)
			return void await interaction.reply({ embeds: [PrettyMsg({ description: CommonMessages.Tournament.NotEditable, color: Colors.Red })], ephemeral: true })

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
			embeds: [PrettyMsg({
				description: `El torneo **${tournament.name}** ha sido marcado como **FINALIZADO** exitósamente.`,
				color: Colors.Green
			})],
			components: [],
		})
	}

	public async chatInputRegisterPlayer(interaction: Subcommand.ChatInputCommandInteraction<'cached'>) {
		// Your code goes here
		const options = {
			user: interaction.options.getUser('discord-id', true),
			tetrioId: interaction.options.getString('tetrio-id', false),
			idTorneo: +interaction.options.getString('nombre-id', true),
			challongeId: interaction.options.getString('challonge-id', false),
		}

		const tournament = await GetSingleTournament(interaction.guildId, options.idTorneo)

		if (!tournament)
			return void await interaction.reply({ content: 'El torneo que ingresaste no existe en este servidor', ephemeral: true })

		if (tournament.players.some(player => player.discordId === options.user.id))
			return void await interaction.reply({ content: 'Este usuario ya se encuentra en la lista de inscritos en el torneo.', ephemeral: true })

		await interaction.deferReply({ ephemeral: true })

		if (tournament.game === AllowedGames.TETRIO) {
			if (options.tetrioId === null) return void await interaction.editReply({
				content: `❌ Debes ingresar el nombre de usuario de tetrio de este jugador para poder inscribirlo en este torneo.`
			})

			// Check if the user exists on tetrio
			const TetrioUserData = await GetUserDataFromTetrio(options.tetrioId)

			if (!TetrioUserData)
				return void await interaction.editReply({
					content: `El usuario ${options.tetrioId} no es un usuario válido en TETRIO.`,
				})

			const userdetails = TetrioUserProfileEmbed(TetrioUserData)

			const userSecondaryDetails = new EmbedBuilder()
				.setTitle('Otros Datos')
				.setDescription(
					`**Discord id**: ${options.user} (${options.user.id})` +
					`\n**Discord Username**: ${options.user.username}` +
					`\n**Torneo**: ${tournament.name}`)
				.setThumbnail(options.user.avatarURL({ size: 512 }))
				.setColor(Colors.Blue)

			const acceptButton = new ButtonBuilder()
				.setCustomId('accept')
				.setLabel('Confirmar')
				.setStyle(ButtonStyle.Success)

			const cancelButton = new ButtonBuilder()
				.setCustomId('cancel')
				.setLabel('Cancelar')
				.setStyle(ButtonStyle.Secondary)

			const buttonRow = new ActionRowBuilder<ButtonBuilder>()
				.setComponents(acceptButton, cancelButton)

			const initialReply = await interaction.editReply({
				content: '¿Es esta información correcta?',
				embeds: [userdetails, userSecondaryDetails],
				components: [buttonRow]
			})

			const selectedOption = await initialReply.awaitMessageComponent({
				componentType: ComponentType.Button,
				time: 60_000,
				filter: (btn => ["accept", "cancel"].includes(btn.customId))
			}).catch(() => null)

			if (!selectedOption) return void await interaction.editReply({ content: 'La interacción ha expirado.', components: [], embeds: [] })

			if (selectedOption.customId === 'cancel')
				return void await interaction.editReply({
					content: 'La interacción ha sido cancelada.',
					components: [],
					embeds: []
				})

			await AddPlayerToTournament(tournament, {
				challongeId: options.challongeId,
				discordId: options.user.id,
				dUsername: options.user.username,
				data: TetrioUserData
			})

		} else {

			await AddPlayerToTournament(tournament, {
				challongeId: options.challongeId,
				discordId: options.user.id,
				dUsername: options.user.username
			})
		}

		return void await interaction.editReply({
			content: `✅ ¡El jugador **${options.user.username}**  (${options.user.id}) ha sido agregado a la lista de jugadores del torneo **${tournament.name}** exitosamente!`,
			components: [],
			embeds: [],
		})
	}

	public async chatInputRemovePlayer(interaction: Subcommand.ChatInputCommandInteraction<'cached'>) {
		// Your code goes here
		const idTorneo = +interaction.options.getString('nombre-id', true)

		const tournament = await GetSingleTournament(interaction.guildId, idTorneo)

		if (!tournament) return void await interaction.reply({ content: 'No encontré ningun torneo.', ephemeral: true })
		if (tournament.status === TournamentStatus.FINISHED)
			return void await interaction.reply({ content: 'No puedes desinscribir a un jugador de un torneo que está marcado como **FINALIZADO**.', ephemeral: true })

		try {

			await RemovePlayerFromTournament(tournament, interaction.options.getUser('discord-id', true).id);

			return void await interaction.reply({ content: `✅ El jugador ${interaction.options.getUser('discord-id', true)} ha sido quitado del torneo.` })
		} catch (e) {
			console.log(e);

			return void await interaction.reply({ content: 'Ocurrió un error intentando actualizar la base de datos.', ephemeral: true })

		}
	}

	public async chatInputListPlayers(interaction: Subcommand.ChatInputCommandInteraction<'cached'>) {
		const idTorneo = +interaction.options.getString('nombre-id', true)

		const tournament = await GetSingleTournament(interaction.guildId, idTorneo)

		if (!tournament) return void await interaction.reply({
			ephemeral: true,
			embeds: [PrettyMsg({
				description: CommonMessages.Tournament.NotFound,
				color: Colors.Red
			})]
		})

		const format = interaction.options.getString('formato', false) ?? "embed" // default embed
		const orderBy = (interaction.options.getString('ordenar-por', false) ?? "default") as OrderBy
		const filterCheckedIn = interaction.options.getBoolean('checked-in', false)

		if (tournament.game !== "TETRIO") return void await interaction.reply({
			ephemeral: true,
			embeds: [PrettyMsg({
				description: CommonMessages.FunctionNotImplemented,
				color: Colors.Red
			})]
		})
		// We basically need to skip all the code below if the tournament is not a TETRIO tournament

		const playersSorted = OrderPlayerListBy(tournament, orderBy, filterCheckedIn)

		if (['embed', 'challonge'].includes(format)) {

			const players = format === 'embed' ?
				BuildPlayerListTetrioEmbed(tournament, playersSorted) :
				BuildPlayerListChallonge(tournament, playersSorted)

			return void await interaction.reply({
				embeds: [
					PrettyMsg({
						description: CommonMessages.AdminCommands.SendPlayerList.Success.replace('{tournament}', tournament.name),
						color: Colors.Green
					}),
					players
				]
			})
		}

		let attachment: AttachmentBuilder | null = null

		if (format === 'csv') {
			attachment = BuildPlayerListCSV(tournament, playersSorted)
		}

		if (format === 'ascii') {
			attachment = BuildPlayerListAscii(tournament, playersSorted)
		}

		if (format === 'json') {
			attachment = BuildPlayerListJSON(tournament, playersSorted)
		}

		return void await interaction.reply({
			embeds: [
				PrettyMsg({
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

		const tournament = await GetSingleTournament(interaction.guildId, options.idTorneo)

		if (!tournament)
			return void await interaction.reply({
				embeds: [
					PrettyMsg({
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

		const tournament = await GetSingleTournament(interaction.guildId, idTorneo)

		if (!tournament) return void await interaction.reply({
			embeds: [PrettyMsg({
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
				PrettyMsg({
					description: `⏳ Añadiendo rol/es a **${membersWithoutTheRoles}** miembros...\n**Tiempo estimado**: ${membersWithoutTheRoles} segundos.`,
					color: Colors.Yellow
				})
			]
		})

		const result = await AddRolesToMembers(memberQueue, tournament.add_roles)

		return void await interaction.editReply({
			embeds: [
				PrettyMsg({
					description: `✅ El comando ha finalizado.\nSe añadieron roles a **${result.success}** miembros.\n**Fallaron**: ${result.errors}`,
					color: Colors.Green
				})
			]
		}).catch(() => console.log("[DEBUG - ADDROLESTOMEMBERS] El mensaje de la interacción ha sido eliminado o no se pudo editar."))

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

export function GetRolesToAddArray(interaction: Subcommand.ChatInputCommandInteraction<'cached'>) {
	const roles = [];
	const role1 = interaction.options.getRole('role-1', false);
	const role2 = interaction.options.getRole('role-2', false);
	const role3 = interaction.options.getRole('role-3', false);

	if (role1) roles.push(role1.id);
	if (role2) roles.push(role2.id);
	if (role3) roles.push(role3.id);

	return roles;
}