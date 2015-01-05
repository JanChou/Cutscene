#if UNITY_EDITOR
class Action_FollowCurve_Editor extends CutsceneActionEditor {
	
	function OnCutsceneInspectorGUI() {
		curveClip.SetCustomProperty("overrideCurve",EditorGUILayout.ObjectField("Override Curve",curveClip.GetCustomProperty("overrideCurve"),Curve,true));
		curveClip.SetCustomProperty("overrideTarget",EditorGUILayout.ObjectField("Override Target",curveClip.GetCustomProperty("overrideTarget"),Transform,true));
	}
	
}
#endif