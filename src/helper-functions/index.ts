/**
* This file will contain tetrio api function calls
* and maybe other stuff.
*/
import { AttachmentBuilder, EmbedBuilder, Colors, Snowflake, User, ChatInputCommandInteraction } from "discord.js";
import { AsciiTable3 } from "ascii-table3";
import { Command } from "@sapphire/framework";
import { Subcommand } from "@sapphire/plugin-subcommands";
import { TournamentModel, TournamentStatus, TournamentStatusStrings, Tournament } from "../sequelize/Tournaments.js";
import { PlayerModel } from "../sequelize/Tournaments.js";
import { request } from "undici"

export type TetrioApiCacheStatus = "hit" | "miss" | "awaited"
export type TetrioUserRole = "anon" | "user" | "bot" | "halfmod" | "mod" | "admin" | "sysop" | "banned"
export type OrderBy = "default" | "apm" | "pps" | "tr" | "rank" | null


export interface TetrioUserData {
	user: {
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
		league: {
			gamesplayed: number;
			gameswon: number;
			rating: number;
			rank: string;
			bestrank: string;
			standing: number;
			standing_local: number;
			next_rank: string | null;
			prev_rank: string | null;
			next_at: number;
			prev_at: number;
			percentile: number;
			glicko?: number;
			rd?: number;
			apm?: number;
			pps?: number;
			vs?: number;
			decaying: boolean;
		}
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
}

interface APIUserResponse {
	success: boolean;
	error?: string;
	cache?: {
		status: TetrioApiCacheStatus;
		cached_at: number;
		cached_until: number;
	},
	data?: TetrioUserData;
}

const TETRIO_BASE = "https://ch.tetr.io/api"
const TETRIO_ENDPOINTS = {
	users: TETRIO_BASE + "/users/",
}

export enum AllowedGames {
	TETRIO = "TETRIO",
	TETRISEFFECT = "Tetris Effect: Connected",
	PuyoTetris = "Puyo Puyo Tetris",
	PuyoTetrisTwo = "Puyo Puyo Tetris 2"
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

export const TetrioRanksMap: Map<string, TetrioRankObject> = CreateRanksMap(TetrioRanksArray)

/** Gets data of an user from the TETRIO API, calls toLowerCase() internally */
export async function GetUserDataFromTetrio(_username: string): Promise<TetrioUserData | null> {
	try {
		const username = _username.toLowerCase();

		const apiResponse = await request(TETRIO_ENDPOINTS.users + username).then(response => response.body.json()) as APIUserResponse;

		if (!apiResponse.success) return null;

		/** apiResponse.data shouldn't be undefined here since the request succeeded */
		return apiResponse.data!

	} catch (e) {
		console.log(e);
		return null;
	}
}

/** avatar_revision? (int) - This user's avatar ID.
	* Get their avatar at https://tetr.io/user-content/avatars/{ USERID }.jpg?rv={ AVATAR_REVISION }
	*
	*/
export function GenerateTetrioAvatarURL(userId: string, avatar_revision: number | undefined) {

	if (!avatar_revision) return null;
	return `https://tetr.io/user-content/avatars/${userId}.jpg?rv=${avatar_revision}`
}

export function GetUserProfileURL(username: string) {
	return `https://ch.tetr.io/u/${username}`
}

export function TournamentIsJoinableByTetrioPlayer(playerData: TetrioUserData, caps: { rank_cap?: string; tr_cap?: number; country_lock?: string }) {
}

export function TournamentDetailsEmbed(torneo: Tournament) {

	const players = torneo.players

	return (
		new EmbedBuilder()
			/** This probably will need change if later i want to implement more statuses. */
			.setTitle(`${torneo.name} (${TournamentStatusStrings[torneo.status]})`)
			.setDescription(
				`**ID del torneo**: ${torneo.id}` +
				`\n**Organizado por**: <@${torneo.organized_by}>` +
				`\n**Juego**: ${torneo.game}` +
				`\n**Descripción**: ${torneo.description ?? "N/A"}` +
				`${torneo.is_tr_capped ? `\n**TR CAP**: ${torneo.tr_cap}` : ""}` +
				`${torneo.is_rank_capped ? `\n**RANK CAP**: ${TetrioRanksMap.get(torneo.rank_cap!)?.emoji}` : ""}` +
				`${torneo.is_country_locked ? `\n**COUNTRY LOCK**: ${torneo.country_lock?.toUpperCase()}` : ""}` +
				`\n**Máximo de jugadores**: ${torneo.max_players ?? "Sin límite"}` +
				`\n**Jugadores registrados**: ${players.length}`
			)
			.setColor(Colors.White)
			.setTimestamp()
	)
}

export async function AddTetrioPlayerToDatabase({ discordId, tetrioId, challongeId }: { discordId: string; tetrioId: string; challongeId: string | null }, userData: TetrioUserData) {

	if (!discordId || !tetrioId)
		throw new Error(`Missing one of the arguments. dId: ${discordId}, tId: ${tetrioId}`);


	console.log("[DEBUG] Añadiendo nuevo PLAYER a la base de datos...");

	await PlayerModel.create({
		discord_id: discordId,
		tetrio_id: tetrioId,
		challonge_id: challongeId,
		data: userData
	});

	console.log(`[PLAYERS DATABASE] => Player (${discordId}) - ${tetrioId} se ha guardado en la base de datos.`);

}

export async function RunTetrioTournamentRegistrationChecks(userData: TetrioUserData, torneo: Tournament, discordId: string): Promise<{ allowed: boolean; reason?: string; }> {

	if (torneo.status === TournamentStatus.CLOSED) {
		return ({ allowed: false, reason: "Las inscripciones para este torneo no se encuentran abiertas." })
	}

	// In here we have to check for Tetrio caps like rank, rating and country lock and if the player is already on the tournament.
	if (torneo.players.includes(discordId)) {
		return ({ allowed: false, reason: "Ya te encuentras en la lista de participantes de este torneo." });
	}

	if (torneo.is_country_locked && torneo.country_lock?.toUpperCase() !== userData.user.country?.toUpperCase()) {
		// The country of the player doesn't match the tournament country lock
		return ({ allowed: false, reason: "El pais del jugador es distinto al pais del torneo." });
	}

	if (torneo.is_tr_capped) {
		if (userData.user.league.rank === 'z')
			return ({ allowed: false, reason: "El jugador no posee un rank actualmente." });


		if (userData.user.league.rating > torneo.tr_cap!) {
			return ({ allowed: false, reason: "El rating del jugador está por sobre el limite de TR del torneo." });
		}
	}

	if (torneo.is_rank_capped) {

		if (userData.user.league.rank === 'z')
			return ({ allowed: false, reason: "El jugador es actualmente UNRANKED en Tetra League." });

		const tournamentRankIndex = TetrioRanksArray.findIndex((rank) => rank === torneo.rank_cap);
		const userRankIndex = TetrioRanksArray.findIndex((rank) => rank === userData.user.league.rank);

		if (tournamentRankIndex < userRankIndex)
			return ({ allowed: false, reason: "El rank del jugador está por sobre el límite de rank impuesto por el torneo." });
	}

	if (torneo.max_players && torneo.players.length >= torneo.max_players) {
		return ({ allowed: false, reason: "El torneo ha alcanzado el máximo de participantes." });
	}

	return { allowed: true };
}

/** 
* This function handles the autocomplete entirely.
*	Also, this function should only return the tournaments belonging to this guild.
*/
export async function SearchTournamentByNameAutocomplete(interaction: Subcommand.AutocompleteInteraction<'cached'>) {
	const focusedOption = interaction.options.getFocused(true)
	const torneos = await TournamentModel.findAll({
		where: {
			guild_id: interaction.guildId
		}
	})

	return void await interaction.respond(
		torneos.filter(torneo => torneo.name.toLowerCase().includes(
			focusedOption.value.toLowerCase()
		)).map(torneo => ({ name: torneo.name.slice(0, 50), value: torneo.id.toString() }))
	)
}

export async function SearchTournamentById(id: number) {
	return await TournamentModel.findOne({ where: { id } })
}

export async function RemovePlayerFromTournament(torneo: Tournament, discord_id: string) {

	const playerId = discord_id

	const playerIds = Array.from(torneo.players)
	const checkedIn = Array.from(torneo.checked_in) ?? []

	const filteredPlayers = playerIds.filter(id => id !== playerId)
	const checkedInFiltered = checkedIn.filter(id => id !== playerId)

	console.log(`[TOURNAMENT] Quitando al jugador ${discord_id} del torneo ${torneo.name}`)

	torneo.checked_in = checkedInFiltered
	torneo.players = filteredPlayers

	await torneo.save()

	console.log(`[TOURNAMENT] El jugador ${discord_id} ha sido desinscrito.`)
}

/** This function will unregister this player from every OPEN tournament they are registered for. */
export async function DeletePlayerFromTournaments(discord_id: string) {

	const tournaments = await TournamentModel.findAll({
		where: {
			status: TournamentStatus.OPEN
		}
	});

	if (tournaments.length === 0) return 0;

	let removedFrom = 0;

	for (const tournament of tournaments) {

		if (tournament.players.includes(discord_id)) {
			tournament.players = tournament.players.filter(id => id !== discord_id)
			tournament.checked_in = tournament.players.filter(id => id !== discord_id)
			await tournament.save()
			removedFrom++;
		}
	}

	return removedFrom;
}

/** This function takes a discord_id and deletes the row from the PLAYERS database */
export async function DeletePlayerFromDatabase(discord_id: string) {
	console.log(`[DEBUG: Database PLAYERS] Borrando al usuario ${discord_id} de la base de datos..`);

	const deleted = await PlayerModel.destroy({
		where: {
			discord_id: discord_id
		}
	});

	console.log(`[DEBUG: Database PLAYERS] Se borraron ${deleted} jugadores de la base de datos.`);
	const removedFromTournaments = await DeletePlayerFromTournaments(discord_id);
	return {
		count: deleted,
		removed_from_tournaments: removedFromTournaments
	};
}

export async function GetTournamentsFromGuild(guild_id: string) {

	return await TournamentModel.findAll({
		where: {
			guild_id
		}
	})
}

/** Gets a single tournament from a guild */
export async function GetTournamentFromGuild(guild_id: string, tournament_id: number) {

	return await TournamentModel.findOne({
		where: {
			guild_id: guild_id,
			id: tournament_id
		}
	})

}

/** Wether or not this tournament can be edited (Is not FINISHED) */
export function IsTournamentEditable(tournament: Tournament) {
	return tournament.status !== TournamentStatus.FINISHED
}

export function GetRolesToAddArray(interaction: Command.ChatInputCommandInteraction<'cached'>) {
	const roles = [];
	const role1 = interaction.options.getRole('role-1', false);
	const role2 = interaction.options.getRole('role-2', false);
	const role3 = interaction.options.getRole('role-3', false);

	if (role1) roles.push(role1.id);
	if (role2) roles.push(role2.id);
	if (role3) roles.push(role3.id);

	return roles;
}
export interface PlayerDataOrdered {
	discordId: string;
	data: TetrioUserData;
}

export function BuildTableFromPlayerList(tournament: Tournament, playerList: PlayerDataOrdered[]) {
	// Now we need to build the table
	// We need to check whether or not this is a TETRIO tournament so we can build different tables for other games.
	const table = new AsciiTable3(tournament.name)
		.setTitleAlignCenter()
		.setHeadingAlignCenter()
		.setHeading("POSICION", "DISCORD", "TETRIO ID", "PAIS", "RANK", "TR", "APM", "PPS")
		.setAlignCenter(1)
		.setAlignCenter(2)
		.setAlignCenter(3)
		.setAlignCenter(4)
		.setAlignCenter(5)
		.setAlignCenter(6)
		.setAlignCenter(7)
		.setAlignCenter(8);

	// Good old for loop
	for (let i = 0; i < playerList.length; i++) {
		table.addRow(
			i + 1,
			playerList[i].discordId,
			playerList[i].data.user.username.toUpperCase(),
			playerList[i].data.user.country?.toUpperCase() ?? "OCULTO",
			playerList[i].data.user.league.rank.toUpperCase(),
			playerList[i].data.user.league.rating.toFixed(2),
			playerList[i].data.user.league.apm ?? "0.00",
			playerList[i].data.user.league.pps ?? "0.00"
		);
	}

	return table;
}

export async function OrderPlayerListBy(playerIds: string[], orderBy: OrderBy): Promise<PlayerDataOrdered[]> {
	// We start by getting all the players we need from the database
	const PlayersArray: PlayerDataOrdered[] = [];

	for (const id of playerIds) {
		const playerData = await PlayerModel.findByPk(id);

		if (!playerData) {
			console.log(`[DEBUG] Los datos del usuario ${id} no están en la base de datos PLAYER`);
			continue;
		}

		PlayersArray.push({ discordId: id, data: playerData.data });
	}

	// At this point we should have a list of players
	if (orderBy === "rank") {

		// We need to remember that ranks are letters here.
		// Sort is INPLACE
		PlayersArray.sort((playerA, playerB) => {

			const rankA = TetrioRanksMap.get(playerA.data.user.league.rank)!.index;
			const rankB = TetrioRanksMap.get(playerB.data.user.league.rank)!.index;

			return rankB - rankA;
		});
	}

	if (orderBy === 'tr') {
		PlayersArray.sort((playerA, playerB) => {
			const ratingA = playerA.data.user.league.rating;
			const ratingB = playerB.data.user.league.rating;

			return ratingB - ratingA;
		});
	}

	if (orderBy === 'apm') {
		PlayersArray.sort((playerA, playerB) => {
			const apmA = playerA.data.user.league.apm ?? 0;
			const apmB = playerB.data.user.league.apm ?? 0;

			return apmB - apmA;
		});
	}

	if (orderBy === 'pps') {
		PlayersArray.sort((playerA, playerB) => {
			const apmA = playerA.data.user.league.pps ?? 0;
			const apmB = playerB.data.user.league.pps ?? 0;

			return apmB - apmA;
		});
	}



	return PlayersArray;
}

export async function BuildASCIITableAttachment(interaction: Subcommand.ChatInputCommandInteraction, tournament: Tournament) {

	void await interaction.deferReply();

	const { players } = tournament;
	const orderBy = interaction.options.getString('ordenar-por', false) as OrderBy ?? 'default';

	const orderedPlayerList = await OrderPlayerListBy(players, orderBy);

	const table = BuildTableFromPlayerList(tournament, orderedPlayerList);

	const TableFile = new AttachmentBuilder(Buffer.from(table.toString()))
		.setName('playersTable.txt')
		.setDescription(`Tabla de jugadores del torneo ${tournament.name}`);

	return TableFile;
}

export function TetrioUserProfileEmbed(userData: TetrioUserData) {
	const avatarUrl = GenerateTetrioAvatarURL(userData.user._id, userData.user.avatar_revision)

	const embed = new EmbedBuilder()
		.setDescription(
			`**Username**: ${userData.user.username.toUpperCase()}`
			+ `\n**Rank**: ${TetrioRanksMap.get(userData.user.league.rank)?.emoji}`
			+ `\n**Rating**: ${userData.user.league.rating.toFixed(2)}`
			+ `\n**Bio**: ${userData.user.bio ?? "No bio."}`
			+ `\n\n[Enlace al perfil](${GetUserProfileURL(userData.user.username)})`
		)
		.setColor(Colors.Blue)

	if (avatarUrl) {
		embed.setThumbnail(avatarUrl)
	}

	return embed
}

export async function AddPlayerIdToTournamentPlayerList(user: User, tournament: Tournament) {

	// Add player to the tournament
	console.log(`[TOURNAMENT] Añadiendo nuevo jugador ${user.id} (${user.username}) al torneo ${tournament.name}`);

	if (tournament.players.includes(user.id))
		return console.log('[TOURNAMENT] El jugador ya estába en la lista de jugadores inscritos en el torneo')

	const players = Array.from(tournament.players)
	players.push(user.id)
	tournament.players = players
	console.log("[TOURNAMENT] El jugador ha sido añadido a la lista");

	await tournament.save()
	console.log("[TOURNAMENT] El torneo ha sido guardado");
}

export async function GetPlayerFromDatabase(discordId: Snowflake) {
	return await PlayerModel.findByPk(discordId);
}