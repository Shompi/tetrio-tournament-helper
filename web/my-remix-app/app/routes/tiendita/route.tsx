import { Link } from "@remix-run/react"
import Instagram from "../../assets/images/Instagram/01 Static Glyph/01 Gradient Glyph/Instagram_Glyph_Gradient.svg"

export default function Tiendita() {
	return (
		<div id="container" className="flex justify-around items-center w-full min-h-dvh bg-gradient-to-b from-pink-600 to-pink-950">
			<section id="card-section" className="font-nexa text-pink-100 mx-6">
				<div className="divide-y-2 divide-pink-200 py-2 px-6 flex flex-col bg-gradient-to-b from-pink-700 to-pink-950 shadow-lg shadow-pink-950 outline outline-1 rounded-lg outline-pink-100 min-w-96 max-w-96 h-[750px]">
					<div>
						<h1 className="pt-5 font-nexaHeavy font-bold text-4xl text-center">CAJITA DE PANDORA</h1>
						<p className="font-bold text-md text-pink-200 pb-2 text-center">Shopping & Retail</p>
					</div>
					<div id="info-box" className="text-balance text-xl font-bold py-12">
						<p>
							Somos una tiendita pequeña, nos dedicamos a vender cosas importadas.
							Hacemos entregas en Concepción, San Pedro de la Paz y alrededores.<br></br>
							Más información en nuestro instagram 👇
						</p>
					</div>

					<div id="socials" className="h-full w-full flex justify-center">
						<ul className="flex flex-col justify-center list-none divide-y divide-pink-300 items-center text-2xl h-full w-full font-bold">
							<Link to={"https://www.instagram.com/tienda_cajitapandora"} className="flex flex-row text-center justify-center hover:outline hover:outline-3 hover:outline-pink-300 py-8 w-full">
								<li className="flex flex-row gap-x-4">
									<img src={Instagram} alt="Instagram logo" width={32} height={32} />
									INSTAGRAM
									<img src={Instagram} alt="Instagram logo" width={32} height={32} />
								</li>
							</Link>

							<li className="hover:outline hover:outline-3 hover:outline-pink-300 py-8 w-full text-center">WHATSAPP</li>
							<li className="hover:outline hover:outline-3 hover:outline-pink-300 py-8 w-full text-center">CONTACTO</li>
						</ul>
					</div>
				</div>
			</section>
		</div>
	)
}