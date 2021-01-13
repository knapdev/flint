'use strict';

class Utils{
    constructor(){
    }

    static degToRad(deg){
        return deg * (Math.PI / 180.0);
    }

    static radToDeg(rad){
        return rad * (180.0 / Math.PI);
    }

    static lerp(start, end, percent){
        return (start + percent * (end - start));
    }

    static clamp(num, min, max){
		return Math.min(Math.max(num, min), max);
	}
}

export default Utils;