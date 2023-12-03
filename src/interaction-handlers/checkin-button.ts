import { InteractionHandler, InteractionHandlerTypes } from '@sapphire/framework';
import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, Colors, ComponentType, EmbedBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } from "discord.js"
import { Player, PlayerModel, Tournament, TournamentModel, TournamentStatus } from '../sequelize/index.js';
import { GenerateTetrioAvatarURL, GetUserDataFromTetrio, GetUserProfileURL, TetrioRanksArray, TetrioUserData } from '../helper-functions/index.js';
import { TournamentDetailsEmbed } from '../commands/consult-tournament.js';

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

	if (!playerData) {
		void await HandleNewPlayerRegistration(interaction, torneo)
	} else {
		void await ContinuePlayerRegistration(interaction, playerData.data, torneo)
	}

	// Update the message with the new details
	return void await interaction.message.edit({
		embeds: [TournamentDetailsEmbed(torneo)]
	})
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

		return void await ContinuePlayerRegistration(pressedButton, userData, torneo)

	}
}

async function ContinuePlayerRegistration(interaction: ButtonInteraction, userData: TetrioUserData, torneo: Tournament) {

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

	// Add player to the tournament
	console.log("[DEBUG] Añadiendo jugador a la lista de players del torneo...");

	const playerList = Array.from(torneo.players)

	playerList.push(interaction.user.id)

	console.log("[DEBUG] Lista de jugadores: ", playerList);

	await torneo.update({
		players: playerList
	})

	await torneo.save()
	console.log("[DEBUG] El torneo ha sido guardado");

	/** ESTO SE TIENE QUE BORRAR MAS TARDE, POR AHORA FORZAREMOS LA ASIGNACION DE ROLES POR ID DE TORNEO */

	if (interaction.inCachedGuild()) {
		if (torneo.id === 1) {
			// Torneo avanzado Role Torneo Chile
			await interaction.member.roles.add("1180723107145723934")
		}

		if (torneo.id === 2) {
			// Torneo Amateur
			await interaction.member.roles.add("1180723237399834715")
		}
	}

	/** ----------------------- */

	if (!interaction.replied) {
		return void await interaction.reply({
			ephemeral: true,
			content: `¡Te has inscrito exitósamente al torneo **${torneo.name}**!`,
		})
	}

	return void await interaction.update({
		content: `Te has inscrito en el torneo **${torneo.name}** exitósamente!`,
		components: [],
		embeds: []
	})
}

async function RunTetrioTournamentRegistrationChecks(userData: TetrioUserData, torneo: Tournament, discordId: string): Promise<{ allowed: boolean, reason?: string }> {
	// In here we have to check for Tetrio caps like rank, rating and country lock and if the player is already on the tournament.

	if (torneo.players.includes(discordId)) {
		return ({ allowed: false, reason: "Ya te encuentras en la lista de participantes de este torneo." })
	}

	if (torneo.is_country_locked && torneo.country_lock?.toUpperCase() !== userData.user.country?.toUpperCase()) {
		// The country of the player doesn't match the tournament country lock
		return ({ allowed: false, reason: "El pais del jugador es distinto al pais del torneo." })
	}

	if (torneo.is_tr_capped) {
		if (userData.user.league.rank === 'z')
			return ({ allowed: false, reason: "El jugador no posee un rank actualmente." })


		if (userData.user.league.rating > torneo.tr_cap!) {
			return ({ allowed: false, reason: "El rating del jugador está por sobre el limite de TR del torneo." })
		}
	}

	if (torneo.is_rank_capped) {

		if (userData.user.league.rank === 'z')
			return ({ allowed: false, reason: "El jugador es actualmente UNRANKED en Tetra League." })

		const tournamentRankIndex = TetrioRanksArray.findIndex((rank) => rank === torneo.rank_cap)
		const userRankIndex = TetrioRanksArray.findIndex((rank) => rank === userData.user.league.rank)

		if (tournamentRankIndex < userRankIndex)
			return ({ allowed: false, reason: "El rank del jugador está por sobre el límite de rank impuesto por el torneo." })
	}

	if (torneo.max_players && torneo.players.length >= torneo.max_players) {
		return ({ allowed: false, reason: "El torneo ha alcanzado el máximo de participantes." })
	}

	return { allowed: true }
}

export async function AddTetrioPlayerToDatabase({ discordId, tetrioId }: { discordId: string, tetrioId: string }, userData: TetrioUserData) {

	if (!discordId || !tetrioId)
		throw new Error(`Missing one of the arguments. dId: ${discordId}, tId: ${tetrioId}`)


	console.log("[DEBUG] Añadiendo nuevo PLAYER a la base de datos...");

	await PlayerModel.create({
		discord_id: discordId,
		tetrio_id: tetrioId,
		data: userData
	})

	console.log(`[PLAYERS DATABASE] => Player (${discordId}) - ${tetrioId} se ha guardado en la base de datos.`);

}