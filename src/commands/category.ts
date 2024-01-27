import { Subcommand } from "@sapphire/plugin-subcommands";

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
				)
		);
	}



}