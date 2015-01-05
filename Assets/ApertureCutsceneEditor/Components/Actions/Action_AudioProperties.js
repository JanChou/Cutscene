#pragma strict
@script AddComponentMenu("Cutscene/Actions/Audio Properties")

@script ExecuteInEditMode()

@CutsceneEventOverrideNameAttribute("Audio Properties")

class Action_AudioProperties extends CutsceneAction {
	
	//#if !UNITY_FLASH
	@CutsceneActionAttribute("Set Volume")
	//#endif
	function SetVolume(value:float) {
		if (!audio) return;
		audio.volume = value;
	}
	
	//#if !UNITY_FLASH
	@CutsceneActionAttribute("Set Pitch")
	//#endif
	function SetPitch(value:float) {
		if (!audio) return;
		audio.pitch = value;
	}
	
	//#if !UNITY_FLASH
	@CutsceneActionAttribute("Set Time")
	//#endif
	function SetTime(value:float) {
		if (!audio) return;
		audio.time = value;
	}
}

