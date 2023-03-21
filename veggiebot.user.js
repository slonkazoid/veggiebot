// ==UserScript==
// @name         VeggieBot
// @version      5.0.2
// @author       Vegans
// @match        https://pixelcanvas.io/*
// @icon         https://pixelcanvas.io/favicon.ico
// @updateURL    https://veggiebotserver.knobrega.com/veggiebot.user.js
// @downloadURL  https://veggiebotserver.knobrega.com/veggiebot.user.js
// @grant        none
// ==/UserScript==

setTimeout(() => {
	window.location.reload();
}, 60 * 60 * 1000); //refresh page after 1 hour

const baseURL =
	getCookie("dev") === "true"
		? "https://veggiebotserver-dev.knobrega.com"
		: "https://veggiebotserver.knobrega.com";
window.baseURL = baseURL;

// load the library
const library = document.createElement("script");
library.src = `${baseURL}/veggieBotLibrary.js`;
document.body.appendChild(library);

//global values
const botID =
	getCookie("z") || Math.floor(Math.random() * (99999 - 10000 + 1)) + 10000; //if cookie exists, get botID from there. otherwise create new ID.
const version = GM_info.script.version;
setCookie("z", botID, 2); //save bot ID to cookie
let user;
let ws;

//then check if user is authorized
fetch(baseURL + "/auth/user", {
	credentials: "include",
}).then((response) => {
	if (response.status === 401) {
		//user is not logged in
		window.location.replace(baseURL + "/auth/login");
	} else if (response.status === 200) {
		//user is logged in and authorized
		response.text().then((result) => {
			//pull out text
			user = JSON.parse(result); //convert text to json
			buildUI();
		});
	}
});

//then build UI
function buildUI() {
	//load fontawesome
	const iconScript = document.createElement("script");
	iconScript.src = "https://kit.fontawesome.com/5f09e108f6.js";
	iconScript.crossOrigin = "anonymous";
	document.body.appendChild(iconScript);

	const div = document.createElement("div");
	div.classList.add("veggieBot");

	div.innerHTML = /*html*/ `
		
		<link rel="preconnect" href="https://fonts.googleapis.com" />
		<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
		<link
			href="https://fonts.googleapis.com/css2?family=Chivo+Mono&family=Lexend+Deca&family=Nunito&display=swap"
			rel="stylesheet"
		/>
		<style>
			.veggieBot {
				font-family: "Nunito", sans-serif;
				color: white;
				font-size: 0.75rem;
			}
			.sidebar {
				position: absolute;
				height: 100%;
				width: 86px;
				overflow: scroll;

				display: flex;
				flex-direction: column;

				background: #202123;
			}
			.uiTop {
				background-color: ${getCookie("dev") === "true" ? "#ffe300" : "#0c41a0"};
				color: ${getCookie("dev") === "true" ? "black" : "white"};
				font-family: "Lexend Deca", sans-serif;
				
				padding: 15px;
				border-bottom: 2px solid #3968bd;
			}
			.uiStackTop {
				display: flex;
				flex-flow: column;
				gap: 15px;
				padding: 15px;
				height: 100%;
			}
			.card {
				background: #2b2d32;
				color:  white;
				padding: 10px;
				border-radius: 10px;
				border: 2px solid #36383f;

				display: flex;
				flex-flow: column;
				gap: 10px;
			}
			.user {
				background: #2b2d32;
				color:  white;
				padding: 15px;
				border-top: 2px solid #36383f;
				
				display: flex;
				flex-flow: row;
				gap: 10px;
			}
			.logScroller {
				background-color: black;
				border-radius: 10px;
				border: 2px solid #333;
				overflow: scroll;
				padding: 10px;
				white-space: nowrap;
				color: white;
				font-family: monospace;
			}
			#gameWindow + div + div {
				width: 100px;
			}
			.textInput {
				background-color: #2b2d32;
				color: white;
				border-radius: 4px;
				border: 2px solid #36383f;
				min-width: 0;
				padding-left: 5px;
			}
			.navIcon {
				font-size: 2rem;
				display: block;
			}
			.modalContainer {
				background-color: #0005;
				backdrop-filter: blur(4px);

				position: fixed;
				height: 100vh;
				width: 100vw;
				z-index: 1;

				visibility: hidden;
				
				display: flex;
				align-items: center;
				justify-content: center;
			}
		</style>

		<div class="modalContainer jumpTool">
			<div class="card">
				<div style="display: flex; flex-direction: column; gap: 5px;">
					<strong>Jump to location</strong>
					<form id="jumpForm">
						<div style="display: flex; flex-direction: column; gap: 8px;">
							<input class="textInput jumpX" placeholder="x coord" required>
							<input class="textInput jumpY" placeholder="y coord" required>
							<input type="submit" value="Go" style="background-color: #0e4ec1; padding: 5px 10px; border-radius: 4px; cursor: pointer;">
						</div>
					</form>
				</div>
			</div>
		</div>
		<div class="modalContainer user">
			<div class="card">
				<img style="border-radius: 10px; width: 40px; height: 40px;" src="${
					user.avatar
						? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.webp?size=64`
						: "https://cdn.discordapp.com/embed/avatars/0.png"
				}">
				<a href="${baseURL}/auth/logout">Log out</a>
				<span class="appVersion">v${version} · #${botID}</span>
			</div>
		</div>
		<div class="modalContainer log">
			<div class="logScroller">
			</div>
		</div>

		<div class="sidebar">
			<div class="uiTop">
				<img src="https://veggiebotserver.knobrega.com/logo-primary.png">
			</div>
			<div class="uiStackTop">
				<div class="card logIcon" style="cursor: pointer;">
					<i class="fa-solid fa-list-ul navIcon"></i>
				</div>
				<div class="card jumpToolIcon" style="cursor: pointer;">
					<i class="fa-solid fa-compass navIcon"></i>
				</div>
				<a href="${baseURL}">
					<div class="card">
						<i class="fa-solid fa-chart-column navIcon"></i>
					</div>
				</a>
			</div>
			<span style="transform: rotate(270deg); font-family: 'Lexend Deca'; font-size: 1.7rem; margin-bottom: 50px; white-space: nowrap;"><span class="pixelsPlaced">0</span> pixels placed</span>
			<div class="user">
				<img class="avatar" style="border-radius: 10px" src="${
					user.avatar
						? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.webp?size=64`
						: "https://cdn.discordapp.com/embed/avatars/0.png"
				}">
			</div>
		</div>
	`;
	document.body.appendChild(div);

	//jump
	jumpToolForm = document.querySelector("#jumpForm");
	jumpToolForm.addEventListener("submit", (e) => {
		e.preventDefault();
		window.setView(
			parseInt(document.querySelector(".jumpX").value),
			parseInt(document.querySelector(".jumpY").value)
		);
		document.querySelector(".jumpX").value = null;
		document.querySelector(".jumpY").value = null;
	});

	document.querySelector(".jumpToolIcon").onclick = () => {
		document.querySelector(".jumpTool").style.visibility = "visible";
	};
	document.querySelector(".jumpTool").onclick = () => {
		document.querySelector(".jumpTool").style.visibility = "hidden";
	};

	document.querySelector(".logIcon").onclick = () => {
		document.querySelector(".log").style.visibility = "visible";
	};
	document.querySelector(".log").onclick = () => {
		document.querySelector(".log").style.visibility = "hidden";
	};

	document.querySelector(".avatar").onclick = () => {
		document.querySelector(".user").style.visibility = "visible";
	};
	document.querySelector(".user").onclick = () => {
		document.querySelector(".user").style.visibility = "hidden";
	};
}

window.onload = async function startBot() {
	//when page is done loading, start bot

	veggieBot.pixelTimer(pixelCallback); //start pixel placement loop

	ws = new WebSocket("wss://veggiebotserver.knobrega.com/live");
	ws.addEventListener("open", (event) => {
		ws.send(
			JSON.stringify({
				type: "connect",
				user,
			})
		);
	});
};

function refreshUI() {
	const pixelsPlaced = document.querySelector(".pixelsPlaced");
	pixelsPlaced.innerHTML = Intl.NumberFormat().format(
		getCookie("pixelCounter") || 0
	);
}
/**
 * Returns value of a cookie by name
 * @param {string} cname Name of the cookie to fetch
 * @returns {string} Value, blank if no cookie
 */
function getCookie(cname) {
	let name = cname + "=";
	let decodedCookie = decodeURIComponent(document.cookie);
	let ca = decodedCookie.split(";");
	for (let i = 0; i < ca.length; i++) {
		let c = ca[i];
		while (c.charAt(0) == " ") {
			c = c.substring(1);
		}
		if (c.indexOf(name) == 0) {
			return c.substring(name.length, c.length);
		}
	}
	return "";
}
/**
 * Sets a cookie value
 * @param {string} cname Name of cookie
 * @param {string} cvalue Value of cookie
 * @param {number} exdays Days until expiration
 */
function setCookie(cname, cvalue, exdays) {
	const d = new Date();
	d.setTime(d.getTime() + exdays * 24 * 60 * 60 * 1000);
	let expires = "expires=" + d.toUTCString();
	document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

function pixelCallback(results) {
	//runs after each pixel placement attempt
	if (results.successful === true) {
		const oldCount = parseInt(getCookie("pixelCounter") || 0);
		setCookie("pixelCounter", oldCount + 1, 3); //update cookie
	}

	window.setWait(results.waitMS);

	veggieBot.webhook(results.string, user, version, botID, !results.successful);
	// ws.send(JSON.stringify({
	// 	type: "pixel",
	// 	user,
	// 	results,
	// }))

	const p = document.createElement("p");

	const now = new Date();
	const timeString =
		"[" +
		now.getHours() +
		":" +
		now.getMinutes().toString().padStart(2, "0") +
		":" +
		now.getSeconds().toString().padStart(2, "0") +
		"]";

	p.innerHTML = timeString + " " + results.string;
	const logScroller = document.querySelector(".logScroller");
	logScroller.appendChild(p);
	logScroller.scrollTop = logScroller.scrollHeight;

	refreshUI();
}

window.toggleDev = () => {
	setCookie("dev", getCookie("dev") === "true" ? "false" : "true", 10);
	window.location.reload();
};
