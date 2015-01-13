using UnityEngine;

[AddComponentMenu("Cutscene/Actions/Particle Properties")]

[ExecuteInEditMode()]

[CutsceneEventOverrideNameAttribute("Particle Properties")]

class Action_ParticleProperties : CutsceneAction {
	
	//#if !UNITY_FLASH
	[CutsceneActionAttribute("Set Size Range Min")]
	//#endif
	public void SetSizeRangeMin(float value) {
		if (!particleEmitter) return;
		particleEmitter.minSize = value;
	}
	
	//#if !UNITY_FLASH
	[CutsceneActionAttribute("Set Size Range Max")]
	//#endif
	public void SetSizeRangeMax(float value){
		if (!particleEmitter) return;
		particleEmitter.maxSize = value;
	}
	
	//#if !UNITY_FLASH
	[CutsceneActionAttribute("Set Energy Range Min")]
	//#endif
	public void SetEnergyRangeMin(float value) {
		if (!particleEmitter) return;
		particleEmitter.minEnergy = value;
	}
	
	//#if !UNITY_FLASH
	[CutsceneActionAttribute("Set Energy Range Max")]
	//#endif
	public void SetEnergyRangeMax(float value) {
		if (!particleEmitter) return;
		particleEmitter.maxEnergy = value;
	}
	
	//#if !UNITY_FLASH
	[CutsceneActionAttribute("Set Emission Range Min")]
	//#endif
	public void SetEmissionRangeMin(float value) {
		if (!particleEmitter) return;
		particleEmitter.minEmission = value;
	}
	
	//#if !UNITY_FLASH
	[CutsceneActionAttribute("Set Emission Range Max")]
	//#endif
	public void SetEmissionRangeMax(float value) {
		if (!particleEmitter) return;
		particleEmitter.maxEmission = value;
	}
}

