import { Command } from "@sapphire/framework"


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
						.setDescription('El mensaje que quieres enviar a los desarrolladores')
						.setRequired(true)
						.setMinLength(10)
						.setMaxLength(2000)
				)

		}, { idHints: ["1183537281387204728"] })


	}
	public async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		// Your code goes here
		return void await interaction.reply({ content: 'Este comando aún no está implementado.', ephemeral: true })
	}
}