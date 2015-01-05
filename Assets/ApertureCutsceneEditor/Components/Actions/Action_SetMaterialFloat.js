#pragma strict
@script AddComponentMenu("Cutscene/Actions/Set Material Float")

@script ExecuteInEditMode()

@CutsceneEventOverrideNameAttribute("Set Material Float")

class Action_SetMaterialFloat extends CutsceneAction {
	var useMaterialOnObject:boolean = true;
	var materialIndex:int = 0;
	var material:Material;
	var propertyName:String = "_MyFloat";
	
	//#if !UNITY_FLASH
	@CutsceneActionAttribute("Set Float")
	//#endif
	function SetFloat(value:float) {
		SetupMaterial();
		if (!material) return;
		if (!material.HasProperty(propertyName)) return;
		material.SetFloat(propertyName,value);
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

