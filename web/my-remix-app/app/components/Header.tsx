import { Link } from "@remix-run/react";

export default function Header() {
	return (
		<header className="flex flex-row justify-around bg-black text-slate-300 min-h-8">
			<div className="p-4 flex flex-col justify-center">
				<p className="font-semibold text-2xl font-nexa">HOME</p>
			</div>

			<div className="flex flex-col justify-center">
				<ul className="flex text-xl font-semibold h-full items-center">
					<Link className="list-item hover:animate-pulse hover:bg-slate-200 h-full p-4 hover:text-slate-600" to={"/docs"}>DOCS</Link>
					<Link className="list-item hover:animate-pulse hover:bg-slate-200 h-full p-4 hover:text-slate-600" to={"/about"}>ABOUT</Link>
				</ul>
			</div>
		</header>
	)
}