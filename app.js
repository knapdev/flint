'use strict';

import Server from './server/server.js';

function main(){
    let server = new Server();
    server.start();
}
main();