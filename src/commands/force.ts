import { Subcommand } from "@sapphire/plugin-subcommands"
import { PermissionFlagsBits } from "discord.js"
import { GetTournamentFromGuild, SearchTournamentByNameAutocomplete } from "../helper-functions/index.js";
import { TournamentStatus } from "../sequelize/Tournaments.js";
import { RemovePlayerFromTournament } from "../helper-functions/index.js";

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
				.setDMPermission(false)
				.addSubcommand(register =>
					register.setName('inscripcion')
						.setDescription('Forza la inscripción de un jugador en un torneo (TETRIO)')
						.addStringOption(nameOrId =>
							nameOrId.setName('nombre-id')
								.setDescription('ID del torneo (Puedes usar las opciones del autocompletado)')
								.setRequired(true)
								.setMaxLength(255)
								.setAutocomplete(true)
						)
						.addUserOption(discordid =>
							discordid.setName('discord-id')
								.setDescription('La id de Discord del jugador que estás inscribiendo')
								.setRequired(true)
						)
						.addStringOption(tetrioId =>
							tetrioId.setName('tetrio-id')
								.setDescription('La id o username de un jugador de TETRIO')
								.setMaxLength(100)
								.setRequired(true)
						)
				)
				.addSubcommand(unregister =>
					unregister.setName('desinscripcion')
						.setDescription('Elimina la inscripción de un jugador de un torneo')
						.addStringOption(nameOrId =>
							nameOrId.setName('nombre-id')
								.setDescription('El nombre o la Id numérica de un torneo')
								.setRequired(true)
								.setMaxLength(255)
								.setAutocomplete(true)
						)
						.addUserOption(dId =>
							dId.setName('discord-id')
								.setDescription('ID de Discord del jugador que quieres quitar del torneo')
								.setRequired(true)
						)
				)

		}, { idHints: ["1182113989493276783"] })


	}

	public async chatInputForzarInscripcion(interaction: Subcommand.ChatInputCommandInteraction) {
		// Your code goes here
		const options = {
			user: interaction.options.getUser('discord-id', true),
			tetrioId: interaction.options.getString('tetrio-id', true),
			idTorneo: +interaction.options.getString('nombre-id', true)
		}
	}

	public async chatInputForzarDesinscripcion(interaction: Subcommand.ChatInputCommandInteraction<'cached'>) {
		// Your code goes here
		const idTorneo = +interaction.options.getString('nombre-id', true)

		if (isNaN(idTorneo)) 
			return void await interaction.reply({ content: 'Debes ingresar la id o el nombre de algun torneo (usando las opciones del autocompletado)', ephemeral: true })

		const torneo = await GetTournamentFromGuild(interaction.guildId, idTorneo)

		if (!torneo) return void await interaction.reply({ content: 'No encontré ningun torneo.', ephemeral: true })
		if (torneo.status === TournamentStatus.FINISHED)
			return void await interaction.reply({ content: 'No puedes desinscribir a un jugador de un torneo que está marcado como **FINALIZADO**', ephemeral: true })

		try {
			await RemovePlayerFromTournament(torneo, interaction.options.getUser('discord-id', true).id);

			return void await interaction.reply({ content: `✅ El jugador ${interaction.options.getUser('discord-id', true)} ha sido quitado del torneo.` })
		} catch (e) {
			console.log(e);

			return void await interaction.reply({ content: 'Ocurrió un error intentando actualizar la base de datos.', ephemeral: true })

		}
	}

	public async autocompleteRun(interaction: Subcommand.AutocompleteInteraction<'cached'>) {
		if (interaction.options.getFocused(true).name === 'nombre-id')
			return void await SearchTournamentByNameAutocomplete(interaction)
	}
}