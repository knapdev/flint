'use strict';

import Vector3 from './vector3.js';

class Transform {
	constructor(entity){
		this._position = new Vector3(0, 0, 0);
		this._rotation = new Vector3(0, 0, 0);
		this._scale = new Vector3(1, 1, 1);
	}

	get position(){
		return this._position;
	}

	set position(v){
		this._position.set(v.x, v.y, v.z);
	}

	get rotation(){
		return this._rotation;
	}

	set rotation(v){
		this._rotation.set(v.x, v.y, v.z);
	}

	get scale(){
		return this._scale;
	}

	set scale(v){
		this._scale.set(v.x, v.y, v.z);
	}
}

export default Transform;