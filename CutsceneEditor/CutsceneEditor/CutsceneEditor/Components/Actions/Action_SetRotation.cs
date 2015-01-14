using UnityEngine;

[AddComponentMenu("Cutscene/Actions/Set Rotation")]

[ExecuteInEditMode()]

[CutsceneEventOverrideNameAttribute("Set Rotation")]

class Action_SetRotation : CutsceneAction {
	public Vector3 rotation;
	
	[CutsceneEventExclude()]
	public void Update() {
		if (transform.localEulerAngles != rotation)
			transform.localEulerAngles = rotation;
	}
	
	public void SetRotation(Vector3 value) {
		rotation = value;
		Update();
	}
	
	//#if !UNITY_FLASH
	[CutsceneActionAttribute("Set Rotation X")]
	//#endif
	public void SetRotationX(float value) {
		rotation.x = value;
		Update();
	}
	
	//#if !UNITY_FLASH
	[CutsceneActionAttribute("Set Rotation Y")]
	//#endif
	public void SetRotationY(float value) {
		rotation.y = value;
		Update();
	}
	
	//#if !UNITY_FLASH
	[CutsceneActionAttribute("Set Rotation Z")]
	//#endif
	public void SetRotationZ(float value) {
		rotation.z = value;
		Update();
	}
}

