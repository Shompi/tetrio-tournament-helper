import { Command } from "@sapphire/framework";
import { Locale } from "discord.js";

export class CheckInCommand extends Command {
	public constructor(context: Command.LoaderContext, options: Command.Options) {
		super(context, { ...options });
	}

	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand((builder) => {
			builder.setName("check-in")
				.setDescription('Inscribete en un torneo con tu usuario de TETRIO')
				.setDescriptionLocalizations({
					"en-US": "Check-in into an existing tournament"
				})
				.addIntegerOption(id => id
					.setName('id-torneo')
					.setNameLocalizations({
						"en-US": "tourney-id",
					})
					.setDescription('La ID del torneo al cual te quieres registrar')
					.setDescriptionLocalizations({
						"en-US": "The ID of the tournament you want to register for",
					})
					.setRequired(true)
				)
				.addStringOption(username => username
					.setName('usuario')
					.setNameLocalizations({
						"en-US": "username",
					})
					.setDescription('Tu nombre de usuario de TETRIO')
					.setDescriptionLocalizations({
						"en-US": "Your TETRIO username"
					})
					.setRequired(true)
					.setMaxLength(50)
				)
		}, { idHints: ["1178881897716252722"]})
	}

	public async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		const userLocale = interaction.locale;

		switch (userLocale) {
			case Locale.EnglishUS:
				return void await interaction.reply({ content: "This command has not been implemented yet.", ephemeral: true });
			case Locale.SpanishES:
				return void await interaction.reply({ content: "Este comando aún no ha sido implementado.", ephemeral: true });
		}

	}
}