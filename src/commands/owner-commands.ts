import { Subcommand } from "@sapphire/plugin-subcommands";
import { Colors, PermissionFlagsBits } from "discord.js";
import { BlockUser, GetTournament, PrettyMsg, TournamentDetailsEmbed, UnblockUser } from "../helper-functions/index.js";
import { CommonMessages } from "../helper-functions/common-messages.js";

export class OwnerCommands extends Subcommand {

	public constructor(context: Subcommand.LoaderContext, options: Subcommand.Options) {
		super(context, {
			...options,
			subcommands: [
				{
					name: 'tournament',
					type: 'group',
					entries: [
						{ name: 'info', chatInputRun: 'TournamentInfo' }
					]
				},
				{
					name: 'blocklist',
					type: "group",
					entries: [
						{
							name: 'añadir',
							chatInputRun: 'chatInputAddToBlocklist'
						},
						{
							name: 'quitar',
							chatInputRun: 'chatInputRemoveFromBlocklist'
						}
					]
				}
			],
		});
	}

	public override registerApplicationCommands(registry: Subcommand.Registry) {
		registry.registerChatInputCommand((builder) => {
			builder //
				.setName('dev')
				.setDescription('Comandos de desarrollador.')
				.setDMPermission(false)
				.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
				.addSubcommandGroup(tournaments =>
					tournaments.setName('tournament')
						.setDescription('Comandos de torneos.')
						.addSubcommand(info =>
							info.setName('info')
								.setDescription('Información general de un torneo.')
								.addStringOption(id =>
									id.setName('nombre-id')
										.setDescription('ID numérica del torneo.')
										.setAutocomplete(true)
										.setRequired(true)
								)
						)
				)
				.addSubcommandGroup(blocklist =>
					blocklist.setName("blocklist")
						.setDescription('Comandos de blocklist')
						.addSubcommand(add =>
							add.setName('añadir')
								.setDescription('Añade a un usuario a la blocklist.')
								.addUserOption(id =>
									id.setName('user-id')
										.setDescription('El usuario al cual quieres bloquear de los comandos del bot.')
										.setRequired(true)

								)
								.addStringOption(reason =>
									reason.setName('razón')
										.setDescription('La razón para añadir a este usuario a la blocklist.')
										.setMaxLength(300)
										.setRequired(true)
								)
						)
						.addSubcommand(remove =>
							remove.setName('quitar')
								.setDescription('La id del usuario que quieres bloquear para que el bot ignore.')
								.addUserOption(id =>
									id.setName('user-id')
										.setDescription('El usuario al cual quieres quitar de la blocklist.')
										.setRequired(true)
								)
						))
		}), {
			guildIds: ["941843371062861855"],
			idHints: ["1197049186252759070"],
		}
	}

	public async TournamentInfo(interaction: Subcommand.ChatInputCommandInteraction) {
		// Your code goes here
		const idTorneo = +interaction.options.getString('nombre-id', true)

		const tournament = await GetTournament(idTorneo)
		if (!tournament) return void await interaction.reply({
			embeds: [
				PrettyMsg({
					description: CommonMessages.Tournament.NotFound,
					color: Colors.Blue
				})
			]
		})

		return void await interaction.reply({
			content: `Aquí está la información del torneo **${tournament.name}**`,
			embeds: [TournamentDetailsEmbed(tournament)],
			ephemeral: true
		})
	}

	public async chatInputAddToBlocklist(interaction: Subcommand.ChatInputCommandInteraction) {
		// Your code goes here
		const options = {
			target: interaction.options.getUser('user-id', true),
			reason: interaction.options.getString('reason', true),
		}

		await BlockUser(options.target.id, options.reason)

		return void await interaction.reply({
			embeds: [PrettyMsg(
				{
					description: CommonMessages.Blocklist.Add.replace('{username}', options.target.displayName),
					color: Colors.Green,
					footer: {
						text: options.target.id
					}
				}
			)],
			ephemeral: true
		})
	}

	public async chatInputRemoveFromBlocklist(interaction: Subcommand.ChatInputCommandInteraction) {
		const options = {
			target: interaction.options.getUser('user-id', true)
		}

		await UnblockUser(options.target.id)

		return void await interaction.reply({
			embeds: [PrettyMsg({
				description: CommonMessages.Blocklist.Remove.replace('{username}', options.target.username),
				color: Colors.Green,
				footer: {
					text: options.target.id
				}
			})],
			ephemeral: true
		})
	}

}
