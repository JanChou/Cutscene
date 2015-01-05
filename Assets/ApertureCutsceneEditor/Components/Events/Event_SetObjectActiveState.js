#pragma strict
@script AddComponentMenu("Cutscene/Events/Set Object Active State")

@CutsceneEventOverrideNameAttribute("Set Object Active State")

class Event_SetObjectActiveState extends CutsceneEvent {
	
	function SetState(state:boolean) {
		gameObject.active = state;
	}
	
	function SetState(overrideObject:GameObject, state:boolean) {
		if (!overrideObject) return;
		overrideObject.active = state;
	}
}

