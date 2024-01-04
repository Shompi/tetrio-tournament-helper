import { Command } from "@sapphire/framework"
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, Colors, GuildTextBasedChannel, PermissionsBitField, TextBasedChannel } from "discord.js"
import { TournamentStatus } from "../sequelize/Tournaments.js";
import { EmbedMessage, GetTournamentFromGuild, SearchTournamentByNameAutocomplete, TournamentDetailsEmbed } from "../helper-functions/index.js";
import { CommonMessages } from "../helper-functions/common-messages.js";

const DefaultMessage = `{userid} ha abierto las inscripciones para el torneo \"**{nombre_torneo}**\". \n¡Presiona el botón de abajo para comenzar la inscripción!`
export class OpenRegistration extends Command {


	public constructor(context: Command.LoaderContext, options: Command.Options) {
		super(context, { ...options });
	}

	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand((builder) => {
			builder.setName("abrir-inscripciones")
				.setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator)
				.setDMPermission(false)
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

		}, { idHints: ["1181535689226063924"] })
	}

	public async chatInputRun(interaction: Command.ChatInputCommandInteraction<'cached'>) {
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
				content: interaction.options.getString('mensaje', false) ?? DefaultMessage.replace('{userid}', interaction.user.toString()).replace('{nombre_torneo}', tournament.name),
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

	public async autocompleteRun(interaction: Command.AutocompleteInteraction<'cached'>) {
		if (interaction.options.getFocused(true).name === 'nombre-id')
			return void await SearchTournamentByNameAutocomplete(interaction)
	}
}