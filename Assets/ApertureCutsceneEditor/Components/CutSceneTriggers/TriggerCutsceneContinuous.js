#pragma strict
var cutsceneName:String = "Cutscene01";
var triggerObject:GameObject;
@HideInInspector var cutscene:Cutscene;

@script AddComponentMenu("Cutscene/Triggers/Trigger Cutscene Continuous")

function OnTriggerEnter(other:Collider) {
	Play();
}

function OnTriggerExit(other:Collider) {
	Rewind();
}


function Play() {
	cutscene = Cutscene.Find(cutsceneName);
	if (!cutscene) return;
	
	var wasPlaying:boolean = cutscene.playing;
	
	var currentTime:float = Time.timeSinceLevelLoad-cutscene.startTime;
	currentTime = Mathf.Max(0.0,Mathf.Min(currentTime,cutscene.GetTotalTime()));
	
	if (wasPlaying) {
		cutscene.Stop();
	}
	cutscene.Play();
	
	if (wasPlaying) {
		cutscene.startTime -= cutscene.GetTotalTime()-currentTime;
		for (var i:int = 0; i < cutscene.events.length; i++) {
			if (cutscene.events[i].startTime < currentTime) {
				cutscene.finishedEvents.Remove(cutscene.events[i]);
				cutscene.finishedEvents.Add(cutscene.events[i]);
			}
		}
	}
}

function Rewind() {
	cutscene = Cutscene.Find(cutsceneName);
	if (!cutscene) return;
	cutscene.Rewind();
}
