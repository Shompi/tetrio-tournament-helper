import { Command } from "@sapphire/framework";
import { PermissionsBitField } from "discord.js";
import { TournamentModel, TournamentStatus } from "../sequelize/index.js";
import { GameName, TetrioRanksArray } from "../helper-functions/index.js";
import { TournamentDetailsEmbed } from "../helper-functions/index.js";
export class CreateTournament extends Command {

	public constructor(context: Command.LoaderContext, options: Command.Options) {
		super(context, { ...options });
	}

	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand((builder) => {

			builder.setName("crear")
				.setDMPermission(false)
				.setNameLocalizations({
					"en-US": "create"
				})
				.setDescription("Abre las inscripciones para un torneo")
				.setDescriptionLocalizations({
					"en-US": "Create a new tournament"
				})
				.setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator)
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
								value: "TETRIO",
							},
							{
								name: "Tetris Effect: Connected",
								value: "Tetris Effect: Connected",
							},
							{
								name: "Puyo Puyo Tetris",
								value: "Puyo Puyo Tetris"
							},
							{
								name: "Puyo Puyo Tetris 2",
								value: "Puyo Puyo Tetris 2"
							}
						)
						.setRequired(true)
				)
				/** TODO: Add choices for skill cap */
				.addStringOption(rankCap =>
					rankCap.setName('rank_cap')
						.setDescription('El rank máximo que pueden tener los jugadores (SOLO TETRIO)')
						.setDescriptionLocalizations({
							"en-US": "The highest rank allowed to join this tournament (TETRIO ONLY)"
						})
						.addChoices(...TetrioRanksArray.map(rank => ({ name: rank.toUpperCase(), value: rank })))
				)
				.addIntegerOption(trCap =>
					trCap.setName('tr_cap')
						.setDescription('El cap de TR para este torneo (1 - 25000) (SOLO TETRIO)')
						.setMinValue(1)
						.setMaxValue(25000)
				)
				.addStringOption(countryLock =>
					countryLock.setName('pais')
						.setDescription('El pais al cual está cerrado este torneo (ej: CL, AR, US) (TETRIO ONLY)')
						.setMaxLength(2)
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

		/** Only accept tournament creation from guilds */
		if (!interaction.inCachedGuild()) return;

		const options = {
			name: interaction.options.getString("nombre", true),
			game: interaction.options.getString("juego", true) as GameName,
			rank_cap: interaction.options.getString('rank_cap', false),
			tr_cap: interaction.options.getInteger('tr_cap', false),
			country_lock: interaction.options.getString('pais', false),
			max_players: interaction.options.getInteger('maximo-jugadores', false),
		}

		try {

			/** Tournaments are only going to be either OPEN for registration or CLOSED */

			const createdTournament = await TournamentModel.create({
				organized_by: interaction.user.id,
				guild_id: interaction.guildId,
				name: options.name,
				game: options.game,
				is_rank_capped: !!options.rank_cap,
				rank_cap: options.rank_cap,
				is_country_locked: !!options.country_lock,
				country_lock: options.country_lock,
				is_tr_capped: !!options.tr_cap,
				tr_cap: options.tr_cap,
				max_players: options.max_players,
				players: [],
				status: TournamentStatus.OPEN,
			})

			return void await interaction.reply({ content: "El torneo ha sido creado exitosamente.", embeds: [TournamentDetailsEmbed(createdTournament)] })
		} catch (e) {
			return void await interaction.reply({ content: 'Ocurrió un error intentando crear este torneo.', ephemeral: true })
		}

	}
}