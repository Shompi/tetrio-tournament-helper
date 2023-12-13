import { InteractionHandler, InteractionHandlerTypes } from '@sapphire/framework';
import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, Colors, ComponentType, EmbedBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } from "discord.js"
import { PlayerModel, Tournament, TournamentModel, TournamentStatus } from '../sequelize/Tournaments.js';
import { GenerateTetrioAvatarURL, GetUserDataFromTetrio, GetUserProfileURL, TetrioUserData } from '../helper-functions/index.js';
import { TournamentDetailsEmbed } from "../helper-functions/index.js";
import { AddTetrioPlayerToDatabase } from '../helper-functions/index.js';
import { RunTetrioTournamentRegistrationChecks } from '../helper-functions/index.js';

export class ParseExampleInteractionHandler extends InteractionHandler {
	public constructor(ctx: InteractionHandler.LoaderContext, options: InteractionHandler.Options) {
		super(ctx, { interactionHandlerType: InteractionHandlerTypes.Button });
	}

	public async run(interaction: ButtonInteraction<'cached'>, tournamentId: string) {


		const torneo = await TournamentModel.findOne({
			where: {
				id: +tournamentId
			}
		})

		if (!torneo) return void await interaction.reply({ content: 'Este torneo no existe.', ephemeral: true });

		if (torneo.status === TournamentStatus.CLOSED) return void await interaction.reply({ content: 'No puedes inscribirte en este torneo por que ya ha cerrado.', ephemeral: true })

		if (torneo.game === "TETRIO") {
			return void await HandleTetrioRegistration(interaction, torneo);
		}

	}

	public parse(interaction: ButtonInteraction) {
		// Only handle checkin interaction from buttons
		if (interaction.customId.startsWith('t-register-')) {
			return this.some(interaction.customId.split("-")[2]);
		}

		return this.none();
	}
}


async function HandleTetrioRegistration(interaction: ButtonInteraction<'cached'>, torneo: Tournament) {

	// Check if the player is already in our database
	const playerData = await PlayerModel.findOne({
		where: {
			discord_id: interaction.user.id
		}
	})

	if (!playerData) {
		void await HandleNewPlayerRegistration(interaction, torneo)
	} else {
		void await AddPlayerIdToTournamentPlayerList(interaction, torneo)
	}

	// Update the message with the new details
	return void await interaction.message.edit({
		embeds: [TournamentDetailsEmbed(torneo)]
	})
}

async function HandleNewPlayerRegistration(interaction: ButtonInteraction<'cached'>, torneo: Tournament): Promise<void> {

	/** Interaction has not been deferred at this point */

	// show the modal
	const TetrioModal = new ModalBuilder()
		.setCustomId(`${interaction.user.id}-tetrio-profile`)
		.setTitle(`Inscripción para torneo de TETRIO`)
		.addComponents(
			new ActionRowBuilder<TextInputBuilder>()
				.setComponents(
					new TextInputBuilder()
						.setStyle(TextInputStyle.Short)
						.setCustomId('tetrio-username')
						.setLabel("Tu username de TETRIO")
						.setPlaceholder("USERNAME")
						.setMaxLength(50)
						.setMinLength(1)
						.setRequired(true),
					new TextInputBuilder()
						.setStyle(TextInputStyle.Short)
						.setCustomId('challonge-username')
						.setLabel('Tu username de challonge (Opcional)')
						.setPlaceholder("TetrisMaster_123")
						.setMaxLength(50)
				)
		)

	await interaction.showModal(TetrioModal)

	const modalSubmition = await interaction.awaitModalSubmit(
		{
			time: 60_000 * 2,
			filter: (modalInteraction) => modalInteraction.customId.startsWith(interaction.user.id),
		}
	).catch(() => null);

	// Interaction expired.
	if (!modalSubmition) return;

	await modalSubmition.deferReply({ ephemeral: true })

	const tetrioUsername = modalSubmition.fields.getTextInputValue('tetrio-username')
	const challongeUsername = modalSubmition.fields.getTextInputValue('challonge-username')

	const userData = await GetUserDataFromTetrio(tetrioUsername)

	if (!userData) return void await modalSubmition.editReply({ content: `No encontré a ningún usuario de TETRIO con el username ${tetrioUsername}. Asegúrate de escribirlo correctamente y presiona el botón de inscripción nuevamente para volver a comenzar.` })

	const avatarUrl = GenerateTetrioAvatarURL(userData.user._id, userData.user.avatar_revision)

	const profileEmbed = new EmbedBuilder()
		.setDescription(
			`**Username**: ${userData.user.username.toUpperCase()}`
			+ `\n**Rank**: ${userData.user.league.rank.toUpperCase()}`
			+ `\n**Rating**: ${userData.user.league.rating.toFixed(2)}`
			+ `\n**Bio**: ${userData.user.bio ?? "No bio."}`
			+ `\n\n[Enlace al perfil](${GetUserProfileURL(userData.user.username)})`
		)
		.setColor(Colors.Blue)

	if (avatarUrl) {
		profileEmbed.setThumbnail(avatarUrl)
	}

	const confirmButton = new ButtonBuilder()
		.setCustomId(`t-profile-confirm`)
		.setLabel("Si")
		.setEmoji("✅")
		.setStyle(ButtonStyle.Secondary)

	const retryButton = new ButtonBuilder()
		.setCustomId(`t-profile-retry`)
		.setLabel("No")
		.setEmoji("❌")
		.setStyle(ButtonStyle.Secondary)

	const cancelButton = new ButtonBuilder()
		.setCustomId(`t-profile-cancel`)
		.setLabel("Cancelar inscripción")
		.setStyle(ButtonStyle.Danger)

	const confirmOrDenyRow = new ActionRowBuilder<ButtonBuilder>()
		.setComponents(confirmButton, retryButton)

	const cancelRow = new ActionRowBuilder<ButtonBuilder>()
		.setComponents(cancelButton)

	// Interaction is deferred at this point
	const profileReply = await modalSubmition.editReply({
		content: '¿Es este tu perfil de TETRIO?',
		embeds: [profileEmbed],
		components: [confirmOrDenyRow, cancelRow]
	})

	const pressedButton = await profileReply.awaitMessageComponent({
		componentType: ComponentType.Button,
		filter: (bInteraction) => bInteraction.message.id === profileReply.id && ["t-profile-confirm", "t-profile-retry", "t-profile-cancel"].includes(bInteraction.customId),
		time: 60_000 * 2,

	}).catch(() => null);

	if (!pressedButton) return void await modalSubmition.editReply({
		content: 'La interacción ha expirado, si quieres continuar con el proceso, por favor presiona el boton de inscripción nuevamente.',
		components: [],
		embeds: [],
	})

	if (pressedButton.customId === "t-profile-cancel") {
		return void await pressedButton.update({
			content: 'La interacción ha sido cancelada.\nSi quieres comenzar le proceso de inscripción de nuevo, debes presionar nuevamente el botón.',
			components: [],
			embeds: []
		})
	}

	if (pressedButton.customId === "t-profile-retry") {
		// We basically need to run all this process again.
		return void HandleNewPlayerRegistration(pressedButton, torneo)
	}

	if (pressedButton.customId === 't-profile-confirm') {

		void await AddTetrioPlayerToDatabase({ discordId: interaction.user.id, tetrioId: userData.user.username }, userData)

		const result = await RunTetrioTournamentRegistrationChecks(userData, torneo, interaction.user.id)

		if (!result.allowed) {
			if (!interaction.replied) {
				return void await interaction.reply({
					content: `No puedes inscribirte en este torneo.\nRazón: ${result.reason}`,
					ephemeral: true,
				})
			}

			return void await interaction.update({
				content: `No puedes inscribirte en este torneo.\nRazón: ${result.reason}`,
				components: [],
				embeds: []
			})
		}

		return void await AddPlayerIdToTournamentPlayerList(pressedButton, torneo)
	}
}

async function AddPlayerIdToTournamentPlayerList(interaction: ButtonInteraction<'cached'>, tournament: Tournament) {


	// Add player to the tournament
	console.log(`[TOURNAMENT] Añadiendo nuevo jugador ${interaction.user.id} (${interaction.user.username}) al torneo ${tournament.name}`);

	const playerList = Array.from(tournament.players)

	playerList.push(interaction.user.id)

	await tournament.update({
		players: playerList
	})

	console.log("[TOURNAMENT] El jugador ha sido añadido a la lista");
	console.log("[TOURNAMENT] El torneo ha sido guardado");
	console.log("[ACTION ON PLAYER] Chequeando si hay roles para agregar...");

	if (tournament.add_roles.length > 0) {
		await interaction.member.roles.add(tournament.add_roles)
		console.log(`[ACTION ON PLAYER] Se le agregaron ${tournament.add_roles.length} roles al jugador ${interaction.user.id}`);
	}


	/** ESTO SE TIENE QUE BORRAR MAS TARDE, POR AHORA FORZAREMOS LA ASIGNACION DE ROLES POR ID DE TORNEO */

	// if (interaction.inCachedGuild()) {
	// 	if (torneo.id === 1) {
	// 		// Torneo avanzado Role Torneo Chile
	// 		await interaction.member.roles.add("1180723107145723934")
	// 	}

	// 	if (torneo.id === 2) {
	// 		// Torneo Amateur
	// 		await interaction.member.roles.add("1180723237399834715")
	// 	}
	// }

	/** ----------------------- */



	if (!interaction.replied) {
		return void await interaction.reply({
			ephemeral: true,
			content: `¡Te has inscrito exitósamente al torneo **${tournament.name}**!`,
			embeds: [],
			components: []
		})
	}

	return void await interaction.update({
		content: `Te has inscrito en el torneo **${tournament.name}** exitósamente!`,
		components: [],
		embeds: []
	})
}


