#pragma strict

import System.Reflection;

var cutsceneName:String = "Cutscene01";
var playOnStart:boolean = false;
var loop:boolean = false;
var loopCount:int = 0;
var resetOnStop:boolean = false;
var resetPlayCountOnStop:boolean = true;
//var useEvalEvents:boolean = true;
var curves:CurveClip[] = [CurveClip()];
var events:EventClip[] = new EventClip[0];
var cutsceneEvents:CutsceneEventClip[];

@HideInInspector var startTime:float = 0.0;
@HideInInspector var playing:boolean = false;
@HideInInspector var playReverse:boolean = false;
@HideInInspector var finishedCurves:Array = new Array();
@HideInInspector var finishedEvents:Array = new Array();
@HideInInspector var finishedCutsceneEvents:Array = new Array();
@HideInInspector var totalPlays:int = 0;
@HideInInspector var doneStartReset:boolean = false;
//@HideInInspector var originalCam:Camera;

static var cameraCache:Array = new Array();

//static var builtinExpressionStr:String = "//Targeted GameObject\ntarget = Cutscene.evalObjectScope;\n//Interpolated value\nvalue = Cutscene.evalValue;";

//static var disableExecute:boolean = false;

static var functionNames:Array;
static var currentStaticClips:Array;
static var currentValues:Array;
static var timeIsOverClipValues:Array;
static var timeIsOverCurrentClip:boolean = false;

//static var evalObjectScope:GameObject;
//static var evalExpression:String;
//static var evalValue:float;
//static var evalComponent;
//static var evalArgs:Array = new Array();

@script AddComponentMenu("Cutscene/Cutscene")

@CutsceneEventExclude()
function Awake() {
	UpdateCutscene(0.0,false,false);
	UpdateCutscene(0.0,false,true);
}

@CutsceneEventExclude()
function Start() {
	Cutscene.cameraCache = FindObjectsOfType(Camera);
	DisableAllOverrideCameras();
	if (playOnStart) {
		Play();
	}
}

function DisableAllOverrideCameras() {
	for (var i:int = 0; i < curves.length; i++) {
		SetOverrideCameraState(curves[i],false);
	}
}

function SetOverrideCameraState(clip:CurveClip,state:boolean) {
		if (!clip.activeCamera) return;
		
		clip.activeCamera.enabled = state;
		if (state) {
			clip.activeCamera.depth = 10.0;
		}
		else {
			clip.activeCamera.depth = -10.0;
		}
}

@CutsceneEventExclude()
function FixUpdateMode() {
	for (var i:int = 0; i < curves.length; i++) {
		if (curves[i].updateEvent == "No Valid Events Found") {
			curves[i].updateMode = CutsceneClipUpdateMode.DirectVarAccess;
			continue;
		}
	}
}

@CutsceneEventExclude()
function Update() {
	if (!playing) return;
	var totalTime:float = GetTotalTime();
	if (Time.timeSinceLevelLoad > startTime+totalTime) {
		if (playReverse) {
			UpdateCutscene(0.0,true,false);
			UpdateCutscene(0.0,true,true);
			Stop();
		}
		else {
			UpdateCutscene(Time.timeSinceLevelLoad-startTime,true,false);
			UpdateCutscene(Time.timeSinceLevelLoad-startTime,true,true);
			playing = false;
			if (loop && (loopCount <= 0 || totalPlays < loopCount)) {
				Play();
				startTime += Time.deltaTime;
			}
			else {
				Stop();
			}
		}
	}
	else {
		if (playReverse) {
			UpdateCutscene(totalTime-(Time.timeSinceLevelLoad-startTime),true,false);
			UpdateCutscene(totalTime-(Time.timeSinceLevelLoad-startTime),true,true);
		}
		else {
			UpdateCutscene(Time.timeSinceLevelLoad-startTime,true,false);
			UpdateCutscene(Time.timeSinceLevelLoad-startTime,true,true);
		}
	}
}

@CutsceneEventExclude()
function UpdateCutscene(time:float, triggerEvents:boolean, onlyOverClip:boolean) {
	var currentClips:Array;
	var totalTime:float = GetTotalTime();
	currentClips = curves;
	
	functionNames = new Array();
	currentStaticClips = new Array();
	currentValues = new Array();
	timeIsOverClipValues = new Array();
	
	time = Mathf.Max(0.0,time);
	time = Mathf.Min(totalTime,time);
	if (time > totalTime) {
		Debug.Log("time > GetTotalTime()");
	}
	for (var i:int = 0; i < currentClips.length; i++) {
		var currentClip:CurveClip = currentClips[i] as CurveClip;
		if (!currentClip) continue;
		
		var isTimeOverClip:boolean = false;
		if (time >= currentClip.startTime && time < currentClip.startTime+currentClip.length) {
			isTimeOverClip = true;
		}
		
		//if (time > GetTotalTime() && currentClip.startTime+currentClip.length == GetTotalTime()) {
		//	isTimeOverClip = true;
		//}
		
		if (onlyOverClip && !isTimeOverClip) continue;
		
		//if (Application.isPlaying) {
		if (currentClip.activeCamera) {
			if (isTimeOverClip) {
				SetOverrideCameraState(currentClip,true);
			}
			else {
				SetOverrideCameraState(currentClip,false);
			}
		}
		//}
		
		var relativeClipTime:float = (time)-currentClip.startTime;
		var currentValue:float = currentClip.GetValue(relativeClipTime);
		//evalValue = value;
		
		if (currentClip.target) {
			if (!isTimeOverClip) {
				if (currentClip.activeCalculateOnly) {
					continue;
				}
			}
			//evalObjectScope = currentClip.target;
			if (currentClip.updateMode == CutsceneClipUpdateMode.Disable) {
				continue;
			}
			if (currentClip.updateMode == CutsceneClipUpdateMode.Action) {
				if (currentClip.updateEvent == "No Valid Events Found") {
					continue;
				}
				
				if (currentClip.targetAction && isTimeOverClip) {
					currentClip.targetAction.OnTimeOverCurveClip(currentClip);
				}
				var fName:String = currentClip.updateEvent;
				if (!Application.isPlaying) {
					if (onlyOverClip || currentClip.lastValue != currentValue) {
						functionNames.Add(fName);
						currentStaticClips.Add(currentClip);
						currentValues.Add(currentValue);
						timeIsOverClipValues.Add(isTimeOverClip);
					}
					currentClip.lastValue = currentValue;
				}
				else {
					timeIsOverCurrentClip = isTimeOverClip;
					if (onlyOverClip || currentClip.lastValue != currentValue) {
						currentClip.target.SendMessage(fName,currentValue,SendMessageOptions.DontRequireReceiver);
						if (currentClip.extraTargets) {
							for (at in currentClip.extraTargets) {
								if (!at) continue;
								at.SendMessage(fName,currentValue,SendMessageOptions.DontRequireReceiver);
							}
						}
					}
					currentClip.lastValue = currentValue;
					timeIsOverCurrentClip = false;
				}
			}
			else if (currentClip.updateMode == CutsceneClipUpdateMode.DirectVarAccess) {
				if (onlyOverClip || currentClip.lastValue != currentValue) {
					if (!SetDirectVarValue(currentClip,currentClip.targetComponent,currentValue)) {
						Debug.Log("Warning: Direct Variable Access failed in \""+currentClip.name+"\".");
					}
					
					if (currentClip.extraTargets) {
						for (at in currentClip.extraTargets) {
							if (!at) continue;
							SetDirectVarValue(currentClip,at,currentValue);
						}
						//evalObjectScope = currentClip.target;
					}
				}
				currentClip.lastValue = currentValue;
			}
			/*
			else if (currentClip.updateMode == CutsceneClipUpdateMode.CustomExpression) {
				if (onlyOverClip || currentClip.lastValue != value) {
					if (currentClip.expression != "") {
						var finalExpression = builtinExpressionStr+"\n\n"+currentClip.expression+"\nvar __DummyVar__ = true;\n";
						ExecuteExpression(finalExpression,"Cutscene CurveClip Error:");
						if (currentClip.extraTargets) {
							for (j = 0; j < currentClip.extraTargets.length; j++) {
								if (!currentClip.extraTargets[j]) continue;
								evalObjectScope = currentClip.extraTargets[j];
								ExecuteExpression(finalExpression,"Cutscene CurveClip ExtraTarget["+j+"] Error:");
							}
							evalObjectScope = currentClip.target;
						}
					}
				}
				currentClip.lastValue = value;
			}
			*/
		}
		else if (!currentClip.ignoreTarget){
			if (Application.isPlaying) {
				Debug.Log("Warning: Tried to play CurveClip "+currentClip.name+" that has no target set.");
			}
		}
	}
	
	if (!triggerEvents) return;
	
	var theseEvents:EventClip[] = (GetCurrentEvents(time).ToBuiltin(EventClip)) cast EventClip[];
	//Events
	
	if (events.length > 0) {
		//theseEvents = GetCurrentEvents(time);
		for (var e:EventClip in theseEvents) {
			if (e.target) {
				//var eventMessage:String = "";
				var method:MethodInfo = GetIndexedMethod(e.component,e.targetFunction,e.paramVariationIndex);
				if (method) {
					if (e.component != null) {
						var params:Object[] = new Object[e.params.length];
						for (var epi:int = 0; epi < e.params.length; epi++) {
							params[epi] = e.params[epi].GetValue();
						}
						method.Invoke(e.component,params);
					}
					else {
						Debug.Log("Warning: Event component is null!");
					}
				}
				else {
					Debug.Log("Warning: Event method not found!");
				}
			}
			else {
				Debug.Log("Warning: Tried to play event "+e.name+" that has no target set.");
			}
			finishedEvents.Remove(e);
			finishedEvents.Add(e);
		}
	}
	
}

function SetDirectVarValue(curveClip:CurveClip, baseObject:System.Object, newValue:float):boolean {
	var parts:String[] = curveClip.updateEvent.Split("."[0]);
	var finalPart:String = parts[parts.length-1];
	//var arr:System.Object[] = new System.Object[1];
	//arr[0] = 400.0;
	
	var lastObj:System.Object = baseObject;
	//Debug.Log(lastObj);
	var lastPart:String = "";
	var isRecognizedType:boolean = false;
	try {
		for (var i:int = 1; i < parts.length; i++) {
			var thisPart:String = parts[i];
			
			var newObj:System.Object = GetPropertyOrField(lastObj,thisPart);
			//return false;
			if (i < parts.Length-1) {
				
				if (newObj.GetType().ToString() == "UnityEngine.Vector2") {
					var newVector2:Vector2 = newObj cast Vector2;
					isRecognizedType = true;
					
					if (finalPart == "x") {
						newVector2.x = newValue;
					}
					if (finalPart == "y") {
						newVector2.y = newValue;
					}
					SetPropertyOrField(lastObj,thisPart,newVector2);
				}
				
				
				//Debug.Log(newObj.GetType().ToString());
				if (newObj.GetType().ToString() == "UnityEngine.Vector3") {
					
					var newVector3:Vector3 = newObj cast Vector3;
					isRecognizedType = true;
					
					if (finalPart == "x") {
						newVector3.x = newValue;
					}
					if (finalPart == "y") {
						newVector3.y = newValue;
					}
					if (finalPart == "z") {
						newVector3.z = newValue;
					}
					SetPropertyOrField(lastObj,thisPart,newVector3);
					
				}
				
				
				if (newObj.GetType().ToString() == "UnityEngine.Vector4") {
					var newVector4:Vector4 = newObj cast Vector4;
					isRecognizedType = true;
					
					if (finalPart == "x") {
						newVector4.x = newValue;
					}
					if (finalPart == "y") {
						newVector4.y = newValue;
					}
					if (finalPart == "z") {
						newVector4.z = newValue;
					}
					if (finalPart == "w") {
						newVector4.w = newValue;
					}
					SetPropertyOrField(lastObj,thisPart,newVector4);
				}
				if (newObj.GetType().ToString() == "UnityEngine.Rect") {
					var newRect:Rect = newObj cast Rect;
					isRecognizedType = true;
					
					if (finalPart == "x") {
						newRect.x = newValue;
					}
					if (finalPart == "y") {
						newRect.y = newValue;
					}
					if (finalPart == "width") {
						newRect.width = newValue;
					}
					if (finalPart == "height") {
						newRect.height = newValue;
					}
					SetPropertyOrField(lastObj,thisPart,newRect);
				}
				
				
				lastObj = newObj;
			}
			lastPart = parts[i];
			if (isRecognizedType) {
				break;
			}
		}
		if (!isRecognizedType) {
			SetPropertyOrField(lastObj,lastPart,newValue);
		}
	}
	catch(err:System.Exception) {
		return false;
	}
	return true;
}

@CutsceneEventExclude()
function GetPropertyOrField(containingObject:System.Object, propertyName:String):System.Object {
	if (containingObject == null) return null;
	
	var t:System.Type = containingObject.GetType();
	
	var tmpStr:String;
	var p:System.Reflection.PropertyInfo = t.GetProperty(propertyName+"asd");
	
	var hasProperty:boolean = false;
	var propertyInfos:System.Reflection.PropertyInfo[] = t.GetProperties();
	for (var prop:System.Reflection.PropertyInfo in propertyInfos) {
		if (prop.Name == propertyName) {
			hasProperty = true;
			break;
		}
	}
	
	
	if (hasProperty) {
		return t.InvokeMember(propertyName, BindingFlags.GetProperty, null, containingObject, null);
	}
	//return null;
	
	var f:System.Reflection.FieldInfo = t.GetField(propertyName);
	var hasField:boolean = false;
	var fieldInfos:System.Reflection.FieldInfo[] = t.GetFields();
	for (var field:System.Reflection.FieldInfo in fieldInfos) {
		if (field.Name == propertyName) {
			hasField = true;
			break;
		}
	}
	
	if (hasField) {
		return t.InvokeMember(propertyName, BindingFlags.GetField, null, containingObject, null);
	}
	return null;
}

@CutsceneEventExclude()
function SetPropertyOrField(containingObject:System.Object, propertyName:String, newValue:System.Object) {
	if (containingObject == null) return;
	var t:System.Type = containingObject.GetType();
	var tmpStr:String;
	var p:System.Reflection.PropertyInfo = t.GetProperty(propertyName);
	
	var hasProperty:boolean = false;
	var propertyInfos:System.Reflection.PropertyInfo[] = t.GetProperties();
	for (var prop:System.Reflection.PropertyInfo in propertyInfos) {
		if (prop.Name == propertyName) {
			hasProperty = true;
			break;
		}
	}
	if (hasProperty) {
		p.SetValue(containingObject,newValue, null);
		return;
	}
	
	var f:System.Reflection.FieldInfo = t.GetField(propertyName);
	var hasField:boolean = false;
	var fieldInfos:System.Reflection.FieldInfo[] = t.GetFields();
	for (var field:System.Reflection.FieldInfo in fieldInfos) {
		if (field.Name == propertyName) {
			hasField = true;
			break;
		}
	}
	if (hasField) {
		f.SetValue(containingObject,newValue);
	}
}

/*
@CutsceneEventExclude()
function AllocateCurveClipDirectVarExpression(c:CurveClip):String {
	if (c.updateEvent == "Select A Variable")
		return "";
	var firstDotIndex:int = c.updateEvent.IndexOf(".");
	if (firstDotIndex == -1) return "";
	var componentName:String = c.updateEvent.Substring(0,firstDotIndex);
	var trailingExpression:String = c.updateEvent.Substring(firstDotIndex);
	exp = "Cutscene.evalObjectScope.GetComponent(\""+componentName+"\")"+trailingExpression+" = Cutscene.evalValue;";
	return exp;
}
*/
/*
@CutsceneEventExclude()
function AllocateEventExpression(e:EventClip):String {
	if (!e) return;
	if (!e.component) return;
	evalComponent = e.component;
	evalArgs = new Array();
	for (epi = 0; epi < e.params.length; epi++) {
		evalArgs.Add(e.params[epi].GetValue());
	}
	var exp:String = "Cutscene.evalComponent."+e.targetFunction+"(";
	for (i = 0; i < evalArgs.length; i++) {
		exp += "Cutscene.evalArgs["+i+"]";
		if (i < evalArgs.length-1) {
			exp += ",";
		}
	}
	exp += ");";
	return exp;
}

@CutsceneEventExclude()
function PrecacheExpression(expression:String) {
	Cutscene.disableExecute = true;
	ExecuteExpression(expression,"Cutscene Precache Error:");
	Cutscene.disableExecute = false;
}


@CutsceneEventExclude()
function ExecuteExpression(expression:String,errorPrefix:String) {
	expression = "if (Cutscene.disableExecute) return;\n"+expression;
	try {
		eval(expression);
	} catch(err) {
		Debug.Log(expression);
		Debug.Log(errorPrefix+"\nExpression:\n"+expression+"\nError:\n"+err);
	}
}
*/

@CutsceneEventExclude()
function GetIndexedMethod(component,name:String,index:int):MethodInfo {
	var methodInfos:MethodInfo[] = typeof(component).GetMethods();
	var methods:Array = new Array();
	for (var i:int = 0; i < methodInfos.length; i++) {
		if (methodInfos[i].Name == name) {
			methods.Add(methodInfos[i]);
		}
	}
	if (index < 0 || index >= methods.length) {
		return null;
	}
	return methods[index] cast MethodInfo;
}


function Play() {
	if (playing) return;
	startTime = Time.timeSinceLevelLoad;
	playing = true;
	playReverse = false;
	finishedEvents = new Array();
	finishedCutsceneEvents = new Array();
	totalPlays++;
}

function Stop() {
	playing = false;
	playReverse = false;
	finishedEvents = new Array();
	if (resetPlayCountOnStop) {
		totalPlays = 0;
	}
	if (resetOnStop) {
		UpdateCutscene(0.0,false,false);
		UpdateCutscene(0.0,false,true);
	}
}

function Rewind() {
	var currentTime:float = Time.timeSinceLevelLoad-startTime;
	currentTime = Mathf.Max(0,Mathf.Min(currentTime,GetTotalTime()));
	
	Stop();
	Play();
	startTime -= GetTotalTime()-currentTime;
	playReverse = true;
	
	for (var i:int = 0; i < events.length; i++) {
		if (events[i].startTime > currentTime) {
			finishedEvents.Remove(events[i]);
			finishedEvents.Add(events[i]);
		}
	}
	
	if (Time.timeSinceLevelLoad-startTime >= GetTotalTime()) {
		UpdateCutscene(0.0,true,false);
		UpdateCutscene(0.0,true,true);
		Stop();
	}
}

@CutsceneEventExclude()
function GetTotalTime():float {
	var t:float = 0;
	for (c in curves) {
		if (t < c.startTime+c.length) {
			t = c.startTime+c.length;
		}
	}
	return t;
}

@CutsceneEventExclude()
function GetCurrentCurveClips(time:float):Array {
	var clips:Array = new Array();
	for (c in curves) {
		if (time >= c.startTime && time <= c.startTime+c.length) {
			clips.Add(c);
		}
	}
	return clips;
}

@CutsceneEventExclude()
function GetCurrentEvents(time:float):Array {
	var clips:Array = new Array();
	if (!playReverse) {
		for (var i:int = 0; i < events.length; i++) {
			if (time >= events[i].startTime) {
				if (!IsInArray(finishedEvents,events[i]))
					clips.Add(events[i]);
			}
		}
	}
	else {
		for (i = 0; i < events.length; i++) {
			if (time <= events[i].startTime) {
				if (!IsInArray(finishedEvents,events[i]))
					clips.Add(events[i]);
			}
		}
	}
	return clips;
}

@CutsceneEventExclude()
function GetCurrentCutsceneEvents(time:float):Array {
	var clips:Array = new Array();
	for (var i:int = 0; i < cutsceneEvents.length; i++) {
		if (time >= cutsceneEvents[i].startTime) {
			if (!IsInArray(finishedCutsceneEvents,cutsceneEvents[i]))
			clips.Add(cutsceneEvents[i]);
		}
	}
	return clips;
}

@CutsceneEventExclude()
function AddCurveClip(pos:int):CurveClip {
	pos = Mathf.Max(Mathf.Min(pos,curves.length),0);
	var tmp:Array = new Array();
	for (var i:int = 0; i < pos; i++) {
		tmp.Add(curves[i]);
	}
	var newClip:CurveClip = CurveClip();
	tmp.Add(newClip);
	for (i = pos; i < curves.length; i++) {
		tmp.Add(curves[i]);
	}
	curves = tmp.ToBuiltin(CurveClip) cast CurveClip[];
	newClip.Init();
	return newClip;
}
@CutsceneEventExclude()
function InsertCurveClip(pos:int, newClip:CurveClip):CurveClip {
	pos = Mathf.Max(Mathf.Min(pos,curves.length),0);
	var tmp:Array = new Array();
	for (var i:int = 0; i < pos; i++) {
		tmp.Add(curves[i]);
	}
	
	tmp.Add(newClip);
	for (i = pos; i < curves.length; i++) {
		tmp.Add(curves[i]);
	}
	curves = tmp.ToBuiltin(CurveClip) cast CurveClip[];
	newClip.Init();
	return newClip;
}

@CutsceneEventExclude()
function RemoveCurveClip(toRemove:CurveClip) {
	var tmp:Array = new Array();
	for (var i:int = 0; i < curves.length; i++) {
		if (curves[i] != toRemove) {
			tmp.Add(curves[i]);
		}
	}
	curves = tmp.ToBuiltin(CurveClip) cast CurveClip[];
}

@CutsceneEventExclude()
function AddEvent(newEvent:EventClip):EventClip {
	var tmp:Array = events;
	//for (i = 0; i < events.length; i++) {
	//	tmp.Add(events[i]);
	//}
	tmp.Add(newEvent);
	events = tmp.ToBuiltin(EventClip) cast EventClip[];
	return newEvent;
}

@CutsceneEventExclude()
function DeleteEvent(event:EventClip) {
	var tmp:Array = events;
	tmp.Remove(event);
	events = tmp.ToBuiltin(EventClip) cast EventClip[];
}

@CutsceneEventExclude()
static function BuiltinIndexOf(a:Array, value):int {
	for (var i:int = 0; i < a.length; i++) {
		if (a[i] == value) {
			return i;
		}
	}
	return -1;
}

@CutsceneEventExclude()
static function SetActiveCamera(cam:Camera) {
	
	//if (!cam) return;
	
	//for (c in cameraCache) {
	//	c.enabled = false;
	//}
	//cam.enabled = true;
}

@CutsceneEventExclude()
static function IsInArray(a:Array, v):boolean {
	for (i in a) {
		if (i == v) return true;
	}
	return false;
}

@CutsceneEventExclude()
static function FormatTime(time:float):String {
	var mins:int = Mathf.Floor(time/60.0);
	var seconds:int = Mathf.Repeat(time,60.0);
	var miliSeconds:int = Mathf.Repeat(time*100.0,100.0);
	var outString = "";
	if (mins < 10) outString += "0";
	outString += mins;
	outString += ":";
	if (seconds < 10) outString += "0";
	outString += seconds;
	outString += ":";
	if (miliSeconds < 10) outString += "0";
	outString += miliSeconds;
	return outString;
}

@CutsceneEventExclude()
static function Find(n:String):Cutscene {
	var cutscenes:Cutscene[] = FindObjectsOfType(Cutscene);
	var cutscene:Cutscene;
	for (var c:Cutscene in cutscenes) {
		if (c.cutsceneName == n) {
			cutscene = c;
		}
	}
	return cutscene;
}
