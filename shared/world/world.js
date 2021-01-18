'use strict';

import Chunk from "./chunk.js";
import Coord from "./coord.js";

class World{

    static CHUNK_SIZE = 8;

    name = '';
    seed = '';

    chunks = {};

    onChunkCreatedCallbacks = [];
    onChunkDestroyedCallbacks = [];
    onChunkUpdatedCallbacks = [];

    constructor(name, seed){
        this.name = name || 'New World';
        this.seed = seed || 'random';
    }

    tick(delta){

    }

    createChunk(coord){
        if(this.chunks[coord.getHash()] == undefined){
            let chunk = new Chunk(this, coord);
            this.chunks[coord.getHash()] = chunk;

            //generate
            for(let y = coord.y; y < coord.y + World.CHUNK_SIZE; y++){
				for(let x = coord.x; x < coord.x + World.CHUNK_SIZE; x++){
					for(let z = coord.z; z < coord.z + World.CHUNK_SIZE; z++){
                        let cell_coord = new Coord(x, y, z);
                        let rand = Math.random();
                        if(rand < 0.9){
                            chunk.getCell(cell_coord).setTerrain(true);
                        }
                    }
                }
            }

            //load save data

            //broadcast chunk created
            for(let i = 0; i < this.onChunkCreatedCallbacks.length; i++){
				this.onChunkCreatedCallbacks[i](chunk);
			}
            
            return chunk;
        }else{
            return this.getChunk(coord);
        }
    }

    destroyChunk(coord){
        let chunk = this.getChunk(coord);
        if(chunk){
            //save chunk

            //broadcast chunk destroyed

            delete this.chunks[coord.getHash()];
        }
    }

    getChunk(coord){
        let size = World.CHUNK_SIZE;
        let chunk_coord = new Coord(
            Math.floor(coord.x / size) * World.CHUNK_SIZE,
            Math.floor(coord.y / size) * World.CHUNK_SIZE,
            Math.floor(coord.z / size) * World.CHUNK_SIZE
        );

        let chunk = this.chunks[chunk_coord.getHash()];
        return chunk;
    }

    getChunkNeighbor(coord, direction){
        console.error('getChunkNeighbor not implemented.');
    }

    getCell(coord){
        let chunk = this.getChunk(coord);
        if(chunk){
            let cell_coord = new Coord(coord.x - chunk.coord.x, coord.y - chunk.coord.y, coord.z - chunk.coord.z);
            let cell = chunk.getCell(cell_coord);
            return cell;
        }else{
            return null;
        }
    }

    getCellNeighbor(coord, direction){
        let chunk = this.getChunk(coord);
        if(chunk){
            let cell_coord = new Coord(coord.x - chunk.coord.x, coord.y - chunk.coord.y, coord.z - chunk.coord.z);
            let cell = chunk.getCellNeighbor(coord, direction);
            return cell;
        }else{
            return null;
        }
    }

    registerOnChunkCreatedCallback(callback){
        this.onChunkCreatedCallbacks.push(callback);
    }
    unregisterOnChunkCreatedCallback(callback){
        this.onChunkCreatedCallbacks.remove(callback);
    }
    registerOnChunkDestroyedCallback(callback){
        this.onChunkDestroyedCallbacks.push(callback);
    }
    unregisterOnChunkDestroyedCallback(callback){
        this.onChunkDestroyedCallbacks.remove(callback);
    }
    registerOnChunkUpdatedCallback(callback){
        this.onChunkUpdatedCallbacks.push(callback);
    }
    unregisterOnChunkUpdatedCallback(callback){
        this.onChunkUpdatedCallbacks.remove(callback);
    }
}

export default World;