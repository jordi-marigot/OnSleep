const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const axios = require('axios');
const moment = require('moment-timezone');
const app = express();
const port = 2222;

app.use(bodyParser.json());

let clientIpAddress = '';
let currentLogFile = '';

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
  // Si no se pudo obtener la hora en línea, se utiliza la hora local
  return new Date().toISOString();
}

async function prependToFile(fileName, data) {
  try {
    // Leer el contenido actual del archivo
    const currentContent = await readFile(fileName);

    // Concatenar la nueva entrada con el contenido actual
    const newContent = data + currentContent;

    // Escribir el nuevo contenido en el archivo
    await writeFile(fileName, newContent);

    console.log('Entrada agregada al principio del archivo:', data);
  } catch (error) {
    console.error('Error al agregar entrada al archivo:', error.message);
  }
}

async function readFile(fileName) {
  return new Promise((resolve, reject) => {
    fs.readFile(fileName, 'utf8', (err, data) => {
      if (err) {
        if (err.code === 'ENOENT') {
          // Si el archivo no existe, devolver una cadena vacía
          resolve('');
        } else {
          reject(err);
        }
      } else {
        resolve(data);
      }
    });
  });
}

async function writeFile(fileName, data) {
  return new Promise((resolve, reject) => {
    fs.writeFile(fileName, data, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

app.post('/heartbeat', async (req, res) => {
  const currentTimeOnline = await getOnlineTime();
  console.log('Señal de vida recibida del cliente en', currentTimeOnline);

  // Obtener la fecha actual en formato "AAAA-MM-DD"
  const currentDate = moment().tz('Europe/Madrid').format('YYYY-MM-DD');

  // Verificar si la fecha actual es diferente a la fecha del archivo actual
  if (currentDate !== currentLogFile) {
    currentLogFile = currentDate;
  }

  // Nombre del archivo de registro con la fecha
  const logFileName = `${currentLogFile}.log`;

  // Utilizar moment-timezone para convertir la hora y formatearla
  const formattedTime = moment(currentTimeOnline)
    .tz('Europe/Madrid')
    .format('YYYY-MM-DD | HH:mm:ss');

  // En la ruta /heartbeat, agregar la entrada al principio del archivo
  try {
    await prependToFile(logFileName, formattedTime + '\n');
  } catch (error) {
    console.error('Error al escribir en el archivo:', error.message);
  }

  res.sendStatus(200);
});

app.listen(port, () => {
  console.log(`Servidor escuchando en el puerto ${port}`);
});
