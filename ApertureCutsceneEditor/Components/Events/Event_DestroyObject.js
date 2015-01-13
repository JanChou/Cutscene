#pragma strict
@script AddComponentMenu("Cutscene/Events/Destroy Object")

@CutsceneEventOverrideNameAttribute("Destroy Object")

class Event_DestroyObject extends CutsceneEvent {
	
	function DestroyObject(keepChildren:boolean) {
		if (keepChildren) {
			transform.DetachChildren();
		}
		Destroy(gameObject);
	}
	
}

