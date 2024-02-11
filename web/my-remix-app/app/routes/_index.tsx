import { type MetaFunction } from "@remix-run/node";

export const meta: MetaFunction = () => {
	return [
		{ title: "Home" },
	];
};

export default function Index() {
	return (
		<main className="flex h-screen items-center justify-center bg-slate-900">
			<div className="flex flex-col gap-y-8 justify-center text-slate-200">
				<h1 className="text-center text-8xl font-bold">This is the index page!</h1>
				<h2 className="text-center text-3xl font-semibold"> If you want, you can navigate to <code>/tournament/1</code></h2>
			</div>
		</main>
	)
}