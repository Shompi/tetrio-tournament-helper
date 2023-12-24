import { Command } from "@sapphire/framework"
import { ChannelType, Colors, PermissionFlagsBits } from "discord.js";
import { EmbedMessage, GetGuildConfigs } from "../helper-functions/index.js";


export class SetupCommmand extends Command {


	public constructor(context: Command.LoaderContext, options: Command.Options) {
		super(context, { ...options });
	}


	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand((builder) => {
			builder.setName("setup")
				.setDescription('Comando de setup para configurar el funcionamiento del bot en este servidor')
				.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
				.setDMPermission(false)
				.addRoleOption(role1 =>
					role1.setName('organizer')
						.setDescription('El rol que tiene permitido usar los comandos de admin y de torneos')
				)
				.addChannelOption(log =>
					log.setName('log-channel')
						.setDescription('El canal al cual se enviarán mensajes de logs, errores, entre otros')
						.addChannelTypes(ChannelType.GuildText)
				)
		}, { idHints: ["1188308099245805630"] })


	}
	public async chatInputRun(interaction: Command.ChatInputCommandInteraction<'cached'>) {
		// Your code goes here

		const options = {
			allowedRole: interaction.options.getRole("admin-role", false),
			logChannel: interaction.options.getChannel('log-channel', false)
		}

		const guildConfigs = await GetGuildConfigs(interaction.guildId)

		if (options.logChannel) {
			guildConfigs.logging_channel = options.logChannel.id
		}

		if (options.allowedRole) {
			const allowed_roles = [options.allowedRole.id]

			guildConfigs.allowed_roles = allowed_roles
		}

		console.log(`[GUILD CONFIGS] Actualizando configuración de la guild ${interaction.guild.name} (${interaction.guildId})`);
		await guildConfigs.save()
		console.log(`[GUILD CONFIGS] ¡Las configuraciones han sido actualizadas!`);

		return void await interaction.reply({
			embeds: [
				EmbedMessage({
					color: Colors.Green,
					description: "✅ ¡Las configuraciones han sido guardadas!",
				})
			]
		})
	}
}