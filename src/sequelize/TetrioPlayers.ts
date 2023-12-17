import { Sequelize, DataTypes, InferAttributes, InferCreationAttributes, CreationOptional, Model } from 'sequelize'
import { TetrioPlayerRelevantData } from '../helper-functions/index.js';

const sequelize = new Sequelize({
	dialect: "sqlite",
	storage: "./databases/Players.sqlite",
	logging: (...msgs) => console.log(`[PLAYERS DATABASE] => ${msgs}`)
});

export interface Player extends Model<InferAttributes<Player>, InferCreationAttributes<Player>> {
	// Some fields are optional when calling UserModel.create() or UserModel.build()
	discord_id: string;
	tetrio_id: string;
	challonge_id: CreationOptional<string | null>;
	data: TetrioPlayerRelevantData;
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
			return JSON.parse(this.getDataValue('data') as unknown as string) as TetrioPlayerRelevantData;
		},
		set(value) {
			this.setDataValue('data', JSON.stringify(value) as unknown as TetrioPlayerRelevantData);
		}
	},
	challonge_id: {
		type: DataTypes.STRING,
		allowNull: true,
		defaultValue: null
	}
})


console.log("[PLAYERS] Sincronizando tablas en sequelize...");
sequelize.sync({ alter: true });
console.log("[PLAYERS] La sincronización ha terminado!");

export { PlayerModel }