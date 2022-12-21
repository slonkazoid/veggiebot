// ==UserScript==
// @name         VeggieBot
// @namespace    https://discord.gg/grHtzeRFAf
// @version      3.7.0
// @description  Bot for vegan banners on pixelcanvas.io
// @author       Vegans
// @match        https://pixelcanvas.io/*
// @icon         https://pixelcanvas.io/favicon.ico
// @updateURL    https://raw.githubusercontent.com/Vegan-PixelCanvas/veggiebot/main/veggiebot.user.js
// @downloadURL  https://raw.githubusercontent.com/Vegan-PixelCanvas/veggiebot/main/veggiebot.user.js
// @grant        none
// @require      https://veggiebotserver.knobrega.com/veggieBotLibrary.js
// ==/UserScript==
//jshint esversion: 10


// TO DO:
// fix updating of incorrect pixel counters - nothing updates after first load
// fix pixels placed counter- should update AFTER the latest pixel has been placed, lags behind 1



//startup order
//put up loading screen
//global variables

//fetch user
//THEN build UI
//THEN start bot

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
let user;
let ws;

//load library


//then check if user is authorized
fetch("https://veggiebotserver.knobrega.com/user", {credentials: 'include'})
.then((response) => {
	if (response.status === 401) { //user is not logged in
		window.location.replace("https://veggiebotserver.knobrega.com/auth/login");
	}
	else if (response.status === 200) { //user is logged in and authorized
		response.text().then((result) => { //pull out text
			user = JSON.parse(result); //convert text to json
			buildUI();
    	});
  	}
});
//then build UI
function buildUI() {
	const div = document.createElement("div");
	div.style = "margin-top: -42px;";
	div.innerHTML = `
		<style>
			.ui {
				position: absolute;
				font-family: monospace;
				display: flex;
				flex-direction: column;

				height: 100%;
				background: #202123;
				color:white;
				font-size: 12px;
				max-width: 340px;
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
			.user {
				background: #2b2d32;
				color:  white;
				padding: 10px;
				border-radius: 10px;
				border: 2px solid #36383f;
				
				display: flex;
				flex-flow: row;
				gap: 10px;
			}
			a {
				text-decoration: underline;
				text-decoration-color: #1e58c0;
				text-decoration-thickness: 2px;
				color: 
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
		</style>
		<div class="ui">
			<div class="uiStackTop">
				<p><span class="appTitle">VeggieBot</span><span class="appVersion">v${GM_info.script.version} · #${botID}</span></p>
				<div class="mainStats">
					<span class="todoCounter"></span>
					<span class="pixelsPlaced"></span>
				</div>
				<div class="logScroller">
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
			</div>
			<div class="uiStackBottom">
				<div class="user">
				<img class="avatar" style="border-radius: 10px; width: 64px; height: 64px;" src="${`https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.webp?size=64`}">
				<div style="display: flex; flex-flow: column; justify-content: center; gap: 1px;">
					<span>
						<strong class="username">${user.username}</strong>
						<span class="discriminator">#${user.discriminator}</span>
					</span>
					<br>
					<a href="https://veggiebotserver.knobrega.com/auth/logout">Log out</a>
				</div>
			</div>
		</div>
	`;
	document.body.appendChild(div);
}

window.onload = async function startBot() { //when page is done loading, start bot
	fetch("https://veggiebotserver.knobrega.com/designs", {credentials: 'include'}) //fetch processed designs from server
	.then(response => response.text())
	.then(result => {

		const processedDesignArray = JSON.parse(result); //array of processed design objects
		const designArray = []; //array of final Design objects

		for (const processedDesign of processedDesignArray) { //for each processed design
			designArray.push( new veggieBot.Design(processedDesign)); //create final Design and push to designArray
		}

		window.designArray = designArray;
		console.log(designArray);

		veggieBot.pixelTimer(designArray, pixelCallback); //start pixel placement loop
		displayDesign(designArray[0]);
		
		ws = new WebSocket("wss://veggiebotserver.knobrega.com/live");
		ws.addEventListener("open", event => {
			ws.send(JSON.stringify({
				type: "connect",
				user
			}))
		});

		splash.classList.add("hidden"); //take down loading screen
		setTimeout(
			() => {
				window.location.reload();
			},
			(30 * 60 * 1000)
		); //refresh page after 30 mins
	});
};


function displayDesign(design) { //displays a Design in the ui's design inspector
	document.querySelector('.designName').innerHTML = design.name;
	document.querySelector('.designCompletion').innerHTML = `Completion: ${(design.width * design.height) - design.incorrectPixels.length} / ${design.width * design.height}`;
	document.querySelector('.designLocation').innerHTML = `Location: <a href="https://pixelcanvas.io/@${design.xCoord},${design.yCoord}">(${design.xCoord}, ${design.yCoord})</a>`;
	document.querySelector('.designDimensions').innerHTML = `Dimensions: ${design.width} × ${design.height}`;
	document.querySelector('.designSize').innerHTML = `Size: ${design.pixels.length} pixels`;
	document.querySelector('.designLink').innerHTML = `File: <a href="${design.url}" target="_blank" rel="noopener noreferrer">${design.url.substring(design.url.lastIndexOf('/') + 1)}</a>`;
}
/**
 * Refreshes anything in the UI that changes
 * @param {*} designArray TODO fix this
 */
function refreshUI(designArray) {
	const designsTable = document.querySelector(".designsTable");
	designsTable.innerHTML = `
		<tr>
			<th style="text-align: left;">Design</th>
			<th style="text-align: right;">Pixels To Do</th>
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
/**
 * Returns value of a cookie by name
 * @param {string} cname Name of the cookie to fetch
 * @returns {string} Value, blank if no cookie
 */
function getCookie(cname) {
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
/**
 * Sets a cookie value
 * @param {string} cname Name of cookie
 * @param {string} cvalue Value of cookie
 * @param {number} exdays Days until expiration
 */
function setCookie(cname, cvalue, exdays) {
	const d = new Date();
	d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
	let expires = "expires=" + d.toUTCString();
	document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

function pixelCallback (results) { //runs after each pixel placement attempt
	if (results.successful === true) {
		const oldCount = parseInt(getCookie("pixelCounter") ? getCookie("pixelCounter") : 0);
		setCookie(
			"pixelCounter",
			(oldCount + 1),
			3
		); //update cookie
	}

	veggieBot.webhook(results.string);
	// ws.send(JSON.stringify({
	// 	type: "pixel",
	// 	user,
	// 	results,
	// }))

	const p = document.createElement('p')

	const now = new Date();
	const timeString = "[" + now.getHours() + ":" + now.getMinutes().toString().padStart(2, '0') + ":" + now.getSeconds().toString().padStart(2, '0') + "]";

	p.innerHTML = timeString + " " + results.string;
	document.querySelector('.logScroller').appendChild(p)
	refreshUI(designArray);
	
}