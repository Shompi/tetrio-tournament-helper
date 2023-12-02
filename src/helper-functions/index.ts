/**
* This file will contain tetrio api function calls
* and maybe other stuff.
*/
import { request } from "undici"

export type TetrioApiCacheStatus = "hit" | "miss" | "awaited"
export type TetrioUserRole = "anon" | "user" | "bot" | "halfmod" | "mod" | "admin" | "sysop" | "banned"

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

enum TetrioRanks {
	UNRANKED = 0,
	D,
	D_PLUS,

}

const TETRIO_BASE = "https://ch.tetr.io/api"
const TETRIO_ENDPOINTS = {
	users: TETRIO_BASE + "/users/",
}

export const TetrioRanksArray = ["D", "D+", "C-", "C", "C+", "B-", "B", "B+", "A-", "A", "A+", "S-", "S", "S+", "SS", "U", "X"]

export async function GetUserDataFromTetrio(_username: string): Promise<TetrioUserData | null> {
	try {
		const username = _username.toLowerCase();

		const apiResponse = await request(TETRIO_BASE + TETRIO_ENDPOINTS.users + username).then(response => response.body.json()) as APIUserResponse;

		if (!apiResponse.success) return null;

		/** apiResponse.data shouldn't be undefined here since the request succeeded */
		return apiResponse.data!

	} catch (e) {
		console.log(e);
		return null;
	}
}


export function IsJoinableByPlayer(playerData: TetrioUserData, caps: { rank_cap: string; tr_cap: number; }) {
}