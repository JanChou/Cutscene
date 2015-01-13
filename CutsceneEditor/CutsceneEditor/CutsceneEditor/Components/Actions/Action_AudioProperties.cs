using UnityEngine;

[AddComponentMenu("Cutscene/Actions/Audio Properties")]

[ExecuteInEditMode()]

[CutsceneEventOverrideNameAttribute("Audio Properties")]

class Action_AudioProperties : CutsceneAction {
	
	[CutsceneActionAttribute("Set Volume")]
	public void SetVolume(float value) {
		if (!audio) return;
		audio.volume = value;
	}
	
	[CutsceneActionAttribute("Set Pitch")]
	public void SetPitch(float value) {
		if (!audio) return;
		audio.pitch = value;
	}
	
	[CutsceneActionAttribute("Set Time")]
	public void SetTime(float value) {
		if (!audio) return;
		audio.time = value;
	}
}

