'use strict';

import User from "../../shared/user.js";

window.addEventListener('load', (evnt) => {
    main();    
});

let user = null;

function main(){
    console.log('Client started.');

    let socket = io();
    socket.on('connect-success', (pack) => {
        user = new User(pack.uuid, socket, pack.name);

        addEntryToLog('Welcome, ' + user.name + '!');
        addEntryToLog(pack.motd);
        addEntryToLog('Total users online: ' + pack.user_count);
    });

    socket.on('user-connected', (pack) => {
        addEntryToLog(pack.name + ' connected!');
    });

    socket.on('user-disconnected', (pack) => {
        addEntryToLog(pack.name + ' disconnected.');
    });

    socket.on('log-event', (pack) => {
        addEntryToLog(pack.name + ' says, "' + pack.data + '"');
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