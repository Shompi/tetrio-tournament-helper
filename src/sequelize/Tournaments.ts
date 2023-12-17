import { Sequelize, DataTypes, InferAttributes, InferCreationAttributes, CreationOptional, Model } from 'sequelize'
import { GameName } from '../helper-functions/index.js';
import { Snowflake } from 'discord.js';

const sequelize = new Sequelize({
	dialect: "sqlite",
	storage: "./databases/Tournaments.sqlite",
	logging: (...msgs) => console.log(`[TOURNAMENTS DATABASE] => ${msgs}`)
});

export const TournamentStatusStrings = [
	"Inscripciones Cerradas",
	"Inscripciones Abiertas",
	"Terminado"
] as const

export enum TournamentStatus {
	CLOSED = 0,
	OPEN,

	/** 
	*	This will make the tournament uneditable
	*/
	FINISHED
}

export type RegisteredPlayer = {
	discordId: Snowflake
	challongeId: string | null
}

export interface Tournament extends Model<InferAttributes<Tournament>, InferCreationAttributes<Tournament>> {
	// Some fields are optional when calling UserModel.create() or UserModel.build()

	/** Automatically created by the database */
	id: CreationOptional<number>;

	/** Should default to the guild id on creation */
	guild_id: string;

	/** Discord ID of the organizer */
	organized_by: string;

	name: string;

	game: GameName;

	/** The description of this tournament, if any */
	description: CreationOptional<string | null>;

	max_players: CreationOptional<number | null>;

	/** Should be open by default */
	status: CreationOptional<TournamentStatus>;

	/** Stringified array with discord IDs */
	players: RegisteredPlayer[];

	/**
	*	Participants that have checked in for this tournament
	*	NOTE: Participants can still check in if the tournament is marked as CLOSED for registration.
	*/
	checked_in: Snowflake[]

	is_rank_capped: CreationOptional<boolean>;

	/** The maximum rank players are allowed to join (S, S+, SS, etc) */
	rank_cap: CreationOptional<string | null>;

	/** The country from which players are allowed to join from (Only for tetrio tournaments since this is based of API information) */
	is_country_locked: CreationOptional<boolean>;

	/** ISO 3166 two letter country code. */
	country_lock: CreationOptional<string | null>;

	is_tr_capped: CreationOptional<boolean>;

	/** 25_000 max */
	tr_cap: CreationOptional<number | null>;

	/** The Discord ID of the winner of this tournament, if any. */
	winner_id: CreationOptional<string | null>;

	/** Roles to add to the member that registers to this tournament */
	add_roles: Snowflake[];

	/** Whether or not this tournament has their check in process open */
	is_checkin_open: CreationOptional<boolean>;
	checkin_channel: CreationOptional<Snowflake | null>;
	checkin_threadId: CreationOptional<Snowflake | null>;
	checkin_message: CreationOptional<Snowflake | null>;

	registration_message: CreationOptional<Snowflake | null>;
	registration_channel: CreationOptional<Snowflake | null>;
	registration_open_until: CreationOptional<Date | null>;
	checkin_open_until: CreationOptional<Date | null>;
}

const TournamentModel = sequelize.define<Tournament>('Tournament', {
	id: {
		type: DataTypes.INTEGER,
		autoIncrement: true,
		unique: true,
		primaryKey: true,
	},
	organized_by: {
		type: DataTypes.STRING,
		defaultValue: "NULL",
		allowNull: false,
	},

	guild_id: {
		type: DataTypes.STRING,
		defaultValue: "UNKNOWN GUILD",
		unique: false,
		allowNull: false,
	},

	name: {
		type: DataTypes.STRING,
		defaultValue: "NAME NOT SET",
		allowNull: false,
	},

	game: {
		type: DataTypes.STRING,
		allowNull: false,
	},

	description: {
		type: DataTypes.STRING,
		allowNull: true,
		defaultValue: null
	},

	max_players: {
		type: DataTypes.INTEGER,
		defaultValue: null,
		allowNull: true,
	},
	/** This will be an enum, 0 = CLOSED, 1 = OPEN */
	status: {
		type: DataTypes.TINYINT,
		defaultValue: TournamentStatus.OPEN,
	},

	/** Array of Discord IDs, it needs to be parsed as json before operating on it */
	players: {
		type: DataTypes.TEXT,
		get() {
			return JSON.parse((this.getDataValue('players') as unknown as string)) as Snowflake[];
		},
		set(value) {
			return this.setDataValue('players', JSON.stringify(value) as unknown as RegisteredPlayer[])
		},
		defaultValue: "[]"
	},

	/** Array of discord Id's of players that checked in */
	checked_in: {
		type: DataTypes.TEXT,
		get() {
			return JSON.parse((this.getDataValue('checked_in') as unknown as string)) as Snowflake[]
		},
		set(val) {
			return this.setDataValue('checked_in', JSON.stringify(val) as unknown as Snowflake[])
		},
		defaultValue: "[]",
	},

	is_rank_capped: {
		type: DataTypes.BOOLEAN,
		defaultValue: false,
	},

	rank_cap: {
		type: DataTypes.STRING,
		defaultValue: null,
		allowNull: true,
	},

	is_tr_capped: {
		type: DataTypes.BOOLEAN,
		defaultValue: false,
	},

	tr_cap: {
		type: DataTypes.INTEGER,
		defaultValue: 0,
		allowNull: true
	},

	is_country_locked: {
		type: DataTypes.BOOLEAN,
		defaultValue: false,
	},
	country_lock: {
		type: DataTypes.STRING,
		defaultValue: null,
		allowNull: true
	},
	winner_id: {
		type: DataTypes.STRING,
		defaultValue: null,
		allowNull: true,
	},
	add_roles: {
		type: DataTypes.STRING,
		defaultValue: "[]",
		get() {
			return JSON.parse((this.getDataValue('add_roles') as unknown as string)) as Snowflake[]
		},
		set(val) {
			return this.setDataValue('add_roles', JSON.stringify(val) as unknown as Snowflake[])
		},
	},

	is_checkin_open: {
		type: DataTypes.BOOLEAN,
		defaultValue: false,
	},
	checkin_channel: {
		type: DataTypes.STRING,
		defaultValue: null,
		allowNull: true,
	},
	checkin_message: {
		type: DataTypes.STRING,
		defaultValue: null,
		allowNull: true
	},
	checkin_threadId: {
		type: DataTypes.STRING,
		defaultValue: null,
		allowNull: true
	},
	registration_channel: {
		type: DataTypes.STRING,
		defaultValue: null,
		allowNull: true
	},
	registration_message: {
		type: DataTypes.STRING,
		defaultValue: null,
		allowNull: true
	},
	registration_open_until: {
		type: DataTypes.DATE,
		defaultValue: null,
		allowNull: true
	},
	checkin_open_until: {
		type: DataTypes.DATE,
		defaultValue: null,
		allowNull: true
	}
});

console.log("[DEBUG] Sincronizando tablas en sequelize...");
await sequelize.sync();
console.log("[DEBUG] La sincronización ha terminado!");

export { TournamentModel }