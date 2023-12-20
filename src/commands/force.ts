import { Subcommand } from "@sapphire/plugin-subcommands"
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, Colors, ComponentType, EmbedBuilder, PermissionFlagsBits } from "discord.js"
import { AddPlayerToTournamentPlayerList, AddTetrioPlayerToDatabase, GetTournamentFromGuild, GetUserDataFromTetrio, SearchTournamentByNameAutocomplete, TetrioUserProfileEmbed } from "../helper-functions/index.js";
import { TournamentStatus } from "../sequelize/Tournaments.js";
import { RemovePlayerFromTournament } from "../helper-functions/index.js";
import { GetPlayerFromDatabase } from "../helper-functions/index.js";

export class ForceCommands extends Subcommand {


	public constructor(context: Subcommand.LoaderContext, options: Subcommand.Options) {
		super(context, {
			...options,
			subcommands: [
				{
					name: 'inscripcion',
					chatInputRun: 'chatInputForzarInscripcion'
				},
				{
					name: 'desinscripcion',
					chatInputRun: 'chatInputForzarDesinscripcion'
				}
			],
		});
	}


	public override registerApplicationCommands(registry: Subcommand.Registry) {
		registry.registerChatInputCommand((builder) => {
			builder.setName("forzar")
				.setDescription('Comandos de administrador para forzar acciones en algunas situaciones')
				.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
				.setDMPermission(false)
				.addSubcommand(register =>
					register.setName('inscripcion')
						.setDescription('Forza la inscripción de un jugador en un torneo (TETRIO)')
						.addStringOption(nameOrId =>
							nameOrId.setName('nombre-id')
								.setDescription('ID del torneo (Puedes usar las opciones del autocompletado)')
								.setRequired(true)
								.setMaxLength(255)
								.setAutocomplete(true)
						)
						.addUserOption(discordid =>
							discordid.setName('discord-id')
								.setDescription('La id de Discord del jugador que estás inscribiendo')
								.setRequired(true)
						)
						.addStringOption(tetrioId =>
							tetrioId.setName('tetrio-id')
								.setDescription('La id o username de un jugador de TETRIO')
								.setMaxLength(100)
								.setRequired(true)
						)
						.addStringOption(challongeId =>
							challongeId.setName('challonge-id')
								.setDescription('La id de challonge de este usuario (OPCIONAL)')
								.setMaxLength(100)
						)
				)
				.addSubcommand(unregister =>
					unregister.setName('desinscripcion')
						.setDescription('Elimina la inscripción de un jugador de un torneo')
						.addStringOption(nameOrId =>
							nameOrId.setName('nombre-id')
								.setDescription('El nombre o la Id numérica de un torneo')
								.setRequired(true)
								.setMaxLength(255)
								.setAutocomplete(true)
						)
						.addUserOption(dId =>
							dId.setName('discord-id')
								.setDescription('ID de Discord del jugador que quieres quitar del torneo')
								.setRequired(true)
						)
				)

		}, { idHints: ["1182113989493276783"] })


	}

	public async chatInputForzarInscripcion(interaction: Subcommand.ChatInputCommandInteraction<'cached'>) {
		// Your code goes here
		const options = {
			user: interaction.options.getUser('discord-id', true),
			tetrioId: interaction.options.getString('tetrio-id', true),
			idTorneo: +interaction.options.getString('nombre-id', true),
			challongeId: interaction.options.getString('challonge-id', false),
		}

		if (isNaN(options.idTorneo))
			return void await interaction.reply({ content: 'La id debe ser una id numérica o una de las opciones del autocompletado.', ephemeral: true })

		const tournament = await GetTournamentFromGuild(interaction.guildId, options.idTorneo)

		if (!tournament)
			return void await interaction.reply({ content: 'El torneo que ingresaste no existe en este servidor', ephemeral: true })

		if (tournament.players.some(player => player.discordId === options.user.id))
			return void await interaction.reply({ content: 'Este usuario ya se encuentra en la lista de inscritos en el torneo.', ephemeral: true })

		await interaction.deferReply({ ephemeral: true })

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

		// await AddTetrioPlayerToDatabase({
		// 	challongeId: options.challongeId,
		// 	discordId: options.user.id,
		// 	tetrioId: options.tetrioId
		// }, TetrioUserData)

		await AddPlayerToTournamentPlayerList(tournament, {
			challongeId: options.challongeId,
			discordId: options.user.id,
			data: TetrioUserData
		})

		return void await selectedOption.update({
			content: `✅ El jugador ${options.tetrioId.toUpperCase()} (${options.user.username} - ${options.user.id}) ha sido agregado a la base de datos y a la lista de jugadores del torneo **${tournament.name}** exitosamente!`,
			components: [],
			embeds: [],
		})
	}

	public async chatInputForzarDesinscripcion(interaction: Subcommand.ChatInputCommandInteraction<'cached'>) {
		// Your code goes here
		const idTorneo = +interaction.options.getString('nombre-id', true)

		if (isNaN(idTorneo))
			return void await interaction.reply({ content: 'Debes ingresar la id o el nombre de algun torneo (usando las opciones del autocompletado)', ephemeral: true })

		const tournament = await GetTournamentFromGuild(interaction.guildId, idTorneo)

		if (!tournament) return void await interaction.reply({ content: 'No encontré ningun torneo.', ephemeral: true })
		if (tournament.status === TournamentStatus.FINISHED)
			return void await interaction.reply({ content: 'No puedes desinscribir a un jugador de un torneo que está marcado como **FINALIZADO**', ephemeral: true })

		try {

			await RemovePlayerFromTournament(tournament, interaction.options.getUser('discord-id', true).id);

			return void await interaction.reply({ content: `✅ El jugador ${interaction.options.getUser('discord-id', true)} ha sido quitado del torneo.` })
		} catch (e) {
			console.log(e);

			return void await interaction.reply({ content: 'Ocurrió un error intentando actualizar la base de datos.', ephemeral: true })

		}
	}

	public async autocompleteRun(interaction: Subcommand.AutocompleteInteraction<'cached'>) {
		if (interaction.options.getFocused(true).name === 'nombre-id')
			return void await SearchTournamentByNameAutocomplete(interaction)
	}
}