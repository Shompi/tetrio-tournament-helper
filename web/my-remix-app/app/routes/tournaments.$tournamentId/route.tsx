import { json, LoaderFunctionArgs, type MetaFunction } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import Unavailable from "./unavailable";
import TournamentCard from "./tournament-card";

type BasePlayer = {
  discordId: string
  dUsername: string
  challongeId: string | null
  /** This should only be present if the tournament game is TETRIO */
  data?: unknown
  generalRate?: number | null
}

type PartialTournament = {
  checked_in: unknown[],
  players: BasePlayer[],
  max_players: number | null,
  game: string,
  description: string | null,
  country_locl: string | null,
  rank_cap: string | null,
  winner_id: string | null,
  name: string,
  status: number,
  category: string | null,
}

type Organizer = {
  username: string
  avatarUrl: string
}

type PartialGuild = {
  name: string
  id: string
  icon: string | null
}

interface Winner extends Organizer { }

type APITournamentResponse = {
  organizer: Organizer
  winner: Winner | null
  tournament: PartialTournament
  /** In the case the bot left the guild and there is no longer information about it. */
  guild: PartialGuild | null
}


export const meta: MetaFunction<typeof loader> = ({ data }) => {
  return [
    { title: data?.tournament?.name ?? "Tournament unavailable" },
  ];
};

export async function loader({ params }: LoaderFunctionArgs) {
  const id = params.tournamentId

  console.log(`ID ${id}`)
  const response = await fetch(`http://localhost:6969/tournament?id=${id}`).catch(() => null)

  if (!response) return json({ tournament: null, organizer: null, winner: null, guild: null })

  const data: APITournamentResponse = await response.json()

  return json(data)
}

export default function Tournament() {
  const { tournament, organizer, winner, guild } = useLoaderData<typeof loader>()
  return (
    // system-ui default font
    <main>
      <div style={{ fontFamily: "nexa, sans-serif", lineHeight: "1.5", }}>
        {
          tournament ? <TournamentCard tournament={tournament} guild={guild} organizer={organizer}  winner={winner}></TournamentCard> : <Unavailable></Unavailable>
        }
      </div>
    </main>
  );
}
