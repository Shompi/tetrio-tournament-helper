import { Link } from "@remix-run/react"
import profile from "../../assets/images/profile-image.webp"

const profileInfo = {
	username: "ShompiFlen",
	github: "https://github.com/Shompi",
	twitter: "https://x.com/ShompiFlen",
	youtube: "https://youtube.com/ShompiFlen"
}

export default function ProfileCard() {
	return (
		<div className="w-[500px] h-[200px] flex flex-col px-6 py-2 rounded-md justify-between">
			<div className="flex flex-row items-center border-b border-b-slate-200 py-4">
				<img src={profile} alt={"ShompiFlen avatar"} height={100} width={100}
					className="rounded-full"
				/>
				<p className="font-nexaHeavy ml-6 text-5xl">SHOMPIFLEN</p>
			</div>
			<div className="flex flex-row gap-x-10 justify-center">
				<Link to={profileInfo.github}>GITHUB</Link>
				<Link to={profileInfo.twitter}>TWITTER</Link>
				<Link to={profileInfo.youtube} aria-description="Mostly Tetris® stuff">YOUTUBE</Link>
			</div>
		</div>
	)
}