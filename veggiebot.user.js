// ==UserScript==
// @name         VeggieBot
// @namespace    https://discord.gg/grHtzeRFAf
// @version      3.1.0
// @description  Bot for vegan banners on pixelcanvas.io
// @author       Vegans
// @match        https://pixelcanvas.io/*
// @icon         https://pixelcanvas.io/favicon.ico
// @updateURL    https://raw.githubusercontent.com/kevin8181/veggiebot/main/veggiebot.user.js
// @downloadURL  https://raw.githubusercontent.com/kevin8181/veggiebot/main/veggiebot.user.js
// @grant        none
// ==/UserScript==

//jshint esversion: 10


//put up loading screen
const splash = document.createElement("div");
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
`;
splash.innerHTML = `
  <h1 style="font-size: 2rem;">Loading VeggieBot...</h1>
`;
splash.classList.add("hidden");
document.body.appendChild(splash);
splash.classList.remove("hidden"); //fade in

//load library for png manipulation
const pngLib = document.createElement("script");
pngLib.src = "https://files.catbox.moe/lvz4q6.js";
pngLib.type = "application/javascript";
document.body.appendChild(pngLib);

//check or generate bot ID
const botID = getCookie("z") ? getCookie("z") : randomInteger(10000, 99999); //if cookie exists, get botID from there. otherwise create new ID.
setCookie("z", botID, 2); //save bot ID to cookie

//figure out number of pixels placed
let oldCount;
if (getCookie("pixelCounter")) { //if pixel count cookie exists
  oldCount = getCookie("pixelCounter"); //old count is cookie value
}
else {
  oldCount = 0; //otherwise 0
}

//div that holds all injected UI components
const div = document.createElement("div");
div.style = "margin-top: -42px;";
div.innerHTML = `
  <style>
    .ui {
      position: absolute;
      display: flex;
      flex-flow: row wrap;
      gap: 5px;
      padding: 5px;
      background-color: black;
      border-radius: 0 0 13px 0;
    }
    .ui div {
      background-color: cornflowerblue;
      border-radius: 10px;
      padding: 10px;
    }
    .infoButton {
      background-color: cornflowerblue;
      border-radius: 10px;
      padding: 10px;
      font-weight: 900;
      width: 44px;
      text-align: center;
    }

    .infoPanel {
      position: absolute;
      z-index: 999;
      width: 100vw;
      height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;

      background: rgba(0, 0, 0, 0.7);
      backdrop-filter: blur(10.5px);
      color:white;
      -webkit-backdrop-filter: blur(10.5px);

      transition: all 0.3s;
    }

    .closeInfoButton {
      background-color: #3668ff91;
      padding: 10px;
      border-radius: 6px;
      margin-top: 15px;
      box-shadow: 0px 0px 20px 1px #00000038;
      transition: box-shadow 0.3s, background 0.3s;
    }
    .closeInfoButton:hover {
      box-shadow: 0px 0px 20px 8px #0000005a;
      background-color: #3668ffa3;
    }

    .hidden {
      opacity: 0%;
      visibility: hidden;
    }
  </style>
  <div class="ui">
    <div class="pixelCounter">Pixels placed: ${oldCount}</div>
    <div class="todoCounter"></div>
    <button class="infoButton">?</button>
  </div>
  <div class="infoPanel hidden">
    <div style="display: flex; flex-flow: column; gap: 20px; width: 430px;">
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
      <div>
        <strong>Debug Info</strong><br>
        Version: <span class="version">${GM_info.script.version}</span><br>
        Bot ID: <span class="botID">${botID}</span><br>
      </div>
      <table>
        <tbody class="designsTable">
        </tbody>
      </table>
      <button class="closeInfoButton"><strong>Close</strong></button>
    </div>
  </div>
`;
document.body.appendChild(div);

document.querySelector(".infoButton").onclick = function showInfo() {document.querySelector(".infoPanel").classList.remove("hidden");}; //add action to info button
document.querySelector(".closeInfoButton").onclick = function closeInfo() {document.querySelector(".infoPanel").classList.add("hidden");}; //close button function

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

let pngtoy;
const designArray = []; //array of design objects

setTimeout(refresh, (30 * 60 * 1000)); //refresh page after 30 mins

//when page is done loading, start bot
window.onload = async function() {

  pngtoy = new PngToy();

  // //get designs from api
  // fetch("https://veggiebot.thechristmasstation.org/designs", {credentials: 'include'})
  // .then((response) => {
  //   response.text().then((result) => {
  //     const rawDesignArray = JSON.parse(result);
  //     console.log(rawDesignArray);
  //   });
  // });


  const rawDesignArray = [
    /*{
      url: "https://i.imgur.com/lmvqe6j.png",
      xCoord: 197,
      yCoord: 10001,
      name: "New small banner",
    },*/
    {
      url: "https://raw.githubusercontent.com/kevin8181/veggiebot/main/designs/watchDominion.png",
      xCoord: -141,
      yCoord: 9957,
      name: "Watch Dominon text",
    },
    {
      url: "https://raw.githubusercontent.com/kevin8181/veggiebot/main/designs/mainBanner.png",
      xCoord: -148,
      yCoord: 9950,
      name: "Main Banner Full Design",
    },
    {
      url: "https://raw.githubusercontent.com/kevin8181/veggiebot/main/designs/elwoods.png",
      xCoord: -68,
      yCoord: 10068,
      name: "Elwood's Large",
    },
    {
      url: "https://raw.githubusercontent.com/kevin8181/veggiebot/main/designs/elwoodsSmall.png",
      xCoord: -1699,
      yCoord: 9598,
      name: "Elwood's Small",
    },
    {
      url: "https://raw.githubusercontent.com/kevin8181/veggiebot/main/designs/train.png",
      xCoord: 27,
      yCoord: 10050,
      name: "Train",
    },
    {
      url: "https://raw.githubusercontent.com/kevin8181/veggiebot/main/designs/tunnel.png",
      xCoord: -148,
      yCoord: 10051,
      name: "Tunnel",
    },
    {
      url: "https://raw.githubusercontent.com/kevin8181/veggiebot/main/designs/solid_black_attack_superstraight.png",
      xCoord: -143,
      yCoord: 9834,
      name: "Black out superstraight",
    },
  ];

  for (const design of rawDesignArray) { //process each design

    design.data = await pngtoy.fetch(design.url).then(() => pngtoy.decode()).then(bmp => bmp); //extract png data

    design.pixels = [];
    for (var x = 0; x < design.data.width; x++) { //for each pixel column of the design
      for(var y = 0; y < design.data.height; y++) { //for each pixel row of the design
        const color = getPixelColor(design, x, y); //get pixel color
        const pixel = { //create pixel object
          x: x + design.xCoord,
          y: y + design.yCoord,
          color: color,
        };
        design.pixels.push(pixel); //add pixel to array
      }
    }
    designArray.push(design); //add design to processed designs array
  }
  updateAllIncorrectPixels();
  refreshDesignsTable();
  //take down splash screen
  splash.classList.add("hidden");

  webhook(`Connected.`); //send connection message to webhook
  pixelTimer(); //start pixel placement loop

};

function getPixelColor(design, x, y) { //returns color code for given pixel in a design, by design-level coordinates
  const rawColors = design.data.bitmap; //rbg array from canvas
  const offset = (design.data.width*y+x)*4;

  let pixelColor = null;

  const colorOptions = [
    {
      name: "white",
      id: 0,
      rgb: [255, 255, 255],
    },
    {
      name: "light grey",
      id: 1,
      rgb: [228, 228, 228],
    },
    {
      name: "dark grey",
      id: 2,
      rgb: [136, 136, 136],
    },
    {
      name: "black",
      id: 3,
      rgb: [34, 34, 34],
    },
    {
      name: "pink",
      id: 4,
      rgb: [255, 167, 209],
    },
    {
      name: "red",
      id: 5,
      rgb: [229, 0, 0],
    },
    {
      name: "orange",
      id: 6,
      rgb: [229, 149, 0],
    },
    {
      name: "brown",
      id: 7,
      rgb: [160, 106, 66],
    },
    {
      name: "yellow",
      id: 8,
      rgb: [229, 217, 0],
    },
    {
      name: "light green",
      id: 9,
      rgb: [148, 224, 68],
    },
    {
      name: "dark green",
      id: 10,
      rgb: [2, 190, 1],
    },
    {
      name: "light blue",
      id: 11,
      rgb: [0, 211, 221],
    },
    {
      name: "middle blue",
      id: 12,
      rgb: [0, 131, 199],
    },
    {
      name: "dark blue",
      id: 13,
      rgb: [0, 0, 234],
    },
    {
      name: "light purple",
      id: 14,
      rgb: [207, 110, 228],
    },
    {
      name: "dark purple",
      id: 15,
      rgb: [130, 0, 128],
    },
  ];

  if(rawColors[offset+3]>10){ // if alpha > 10 (ignores transparent pixels)
      for (const color of colorOptions) { //for each possible color
          if ( //if each r g b value is within 10 of the actual color
              rawColors[offset + 0] < (color.rgb[0] + 10) && rawColors[offset + 0] > (color.rgb[0] - 10) &&
              rawColors[offset + 1] < (color.rgb[1] + 10) && rawColors[offset + 1] > (color.rgb[1] - 10) &&
              rawColors[offset + 2] < (color.rgb[2] + 10) && rawColors[offset + 2] > (color.rgb[2] - 10)
          ) {
              pixelColor = color.id; //pixel is this color
          }
      }
      if (pixelColor === null) {
          console.error(`${rawColors[offset + 0]}, ${rawColors[offset + 1]}, ${rawColors[offset + 2]}`);
          console.error(`No color found at coordinates ${x}, ${y}.`);
      }
  }
  return pixelColor;
}


function getIncorrectPixels(design) { //returns an array of the pixel objects that need to be painted
  const incorrectPixels = [];
  const state = window.store.getState();
  for (const pixel of design.pixels) { //for each pixel in design's pixel array
    if (pixel.color != null && !window.isSameColorIn(state,[pixel.x, pixel.y], pixel.color)) { //if pixel isn't correct
      incorrectPixels.push(pixel); //add pixel to incorrect pixel array
    }
  }
  return incorrectPixels;
}

function refreshDesignsTable() {
  const designsTable = document.querySelector(".designsTable");
  designsTable.innerHTML = `
    <tr style="text-align: left;">
      <th>Design</th>
      <th>Location</th>
      <th>Size</th>
      <th>To Do</th>
    </tr>
  `;
  for (const design of designArray) { //for each design
    const row = document.createElement("tr");
    row.style = "border-top: 1px solid rgb(115, 115, 115);";
    row.innerHTML = `
      <td style="padding: 5px"><a href="${design.url}" target="_blank">${design.name}</a></td>
      <td><a href="https://pixelcanvas.io/@${design.xCoord},${design.yCoord}">${design.xCoord}, ${design.yCoord}</a></td>
      <td>${design.pixels.length}</td>
      <td>${design.incorrectPixels.length}</td>
    `;
    designsTable.appendChild(row);
  }
}

function choosePixel() { //selects the pixel to write
  for (const design of designArray) { //for each design
    if (design.incorrectPixels.length > 0) { //if this design has any incorrect pixels
      return design.incorrectPixels[randomInteger(1, design.incorrectPixels.length) - 1]; //return random pixel from this design
    }
  }
}

function updateAllIncorrectPixels() {
  let totalIncorrectPixels = 0;
  for (const design of designArray) { //for every design
    const incorrectPixels = getIncorrectPixels(design); //update incorrect pixels
    design.incorrectPixels = incorrectPixels; //save incorrect pixels to design
    totalIncorrectPixels += incorrectPixels.length; //add this design's incorrect pixels to total incorrect pixel count
  }
  document.querySelector(".todoCounter").innerHTML = "Pixels todo: " + totalIncorrectPixels; //update pixel todo counter
  refreshDesignsTable();
}

async function pixelTimer() { //the loop responsible for placing pixels
  //todo set timeout based on response from pixel api

  updateAllIncorrectPixels();
  const pixel = choosePixel(); //get a random pixel object to be painted

  if (pixel) { //if a pixel was returned
    const noDelay = await placePixel(pixel);

    if (noDelay) {
      console.log("Pixel is already correct, trying another...");
      setTimeout(pixelTimer, (0.3 * 1000)); //run again after 0.3 seconds
    }
    else {
      const randomDelay = Math.round(Math.random() * 5 * 1000); //random number of milliseconds to delay, up to 5 seconds
      setTimeout(pixelTimer, (60 * 1000) + randomDelay); //run again after one minute plus random delay
    }
  }
  else { //if no pixel was returned (all designs are complete)
    setTimeout(pixelTimer, (30 * 1000)); //run again in 30 seconds
  }

}
async function placePixel(pixel) { //attempts to place a pixel. returns true if the pixel is already there.
  const state = window.store.getState();
  if (window.isSameColorIn(state,[pixel.x, pixel.y], pixel.color)) { //if pixel is already there
    return true;
  }

  const fingerprint = await window.getFingerprint();
  const firebaseToken = (await window.getToken$2(window.appCheck, !1)).token;

  const wasabi = pixel.x + pixel.y + 2342;

  const headers = new Headers();
  headers.append("Content-Type", "application/json");

  var raw = JSON.stringify({
    "appCheckToken": firebaseToken,
    "color": pixel.color,
    "fingerprint": fingerprint,
    "wasabi": wasabi,
    "x": pixel.x,
    "y": pixel.y,
  });

  var requestOptions = {
    method: 'POST',
    headers: headers,
    body: raw,
    redirect: 'follow'
  };

  fetch("https://pixelcanvas.io/api/pixel", requestOptions)
  .then(response => response.text())
  .then(result => {
    if (JSON.parse(result).result.data.success) { //if server says the pixel was placed

      //update pixels placed counter in ui
      let newCount;
      if (getCookie("pixelCounter")) {
        newCount = parseInt(getCookie("pixelCounter")) + 1; //new count = old count + 1
      }
      else {
        newCount = 1;
      }
      setCookie("pixelCounter", newCount, 3); //update cookie
      const numregex = /[0-9]{1,}/;
      document.querySelector(".pixelCounter").innerHTML = document.querySelector(".pixelCounter").innerHTML.replace(numregex, newCount); //change count in ui

      //send message to webhook
      webhook("Pixel placed.");
    }
    else { //server returned 200 but gives an error message
      console.error(result);
    }
  })
  .catch(error => console.error('error', error)); //network error
}
function webhook(content) { //sends log/error message to discord webhook
  // const headers = new Headers();
  // headers.append("Content-Type", "application/json");
  // const webhookBody = JSON.stringify({
  //   "content": `\`${botID}\` \`v${GM_info.script.version}\`: ` + content,
  // });
  // const webhookOpts = {
  //   method: 'POST',
  //   headers: headers,
  //   body: webhookBody,
  // };
  // fetch("https://veggiebot.thechristmasstation.org/webhook", webhookOpts);
}
function randomInteger(min, max) { //returns random int between min and max inclusive
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function getCookie(cname) { //returns value of cookie by name
  let name = cname + "=";
  let decodedCookie = decodeURIComponent(document.cookie);
  let ca = decodedCookie.split(';');
  for(let i = 0; i <ca.length; i++) {
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
  d.setTime(d.getTime() + (exdays*24*60*60*1000));
  let expires = "expires="+ d.toUTCString();
  document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}
function refresh() {
  window.location.reload();
}
