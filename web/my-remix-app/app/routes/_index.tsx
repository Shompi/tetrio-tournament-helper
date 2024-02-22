import { type MetaFunction } from "@remix-run/node";
import { Link } from "@remix-run/react";
import Header from "../components/Header";

export const meta: MetaFunction = () => {
	return [
		{ title: "Home" },
	];
};

export default function Index() {
	return (
		<section className="flex flex-col h-screen">
			<Header />
			<main className="flex bg-gradient-to-br from-slate-700 h-full to-slate-950 items-center justify-center">
				<div className="flex flex-col gap-y-8 justify-center text-slate-200">
					<h1 className="text-center text-8xl font-bold">This is the index page!</h1>
					<h2 className="text-center text-3xl font-semibold font-nexa">You can navigate to
						<Link to={"/tournaments/1"}> <code>/tournaments/1</code> </Link>
					</h2>
				</div>
			</main>
		</section>
	)
}