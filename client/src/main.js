'use strict';

import User from "../../shared/user.js";

window.addEventListener('load', (evnt) => {
    main();    
});

let user = null;

function main(){
    console.log('Client started.');

    let login_button = document.getElementById('login-button');
    login_button.addEventListener('click', (evnt) => {
        let username = document.getElementById('login-username').value;
        let room = document.getElementById('login-room').value || 'general';

        let socket = io();
        socket.emit('join', {
            username: username,
            room: room
        });

        socket.on('connect-success', (pack) => {
            document.getElementById('login-container').style.display = 'none';
            document.getElementById('game-screen').style.display = 'block';
            user = new User(pack.uuid, pack.username, pack.room);

            addEntryToLog('Welcome to ' + pack.room + ', ' + user.name + '!');
            addEntryToLog(pack.motd);
            let upack = JSON.parse(pack.user_list);
            for(let u in upack){
                let up = upack[u];
                let other = new User(up.uuid, up.name, up.room);
            }
            logUserList({});


            socket.on('user-connected', (pack) => {
                let other = new User(pack.uuid, pack.username, pack.room);
                addEntryToLog(other.name + ' connected!');
            });
        
            socket.on('user-disconnected', (pack) => {
                let other = User.USERS[pack.uuid];
                addEntryToLog(other.name + ' disconnected.');
                delete User.USERS[other.uuid];
            });
        
            socket.on('log-user-message', (pack) => {
                logUserMessage(pack);
            });
        
            socket.on('log-event', (pack) => {
                logEvent(pack);
            });

            socket.on('log-user-list', (pack) => {
                logUserList({});
            });
            
            let input = document.getElementById('eventlog-input');
            input.addEventListener('keyup', (evnt) => {
                if(evnt.keyCode == 13){
                    if(input.value.length != 0){
                        socket.emit('chat-msg', {
                            data: input.value.toString()
                        });
                        input.value = '';
                    }
                }
            });
        });
    });
}

function logUserMessage(data){
    let text = data.name + ' says, "' + data.text + '"';
    if(data.type == 'loud'){
        text = data.name + ' yells, "' + data.text + '"';
    }
    
    addEntryToLog(text);
}

function logEvent(data){
    let text = data.text;
    addEntryToLog(text);
}

function logUserList(data){
    let msg = '';        
    let first = true;
    for(let u in User.USERS){
        if(first == false){
            msg += ', ';
        }
        let other = User.USERS[u];
        msg += other.name
        if(first == true){
            first = false;
        }
    }
    addEntryToLog('Users: ' + msg + ' (Total: ' + User.getUserCount() + ')');
}

function addEntryToLog(msg){
    let contents = document.getElementById('eventlog-contents');
    let entry = document.createElement('div');
    entry.id = 'eventlog-entry';
    entry.innerHTML = msg;
    contents.append(entry);
    contents.scrollTop = contents.scrollHeight;
}