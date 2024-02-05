import { json, type MetaFunction } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

export const meta: MetaFunction = () => {
  return [
    { title: "New Remix App" },
    { name: "description", content: "Welcome to Remix!" },
  ];
};

export async function loader() {
  const response = await fetch("http://localhost:6969/tournaments")

  return json(await response.json())
}

export default function Index() {

  const { tournament, organizer } = useLoaderData<typeof loader>()

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", lineHeight: "1.8", }} className="flex flex-row bg-black py-24">
      <div className="bg-slate-500 text-white w-[150px] text-center"></div>
      {/* Center content */}
      <div className="bg-slate-800 w-full text-center py-12 px-24 text-white">
        <h1 className="text-4xl font-bold">{tournament.name} {"("} {tournament.status} {")"}</h1>

        {/* General tournament information  */}
        <main className="flex flex-col mt-32 px-2">
          {/* Organizer and Players Information */}
          <div className="flex flex-row justify-around border-dashed border-b-2 pb-12">
            <div className="flex flex-row self-start">
              <div className="flex flex-col self-start">

                <p className="font-bold text-lg">ORGANIZADOR</p>
                <img className="shadow-lg shadow-black rounded-full" src={organizer.avatarUrl} height={128} width={128} alt="Organizer Profile"></img>
              </div>
              <div className="self-center px-4 mt-8">
                <p className="text-4xl font-bold">{organizer.username}</p>
              </div>
            </div>
            {/* Players Info */}
            <div className="flex flex-col">
              <div>
                <p className="text-lg font-bold">JUGADORES REGISTRADOS</p>
                <p className="text-4xl font-bold">{tournament.players.length}</p>
                <span className="text-lg font-normal text-slate-500">{tournament.checked_in.length} checked-in</span>
              </div>
            </div>
          </div>
          {/* Tournament Information */}
          <div className="flex flex-row mt-12 justify-between gap-x-2">
            <div className="shadow shadow-black rounded-xl px-4 py-8 w-[60%] bg-slate-900">
              <h2 className="text-3xl font-bold mb-4">DESCRIPCIÓN</h2>
              <p className="text-lg text-balance px-12">{tournament.description}</p>
            </div>

            <div className="flex flex-col justify-center shadow shadow-black rounded-xl px-4 w-[400px] h-[230px] bg-slate-900">
            <p>GANADOR</p>
              <p className="text-4xl self-start ml-10">👑</p>
              <div className="flex flex-row gap-x-3">
                <img className="shadow-lg shadow-black rounded-full" src={organizer.avatarUrl} height={128} width={128} alt="Organizer Profile"></img>
                <p className="self-center font-bold text-4xl overflow-hidden">{organizer.username}</p>
              </div>
            </div>
          </div>
        </main>
        {/* Players information */}
        <div className="flex flex-col mt-12 rounded-lg bg-slate-900 p-8">
          <h2 className="text-4xl font-bold mb-8">JUGADORES INSCRITOS</h2>
          <div className="flex flex-col self-center w-[60%]">
            <p>{tournament.players.map(player => (`@${player.dUsername}`)).join(", ")}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
