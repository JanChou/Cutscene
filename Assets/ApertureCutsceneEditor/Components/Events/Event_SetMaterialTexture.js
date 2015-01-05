#pragma strict
@script AddComponentMenu("Cutscene/Events/Set Material Texture")

@CutsceneEventOverrideNameAttribute("Set Material Texture")

class Event_SetMaterialTexture extends CutsceneEvent {
	var useMaterialOnObject:boolean = true;
	var materialIndex:int = 0;
	var material:Material;
	var propertyName:String = "_MainTex";
	
	function SetTexture(texture:Texture) {
		SetupMaterial();
		if (!material) return;
		if (!material.HasProperty(propertyName)) return;
		material.SetTexture(propertyName,texture);
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

