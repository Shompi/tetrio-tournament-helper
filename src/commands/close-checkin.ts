import { Command } from "@sapphire/framework"
import { GetTournamentFromGuild, SearchTournamentByNameAutocomplete } from "../helper-functions/index.js";
import { ActionRowBuilder, ButtonBuilder, ButtonComponent, PermissionFlagsBits, TextChannel } from "discord.js";
import { TournamentStatus } from "../sequelize/Tournaments.js";


export class CloseCheckin extends Command {


	public constructor(context: Command.LoaderContext, options: Command.Options) {
		super(context, { ...options });
	}


	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand((builder) => {
			builder.setName("cerrar-checkin")
				.setDMPermission(false)
				.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
				.setDescription('Cierra el proceso de check in para un torneo')
				.addStringOption(tournamentId =>
					tournamentId.setName('nombre-id')
						.setDescription('La id numérica de un torneo o una de las opciones del autocompletado')
						.setRequired(true)
						.setAutocomplete(true)
				)

		}, { idHints: ["1184670640003887157"] })


	}
	public async chatInputRun(interaction: Command.ChatInputCommandInteraction<'cached'>) {
		// Your code goes here

		const idTorneo = +interaction.options.getString('nombre-id', true)

		if (isNaN(idTorneo))
			return void await interaction.reply({ content: 'Debes ingresar la id numérica de un torneo o **usar una de las opciones del autocompletado**.' })

		const tournament = await GetTournamentFromGuild(interaction.guildId, idTorneo)

		if (!tournament) return void await interaction.editReply({ content: "No se puede cerrar el check in de este torneo por que no se ha encontrado." })

		if (tournament.status === TournamentStatus.FINISHED)
			return void await interaction.reply({ content: '❌ No puedes ejecutar esta acción en un torneo que ya está finalizado.' })

		if (!tournament.is_checkin_open)
			return void await interaction.reply({ content: '❌ El torneo no tiene un proceso de check in activo.' })

		await interaction.deferReply()

		// El check in está abierto, y debemos cerrarlo
		const checkinChannel = interaction.client.channels.cache.get(tournament.checkin_channel!) as TextChannel
		const checkinThread = await checkinChannel.threads.fetch(tournament.checkin_threadId!)

		if (!checkinThread) {
			tournament.is_checkin_open = false
			tournament.checkin_message = null
			tournament.checkin_threadId = null
			tournament.checkin_channel = null

			await tournament.save()

			return void await interaction.reply({ content: '❌ No se pudo cerrar el checkin por que el thread no existe.' })
		}

		const checkinMessage = await checkinThread.messages.fetch(tournament.checkin_message!)

		const disabledButton = ButtonBuilder.from(checkinMessage.resolveComponent(`checkin-${tournament.id}`) as ButtonComponent)
		disabledButton.setDisabled(true)
			.setCustomId('checkin-disabled')

		const newRow = new ActionRowBuilder<ButtonBuilder>()
			.setComponents(disabledButton)

		await checkinMessage.edit({
			content:'El check-in para este torneo ha finalizado.',
			components: [newRow]
		})

		return void await interaction.editReply({
			content: `✅ ¡El Check-in para el torneo **${tournament.name}** ha sido cerrado!`
		})
	}

	public async autocompleteRun(interaction: Command.AutocompleteInteraction<'cached'>) {
		if (interaction.options.getFocused(true).name === 'nombre-id')
			return void await SearchTournamentByNameAutocomplete(interaction)
	}
}