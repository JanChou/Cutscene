#pragma strict

import System.Reflection;

@script AddComponentMenu("Cutscene/Events/Set Component Enabled State")

@CutsceneEventOverrideNameAttribute("Set Component Enabled State")

class Event_SetEnableState extends CutsceneEvent {
	var component:Component;
	
	function SetState(state:boolean) {
		if (!component) {
			Debug.Log("Warning: No component specified.");
			return;
		}
		if (!SetVar(component,"enabled",state)) {
			Debug.Log("Warning: tried to set enabled state on a component without an enabled variable.");
		}
	}
	
	function SetState(overrideComponent:Component, state:boolean) {
		if (!overrideComponent) {
			Debug.Log("Warning: No component specified.");
			return;
		}
		if (!SetVar(overrideComponent,"enabled",state)) {
			Debug.Log("Warning: tried to set enabled state on a component without an enabled variable.");
		}
	}
	
	/*
	@CutsceneEventExclude()
	function HasVar(c:Component,varName:String) {
		var fields:FieldInfo[] = c.GetType().GetFields();
		var props:PropertyInfo[] = c.GetType().GetProperties();
		for (field in fields) {
			if (field.Name == varName) return true;
		}
		for (prop in props) {
			if (prop.Name == varName) return true;
		}
		return false;
	}
	*/
	@CutsceneEventExclude()
	function SetVar(c:Component,varName:String, newValue:System.Object) {
		var field:FieldInfo = c.GetType().GetField(varName);
		var prop:PropertyInfo = c.GetType().GetProperty(varName);
		if (prop) {
			prop.SetValue(c,newValue,null);
			return true;
		}
		else if (field) {
			field.SetValue(c,newValue);
			return true;
		}
		return false;
	}
}

