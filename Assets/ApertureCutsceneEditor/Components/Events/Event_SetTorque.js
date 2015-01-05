#pragma strict
@script AddComponentMenu("Cutscene/Events/Set Torque")

@CutsceneEventOverrideNameAttribute("Set Torque")

class Event_SetTorque extends CutsceneEvent {
	
	function SetTorque(torque:Vector3) {
		if (!rigidbody) return;
		rigidbody.angularVelocity = torque;
	}
	
	function SetTorqueX(value:float) {
		if (!rigidbody) return;
		rigidbody.angularVelocity.x = value;
	}
	function SetTorqueY(value:float) {
		if (!rigidbody) return;
		rigidbody.angularVelocity.y = value;
	}
	function SetTorqueZ(value:float) {
		if (!rigidbody) return;
		rigidbody.angularVelocity.z = value;
	}
}

