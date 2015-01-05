#pragma strict
var cutsceneName:String = "Cutscene01";
var triggerObject:GameObject;
var onceOnly:boolean = true;
var interactionKey:String = "";
@HideInInspector var playCount:int = 0;
@HideInInspector var cutscene:Cutscene;
@HideInInspector var keyPressed:boolean = false;

@script AddComponentMenu("Cutscene/Triggers/Trigger Cutscene")

function Update() {
	if (interactionKey != "") {
		if (Input.GetKeyDown(interactionKey)) {
			keyPressed = true;
		}
	}
}

function OnTriggerEnter(other:Collider) {
	keyPressed = false;
	if (interactionKey == "") {
		OnTrigger(other);
	}
}

function OnTriggerStay(other:Collider) {
	if (interactionKey != "") {
		if (keyPressed) {
			OnTrigger(other);
		}
		keyPressed = false;
	}
}

function OnTrigger(other:Collider) {
	if (onceOnly && playCount > 0) {
		return;
	}
	cutscene = Cutscene.Find(cutsceneName);
	if (triggerObject) {
		if (other.gameObject == triggerObject) {
			Play();
		}
	}
	else {
		Play();
	}
}

function Play() {
	if (!cutscene) return;
	cutscene.Play();
	playCount++;
}
