#pragma strict
@script AddComponentMenu("Cutscene/Actions/Screen Fade")

@script ExecuteInEditMode()

@CutsceneEventOverrideNameAttribute("Screen Fade")

class Action_ScreenFade extends CutsceneAction {
	var fadeValue:float = 0.0;
	var fadeColor:Color = Color(0,0,0,1);
	@HideInInspector var whiteTex:Texture2D;
	
	@CutsceneEventExclude()
	function OnGUI() {
		if (fadeValue <= 0.0) return;
		GUI.color = fadeColor;
		GUI.color.a = fadeValue;
		GUI.DrawTexture(Rect(0,0,Screen.width,Screen.height),GetWhiteTex());
		GUI.color = Color(1,1,1,1);
	}

	//#if !UNITY_FLASH
	@CutsceneActionAttribute("Set Fade Value")
	//#endif
	function SetFadeValue(value:float) {
		fadeValue = value;
		//if in edit mode force an position update so that OnGUI gets called again.
		if (!Application.isPlaying) {
			var tmpPos:Vector3 = transform.localPosition;
			transform.localPosition = tmpPos;
		}
	}
	
	@CutsceneEventExclude()
	function GetWhiteTex() {
		if (!whiteTex) {
			whiteTex = Texture2D(1,1);
			whiteTex.SetPixel(0,0,Color(1,1,1,1));
			whiteTex.Apply();
			whiteTex.hideFlags = HideFlags.HideAndDontSave;
		}
		return whiteTex;
	}
}

