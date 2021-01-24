'use strict';

class EventLog{
    constructor(){

    }

    setHeaderText(text){
        document.getElementById('eventlog-header').innerText = this.capitalize(text);
    }

    displayWelcomeMessage(player){
        this.addEntryToLog({
            text: 'Welcome to ' + this.capitalize(player.room) + ', <span class="eventlog-username">' + player.username + '</span>!'
        });
    }

    logUserMessage(data){
        let text = '<span class="eventlog-username">' + data.username + '</span> says, <span class="eventlog-msg">"' + data.text + '"</span>';
        if(data.type == 'loud'){
            text = '<span class="eventlog-username">' + data.username + '</span> yells, <span class="eventlog-msg">"' + data.text + '"</span>';
        }
        
        this.addEntryToLog({
            text: text
        });
    }

    logEvent(data){
        this.addEntryToLog({
            text: data.text
        });
    }

    logUserList(players){
        let msg = '';        
        let first = true;
        let count = 0;
        for(let u in players){
            if(first == false){
                msg += ', ';
            }
            let other = players[u];
            count++;
            msg += '<span class="eventlog-username">' + other.username + '</span>'
            if(first == true){
                first = false;
            }
        }
        this.addEntryToLog({
            text: 'Users: ' + msg + ' (Total: ' + count + ')'
        });
    }

    addEntryToLog(entry){
        let contents = document.getElementById('eventlog-contents');
        let elem = document.createElement('div');
        elem.id = 'eventlog-entry';
        elem.innerHTML = '[' + new Date().toLocaleTimeString().toLowerCase() + '] ' + entry.text;
        contents.append(elem);
        contents.scrollTop = contents.scrollHeight;
    }

    capitalize(str){
        if(typeof s !== 'string') str = str.toString();
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
}

export default EventLog;