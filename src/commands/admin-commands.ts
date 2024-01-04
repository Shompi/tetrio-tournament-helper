import { Subcommand } from "@sapphire/plugin-subcommands"
import { TournamentStatus } from "../sequelize/Tournaments.js";
import {
	ActionRowBuilder,
	AttachmentBuilder,
	ButtonBuilder,
	ButtonStyle,
	ChannelType,
	ColorResolvable,
	Colors,
	ComponentType,
	EmbedBuilder,
	GuildTextBasedChannel,
	PermissionFlagsBits,
} from "discord.js";

import {
	BuildASCIITableAttachment,
	BuildCSVTableAttachment,
	BuildEmbedPlayerList,
	BuildJSONAttachment,
	BuildTableForChallonge,
	ClearTournamentPlayerList,
	EmbedMessage,
	FinishTournament,
	GetRolesToAddArray,
	GetTournamentFromGuild,
	IsTournamentEditable,
	OrderBy,
	OrderPlayerListBy,
	SearchTournamentByNameAutocomplete,
	TetrioRanksArray,
	TournamentDetailsEmbed
} from "../helper-functions/index.js";

import { CommonMessages } from "../helper-functions/common-messages.js";


export class AdminCommands extends Subcommand {

	public constructor(context: Subcommand.LoaderContext, options: Subcommand.Options) {
		super(context, {
			...options,
			subcommands: [
				{
					name: 'anuncio',
					chatInputRun: 'chatInputAnnounce',
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
				// Announcement command
				.addSubcommand(announce =>
					announce.setName('anuncio')
						.setDescription('Crea y envia un mensaje dentro de un embed a un canal de texto.')
						.addChannelOption(channel =>
							channel.setName('canal')
								.setDescription('Canal al que quieres enviar este anuncio')
								.setRequired(true)
								.addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
						)
						.addStringOption(description =>
							description.setName('descripcion')
								.setDescription('Una detallada descripción de tu anuncio, hasta 1500 caracteres.')
								.setRequired(true)
						)
						.addStringOption(titulo =>
							titulo.setName('titulo')
								.setDescription('El titulo de este anuncio')
								.setRequired(false)
						)
						.addStringOption(color =>
							color.setName('color')
								.setDescription('El color que quieres que tenga el embed (barra lateral izquierda)')
								.addChoices(
									{ name: "Amarillo", value: "Yellow" },
									{ name: "Azul", value: "Blue" },
									{ name: "Blanco", value: "White" },
									{ name: "Dorado", value: "Gold" },
									{ name: "Fucsia", value: "Fuchsia" },
									{ name: "Morado", value: "Purple" },
									{ name: "Naranja", value: "Orange" },
									{ name: "Rojo", value: "Red" },
									{ name: "Verde", value: "Green" },
									{ name: "Verde Oscuro", value: "DarkGreen" },
									{ name: "Random", value: "Random" },
								)
						)
						.addStringOption(imagen =>
							imagen.setName('imagen')
								.setDescription('Si quieres adjuntar una imagen en el embedido, escribe la URL aqui')
								.setRequired(false)
						)
						.addStringOption(thumbnail =>
							thumbnail.setName('miniatura')
								.setDescription('URL de la imagen miniatura del embed')
								.setRequired(false)
						)
						.addStringOption(footer =>
							footer.setName('pie')
								.setDescription('El pié de página de este anuncio')
								.setRequired(false)
						)
						.addMentionableOption(mencion =>
							mencion.setName('mencion1')
								.setDescription('Rol o Usuario que quieres mencionar')
								.setRequired(false)
						)
						.addMentionableOption(mencion =>
							mencion.setName('mencion2')
								.setDescription('Rol o Usuario que quieres mencionar')
								.setRequired(false)
						)
						.addMentionableOption(mencion =>
							mencion.setName('mencion3')
								.setDescription('Rol o Usuario que quieres mencionar')
								.setRequired(false)
						)
				)

		}, { idHints: ["1183537285761859665"] })
	}

	public async chatInputAnnounce(interaction: Subcommand.ChatInputCommandInteraction<'cached'>) {

		const options = {
			channel: interaction.options.getChannel('canal', true) as GuildTextBasedChannel,
			description: interaction.options.getString('descripcion')?.replace("\\n", "\n"),
			title: interaction.options.getString('titulo', false),
			color: interaction.options.getString('color', false),
			imageURL: interaction.options.getString('imagen', false),
			thumbnailURL: interaction.options.getString('miniatura', false),
			footer: interaction.options.getString('pie', false),
			mention1: interaction.options.getMentionable('mencion1', false) ?? " ",
			mention2: interaction.options.getMentionable('mencion2', false) ?? " ",
			mention3: interaction.options.getMentionable('mencion3', false) ?? " ",
		}

		if (!options.channel.isTextBased())
			return await interaction.reply({ content: 'El canal que has ingresado no es un canal de texto, por favor ejecuta este comando nuevamente y asegúrate de usar un canal de texto.', ephemeral: true });

		if (interaction.guild.members.me?.permissionsIn(options.channel).has("SendMessages")) {

			if (options.description && options.description.length >= 1750)
				return await interaction.reply({ content: 'Lo siento, la cantidad de caracteres que has ingresado en la descripción excede el máximo establecido (1500+).', ephemeral: true })

			if (!(/^.*\.(jpg|gif|png|jpeg|webp)$/i.test(options.imageURL ?? "")))
				options.imageURL = null;

			if (!(/^.*\.(jpg|gif|png|jpeg|webp)$/i.test(options.thumbnailURL ?? "")))
				options.thumbnailURL = null;

			const embed = new EmbedBuilder()
				.setAuthor({
					name: `Anuncio de ${interaction.member.displayName}`,
					iconURL: interaction.member.displayAvatarURL({ size: 64 }) ?? interaction.user.displayAvatarURL({ size: 64 }),
				})
				.setTitle(options.title)
				.setDescription(options.description ?? null)
				.setColor(options.color as ColorResolvable ?? "Random")
				.setFooter(options.footer ? { text: options.footer } : null)
				.setImage(options.imageURL)
				.setThumbnail(options.thumbnailURL)

			// eslint-disable-next-line @typescript-eslint/restrict-template-expressions
			const success = await options.channel.send({ embeds: [embed], content: `${options.mention1} ${options.mention2} ${options.mention3}` }).catch(console.error);

			if (!success)
				return await interaction.reply({ content: 'Ocurrió un error al intentar enviar el anuncio, revisa mis permisos dentro del canal y asegurate de que pueda enviar mensajes.', ephemeral: true });

			return await interaction.reply({ content: 'El anunció fue enviado con éxito.', ephemeral: true });

		}
	}

	public async autocompleteRun(interaction: Subcommand.AutocompleteInteraction<'cached'>) {

		if (interaction.options.getFocused(true).name === 'nombre-id') {
			return void await SearchTournamentByNameAutocomplete(interaction)
		}
	}
}