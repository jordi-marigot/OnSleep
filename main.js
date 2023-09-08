const { app, BrowserWindow, dialog } = require('electron');
const os = require('os');
const axios = require('axios');
const path = require('path');

let mainWindow;

function createWindow() {
  // Crear ventana principal y cargar archivo HTML

  const preloadPath = path.join(__dirname, '\\js\\preload.js');
  const htmlPath = path.join(__dirname, '\\js\\index.html');


  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: preloadPath,
      contextIsolation: false, // Deshabilitar el aislamiento de contexto para poder acceder a require
      nodeIntegration: true,
    },
  });

  mainWindow.loadFile(htmlPath);
}


  // Obtener la IP privada de la computadora
  const networkInterfaces = os.networkInterfaces();
  const interfaces = Object.keys(networkInterfaces);
  const serverUrl = "http://10.43.132.120:2222"
  let ipAddress = '';

  for (const iface of interfaces) {
    const networkInterface = networkInterfaces[iface];
    for (const networkInfo of networkInterface) {
      // Verificar si es una dirección IP privada
      if (networkInfo.family === 'IPv4' && !networkInfo.internal) {
        ipAddress = networkInfo.address;
        break;
      }
    }
  }

  // Enviar la IP privada al servidor Linux
  axios
    .post(`${serverUrl}/set-ip`, { ipAddress })
    .then((response) => {
      console.log('IP privada enviada al servidor Linux');
    })
    .catch((error) => {
      console.error('Error al enviar la IP privada al servidor Linux:', error);
    });

  // Configurar un temporizador para enviar señales de vida cada 1 minuto.
  setInterval(() => {
    axios
      .post(`${serverUrl}/heartbeat`)
      .then((response) => {
        console.log('Señal de vida enviada al servidor Linux');
      })
      .catch((error) => {
        console.error('Error al enviar la señal de vida:', error);
      });
  }, 60000); // 1 minuto en milisegundos.

app.whenReady().then(createWindow);