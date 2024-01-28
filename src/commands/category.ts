import { Subcommand } from "@sapphire/plugin-subcommands";
import { CreateCategory, EditCategory, GetAllGuildCategories, PrettyMsg } from "../helper-functions/index.js";
import { Colors } from "discord.js";

export class CategoryCommands extends Subcommand {

	public constructor(context: Subcommand.LoaderContext, options: Subcommand.Options) {
		super(context, {
			...options,
			subcommands: [
				{
					name: 'crear',
					chatInputRun: 'chatInputCreateCategory'
				},
				{
					name: 'editar',
					chatInputRun: 'chatInputEditCategory'
				}
			]
		});
	}


	public override registerApplicationCommands(registry: Subcommand.Registry) {
		registry.registerChatInputCommand((builder) =>
			builder //
				.setName('categorias')
				.setDescription('Comandos relacionados a las categorias de torneos de este servidor.')
				.addSubcommand(create =>
					create.setName('crear')
						.setDescription('Crea una nueva categoría.')
						.addStringOption(name =>
							name.setName('categoria')
								.setDescription('El nombre de la categoría.')
								.setRequired(true)
								.setMaxLength(150)
								.setMinLength(1)
						)
						.addStringOption(desc =>
							desc.setName('descripcion')
								.setDescription('Descripción de esta categoria (Máximo 512 caracteres).')
								.setMaxLength(512)
						)
				)
				.addSubcommand(editar =>
					editar.setName('editar')
						.setDescription('Edita el nombre de una categoría.')
						.addStringOption(categoria =>
							categoria.setName('categoria')
								.setDescription('El nombre o ID de la categoría que quieres editar.')
								.setAutocomplete(true)
								.setRequired(true)
								.setMaxLength(150)
								.setMinLength(1)
						)
						.addStringOption(name =>
							name.setName('nuevo-nombre')
								.setDescription('Nuevo nombre de la categoría.')
								.setRequired(true)
								.setMinLength(1)
								.setMaxLength(150)
						)
						.addStringOption(desc =>
							desc.setName('descripcion')
								.setDescription('Nueva descripción de esta categoría.')
								.setMaxLength(512)
						)
				), { idHints: ["1200746353429586040"] }
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

			console.log("[CATEGORIES] La categoría ha sido creada.")

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
			categoryId: parseInt(interaction.options.getString('nombre', true)),
			name: interaction.options.getString('nombre', true),
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
						description: `✅ ¡La categoría ha sido editada exitósamente!\n\n**Nuevo nombre:** ${category.name}**`,
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
}