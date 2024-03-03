import { StatsAPIResponse } from "./types";

type Commands = Pick<StatsAPIResponse, "commands">

export default function CommandDocs({ commands }: Commands) {
	return (
		<section id="command-section" className="flex flex-col items-center lg:px-12 mt-12 text-slate-200">
			<h1 id="title" className="text-4xl font-nexaHeavy">DOCUMENTACIÓN</h1>
			<div id="commands-box" className="flex flex-col items-start">
				<div className="flex flex-col divide-y divide-red-600">
					{
						commands.map(command =>
							// First command section
							<div key={command.name} className="p-4">
								{/* command name */}
								<p className="font-nexa text-4xl font-semibold">{"/"}{command.name}</p>
								<p className="text-xl">{command.description}</p>
								{/* Root Command section */}
								<div id="command-options" className="py-2 divide-y divide-blue-600">
									{
										command.options.map(option => {
											if (option.is_subcommand) {
												return (
													<div key={option.name} className="font-nexa py-2">
														{/* subcommand name */}
														<p className="font-semibold text-xl pt-1">{option.name} <span className="text-slate-500">{"(subcomando)"}</span></p>
														<p>{option.description}</p>
																	{/* subcommand options section */}
														<div className="py-2 pl-4">
															{
																option.options.map(option =>
																	<div key={option.name} className="py-1">
																		<p className="font-semibold">{option.name} <span className="text-slate-500">{"(opción)"}</span></p>
																		<p className="">{option.description}</p>
																	</div>
																)
															}
														</div>
													</div> 
												)
											} else {
												return (
													<div key={option.name} className="font-nexa py-2">
														<p className="font-semibold">{option.name}</p>
														<p>{option.description}</p>
													</div> 
												)
											}
										})
									}
								</div>
							</div>
						)
					}
				</div>
			</div>
		</section>
	)
}