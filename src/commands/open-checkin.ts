import { Command } from "@sapphire/framework"
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, GuildTextBasedChannel, PermissionFlagsBits, TextChannel } from "discord.js";
import { GetTournamentFromGuild, SearchTournamentByNameAutocomplete } from "../helper-functions/index.js";
import { TournamentStatus } from "../sequelize/Tournaments.js";

export class OpenCheckin extends Command {

	public constructor(context: Command.LoaderContext, options: Command.Options) {
		super(context, { ...options });
	}

	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand((builder) => {
			builder.setName("abrir-checkin")
				.setDescription("Abre el proceso de Check-in para un torneo")
				.setDMPermission(false)
				.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
				.addStringOption(tournamentId =>
					tournamentId.setName('nombre-id')
						.setDescription('La id del torneo o una de las opciones del autocompletado')
						.setRequired(true)
						.setAutocomplete(true)
				)
				.addChannelOption(channel =>
					channel.setName('canal')
						.setDescription('Canal en el cual se abrirá el Thread para iniciar el proceso de check-in')
						.setRequired(true)
						.addChannelTypes(ChannelType.GuildText)
				)
		}, { idHints: ["1184671678698115203"] })


	}
	public async chatInputRun(interaction: Command.ChatInputCommandInteraction<'cached'>) {
		// Your code goes here

		const options = {
			channel: interaction.options.getChannel('canal', true) as TextChannel,
			idTorneo: +interaction.options.getString('nombre-id', true)
		}

		if (isNaN(options.idTorneo))
			return void await interaction.reply({ content: 'Debes ingresar la id numérica de un torneo o **usar una de las opciones del autocompletado**.' })

		const tournament = await GetTournamentFromGuild(interaction.guildId, options.idTorneo)

		if (!tournament) return void await interaction.reply({ content: "El mensaje no ha sido enviado por que el torneo no existe." })

		if (tournament.status === TournamentStatus.FINISHED)
			return void await interaction.reply({ content: '❌ No puedes abrir el checkin de un torneo que ya está **FINALIZADO**' })

		await interaction.deferReply()

		try {

			// Create the thread
			const thread = await options.channel.threads.create({
				name: 'Check In',
			})

			const CheckinButton = new ButtonBuilder()
				.setLabel('Check In')
				.setStyle(ButtonStyle.Primary)
				.setEmoji("➡️")
				.setCustomId(`checkin-${tournament.id}`)

			const CheckinRow = new ActionRowBuilder<ButtonBuilder>()
				.setComponents(CheckinButton)

			const checkinMessage = await thread.send({
				content: `¡Presiona el botón de abajo para completar el Check-In en el torneo **${tournament.name}**!`,
				components: [CheckinRow]
			})

			tournament.is_checkin_open = true
			tournament.status = TournamentStatus.CLOSED
			tournament.checkin_channel = options.channel.id
			tournament.checkin_threadId = thread.id
			tournament.checkin_message = checkinMessage.id

			console.log(`[CHECKIN] Guardando mensaje de checkin para el torneo ${tournament.game}`);

			await tournament.save()

			console.log(`[CHECKIN] El mensaje ha sido guardado en el torneo.`);

			return void await interaction.editReply({
				content: `✅ ¡El mensaje ha sido enviado en el hilo ${thread}!`
			})
		} catch (e) {
			console.log(e)

			return void await interaction.editReply({
				content: '❌ Ocurrió un error con esta interacción.'
			})
		}


	}

	public async autocompleteRun(interaction: Command.AutocompleteInteraction<'cached'>) {
		if (interaction.options.getFocused(true).name === 'nombre-id')
			return void await SearchTournamentByNameAutocomplete(interaction)
	}
}