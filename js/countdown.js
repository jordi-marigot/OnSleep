function runCountdown(h, m, s){
    $(document).ready(function(){

        var countH = h; // Agrega una variable para las horas (inicialmente 0)
        var countM = m; // Variable para los minutos
        var countS = s; // Variable para los segundos

        // Actualiza los elementos HTML con los valores iniciales
        $("#hours").html(formatTime(countH));
        $("#minutes").html(formatTime(countM));
        $("#seconds").html(formatTime(countS));

        var pos = "pomodoro";
        var posLama;

        var clock = $(".timer").FlipClock(0, {
        countdown: true,
        clockFace: 'HourlyCounter', // Utiliza la cara de reloj para horas
        autoStart: true,
        callbacks: {
            interval: function(){
            if (clock.getTime() == 0){
                if (pos == "session"){
                clock.setTime(countB*60); // Restablece el tiempo a la duración de la pausa
                clock.start();
                pos = "break";
                $("#stats").html(pos);
                } else if (pos == "break"){
                clock.setTime(countS*60); // Restablece el tiempo a la duración de la sesión
                clock.start();
                pos = "session";
                $("#stats").html(pos);
                }
            }
                // Obtén el tiempo restante en segundos
                var remainingSeconds = clock.getTime();
                var root = document.documentElement;
                var color;

                if (remainingSeconds > 0) {
                    if (remainingSeconds <= 1800 && remainingSeconds > 1200) {
                        if(remainingSeconds == 1800){alertNotification(30)}
                        color = '#ffcb00';
                    } else if (remainingSeconds <= 1200 && remainingSeconds > 600) {
                        if(remainingSeconds == 1200){alertNotification(20)}
                        color = '#ff7100';
                    } else if (remainingSeconds <= 600) {
                        if(remainingSeconds == 600){alertNotification(10)}
                        color = '#f00';
                    }
                    
                    root.style.setProperty('--change-color', color);
                  }
            },
        },        
    });

        // Iniciar automáticamente el temporizador al cargar el documento
        clock.setTime((countH * 3600) + (countM * 60) + countS); // Convierte todo a segundos
        pos = "session";
        $("#stats").html(pos);
        count = countS;
        clock.start();

        //SESSION
        $("#sessInc").on("click", function(){
        if ($("#session").html() > 0){
            countS = parseInt($("#session").html());
            countS+=1;
            $("#session").html(countS);
            //clock.setTime(countS*60);
        }
        });
        $("#sessDec").on("click", function(){
        if ($("#session").html() > 1){
            countS = parseInt($("#session").html());
            countS-=1;
            $("#session").html(countS);
            //clock.setTime(countS*60);
        }
        });
        //BREAK
        $("#breakInc").on("click", function(){
        if ($("#break").html() > 0){
            countB = parseInt($("#break").html());
            countB+=1;
            $("#break").html(countB);
        }    
        });
        $("#breakDec").on("click", function(){
        if ($("#break").html() > 1){
            countB = parseInt($("#break").html());
            countB-=1;
            $("#break").html(countB);
        }
        });  
        $("#start").on("click", function(){
        if (count != countS || clock.getTime()==0){
            clock.setTime(countS*60);
            pos="session";
            $("#stats").html(pos);
        } else {
            pos = posLama;
            $("#stats").html(pos);
        }
        count = countS;       
        });

        // Función para formatear el tiempo con dos dígitos
        function formatTime(value) {
        return value < 10 ? "0" + value : value;
        }
    });
}
