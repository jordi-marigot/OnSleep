// URL de la API
const apiUrl = "http://worldtimeapi.org/api/timezone/Europe/Madrid";

var finalDateTime = new Date();
finalDateTime.setHours(14);
finalDateTime.setMinutes(23);
finalDateTime.setSeconds(0);

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
  })
  .catch(error => {
    console.error("Error al obtener la hora desde la API", error);
  });
