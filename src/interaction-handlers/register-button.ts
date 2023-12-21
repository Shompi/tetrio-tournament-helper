import { InteractionHandler, InteractionHandlerTypes } from '@sapphire/framework';
import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, ComponentType, ModalBuilder, TextInputBuilder, TextInputStyle } from "discord.js"
import { Tournament, TournamentModel, TournamentStatus } from '../sequelize/Tournaments.js';
import { GetPlayerFromDatabase, GetTournamentFromGuild, GetUserDataFromTetrio, TetrioUserProfileEmbed } from '../helper-functions/index.js';
import { TournamentDetailsEmbed } from "../helper-functions/index.js";
import { AddTetrioPlayerToDatabase } from '../helper-functions/index.js';
import { RunTetrioTournamentRegistrationChecks } from '../helper-functions/index.js';
import { AddPlayerToTournamentPlayerList } from '../helper-functions/index.js';

export class RegisterButtonHandler extends InteractionHandler {
	public constructor(ctx: InteractionHandler.LoaderContext, options: InteractionHandler.Options) {
		super(ctx, { interactionHandlerType: InteractionHandlerTypes.Button });
	}

	public async run(interaction: ButtonInteraction<'cached'>, tournamentId: string) {


		const tournament = await GetTournamentFromGuild(interaction.guildId, +tournamentId)

		if (!tournament) return void await interaction.reply({ content: 'Este torneo no existe.', ephemeral: true });

		if (tournament.status === TournamentStatus.CLOSED) return void await interaction.reply({ content: 'No puedes inscribirte en este torneo por que ya ha cerrado.', ephemeral: true })

		if (tournament.game === "TETRIO") {
			return void await HandleTetrioRegistration(interaction, tournament);
		}

		// If the tournament is from a game that does not track player stats then we can just add this player to the db
		// Although I wanna add something like an SR question / modal to help seeding Tetris Effect Tournaments and add it into the data prop.

		return void await AddPlayerToTournamentPlayerList(tournament, {
			discordId: interaction.user.id,
			challongeId: null,
		})
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

	// show the modal
	const TetrioModal = BuildTetrioModal(interaction)

	await interaction.showModal(TetrioModal)

	const modalSubmition = await interaction.awaitModalSubmit(
		{
			time: 60_000 * 2,
			filter: (modalInteraction) => modalInteraction.customId.startsWith(interaction.user.id),
		}
	).catch(() => null);

	// Interaction expired.
	if (!modalSubmition) return null;

	const tetrioUsername = modalSubmition.fields.getTextInputValue('tetrio-username')
	let challongeUsername = modalSubmition.fields.getTextInputValue('challonge-username')

	const playerdata = await GetUserDataFromTetrio(tetrioUsername)

	if (!playerdata) return void await modalSubmition.reply({
		content: `El jugador ${tetrioUsername} no existe. Verifica que hayas escrito el nombre de manera correcta.`,
		ephemeral: true
	})

	const profileEmbed = TetrioUserProfileEmbed(playerdata)

	const confirmButton = new ButtonBuilder()
		.setCustomId(`t-profile-confirm`)
		.setLabel("Si")
		.setEmoji("✅")
		.setStyle(ButtonStyle.Secondary)

	const cancelButton = new ButtonBuilder()
		.setCustomId(`t-profile-cancel`)
		.setLabel("Cancelar inscripción")
		.setStyle(ButtonStyle.Danger)

	const confirmOrDenyRow = new ActionRowBuilder<ButtonBuilder>()
		.setComponents(confirmButton)

	const cancelRow = new ActionRowBuilder<ButtonBuilder>()
		.setComponents(cancelButton)

	// Interaction is deferred at this point
	const profileReply = await modalSubmition.reply({
		content: '¿Es este tu perfil de TETRIO?',
		embeds: [profileEmbed],
		components: [confirmOrDenyRow, cancelRow],
		ephemeral: true
	})

	const pressedButton = await profileReply.awaitMessageComponent({
		componentType: ComponentType.Button,
		filter: (bInteraction) => bInteraction.message.id === profileReply.id && ["t-profile-confirm", "t-profile-retry", "t-profile-cancel"].includes(bInteraction.customId),
		time: 60_000 * 2,

	}).catch(() => null);

	if (!pressedButton) {
		return void await profileReply.edit({
			content: 'La interacción ha expirado, si quieres continuar con el proceso, por favor presiona el boton de inscripción nuevamente.',
			components: [],
			embeds: [],
		})
	}

	if (pressedButton.customId === "t-profile-cancel") {
		return void await pressedButton.update({
			content: 'La interacción ha sido cancelada.\nSi quieres comenzar el proceso de inscripción de nuevo, debes presionar nuevamente el botón.',
			components: [],
			embeds: []
		})
	}

	if (pressedButton.customId === 't-profile-confirm') {
		// Run tournament checks
		const check = await RunTetrioTournamentRegistrationChecks(playerdata, tournament, interaction.user.id)

		if (!check.allowed) {
			return void await interaction.reply({
				content: `No te puedes inscribir en este torneo.\nRazón: **${check.reason}**`,
				ephemeral: true
			})
		}

		void await AddPlayerToTournamentPlayerList(tournament, {
			discordId: interaction.user.id,
			challongeId: challongeUsername,
			data: playerdata
		})

		void await interaction.reply({ content: '✅ !Has sido añadido exitosamente al torneo!', ephemeral: true })
		// Update the message with the new details
		return void await interaction.message.edit({
			embeds: [TournamentDetailsEmbed(tournament)]
		})
	}
}

function BuildGeneralRegistrationModal(interaction: ButtonInteraction<'cached'>) {
	return new ModalBuilder()
		.setCustomId(`${interaction.user.id}-registration`)
		.setTitle(`Inscripción para torneo`)
		.addComponents(
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
		);
}

function BuildTetrisEffectModal(interaction: ButtonInteraction<'cached'>) {
	return new ModalBuilder()
		.setCustomId(`${interaction.user.id}-registration`)
		.setTitle(`Inscripción para torneo de Tetris Effect`)
		.addComponents(
			new ActionRowBuilder<TextInputBuilder>()
				.setComponents(
					new TextInputBuilder()
						.setStyle(TextInputStyle.Short)
						.setCustomId('challonge-username')
						.setLabel("Tu username de Challonge o Email")
						.setPlaceholder("...")
						.setMaxLength(50)
						.setRequired(false)
				),
			new ActionRowBuilder<TextInputBuilder>()
				.setComponents(
					new TextInputBuilder()
						.setStyle(TextInputStyle.Short)
						.setCustomId('tec-skillrate')
						.setLabel('Tu SR / RH / RATE')
						.setPlaceholder("1234")
						.setMaxLength(10)
						.setRequired(false)
				)
		);
}

function BuildTetrioModal(interaction: ButtonInteraction<"cached">) {
	return new ModalBuilder()
		.setCustomId(`${interaction.user.id}-registration`)
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
						.setRequired(true)
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
		);
}
