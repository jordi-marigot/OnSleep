const { ipcRenderer } = require('electron');
// URL de la API
const apiUrl = "http://worldtimeapi.org/api/timezone/Europe/Madrid";

ipcRenderer.invoke('getJsonFromServer')
  .then((result) => {
    // Procesa los datos recibidos
    const { initialTimeH, initialTimeM, finalTimeH, finalTimeM, extraTime } = result;

    var initialDateTime = new Date();
    var finalDateTime = new Date();
    // Asigna valores a 
    initialDateTime.setHours(initialTimeH);
    initialDateTime.setMinutes(initialTimeM);
    finalDateTime.setHours(finalTimeH);
    finalDateTime.setMinutes(finalTimeM);
    finalDateTime.setSeconds(0);

    // Realiza una solicitud HTTP GET
    fetch(apiUrl)
      .then(response => response.json())
      .then(data => {
        // Obtiene la fecha y hora en un solo objeto Date
        const actualDateTime = new Date(data.datetime);

        // Calcula la diferencia entre actualDateTime y finalDateTime
        const diferencia = new Date(finalDateTime - actualDateTime);

        // Extrae los componentes de tiempo de la diferencia
        const restHours = diferencia.getUTCHours();
        const restMinutes = diferencia.getUTCMinutes();
        const restSeconds = diferencia.getUTCSeconds();

        // Suma los segundos adicionales de extraTime
        const totalSeconds = restSeconds + extraTime;

        // Calcula el tiempo restante considerando los segundos adicionales
        const totalMinutes = restMinutes + Math.floor(totalSeconds / 60);
        const remainingSeconds = totalSeconds % 60;
        const totalHours = restHours + Math.floor(totalMinutes / 60);
        const remainingMinutes = totalMinutes % 60;

        const initialTimeinMinutes = initialTimeH * 60 + initialTimeM;
        const finalTimeinMinutes = finalTimeH * 60 + finalTimeM;
        const actualTimeinMinutes = actualDateTime.getUTCHours * 60 + actualDateTime.getUTCMinutes ;

        if (
          (initialDateTime <= actualDateTime && finalDateTime >= actualDateTime)
        ) {
          runCountdown(totalHours, remainingMinutes, remainingSeconds);
        } else {
          runCountdown(0, 0, 10);
        }
      })
      .catch(error => {
        console.error("Error al obtener la hora desde la API", error);
      });
  })
  .catch((error) => {
    console.error('Error al obtener jsonData del proceso principal:', error);
  });