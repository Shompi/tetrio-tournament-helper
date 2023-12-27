export const CommonMessages = {
	AdminCommands: {
		SendPlayerList: {
			/** Replace {tournament} with tournament name */
			Success: `✅ ¡Aquí tienes la lista de los jugadores inscritos en el torneo **{tournament}**`,
			Fail: ``
		}
	},

	Tournament: {
		/** @deprecated */
		InvalidTournamentId: "❌ La id del torneo que has ingresado no pertenece a este servidor o no existe.\nSi usas el nombre del torneo, asegúrate de que selecciones una de las opciones del **autocompletado**.",
		NotFound: "❌ No encontré ningún torneo con la id que ingresaste en este servidor\nSi usas el nombre del torneo, asegurate de usar una de las opciones del autocompletado.",
		NotEditable: '❌ No puedes editar la información de este torneo por que está marcado como **FINALIZADO**',
		NotJoinable: '❌ No te puedes inscribir en este torneo por que está marcado como **Cerrado** o **Finalizado**.',
		NotLeaveable: '❌ No te puedes desinscribir de este torneo por que ya está cerrado.',
	},

	Player: {
		NotRegistered: '⚠️ No estás inscrito/a en este torneo.',
		AlreadyCheckedIn: '⚠️ Ya estás en la lista de Checked-in.',
		CheckInNotAllowed: '⚠️ No puedes hacer Check-in en este torneo por que ya ha finalizado.',
	},

	Blocklist: {
		/** Replace {username} with user username */
		Add: `✅ El usuario {username} ha sido añadido a la blocklist.`,
		/** Replace {username} with user username */
		Remove: `✅ El usuario {username} puede utilizar los comandos del bot nuevamente.`,
	},

	UserIsBlocked: "❌ No tienes permitido usar este comando.",
	FunctionNotImplemented: "⚠️ Esta opción aún no ha sido implementada.",
}