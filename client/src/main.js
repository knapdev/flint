'use strict';

window.addEventListener('load', (evnt) => {
    main();    
});

function main(){
    console.log('Client started.');

    let socket = io();
    socket.on('init', (pack) => {
        console.log('Server sent: ' + pack.data.toString());

        socket.emit('msg', {
            data: 'Yo'
        });
    });
}