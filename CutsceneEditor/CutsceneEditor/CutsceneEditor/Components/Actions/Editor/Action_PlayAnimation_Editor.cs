using UnityEngine;

//#if UNITY_EDITOR
class Action_PlayAnimation_Editor : CutsceneActionEditor {
	
	public void OnCutsceneInspectorGUI() {
		curveClip.SetCustomProperty("overrideAnimation",EditorGUILayout.ObjectField("Override Animation",curveClip.GetCustomProperty("overrideAnimation"),AnimationClip,true));
	}
	
}
//#endif