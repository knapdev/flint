'use strict';

class Coord{
    
    x = 0;
    y = 0;
    z = 0;

	constructor(x, y, z){
		this.x = Math.floor(x) || 0;
		this.y = Math.floor(y) || 0;
		this.z = Math.floor(z) || 0;
	}

	static getWorldCoordAt(position){
		return new Coord(
			Math.floor(position.x),
			Math.floor(position.y),
			Math.floor(position.z)
		);
	}

	getNeighborCoord(direction){
		switch(direction){
			case Direction.NORTH:
				return this.north();
			case Direction.EAST:
				return this.east();
			case Direction.SOUTH:
				return this.south();
			case Direction.WEST:
				return this.west();
			case Direction.UP:
				return this.up();
			case Direction.DOWN:
				return this.down();
			default:
				console.error(direction + ' is not a direction.');
				return null;
		}
	}

	north(){
		return new Coord(this.x, this.y, this.z - 1);
	}

	east(){
		return new Coord(this.x + 1, this.y, this.z);
	}

	south(){
		return new Coord(this.x, this.y, this.z + 1);
	}

	west(){
		return new Coord(this.x - 1, this.y, this.z);
	}

	up(){
		return new Coord(this.x, this.y + 1, this.z);
	}

	down(){
		return new Coord(this.x, this.y - 1, this.z);
	}

	add(other){
		return new Coord(this.x + other.x, this.y + other.y, this.z + other.z);
	}

	getHash(){
		let hash = 47;
		hash = hash * 227 + this.x;
		hash = hash * 227 + this.y;
		hash = hash * 227 + this.z;
		return hash;
	}
}

export default Coord;