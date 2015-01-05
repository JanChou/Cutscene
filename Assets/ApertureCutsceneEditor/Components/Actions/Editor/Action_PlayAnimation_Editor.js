#if UNITY_EDITOR
class Action_PlayAnimation_Editor extends CutsceneActionEditor {
	
	function OnCutsceneInspectorGUI() {
		curveClip.SetCustomProperty("overrideAnimation",EditorGUILayout.ObjectField("Override Animation",curveClip.GetCustomProperty("overrideAnimation"),AnimationClip,true));
	}
	
}
#endif