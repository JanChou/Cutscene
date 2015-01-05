#pragma strict
@script AddComponentMenu("Cutscene/Actions/Set Material Vector")

@script ExecuteInEditMode()

@CutsceneEventOverrideNameAttribute("Set Material Vector")

class Action_SetMaterialVector extends CutsceneAction {
	var useMaterialOnObject:boolean = true;
	var materialIndex:int = 0;
	var material:Material;
	var propertyName:String = "_MyVector";
	
	function SetVector(value:Vector4) {
		SetupMaterial();
		if (!material) return;
		if (!material.HasProperty(propertyName)) return;
		material.SetColor(propertyName,value);
	}
	
	//#if !UNITY_FLASH
	@CutsceneActionAttribute("Set Channel X")
	//#endif
	function SetChannelX(value:float) {
		SetupMaterial();
		if (!material) return;
		if (!material.HasProperty(propertyName)) return;
		var c:Vector4 = material.GetVector(propertyName);
		c.x = value;
		material.SetVector(propertyName,c);
	}
	
	//#if !UNITY_FLASH
	@CutsceneActionAttribute("Set Channel Y")
	//#endif
	function SetChannelY(value:float) {
		SetupMaterial();
		if (!material) return;
		if (!material.HasProperty(propertyName)) return;
		var c:Vector4 = material.GetVector(propertyName);
		c.y = value;
		material.SetVector(propertyName,c);
	}
	
	//#if !UNITY_FLASH
	@CutsceneActionAttribute("Set Channel Z")
	//#endif
	function SetChannelZ(value:float) {
		SetupMaterial();
		if (!material) return;
		if (!material.HasProperty(propertyName)) return;
		var c:Vector4 = material.GetVector(propertyName);
		c.z = value;
		material.SetVector(propertyName,c);
	}
	
	//#if !UNITY_FLASH
	@CutsceneActionAttribute("Set Channel W")
	//#endif
	function SetChannelW(value:float) {
		SetupMaterial();
		if (!material) return;
		if (!material.HasProperty(propertyName)) return;
		var c:Vector4 = material.GetVector(propertyName);
		c.w = value;
		material.SetVector(propertyName,c);
	}
	
	@CutsceneEventExclude()
	function SetupMaterial() {
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

