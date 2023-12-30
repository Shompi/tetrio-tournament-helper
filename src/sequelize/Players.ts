import { CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model, Sequelize } from "sequelize";

const sequelize = new Sequelize({
	dialect: 'sqlite',
	storage: "./databases/Players.sqlite",
	logging: (...msgs) => console.log(`[PLAYERS DATABASE] => ${msgs}`)
})

export interface Player extends Model<InferAttributes<Player>, InferCreationAttributes<Player>> {
	discord_id: string;
	/** Array of Ids of tournaments this player has participated on */
	tournaments_ids: number[];
	tournaments_won: CreationOptional<number>;

}

const PlayerModel = sequelize.define<Player>('Player', {
	discord_id: {
		type: DataTypes.STRING,
		unique: true,
		primaryKey: true
	},
	tournaments_ids: {
		type: DataTypes.TEXT,
		defaultValue: "[]",
		get() {
			return JSON.parse(this.getDataValue('tournaments_ids') as unknown as string) as number[]
		},
		set(val) {
			return this.setDataValue('tournaments_ids', JSON.stringify(val) as unknown as number[])
		},
	},
	tournaments_won: {
		type: DataTypes.INTEGER,
		defaultValue: 0,
		allowNull: false,
	}
})

console.log("[PLAYER] Sincronizando tablas...");
await sequelize.sync();
console.log("[PLAYER] Sincronización terminada.");

export { PlayerModel }