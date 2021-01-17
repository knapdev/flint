'use strict';

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

    hasTerrain(){
        return (this.terrain != null) ? true : false;
    }
}

export default Cell;