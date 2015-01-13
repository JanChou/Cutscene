#pragma strict
@script AddComponentMenu("Cutscene/Events/Load Level")

@CutsceneEventOverrideNameAttribute("Load Level")

class Event_LoadLevel extends CutsceneEvent {
	
	function LoadLevel(levelName:String) {
		Application.LoadLevel(levelName);
	}
	
	function LoadLevel(levelIndex:int) {
		Application.LoadLevel(levelIndex);
	}
}

