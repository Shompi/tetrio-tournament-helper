import { CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model, Sequelize } from "sequelize";

const sequelize = new Sequelize({
	dialect: 'sqlite',
	storage: "./databases/Blocklist.sqlite",
	logging: (...msgs) => console.log(`[BLOCKLIST] => ${msgs}`)
})

export interface BlocklistedUser extends Model<InferAttributes<BlocklistedUser>, InferCreationAttributes<BlocklistedUser>> {
	discord_id: string;
	isBlacklisted: CreationOptional<boolean>
	reason: CreationOptional<string | null>
}

const BlocklistModel = sequelize.define<BlocklistedUser>('Blocklist', {
	discord_id: {
		type: DataTypes.STRING,
		unique: true,
		primaryKey: true
	},
	isBlacklisted: {
		type: DataTypes.BOOLEAN,
		defaultValue: false,
	},
	reason: {
		type: DataTypes.STRING,
		allowNull: true,
		defaultValue: "No especificada.",
	}
})

// await sequelize.sync();

export { BlocklistModel }