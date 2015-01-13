using UnityEngine;

[AddComponentMenu("Cutscene/Actions/Rotator")]
[ExecuteInEditMode()]

[CutsceneEventOverrideNameAttribute("Rotator")]

class Action_Rotator : CutsceneAction {
	Vector3 axis;
	float scaler = 1.0f;
	
	[CutsceneEventExclude()]
	public void Update() {
		if (!Application.isPlaying) return;
		Vector3 rotationValue = axis*scaler*Time.deltaTime;
		transform.Rotate(rotationValue);
	}
	
	//#if !UNITY_FLASH
	[CutsceneActionAttribute("Set Rotator Scaler")]
	//#endif
	public void SetRotatorScaler(float value) {
		scaler = value;
	}
	//#if !UNITY_FLASH
	[CutsceneActionAttribute("Set Rotator Axis X")]
	//#endif
	public void SetRotatorAxisX(float value) {
		axis.x = value;
	}
	//#if !UNITY_FLASH
	[CutsceneActionAttribute("Set Rotator Axis Y")]
	//#endif
	public void SetRotatorAxiY(float value) {
		axis.y = value;
	}
	//#if !UNITY_FLASH
	[CutsceneActionAttribute("Set Rotator Axis Z")]
	//#endif
	public void SetRotatorAxisZ(float value) {
		axis.z = value;
	}
}