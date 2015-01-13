using UnityEngine;

[AddComponentMenu("Cutscene/Actions/Screen Fade")]
[ExecuteInEditMode()]

[CutsceneEventOverrideNameAttribute("Screen Fade")]

class Action_ScreenFade : CutsceneAction {
	float fadeValue = 0;
	Color fadeColor = new Color(0,0,0,1f);
	[HideInInspector] Texture2D whiteTex;
	
	[CutsceneEventExclude()]
	public void OnGUI() {
		if (fadeValue <= 0) return;
		GUI.color = fadeColor;
		GUI.color.a = fadeValue;
		GUI.DrawTexture(new Rect(0,0,Screen.width,Screen.height),GetWhiteTex());
		GUI.color = new Color(1f,1f,1f,1f);
	}

	//#if !UNITY_FLASH
	[CutsceneActionAttribute("Set Fade Value")]
	//#endif
	public void SetFadeValue(float value) {
		fadeValue = value;
		//if in edit mode force an position update so that OnGUI gets called again.
		if (!Application.isPlaying) {
			Vector3 tmpPos = transform.localPosition;
			transform.localPosition = tmpPos;
		}
	}
	
	[CutsceneEventExclude()]
    public Texture2D GetWhiteTex()
    {
		if (!whiteTex) {
			whiteTex = new Texture2D(1,1);
			whiteTex.SetPixel(0,0, new Color(1f,1f,1f,1f));
			whiteTex.Apply();
			whiteTex.hideFlags = HideFlags.HideAndDontSave;
		}
		return whiteTex;
	}
}

