function alertNotification(time) {
    const NOTIFICATION_TITLE = 'ALERT ONSLEEP';
    const NOTIFICATION_BODY = 'THE PC WILL CLOSE IN '+time+' MINUTES !';
    const NOTIFICATION_ICON = './img/warning.png';

    if (Notification.permission === 'granted') {
        // Crear y mostrar la notificación con una imagen
        const notification = new Notification(NOTIFICATION_TITLE, {
            body: NOTIFICATION_BODY,
            icon: NOTIFICATION_ICON,
        });
    } else if (Notification.permission !== 'denied') {
        // Solicitar permiso para mostrar notificaciones
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                // Crear y mostrar la notificación con una imagen
                const notification = new Notification(NOTIFICATION_TITLE, {
                    body: NOTIFICATION_BODY,
                    icon: NOTIFICATION_ICON,
                });
            }
        });
    }
}
