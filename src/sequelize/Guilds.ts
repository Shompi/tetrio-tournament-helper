import { Sequelize, DataTypes, InferAttributes, InferCreationAttributes, CreationOptional, Model } from 'sequelize'
import { Snowflake } from 'discord.js';

const sequelize = new Sequelize({
	dialect: "sqlite",
	storage: "./databases/Guilds.sqlite",
	logging: false,
	//logging: (...msgs) => console.log(`[GUILDS DATABASE] => ${msgs.forEach(msg => console.log(msg))}`)
});

export type Category = {
	/** ID of the category */
	id: string
	/** The name of this category (should have a maximum length of 64 chars) (UNIQUE) */
	name: string
	/** The description of this category (should have a maximum length of 500) */
	description: null | string
}

export interface GuildConfigs extends Model<InferAttributes<GuildConfigs>, InferCreationAttributes<GuildConfigs>> {
	// Some fields are optional when calling UserModel.create() or UserModel.build()
	guild_id: Snowflake

	/** The channel where log messages like "User x failed to join tournament because of y" messages are going to. Must be a text based channel */
	logging_channel: CreationOptional<Snowflake | null>

	/** The roles that are allowed to use admin commands aswell as tournament commands on this guild  */
	allowed_roles: Snowflake[]

	/** The created categories that belong to this guild */
	categories: Category[]
}

const GuildModel = sequelize.define<GuildConfigs>('Guild', {
	guild_id: {
		type: DataTypes.STRING,
		allowNull: false,
		primaryKey: true
	},
	logging_channel: {
		type: DataTypes.STRING,
		allowNull: true,
	},
	allowed_roles: {
		type: DataTypes.TEXT,
		defaultValue: "[]",
		get() {
			return JSON.parse(this.getDataValue('allowed_roles') as unknown as string) as Snowflake[]
		},
		set(val) {
			this.setDataValue('allowed_roles', JSON.stringify(val) as unknown as Snowflake[])
		},
	},
	categories: {
		type: DataTypes.TEXT,
		defaultValue: "[]",
		get() {
			return JSON.parse(this.getDataValue('categories') as unknown as string) as Category[]
		},
		set(val) {
			this.setDataValue('categories', JSON.stringify(val) as unknown as Category[])
		},
	}
})

export { GuildModel }