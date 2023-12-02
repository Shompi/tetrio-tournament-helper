import { InteractionHandler, InteractionHandlerTypes } from '@sapphire/framework';
import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, Colors, ComponentType, EmbedBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } from "discord.js"
import { PlayerModel, Tournament, TournamentModel, TournamentStatus } from '../sequelize/index.js';
import { GenerateTetrioAvatarURL, GetUserDataFromTetrio, GetUserProfileURL } from '../helper-functions/index.js';

export class ParseExampleInteractionHandler extends InteractionHandler {
	public constructor(ctx: InteractionHandler.LoaderContext, options: InteractionHandler.Options) {
		super(ctx, { interactionHandlerType: InteractionHandlerTypes.Button });
	}

	public async run(interaction: ButtonInteraction, tournamentId: string) {


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
		if (!interaction.customId.startsWith('t-checkin-')) return this.none();

		// Here we return a `Some` as said above, in this case passing 9001 to it
		// which we get back in the `run` method as the awesomneness level
		return this.some(interaction.customId.split("-")[2]);
	}
}


async function HandleTetrioRegistration(interaction: ButtonInteraction, torneo: Tournament) {

	// Check if the player is already in our database
	const playerData = await PlayerModel.findOne({
		where: {
			discord_id: interaction.user.id
		}
	})

	if (!playerData)
		return void await HandleNewPlayerRegistration(interaction, torneo)

}

async function HandleNewPlayerRegistration(interaction: ButtonInteraction, torneo: Tournament): Promise<void> {

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
						.setPlaceholder("username")
						.setMaxLength(50)
						.setMinLength(1)
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

	const userData = await GetUserDataFromTetrio(tetrioUsername)

	if (!userData) return void await modalSubmition.editReply({ content: `No encontré a ningún usuario de TETRIO con el username ${tetrioUsername}. Asegúrate de escribirlo correctamente y presiona el botón de inscripción nuevamente para volver a comenzar.` })

	const avatarUrl = GenerateTetrioAvatarURL(userData.user._id, userData.user.avatar_revision)

	const profileEmbed = new EmbedBuilder()
		.setDescription(
			`**Username**: ${userData.user.username.toUpperCase()}`
			+ `\n**Rank**: ${userData.user.league.rank.toUpperCase()}`
			+ `\n**Rating**: ${userData.user.league.rating.toFixed(2)}`
			+ `\n**Bio**: ${userData.user.bio ?? "No bio."}`
			+ `\n\n**Enlace al perfil**: ${GetUserProfileURL(userData.user.username)}`
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

	const cancelButton = new ButtonBuilder()
		.setCustomId(`t-profile-cancel`)
		.setLabel("No")
		.setEmoji("❌")
		.setStyle(ButtonStyle.Secondary)

	const confirmOrDenyRow = new ActionRowBuilder<ButtonBuilder>()
		.setComponents(confirmButton, cancelButton)

	// Interaction is deferred at this point
	const profileReply = await modalSubmition.editReply({
		content: '¿Es este tu perfil de TETRIO?',
		embeds: [profileEmbed],
		components: [confirmOrDenyRow]
	})

	const pressedButton = await profileReply.awaitMessageComponent({
		componentType: ComponentType.Button,
		filter: (bInteraction) => bInteraction.message.id === profileReply.id && ["t-profile-confirm", "t-profile-cancel"].includes(bInteraction.customId),
		time: 60_000 * 2,

	}).catch(() => null);

	if (!pressedButton) return void await modalSubmition.editReply({
		content: 'La interacción ha expirado, si quieres continuar con el proceso, por favor presiona el boton de inscripción nuevamente.',
		components: [],
		embeds: [],
	})

	if (pressedButton.customId === "t-profile-cancel") {
		// We basically need to run all this process again.
		return void HandleNewPlayerRegistration(pressedButton, torneo)
	}

	if (pressedButton.customId === 't-profile-confirm') {
		return void await pressedButton.update({
			content: 'Te has registrado en el torneo exitosamente! (Mentira, aun no está implementado)',
			components: [],
			embeds: []
		})
	}
}