import { Command } from "@sapphire/framework";
import { Locale } from "discord.js";

export class CreateTournament extends Command {

	public constructor(context: Command.LoaderContext, options: Command.Options) {
		super(context, { ...options });
	}

	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand((builder) => {

			builder.setName("crear")
				.setNameLocalizations({
					"en-US": "create"
				})
				.setDescription("Abre las inscripciones para un torneo")
				.setDescriptionLocalizations({
					"en-US": "Create a new tournament"
				})
				.addStringOption(name =>
					name.setName('nombre')
						.setNameLocalizations({
							"en-US": "name",
						})
						.setDescription('Nombre del torneo')
						.setDescriptionLocalizations({
							"en-US": "The name of the tournament"
						})
						.setRequired(true)
				)
				.addStringOption(game =>
					game.setName('juego')
						.setNameLocalizations({
							"en-US": "game"
						})
						.setDescription("El juego que se usará en este torneo")
						.setDescriptionLocalizations({
							"en-US": "The game that will be played in this tournament"
						})
						.setChoices(
							{
								name: "TETRIO",
								value: "tetrio",
							},
							{
								name: "Tetris Effect: Connected",
								value: "tec",
							},
							{
								name: "Puyo Puyo Tetris",
								value: "ppt1"
							},
							{
								name: "Puyo Puyo Tetris 2",
								value: "ppt2"
							}
						)
						.setRequired(true)
				)
				/** TODO: Add choices for skill cap */
				.addStringOption(skillCap =>
					skillCap.setName('rank-cap')
						.setDescription('El rank máximo que pueden tener los jugadores (SOLO PARA TETRIO)')
						.setDescriptionLocalizations({
							"en-US": "The highest rank allowed to join this tournament (TETRIO ONLY)"
						})
				)
				/** TODO: Add maximum and minimum values */
				.addIntegerOption(maxPlayers =>
					maxPlayers.setName('maximo-jugadores')
						.setNameLocalizations({
							"en-US": 'max-players'
						})
						.setDescription('Máximo de jugadores que pueden inscribirse en este torneo')
						.setDescriptionLocalizations({
							"en-US": "Maximum number of players that can join this tournament"
						})
				)
		}, { idHints: ["1178881110046941236"] })
	}

	public async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		switch (interaction.locale) {
			case Locale.EnglishUS:
				return void await interaction.reply({ content: "This command has not been implemented yet.", ephemeral: true });
			case Locale.SpanishES:
				return void await interaction.reply({ content: "Este comando aún no está implementado.", ephemeral: true });
		}
	}
}