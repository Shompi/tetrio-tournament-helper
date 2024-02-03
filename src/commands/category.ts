import { Subcommand } from "@sapphire/plugin-subcommands";
import { CreateCategory, EditCategory, GetAllGuildCategories, GetCategoryFromGuild, PrettyMsg } from "../helper-functions/index.js";
import { Colors, PermissionFlagsBits } from "discord.js";
import { codeBlock } from "@sapphire/utilities";

export class CategoryCommands extends Subcommand {

	public constructor(context: Subcommand.LoaderContext, options: Subcommand.Options) {
		super(context, {
			...options,
			subcommands: [
				{
					name: 'crear',
					chatInputRun: 'chatInputCreateCategory',
				},
				{
					name: 'editar',
					chatInputRun: 'chatInputEditCategory',
				},
				{
					name: 'ver',
					chatInputRun: 'chatInputShowCategory',
				}
			]
		});
	}


	public override registerApplicationCommands(registry: Subcommand.Registry) {
		registry.registerChatInputCommand((builder) =>
			builder //
				.setName('categorias')
				.setDMPermission(false)
				.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
				.setDescription('Comandos relacionados a las categorias de torneos de este servidor.')
				.addSubcommand(create =>
					create.setName('crear')
						.setDescription('Crea una nueva categoría.')
						.addStringOption(name =>
							name.setName('categoria')
								.setDescription('El nombre de la categoría.')
								.setRequired(true)
								.setMaxLength(64)
								.setMinLength(1)
						)
						.addStringOption(desc =>
							desc.setName('descripcion')
								.setDescription('Descripción de esta categoria (Máximo 500 caracteres).')
								.setMaxLength(500)
						)
				)
				.addSubcommand(editar =>
					editar.setName('editar')
						.setDescription('Edita el nombre de una categoría.')
						.addStringOption(categoria =>
							categoria.setName('categoria')
								.setDescription('Categoría que quieres editar.')
								.setAutocomplete(true)
								.setRequired(true)
								.setMaxLength(64)
								.setMinLength(1)
						)
						.addStringOption(name =>
							name.setName('nuevo-nombre')
								.setDescription('Nuevo nombre de la categoría.')
								.setRequired(true)
								.setMinLength(1)
								.setMaxLength(64)
						)
						.addStringOption(desc =>
							desc.setName('descripcion')
								.setDescription('Nueva descripción de esta categoría.')
								.setMaxLength(500)
						)
				)
				.addSubcommand(show =>
					show.setName('ver')
						.setDescription('Ve los detalles de una categoría')
						.addStringOption(categoria =>
							categoria.setName('categoria')
								.setDescription('Nombre de la categoría.')
								.setAutocomplete(true)
								.setMaxLength(64)
						)
				), { idHints: ["1202465127618576404"] }
		)
	}

	public async chatInputCreateCategory(interaction: Subcommand.ChatInputCommandInteraction<'cached'>) {

		await interaction.deferReply()

		const options = {
			name: interaction.options.getString('categoria', true),
			description: interaction.options.getString('descripcion', false)
		}

		try {
			console.log(`[CATEGORIES] Creando categoria ${options.name}`)
			const createdCategory = await CreateCategory({
				guildId: interaction.guildId,
				name: options.name,
				description: options.description
			})

			return void await interaction.editReply({
				embeds: [
					PrettyMsg({
						description: `✅ ¡La categoría **${createdCategory.name}** se ha creado exitosamente!`,
						color: Colors.Green
					})
				]
			})

		} catch (e) {

			console.log(`[CATEGORIES] Ocurrió un error creando la categoria ${options.name}`)
			return void await interaction.editReply({
				embeds: [
					PrettyMsg({
						description: `❌ Ocurrió un error con esta interacción.\n**Error:** ${e}`,
						color: Colors.Red
					})
				]
			})
		}

	}

	public async chatInputEditCategory(interaction: Subcommand.ChatInputCommandInteraction<'cached'>) {

		await interaction.deferReply()

		const options = {
			categoryId: interaction.options.getString('categoria', true),
			name: interaction.options.getString('nuevo-nombre', true),
			description: interaction.options.getString('descripcion', false)
		}


		try {

			const category = await EditCategory({
				categoryId: options.categoryId,
				guildId: interaction.guildId,
				name: options.name,
				description: options.description
			})

			return void await interaction.editReply({
				embeds: [
					PrettyMsg({
						description: `✅ ¡La categoría ha sido editada exitósamente!\n\n**Nuevo nombre:** \`${category.name}\``,
						color: Colors.Green
					})
				]
			})

		} catch (e) {

			console.error(e);

			return void await interaction.editReply({
				embeds: [
					PrettyMsg({
						description: `❌ Ocurrió un error al intentar editar esta categoría.\n**Error:** ${e}`,
						color: Colors.Red
					})
				]
			})
		}
	}

	public async chatInputShowCategory(interaction: Subcommand.ChatInputCommandInteraction<'cached'>) {

		const categoryId = interaction.options.getString('categoria', true)
		const categories = await GetAllGuildCategories(interaction.guildId)

		if (categories.length === 0)
			return void await interaction.reply({
				embeds: [
					PrettyMsg({
						description: "Este servidor no tiene ninguna categoría.\nPuedes crear nuevas categorias utilizando el comando `/categorias crear`",
						color: Colors.Blue
					})
				]
			})


		if (!categoryId) {

			/** List all categories of this guild */
			const description = categories.map((category, idx) =>
				`${(idx + 1).toString().padStart(2, '0')} - **${category.name}**`
			).join("\n")


			return void await interaction.reply({
				embeds: [
					PrettyMsg({
						description: codeBlock(description),
						color: Colors.Blue
					})
				]
			})

		} else {

			const category = categories.find(category => category.id === categoryId)

			if (!category) return void await interaction.reply({
				embeds: [
					PrettyMsg({
						description: `❌ No se encontró una categoría con ese nombre.`,
						color: Colors.Red
					})
				]
			})

			// Success
			return void await interaction.reply({
				embeds: [
					PrettyMsg({
						description: `**Nombre de la categoría:** ${category.name}\n**Descripción:** ${category.description}\n**UUID:** \`${category.id}\``,
						color: Colors.Blue
					})
				]
			})
		}
	}
}