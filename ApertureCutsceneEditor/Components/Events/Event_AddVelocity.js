#pragma strict
@script AddComponentMenu("Cutscene/Events/Add Velocity")

@CutsceneEventOverrideNameAttribute("Add Velocity")

class Event_AddVelocity extends CutsceneEvent {
	
	function AddVelocity(velocity:Vector3) {
		if (!rigidbody) return;
		rigidbody.velocity += velocity;
	}
}

