import { Command } from "@sapphire/framework"
import { ButtonBuilder, ButtonStyle, ChannelType, PermissionsBitField } from "discord.js"

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


		// Create a button that users can click to begin the registration flow
		const CheckInButton = new ButtonBuilder()
			.setCustomId('tournament-checkin')
			.setLabel('Inscribete aquí')
			.setStyle(ButtonStyle.Primary)
			.setEmoji('✉️')

		// Send the message to the selected channel

		// Confirm to the user that the message was succesfully sent or otherwise

	}
}