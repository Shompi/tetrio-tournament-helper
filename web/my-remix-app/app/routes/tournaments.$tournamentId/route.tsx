import { json, LoaderFunctionArgs, type MetaFunction } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import GuildCard from "./guild-card";

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
    { title: data?.tournament.name ?? "Tournament" },
  ];
};

export async function loader({ params }: LoaderFunctionArgs) {
  const id = params.tournamentId

  console.log(`ID ${id}`)
  const response = await fetch(`http://localhost:6969/tournaments?id=${id}`)
  const data: APITournamentResponse = await response.json()

  return json(data)
}

export default function Tournament() {

  const { tournament, organizer, winner, guild } = useLoaderData<typeof loader>()

  return (
    // system-ui default font
    <main>
      <div style={{ fontFamily: "nexa, sans-serif", lineHeight: "1.5", }} className="flex flex-col bg-gradient-to-b from-sky-300 to-sky-950 py-24 px-14 min-w-[1100px]">
        {/* Center content */}
        <div className="bg-sky-900 text-center py-12 px-24 text-white rounded-3xl shadow-lg shadow-sky-950">
          <h1 className="text-6xl font-bold text-balance">{tournament.name}</h1>

          {/* General tournament information  */}
          <main className="flex flex-col mt-32 px-2">
            {/* Organizer and Players Information */}
            <div className="flex flex-row justify-around border-dashed border-b-2 py-8">
              <div className="flex flex-col self-center gap-y-4">
                <p className="font-bold text-lg">ORGANIZADOR</p>
                <div className="flex flex-col self-center">
                  <img className="shadow-xl shadow-sky-950 rounded-full" src={organizer.avatarUrl} height={128} width={128} alt="Organizer Profile"></img>
                </div>
                <div className="px-4">
                  <p className="text-4xl font-bold">{organizer.username}</p>
                </div>

                {guild ? <GuildCard icon={guild.icon} name={guild.name} key={guild.id} id={guild.id} /> : null}

              </div>
              {/* Right Panel */}
              <div className="flex flex-col gap-y-4 justify-between">
                <div>
                  <p className="text-lg font-bold">JUGADORES REGISTRADOS</p>
                  <p className="text-4xl font-bold">{tournament.players.length}</p>
                  <span className="text-lg font-medium text-gray-400">{tournament.checked_in.length} checked-in</span>
                </div>

                {/* Winner Box */}
                {
                  winner ?
                    <div className="flex flex-col self-center justify-center shadow shadow-black border border-yellow-500 rounded-br-2xl px-4 w-[350px] h-[150px] bg-sky-800">
                      {/* <p className="text-xl font-bold">GANADOR</p> */}
                      <p className="text-4xl self-center">👑</p>
                      <div className="flex flex-row gap-x-3">
                        <img className="shadow-lg shadow-black rounded-full" height={80} width={80} src={winner.avatarUrl} alt="Winner Profile" ></img>
                        <p className="self-center font-bold text-2xl overflow-hidden">{winner.username}</p>
                      </div>
                    </div>
                    : null
                }

              </div>
            </div>

            {/* Tournament Information */}
            <div className="flex flex-row mt-12 justify-center gap-x-2">
              <div className="flex rounded-xl px-4 bg-sky-950">
                {/* <h2 className="text-3xl font-bold mb-4">DESCRIPCIÓN</h2> */}
                <p className="text-xl text-balance self-center p-4">{tournament.description}</p>
              </div>
            </div>

            {/* PLAYER LIST */}
            <div className="flex flex-col mt-12 rounded-lg bg-sky-950 p-8 w-[80%] self-center">
              <h2 className="text-4xl font-bold mb-8">JUGADORES INSCRITOS</h2>
              <div className="flex flex-col self-center">
                <p>{tournament.players.map(player => (`@${player.dUsername}`)).join(", ")}</p>
              </div>
            </div>
          </main>
        </div>
      </div>
    </main>
  );
}
