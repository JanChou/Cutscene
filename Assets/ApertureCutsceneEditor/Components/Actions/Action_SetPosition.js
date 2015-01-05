#pragma strict
@script AddComponentMenu("Cutscene/Actions/Set Position")

@script ExecuteInEditMode()

@CutsceneEventOverrideNameAttribute("Set Position")

class Action_SetPosition extends CutsceneAction {

	function SetPosition(position:Vector3) {
		if (transform.position != position)
			transform.position = position;
	}
	function SetPosition(transformPosition:Transform) {
		if (transform.position != transformPosition.position)
			transform.position = transformPosition.position;
	}
	
	//#if !UNITY_FLASH
	@CutsceneActionAttribute("Set Position X")
	//#endif
	function SetPositionX(value:float) {
		if (transform.position.x != value)
			transform.position.x = value;
	}
	
	//#if !UNITY_FLASH
	@CutsceneActionAttribute("Set Position Y")
	//#endif
	function SetPositionY(value:float) {
		if (transform.position.y != value)
			transform.position.y = value;
	}
	
	//#if !UNITY_FLASH
	@CutsceneActionAttribute("Set Position Z")
	//#endif
	function SetPositionZ(value:float) {
		if (transform.position.z != value)
			transform.position.z = value;
	}
}

