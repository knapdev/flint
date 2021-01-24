'use strict';

class Vector3 {
	constructor(x, y, z){
		this._x = x || 0;
		this._y = y || 0;
		this._z = z || 0;
	}

	get x(){
		return this._x;
	}

	set x(val){
		this._x = val;
	}

	get y(){
		return this._y;
	}

	set y(val){
		this._y = val;
	}

	get z(){
		return this._z;
	}

	set z(val){
		this._z = val;
	}

	set(x, y, z){
		this.x = x;
		this.y = y;
		this.z = z;

		return this;
	}

	add(v){
		this.x += v.x;
		this.y += v.y;
		this.z += v.z;

		return this;
	}

	sub(v){
		this.x -= v.x;
		this.y -= v.y;
		this.z -= v.z;

		return this;
	}

	mult(v){
		this.x *= v.x;
		this.y *= v.y;
		this.z *= v.z;

		return this;
	}

	div(v){
		this.x /= v.x;
		this.y /= v.y;
		this.z /= v.z;

		return this;
	}

	magnitude(){
		return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z)
	}

	distance(other){
		return Math.sqrt(Math.pow((other.x - this.x), 2) + Math.pow((other.y - this.y), 2) + Math.pow((other.z - this.z), 2));
	}

	normalize(){
		let mag = this.magnitude();
		return this.div(new Vector3(mag, mag, mag));
	}

	clone(){
		return new Vector3(this.x, this.y, this.z);
	}
}

export default Vector3