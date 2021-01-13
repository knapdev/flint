'use strict';

class Keyboard {
	constructor(){

		this.KeyCode = {
			BACKSPACE: 8,
			TAB: 9,
			ENTER: 13,

			SHIFT: 16,
			CONTROL: 17,

			ESCAPE: 27,

			SPACE: 32,

			LEFT: 37,
			UP: 38,
			RIGHT: 39,
			DOWN: 40,

			ZERO: 48,
			ONE: 49,
			TWO: 50,
			THREE: 51,
			FOUR: 52,
			FIVE: 53,
			SIX: 54,
			SEVEN: 55,
			EIGHT: 56,
			NINE: 57,

			A: 65,
			B: 66,
			C: 67,
			D: 68,
			E: 69,
			F: 70,
			G: 71,
			H: 72,
			I: 73,
			J: 74,
			K: 75,
			L: 76,
			M: 77,
			N: 78,
			O: 79,
			P: 80,
			Q: 81,
			R: 82,
			S: 83,
			T: 84,
			U: 85,
			V: 86,
			W: 87,
			X: 88,
			Y: 89,
			Z: 90,

			F1: 112,
			F2: 113,
			F3: 114,
			F4: 115,
			F5: 116,
			F6: 117,
			F7: 118,
			F8: 119,
			F9: 120,
			F10: 121,
			F11: 122,
			F12: 123,

			COUNT: 222
		};
		
		this.keysDown = [];
		this.keysUp = [];
		this.keysHeld = [];
		this.keysLast = [];

		for(let i = 0; i < this.KeyCode.COUNT; i++){
			this.keysDown[i] = false;
			this.keysUp[i] = false;
			this.keysHeld[i] = false;
			this.keysLast[i] = false;
		}

		this._update = function(){
			for(var i = 0; i < this.KeyCode.COUNT; i++){
				this.keysDown[i] = (!this.keysLast[i]) && this.keysHeld[i];
				this.keysUp[i] = this.keysLast[i] && (!this.keysHeld[i]);
				this.keysLast[i] = this.keysHeld[i];
			}
		};

		this._onKeyDown = function(evnt){
			this.keysHeld[evnt.keyCode] = true;
		};

		this._onKeyUp = function(evnt){
			this.keysHeld[evnt.keyCode] = false;
		};

		window.addEventListener('keydown', this._onKeyDown.bind(this));
		window.addEventListener('keyup', this._onKeyUp.bind(this));
	}

	getKey(keycode){
		return this.keysHeld[keycode];
	}

	getKeyDown(keycode){
		return this.keysDown[keycode];
	}

	getKeyUp(keycode){
		return this.keysUp[keycode];
	}
}

const instance = new Keyboard();
Object.freeze(instance);

export default instance;