'use strict';

import Action from './action.js';

class ActionEat extends Action{
    constructor(player, duration){
        super();

        this.player = player;
        this.duration = duration;
    }

    execute(){
        this.player.eat();
    }
}

export default ActionEat;