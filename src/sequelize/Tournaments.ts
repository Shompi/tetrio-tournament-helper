import { Sequelize, DataTypes, InferAttributes, InferCreationAttributes, CreationOptional, Model } from 'sequelize'
import { GameName, TetrioUserData } from '../helper-functions/index.js';
import { Snowflake } from 'discord.js';

const sequelize = new Sequelize({
	dialect: "sqlite",
	storage: "./databases/Tournaments.sqlite",
	logging: (...msgs) => console.log(`[SEQUELIZE] => ${msgs}`)
});

export enum TournamentStatus {
	CLOSED = 0,
	OPEN,

	/** 
	*	This will make the tournament uneditable
	*/
	FINISHED
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
	players: CreationOptional<Snowflake[]>;

	/**
	*	Participants that have checked in for this tournament
	*	NOTE: Participants can still check in if the tournament is marked as CLOSED for registration.
	*/
	checked_in: CreationOptional<Snowflake[]>

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
	add_roles: CreationOptional<Snowflake[]>
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
			return this.setDataValue('players', JSON.stringify(value) as unknown as Snowflake[])
		},
		defaultValue: "[]"
	},

	checked_in: {
		type: DataTypes.TEXT,
		get() {
			return JSON.parse((this.getDataValue('checked_in') as unknown as string)) as Snowflake[]
		},
		set(val) {
			return this.setDataValue('checked_in', JSON.stringify(val) as unknown as Snowflake[])
		},
		defaultValue: "[]"
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
	}
});

export interface Player extends Model<InferAttributes<Player>, InferCreationAttributes<Player>> {
	// Some fields are optional when calling UserModel.create() or UserModel.build()
	discord_id: string;
	tetrio_id: string;
	data: TetrioUserData;
}

const PlayerModel = sequelize.define<Player>('Player', {
	discord_id: {
		type: DataTypes.STRING,
		primaryKey: true,
		allowNull: false,
		unique: true
	},
	tetrio_id: {
		type: DataTypes.STRING,
		allowNull: false,
		unique: true
	},
	/** The last updated data of the user */
	data: {
		type: DataTypes.TEXT,
		allowNull: false,
		defaultValue: "{}",
		get() {
			return JSON.parse(this.getDataValue('data') as unknown as string) as TetrioUserData;
		},
		set(value) {
			this.setDataValue('data', JSON.stringify(value) as unknown as TetrioUserData);
		}
	}
})


console.log("[DEBUG] Sincronizando tablas en sequelize...");
// await sequelize.sync({ alter: true });
console.log("[DEBUG] La sincronización ha terminado!");

export { TournamentModel, PlayerModel }