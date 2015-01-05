#pragma strict
@script AddComponentMenu("Cutscene/Actions/Particle Properties")

@script ExecuteInEditMode()

@CutsceneEventOverrideNameAttribute("Particle Properties")

class Action_ParticleProperties extends CutsceneAction {
	
	//#if !UNITY_FLASH
	@CutsceneActionAttribute("Set Size Range Min")
	//#endif
	function SetSizeRangeMin(value:float) {
		if (!particleEmitter) return;
		particleEmitter.minSize = value;
	}
	
	//#if !UNITY_FLASH
	@CutsceneActionAttribute("Set Size Range Max")
	//#endif
	function SetSizeRangeMax(value:float) {
		if (!particleEmitter) return;
		particleEmitter.maxSize = value;
	}
	
	//#if !UNITY_FLASH
	@CutsceneActionAttribute("Set Energy Range Min")
	//#endif
	function SetEnergyRangeMin(value:float) {
		if (!particleEmitter) return;
		particleEmitter.minEnergy = value;
	}
	
	//#if !UNITY_FLASH
	@CutsceneActionAttribute("Set Energy Range Max")
	//#endif
	function SetEnergyRangeMax(value:float) {
		if (!particleEmitter) return;
		particleEmitter.maxEnergy = value;
	}
	
	//#if !UNITY_FLASH
	@CutsceneActionAttribute("Set Emission Range Min")
	//#endif
	function SetEmissionRangeMin(value:float) {
		if (!particleEmitter) return;
		particleEmitter.minEmission = value;
	}
	
	//#if !UNITY_FLASH
	@CutsceneActionAttribute("Set Emission Range Max")
	//#endif
	function SetEmissionRangeMax(value:float) {
		if (!particleEmitter) return;
		particleEmitter.maxEmission = value;
	}
}

