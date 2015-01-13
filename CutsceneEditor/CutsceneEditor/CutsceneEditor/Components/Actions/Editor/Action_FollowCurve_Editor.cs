using UnityEngine;

//#if UNITY_EDITOR
public class Action_FollowCurve_Editor : CutsceneActionEditor {
	
	public void OnCutsceneInspectorGUI() {
		curveClip.SetCustomProperty("overrideCurve",EditorGUILayout.ObjectField("Override Curve",curveClip.GetCustomProperty("overrideCurve"),Curve,true));
		curveClip.SetCustomProperty("overrideTarget",EditorGUILayout.ObjectField("Override Target",curveClip.GetCustomProperty("overrideTarget"),Transform,true));
	}
	
}
//#endif