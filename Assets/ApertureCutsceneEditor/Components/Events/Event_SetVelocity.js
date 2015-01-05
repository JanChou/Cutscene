#pragma strict
@script AddComponentMenu("Cutscene/Events/Set Velocity")

@CutsceneEventOverrideNameAttribute("Set Velocity")

class Event_SetVelocity extends CutsceneEvent {
	
	function SetVelocity(velocity:Vector3) {
		if (!rigidbody) return;
		rigidbody.velocity = velocity;
	}
	
	function SetVelocityX(value:float) {
		if (!rigidbody) return;
		rigidbody.velocity.x = value;
	}
	function SetVelocityY(value:float) {
		if (!rigidbody) return;
		rigidbody.velocity.y = value;
	}
	function SetVelocityZ(value:float) {
		if (!rigidbody) return;
		rigidbody.velocity.z = value;
	}
}

