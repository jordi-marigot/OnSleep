const { ipcRenderer } = require('electron');

ipcRenderer.invoke('getJsonFromServer')
  .then(data => {
    // Hacer algo con los datos obtenidos
    console.log(data);
  })
  .catch(error => {
    console.error('Error al llamar a getJsonFromServer:', error);
  });

// URL de la API
const apiUrl = "http://worldtimeapi.org/api/timezone/Europe/Madrid";

//var initialDateTime = new Date();
var finalDateTime = new Date();
// Llama a la función para leer el archivo JSON cuando la ventana esté lista
/*const result = getJsonFromServer();
console.log(result)
// Asignar valores a 
initialDateTime.setHours(result[0]);
initialDateTime.setMinutes(result[1]);*/
finalDateTime.setHours(7);
finalDateTime.setMinutes(0);
finalDateTime.setSeconds(0);

//console.log("aaaaaa", initialDateTime.getUTCHours, initialDateTime.getUTCMinutes, finalDateTime.getUTCHours ,finalDateTime.getUTCMinutes)

// Realiza una solicitud HTTP GET
fetch(apiUrl)
  .then(response => response.json())
  .then(data => {
    // Obtiene la fecha y hora en un solo objeto Date
    const actualDateTime = new Date(data.datetime);
    console.log("Fecha y hora actual:", actualDateTime);

    // Calcula la diferencia entre actualDateTime y finalDateTime
    const diferencia = new Date(finalDateTime - actualDateTime);

    // Extrae los componentes de tiempo de la diferencia
    const restHours = diferencia.getUTCHours();
    const restMinutes = diferencia.getUTCMinutes();
    const restSeconds = diferencia.getUTCSeconds();

    runCountdown(restHours, restMinutes, restSeconds);

    /*if ((actualHour >= finalDateTimeH && actualHour <= finalDateTimeH) || (actualHour >= finalDateTimeH && actualHour <= finalDateTimeH)) {
      runCountdown(0, 0, 0);
    }*/

  })
  .catch(error => {
    console.error("Error al obtener la hora desde la API", error);
  });
