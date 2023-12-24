import { Subcommand } from "@sapphire/plugin-subcommands"
import { Colors, PermissionFlagsBits } from "discord.js"
import { BlocklistModel } from "../sequelize/Blocklist.js";
import { EmbedMessage } from "../helper-functions/index.js";

export class BlocklistCommands extends Subcommand {


	public constructor(context: Subcommand.LoaderContext, options: Subcommand.Options) {
		super(context, {
			...options,
			subcommands: [
				{
					name: 'añadir',
					chatInputRun: 'chatInputAddToBlocklist'
				},
				{
					name: 'quitar',
					chatInputRun: 'chatInputRemoveFromBlocklist'
				}
			]
		});
	}


	public override registerApplicationCommands(registry: Subcommand.Registry) {
		registry.registerChatInputCommand((builder) => {
			builder.setName("blocklist")
				.setDMPermission(false)
				.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
				.setDescription('Comandos de blocklist')
				.addSubcommand(add =>
					add.setName('añadir')
						.setDescription('Añade a un usuario a la blocklist')
						.addUserOption(id =>
							id.setName('user-id')
								.setDescription('El usuario al cual quieres bloquear de los comandos del bot')
								.setRequired(true)

						)
						.addStringOption(reason =>
							reason.setName('razón')
								.setDescription('La razón para añadir a este usuario a la blocklist')
								.setMaxLength(300)
								.setRequired(true)
						)
				)
				.addSubcommand(remove =>
					remove.setName('quitar')
						.setDescription('La id del usuario que quieres bloquear para que el bot ignore')
						.addUserOption(id =>
							id.setName('user-id')
								.setDescription('El usuario al cual quieres quitar de la blocklist')
								.setRequired(true)
						)
				)
		}, { idHints: ["1183583868750659596"] })


	}
	public async chatInputAddToBlocklist(interaction: Subcommand.ChatInputCommandInteraction) {
		// Your code goes here
		const options = {
			target: interaction.options.getUser('user-id', true),
			reason: interaction.options.getString('reason', true),
		}

		// Find user in database
		const user = await BlocklistModel.findByPk(options.target.id)

		if (!user) {
			await BlocklistModel.create({
				discord_id: options.target.id,
				isBlacklisted: true,
				reason: options.reason
			})
		} else {

			await user.update({
				isBlacklisted: true,
				reason: options.reason
			})
		}

		return void await interaction.reply({ content: `✅ El usuario ${options.target} ha sido añadido a la blocklist.`, ephemeral: true })
	}

	public async chatInputRemoveFromBlocklist(interaction: Subcommand.ChatInputCommandInteraction) {
		const options = {
			target: interaction.options.getUser('user-id', true)
		}

		const user = await BlocklistModel.findByPk(options.target.id)

		if (!user) {
			return void await interaction.reply({ content: '❌ El usuario no está en la blocklist.', ephemeral: true })
		}

		await user.update({
			isBlacklisted: false,
			reason: null
		})

		return void await interaction.reply({
			embeds: [EmbedMessage({
				description: `✅ El usuario <@${user.discord_id} puede utilizar los comandos del bot nuevamente.`,
				color: Colors.Green
			})],
			ephemeral: true
		})
	}
}