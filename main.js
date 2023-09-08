// Importa los módulos necesarios
const { app, BrowserWindow, ipcMain } = require('electron');
const os = require('os');
const axios = require('axios');
const path = require('path');
const fs = require('fs');

// Declara una variable para la ventana principal
let mainWindow;

// Función para crear la ventana principal de la aplicación
function createWindow() {
  // Define la ruta del archivo HTML
  const htmlPath = path.join(__dirname, 'js', 'index.html');

  // Crea una nueva ventana principal
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      contextIsolation: false, // Permite el uso de Node.js en el contexto de renderizado
      nodeIntegration: true,  // Habilita Node.js en el proceso de renderizado (cuidado con la seguridad)
    },
  });

  // Carga el archivo HTML en la ventana
  mainWindow.loadFile(htmlPath);
}

// Obtiene información de interfaces de red
const networkInterfaces = os.networkInterfaces();
const interfaces = Object.keys(networkInterfaces);
const serverUrl = "http://10.43.132.120:2222"; // URL del servidor

let ipAddress = '';

// Encuentra la dirección IP local de la máquina
for (const iface of interfaces) {
  const networkInterface = networkInterfaces[iface];
  for (const networkInfo of networkInterface) {
    if (networkInfo.family === 'IPv4' && !networkInfo.internal) {
      ipAddress = networkInfo.address;
      break;
    }
  }
}

// Envía la dirección IP local al servidor
axios
  .post(`${serverUrl}/set-ip`, { ipAddress })
  .then((response) => {
    console.log('IP privada enviada al servidor Linux');
  })
  .catch((error) => {
    console.error('Error al enviar la IP privada al servidor Linux:', error);
  });

// Envía señales de vida periódicamente al servidor
setInterval(() => {
  axios
    .post(`${serverUrl}/heartbeat`)
    .then((response) => {
      console.log('Señal de vida enviada al servidor Linux');
    })
    .catch((error) => {
      console.error('Error al enviar la señal de vida:', error);
    });
}, 60000);

// Función para generar el nombre del archivo JSON basado en la fecha actual
function getJsonFileName() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  console.log("Generando nombre del archivo JSON...");
  return `regular-${year}-${month}-${day}.json`;
}

// Registra un manejador para 'getJsonFromServer'
ipcMain.handle('getJsonFromServer', async (event, jsonFileName) => {
  try {
    // Obtén el nombre del archivo JSON
    const jsonFileName = getJsonFileName();

    // Verifica si el nombre del archivo es válido
    if (!jsonFileName) {
      console.error('Nombre de archivo JSON no válido.');
      return;
    }

    console.log("Solicitando JSON al servidor...");

    // Realiza una solicitud al servidor para obtener el JSON
    const response = await axios.get(`${serverUrl}/days-data/${jsonFileName}`);
    const jsonData = response.data; // Aquí obtenemos el JSON real desde la respuesta del servidor

    console.log("JSON recibido del servidor:", jsonData);

    // Procesa los datos recibidos
    const { initialTimeH, initialTimeM, finalTimeH, finalTimeM, extraTime } = jsonData;

    return [initialTimeH, initialTimeM, finalTimeH, finalTimeM, extraTime];
  } catch (error) {
    console.error('Error al obtener el JSON del servidor:', error);
    throw error;
  }
});

// Inicia la aplicación y crea la ventana principal cuando esté lista
app.whenReady().then(createWindow);