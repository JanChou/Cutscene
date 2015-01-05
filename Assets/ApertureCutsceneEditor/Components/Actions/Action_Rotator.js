#pragma strict
@script AddComponentMenu("Cutscene/Actions/Rotator")

@script ExecuteInEditMode()

@CutsceneEventOverrideNameAttribute("Rotator")

class Action_Rotator extends CutsceneAction {
	var axis:Vector3;
	var scaler:float = 1.0;
	
	@CutsceneEventExclude()
	function Update() {
		if (!Application.isPlaying) return;
		var rotationValue:Vector3 = axis*scaler*Time.deltaTime;
		transform.Rotate(rotationValue);
	}
	
	//#if !UNITY_FLASH
	@CutsceneActionAttribute("Set Rotator Scaler")
	//#endif
	function SetRotatorScaler(value:float) {
		scaler = value;
	}
	//#if !UNITY_FLASH
	@CutsceneActionAttribute("Set Rotator Axis X")
	//#endif
	function SetRotatorAxisX(value:float) {
		axis.x = value;
	}
	//#if !UNITY_FLASH
	@CutsceneActionAttribute("Set Rotator Axis Y")
	//#endif
	function SetRotatorAxiY(value:float) {
		axis.y = value;
	}
	//#if !UNITY_FLASH
	@CutsceneActionAttribute("Set Rotator Axis Z")
	//#endif
	function SetRotatorAxisZ(value:float) {
		axis.z = value;
	}
}