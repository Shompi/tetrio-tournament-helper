import { Subcommand } from "@sapphire/plugin-subcommands"
import { PlayerModel } from "../sequelize/Tournaments.js";
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, Colors, ComponentType, EmbedBuilder, PermissionFlagsBits } from "discord.js";
import { GenerateTetrioAvatarURL } from "../helper-functions/index.js";
import { DeletePlayerFromDatabase } from "../helper-functions/index.js";


export class MySlashCommand extends Subcommand {


	public constructor(context: Subcommand.LoaderContext, options: Subcommand.Options) {
		super(context, {
			...options,
			subcommands: [
				{
					name: 'eliminar-jugador',
					chatInputRun: 'chatInputDeletePlayer'
				},
			]
		});
	}


	public override registerApplicationCommands(registry: Subcommand.Registry) {
		registry.registerChatInputCommand((builder) => {
			builder.setName("admin")
				.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
				.setDMPermission(false)
				.setDescription('Varios comandos de utilidad para admins')
				.addSubcommand(deletePlayer =>
					deletePlayer.setName('eliminar-jugador')
						.setDescription('Elimina a un jugador de la base de datos')
						.addUserOption(discorid =>
							discorid.setName('discord-id')
								.setDescription('La id de Discord del usuario que quieres eliminar')
								.setRequired(true)
						)
				)
		}, { idHints: ["1183537285761859665"] })
	}
	public async chatInputDeletePlayer(interaction: Subcommand.ChatInputCommandInteraction) {
		// Your code goes here
		const target = interaction.options.getUser('discord-id', true)
		const player = await PlayerModel.findOne({
			where: {
				discord_id: target.id
			}
		})

		if (!player) return void await interaction.reply({ content: `El usuario ${target.username} no está en la base de datos.` })

		const ConfirmButton = new ButtonBuilder()
			.setCustomId('pl-eliminar')
			.setLabel('Confirmar')
			.setStyle(ButtonStyle.Danger)

		const ConfirmRow = new ActionRowBuilder<ButtonBuilder>()
			.setComponents(ConfirmButton)

		const playerInfo = new EmbedBuilder()
			.setColor(Colors.Red)
			.setDescription(`**Username**: ${player.data.user.username}\n**Rank**: ${player.data.user.league.rank.toUpperCase()}`)

		if (player.data.user.avatar_revision) {
			playerInfo.setThumbnail(GenerateTetrioAvatarURL(player.data.user.username, player.data.user.avatar_revision))
		}

		const initialReply = await interaction.reply({
			content: `¿Estás seguro de que quieres eliminar a este jugador?\nAl confirmar, los datos vinculados a este usuario serán eliminados de la base de datos y el jugador será desinscrito de cualquier torneo en el cual estén inscritos.\nÉsta acción se **cancelará** automáticamente en 60 segundos.`,
			embeds: [playerInfo],
			components: [ConfirmRow],
			ephemeral: true
		})

		const Action = await initialReply.awaitMessageComponent({
			componentType: ComponentType.Button,
			time: 60_000,
			filter: (interaction) => interaction.customId === "pl-eliminar"
		}).catch(_ => null)

		if (!Action) return

		void await Action.update({ content: 'Eliminando al jugador de la base de datos, espera un momento...' })

		const success = await DeletePlayerFromDatabase(target.id)

		const SuccessInfo = new EmbedBuilder()
			.setColor(Colors.Green)
			.setDescription(`Jugador eliminado.\nTorneos afectados: ${success.removed_from_tournaments}`)
			.setTimestamp()

		return void await Action.editReply({
			content: `✅ El jugador ha sido eliminado exitosamente!`,
			embeds: [SuccessInfo],
			components: []
		})
	}
}
