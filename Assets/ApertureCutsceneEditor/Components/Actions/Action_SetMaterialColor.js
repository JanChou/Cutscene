#pragma strict

@script AddComponentMenu("Cutscene/Actions/Set Material Color")

@script ExecuteInEditMode()

@CutsceneEventOverrideNameAttribute("Set Material Color")

class Action_SetMaterialColor extends CutsceneAction {
	var useMaterialOnObject:boolean = true;
	var materialIndex:int = 0;
	var material:Material;
	var propertyName:String = "_Color";
	
	function SetColor(value:Color) {
		SetupMaterial();
		if (!material) return;
		if (!material.HasProperty(propertyName)) return;
		material.SetColor(propertyName,value);
	}
	
	//#if !UNITY_FLASH
	@CutsceneActionAttribute("Set Channel R")
	//#endif
	function SetChannelR(value:float) {
		SetupMaterial();
		if (!material) return;
		if (!material.HasProperty(propertyName)) return;
		var c:Color = material.GetColor(propertyName);
		c.r = value;
		material.SetColor(propertyName,c);
	}
	
	//#if !UNITY_FLASH
	@CutsceneActionAttribute("Set Channel G")
	//#endif
	function SetChannelG(value:float) {
		SetupMaterial();
		if (!material) return;
		if (!material.HasProperty(propertyName)) return;
		var c:Color = material.GetColor(propertyName);
		c.g = value;
		material.SetColor(propertyName,c);
	}
	
	//#if !UNITY_FLASH
	@CutsceneActionAttribute("Set Channel B")
	//#endif
	function SetChannelB(value:float) {
		SetupMaterial();
		if (!material) return;
		if (!material.HasProperty(propertyName)) return;
		var c:Color = material.GetColor(propertyName);
		c.b = value;
		material.SetColor(propertyName,c);
	}
	
	//#if !UNITY_FLASH
	@CutsceneActionAttribute("Set Channel A")
	//#endif
	function SetChannelA(value:float) {
		SetupMaterial();
		if (!material) return;
		if (!material.HasProperty(propertyName)) return;
		var c:Color = material.GetColor(propertyName);
		c.a = value;
		material.SetColor(propertyName,c);
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

