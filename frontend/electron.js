const { app, BrowserWindow } = require("electron")
const { spawn } = require("child_process")
const path = require("path")

let mainWindow
let backendProcess

function startBackend(){

const backendPath = "C:\\phoenix_commerce_pos\\backend"

backendProcess = spawn("python", [
"-m",
"uvicorn",
"app.main:app",
"--port",
"8001"
], {
cwd: backendPath,
shell: true
})

backendProcess.stdout.on("data", data => {
console.log(`Backend: ${data}`)
})

backendProcess.stderr.on("data", data => {
console.error(`Backend Error: ${data}`)
})

}

function createWindow(){

mainWindow = new BrowserWindow({
width: 1400,
height: 900
})

mainWindow.loadURL("http://localhost:3000")

}

app.whenReady().then(() => {

startBackend()

setTimeout(() => {
createWindow()
}, 3000)

})

app.on("window-all-closed", () => {

if(backendProcess){
backendProcess.kill()
}

if(process.platform !== "darwin"){
app.quit()
}

})