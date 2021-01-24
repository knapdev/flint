'use strict';

import AABB from '../physics/aabb.js';
import Vector3 from '../math/vector3.js';

class Cell{
    
    terrain = null;

    constructor(){
    }

    setTerrain(terrain){
        this.terrain = terrain;
    }

    getTerrain(){
        return this.terrain;
    }

    getAABB(coord){
        if(this.terrain !== null){
            return new AABB(new Vector3(coord.x, coord.y, coord.z), new Vector3(coord.x + 1, coord.y + 1, coord.z + 1));
        }else{
            return null;
        }
	}

    pack(){
        return {
            terrain: this.terrain
        }
    }

    unpack(pack){
        this.terrain = pack.type;
    }
}

export default Cell;