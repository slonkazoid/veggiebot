// ==UserScript==
// @name         VeggieBot
// @version      3.11.8
// @author       Vegans
// @match        https://pixelcanvas.io/*
// @icon         https://pixelcanvas.io/favicon.ico
// @updateURL    https://veggiebotserver.knobrega.com/veggiebot.user.js
// @downloadURL  https://veggiebotserver.knobrega.com/veggiebot.user.js
// @grant        none
// ==/UserScript==

// TO DO:
//issue where pixels are loaded as white when they're out of range
//try increasing time until reload
//make discord login persist when server restarts or rebuilds
//detect pixel placement time remaining when the page loads
//make waitms compatible with wait times longer than 1 minute
//make designs reload every 15 mins

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
const botID = getCookie("z")
	? getCookie("z")
	: Math.floor(Math.random() * (99999 - 10000 + 1)) + 10000; //if cookie exists, get botID from there. otherwise create new ID.
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
	const div = document.createElement("div");
	div.innerHTML = /*html*/ `
		
		<link rel="preconnect" href="https://fonts.googleapis.com" />
		<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
		<link
			href="https://fonts.googleapis.com/css2?family=Chivo+Mono&family=Lexend+Deca&family=Nunito&display=swap"
			rel="stylesheet"
		/>
		<style>
			.ui {
				position: absolute;
				font-family: "Nunito", sans-serif;
				display: flex;
				flex-direction: column;

				height: 100%;
				background: #202123;
				color:white;
				font-size: 0.75rem;
				max-width: 340px;
				overflow: scroll;
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
			}
			.uiStackBottom {
				display: flex;
				flex-flow: column;
				gap: 15px;
				padding: 15px;
				justify-content: flex-end;
				flex-grow: 1;
			}
			.appTitle {
				font-size: 1.7em;
				padding-right: 10px;
			}
			.mainStats {
				display: flex;
				flex-flow: row;
				justify-content: space-evenly;
				text-align: center;
			}
			.mainStats > div {
				display: flex;
				flex-flow: column;
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
			.designTableRow {
				border-top: 1px solid #666;
			}
			.designTableRow:hover {
				background-color: #444;
				cursor: pointer;
			}
			.active {
				background-color: #0c41a0 !important;
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
			a, .fakeLink {
				text-decoration: underline;
				text-decoration-color: #1e58c0;
				text-decoration-thickness: 2px;
				cursor: pointer;
			}
			.logScroller {
				background-color: black;
				border-radius: 10px;
				border: 2px solid #333;
				overflow: scroll;
				height: 10em;
				padding: 10px;
				white-space: nowrap;
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
		</style>
		<div class="ui">
			<div class="uiTop">
				<p><span class="appTitle">VeggieBot</span><span class="appVersion">v${version} · #${botID}</span></p>
			</div>
			<div class="uiStackTop">
				<div class="card">
					<div class="mainStats">
						<div>
							<span class="todoCounter" style="font-size: 2em; font-family: 'Lexend Deca', sans-serif;"></span>
							<span>Pixels to do</span>
						</div>
						<div>
							<span class="pixelsPlaced" style="font-size: 2em; font-family: 'Lexend Deca', sans-serif;"></span>
							<span>Pixels placed</span>
						</div>
					</div>
				</div>
				<div class="logScroller">
				</div>
				<table>
					<tbody class="designsTable">
					</tbody>
				</table>
				<div class="card">
					<strong class="designName"></strong>
					<span class="designCompletion"></span>
					<span class="designLocation"></span>
				</div>
			</div>
			<div class="uiStackBottom">
				<div class="card">
					<div style="display: flex; flex-direction: column; gap: 5px;">
						<strong>Jump to location</strong>
						<form id="jumpForm">
							<div style="display: flex; flex-direction: row; gap: 8px;">
								<input class="textInput jumpX" placeholder="x coord" required>
								<input class="textInput jumpY" placeholder="y coord" required>
								<input type="submit" value="Go" style="background-color: #0e4ec1; padding: 5px 10px; border-radius: 4px; cursor: pointer;">
							</div>
						</form>
					</div>
				</div>
				<div class="card">
					<a href="${baseURL}"><strong>Dashboard</strong></a>
				</div>
			</div>
			<div class="user">
				<img class="avatar" style="border-radius: 20%; width: 40px; height: 40px;" src="${
					user.avatar
						? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.webp?size=64`
						: "https://cdn.discordapp.com/embed/avatars/0.png"
				}">
				<div style="display: flex; flex-flow: column; justify-content: center; gap: 1px;">
					<span>
						<strong class="username">${user.username}</strong>
						<span class="discriminator">#${user.discriminator}</span>
					</span>
					<br>
					<a href="${baseURL}/auth/logout">Log out</a>
				</div>
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
}

setTimeout(() => {
	window.location.reload();
}, 60 * 60 * 1000); //refresh page later

window.onload = async function startBot() {
	//when page is done loading, start bot

	designArray = await veggieBot.fetchDesigns(fetchDesignsCallback);

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

function fetchDesignsCallback(designArray) {
	window.designArray = designArray;
	displayDesign(designArray[0]);
	veggieBot.pixelTimer(designArray, pixelCallback); //start pixel placement loop
}

function displayDesign(design) {
	//displays a Design in the ui's design inspector
	document.querySelector(".designName").innerHTML = design.name;
	document.querySelector(".designCompletion").innerHTML = `Completion: ${
		(design.completion * 100).toFixed(2) + "%"
	}`;
	document.querySelector(
		".designLocation"
	).innerHTML = `Location: <span class="fakeLink" onclick="window.setView(${design.xCoord}, ${design.yCoord})">(${design.xCoord}, ${design.yCoord})</span>`;
}
/**
 * Refreshes anything in the UI that changes
 * @param {*} designArray TODO fix this
 */
function refreshUI(designArray) {
	const designsTable = document.querySelector(".designsTable");
	designsTable.innerHTML = `
		<tr style="font-family: 'Lexend Deca', sans-serif;">
			<th style="text-align: left;">Design</th>
			<th style="text-align: right;">Pixels To Do</th>
		</tr>
	`;

	for (const design of designArray) {
		//for each design
		const row = document.createElement("tr");
		row.classList.add("designTableRow");
		row.innerHTML = `
			<td style="padding: 5px; margin-right: 15px;">${design.name}</td>
			<td style="text-align: right; padding: 5px;">${Intl.NumberFormat().format(
				design.incorrectPixels.length
			)}</td>
		`;
		row.onclick = function () {
			displayDesign(design);
			if (document.querySelector(".active")) {
				document.querySelector(".active").classList.remove("active");
			}

			this.classList.add("active");
		};
		designsTable.appendChild(row);
	}

	let totalIncorrectPixels = 0;
	for (const design of designArray) {
		//for every design
		totalIncorrectPixels += design.incorrectPixels.length; //add this design's incorrect pixels to total incorrect pixel count
	}
	const todoCounter = document.querySelector(".todoCounter");
	todoCounter.innerHTML = Intl.NumberFormat("en-US", {
		notation: "compact",
		maximumFractionDigits: 1,
	}).format(totalIncorrectPixels); //update pixel todo counter
	todoCounter.title = totalIncorrectPixels;
	const pixelsPlaced = document.querySelector(".pixelsPlaced");
	pixelsPlaced.innerHTML = Intl.NumberFormat("en-US", {
		notation: "compact",
		maximumFractionDigits: 1,
	}).format(getCookie("pixelCounter") ? getCookie("pixelCounter") : 0); //update pixels placed counter
	pixelsPlaced.title = getCookie("pixelCounter")
		? getCookie("pixelCounter")
		: 0;
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
		const oldCount = parseInt(
			getCookie("pixelCounter") ? getCookie("pixelCounter") : 0
		);
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

	refreshUI(designArray);
}

window.toggleDev = () => {
	setCookie("dev", getCookie("dev") === "true" ? "false" : "true", 10);
	window.location.reload();
};
