import { InteractionHandler, InteractionHandlerTypes } from '@sapphire/framework';
import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, Colors, ComponentType, ModalBuilder, TextInputBuilder, TextInputStyle } from "discord.js"
import { Tournament, TournamentStatus } from '../sequelize/Tournaments.js';
import { PrettyMsg, GetTournamentFromGuild, GetUserDataFromTetrio, SendMessageToChannel, TetrioUserProfileEmbed, CustomLogLevels, AllowedGames, RunGeneralTournamentRegistrationChecks } from '../helper-functions/index.js';
import { TournamentDetailsEmbed } from "../helper-functions/index.js";
import { RunTetrioTournamentRegistrationChecks } from '../helper-functions/index.js';
import { AddPlayerToTournament } from '../helper-functions/index.js';
import { CommonMessages } from '../helper-functions/common-messages.js';

export class RegisterButtonHandler extends InteractionHandler {
	public constructor(ctx: InteractionHandler.LoaderContext, options: InteractionHandler.Options) {
		super(ctx, { interactionHandlerType: InteractionHandlerTypes.Button });
	}

	public async run(interaction: ButtonInteraction<'cached'>, tournamentId: string) {

		let success: boolean = false

		const tournament = await GetTournamentFromGuild(interaction.guildId, +tournamentId)

		if (!tournament) return void await interaction.reply({
			ephemeral: true,
			embeds: [
				PrettyMsg({
					description: CommonMessages.Player.UnableToJoinTournament,
					color: Colors.Red
				})
			]
		});

		if (tournament.status === TournamentStatus.CLOSED || tournament.status === TournamentStatus.FINISHED) {
			return void await interaction.reply({
				ephemeral: true,
				embeds: [PrettyMsg({
					description: CommonMessages.Player.UnableToJoinTournament,
				})]
			})
		}

		switch (tournament.game) {
			case AllowedGames.TETRIO:
				success = await HandleTetrioRegistration(interaction, tournament)
				break;
			case AllowedGames.TETRISEFFECT:
				success = await HandleTetrisEffectRegistration(interaction, tournament)
				break;

			case AllowedGames.PuyoTetris:
			case AllowedGames.PuyoTetrisTwo:
			case AllowedGames.Cultris:
			case AllowedGames.Jstris:
				success = await HandleGeneralRegistration(interaction, tournament)
				break;
			default:
				return void await interaction.reply({ ephemeral: true, content: 'Error: Game not supported yet.' })
		}

		if (!success) return

		/** We have to add the roles to the player, if any */
		if (tournament.add_roles.length > 0)
			await interaction.member.roles.add(tournament.add_roles)

		// Update the message with the new details
		return void await interaction.message.edit({
			embeds: [TournamentDetailsEmbed(tournament)]
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


async function HandleTetrioRegistration(interaction: ButtonInteraction<'cached'>, tournament: Tournament): Promise<boolean> {

	// show the modal
	const TetrioModal = BuildTetrioModal(interaction)

	void await interaction.showModal(TetrioModal)

	const modalSubmition = await interaction.awaitModalSubmit(
		{
			time: 60_000 * 2,
			filter: (modalInteraction) => modalInteraction.customId.startsWith(interaction.id),
		}
	).catch(() => null);

	// Interaction expired.
	if (!modalSubmition) return false;

	const tetrioUsername = modalSubmition.fields.getTextInputValue('tetrio-username')
	let challongeUsername: string | null = modalSubmition.fields.getTextInputValue('challonge-username')

	const playerdata = await GetUserDataFromTetrio(tetrioUsername)

	if (!playerdata) {
		void await modalSubmition.reply({
			content: `El jugador ${tetrioUsername} no existe. Verifica que hayas escrito el nombre de manera correcta.`,
			ephemeral: true
		})

		return false
	}

	console.log("[DEBUG] Running tournament inscription checks...");
	const check = RunTetrioTournamentRegistrationChecks(playerdata, tournament, interaction.user.id)


	if (!check.allowed) {
		void await modalSubmition.reply({
			embeds: [
				PrettyMsg({
					description: `No te puedes inscribir en este torneo.\nRazón: **${check.reason}**`,
					color: Colors.Red
				})
			],
			ephemeral: true
		})

		void await SendMessageToChannel(
			interaction,
			`⚠️ Error registrando al jugador **${playerdata.username.toUpperCase()}** (${interaction.user.username}) en el torneo **${tournament.name} (ID: ${String(tournament.id).padStart(2, "0")})**.\n**Razón:** ${check.reason}`,
			CustomLogLevels.Warning
		)

		return false
	}

	console.log("[DEBUG] Tournament checks passed!");

	if (challongeUsername.length < 2)
		challongeUsername = null

	console.log("[DEBUG] Adding player to tournament players list");
	void await AddPlayerToTournament(tournament, {
		discordId: interaction.user.id,
		dUsername: interaction.user.username,
		challongeId: challongeUsername,
		data: playerdata
	})

	void await modalSubmition.reply({
		content: '✅ ¡Has sido añadido exitosamente al torneo!\nEl perfil con el que te inscribiste es el que te muestro abajo en este mensaje ⬇️\nEn caso de que te hayas equivocado de perfil, por favor desinscribete e inscribete nuevamente.',
		embeds: [TetrioUserProfileEmbed(playerdata)],
		ephemeral: true
	})

	return true
}

async function HandleGeneralRegistration(interaction: ButtonInteraction<'cached'>, tournament: Tournament): Promise<boolean> {


	/** Build the modal */
	const modal = BuildGeneralRegistrationModal(interaction)

	/** Show the modal */
	void await interaction.showModal(modal)

	const modalResponse = await interaction.awaitModalSubmit({
		time: 60_000 * 2,
		filter: (modalInteraction) => modalInteraction.customId.startsWith(interaction.id),
	}).catch(() => null)

	if (!modalResponse) return false

	const challongeUsername = modalResponse.fields.getTextInputValue('challonge-username')

	void await AddPlayerToTournament(tournament, {
		challongeId: challongeUsername.length < 2 ? null : challongeUsername,
		discordId: interaction.user.id,
		dUsername: interaction.user.username
	})

	void await modalResponse.reply({
		ephemeral: true,
		content: CommonMessages.Player.RegisteredSuccessfully
	})

	return true
}

async function HandleTetrisEffectRegistration(interaction: ButtonInteraction<'cached'>, tournament: Tournament): Promise<boolean> {

	await interaction.showModal(BuildTetrisEffectModal(interaction))

	const modalsubmit = await interaction.awaitModalSubmit({
		time: 60_000 * 2,
		filter: (modal => modal.customId.startsWith(interaction.id))
	}).catch(() => null)

	if (!modalsubmit) return false

	const answers = {
		skillrate: parseInt(modalsubmit.fields.getTextInputValue('tec-skillrate')),
		challongeId: modalsubmit.fields.getTextInputValue('challonge-username')
	}

	if (tournament.general_rate_cap) {
		if (isNaN(answers.skillrate)) {
			void await interaction.reply({
				ephemeral: true,
				embeds: [
					PrettyMsg({
						description: CommonMessages.Player.SkillNotANumber
					})
				]
			})

			return false
		}

		if (answers.skillrate < 0) {
			void await interaction.reply({
				ephemeral: true,
				embeds: [
					PrettyMsg({
						description: CommonMessages.Player.SkillRateNotSet
					})
				]
			})

			return false
		}

		const check = RunGeneralTournamentRegistrationChecks(answers.skillrate, interaction.user.id, tournament)

		if (!check.allowed) {
			void await modalsubmit.reply({
				ephemeral: true,
				embeds: [
					PrettyMsg({
						description: `❌ No puedes inscribirte en este torneo.\n**Razón**: ${check.reason}`,
						color: Colors.Red
					})
				]
			})

			return false
		}
	}

	await AddPlayerToTournament(tournament, {
		challongeId: answers.challongeId,
		discordId: interaction.user.id,
		dUsername: interaction.user.username,
		generalRate: answers.skillrate,
	})

	await modalsubmit.reply({
		ephemeral: true,
		embeds: [
			PrettyMsg({
				description: CommonMessages.Player.RegisteredSuccessfully,
				color: Colors.Green
			})
		]
	})

	return true
}


/** TODO: Implement this for general tournaments */
function BuildGeneralRegistrationModal(interaction: ButtonInteraction<'cached'>) {
	return new ModalBuilder()
		.setCustomId(`${interaction.id}-registration`)
		.setTitle(`Inscripción para torneo`)
		.addComponents(
			new ActionRowBuilder<TextInputBuilder>()
				.setComponents(
					new TextInputBuilder()
						.setStyle(TextInputStyle.Short)
						.setCustomId('challonge-username')
						.setLabel('Tu username de challonge (Opcional)')
						.setPlaceholder("")
						.setMaxLength(50)
						.setRequired(false)
				)
		);
}

function BuildTetrisEffectModal(interaction: ButtonInteraction<'cached'>) {
	return new ModalBuilder()
		.setCustomId(`${interaction.id}-registration`)
		.setTitle(`Inscripción para torneo de Tetris Effect`)
		.addComponents(
			new ActionRowBuilder<TextInputBuilder>()
				.setComponents(
					new TextInputBuilder()
						.setStyle(TextInputStyle.Short)
						.setCustomId('tec-skillrate')
						.setLabel('Tu SR / RH / RATE')
						.setPlaceholder("1234")
						.setMaxLength(5)
						.setRequired(true)
				),
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
		);
}

function BuildTetrioModal(interaction: ButtonInteraction<"cached">) {
	return new ModalBuilder()
		.setCustomId(`${interaction.id}-registration`)
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
						.setMaxLength(50)
						.setRequired(false)
				)
		);
}
