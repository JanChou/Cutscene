#if UNITY_EDITOR
import System.Reflection;

class APIAccess extends Object {
	static var monoFunctionExcludes:String[] = ["Main"];
	static var defaultFunctionExclusions:String[] = ["Update", "FixedUpdate", "LateUpdate", "Start", "Awake", "OnEnable", "OnDisable"];
	static var defaultEventFunctionExclusions:String[] = ["OnDrawGizmos","OnDrawGizmosSelected","Main","Update", "FixedUpdate", "LateUpdate", "Awake", "OnEnable", "OnDisable"];
	static var defaultVarExclusions:String[] = [""];
	
	
	static function FindComponents(evtSource:GameObject):Array {
		var components:Array = evtSource.GetComponents(Component);
		var names:Array = new Array();
		for (i = 0 ; i < components.length; i++) {
			//var componentType:System.Type = components[i].GetType();
			names.Add(GetEventComponentName(components[i]));
		}
		var returnArray:Array = new Array();
		returnArray.Add(names);
		returnArray.Add(components);
		return returnArray;
	}
	
	static function GetEventComponentName(component:Component):String {
		var myAttributes:Object[] = component.GetType().GetCustomAttributes(false);
		var hasAttrib:boolean = false;
		for(j = 0; j < myAttributes.length; j++) {
			if (myAttributes[j].GetType() == typeof(CutsceneEventOverrideNameAttribute)) {
				hasAttrib = true;
				return myAttributes[j].overrideName;
			}
		}
		return component.GetType().Name;
	}
	
	static function FindEventFunctionsInComponent(component:Component,typeFilter:String[]):Array {
		var cType:System.Type = component.GetType();
		var functions:MethodInfo[] = cType.GetMethods();
		var names:Array = new Array();
		for (i = 0 ; i < functions.length; i++) {
			var myAttributes:Object[] = functions[i].GetCustomAttributes(false);
			var hasExclude:boolean = false;
			for(j = 0; j < myAttributes.length; j++) {
				if (myAttributes[j].GetType() == typeof(CutsceneEventExcludeAttribute)) {
					hasExclude = true;
				}
			}
			if (hasExclude) continue;
			
			if (functions[i].DeclaringType.IsAssignableFrom(typeof(MonoBehaviour))) continue;
			if (functions[i].Name.Substring(0,1) == functions[i].Name.ToLower().Substring(0,1)) continue;
			if (System.Array.IndexOf(monoFunctionExcludes,functions[i].Name) != -1) continue;
			names.Add(functions[i].Name);
		}
		return names;
	}
	
	static function FindFunctionParams(component:Component,functionName:String):Array {
		//try {
			var cType:System.Type = component.GetType();
			var funcs:MethodInfo[] = cType.GetMethods();
			var funcVariations:Array = new Array();
			for (i in funcs) {
				if (i.Name == functionName) funcVariations.Add(i);
			}
		//}
		//catch(err) {
		//	return Array();
		//}
		//if (!func) return new ParameterInfo[0];
		var paramVariations:Array = new Array();
		for (i = 0; i < funcVariations.length; i++) {
			var params:ParameterInfo[] = funcVariations[i].GetParameters();
			paramVariations.Add(params);
		}
		return paramVariations;
		//var names:Array = new Array();
		//for (i = 0 ; i < params.length; i++) {
		//	names.Add(params);
		//}
		//return names;
	}
	
	//Thanks to Kieran Lord for this! (http://www.cratesmith.com/archives/221)
	static function FindActionFunctionNames(evtSource:GameObject,eventNameExclusions:String[],includeConstructors:boolean):Array {
		var eventStrings:Array = new Array();
		var friendlyNames:Array = new Array();
		var actionClass:Array = new Array();
		if (eventNameExclusions.length == 0 && eventNameExclusions[0] == "?")
			eventNameExclusions = defaultFunctionExclusions;
		var behaviours:Array = evtSource.GetComponents(CutsceneAction);
		for (behavior in behaviours) {
			var behaviorType:System.Type = behavior.GetType();
			var methods:MethodInfo[] = behaviorType.GetMethods();
			for (method in methods) {
			
				// events are currently restrected to public, zero parameter functions, that aren't constructors
				if((!includeConstructors && method.IsConstructor) || !method.IsPublic)
					continue;
				// return type void only
				if(method.ReturnType != typeof(void))
					continue;
				// don't allow unity callbacks to be used as events (Update, Awake, etc)
				if(System.Array.IndexOf(eventNameExclusions, method.Name)!=-1)
					continue;
				// don't have duplicates in the list
				var found:boolean = false;
				for (es in eventStrings) {
					if (es == method.Name) {
						found = true;
						break;
					}
				}
				if(found)
					continue;
					
                var myAttributes:Object[] = method.GetCustomAttributes(false);
				var hasAttrib:boolean = false;
                for(j = 0; j < myAttributes.length; j++) {
                    if (myAttributes[j].GetType() == typeof(CutsceneActionAttribute)) {
						hasAttrib = true;
						friendlyNames.Add(myAttributes[j].attributeName);
					}
				}
				if (!hasAttrib)
					continue;
				
				eventStrings.Add(method.Name);
				actionClass.Add(behavior);
			}
		}
		var returnArray:Array = new Array();
		returnArray.Add(eventStrings);
		returnArray.Add(friendlyNames);
		returnArray.Add(actionClass);
		return returnArray;
	}
	
	static function FindFloatVarNames(evtSource:GameObject,component:Component,eventNameExclusions:String[],includeChildren:boolean):Array {
		var eventStrings:Array = new Array();
		var components:Array = new Array();
		if (eventNameExclusions.length == 0 && eventNameExclusions[0] == "?")
			eventNameExclusions = defaultVarExclusions;
		var behaviours:Array;
		if (component)
			behaviours = Array(component);
		else {
			behaviours = evtSource.GetComponents(MonoBehaviour);
			behaviours = behaviours.Concat(evtSource.GetComponents(Component));
		}
		
		for (behavior in behaviours) {
			var behaviorType:System.Type = behavior.GetType();
			var fields:FieldInfo[] = behaviorType.GetFields();
			var props:PropertyInfo[] = behaviorType.GetProperties();

			for (field in fields) {
				if(System.Array.IndexOf(eventNameExclusions, field.Name)!=-1)
					continue;
				if (!field.IsPublic) continue;
				var fieldStrs:Array = new Array();
				if (field.FieldType == Vector2) {
					fieldStrs.Add(behaviorType.Name+"."+field.Name+".x");
					fieldStrs.Add(behaviorType.Name+"."+field.Name+".y");
					fieldStrs.Add(behaviorType.Name+"."+field.Name+".z");
				}
				if (field.FieldType == Vector3) {
					fieldStrs.Add(behaviorType.Name+"."+field.Name+".x");
					fieldStrs.Add(behaviorType.Name+"."+field.Name+".y");
					fieldStrs.Add(behaviorType.Name+"."+field.Name+".z");
				}
				if (field.FieldType == Vector4) {
					fieldStrs.Add(behaviorType.Name+"."+field.Name+".x");
					fieldStrs.Add(behaviorType.Name+"."+field.Name+".y");
					fieldStrs.Add(behaviorType.Name+"."+field.Name+".z");
					fieldStrs.Add(behaviorType.Name+"."+field.Name+".w");
				}
				if (field.FieldType == Rect) {
					fieldStrs.Add(behaviorType.Name+"."+field.Name+".x");
					fieldStrs.Add(behaviorType.Name+"."+field.Name+".y");
					fieldStrs.Add(behaviorType.Name+"."+field.Name+".width");
					fieldStrs.Add(behaviorType.Name+"."+field.Name+".height");
				}
				if (field.FieldType == float) {
					fieldStrs.Add(behaviorType.Name+"."+field.Name);
				}
				for (s in fieldStrs) {
					eventStrings.Add(s);
					components.Add(behavior);
				}
			}
			
			for (prop in props) {
				if(System.Array.IndexOf(eventNameExclusions, prop.Name)!=-1)
					continue;
				if (!prop.CanWrite) continue;
				var propStrs:Array = new Array();
				if (prop.PropertyType == Vector2) {
					propStrs.Add(behaviorType.Name+"."+prop.Name+".x");
					propStrs.Add(behaviorType.Name+"."+prop.Name+".y");
					propStrs.Add(behaviorType.Name+"."+prop.Name+".z");
				}
				if (prop.PropertyType == Vector3) {
					propStrs.Add(behaviorType.Name+"."+prop.Name+".x");
					propStrs.Add(behaviorType.Name+"."+prop.Name+".y");
					propStrs.Add(behaviorType.Name+"."+prop.Name+".z");
				}
				if (prop.PropertyType == Vector4) {
					propStrs.Add(behaviorType.Name+"."+prop.Name+".x");
					propStrs.Add(behaviorType.Name+"."+prop.Name+".y");
					propStrs.Add(behaviorType.Name+"."+prop.Name+".z");
					propStrs.Add(behaviorType.Name+"."+prop.Name+".w");
				}
				if (prop.PropertyType == Rect) {
					propStrs.Add(behaviorType.Name+"."+prop.Name+".x");
					propStrs.Add(behaviorType.Name+"."+prop.Name+".y");
					propStrs.Add(behaviorType.Name+"."+prop.Name+".width");
					propStrs.Add(behaviorType.Name+"."+prop.Name+".height");
				}
				if (prop.PropertyType == float) {
					propStrs.Add(behaviorType.Name+"."+prop.Name);
				}
				for (s in propStrs) {
					eventStrings.Add(s);
					components.Add(behavior);
				}
			}
		}

		return new Array(eventStrings,components);
	}
	
	static function GetProperty(containingObject, propertyName:String):System.Object {
		//return containingObject.GetType().GetMember(propertyName);
	    return containingObject.GetType().InvokeMember(propertyName, BindingFlags.GetProperty, null, containingObject, null);
	}
 
	static function SetProperty(containingObject:System.Object, propertyName:String, newValue:System.Object) {
	    containingObject.GetType().InvokeMember(propertyName, BindingFlags.SetProperty, null, containingObject, new System.Object [ newValue ]);
	}
	

	
}
#endif
