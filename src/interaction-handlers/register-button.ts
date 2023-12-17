import { InteractionHandler, InteractionHandlerTypes } from '@sapphire/framework';
import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, ComponentType, ModalBuilder, TextInputBuilder, TextInputStyle } from "discord.js"
import { PlayerModel, Tournament, TournamentModel, TournamentStatus } from '../sequelize/Tournaments.js';
import { GetPlayerFromDatabase, GetUserDataFromTetrio, TetrioUserProfileEmbed } from '../helper-functions/index.js';
import { TournamentDetailsEmbed } from "../helper-functions/index.js";
import { AddTetrioPlayerToDatabase } from '../helper-functions/index.js';
import { RunTetrioTournamentRegistrationChecks } from '../helper-functions/index.js';
import { AddPlayerToTournamentPlayerList } from '../helper-functions/index.js';

export class RegisterButtonHandler extends InteractionHandler {
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


async function HandleTetrioRegistration(interaction: ButtonInteraction<'cached'>, tournament: Tournament) {

	// Check if the player is already in our database
	const playerData = await GetPlayerFromDatabase(interaction.user.id)

	if (!playerData) {
		void await HandleNewPlayerRegistration(interaction, tournament)
	} else {
		const check = await RunTetrioTournamentRegistrationChecks(playerData.data, tournament, interaction.user.id)

		if (!check.allowed) {
			return void await interaction.reply({
				content: `No te puedes inscribir en este torneo.\nRazón: ${check.reason}`,
				ephemeral: true
			})
		}

		void await AddPlayerToTournamentPlayerList(tournament, interaction.user.id, playerData.challonge_id)
		void await interaction.reply({ content: '✅ !Has sido añadido exitosamente al torneo!', ephemeral: true })
	}
	// Update the message with the new details
	return void await interaction.message.edit({
		embeds: [TournamentDetailsEmbed(tournament)]
	})
}

async function HandleNewPlayerRegistration(interaction: ButtonInteraction<'cached'>, tournament: Tournament): Promise<void> {

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
				),
			new ActionRowBuilder<TextInputBuilder>()
				.setComponents(
					new TextInputBuilder()
						.setStyle(TextInputStyle.Short)
						.setCustomId('challonge-username')
						.setLabel('Tu username de challonge (Opcional)')
						.setPlaceholder("TetrisMaster_123")
						.setMaxLength(50)
						.setRequired(false)
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
	let challongeUsername: string | null = modalSubmition.fields.getTextInputValue('challonge-username')

	const userData = await GetUserDataFromTetrio(tetrioUsername)

	if (!userData) return void await modalSubmition.editReply({ content: `No encontré a ningún usuario de TETRIO con el username ${tetrioUsername}. Asegúrate de escribirlo correctamente y presiona el botón de inscripción nuevamente para volver a comenzar.` })

	const profileEmbed = TetrioUserProfileEmbed(userData)

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

	if (!pressedButton) return void await profileReply.edit({
		content: 'La interacción ha expirado, si quieres continuar con el proceso, por favor presiona el boton de inscripción nuevamente.',
		components: [],
		embeds: [],
	})

	if (pressedButton.customId === "t-profile-cancel") {
		return void await pressedButton.update({
			content: 'La interacción ha sido cancelada.\nSi quieres comenzar el proceso de inscripción de nuevo, debes presionar nuevamente el botón.',
			components: [],
			embeds: []
		})
	}

	if (pressedButton.customId === "t-profile-retry") {
		// We basically need to run all this process again.
		return void HandleNewPlayerRegistration(pressedButton, tournament)
	}

	if (pressedButton.customId === 't-profile-confirm') {

		if (challongeUsername.length === 0)
			challongeUsername = null

		void await AddTetrioPlayerToDatabase({ discordId: interaction.user.id, tetrioId: userData.username, challongeId: challongeUsername }, userData)

		const result = await RunTetrioTournamentRegistrationChecks(userData, tournament, interaction.user.id)

		if (!result.allowed) {
			return void await interaction.update({
				content: `No puedes inscribirte en este torneo.\nRazón: ${result.reason}`,
			})
		}
	}

	// User passed the checks and can be added to the tournament
	void await AddPlayerToTournamentPlayerList(tournament, interaction.user.id, challongeUsername)

	console.log("[ACTION ON PLAYER] Chequeando si hay roles para agregar...");

	// Add corresponding roles to the player
	if (tournament.add_roles.length > 0) {
		await pressedButton.member.roles.add(tournament.add_roles)
		console.log(`[ACTION ON PLAYER] Se le agregaron ${tournament.add_roles.length} roles al jugador ${interaction.user.id}`);
	}

	return void await pressedButton.update({
		content: `Te has inscrito en el torneo **${tournament.name}** exitósamente!`,
		components: [],
		embeds: []
	})
}