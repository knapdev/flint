'use strict';

import Coord from '../world/coord.js';
import Action from './action.js';

class ActionMine extends Action{
    constructor(player, world, coord, duration){
        super();

        this.player = player;
        this.world = world;
        this.coord = coord;
        this.duration = duration;
    }

    execute(){
        if(this.coord !== null){
            let cell = this.world.getCell(this.coord);
            if(cell){
                cell.setTerrain(null);
            }
        }
    }
}

export default ActionMine;