import { Command } from "@sapphire/framework"
import { Colors, GuildTextBasedChannel } from "discord.js";
import { EmbedMessage, UserIsBlocked } from "../helper-functions/index.js";
import { CommonMessages } from "../helper-functions/common-messages.js";


export class FeedbackCommand extends Command {


	public constructor(context: Command.LoaderContext, options: Command.Options) {
		super(context, { ...options });
	}


	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand((builder) => {
			builder.setName("feedback")
				.setDMPermission(false)
				.setDescription('Envia una sugerencia respecto al bot!')
				.addStringOption(message =>
					message.setName('mensaje')
						.setDescription('El mensaje que quieres enviar a los desarrolladores (2000 caracteres max)')
						.setRequired(true)
						.setMinLength(10)
						.setMaxLength(2000)
				)

		}, { idHints: ["1183537281387204728"] })
	}
	public async chatInputRun(interaction: Command.ChatInputCommandInteraction<'cached'>) {
		// Your code goes here

		const options = {
			message: interaction.options.getString('mensaje', true)
		}

		if (await UserIsBlocked(interaction.user)) {
			return void await interaction.reply({
				ephemeral: true,
				embeds: [EmbedMessage({
					description: CommonMessages.UserIsBlocked,
					color: Colors.Red
				})]
			})
		}

		await interaction.deferReply({ ephemeral: true })
		const feedbackChannel = interaction.client.channels.cache.get(process.env.FEEDBACK_CHANNEL!) as GuildTextBasedChannel

		void await feedbackChannel.send({
			embeds: [
				EmbedMessage({
					description: options.message,
					color: interaction.member.displayColor,
					author: {
						name: `${interaction.user.displayName} (${interaction.user.id})`,
						iconURL: interaction.user.displayAvatarURL({ size: 256 })
					}
				})
			]
		})


		return void await interaction.editReply({
			embeds: [
				EmbedMessage({
					description: '¡Tu feedback ha sido recibido con éxito y enviado a los desarrolladores!\nTe recordamos que abusar de este comando podría resultar en la imposibilidad de utilizar este comando en el futuro.',
					color: Colors.Blue
				})
			]
		})
	}
}