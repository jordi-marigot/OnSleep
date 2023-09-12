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

for (const iface of interfaces) {
  const networkInterface = networkInterfaces[iface];
  for (const networkInfo of networkInterface) {
    if (
      networkInfo.family === 'IPv4' &&
      !networkInfo.internal &&
      networkInfo.address.startsWith('10.43.132.')
    ) {
      ipAddress = networkInfo.address;
      break;
    }
  }
}

if (!ipAddress) {
  console.error('No se encontró una dirección IP en el rango deseado (10.43.132.*).');
  // Puedes manejar el caso en el que no se encuentra una IP en el rango deseado aquí.
} else {
  // Envía la dirección IP local al servidor
  axios
    .post(`${serverUrl}/set-ip`, { ipAddress })
    .then((response) => {
      console.log('IP privada enviada al servidor Linux');
    })
    .catch((error) => {
      console.error('Error al enviar la IP privada al servidor Linux:', error);
    });
}

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

// Define la variable jsonData en un ámbito superior
// Define la variable jsonData en un ámbito superior
let jsonData;

// Define la variable jsonFileName en un ámbito superior
let jsonFileName;

// Función para obtener el JSON del servidor y mostrarlo
async function getAndShowJson() {
  try {
    // Obtén el nombre del archivo JSON
    jsonFileName = getJsonFileName();

    // Verifica si el nombre del archivo es válido
    if (!jsonFileName) {
      console.error('Nombre de archivo JSON no válido.');
      return;
    }

    // Realiza una solicitud al servidor para obtener el JSON
    const response = await axios.get(`${serverUrl}/days-data/${jsonFileName}`);

    if(typeof jsonData === "undefined" || jsonData === null){
      jsonData = response.data;
    }
    else{
      jsonDataOld = jsonData;
      jsonData = response.data;
      if(!equalJson(jsonDataOld, jsonData)){
        console.log("Update window | diferent json");
        mainWindow.reload();
      }
    }

    console.log("JSON recibido del servidor:", jsonData);
  } catch (error) {
    console.error("Error al obtener el JSON:", error);
  }
}

// Llama a la función inicialmente y luego cada 1 minuto (60,000 milisegundos)
getAndShowJson(); // Llamada inicial
setInterval(getAndShowJson, 60000); // Llamada cada 1 minuto

function equalJson(json1, json2) {

  if(json1.length > 0){
    return true;
  }


  // Comprobamos si ambos objetos tienen las mismas propiedades
  const props1 = Object.keys(json1);
  const props2 = Object.keys(json2);

  if (props1.length !== props2.length) {
    return false;
  }

  // Comparamos los valores de las propiedades
  for (let prop of props1) {
    if (json1[prop] !== json2[prop]) {
      return false;
    }
  }

  return true;
}

// Función para generar el nombre del archivo JSON basado en la fecha actual
function getJsonFileName() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `regular-${year}-${month}-${day}.json`;
}

// Registra un manejador para 'getJsonFromServer'
ipcMain.handle('getJsonFromServer', async (event, jsonFileName) => {
  try {
    // Verifica si la variable jsonData tiene datos válidos antes de procesarla
    if (!jsonData) {
      console.error('JSON no disponible.');
      return;
    }

    // Procesa los datos recibidos
    const { initialTimeH, initialTimeM, finalTimeH, finalTimeM, extraTime } = jsonData;

    // Devuelve los datos al proceso de renderizado
    return { initialTimeH, initialTimeM, finalTimeH, finalTimeM, extraTime };
  } catch (error) {
    console.error('Error al obtener el JSON del servidor:', error);
    throw error;
  }
});



// Inicia la aplicación y crea la ventana principal cuando esté lista
app.whenReady().then(createWindow);
