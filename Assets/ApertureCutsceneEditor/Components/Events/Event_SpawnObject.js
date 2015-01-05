#pragma strict
@script AddComponentMenu("Cutscene/Events/Spawn Object")

@CutsceneEventOverrideNameAttribute("Spawn Object")

class Event_SpawnObject extends CutsceneEvent {
	var targetObject:GameObject;
	var spawnOnStart:boolean = false;
	
	@CutsceneEventExclude()
	function Start() {
		if (spawnOnStart) {
			Spawn();
		}
	}

	function Spawn() {
		var newObject:GameObject = Instantiate(targetObject,transform.position,transform.rotation);
	}
	function Spawn(overrideObject:GameObject) {
		var newObject:GameObject = Instantiate(overrideObject,transform.position,transform.rotation);
	}
}

