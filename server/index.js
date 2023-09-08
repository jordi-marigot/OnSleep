const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs').promises;
const axios = require('axios');
const moment = require('moment-timezone');
const app = express();
const port = 2222;
const path = require('path'); // Importa la librería path

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Definir la ubicación de los archivos JSON
const jsonFilesPath = path.join(__dirname, 'days-data');

// Servir archivos estáticos desde la ubicación de los archivos JSON
app.use('/days-data', express.static(jsonFilesPath));

let clientIpAddress = '';
let currentLogFile = '';
let dropdownOptions = []; // Variable global para almacenar las opciones del menú desplegable

app.post('/set-ip', (req, res) => {
  const { ipAddress } = req.body;
  clientIpAddress = ipAddress;
  console.log('IP privada recibida del cliente:', clientIpAddress);
  res.sendStatus(200);
});

async function getOnlineTime() {
  try {
    const response = await axios.get("http://worldtimeapi.org/api/timezone/Europe/Madrid");
    const responseData = response.data;
    if (responseData && responseData.utc_datetime) {
      return responseData.utc_datetime;
    }
  } catch (error) {
    console.error('Error al obtener la hora en línea:', error.message);
  }
  return new Date().toISOString();
}

async function prependToFile(fileName, data) {
  try {
    const currentContent = await readFile(fileName); // Llamar a readFile de manera asincrónica con await
    const newContent = data + currentContent;
    await writeFile(fileName, newContent);
    console.log('Entrada agregada al principio del archivo:', data);
  } catch (error) {
    console.error('Error al agregar entrada al archivo:', error.message);
  }
}

// Añadir async a la función readFile
async function readFile(fileName) {
  try {
    const data = await fs.readFile(fileName, 'utf8');
    return data;
  } catch (error) {
    if (error.code === 'ENOENT') {
      return '';
    }
    throw error;
  }
}

async function writeFile(fileName, data) {
  await fs.writeFile(fileName, data);
}

async function getLogFilesList() {
  const directory = __dirname;
  const files = await fs.readdir(directory);
  const logFiles = files.filter((file) => file.endsWith('.log'));
  return logFiles;
}

async function generateDailyJson() {
  const currentDate = moment().tz('Europe/Madrid');
  const tomorrow = currentDate.clone().add(1, 'day');
  tomorrow.set({ hour: 0, minute: 5, second: 0, millisecond: 0 });

  const timeUntilMidnight = tomorrow.diff(currentDate);

  setTimeout(async () => {
    const formattedDate = tomorrow.format('YYYY-MM-DD');
    const jsonFileName = `${__dirname}/days-data/regular-${formattedDate}.json`;

    try {
      await fs.access(jsonFileName);
    } catch (error) {
      const defaultJsonData = {
        initialTimeH: 6,
        initialTimeM: 0,
        finalTimeH: 23,
        finalTimeM: 0,
        extraTime: 0,
      };
      await fs.writeFile(jsonFileName, JSON.stringify(defaultJsonData));
      console.log(`Archivo JSON generado para ${formattedDate} con valores por defecto.`);
    }
  }, timeUntilMidnight);
}

generateDailyJson();

app.post('/heartbeat', async (req, res) => {
  const currentTimeOnline = await getOnlineTime();
  console.log('Señal de vida recibida del cliente en', currentTimeOnline);
  const currentDate = moment().tz('Europe/Madrid').format('YYYY-MM-DD');

  if (currentDate !== currentLogFile) {
    currentLogFile = currentDate;
  }

  const logFileName = `${currentLogFile}.log`;

  const formattedTime = moment(currentTimeOnline)
    .tz('Europe/Madrid')
    .format('YYYY-MM-DD | HH:mm:ss');

  try {
    await prependToFile(logFileName, formattedTime + '\n');
  } catch (error) {
    console.error('Error al escribir en el archivo:', error.message);
  }

  res.sendStatus(200);
});

app.get('/get-json/:fileName', async (req, res) => {
  try {
    const jsonFileName = req.params.fileName;
    const jsonFilePath = `${__dirname}/days-data/${jsonFileName}`; // Ruta absoluta

    const jsonData = await fs.promises.readFile(jsonFilePath, 'utf-8');
    res.json(JSON.parse(jsonData));
  } catch (error) {
    console.error('Error al obtener el archivo JSON:', error);
    res.status(500).send('Error interno del servidor');
  }
});


app.get('/logs', async (req, res) => {
  const logFiles = await getLogFilesList();
  dropdownOptions = logFiles.map((logFile) => {
    return `<option value="${logFile}">${logFile}</option>`;
  });

  const mainPage = `
        <html>
        <head>
            <title>Archivos de Registro</title>
        </head>
        <body>
            <h1>Archivos de Registro</h1>
            <label for="logSelect">Seleccionar un archivo de registro:</label>
            <select id="logSelect">
            ${dropdownOptions.join('\n')}
            </select>
            <button onclick="redirectToSelectedLog()">Ir al archivo seleccionado</button>
            <script>
            function redirectToSelectedLog() {
                const selectedLog = document.getElementById('logSelect').value;
                window.location.href = '/logs/' + selectedLog;
            }
            </script>
        </body>
        </html>
    `;

    res.send(mainPage);
    });

    app.get('/logs/:logFileName', async (req, res) => {
    const { logFileName } = req.params;
    const logFilePath = `${__dirname}/${logFileName}`;

    try {
        const logContent = await readFile(logFilePath);
        res.send(`
        <html>
            <head>
            <title>Registro ${logFileName}</title>
            </head>
            <body>
            <h1>Registro ${logFileName}</h1>
            <pre>${logContent}</pre>
            </body>
        </html>
        `);
    } catch (error) {
        res.status(404).send('Archivo de registro no encontrado.');
    }
    });

app.get('/add-time', (req, res) => {
  const timeForm = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Agregar Tiempo</title>
        <style>
            /* Estilos CSS para tu formulario de agregar tiempo */
            /* ... */
        </style>
    </head>
    <body>
        <h1 style="text-align: center;">Añadir Tiempo</h1>
        <form action="/add-time" method="post">
            <!-- Formulario para agregar tiempo -->
            <!-- ... -->
        </form>
    </body>
    </html>
  `;
  res.send(timeForm);
});

app.post('/add-time', async (req, res) => {
  const { date, time } = req.body;
  const dateTime = `${date} ${time}`;
  const formattedDateTime = moment(dateTime).tz('Europe/Madrid').format('YYYY-MM-DD | HH:mm:ss');

  const currentDate = moment().tz('Europe/Madrid').format('YYYY-MM-DD');
  const logFileName = `${currentDate}.log`;

  try {
    await prependToFile(logFileName, formattedDateTime + '\n');
    res.redirect(`/logs/${logFileName}`);
  } catch (error) {
    console.error('Error al agregar tiempo:', error.message);
    res.sendStatus(500);
  }
});

app.listen(port, () => {
  console.log(`Servidor escuchando en el puerto ${port}`);
});
