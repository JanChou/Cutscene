using UnityEngine;

[AddComponentMenu("Cutscene/Actions/Set Material Float")]

[ExecuteInEditMode()]

[CutsceneEventOverrideNameAttribute("Set Material Float")]

class Action_SetMaterialFloat : CutsceneAction {
	bool useMaterialOnObject = true;
	int materialIndex = 0;
	Material material;
	string propertyName = "_MyFloat";
	
	//#if !UNITY_FLASH
	[CutsceneActionAttribute("Set Float")]
	//#endif
	public void SetFloat(float value){
		if (!material) return;
		if (!material.HasProperty(propertyName)) return;
		material.SetFloat(propertyName,value);
	}
	
	[CutsceneEventExclude()]
	public void SetupMaterial() {
			if (useMaterialOnObject) {
			if (!Application.isPlaying) {
				if (renderer && renderer.sharedMaterials.length > materialIndex) {
					material = renderer.sharedMaterials[materialIndex];
				}
			}
			else {
				if (renderer && renderer.materials.length > materialIndex) {
					material = renderer.materials[materialIndex];
				}
			}
		}
	}
}

