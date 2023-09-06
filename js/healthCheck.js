const { app } = require('electron');
const axios = require('axios');
const os = require('os');
const networkInterfaces = os.networkInterfaces();

const serverUrl = 'http://servidor-linux-ip:8022'; // Reemplaza con la IP y puerto del servidor Linux.

app.on('ready', () => {
  // Obtener la IP privada de la computadora
  const interfaces = Object.keys(networkInterfaces);
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
  axios.post(`${serverUrl}/set-ip`, { ipAddress })
    .then(response => {
      console.log('IP privada enviada al servidor Linux');
    })
    .catch(error => {
      console.error('Error al enviar la IP privada al servidor Linux:', error);
    });

  // Configurar un temporizador para enviar señales de vida cada 1 minuto.
  setInterval(() => {
    axios.post(`${serverUrl}/heartbeat`)
      .then(response => {
        console.log('Señal de vida enviada al servidor Linux');
      })
      .catch(error => {
        console.error('Error al enviar la señal de vida:', error);
      });
  }, 60000); // 1 minuto en milisegundos.
});
