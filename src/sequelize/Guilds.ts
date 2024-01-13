import { Sequelize, DataTypes, InferAttributes, InferCreationAttributes, CreationOptional, Model } from 'sequelize'
import { TetrioPlayerRelevantData } from '../helper-functions/index.js';
import { Snowflake } from 'discord.js';

const sequelize = new Sequelize({
	dialect: "sqlite",
	storage: "./databases/Guilds.sqlite",
	//logging: (...msgs) => console.log(`[GUILDS DATABASE] => ${msgs.forEach(msg => console.log(msg))}`)
});

export interface GuildConfigs extends Model<InferAttributes<GuildConfigs>, InferCreationAttributes<GuildConfigs>> {
	// Some fields are optional when calling UserModel.create() or UserModel.build()
	guild_id: Snowflake
	
	/** The channel where log messages like "User x failed to join tournament because of y" messages are going to. Must be a text based channel */
	logging_channel: CreationOptional<Snowflake | null>

	/** The roles that are allowed to use admin commands aswell as tournament commands on this guild  */
	allowed_roles: Snowflake[]
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
	}
})


console.log("[GUILDS] Sincronizando tablas en sequelize...");
await sequelize.sync();
console.log("[GUILDS] La sincronización ha terminado!");

export { GuildModel }