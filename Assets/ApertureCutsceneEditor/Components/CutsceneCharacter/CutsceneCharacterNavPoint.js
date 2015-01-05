#pragma strict

class CutsceneCharacterNavPoint extends Object {
	var position:Vector3;
	var transform:Transform;
	var speed:float = 1.0;
	var turnSpeedScaler:float = 1.0;
	var lookAt:Transform;
	var autoRemove:boolean = true;
	var instantMove:boolean = false;
	var dontUse:boolean = true;
	
	function GetPosition():Vector3 {
		if (transform) {
			return transform.position;
		}
		else {
			return position;
		}
	}
}
