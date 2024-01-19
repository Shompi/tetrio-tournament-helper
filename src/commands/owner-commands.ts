import { Subcommand } from "@sapphire/plugin-subcommands";
import { Colors, PermissionFlagsBits } from "discord.js";
import { GetTournament, PrettyMsg, SearchTournamentById, SearchTournamentByNameAutocomplete, TournamentDetailsEmbed } from "../helper-functions/index.js";
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
				}
			]
		});
	}

	public override registerApplicationCommands(registry: Subcommand.Registry) {
		registry.registerChatInputCommand((builder) => {
			builder //
				.setName('dev')
				.setDescription('Comandos de desarrollador')
				.setDMPermission(false)
				.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
				.addSubcommandGroup(tournaments =>
					tournaments.setName('tournament')
						.setDescription('Comandos de torneos')
						.addSubcommand(info =>
							info.setName('info')
								.setDescription('Información general de un torneo')
								.addStringOption(id =>
									id.setName('nombre-id')
										.setDescription('ID numérica del torneo')
										.setAutocomplete(true)
										.setRequired(true)
								)
						)
				)
		}, {
			idHints: ["1197049186252759070"],
			guildIds: ["941843371062861855"],
		})
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
}
