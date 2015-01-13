#pragma strict
var cutsceneName:String = "Cutscene01";
var delay:float = 0;
@HideInInspector var cutscene:Cutscene;
@HideInInspector var playCount:int = 0;

@script AddComponentMenu("Cutscene/Triggers/Play On Start")

function Update() {
	if (playCount > 0) return;
	if (Time.time >= delay) {
		cutscene = Cutscene.Find(cutsceneName);
		Play();
	}
}

function Play() {
	if (!cutscene) return;
	cutscene.Play();
	playCount++;
}
