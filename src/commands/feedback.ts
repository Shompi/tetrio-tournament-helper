import { Command } from "@sapphire/framework"
import { Colors, EmbedBuilder, GuildTextBasedChannel } from "discord.js";
import { BlocklistModel } from "../sequelize/Blocklist.js";


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
	public async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		// Your code goes here
		const isBlocked = await BlocklistModel.findOne({ where: { discord_id: interaction.user.id } })

		if (isBlocked && isBlocked.isBlacklisted)
			return void await interaction.reply({ content: 'No puedes usar este comando.', ephemeral: true })

		await interaction.deferReply({ ephemeral: true })
		const feedbackChannel = interaction.client.channels.cache.get(process.env.FEEDBACK_CHANNEL!) as GuildTextBasedChannel

		const feedbackEmbed = new EmbedBuilder()
			.setTitle(`Feedback de ${interaction.user.username}`)
			.setFooter({
				text: interaction.user.id
			})
			.setTimestamp()
			.setDescription(interaction.options.getString('mensaje', true))
			.setColor(Colors.Blue)


		void await feedbackChannel.send({ embeds: [feedbackEmbed] })
		return void await interaction.editReply({
			content: '¡Tu feedback ha sido recibido con éxito y enviado a los desarrolladores!\nTe recordamos que abusar de este comando podría resultar en la imposibilidad de utilizar este comando en el futuro.'
		})
	}
}