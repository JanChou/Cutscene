#pragma strict
@script AddComponentMenu("Cutscene/Events/Add Torque")

@CutsceneEventOverrideNameAttribute("Add Torque")

class Event_AddTorque extends CutsceneEvent {
	
	function AddTorque(torque:Vector3) {
		if (!rigidbody) return;
		rigidbody.angularVelocity += torque;
	}
}

