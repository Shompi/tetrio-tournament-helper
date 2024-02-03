/**
* This file will contain tetrio api function calls
* and maybe other stuff.
*/
import {
	AttachmentBuilder,
	ButtonInteraction,
	Colors,
	CommandInteraction,
	EmbedBuilder,
	EmbedData,
	Guild, GuildTextBasedChannel,
	Snowflake,
	User
} from "discord.js";

import { v4 as uuidv4 } from "uuid"

import { Subcommand } from "@sapphire/plugin-subcommands";
import { codeBlock } from "@sapphire/utilities";
import { AsciiTable3 } from "ascii-table3";
import * as csv from "csv-stringify/sync";
import { Op } from "sequelize";
import { request } from "undici";
import {
	BlocklistModel,
	GuildConfigs,
	GuildModel,
	RegisteredPlayer,
	Tournament,
	TournamentModel,
	TournamentStatus,
	TournamentStatusStrings
} from "../sequelize/index.js";
import { CommonMessages } from "./common-messages.js";
import { Category } from "../sequelize/Guilds.js";

//#region Declaration stuff
export type TetrioApiCacheStatus = "hit" | "miss" | "awaited"
export type TetrioUserRole = "anon" | "user" | "bot" | "halfmod" | "mod" | "admin" | "sysop" | "banned"
export type OrderBy = "default" | "apm" | "pps" | "rating" | "rank" | "vs" | "general_rate"
export type TetrioPlayerRelevantData = Pick<TetrioApiUser, "bio" | "league" | "country" | "username" | "avatar_revision" | "banner_revision" | "badstanding" | "_id">

export enum CustomLogLevels {
	Success = "Green",
	Danger = "Red",
	Warning = "Yellow",
	Info = "Blue",
	Default = "White"
}

export enum AllowedGames {
	TETRIO = "TETRIO",
	TETRISEFFECT = "Tetris Effect: Connected",
	PuyoTetris = "Puyo Puyo Tetris",
	PuyoTetrisTwo = "Puyo Puyo Tetris 2",
	Cultris = "Cultris",
	Jstris = "JSTRIS"
}

export type GameName = typeof AllowedGames[keyof typeof AllowedGames]

export const TetrioRanksArray = ["z", "d", "d+", "c-", "c", "c+", "b-", "b", "b+", "a-", "a", "a+", "s-", "s", "s+", "ss", "u", "x"] as const

/** Your are not supposed to use this, use TetrioRanksMap instead */
const TetrioRanksEmojis = [
	"UNRANKED",
	"<:rankD:884557291121180754>",
	"<:rankDplus:884557291116957726>",
	"<:rankCminus:884557291112787998>",
	"<:rankC:884557290777227315>",
	"<:rankCplus:884557291095994369>",
	"<:rankBminus:884557290714316801>",
	"<:rankB:884557291234422804>",
	"<:rankBplus:884557291205066773>",
	"<:rankAminus:884557290907250761>",
	"<:rankA:884557291200851979>",
	"<:rankAplus:884557291356049459>",
	"<:rankSminus:884557290970153012>",
	"<:rankS:884557291515424769>",
	"<:rankSplus:884557291788058664>",
	"<:rankSS:884557291465084929>",
	"<:rankU:884557290756276225>",
	"<:rankX:884557291016319078>",
] as const

type EmojiString = `<:${string}:${Snowflake}>` | "UNRANKED";

type TetrioRankObject = {
	index: number,
	emoji: EmojiString,
}


type TetrioUserLeagueStats = {
	apm?: number;
	bestrank: string;
	decaying: boolean;
	gamesplayed: number;
	gameswon: number;
	glicko?: number;
	next_at: number;
	next_rank: string | null;
	percentile: number;
	pps?: number;
	prev_at: number;
	prev_rank: string | null;
	rank: string;
	rating: number;
	rd?: number;
	standing_local: number;
	standing: number;
	vs?: number;
}
interface TetrioApiUser {
	_id: string;
	username: string;
	role: TetrioUserRole;
	ts?: string;
	botmaster?: string;
	badges?: {
		id: string;
		label: string;
		ts?: string;
	}[],
	xp: number;
	gamesplayed: number;
	gameswon: number;
	gametime: number;
	country: string | null;
	badstanding: boolean;
	supporter: boolean;
	/** between 0 - 4 inclusive */
	supporter_tier: number;
	verified: boolean;
	/** Tetra League stats */
	league: TetrioUserLeagueStats,
	/** This user's avatar ID. Get their avatar at https://tetr.io/user-content/avatars/{ USERID }.jpg?rv={ AVATAR_REVISION } */
	avatar_revision?: number;
	/** This user's banner ID. Get their banner at https://tetr.io/user-content/banners/{ USERID }.jpg?rv={ BANNER_REVISION }. Ignore this field if the user is not a supporter. */
	banner_revision?: number;
	/** About me */
	bio?: string;
	connections: {
		discord?: {
			id: string;
			username: string;
		}
	}
	friend_count: number;
	distinguishment?: {
		type: string;
	}
}

interface TetrioAPIUserData {
	user: TetrioApiUser
}
interface TetrioAPIUserResponse {
	success: boolean;
	error?: string;
	cache?: {
		status: TetrioApiCacheStatus;
		cached_at: number;
		cached_until: number;
	},
	data?: TetrioAPIUserData
}

const TETRIO_BASE = "https://ch.tetr.io/api"
const TETRIO_ENDPOINTS = {
	USERS: TETRIO_BASE + "/users/",
}

/** This function creates a map for the ranks, so we can have a numeric value for comparisons */
const CreateRanksMap = (ranks: typeof TetrioRanksArray) => {
	let i = 0;
	const tempMap = new Map<string, TetrioRankObject>()
	for (const rank of ranks) {
		tempMap.set(rank, { index: i, emoji: TetrioRanksEmojis[i] })
		i++
	}

	return tempMap
}
//#endregion

/** ----- BEGIN OF FUNCTIONS ----- */
export const TetrioRanksMap: Map<string, TetrioRankObject> = CreateRanksMap(TetrioRanksArray)

type TetrioUsername = string
/** Cache for tetrio requests */
const TetrioCache = new Map<TetrioUsername, TetrioPlayerRelevantData>()

/**
 * Gets basic Player information from the TETRIO API 
 * @param {string} _username The username or _id of the player
 * @returns {Promise<TetrioPlayerRelevantData | null>}
 */
export async function GetUserDataFromTetrio(_username: string): Promise<TetrioPlayerRelevantData | null> {

	// We can actually implement a little cache here i guess

	try {
		const username = _username.toLowerCase();

		if (TetrioCache.has(username)) {
			return TetrioCache.get(username)!
		}


		const apiResponse = await request(TETRIO_ENDPOINTS.USERS + username).then(response => response.body.json()) as TetrioAPIUserResponse;

		if (!apiResponse.success)
			return null

		// Add this user data to our cache
		TetrioCache.set(apiResponse.data!.user.username, {
			_id: apiResponse.data!.user._id,
			badstanding: apiResponse.data!.user.badstanding,
			country: apiResponse.data!.user.country,
			league: apiResponse.data!.user.league,
			username: apiResponse.data!.user.username,
			avatar_revision: apiResponse.data!.user.avatar_revision,
			banner_revision: apiResponse.data!.user.banner_revision,
			bio: apiResponse.data!.user.bio
		})

		// Delete the entry after some time
		console.log(`[CACHE] Añadiendo a ${apiResponse.data?.user.username} al cache`);

		setTimeout(() => {

			console.log(`[CACHE] Quitando a ${apiResponse.data?.user.username} del cache`);

			TetrioCache.delete(apiResponse.data!.user.username)
		},/** 10 minutes I guess its alright */ 60_000 * 10);


		/** apiResponse.data shouldn't be undefined here since the request succeeded */
		const { league } = apiResponse.data!.user
		return {
			_id: apiResponse.data!.user._id,
			username: apiResponse.data!.user.username,
			league,
			country: apiResponse.data!.user.country,
			badstanding: apiResponse.data!.user.badstanding,
			avatar_revision: apiResponse.data!.user.avatar_revision,
			banner_revision: apiResponse.data!.user.banner_revision
		}

	} catch (e) {
		console.log(e);
		return null;
	}
}

/**
 * Gets the URL to the avatar of this user, if any
 * Get their avatar at
 * @example `https://tetr.io/user-content/avatars/{ USERID }.jpg?rv={ AVATAR_REVISION }`
 * @param {string} userId The _id or username of this user
 * @param {(number | undefined)} avatar_revision The avatar_revision value of the user
 * @returns {string} URL to the avatar resource
 */
export function GenerateTetrioAvatarURL(userId: string, avatar_revision: number | undefined) {

	if (!avatar_revision) return null;
	return `https://tetr.io/user-content/avatars/${userId}.jpg?rv=${avatar_revision}`
}

export function GetUserProfileURL(username: string) {
	return `https://ch.tetr.io/u/${username}`
}

export function TournamentDetailsEmbed(torneo: Tournament) {

	const players = torneo.players

	return (
		new EmbedBuilder()
			/** This probably will need change if later i want to implement more statuses. */
			.setTitle(`${torneo.name} (${TournamentStatusStrings[torneo.status]})`)
			.setDescription(
				`**ID del torneo**: ${torneo.id.toString().padStart(4, "0")}` +
				`\n**Organizado por**: <@${torneo.organized_by}>` +
				`\n**Juego**: ${torneo.game}` +
				`\n**Descripción**: ${torneo.description ?? "N/A"}` +
				`${torneo.general_rate_cap ? `**SR/RH/RATING Cap**: ${torneo.general_rate_cap}` : ""}` +
				`${torneo.is_tr_capped ? `\n**TR CAP**: ${torneo.tr_cap}` : ""}` +
				`${torneo.is_rank_capped ? `\n**RANK CAP**: ${TetrioRanksMap.get(torneo.rank_cap!)?.emoji}` : ""}` +
				`${torneo.is_country_locked ? `\n**COUNTRY LOCK**: :flag_${torneo.country_lock?.toLowerCase()}: (${torneo.country_lock?.toUpperCase()})` : ""}` +
				`\n**Máximo de jugadores**: ${torneo.max_players ?? "Sin límite"}` +
				`\n**Jugadores registrados**: ${players.length}`
			)
			.setColor(Colors.White)
			.setTimestamp()
			.setFooter({
				text: "Última actualización"
			})
	)
}

export function RunGeneralTournamentRegistrationChecks(skillrate: number, userid: string, tournament: Tournament) {

	if (tournament.players.some(player => player.discordId === userid)) {
		return ({ allowed: false, reason: CommonMessages.Player.AlreadyRegistered })
	}

	if (tournament.general_rate_cap) {
		/** This shouldn't be null in a general rate capped tournament */
		if (skillrate > tournament.general_rate_cap) {
			return ({ allowed: false, reason: CommonMessages.Player.SkillRateExceeded })
		}
	}

	return ({ allowed: true })
}

export function RunTetrioTournamentRegistrationChecks(userData: TetrioPlayerRelevantData, tournament: Tournament, discordId: string): { allowed: boolean; reason?: string; } {
	// In here we have to check for Tetrio caps like rank, rating and country lock and if the player is already on the tournament.

	/** Maybe add like a reasons: string[] in the future if the player has multiple reasons to not be accepted on the tournament.*/
	if (tournament.status === TournamentStatus.CLOSED || tournament.status === TournamentStatus.FINISHED) {
		return ({ allowed: false, reason: "Las inscripciones para este torneo no se encuentran abiertas." })
	}

	if (tournament.players.some(player => player.discordId === discordId)) {
		return ({ allowed: false, reason: "Ya te encuentras en la lista de participantes de este torneo." });
	}

	if (tournament.players.some(player => player.data!._id === userData._id)) {
		return ({ allowed: false, reason: "Ya hay un jugador de tetrio con esta id inscrito en este torneo." })
	}

	if (tournament.is_country_locked) {

		if (!userData.country)
			return ({ allowed: false, reason: "El jugador no muestra un país en su perfil de TETRIO." })

		if (tournament.country_lock!.toUpperCase() !== userData.country?.toUpperCase())
			return ({ allowed: false, reason: "El país del jugador es distinto al país del torneo." });
		// The country of the player doesn't match the tournament country lock
	}

	if (tournament.is_tr_capped) {
		if (userData.league.rank === 'z')
			return ({ allowed: false, reason: "El jugador es actualmente UNRANKED y el torneo requiere de un rango para la inscripción." });


		if (userData.league.rating > tournament.tr_cap!) {
			return ({ allowed: false, reason: "El rating del jugador está por sobre el limite de TR del torneo." });
		}
	}

	if (tournament.is_rank_capped) {

		if (userData.league.rank === 'z')
			return ({ allowed: false, reason: "El jugador es actualmente UNRANKED en Tetra League." });

		const tournamentRankIndex = TetrioRanksArray.findIndex((rank) => rank === tournament.rank_cap);
		const userRankIndex = TetrioRanksArray.findIndex((rank) => rank === userData.league.bestrank);

		if (tournamentRankIndex < userRankIndex)
			return ({ allowed: false, reason: "El rank del jugador está por sobre el límite de rank impuesto por el torneo." });
	}

	if (tournament.max_players && tournament.players.length >= tournament.max_players) {
		return ({ allowed: false, reason: "El torneo ha alcanzado el máximo de participantes." });
	}

	return { allowed: true };
}







/** Builds a player list in an embed for better display on the Discord App (FOR TETRIO) */
export function BuildPlayerListTetrioEmbed(tournament: Tournament, players?: RegisteredPlayer[]) {

	if (!players) players = Array.from(tournament.players)

	const table = new AsciiTable3()
		.setHeading("SEED", "USERNAME", "RANK", "RATING")
		.setAlignCenter(1)
		.setAlignCenter(2)
		.setAlignCenter(3);

	let pos = 1;

	for (const player of players) {
		table.addRow(pos, player.data!.username, player.data!.league.rank.toUpperCase(), player.data!.league.rating.toFixed(2));
		pos++;
	}

	return new EmbedBuilder()
		.setTitle(tournament.name)
		.setDescription(
			codeBlock(
				table.toString()
			)
		);
}

/** Builds a general player list table with generic SR / RATING */
export function BuildPlayerListGeneralEmbed(tournament: Tournament, players?: RegisteredPlayer[]): EmbedBuilder {

	if (!players) players = OrderPlayerListBy(tournament, "general_rate", false)

	const table = new AsciiTable3()
		.setHeading("SEED", "USERNAME", "RATING")
		.setAlignCenter(1)
		.setAlignCenter(2)
		.setAlignCenter(3);

	let pos = 1;

	for (const player of players) {
		table.addRow(pos, player.dUsername, player.generalRate);
		pos++;
	}

	return new EmbedBuilder()
		.setTitle(tournament.name)
		.setDescription(
			codeBlock(
				table.toString()
			)
		);
}


/** Exports an embed with players information in a challonge friendly display */
export function BuildPlayerListChallonge(tournament: Tournament, players: RegisteredPlayer[]) {

	// Challonge bulk add accepts a string like [displayName, email or challonge username]
	return new EmbedBuilder()
		.setTitle(`Jugadores ${tournament.name}`)
		.setDescription(codeBlock(
			players.map((player) => `${player.data?.username ?? player.dUsername}${player.challongeId ? ", " + player.challongeId : ""}`)
				.join("\n")
		))
		.setColor(Colors.White)
		.setTimestamp()
}

export function BuildPlayerListCSV(tournament: Tournament, players: RegisteredPlayer[]): AttachmentBuilder {
	const Headers = ["DISCORDID", "USERNAME", "CHALLONGE"];
	const PlayersData: any[] = [];

	if (players[0].data) {
		Headers.push("TETR");
		Headers.push("RANK");
		Headers.push("RATING");
		Headers.push("COUNTRY");
		Headers.push("APM");
		Headers.push("PPS");
		Headers.push("VS");
	}

	for (const player of players) {
		const row = [];

		row.push(player.discordId);
		row.push(player.dUsername);
		row.push(player.challongeId);

		if (player.data) {
			row.push(player.data.username);
			row.push(player.data.league.rank);
			row.push(player.data.league.rating);
			row.push(player.data.country);
			row.push(player.data.league.apm);
			row.push(player.data.league.pps);
			row.push(player.data.league.vs);
		}

		PlayersData.push(row);
	}


	const csvdata = csv.stringify([
		Headers,
		...PlayersData
	]);

	return new AttachmentBuilder(
		Buffer.from(csvdata),
		{ name: `PLAYERS-${tournament.name}.csv`, description: `Lista de jugadores del torneo ${tournament.name} en formato CSV` }
	);
}

export function BuildPlayerListJSON(tournament: Tournament, players: RegisteredPlayer[]): AttachmentBuilder {
	return new AttachmentBuilder(
		Buffer.from(JSON.stringify(players, null, 2)),
		{ name: `PLAYERS-${tournament.name}.json` }
	);
}

export async function BuildPlayerListGeneral(tournament: Tournament, playerList: RegisteredPlayer[]) {
	// Now we need to build the table
	// We need to check whether or not this is a TETRIO tournament so we can build different tables for other games.
	const table = new AsciiTable3(tournament.name)
		.setTitleAlignCenter()
		.setHeadingAlignCenter()
		.setHeading("SEED", "DISCORD ID", "USERNAME", "CHALLONGE")
		.setAlignCenter(1)
		.setAlignCenter(2)
		.setAlignCenter(3)
		.setAlignCenter(4)

	// Good old for loop
	for (let i = 0; i < playerList.length; i++) {

		table.addRow(
			i + 1,
			playerList[i].discordId,
			`<@${playerList[i].discordId}>`,
			playerList[i].challongeId ?? "N/A"
		);
	}

	return table.toString();
}

export function BuildPlayerListAscii(tournament: Tournament, orderedPlayerList: RegisteredPlayer[]) {
	// Now we need to build the table
	// We need to check whether or not this is a TETRIO tournament so we can build different tables for other games.
	const table = new AsciiTable3(tournament.name)
		.setTitleAlignCenter()
		.setHeadingAlignCenter()
		.setHeading("SEED", "DISCORD ID", "USERNAME", "CHALLONGE", "TETRIO USERNAME", "PAIS", "RANK", "TR", "APM", "PPS")
		.setAlignCenter(1)
		.setAlignCenter(2)
		.setAlignCenter(3)
		.setAlignCenter(4)
		.setAlignCenter(5)
		.setAlignCenter(6)
		.setAlignCenter(7)
		.setAlignCenter(8)
		.setAlignCenter(9)
		.setAlignCenter(10)


	let i = 1
	for (const player of orderedPlayerList) {
		table.addRow(
			i,
			player.discordId,
			player.dUsername,
			player.challongeId ?? "N/A",
			player.data!.username.toUpperCase(),
			player.data!.country?.toUpperCase() ?? "OCULTO",
			player.data!.league.rank.toUpperCase(),
			player.data!.league.rating.toFixed(2),
			player.data!.league.apm ?? "0.00",
			player.data!.league.pps ?? "0.00"
		)
		i++
	}

	return new AttachmentBuilder(Buffer.from(table.toString()))
		.setName(`PLAYERS-${tournament.name}.txt`)
		.setDescription(`Tabla de jugadores del torneo ${tournament.name}`);
}

export function OrderPlayerListBy(tournament: Tournament, orderBy: OrderBy, filter_checked_in: boolean | null): RegisteredPlayer[] {

	const checkedIn = Array.from(tournament.checked_in)

	const PlayersArray: RegisteredPlayer[] = filter_checked_in ?
		Array.from(tournament.players)
			.filter(player => checkedIn.includes(player.discordId))
		: Array.from(tournament.players)

	if (tournament.game === AllowedGames.TETRIO) {
		// At this point we should have a list of players
		if (orderBy === "rank") {

			// We need to remember that ranks are letters here.
			// Sort is INPLACE
			PlayersArray.sort((playerA, playerB) => {

				const rankA = TetrioRanksMap.get(playerA.data!.league.rank)!.index;
				const rankB = TetrioRanksMap.get(playerB.data!.league.rank)!.index;

				return rankB - rankA;
			});
		}

		if (["pps", "apm", "vs", "rating"].includes(orderBy)) {
			PlayersArray.sort((playerA, playerB) => {
				const valA = playerA.data!.league[orderBy as "pps" | "apm" | "vs" | "rating"] ?? 0;
				const valB = playerB.data!.league[orderBy as "pps" | "apm" | "vs" | "rating"] ?? 0;

				return valB - valA;
			});
		}

		if (orderBy === "general_rate") {
			PlayersArray.sort((playerA, playerB) => playerB.generalRate! - playerA.generalRate!)
		}
	}

	return PlayersArray
}

export function TetrioUserProfileEmbed(userData: TetrioPlayerRelevantData) {
	const avatarUrl = GenerateTetrioAvatarURL(userData._id, userData.avatar_revision)

	const embed = new EmbedBuilder()
		.setDescription(
			`**Username**: ${userData.username.toUpperCase()}`
			+ `\n**Rank**: ${TetrioRanksMap.get(userData.league.rank)?.emoji}`
			+ `\n**Rank más alto**: ${TetrioRanksMap.get(userData.league.bestrank)?.emoji}`
			+ `\n**Rating**: ${userData.league.rating.toFixed(2)}`
			+ `\n**Bio**: ${userData.bio ?? "No bio."}`
			+ `\n\n[Enlace al perfil](${GetUserProfileURL(userData.username)})`
		)
		.setColor(Colors.Blue)

	if (avatarUrl) {
		embed.setThumbnail(avatarUrl)
	}

	return embed
}





/** Utility function to quickly create embeds */
export function PrettyMsg(options: Pick<EmbedData, "color" | "author" | "description" | "footer" | "thumbnail">) {
	const embed = new EmbedBuilder()

	if (options.color) embed.setColor(options.color)
	if (options.description) embed.setDescription(options.description)
	if (options.author) embed.setAuthor(options.author)
	if (options.footer) embed.setFooter(options.footer)
	if (options.thumbnail) embed.setThumbnail(options.thumbnail.url)
	return embed
}

/** Gets a guild's configs for the bot */
export async function GetGuildConfigs(guild_id: Snowflake) {

	const [configs, _] = await GuildModel.findOrCreate({
		where: {
			guild_id: guild_id
		}
	})

	if (_) console.log(`[GUILDS] Se ha creado una nueva entrada para la guild ${guild_id}`)

	return configs
}

type GuildConfig = Pick<GuildConfigs, "logging_channel" | "allowed_roles">
export async function SaveGuildConfigs(guild_id: Snowflake, configs: GuildConfig) {

	console.log(`[GUILDS] Guardando configuraciones de la guild ${guild_id}...`);
	const guild = await GetGuildConfigs(guild_id)

	return await guild.update({
		allowed_roles: configs.allowed_roles ?? [],
		logging_channel: configs.logging_channel
	})
}

export async function UserIsBlocked(_user: User) {
	const [user, _] = await GetUserFromBlocklist(_user.id)
	return user.isBlacklisted
}

export async function GetGuildLogsChannel(guild: Guild) {
	const guildConfigs = await GetGuildConfigs(guild.id)

	if (!guildConfigs.logging_channel) return null

	const channel = guild.channels.cache.get(guildConfigs.logging_channel)

	if (channel) return channel as GuildTextBasedChannel

	console.log(`[GUILDS] Logging channel en la guild ${guild.name} (${guild.id}) no se encontró`);

	await guildConfigs.update({
		logging_channel: null
	})

	console.log(`[GUILDS] El canal ha sido eliminado de la base de datos.`);

	return null
}

/** This function is used to send messages directly to the LOGS Channel configured by the server administrators. */
export async function SendMessageToChannel(interaction: CommandInteraction<'cached'> | ButtonInteraction<'cached'>, content: string, level?: CustomLogLevels) {

	const color = level ?? CustomLogLevels.Default

	const channel = await GetGuildLogsChannel(interaction.guild)
	if (!channel) return

	channel.send({
		embeds: [
			PrettyMsg({
				description: content,
				color: Colors[color],
				author: {
					name: interaction.client.user.displayName,
					iconURL: interaction.client.user.displayAvatarURL({ size: 256 })
				}
			})
		]
	})
}

export async function GetUserFromBlocklist(userId: Snowflake) {

	return await BlocklistModel.findOrCreate({
		where: {
			discord_id: userId
		}
	})
}

export async function BlockUser(userId: Snowflake, reason: string) {
	console.log(`[BLOCKLIST] Bloqueando al usuario ${userId}...`);

	const [user, _] = await GetUserFromBlocklist(userId)

	await user.update({
		isBlacklisted: true,
		reason
	})

	console.log(`[BLOCKLIST] El usuario ha sido bloqueado.`);
	return true

}

export async function UnblockUser(userId: Snowflake) {
	console.log(`[BLOCKLIST] Desbloqueando al usuario ${userId}...`);

	const [user, _] = await GetUserFromBlocklist(userId)

	_ ? console.log(`[BLOCKLIST] El usuario ha sido creado!`) : null

	await user.update('isBlacklisted', false)
	return true
}

//#region Tournament Related Methods

/** Wether or not this tournament can be edited (Is not FINISHED) */
export function IsTournamentEditable(tournament: Tournament) {
	return tournament.status !== TournamentStatus.FINISHED
}

export async function GetAllTournamentsByCategory(params: { guildId: Snowflake, category: number }) {
	return await TournamentModel.findAll({
		where: {
			guild_id: params.guildId,
			[Op.and]: {
				category: params.category
			}
		}
	})
}

/** This function returns every tournament from a guild, regardless of status */
export async function GetAllTournaments(guild_id: string) {

	return await TournamentModel.findAll({
		where: {
			guild_id,
		}
	})
}

/** 
* This function handles the autocomplete entirely.
*	Also, this function should only return the tournaments belonging to this guild.
* This function DOES NOT return tournaments that are on a finished state.
*/
export async function SearchTournamentByNameAutocomplete(interaction: Subcommand.AutocompleteInteraction<'cached'>) {
	const focusedOption = interaction.options.getFocused()
	const torneos = await TournamentModel.findAll({
		where: {
			guild_id: interaction.guildId,
			[Op.and]: {
				[Op.not]: {
					status: TournamentStatus.FINISHED
				}
			}
		}
	})

	return void await interaction.respond(
		torneos.filter(tournament => tournament.name.toLowerCase().includes(
			focusedOption.toLowerCase()
		)).map(torneo => ({ name: torneo.name.slice(0, 50), value: torneo.id.toString() }))
	)
}

/** This function will EMPTY the entire player list of a selected tournament, USE WITH CAUTION */
export async function ClearTournamentPlayerList(tournament: Tournament) {


	console.log(`[TOURNAMENTS] Eliminando jugadores del torneo ${tournament.name}`)
	await tournament.update({
		players: [],
		checked_in: [],
	})
	console.log(`[TOURNAMENTS] Los jugadores del torneo han sido eliminados.`);

	return true
}

/** This function will add a base player (discordId, challongeId, data? to the players array) */
export async function AddPlayerToTournament(tournament: Tournament, player: RegisteredPlayer) {

	// Add player to the tournament
	console.log(`[TOURNAMENT] Añadiendo nuevo jugador ${player.discordId} al torneo ${tournament.name}`);

	if (tournament.players.some(pl => pl.discordId === player.discordId))
		return console.log('[TOURNAMENT] El jugador ya estába en la lista de jugadores inscritos en el torneo')

	const players = Array.from(tournament.players)
	players.push(player)
	tournament.players = players
	console.log("[TOURNAMENT] El jugador ha sido añadido a la lista");

	await tournament.save()
	console.log("[TOURNAMENT] El torneo ha sido guardado");
}

/** Gets a single tournament from a guild, this function calls isNaN on the tournament ID internally. */
export async function GetSingleTournament(guild_id: string, tournament_id: number) {

	if (isNaN(tournament_id)) return null

	return await TournamentModel.findOne({
		where: {
			guild_id: guild_id,
			id: tournament_id,
			[Op.and]: {
				status: {
					[Op.ne]: TournamentStatus.FINISHED
				}
			}
		}
	})
}

export async function GetTournament(id: number) {

	if (isNaN(id)) return null

	return await TournamentModel.findByPk(id)
}

export async function SearchTournamentById(id: number) {
	return await TournamentModel.findByPk(id)
}

/** Function used to remove a player from a tournament */
export async function RemovePlayerFromTournament(torneo: Tournament, discord_id: string) {

	const playerId = discord_id

	const players = Array.from(torneo.players)
	const checkedIn = Array.from(torneo.checked_in) ?? []

	// Remove the player from the registered players list
	const filteredPlayers = players.filter(player => player.discordId !== discord_id)
	// Remove the player from the checked in list
	const checkedInFiltered = checkedIn.filter(id => id !== playerId)

	console.log(`[TOURNAMENT] Quitando al jugador ${discord_id} del torneo ${torneo.name}`)

	torneo.checked_in = checkedInFiltered
	torneo.players = filteredPlayers

	await torneo.save()

	console.log(`[TOURNAMENT] El jugador ${discord_id} ha sido desinscrito.`)
}

export async function FinishTournament(tournament: Tournament, /** Discord ID of the winner */ winner?: string | null) {
	console.log(`[TOURNAMENT] Marcando torneo ${tournament.id} - ${tournament.name} como FINALIZADO`);

	await tournament.update({
		registration_channel: null,
		registration_message: null,
		registration_open_until: null,
		checkin_channel: null,
		checkin_message: null,
		checkin_threadId: null,
		winner_id: winner,
		status: TournamentStatus.FINISHED
	})

	console.log(`[TOURNAMENT] Torneo guardado!`);

	return true
}

/** This function returns all ongoing (not marked as FINISHED) tournaments from a guild */
export async function GetAllOngoingTournamentsFromGuild(guild_id: string) {
	return await TournamentModel.findAll({
		where: {
			guild_id,
			status: {
				[Op.ne]: TournamentStatus.FINISHED
			}
		}
	})
}
//#endregion

//#region Database Category Methods

function isInvalidName(name: string) {
	return name.length > 150
}

function isInvalidDescription(description: string | null) {
	if (description === null) return false
	if (description.length > 512) return true
	return false
}

export async function CreateCategory(params: { guildId: Snowflake, name: string, description: string | null }): Promise<Category> {

	if (!params.name)
		throw ("Error: Necesitas pasar un nombre para crear la categoría.")

	if (isInvalidName(params.name))
		throw ("El **nombre de la categoría** no puede exceder los **150 caracteres**.")

	if (isInvalidDescription(params.description))
		throw ("La **descripción** de esta categoría **excede el límite de caracteres (500)**.")

	/** First check if there is another category with the same name */
	const GuildConfigs = await GetGuildConfigs(params.guildId)
	const categories = Array.from(GuildConfigs.categories)
	if (categories.length === 25)
		throw ("Este servidor ha alcanzado el máximo número de categorías (25)")

	for (const category of categories) {
		if (category.name.toLowerCase() === params.name.toLowerCase())
			throw ("Una categoría con este nombre **ya existe** en este servidor.")
	}

	const new_category: Category = {
		id: uuidv4(),
		name: params.name,
		description: params.description
	}

	categories.push(new_category)

	console.log("[CATEGORIES] Guardando nueva categoría...")
	await GuildConfigs.update({
		categories: categories
	})
	console.log("[CATEGORIES] La categoría ha sido guardada.")

	return new_category

}

export async function EditCategory(params: { guildId: Snowflake, name: string, description: string | null, categoryId: string }): Promise<Category> {

	const categories = await GetAllGuildCategories(params.guildId)
	const category = categories.find(category => category.id === params.categoryId)

	if (!category)
		throw ("La categoría que ingresaste no pertenece a este servidor, no ha sido creada, o no es una opción del **autocompletado**.")

	if (isInvalidName(params.name))
		throw ("El **nombre de la categoría** no puede exceder los **64 caracteres**.")

	if (isInvalidDescription(params.description))
		throw ("La descripción de esta categoría excede el límite de caracteres (512).")

	/** Replace the values in  the found category */
	category.name = params.name
	category.description = params.description

	/** Filter out the category we are editing from the array */
	const newCategories = categories.filter(_category => _category.id !== category.id)

	/** Push in the new edited category */
	newCategories.push(category)

	/** Replace the guild categories array with the new categories */
	const _ = await UpdateCategories(params.guildId, newCategories).catch(console.error)
	if (!_) throw ("Ocurrió un error intentando editar esta categoría.")

	return category
}

export async function GetAllGuildCategories(guildId: Snowflake): Promise<Category[]> {
	const guild = await GetGuildConfigs(guildId)

	return Array.from(guild.categories)
}

async function GetCategoryFromGuild(categoryId: string, guildId: Snowflake): Promise<Category | undefined> {

	const Guild = await GetGuildConfigs(guildId)

	return Guild.categories.find(category => category.id === categoryId)

}

export async function SearchCategoryByNameAutocomplete(interaction: Subcommand.AutocompleteInteraction<'cached'>) {

	const categories = await GetAllGuildCategories(interaction.guildId)

	return void await interaction.respond(
		categories.filter(category =>
			category.name.toLowerCase().includes(interaction.options.getFocused(false))
		).map(category => ({
			name: category.name.slice(0, 50),
			value: category.id
		}))
	)
}

export async function CheckIfCategoryBelongsToGuild(params: { guildId: Snowflake, category: string }): Promise<boolean> {

	const Guild = await GetGuildConfigs(params.guildId)

	return Guild.categories.some(category => category.id === params.category)
}

async function UpdateCategories(guildId: Snowflake, categories: Category[]) {
	const guild = await GetGuildConfigs(guildId)

	try {
		await guild.update({
			categories: categories
		})

		return true
	}
	catch (e) {
		console.error(e);

		return false
	}
}
//#endregion Database Category Methods