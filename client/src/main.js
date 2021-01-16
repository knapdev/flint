'use strict';

import Game from './game.js';

window.addEventListener('load', (evnt) => {
    main();    
});

function main(){
    let config = {};
    let game = new Game(config);
    game.start();
}