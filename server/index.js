const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs').promises;
const axios = require('axios');
const moment = require('moment-timezone');
const ping = require('ping'); // Importa el módulo ping
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
let timer;

clientIpAddress = obtenerIPGuardada();

// Función para guardar la IP en un archivo JSON
async function guardarIP(ipAddress) {
  try {
    const data = { ipAddress };
    await fs.writeFile('ipAddress.json', JSON.stringify(data));
    console.log('IP guardada con éxito:', ipAddress);
  } catch (error) {
    console.error('Error al guardar la IP:', error.message);
  }
}

// Función para obtener la IP guardada desde el archivo JSON
async function obtenerIPGuardada() {
  try {
    const data = await fs.readFile('ipAddress.json', 'utf-8');
    const parsedData = JSON.parse(data);
    if (parsedData.ipAddress) {
      console.log("IP del cliente precargada:", parsedData.ipAddress)
      return parsedData.ipAddress;
    }
  } catch (error) {
    console.error('Error al obtener la IP guardada:', error.message);
  }
  return null;
}

function checkClientStatus(clientIpAddress) {
  ping.sys.probe(clientIpAddress, (isAlive) => {
    if (isAlive) {
      logRegister("alert-")
      console.log(`El cliente en la IP ${clientIpAddress} está encendido.`);
    } else {
      console.log(`El cliente en la IP ${clientIpAddress} no responde.`);
    }
  });
  setTimeout(() => {
    checkClientStatus(clientIpAddress);
  }, 2 * 60 * 1000);
}


async function logRegister(stringMessage){
  const currentTimeOnline = await getOnlineTime();
  console.log('Señal de vida recibida del cliente en', currentTimeOnline);
  const currentDate = moment().tz('Europe/Madrid').format('YYYY-MM-DD');

  if (currentDate !== currentLogFile) {
    currentLogFile = currentDate;
  }

  const logFileName = `${stringMessage}${currentLogFile}.log`;

  const formattedTime = moment(currentTimeOnline)
    .tz('Europe/Madrid')
    .format('YYYY-MM-DD | HH:mm:ss');

  try {
    await prependToFile(logFileName, formattedTime + '\n');
  } catch (error) {
    console.error('Error al escribir en el archivo:', error.message);
  }
}

app.get('/get-ip', (req, res) => {
  res.json({ ipAddress: clientIpAddress });
});

app.post('/set-ip', (req, res) => {
  const { ipAddress } = req.body;
  clientIpAddress = ipAddress;
  console.log('IP privada recibida del cliente:', clientIpAddress);
  guardarIP(clientIpAddress);
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
    const filePath = path.join(__dirname, 'logs', fileName);
    let currentContent = '';

    try {
      currentContent = await fs.readFile(filePath, 'utf-8');
    } catch (error) {
    }

    const newContent = data + currentContent;
    await fs.writeFile(filePath, newContent, { flag: 'w' }); // Usamos { flag: 'w' } para crear o sobrescribir el archivo
    console.log('Entrada agregada al principio del archivo:', data, " en: ", fileName);
  } catch (error) {
    console.error('Error al agregar entrada al archivo:', error.message);
  }
}

async function getLogFilesList() {
  const directory = __dirname+"/logs/";
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
  res.sendStatus(200);
  heartbeatFalse(clientIpAddress,false);
});

function heartbeatFalse(ipClient, condition) {
  if (condition === true) {
    checkClientStatus(ipClient);
    return;
  }
  else{
    logRegister("regular-");
  }

  // Configura un temporizador para esperar 1 minuto y medio (90,000 ms).
  const tiempoDeEspera = 90 * 1000;

  const timeoutId = setTimeout(() => {
    console.log('-- La función no se llamó con `true` en 1 minuto y medio.');
  }, tiempoDeEspera);
}

// Llama a la función con `true` después de 1 minuto y medio.
setTimeout(() => {
  checkClientStatus(clientIpAddress, true);
}, 2 * 60 * 1000);

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
  dropdownOptions = logFiles
    .filter((logFile) => logFile.startsWith('regular-'))
    .map((logFile) => {
      // Elimina "regular-" y ".log" del nombre del archivo
      const date = logFile.replace('regular-', '').replace('.log', '');
      return `<option value="${logFile}">${date}</option>`;
    });

  const mainPage = `
        <html>
        <head>
            <title>Archivos de Registro</title>
        </head>
        <body>
            <h1>Archivos de Registro</h1>
            <label for="logSelect">Seleccionar una fecha de registro:</label>
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
  const logFilePathRegular = `${__dirname}/logs/${logFileName}`;
  let logFilePathAlert = `${__dirname}/logs/alert-${logFileName}`;
  logFilePathAlert = logFilePathRegular.replace('regular-', 'alert-');
  const logFileNameAlert = logFilePathAlert.replace('/server/logs/', '')

  try {
    const logContentRegular = await fs.readFile(logFilePathRegular, 'utf-8');
    const logContentAlert = await fs.readFile(logFilePathAlert, 'utf-8');
    
    res.send(`
      <html>
        <head>
          <title>Registros</title>
        </head>
        <body>
          <h1>Registros</h1>
          <h2>Archivo ${logFileName}</h2>
          <pre>${logContentRegular}</pre>
          <h2>Archivo ${logFileNameAlert}</h2>
          <pre>${logContentAlert}</pre>
        </body>
      </html>
    `);
  } catch (error) {
    const logContentRegular = await fs.readFile(logFilePathRegular, 'utf-8');
    res.send(`
      <html>
        <head>
          <title>Registros</title>
        </head>
        <body>
          <h1>Registros</h1>
          <pre>${logContentRegular}</pre>
        </body>
      </html>
    `);
  }
});

app.listen(3000, () => {
  console.log('El servidor está funcionando en el puerto 3000');
});

    app.get('/add-time', (req, res) => {
      const timeForm = `
      <!DOCTYPE html>
      <html>
      <head>
          <title>Agregar Tiempo</title>
          <style>

              #container-date {
                  display: flex;
                  justify-content: center;
                  align-items: center;
                  height: 120px;
                  margin-top: 12%;
                }

              #container-time {
                  margin-left: -20%;
                  display: flex;
                  justify-content: center;
                  align-items: center;
                  height: 120px;
                  margin-top: 5%;
              }

              .box-time {
                  width: 80px;
                  height: 120px;
                  background: linear-gradient(to bottom right, #B0DB7D 40%, #99DBB4 100%);
                  border-radius: 20px;
                  box-shadow: 5px 5px 20px rgba(203, 205, 211, 0.1);
                  margin: 0 15px;
                  position: relative;
                  display: flex;
                  justify-content: center;
                  align-items: center;
              }

              .circle1 {
                  width: 20px;
                  height: 20px;
                  background-color: #B0DB7D;
                  border-radius: 50%;
                  position: absolute;
                  left: 40%;
                  transform: translateX(-50%);
                  margin-top: 30px;
              }

              .circle2 {
                  width: 20px;
                  height: 20px;
                  background-color: #B0DB7D;
                  border-radius: 50%;
                  position: absolute;
                  left: 40%;
                  transform: translateX(-50%);
                  margin-bottom: 30px;
              }

              .symbol-date {
                  border: none;
                  background: none;
                  text-align: center;
                  font-size: 50px;
                  color: #B0DB7D;
              }

              .agragarBtn {
                  position: absolute;
                  background-color: #0074D9; /* Color de fondo azul */
                  color: #FFFFFF; /* Color del texto blanco */
                  padding: 10px 20px; /* Relleno para el botón */
                  border: none; /* Sin borde */
                  border-radius: 5px; /* Esquinas redondeadas */
                  cursor: pointer; /* Cambiar el cursor al pasar el ratón */
                  font-size: 50px;
                  left: 57%;
              }
              
              /* Estilos para el efecto al pasar el ratón */
              .agragarBtn:hover {
                  background-color: #0056b3; /* Color de fondo azul más oscuro en el hover */
              }

              input[type="number"] {
                  width: 100%;
                  border: none;
                  background: none;
                  text-align: center;
                  font-size: 50px;
                  height: 120px;
                  color: aliceblue;
              }

              input[type="number"]::-webkit-inner-spin-button,
              input[type="number"]::-webkit-outer-spin-button {
                  -webkit-appearance: none;
                  margin: 0;
              }

              input[type="number"] {
                  width: 100%;
                  border: none;
                  background: none;
                  text-align: center;
                  font-size: 50px;
                  height: 120px;
                  color: aliceblue;
                  outline: none;
                  -moz-appearance: textfield;
              }
          </style>
      </head>

      <body>

      <div id="container-date">
          <div class="box-time">
              <input type="number" name="box1" min="0" max="2" id="box1" oninput="onlyOnInput(this, 1)">
          </div>
          <div class="box-time" style="margin-right: 45px;">
              <input type="number" name="box2" min="0" max="9" id="box2" oninput="onlyOnInput(this, 2)">
          </div>
          <div class="symbol-date">/</div>
          <div class="box-time" style="margin-left: 45px;">
              <input type="number" name="box3" min="0" max="5" id="box3" oninput="onlyOnInput(this, 3)">
          </div>
          <div class="box-time" style="margin-right: 45px;">
              <input type="number" name="box4" min="0" max="9" id="box4" oninput="onlyOnInput(this, 4)">
          </div>
          <div class="symbol-date">/</div>
          <div class="box-time" style="margin-left: 45px;">
              <input type="number" name="box5" min="0" max="5" id="box5" oninput="onlyOnInput(this, 5)">
          </div>
          <div class="box-time">
              <input type="number" name="box6" min="0" max="9" id="box6" oninput="onlyOnInput(this, 6)">
          </div>
          <div class="symbol-date"></div>
          <div class="box-time">
              <input type="number" name="box7" min="0" max="5" id="box7" oninput="onlyOnInput(this, 7)">
          </div>
          <div class="box-time">
              <input type="number" name="box8" min="0" max="9" id="box8" oninput="onlyOnInput(this, 8)">
          </div>
      </div>

      <div id="container-time">
          <div class="box-time">
              <input type="number" name="box9" min="0" max="2" id="box9" oninput="limitInput(this, 9, 0, 2)">
          </div>
          <div class="box-time" style="margin-right: 45px;">
              <input type="number" name="box10" min="0" max="9" id="box10" oninput="limitBox2Input(this, 10)">
          </div>
          <div class="circle1"></div>
          <div class="circle2"></div>
          <div class="box-time">
              <input type="number" name="box11" min="0" max="5" id="box11" oninput="limitInput(this, 11, 0, 5)">
          </div>
          <div class="box-time">
              <input type="number" name="box12" min="0" max="9" id="box12" oninput="limitInput(this, 12, 0, 9)">
          </div>
          <button class="agragarBtn" id="agregarBtn" onclick="combineActions()">Agregar</button>
      </div>


      <script>
          function onlyOnInput(input, boxNumber) {
              if (input.value !== '' && input.value.length === 1) {
                  // Move focus to the next input
                  const nextInput = document.getElementById('box' + (boxNumber + 1));
                  if (nextInput) {
                      nextInput.focus();
                  }
              } else if (input.value.length > 1) {
                  // If the input has more than one character, keep only the first character
                  input.value = input.value[0];
              }
          }
          
          function limitInput(input, boxNumber, minVal, maxVal) {
              const value = parseInt(input.value);
              if (isNaN(value) || value < minVal || value > maxVal) {
                  input.value = '';
              }

              onlyOnInput(input, boxNumber);
          }

          function limitBox2Input(input, boxNumber) {
              const box1Value = parseInt(document.getElementById('box9').value);
              const value = parseInt(input.value);
          
              if (isNaN(value) || (box1Value === 2 && (value < 0 || value > 3)) || (box1Value !== 2 && (value < 0 || value > 9))) {
                  input.value = '';
              }
          
              if (input.value !== '' && input.value.length === 1) {
                  // Mover el foco al siguiente input
                  const nextInput = document.getElementById('box' + (boxNumber + 1));
                  if (nextInput) {
                      nextInput.focus();
                  }
              }
          }

          function combineDate() {
              const day = document.getElementById('box1').value + document.getElementById('box2').value;
              const month = document.getElementById('box3').value + document.getElementById('box4').value;
              const year = document.getElementById('box5').value + document.getElementById('box6').value +
                  document.getElementById('box7').value + document.getElementById('box8').value;

              `+"const date = `${year}-${month}-${day}`;"+`

              // Puedes usar combinedDate para realizar operaciones con la fecha en el formato deseado.
              console.log('Fecha combinada:', date);

              return date;
          }

          function combineActions() {

              // Obtener los valores de los campos de tiempo
              const hours = document.getElementById('box9').value + document.getElementById('box10').value;
              const minutes = document.getElementById('box11').value + document.getElementById('box12').value;

              console.log('Tiempo:', hours + ':' + minutes);

              var seconds = 00;
              var date = combineDate();;
          
              // Crear el formulario
              var form = document.createElement('form');
              form.action = "/add-time"; // URL del servidor donde enviar los datos
              form.method = "post"; // Método de envío (POST en este caso)
          
              // Crear campos de entrada para hours, minutes, seconds y date
              var inputHours = document.createElement('input');
              inputHours.type = "text";
              inputHours.name = "hours";
              inputHours.value = hours;
              form.appendChild(inputHours);
          
              var inputMinutes = document.createElement('input');
              inputMinutes.type = "text";
              inputMinutes.name = "minutes";
              inputMinutes.value = minutes;
              form.appendChild(inputMinutes);
          
              var inputSeconds = document.createElement('input');
              inputSeconds.type = "text";
              inputSeconds.name = "seconds";
              inputSeconds.value = seconds;
              form.appendChild(inputSeconds);
          
              var inputDate = document.createElement('input');
              inputDate.type = "text";
              inputDate.name = "date";
              inputDate.value = date;
              form.appendChild(inputDate);
          
              form.style.display = "none"; // Puedes ocultar el formulario si no es necesario mostrarlo en la página
          
              // Agregar el formulario al documento
              document.body.appendChild(form);
          
              // Enviar el formulario
              form.submit();
          
          }

          // Set initial focus on the first input
          document.getElementById('box9').focus();

          function autocompleteDateFields() {
              const today = new Date();
              const day = today.getDate().toString().padStart(2, '0');
              const month = (today.getMonth() + 1).toString().padStart(2, '0');
              const year = today.getFullYear().toString();

              // Rellenar los campos de fecha con la fecha actual
              document.getElementById('box1').value = day[0];
              document.getElementById('box2').value = day[1];
              document.getElementById('box3').value = month[0];
              document.getElementById('box4').value = month[1];
              document.getElementById('box5').value = year[0];
              document.getElementById('box6').value = year[1];
              document.getElementById('box7').value = year[2];
              document.getElementById('box8').value = year[3];
          }

          // Llamar a la función de autocompletar al cargar la página
          autocompleteDateFields();

      </script>
      </body>
      </html>

`;

res.send(timeForm);
});

app.post('/add-time', (req, res) => {
const { hours, minutes, seconds, date } = req.body;

const css = `                  
<style>
@import url('https://fonts.googleapis.com/css?family=Lato:400,700');
html {
display: grid;
min-height: 100%;
}
body {
display: grid;
overflow: hidden;
font-family: 'Lato', sans-serif;
text-transform: uppercase;
text-align: center;
}
#container {
position: relative;
margin: auto;
overflow: hidden;
width: 1400px;
height: 500px;
}
h1 {
font-size: 1.9em;
font-weight: 100;
letter-spacing: 3px;
padding-top: 5px;
color: #FCFCFC;
padding-bottom: 5px;
text-transform: uppercase;
}
.green {
color: #4ec07d;
}
.red {
color: #e96075;
}
.alert {
font-weight: 700;
letter-spacing: 5px;
}
p {
margin-top: -5px;
font-size: 1.3em;
font-weight: 100;
color: #5e5e5e;
letter-spacing: 1px;
}
button, .dot {
cursor: pointer;
}
#success-box {
position: absolute;
width: 35%;
height: 100%;
top: 50%;
left: 50%;
transform: translate(-50%, -50%);
background: linear-gradient(to bottom right, #B0DB7D 40%, #99DBB4 100%);
border-radius: 20px;
box-shadow: 5px 5px 20px rgba(203, 205, 211, 0.1);
perspective: 40px;
}

#error-box {
position: absolute;
width: 35%;
height: 100%;
top: 50%;
left: 50%;
transform: translate(-50%, -50%);
background: linear-gradient(to bottom left, #EF8D9C 40%, #FFC39E 100%);
border-radius: 20px;
box-shadow: 5px 5px 20px rgba(203, 205, 211, 0.1);
perspective: 40px;
}
.dot {
width: 8px;
height: 8px;
background: #FCFCFC;
border-radius: 50%;
position: absolute;
top: 4%;
right: 6%;
}
.dot:hover {
background: #c9c9c9;
}
.two {
right: 12%;
opacity: 0.5;
}
.face {
position: absolute;
width: 22%;
height: 22%;
background: #FCFCFC;
border-radius: 50%;
border: 1px solid #777777;
top: 21%;
left: 37.5%;
z-index: 2;
animation: bounce 1s ease-in infinite;
}
.face2 {
position: absolute;
width: 22%;
height: 22%;
background: #FCFCFC;
border-radius: 50%;
border: 1px solid #777777;
top: 21%;
left: 37.5%;
z-index: 2;
animation: roll 3s ease-in-out infinite;
}
.eye {
position: absolute;
width: 5px;
height: 5px;
background: #777777;
border-radius: 50%;
top: 40%;
left: 20%;
}
.right {
left: 68%;
}
.mouth {
position: absolute;
top: 43%;
left: 41%;
width: 7px;
height: 7px;
border-radius: 50%;
}
.happy {
border: 2px solid;
border-color: transparent #777777 #777777 transparent;
transform: rotate(45deg);
}
.sad {
top: 49%;
border: 2px solid;
border-color: #777777 transparent transparent #777777;
transform: rotate(45deg);
}
.shadow {
position: absolute;
width: 21%;
height: 3%;
opacity: 0.5;
background: #777777;
left: 40%;
top: 43%;
border-radius: 50%;
z-index: 1;
}
.scale {
animation: scale 1s ease-in infinite;
}
.move {
animation: move 3s ease-in-out infinite;
}
.message {
position: absolute;
width: 100%;
text-align: center;
height: 40%;
top: 47%;
}
.button-box {
position: absolute;
background: #FCFCFC;
width: 50%;
height: 15%;
border-radius: 20px;
top: 78%;
left: 25%;
outline: 0;
border: none;
box-shadow: 2px 2px 10px rgba(119, 119, 119, 0.5);
transition: all 0.5s ease-in-out;
}
.button-box:hover {
background: #efefef;
transform: scale(1.05);
transition: all 0.3s ease-in-out;
}
@keyframes bounce {
50% {
  transform: translateY(-10px);
}
}
@keyframes scale {
50% {
  transform: scale(0.9);
}
}
@keyframes roll {
0% {
  transform: rotate(0deg);
  left: 25%;
}
50% {
  left: 60%;
  transform: rotate(168deg);
}
100% {
  transform: rotate(0deg);
  left: 25%;
}
}
@keyframes move {
0% {
  left: 25%;
}
50% {
  left: 60%;
}
100% {
  left: 25%;
}
}
footer {
position: absolute;
bottom: 0;
right: 0;
text-align: center;
font-size: 1em;
text-transform: uppercase;
padding: 10px;
font-family: 'Lato', sans-serif;
}
footer p {
color: #EF8D9C;
letter-spacing: 2px;
}
footer a {
color: #B0DB7D;
text-decoration: none;
}
footer a:hover {
color: #FFC39E;
}
</style>
<script>
document.addEventListener("DOMContentLoaded", () => {
  const continueButton = document.querySelector(".button-box");
  continueButton.addEventListener("click", () => {
      // Vuelve a la página anterior
      window.history.back();
  });
});
</script>
`

const successPopupHTML = css+`
          <div id="container">
              <div id="success-box">
                  <div class="dot"></div>
                  <div class="dot two"></div>
                  <div class="face">
                  <div class="eye"></div>
                  <div class="eye right"></div>
                  <div class="mouth happy"></div>
                  </div>
                  <div class="shadow scale"></div>
                  <div class="message"><h1 class="alert">Success!</h1><p>yay, everything is working.</p></div>
                  <button class="button-box"><h1 class="green">continue</h1></button>
              </div>
          </div>
    `;
const errorPopupHTML = css+`
          <div id="container">
              <div id="error-box">
                  <div class="dot"></div>
                      <div class="dot two"></div>
                          <div class="face2">
                              <div class="eye"></div>
                              <div class="eye right"></div>
                              <div class="mouth sad"></div>
                          </div>
                      <div class="shadow move"></div>
                  <div class="message"><h1 class="alert">Error!</h1><p>oh no, something went wrong.</div>
                  <button class="button-box"><h1 class="red">try again</h1></button>
              </div>
          </div>
    `;

// Validar que las horas, minutos y segundos sean lógicos
if (
  hours >= 0 && hours < 24 &&
  minutes >= 0 && minutes < 60 &&
  seconds >= 0 && seconds < 60
) {
  const fs = require('fs');
  const dateTime = moment(`${date} ${hours}:${minutes}:${seconds}`, 'YYYY-MM-DD HH:mm:ss');
  const fileName = `regular-${dateTime.format('YYYY-MM-DD')}.json`;
  const directoryPath = path.join(__dirname, 'days-data'); // Ruta completa al directorio
  const filePath = path.join(directoryPath, fileName); // Ruta completa al archivo

  if (dateTime.isValid()) {
    console.log('Fecha y hora ingresadas:', dateTime.format('YYYY-MM-DD HH:mm:ss'));
    
// Verificar si el archivo ya existe
    if (fs.existsSync(filePath)) {
      // Si el archivo existe, cargar su contenido
      const existingData = JSON.parse(fs.readFileSync(filePath, 'utf8'));

      // Actualizar las propiedades necesarias
      existingData.finalTimeH = dateTime.hours();
      existingData.finalTimeM = dateTime.minutes();

      // Escribir el archivo actualizado
      fs.writeFileSync(filePath, JSON.stringify(existingData, null, 2));

      console.log('Archivo JSON actualizado con éxito:', fileName);
      res.send(successPopupHTML);
    } else {
      // Si el archivo no existe, crear uno nuevo
      const timeData = {
        initialTimeH: 6,
        initialTimeM: 0,
        finalTimeH: dateTime.hours(),
        finalTimeM: dateTime.minutes(),
        extraTime: 0,
      };

      fs.writeFileSync(filePath, JSON.stringify(timeData, null, 2));

      console.log('Archivo JSON creado con éxito:', fileName);
      res.send(successPopupHTML);
    }
  } else {
    res.status(400).send(errorPopupHTML);
  }
}
});

app.listen(port, () => {
  console.log(`Servidor escuchando en el puerto ${port}`);
});