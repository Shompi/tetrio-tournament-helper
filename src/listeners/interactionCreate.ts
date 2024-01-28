import { Listener } from '@sapphire/framework';
import { BaseInteraction } from 'discord.js';
import { SearchCategoryByNameAutocomplete, SearchTournamentByNameAutocomplete } from '../helper-functions/index.js';

export class InteractionCreate extends Listener {

	public constructor(context: Listener.LoaderContext, options: Listener.Options) {
		super(context, {
			...options,
			once: false,
			event: 'interactionCreate'
		});
	}

	public override async run(interaction: BaseInteraction<'cached'>) {

		if (interaction.isAutocomplete()) {

			switch (interaction.options.getFocused(true).name) {
				case 'nombre-id':
					return void SearchTournamentByNameAutocomplete(interaction)
				case 'categoria':
					return void SearchCategoryByNameAutocomplete(interaction)
			}
		}
	}
}
