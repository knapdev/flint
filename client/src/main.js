'use strict';

window.addEventListener('load', (evnt) => {
    main();    
});

let uuid = -1;

function main(){
    console.log('Client started.');

    let socket = io();
    socket.on('connect-success', (pack) => {
        uuid = pack.uuid;

        addEntryToLog('Welcome, ' + uuid + '!');
        addEntryToLog(pack.motd);
        addEntryToLog('Total users online: ' + pack.user_count);
    });

    socket.on('user-connected', (pack) => {
        addEntryToLog(pack.data + ' connected!');
    });

    socket.on('user-disconnected', (pack) => {
        addEntryToLog(pack.data + ' disconnected.');
    });

    socket.on('log-event', (pack) => {
        addEntryToLog(pack.uuid + ' says, "' + pack.data + '"');
    });
    
    let input = document.getElementById('eventlog-input');
    input.addEventListener('keyup', (evnt) => {
        if(evnt.keyCode == 13){
            socket.emit('chat-msg', {
                data: input.value
            });
            input.value = '';
        }
    });
}

function addEntryToLog(msg){
    let contents = document.getElementById('eventlog-contents');
    let entry = document.createElement('div');
    entry.id = 'eventlog-entry';
    entry.innerText = msg;
    contents.append(entry);
    contents.scrollTop = contents.scrollHeight;
}