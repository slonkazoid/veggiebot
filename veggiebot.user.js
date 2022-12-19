// ==UserScript==
// @name         VeggieBot
// @namespace    https://discord.gg/grHtzeRFAf
// @version      3.6.0
// @description  Bot for vegan banners on pixelcanvas.io
// @author       Vegans
// @match        https://pixelcanvas.io/*
// @icon         https://pixelcanvas.io/favicon.ico
// @updateURL    https://raw.githubusercontent.com/Vegan-PixelCanvas/veggiebot/main/veggiebot.user.js
// @downloadURL  https://raw.githubusercontent.com/Vegan-PixelCanvas/veggiebot/main/veggiebot.user.js
// @grant        none
// @require      https://files.catbox.moe/lvz4q6.js
// @require      https://cdn.jsdelivr.net/npm/toastify-js
// @require      https://veggiebotserver.knobrega.com/veggieBotLibrary.js
// ==/UserScript==
//jshint esversion: 10


// TO DO:
// rewrite pixelTimer
// fix updating of incorrect pixel counters - nothing updates after first load
// fix pixels placed counter- should update AFTER the latest pixel has been placed, lags behind 1

const splash = document.createElement("div");
(function makeLoadingScreen() { //build and display loading screen
	splash.style = `
		position: absolute;
		z-index: 999;
		width: 100vw;
		height: 100vh;
		display: flex;
		justify-content: center;
		align-items: center;
		margin-top: -42px;
		transition: all 1s;
		background: rgba(0, 0, 0, 0.7);
		backdrop-filter: blur(10.5px);
		color:white;
		-webkit-backdrop-filter: blur(10.5px);
		font-family: monospace;
	`;
	splash.innerHTML = `
		<h1 style="font-size: 2rem;">Loading VeggieBot...</h1>
	`;
	splash.classList.add("hidden");
	document.body.appendChild(splash);
	splash.classList.remove("hidden"); //fade in
})();

//global values
const botID = getCookie("z") ? getCookie("z") : veggieBot.randomInteger(10000, 99999); //if cookie exists, get botID from there. otherwise create new ID.
setCookie("z", botID, 2); //save bot ID to cookie

//UI
(function buildUI() {
	const div = document.createElement("div");
	div.style = "margin-top: -42px;";
	div.innerHTML = `
		<link rel="stylesheet" type="text/css" href="https://cdn.jsdelivr.net/npm/toastify-js/src/toastify.min.css">
		<style>
			.ui {
				position: absolute;
				display: flex;
				flex-flow: column;
				gap: 15px;
				padding: 15px;
				font-family: monospace;

				height: 100%;
				background: #202123;
				color:white;
				font-size: 12px;
			}
			.appTitle {
				font-size: 1.7em;
			}
			.appVersion {
				color: #eeeeee;
				padding-left: 10px;
			}
			.mainStats {
				background-color: #0c41a0;
				padding: 10px;
				border-radius: 10px;
				color: white;
				border: 2px solid #3968bd;

				display: flex;
				flex-flow: column;
				gap: 10px;
			}
			.infoButton {
				background-color: #3668ff91;
				padding: 10px;
				border-radius: 6px;
				margin-top: 15px;
				box-shadow: 0px 0px 20px 1px #00000038;
				transition: box-shadow 0.3s, background 0.3s;
			}
			.infoButton:hover {
				box-shadow: 0px 0px 20px 8px #0000005a;
				background-color: #3668ffa3;
			}
			.hidden {
				opacity: 0%;
				visibility: hidden;
			}
			.inlineCode {
				background-color: #222222;
				color: white;
				display: inline-block;
				vertical-align: middle;
				border-radius: 4px;
				padding: 0 5px;
			}
			.pixel {
				width: 1rem;
				height: 1rem;
				background-color: red;
				display: inline-block;
				vertical-align: middle;
			}
			.designInfo {
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
			a {
				text-decoration: underline;
				text-decoration-color: #0c41a0;
				text-decoration-thickness: 2px;
			}
		</style>
		<div class="ui">
			<p><span class="appTitle">VeggieBot</span><span class="appVersion">v${GM_info.script.version} · #${botID}</span></p>
			<div class="mainStats">
				<span class="todoCounter"></span>
				<span class="pixelsPlaced"></span>
			</div>
			<table>
				<tbody class="designsTable">
				</tbody>
			</table>
			<div class="designInfo">
				<strong class="designName"></strong>
				<span class="designCompletion"></span>
				<span class="designDimensions"></span>
				<span class="designLocation"></span>
				<span class="designSize"></span>
				<span class="designLink"></span>
			</div>
			<!-- <div style="display: flex; flex-flow: row; gap: 10px;">
				<img class="avatar" style="border-radius: 10px; width: 64px; height: 64px;";>
				<div style="display: flex; flex-flow: column; justify-content: center;">
					<span>
						<strong class="username"></strong>
						<span class="discriminator"></span>
					</span>
					<br>
					<a href="https://veggiebot.thechristmasstation.org/auth/logout" style="color: cornflowerblue; text-decoration: underline;">Log out</a>
				</div>
			</div> -->
		</div>
	`;
	document.body.appendChild(div);
})();
function displayDesign(design) {
	const modal = document.querySelector('.designInfo');
	document.querySelector('.designName').innerHTML = design.name;
	document.querySelector('.designCompletion').innerHTML = `Completion: ${(design.width * design.height) - design.incorrectPixels.length} / ${design.width * design.height}`;
	document.querySelector('.designLocation').innerHTML = `Location: <a href="https://pixelcanvas.io/@${design.xCoord},${design.yCoord}">(${design.xCoord}, ${design.yCoord})</a>`;
	document.querySelector('.designDimensions').innerHTML = `Dimensions: ${design.width} × ${design.height}`;
	document.querySelector('.designSize').innerHTML = `Size: ${design.pixels.length} pixels`;
	document.querySelector('.designLink').innerHTML = `File: <a href="${design.url}" target="_blank" rel="noopener noreferrer">${design.url.substring(design.url.lastIndexOf('/') + 1)}</a>`;
}
function refreshUI() { //clears and reloads the design table in the UI
	const designsTable = document.querySelector(".designsTable");
	designsTable.innerHTML = `
		<tr style="text-align: left;">
			<th>Design</th>
			<th>Pixels To Do</th>
		</tr>
	`;
	
	for (const design of designArray) { //for each design
		const row = document.createElement("tr");
		row.classList.add("designTableRow");
		row.innerHTML = `
			<td style="padding: 5px; margin-right: 15px;">${design.name}</td>
			<td style="text-align: right;">${design.incorrectPixels.length}</td>
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
	for (const design of designArray) { //for every design
		totalIncorrectPixels += design.incorrectPixels.length; //add this design's incorrect pixels to total incorrect pixel count
	}
	document.querySelector(".todoCounter").innerHTML = `Pixels to do: ${totalIncorrectPixels}`; //update pixel todo counter
	document.querySelector(".pixelsPlaced").innerHTML = `Pixels placed: ${getCookie("pixelCounter") ? getCookie("pixelCounter") : 0}`; //update pixels placed counter
}

// //check if user is authorized
// fetch("https://veggiebot.thechristmasstation.org/user", {credentials: 'include'})
// .then((response) => {
//   if (response.status === 401) { //user is not logged in
//     window.location.replace("https://veggiebot.thechristmasstation.org/auth/login");
//   }
//   else if (response.status === 200) { //user is logged in and authorized
//     response.text().then((result) => { //pull out text
//       const user = JSON.parse(result); //convert text to json
//
//       //fill in the user info in the UI
//       document.querySelector(".username").innerHTML = user.username;
//       document.querySelector(".discriminator").innerHTML = "#" + user.discriminator;
//       document.querySelector(".avatar").src = `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.webp?size=64`;
//     });
//   }
// });


function getCookie(cname) { //returns value of cookie by name
	let name = cname + "=";
	let decodedCookie = decodeURIComponent(document.cookie);
	let ca = decodedCookie.split(';');
	for (let i = 0; i < ca.length; i++) {
		let c = ca[i];
		while (c.charAt(0) == ' ') {
			c = c.substring(1);
		}
		if (c.indexOf(name) == 0) {
			return c.substring(name.length, c.length);
		}
	}
	return "";
}
function setCookie(cname, cvalue, exdays) { //sets cookie
	const d = new Date();
	d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
	let expires = "expires=" + d.toUTCString();
	document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

let designArray = []; //array of final Design objects
window.onload = async function startBot() { //when page is done loading, start bot
	fetch("https://veggiebotserver.knobrega.com/designs") //fetch processed designs from server
	.then(response => response.text())
	.then(result => {
		const processedDesignArray = JSON.parse(result);

		for (const processedDesign of processedDesignArray) { //for each processed design
			designArray.push( new veggieBot.Design(processedDesign)); //create final Design and push to designArray
		}

		window.designArray = designArray;
		console.log(designArray);

		veggieBot.pixelTimer(); //start pixel placement loop
		displayDesign(designArray[0]);
		splash.classList.add("hidden"); //take down splash screen
		setTimeout(function () { window.location.reload(); }, (30 * 60 * 1000)); //refresh page after 30 mins
	});
};
