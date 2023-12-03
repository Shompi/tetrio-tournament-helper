import { Command } from "@sapphire/framework"
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, GuildTextBasedChannel, PermissionsBitField, TextBasedChannel } from "discord.js"
import { TournamentModel, TournamentStatus } from "../sequelize/index.js";
import { TournamentDetailsEmbed } from "./consult-tournament.js";

export class OpenRegistration extends Command {


	public constructor(context: Command.LoaderContext, options: Command.Options) {
		super(context, { ...options });
	}

	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand((builder) => {
			builder.setName("open-checkin")
				.setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator)
				.setDescription("Abre el proceso de check in para un torneo")
				.addChannelOption(channel =>
					channel.setName('canal')
						.setDescription("Canal en el cual los usuarios podran iniciar el proceso de registro")
						.setRequired(true)
						.addChannelTypes(ChannelType.GuildText)
				)
				.addIntegerOption(id =>
					id.setName('torneo-id')
						.setDescription('La id del torneo al cualquier quieres abrir las inscripciones')
						.setRequired(true)
				)

		}, { idHints: [""] })
	}

	public async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		// Your code goes here
		void await interaction.deferReply()
		const idTorneo = interaction.options.getInteger('torneo-id', true)
		const torneo = await TournamentModel.findOne({ where: { id: idTorneo } })


		if (!torneo) return void await interaction.editReply({ content: "El mensaje no ha sido enviado por que el torneo no existe en la base de datos." })

		if (torneo.status === TournamentStatus.CLOSED)
			return void await interaction.editReply({ content: "No se pueden abrir las inscripciones para este torneo por que está marcado como CLOSED." })


		// Create a button that users can click to begin the registration flow
		const CheckInButton = new ButtonBuilder()
			.setCustomId(`t-checkin-${interaction.options.getInteger('torneo-id', true)}`)
			.setLabel('Inscribete aquí')
			.setStyle(ButtonStyle.Primary)
			.setEmoji('✉️')

		// We have to add the button to an action row
		const ActionRow = new ActionRowBuilder<ButtonBuilder>()
			.setComponents(CheckInButton)

		// Send the message to the selected channel

		const channel = interaction.options.getChannel('canal', true) as GuildTextBasedChannel

		try {
			void await channel.send({
				content: `${interaction.user} ha abierto las inscripciones para el torneo \"**${torneo.name}**\". \n¡Presiona el botón de abajo para comenzar la inscripción!`,
				components: [ActionRow],
				embeds:[TournamentDetailsEmbed(torneo)]
			})
		} catch (e) {

			console.error(e)
			return void await interaction.editReply({ content: 'Ocurrió un error intentando enviar el mensaje en ese canal.' })
		}

		// Confirm to the user that the message was succesfully sent or otherwise
		return void await interaction.editReply({ content: `El mensaje ha sido enviado exitosamente en el canal ${interaction.options.getChannel('canal', true)}` })
	}
}