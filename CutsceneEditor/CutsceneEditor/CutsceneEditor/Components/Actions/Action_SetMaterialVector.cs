using UnityEngine;

[AddComponentMenu("Cutscene/Actions/Set Material Vector")]
[ExecuteInEditMode()]

[CutsceneEventOverrideNameAttribute("Set Material Vector")]

class Action_SetMaterialVector : CutsceneAction {
	bool useMaterialOnObject = true;
	int materialIndex = 0;
	Material material;
	string propertyName = "_MyVector";
	
	public void SetVector(Vector4 value) {
		SetupMaterial();
		if (!material) return;
		if (!material.HasProperty(propertyName)) return;
		material.SetColor(propertyName,value);
	}
	
	//#if !UNITY_FLASH
	[CutsceneActionAttribute("Set Channel X")]
	//#endif
	public void SetChannelX(float value) {
		SetupMaterial();
		if (!material) return;
		if (!material.HasProperty(propertyName)) return;
		Vector4 c = material.GetVector(propertyName);
		c.x = value;
		material.SetVector(propertyName,c);
	}
	
	//#if !UNITY_FLASH
	[CutsceneActionAttribute("Set Channel Y")]
	//#endif
	public void SetChannelY(float value) {
		SetupMaterial();
		if (!material) return;
		if (!material.HasProperty(propertyName)) return;
		var c = material.GetVector(propertyName);
		c.y = value;
		material.SetVector(propertyName,c);
	}
	
	//#if !UNITY_FLASH
	[CutsceneActionAttribute("Set Channel Z")]
	//#endif
	public void SetChannelZ(float value) {
		SetupMaterial();
		if (!material) return;
		if (!material.HasProperty(propertyName)) return;
		var c = material.GetVector(propertyName);
		c.z = value;
		material.SetVector(propertyName,c);
	}
	
	//#if !UNITY_FLASH
	[CutsceneActionAttribute("Set Channel W")]
	//#endif
	public void SetChannelW(float value) {
		SetupMaterial();
		if (!material) return;
		if (!material.HasProperty(propertyName)) return;
		var c = material.GetVector(propertyName);
		c.w = value;
		material.SetVector(propertyName,c);
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

