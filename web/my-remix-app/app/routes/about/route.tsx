import { MetaFunction } from "@remix-run/node";
import ProfileCard from "./ProfileCard";
import Header from "../../components/Header";

export const meta: MetaFunction = ({ data }) => {
	return [
		{ title: "Acerca de la página", name: "About" },
	];
};

export default function About() {
	return (
		<div className="h-screen w-screen bg-slate-700">
			<Header />
			<section className="flex flex-col font-nexa font-bold text-slate-300">
				<main className="w-screen mt-8">
					<div id="introduction" className="flex flex-col gap-y-6 items-center text-2xl">
						<h1 className="text-8xl">Hello!</h1>
						<p className="text-3xl">Welcome to <code className="text-blue-500">tetrio-tournament-helper</code> bot webpage</p>
						<p className="max-w-4xl font-normal text-center text-pretty">I created this webpage with the only purpose of server admins,
							or anybody really, to be able to read information about
							tournaments organized with my bot.</p>
						<ProfileCard />
					</div>

				</main>
			</section>
		</div>
	)
}