import { Subcommand } from "@sapphire/plugin-subcommands"
import { PermissionFlagsBits } from "discord.js"
import { SearchTournamentById, SearchTournamentByNameAutocomplete } from "../helper-functions/index.js";
import { TournamentStatus } from "../sequelize/index.js";

export class ForceCommands extends Subcommand {


	public constructor(context: Subcommand.LoaderContext, options: Subcommand.Options) {
		super(context, {
			...options,
			subcommands: [
				{
					name: 'inscripcion',
					chatInputRun: 'chatInputForzarInscripcion'
				},
				{
					name: 'desinscripcion',
					chatInputRun: 'chatInputForzarDesinscripcion'
				}
			],
		});
	}


	public override registerApplicationCommands(registry: Subcommand.Registry) {
		registry.registerChatInputCommand((builder) => {
			builder.setName("forzar")
				.setDescription('Comandos de administrador para forzar acciones en algunas situaciones')
				.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
				.addSubcommand(register =>
					register.setName('inscripcion')
						.setDescription('Forza la inscripción de un jugador en un torneo (TETRIO)')


				)
				.addSubcommand(unregister =>
					unregister.setName('desinscripcion')
						.setDescription('Elimina la inscripción de un jugador de un torneo')
						.addStringOption(dId =>
							dId.setName('discord-id')
								.setDescription('ID de Discord del jugador que quieres quitar del torneo')
								.setRequired(true)
						)
						.addIntegerOption(torneoId =>
							torneoId.setName('id-torneo')
								.setDescription('ID del torneo')
								.setMinValue(1)
								.setMaxValue(100_000)
						)
						.addStringOption(tournamentName =>
							tournamentName.setName('nombre-torneo')
								.setDescription('El nombre del torneo')
								.setMaxLength(255)
								.setAutocomplete(true)
						)
				)

		}, { idHints: ["1182113989493276783"] })


	}

	public async chatInputForzarInscripcion(interaction: Subcommand.ChatInputCommandInteraction) {
		// Your code goes here
		return void await interaction.reply({ content: 'Este comando aún no está implementado.', ephemeral: true })

	}

	public async chatInputForzarDesinscripcion(interaction: Subcommand.ChatInputCommandInteraction) {
		// Your code goes here
		const idTorneo = interaction.options.getInteger('id-torneo', false) ?? interaction.options.getString('nombre-torneo', false)

		if (!idTorneo) return void await interaction.reply({ content: 'Debes ingresar la id o el nombre de algun torneo (usando las opciones del autocompletado)', ephemeral: true })

		const torneo = await SearchTournamentById(+idTorneo)

		if (!torneo) return void await interaction.reply({ content: 'No encontré ningun torneo.', ephemeral: true })
		if (torneo.status === TournamentStatus.CLOSED)
			return void await interaction.reply({ content: 'No puedes desinscribir a un jugador de un torneo que está marcado como **CLOSED**', ephemeral: true })

		const playerIds = Array.from(torneo.players)
		const playerId = interaction.options.getString('discord-id', true)
		const filteredPlayers = playerIds.filter(id => id !== playerId)

		try {
			await torneo.update('players', filteredPlayers)

			return void await interaction.reply({ content: `✅ El jugador <@${playerId}> ha sido quitado del torneo.` })
		} catch (e) {
			console.log(e);

			return void await interaction.reply({ content: 'Ocurrió un error intentando actualizar la base de datos.', ephemeral: true })

		}
	}

	public async autocompleteRun(interaction: Subcommand.AutocompleteInteraction) {
		if (interaction.options.getFocused(true).name === 'nombre-torneo')
			return void await SearchTournamentByNameAutocomplete(interaction)
	}
}