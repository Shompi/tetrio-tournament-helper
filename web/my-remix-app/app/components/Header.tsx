import { Link } from "@remix-run/react";

export default function Header() {
	return (
		<header className="flex flex-row justify-between bg-slate-700 text-slate-300 px-32">
			<div className="p-4">
				<p className="font-semibold text-4xl">Index</p>
			</div>

			<div className="flex flex-col justify-center">
				<ul className="flex flex-row text-2xl font-semibold gap-x-4">
					<li className="list-item">
						<Link className="hover:text-slate-600" to={"/about"}>About</Link>
					</li>
				</ul>
			</div>

		</header>
	)
}