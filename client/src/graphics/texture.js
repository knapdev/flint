'use strict';

class Texture{
    constructor(gl, image){
        let texture = gl.createTexture();
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);        
        //gl.generateMipmap(gl.TEXTURE_2D);
        
        gl.bindTexture(gl.TEXTURE_2D, null);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);

        this.data = texture;
    }

    static load(gl, url, callback){
        let image = new Image();
        image.onload = function(){
            callback(new Texture(gl, image));
        };
        image.src = url;
    }

    static getUVFromIndex(index, tileSize, textureSize){
        let normalizedSize = Math.floor(tileSize) / Math.floor(textureSize);
        let tilesPerRow = Math.floor(Math.floor(textureSize) / Math.floor(tileSize));
        let x = Math.floor(Math.floor(index) % Math.floor(tilesPerRow)) * normalizedSize;
        let y = 1 - Math.floor(Math.floor(index) / Math.floor(tilesPerRow)) * normalizedSize;
        return {
            x0: x,
            y0: y,
            x1: x + normalizedSize,
            y1: y - normalizedSize
        }
    }
}

export default Texture;