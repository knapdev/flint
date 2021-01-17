'use strict';

import Client from './client.js';

window.addEventListener('load', (evnt) => {
    main();    
});

function main(){
    let config = {};
    let client = new Client(config);
    client.start();
}