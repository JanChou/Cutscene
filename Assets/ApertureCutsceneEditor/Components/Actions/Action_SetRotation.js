#pragma strict
@script AddComponentMenu("Cutscene/Actions/Set Rotation")

@script ExecuteInEditMode()

@CutsceneEventOverrideNameAttribute("Set Rotation")

class Action_SetRotation extends CutsceneAction {
	var rotation:Vector3;
	
	@CutsceneEventExclude()
	function Update() {
		if (transform.localEulerAngles != rotation)
			transform.localEulerAngles = rotation;
	}
	
	function SetRotation(value:Vector3) {
		rotation = value;
		Update();
	}
	
	//#if !UNITY_FLASH
	@CutsceneActionAttribute("Set Rotation X")
	//#endif
	function SetRotationX(value:float) {
		rotation.x = value;
		Update();
	}
	
	//#if !UNITY_FLASH
	@CutsceneActionAttribute("Set Rotation Y")
	//#endif
	function SetRotationY(value:float) {
		rotation.y = value;
		Update();
	}
	
	//#if !UNITY_FLASH
	@CutsceneActionAttribute("Set Rotation Z")
	//#endif
	function SetRotationZ(value:float) {
		rotation.z = value;
		Update();
	}
}

