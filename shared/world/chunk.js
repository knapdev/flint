'use strict';

import World from './world.js';
import Cell from './cell.js';

import Coord from './coord.js';
import Direction from './direction.js';

class Chunk{
    
    world = null;
    coord = null;

    cells = null;

    constructor(world, coord){
        this.world = world;
        this.coord = coord;

        this.initCells();
    }

    initCells(){
        this.cells = new Array(World.CHUNK_SIZE);
        for(let x = 0; x < World.CHUNK_SIZE; x++){
            this.cells[x] = new Array(World.CHUNK_SIZE);
            for(let y = 0; y < World.CHUNK_SIZE; y++){
                this.cells[x][y] = new Array(World.CHUNK_SIZE);
                for(let z = 0; z < World.CHUNK_SIZE; z++){
                    let cell = new Cell();
                    this.cells[x][y][z] = cell;
                }
            }
        }
    }

    getCell(coord){
        if(this.contains(coord) == false){
            return this.world.getCell(coord);
        }

        return this.cells[coord.x][coord.y][coord.z];
    }

    getCellNeighbor(coord, direction){
        let world_coord = new Coord(coord.x + this.coord.x, coord.y + this.coord.y, coord.z + this.coord.z);
        switch(direction){
            case Direction.NORTH:
                return this.getCell(world_coord.north());
            case Direction.EAST:
                return this.getCell(world_coord.east());
            case Direction.SOUTH:
                return this.getCell(world_coord.south());
            case Direction.WEST:
                return this.getCell(world_coord.west());
            case Direction.UP:
                return this.getCell(world_coord.up());
            case Direction.DOWN:
                return this.getCell(world_coord.down());
        }

        console.error(direction + ' is not a direction.');
        return null;
    }

    inRange(index){
        if(index < 0 || index >= World.CHUNK_SIZE){
            return false;
        }

        return true;
    }

    contains(coord){
        if(this.inRange(coord.x) && this.inRange(coord.y) && this.inRange(coord.z)){
            return true;
        }

        return false;
    }
}

export default Chunk;