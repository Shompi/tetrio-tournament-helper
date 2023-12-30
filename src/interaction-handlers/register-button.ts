import { InteractionHandler, InteractionHandlerTypes } from '@sapphire/framework';
import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, Colors, ComponentType, ModalBuilder, TextInputBuilder, TextInputStyle } from "discord.js"
import { Tournament, TournamentStatus } from '../sequelize/Tournaments.js';
import { EmbedMessage, GetTournamentFromGuild, GetUserDataFromTetrio, SendLogsToGuild, TetrioUserProfileEmbed } from '../helper-functions/index.js';
import { TournamentDetailsEmbed } from "../helper-functions/index.js";
import { RunTetrioTournamentRegistrationChecks } from '../helper-functions/index.js';
import { AddPlayerToTournamentPlayerList } from '../helper-functions/index.js';
import { CommonMessages } from '../helper-functions/common-messages.js';

export class RegisterButtonHandler extends InteractionHandler {
	public constructor(ctx: InteractionHandler.LoaderContext, options: InteractionHandler.Options) {
		super(ctx, { interactionHandlerType: InteractionHandlerTypes.Button });
	}

	public async run(interaction: ButtonInteraction<'cached'>, tournamentId: string) {


		const tournament = await GetTournamentFromGuild(interaction.guildId, +tournamentId)

		if (!tournament) return void await interaction.reply({
			ephemeral: true,
			embeds: [
				EmbedMessage({
					description: CommonMessages.Tournament.NotFound,
					color: Colors.Red
				})
			]
		});

		if (tournament.status === TournamentStatus.CLOSED || tournament.status === TournamentStatus.FINISHED) {
			return void await interaction.reply({
				ephemeral: true,
				embeds: [EmbedMessage({
					description: CommonMessages.Tournament.NotJoinable,
				})]
			})
		}

		if (tournament.game === "TETRIO") {
			return void await HandleTetrioRegistration(interaction, tournament);
		}

		// If the tournament is from a game that does not track player stats then we can just add this player to the db
		// Although I wanna add something like an SR question / modal to help seeding Tetris Effect Tournaments and add it into the data prop.

		return void await AddPlayerToTournamentPlayerList(tournament, {
			discordId: interaction.user.id,
			dUsername: interaction.user.username,
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
			filter: (modalInteraction) => modalInteraction.customId.startsWith(interaction.id),
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

	console.log("[DEBUG] Running tournament inscription checks...");
	const check = await RunTetrioTournamentRegistrationChecks(playerdata, tournament, interaction.user.id)


	if (!check.allowed) {
		void await modalSubmition.reply({
			embeds: [
				EmbedMessage({
					description: `No te puedes inscribir en este torneo.\nRazón: **${check.reason}**`,
					color: Colors.Red
				})
			],
			ephemeral: true
		})

		return void await SendLogsToGuild(
			interaction.guildId,
			interaction.client,
			`❌ Error registrando al jugador ${playerdata.username}.\n**Razón:** ${check.reason}`
		)
	}
	console.log("[DEBUG] Tournament checks passed!");

	console.log("[DEBUG] Adding player to tournament players list");

	void await AddPlayerToTournamentPlayerList(tournament, {
		discordId: interaction.user.id,
		dUsername: interaction.user.username,
		challongeId: challongeUsername,
		data: playerdata
	})

	void await modalSubmition.reply({
		content: '✅ !Has sido añadido exitosamente al torneo!\nEl perfil con el que te inscribiste es el que te muestro abajo en este mensaje ⬇️\nEn caso de que te hayas equivocado de perfil, por favor desinscribete e inscribite nuevamente.',
		embeds: [TetrioUserProfileEmbed(playerdata)],
		ephemeral: true
	})

	// Update the message with the new details
	return void await interaction.message.edit({
		embeds: [TournamentDetailsEmbed(tournament)]
	})
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
						.setPlaceholder("TetrisMaster_123")
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
						.setPlaceholder("TetrisMaster_123")
						.setMaxLength(50)
						.setRequired(false)
				)
		);
}
