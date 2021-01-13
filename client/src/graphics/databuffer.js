'use strict';

class DataBuffer {
	constructor(gl, bufferType, data){
		this.gl = gl;
		this.bufferType = bufferType;
		this.data = data;

		this.buffer = this.gl.createBuffer();
		this.gl.bindBuffer(this.bufferType, this.buffer);
		this.gl.bufferData(this.bufferType, this.data, this.gl.STATIC_DRAW);
		this.gl.bindBuffer(this.bufferType, null);
	}

	bind(){
		this.gl.bindBuffer(this.bufferType, this.buffer);
	}

	unbind(){
		this.gl.bindBuffer(this.bufferType, null);
	}

	getCount(){
		return this.data.length;
	}
}

export default DataBuffer;