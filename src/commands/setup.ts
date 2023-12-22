import { Command } from "@sapphire/framework"
import { ChannelType } from "discord.js";


export class SetupCommmand extends Command {


	public constructor(context: Command.LoaderContext, options: Command.Options) {
		super(context, { ...options });
	}


	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand((builder) => {
			builder.setName("setup")
				.addRoleOption(role1 =>
					role1.setName('admin-role')
						.setDescription('El rol que tiene permitido usar los comandos de admin y de torneos')
				)
				.addChannelOption(log =>
					log.setName('log-channel')
						.setDescription('El canal al cual se enviarán mensajes de logs, errores, entre otros')
						.addChannelTypes(ChannelType.GuildText)
				)
		}, { idHints: [""] })


	}
	public async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		// Your code goes here

		

	}
}