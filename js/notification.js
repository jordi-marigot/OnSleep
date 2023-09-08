const { exec } = require('child_process');

function alertNotification(time) {

    const NOTIFICATION_TITLE = 'ALERT ONSLEEP';
    const NOTIFICATION_BODY = 'THE PC WILL CLOSE IN '+time+' MINUTES !';
    const NOTIFICATION_ICON = '../img/warning.png';

    if (Notification.permission === 'granted') {
        // Crear y mostrar la notificación con una imagen
        const notification = new Notification(NOTIFICATION_TITLE, {
            body: NOTIFICATION_BODY,
            icon: NOTIFICATION_ICON
        });
    } else if (Notification.permission !== 'denied') {
        // Solicitar permiso para mostrar notificaciones
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                // Crear y mostrar la notificación con una imagen
                const notification = new Notification(NOTIFICATION_TITLE, {
                    body: NOTIFICATION_BODY,
                    icon: NOTIFICATION_ICON
                });
            }
        });
    }
}

  // Esta función muestra un diálogo de confirmación antes de apagar el sistema
  function confirmShutdown() {
    const NOTIFICATION_TITLE = 'ALERT ONSLEEP';
    const NOTIFICATION_BODY = 'THE PC WILL CLOSE !';
    const NOTIFICATION_ICON = '../img/warning.png';

    if (Notification.permission === 'granted') {
        // Crear y mostrar la notificación con una imagen
        const notification = new Notification(NOTIFICATION_TITLE, {
            body: NOTIFICATION_BODY,
            icon: NOTIFICATION_ICON
        });

        // Esperar 5 segundos antes de ejecutar el código de apagado
        console.log('Windows se está apagando...');
        setTimeout(() => {
            exec('shutdown /s /f /t 0', (error, stdout, stderr) => {
                if (error) {
                    console.error(`Error al apagar Windows: ${error.message}`);
                    return;
                }
            });
        }, 5000); // 5000 milisegundos = 5 segundos
    } else if (Notification.permission !== 'denied') {
        // Solicitar permiso para mostrar notificaciones
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                // Llamar a la función nuevamente para mostrar la notificación
                confirmShutdown();
            }
        });
    }
}

