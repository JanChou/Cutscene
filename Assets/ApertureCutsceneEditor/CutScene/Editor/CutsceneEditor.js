#if UNITY_EDITOR
class CutsceneEditor extends EditorWindow {
static var current:CutsceneEditor;
var skin:GUISkin;
var keyTex:Texture2D;
var timeMarkerArrowTex:Texture2D;
var previewButtonTex:Texture2D;
var moveClipUpTex:Texture2D;
var moveClipDownTex:Texture2D;
var scrollPosition:Vector2;
var inspectorScrollPosition:Vector2;
static var cutscene:Cutscene;
static var zoom:float = 50.0;
var selectedClip;
var inspectorWidth:float = 300.0;
var lastIsPlaying:boolean = false;
var quitting = false;
var currentTime:float = 0.0;
var lastTime:float = -Mathf.Infinity;
static var activeName:String = "";
var toolState:String = "none";
var selectedKeyframeIndex:int = -1;

var curveClipHeight:float = 20.0;
var clipColor:Color = Color(0.4,0.45,0.5,1);
var clipErrorColor:Color = Color(1.0,0.5,0.5,1);

var clickTime:double = 0.0;
var doubleClickTime:double = 0.3;
var lastClickPos:Vector2;

var whiteTex:Texture2D;

var toolbarInt : int = 0;
var toolbarStrings:String[] = ["Cutscene List","Inspector","Cutscene"];

var currentEventSelectionIndex:int = 0;


var mouseDownPos:Vector2;
var mouseButton0:boolean = false;
var mouseButton1:boolean = false;
var mouseButton2:boolean = false;

var draggingPos:float = 0.0;
var draggingOffset:float = 0.0;
var isDragging:boolean = false;
var isDraggingCurveClip:boolean = false;
var clickedCurveKey:boolean = false;

var curveOverlayRect:Rect;

var currentGridIndex:int= 2;
var gridValues:float[] = [0.0,0.05,0.1,0.2,0.5,1.0];
var gridNames:String[] = ["Off","00:00:05","00:00:10","00:00:20","00:00:50","00:01:00"];

var clipColors:Color[] = [Color(0.4,0.45,0.6,1),Color(0.4,0.7,0.4,1),Color(1.0,0.5,0.3,1)];
var clipColorNames:String[] = ["Blue","Green","Orange"];

var isPreviewing:boolean = false;
var lastSystemTime:float = 0.0;

	
@MenuItem ("Window/Aperture Cutscene Editor")
static function Init() {
	current = EditorWindow.GetWindow(CutsceneEditor,false, "Aperture");
	current.GetWhiteTex();
	current.lastIsPlaying = Application.isPlaying;
	current.curveOverlayRect = Rect(0,0,0,0);
}

@MenuItem ("CONTEXT/CutsceneEditor/Curves/Add New Curve Track")
static function CMDAddCurve() {
	current.AddCurve();
}

@MenuItem ("CONTEXT/CutsceneEditor/Curves/Delete Curve Track")
static function CMDDeleteCurve() {
	current.DeleteCurve();
}
@MenuItem ("CONTEXT/CutsceneEditor/Curves/Delete Curve Track",true)
static function CMDValDeleteCurve() {
	return (current.selectedClip instanceof CurveClip);
}


function OnDestroy() {
	if (whiteTex) DestroyImmediate(whiteTex);
	ResetAllCutscenes();
}

function ResetAllCutscenes() {
	var cutscenes:Array = FindObjectsOfType(Cutscene);
	for (c in cutscenes) {
		EvalCutsceneAtTime(c,0.0);
		c.DisableAllOverrideCameras();
	}
}

function EvalCutsceneAtTime(c:Cutscene,time:float) {
	for (sampleCounter = 0; sampleCounter < 2; sampleCounter++) {
		if (sampleCounter == 0) {
			c.UpdateCutscene(time,false,false);
		}
		else {
			c.UpdateCutscene(time,false,true);
		}
		for (i = 0; i < Cutscene.currentStaticClips.length; i++) {
			Cutscene.timeIsOverCurrentClip = Cutscene.timeIsOverClipValues[i];
			Cutscene.currentStaticClips[i].target.SendMessage(Cutscene.functionNames[i],Cutscene.currentValues[i],SendMessageOptions.DontRequireReceiver);
			if (Cutscene.currentStaticClips[i].extraTargets) {
				for (at in Cutscene.currentStaticClips[i].extraTargets) {
					if (!at) continue;
					at.SendMessage(Cutscene.functionNames[i],Cutscene.currentValues[i],SendMessageOptions.DontRequireReceiver);
				}
			}
		}
	}
}

function Update() {
	//Handle preview play
	if (!Application.isPlaying && isPreviewing) {
		if (cutscene) {
			currentTime += Time.realtimeSinceStartup-lastSystemTime;
			if (currentTime > cutscene.GetTotalTime()) {
				currentTime = 0.0;
				isPreviewing = false;
			}
		}
		else {
			isPreviewing = false;
		}
	}
	
	if (!Application.isPlaying) {
		if (cutscene)
			cutscene.FixUpdateMode();
		if (cutscene && (mouseButton0 || currentTime != lastTime)) {
			EvalCutsceneAtTime(cutscene,currentTime);
			lastTime = currentTime;
			Repaint();
		}
	}
	if (Application.isPlaying) {
		var c:GUIContent = GUIContent("Playing");
		ShowNotification(c);
		if (!lastIsPlaying) {
			Repaint();
		}
	}
	else {
		if (lastIsPlaying) {
			RemoveNotification();
			Repaint();
		}
	}
	lastIsPlaying = Application.isPlaying;
	
	lastSystemTime = Time.realtimeSinceStartup;
}

function OnGUI () {
	if (Application.isPlaying) {
		return;
	}
	if (!current) {
		current = this;
	}
	if (position.width < 650) {
		position.width = 650;
	}
	if (position.height < 200) {
		position.height = 200;
	}
	
	wantsMouseMove  = true;
	if (Event.current.type == EventType.MouseMove) {
		Repaint();
	}
	
	if (!cutscene) GetCutsceneControl();
	if (!cutscene) {
		var c:GUIContent = GUIContent("There are no cutscenes in the current scene. To add a cutscene create an empty GameObject and assign a Cutscene component to it. The component is located at Component>Cutscene>Cutscene.");
		ShowNotification(c);
		if (GUI.Button(Rect(position.width*0.5-170*0.5,position.height-22,170,20),"Or add one automatically")) {
			CreateNewCutscene();
		}
		return;
	}
	RemoveNotification();
	
	var event:Event = Event.current;
	var mousePos = event.mousePosition;
	var mouseButtonDown0:boolean = false;
	var mouseButtonDown1:boolean = false;
	var mouseButtonDown2:boolean = false;
	var mouseButtonUp0:boolean = false;
	var mouseButtonUp1:boolean = false;
	var doubleClick:boolean = false;
	if (event.isMouse) {
		if (event.type == EventType.MouseDown) {
			mouseDownPos = mousePos;
			if (event.button == 0) {
				mouseButton0 = true;
				mouseButtonDown0 = true;
				if ((EditorApplication.timeSinceStartup - clickTime) < doubleClickTime) {
					if (Vector2.Distance(lastClickPos,mousePos) < 3.0) {
						doubleClick = true;
					}
				}
				clickTime = EditorApplication.timeSinceStartup;
			}
			if (event.button == 1) {
				mouseButton1 = true;
				mouseButtonDown1 = true;
			}
			if (event.button == 2) {
				mouseButton2 = true;
				mouseButtonDown2 = true;
			}
			lastClickPos = mousePos;
		}
		else if (event.type == EventType.MouseUp) {
			if (event.button == 0) mouseButton0 = false;
			if (event.button == 1) mouseButton1 = false;
			if (event.button == 2) mouseButton2 = false;
			
			if (event.button == 0) mouseButtonUp0 = true;
			if (event.button == 1) mouseButtonUp1 = true;
			isDragging = false;
			clickedCurveKey = false;
			isDraggingCurveClip = false;
		}
	}
	
	
	var addedAKey:boolean = false;
	
	GUI.SetNextControlName ("Editor");
	
	
	GUI.Box(Rect(0,0,position.width,18),"",EditorStyles.toolbar);
	zoom = GUI.HorizontalSlider(Rect(5,0,120,18), zoom, 200.0, 1.0);
	
	//Preview
	if (isPreviewing) GUI.color = Color(0.75,0.75,0.75,1.0);
	if (GUI.Button(Rect(130,0,30,18),previewButtonTex,EditorStyles.toolbarButton)) {
		isPreviewing = !isPreviewing;
	}
	GUI.color = Color(1.0,1.0,1.0,1.0);
	
	if (GUI.Button(Rect(130+30,0,80,18),"Curve Track...",EditorStyles.toolbarDropDown)) {
		EditorUtility.DisplayPopupMenu(Rect(mousePos.x,mousePos.y,0,0), "CONTEXT/CutsceneEditor/Curves/", null);
	}
	//if (GUI.Button(Rect(195,0,60,18),"Events...",EditorStyles.toolbarDropDown)) {
	//	EditorUtility.DisplayPopupMenu(Rect(mousePos.x,mousePos.y,0,0), "CONTEXT/CutsceneEditor/Curves/", null);
	//}
	
	if (toolState == "drawkeys") GUI.color = Color(0.75,0.75,0.75,1.0);
	if (GUI.Button(Rect(210+30,0,70,18),"Add Keys",EditorStyles.toolbarButton)) {
		if (toolState == "drawkeys") toolState = "none";
		else toolState = "drawkeys";
	}
	GUI.color = Color(1.0,1.0,1.0,1.0);
	
	if (toolState == "drawevents") GUI.color = Color(0.75,0.75,0.75,1.0);
	if (GUI.Button(Rect(280+30,0,70,18),"Add Events",EditorStyles.toolbarButton)) {
		if (toolState == "drawevents") toolState = "none";
		else toolState = "drawevents";
	}
	GUI.color = Color(1.0,1.0,1.0,1.0);
	
	
	//Handle event selection dropdown.
	if (!(selectedClip instanceof EventClip)) {
		currentEventSelectionIndex = 0;
	}
	var list:String[] = new String[cutscene.events.length+1];
	list[0] = "Select Event";
	var selEvent:int = -1;
	for (i = 0; i < cutscene.events.length; i++) {
		
		if (selectedClip == cutscene.events[i]) {
			selEvent = i;
		}
		var currentEventSelectionNewName:String = "";
		currentEventSelectionNewName = Cutscene.FormatTime(cutscene.events[i].startTime)+" - "+cutscene.events[i].name;
		list[i+1] = currentEventSelectionNewName;
	}
	if (selEvent != -1) {
		currentEventSelectionIndex = selEvent+1;
	}
	var oldEventIndex = currentEventSelectionIndex;
	currentEventSelectionIndex = EditorGUI.Popup(Rect(310+70,0,125, 20),"",currentEventSelectionIndex,list,EditorStyles.toolbarPopup);
	if  (oldEventIndex != currentEventSelectionIndex) {
		if (currentEventSelectionIndex > 0) {
			selectedClip = cutscene.events[currentEventSelectionIndex-1];
			toolbarInt = 1;
			currentTime = selectedClip.startTime;
		}
		else {
			selectedClip = null;
		}
	}
	
	//Help
	if (GUI.Button(Rect(position.width-35,0,35, 20),"Help",EditorStyles.toolbarButton)) {
		Application.OpenURL("http://www.aperturecutscene.com");
	}
	
	//Snap settings
	GUI.Label(Rect(position.width-70-35-5-35,0,35, 20),"Snap:");
	currentGridIndex = EditorGUI.Popup(Rect(position.width-70-35-5,0,70, 20),currentGridIndex,gridNames,EditorStyles.toolbarPopup);
	var currentGrid:float = gridValues[currentGridIndex];
	
	if (mouseButtonDown1) {
		toolState = "none";
		Repaint();
	}
	var pressedDelete:boolean = false;
	if (event.type == EventType.ValidateCommand) {
		if (event.commandName == "Delete") {
			pressedDelete = true;
		}
		if (Application.platform == RuntimePlatform.WindowsEditor) {
			if (event.commandName == "SoftDelete") {
				pressedDelete = true;
			}
		}
	}
	if (pressedDelete) {
		if (GUI.GetNameOfFocusedControl () == "Editor") {
			if (selectedClip instanceof CurveClip) {
				if (selectedKeyframeIndex == -1)
				CMDDeleteCurve();
				else {
					DeleteCurveKey();
					Repaint();
					return;
				}
			}
			//else if (selectedClip instanceof CurveClipKey) {
			//	DeleteCurveKey();
			//}
			else if (selectedClip instanceof EventClip) {
				DeleteEvent(selectedClip);
			}
			Repaint();
		}
		event.Use();
	}
	
	var oldToolbarInt:int = toolbarInt;
	toolbarInt = GUI.Toolbar (Rect (position.width-inspectorWidth, 18, inspectorWidth, 20), toolbarInt, toolbarStrings);
	if (oldToolbarInt != toolbarInt) {
		Repaint();
	}
	
	if (!cutscene) return;
	if (!cutscene.curves) cutscene.curves = new CurveClip[0];
	if (!cutscene.events) cutscene.events = new EventClip[0];
	if (!cutscene.cutsceneEvents) cutscene.cutsceneEvents = new CutsceneEventClip[0];
	
	//Base Colors
	GUI.color = Color(0.0,0.0,0.0,0.25);
	GUI.DrawTexture(Rect(0,18,100,position.height),GetWhiteTex());
	GUI.color = Color(1,1,1,1);
	
	GUI.color = Color(1.0,1.0,1.0,0.025);
	GUI.DrawTexture(Rect(100,18,position.width-100-inspectorWidth,position.height),GetWhiteTex());
	GUI.color = Color(1,1,1,1);
	
	var timelineRect:Rect = Rect(100,18,position.width-100-inspectorWidth-14,position.height-18);
	
	var rect:Rect = Rect(0,0,0,0);
	rect.x = 100.0;
	rect.y = 18;
	rect.width = position.width-inspectorWidth-rect.x;
	rect.height = 20;
	
	var workAreaMousePos:Vector2 = mousePos;
	workAreaMousePos.x -= rect.x;
	workAreaMousePos.y -= rect.y;
	var workAreaAbsMousePos:Vector2 = workAreaMousePos;
	workAreaAbsMousePos.x /= zoom;
	workAreaAbsMousePos.x += scrollPosition.x/zoom;
	
	//Do Timeline here
	
	rect.y += 20;
	rect.height = curveClipHeight;
	//Do Event track here
	
	rect.y += curveClipHeight;
	rect.width = position.width-inspectorWidth-rect.x;
	rect.height = position.height-rect.y;
	
	var workAreaWithoutScroll:Rect = rect;
	workAreaWithoutScroll.width -= 14;
	workAreaWithoutScroll.height -= 14;
	
	var totalHeight:float = cutscene.curves.length*curveClipHeight;
	var totalWidth:float = cutscene.GetTotalTime()*zoom;
	var forceScrollHeight:float = (position.height-rect.y-14)+1;
	var forceScrollWidth:float = (rect.width-15)+1;
	//GUILayout.BeginArea(Rect(100,rect.y,position.width-100-inspectorWidth,position.height-rect.y));
	//for (i = 0; i < cutscene.curves.length; i++) {
	//	GUI.Box(Rect(0,(i*30)-scrollPosition.y,position.width-100-inspectorWidth,30),"");
	//}
	//GUILayout.EndArea();
	
	
	//Dark bar at edge of work area.
	GUI.color = Color(0,0,0,0.4);
	GUI.DrawTexture(Rect(rect.x+rect.width-14,18,14,position.height),GetWhiteTex());
	GUI.color = Color(1,1,1,1);
	
	if (mouseButton2 && !mouseButtonDown2 && rect.Contains(mousePos)) {
		scrollPosition -= event.delta*0.5;
		Repaint();
	}
	scrollPosition = GUI.BeginScrollView(rect,scrollPosition,Rect(0,0,Mathf.Max(forceScrollWidth,totalWidth),Mathf.Max(forceScrollHeight,totalHeight)), true, false);
	if (totalHeight < forceScrollHeight) {
		scrollPosition.y = 0;
	}
	if (totalWidth < forceScrollWidth) {
		//scrollPosition.x = 0;
	}
	
	var xAdd:float = -3;
	
	for (i = 0; i < cutscene.curves.length; i++) {
		
		GUI.color = Color(1,1,1,1);
		GUI.Box(Rect(0,(i*curveClipHeight),totalWidth,curveClipHeight),"");
		
		var clipLength:float = cutscene.curves[i].length*zoom;
		var clipStart:float = cutscene.curves[i].startTime*zoom;
		
		GUILayout.BeginArea(Rect(clipStart,i*curveClipHeight,clipLength,curveClipHeight));
			
			for (j = 0; j < cutscene.curves[i].animCurve.keys.length; j++) {
				xAdd = -3;
				var otherXAdd:float = 0;
				if (j == 0) {
					otherXAdd = -3;
					xAdd = -1.0;
				}
				else if (j == cutscene.curves[i].animCurve.keys.length-1) {
					otherXAdd = 3;
					xAdd = -5.0;
				}
				if (workAreaWithoutScroll.Contains(mousePos) && !isDraggingCurveClip && 
					(!isDragging || (isDragging && selectedClip == cutscene.curves[i] &&  selectedKeyframeIndex == j)) && 
					((clickedCurveKey && selectedClip == cutscene.curves[i] &&  selectedKeyframeIndex == j) || 
					(workAreaAbsMousePos.y >= i*curveClipHeight+40-scrollPosition.y && 
					workAreaAbsMousePos.y <= i*curveClipHeight+curveClipHeight+40-scrollPosition.y && 
					Mathf.Abs((workAreaAbsMousePos.x-(cutscene.curves[i].startTime+cutscene.curves[i].animCurve.keys[j].time))+(otherXAdd/zoom))*zoom <= 3))) {
						if (mouseButtonDown0) {
							selectedClip = cutscene.curves[i];
							selectedKeyframeIndex = j;
							toolbarInt = 1;
							toolState = "none";
							GUI.FocusControl ("Editor");
							if (j != 0) {
								isDragging = true;
								draggingPos = cutscene.curves[i].animCurve.keys[j].time;
							}
							clickedCurveKey = true;
						}
						if (j != 0) {
							if (isDragging) {
								var mouseDif:float = mousePos.x-mouseDownPos.x;
								var key:Keyframe = cutscene.curves[i].animCurve.keys[j];
								key.time = (draggingPos*zoom)+mouseDif;
								key.time /= zoom;
								
								if (gridValues[currentGridIndex] > 0) {
									var snapValue:float = Mathf.Round(key.time/gridValues[currentGridIndex])*gridValues[currentGridIndex];
									if (key.time != snapValue) {
										key.time = snapValue;
										if (j == cutscene.curves[i].animCurve.keys.length-1) {
											key.time = Mathf.Max(key.time,0.1);
											cutscene.curves[i].length = key.time;
											
										}
									}
								}
								cutscene.curves[i].animCurve.MoveKey(j,key);
							}
						}
						
				}
			}
			
			
			GUI.color = Color(0,0,0,0);
			
			if (doubleClick) {
				EditorGUI.CurveField(Rect(-100,0,clipLength+100,curveClipHeight),"", cutscene.curves[i].animCurve);
			}
			else if (!clickedCurveKey) {
			
				if (workAreaWithoutScroll.Contains(mousePos) && 
					workAreaAbsMousePos.y >= i*curveClipHeight+40-scrollPosition.y && 
					workAreaAbsMousePos.y <= i*curveClipHeight+curveClipHeight+40-scrollPosition.y && 
					workAreaAbsMousePos.x >= cutscene.curves[i].startTime &&
					workAreaAbsMousePos.x <= cutscene.curves[i].startTime+cutscene.curves[i].length) {
					if (mouseButtonDown0) {
						selectedClip = cutscene.curves[i];
						selectedKeyframeIndex = -1;
						toolbarInt = 1;
						if (toolState == "drawkeys") {
							var addKeyTime:float = (mousePos.x-100)/zoom;
							addKeyTime += scrollPosition.x/zoom;
							addKeyTime -= cutscene.curves[i].startTime;
							addKeyTime = Mathf.Max(Mathf.Min(addKeyTime,cutscene.curves[i].length),0);
							AddCurveKeyAtPos(cutscene.curves[i],addKeyTime);
							addedAKey = true;
						}
						GUI.FocusControl ("Editor"); 
						
						isDragging = true;
						isDraggingCurveClip = true;
						draggingPos = cutscene.curves[i].startTime;
					}
				}
				
				if (selectedClip == cutscene.curves[i] && isDragging) {
					mouseDif = mousePos.x-mouseDownPos.x;
					cutscene.curves[i].startTime = (draggingPos*zoom)+mouseDif;
					cutscene.curves[i].startTime /= zoom;
					
					if (gridValues[currentGridIndex] > 0) {
						snapValue = Mathf.Round(cutscene.curves[i].startTime/gridValues[currentGridIndex])*gridValues[currentGridIndex];
						if (cutscene.curves[i].startTime != snapValue) {
							cutscene.curves[i].startTime = snapValue;
						}
					}
				}
				
			}
			
			
			if (EvalCurve(cutscene.curves[i])) {
				GUI.color = clipColors[Mathf.Max(Mathf.Min(cutscene.curves[i].colorIndex,clipColors.length-1),0)];
			}
			else {
				GUI.color = clipErrorColor;
			}
			if (cutscene.curves[i] != selectedClip) {
				GUI.color *= Color(0.75,0.75,0.75,1);
			}
			
			//GUI.color.a = 0.75;
			GUI.Button(Rect(0,0,clipLength,curveClipHeight),"",skin.GetStyle("curveClipButton"));
			
			
			var maxValue:float = 0;
			var minValue:float = 0;
			var points:Array = new Array();
			
			for (interpIndex = 0.0; interpIndex < cutscene.curves[i].animCurve.keys.length+1; interpIndex += (1.0/5.0)) {
				var iTime:float = interpIndex/(cutscene.curves[i].animCurve.keys.length);
				var v:float = cutscene.curves[i].animCurve.Evaluate(iTime*cutscene.curves[i].length);
				points.Add(Vector3(iTime*cutscene.curves[i].length*zoom,v));
				maxValue = Mathf.Max(maxValue,v);
				minValue = Mathf.Min(minValue,v);
			}
			var valueDist:float = Mathf.Abs(minValue-maxValue);
			
			Handles.color = Color(0.0,0.0,0.0,0.5);
			var curvePointMult:float = (curveClipHeight-4);
			for (j = 0; j < points.length; j++) {
				if (j >= points.length-1) continue;
				var value1:float = points[j].y+(-minValue);
				value1 /= valueDist;
				var value2:float = points[j+1].y+(-minValue);
				value2 /= valueDist;
				var point1:Vector3 = Vector3(points[j].x,2+(1.0-value1)*curvePointMult);
				var point2:Vector3 = Vector3(points[j+1].x,2+(1.0-value2)*curvePointMult);
				Handles.DrawAAPolyLine(point1,point2);
			}
			
			
			if (cutscene.curves[i].animCurve.keys.length < 2) {
				//cutscene.curves[i].animCurve.AddKey(0,0);
				//cutscene.curves[i].animCurve.AddKey(cutscene.curves[i].length,1);
				//cutscene.curves[i].animCurve.SmoothTangents(0,1.0);
				//cutscene.curves[i].animCurve.SmoothTangents(1,1.0);
				cutscene.curves[i].animCurve = AnimationCurve.EaseInOut(0.0,0.0,cutscene.curves[i].length,1.0);
			}
			
			var newKey:Keyframe = cutscene.curves[i].animCurve.keys[0];
			newKey.time = 0;
			cutscene.curves[i].animCurve.MoveKey(0, newKey);
			newKey = cutscene.curves[i].animCurve.keys[cutscene.curves[i].animCurve.keys.length-1];
			newKey.time = cutscene.curves[i].length;
			cutscene.curves[i].animCurve.MoveKey(cutscene.curves[i].animCurve.keys.length-1,newKey);

			
			for (j = 0; j < cutscene.curves[i].animCurve.keys.length; j++) {
				if (selectedClip == cutscene.curves[i] && j == selectedKeyframeIndex) {
					GUI.color = Color(1.0,0.7,0.6,1.0);
				}
				else {
					GUI.color = Color(0.3,0.4,0.5,0.7);
				}
				xAdd = -3;
				if (j == 0) {
					xAdd = -1.0;
				}
				else if (j == cutscene.curves[i].animCurve.keys.length-1) {
					xAdd = -5.0;
				}
				GUI.Box(Rect((cutscene.curves[i].animCurve.keys[j].time*zoom)+xAdd,2,6,16),"",skin.GetStyle("Key"));
				//GUI.DrawTexture(Rect((cutscene.curves[i].animCurve.keys[j].time*zoom)+xAdd,2,6,16),keyTex);
				GUI.color = Color(1,1,1,1);
			}
			
		GUILayout.EndArea();
	}
	GUI.color = Color(1,1,1,1);
	GUI.EndScrollView();
	
	//Event tract button
	GUI.color = Color(0,0,0,0);
	if (GUI.Button(Rect(100,38,position.width-100-inspectorWidth,curveClipHeight),"")) {
		if (toolState == "drawevents") {
			var addEventTime:float = (workAreaMousePos.x)/zoom;
			addEventTime += scrollPosition.x/zoom;
			addEventTime = Mathf.Min(addEventTime,cutscene.GetTotalTime());
			AddEventAtPos(addEventTime);
			addedAKey = true;
		}
		GUI.FocusControl("Editor");
	}
	GUI.color = Color(1,1,1,1);
	
	if (event.isMouse && !addedAKey && (mouseButtonDown0 || mouseButtonDown1 || mouseButtonDown2)) {
		toolState = "none";
	}
	
	rect.x = 0;
	rect.y = 18;
	rect.width = 100.0;
	rect.height = position.height-rect.y;
	
	GUI.color = Color(0,0,0,0.4);
	GUI.DrawTexture(Rect(rect.width,rect.y,position.width-rect.width-inspectorWidth-14,20),GetWhiteTex());
	GUI.color = Color(1,1,1,1);
	GUI.Box(Rect(rect.width,rect.y,position.width-rect.width-inspectorWidth-14,20),"");
	
	GUILayout.BeginArea(rect);
	GUI.Box(Rect(0,0,100,20),"");
	GUI.color = Color(1,1,1,1);
	GUI.Label(Rect(2,0,98,20),Cutscene.FormatTime(currentTime));
	GUILayout.EndArea();
	
	rect.y += 20;
	GUI.color = Color(0,0,0,0.2);
	GUI.DrawTexture(Rect(rect.width,rect.y,position.width-rect.width-inspectorWidth-14,curveClipHeight),GetWhiteTex());
	GUI.color = Color(1,1,1,1);
	GUI.Box(Rect(rect.width,rect.y,position.width-rect.width-inspectorWidth-14,curveClipHeight),"");
	GUILayout.BeginArea(rect);
	//GUI.color = Color(0.5,0.5,0.5,1);
	GUI.Box(Rect(0,0,100,curveClipHeight),"");
	GUI.color = Color(1,1,1,1);
	GUI.Label(Rect(2,0,98,curveClipHeight),"Events");
	GUILayout.EndArea();
	
	//Draw events
	GUILayout.BeginArea(Rect(100,38,position.width-100-inspectorWidth-14,curveClipHeight));
	for (i = 0; i < cutscene.events.length; i++) {
		var eventRect:Rect = Rect((cutscene.events[i].startTime*zoom)-scrollPosition.x-3,2,6,16);
		GUI.color = Color(0,0,0,0);
		
		if (workAreaAbsMousePos.y >= 23 && workAreaAbsMousePos.y <= 37 && Mathf.Abs(cutscene.events[i].startTime-workAreaAbsMousePos.x)*zoom <= 3) {
			if (mouseButtonDown0) {
				selectedClip = cutscene.events[i];
				toolbarInt = 1;
				toolState = "none";
				isDragging = true;
				draggingPos = cutscene.events[i].startTime;
				
			}
		}
		
		if (selectedClip == cutscene.events[i] && isDragging) {
			mouseDif = mousePos.x-mouseDownPos.x;
			cutscene.events[i].startTime = draggingPos*zoom+mouseDif;
			cutscene.events[i].startTime /= zoom;
		}
		
		GUI.color = Color(0.3,0.5,0.4,1.0);
		if (selectedClip == cutscene.events[i]) {
			GUI.color = Color(1.0,0.9,0.6,1.0);
		}
		GUI.Box(eventRect,"",skin.GetStyle("Key"));
		//GUI.DrawTexture(eventRect,keyTex);
	}
	GUI.color = Color(1,1,1,1);
	GUILayout.EndArea();
	
	rect.y += curveClipHeight;
	
	GUILayout.BeginArea(rect);
	GUI.color = Color(1,1,1,1);
	for (i = 0; i < cutscene.curves.length; i++) {
		var curveNameRect:Rect = Rect(0,(i*curveClipHeight)-scrollPosition.y,100,curveClipHeight);
		var curveNamePupupRect:Rect = curveNameRect;
		curveNamePupupRect.x -= 100;
		curveNamePupupRect.width += 100;
		curveNamePupupRect.width -= 20;
		var mouseInsideNameRect:boolean = curveNameRect.Contains(Vector2(mousePos.x,mousePos.y-rect.y));
		if (mouseInsideNameRect) {
			GUI.color = Color(1,1,1,1);
		}
		else {
			GUI.color = Color(0.5,0.5,0.5,1);
		}
		GUI.Box(curveNameRect,"");
		GUI.color = Color(0,0,0,0);
		cutscene.curves[i].colorIndex = EditorGUI.Popup(curveNamePupupRect,"",cutscene.curves[i].colorIndex,clipColorNames);
		GUI.color = Color(1,1,1,1);
		GUI.Label(Rect(2,((i*curveClipHeight)+0)-scrollPosition.y,98,curveClipHeight),cutscene.curves[i].name);
		if (mouseInsideNameRect) {
			//Debug.Log(cutscene.curves[i].name);
			var orderButtonRect:Rect = curveNameRect;
			orderButtonRect.x += 100-20;
			orderButtonRect.width = 20;
			orderButtonRect.height /= 2;
			var curveClip:CurveClip = cutscene.curves[i];
			GUI.color = Color(0,0,0,0);
			if (GUI.Button(orderButtonRect,"u")) {
				if (i > 0) {
					cutscene.RemoveCurveClip(curveClip);
					cutscene.InsertCurveClip(i-1,curveClip);
				}
			}
			GUI.color = Color(1,1,1,1);
			GUI.DrawTexture(orderButtonRect,moveClipUpTex);
			orderButtonRect.y += orderButtonRect.height;
			GUI.color = Color(0,0,0,0);
			if (GUI.Button(orderButtonRect,"d")) {
				if (i < cutscene.curves.length-1) {
					cutscene.RemoveCurveClip(curveClip);
					cutscene.InsertCurveClip(i+1,curveClip);
				}
			}
			GUI.color = Color(1,1,1,1);
			GUI.DrawTexture(orderButtonRect,moveClipDownTex);
			
		}
	}
	GUILayout.EndArea();
	
	GUILayout.BeginArea(timelineRect);
	GUI.color = Color(1,0.2,0.2,1);
	GUI.color = Color(0.9,0.25,0.25,1);
	GUI.DrawTexture(Rect(((currentTime*zoom)-scrollPosition.x)-1,0,2,timelineRect.height-15),GetWhiteTex());
	GUI.color = Color(1,1,1,1);
	GUI.Label(Rect((currentTime*zoom)-scrollPosition.x,0,100,24),Cutscene.FormatTime(currentTime));
	GUI.color = Color(0.8,0.25,0.2,1);
	GUI.DrawTexture(Rect(((currentTime*zoom)-scrollPosition.x)-6,0,12,6),timeMarkerArrowTex);
	GUI.color = Color(1,1,1,1);
	
	GUILayout.EndArea();
	
	var shouldStopPreviewing:boolean = false;
	if (mouseButton0 && Rect(timelineRect).Contains(mouseDownPos)) {
		if (mouseDownPos.y > 18 && mouseDownPos.y < 18+20) {
			shouldStopPreviewing = true;
			var totalTime:float = cutscene.GetTotalTime();
			if (mousePos.x > 100 && mousePos.x < timelineRect.x+timelineRect.width) {
				currentTime = (mousePos.x-100)/zoom;
				currentTime += scrollPosition.x/zoom;
				currentTime = Mathf.Max(Mathf.Min(currentTime,totalTime),0);
			}
			else {
				if (mousePos.x <= 100) {
					scrollPosition.x += ((mousePos.x-100)/zoom)*20.0;
					currentTime = Mathf.Max(((mousePos.x-100)+scrollPosition.x)/zoom,0);
				}
				if (mousePos.x >= timelineRect.x+timelineRect.width) {
					scrollPosition.x += ((mousePos.x-(timelineRect.x+timelineRect.width))/zoom)*20.0;
					currentTime = Mathf.Min(((mousePos.x-100)+scrollPosition.x)/zoom,totalTime);
				}
			}
		}
	}
	
	if (!isPreviewing) {
		//if (event.type != EventType.MouseDown) {
			if (toolbarInt == 1) {
				if (selectedClip) {
					if (selectedClip instanceof CurveClip) {
						if (selectedKeyframeIndex == -1)
						DrawCurveClipInspector();
						else
						DrawCurveKeyInspector();
					}
					//else if (selectedClip instanceof Keyframe) {
					//	DrawCurveKeyInspector();
					//}
					else if (selectedClip instanceof EventClip) {
						DrawEventInspector(true);
					}
				}
			}
			else if (toolbarInt == 2) {
				DrawCutsceneInspector();
			}
			else if (toolbarInt == 0) {
				DrawCutsceneList();
			}
		//}
	}
	else {
		DrawPreviewMessage();
	}
	
	if (shouldStopPreviewing) {
		isPreviewing = false;
	}
}

function DrawPreviewMessage() {
	var rect:Rect = Rect(0,0,0,0);
	rect.x = position.width-inspectorWidth;
	rect.y = 40;
	rect.width = inspectorWidth;
	rect.height = position.height-rect.y;
	
	var totalHeight = 24.0*4.0;
	
	inspectorScrollPosition = GUI.BeginScrollView(rect,inspectorScrollPosition,Rect(0,0,rect.width-16,totalHeight));
		GUILayout.BeginArea(Rect(0,0,rect.width-16,rect.height));
		GUILayout.Label("Previewing cutscene.\nStop preview to continue editing.");
		GUILayout.EndArea();
	GUI.EndScrollView();
	
}

function DrawCurveClipInspector() {
	var rect:Rect = Rect(0,0,0,0);
	rect.x = position.width-inspectorWidth;
	rect.y = 40;
	rect.width = inspectorWidth;
	rect.height = position.height-rect.y;
	
	var totalHeight = 20.0*4.0;
	
	GUI.SetNextControlName("Inspector");
	var contentRect:Rect = EditorGUILayout.BeginVertical(GUILayout.MaxWidth(inspectorWidth-18));
	inspectorScrollPosition = GUI.BeginScrollView(rect,inspectorScrollPosition,contentRect);
		selectedClip.name = EditorGUILayout.TextField(selectedClip.name);
		EditorGUILayout.Separator ();
		EditorGUILayout.CurveField("Edit Curve",selectedClip.animCurve);
		//selectedClip.target = GUILayout.Button("Edit Curve",selectedClip.animCurve);
		if (!selectedClip.target) {
			selectedClip.ignoreTarget = EditorGUILayout.Toggle("Ignore Target",selectedClip.ignoreTarget);
			if (!selectedClip.ignoreTarget) {
				var r:Rect = EditorGUILayout.BeginVertical();
				GUI.color = Color(1,0.0,0.0,0.25);
				GUI.DrawTexture(r,GetWhiteTex());
				GUI.color += Color(0.5,0.5,0.5,1);
				selectedClip.target = EditorGUILayout.ObjectField("Target",selectedClip.target,GameObject,true);
				EditorGUILayout.EndVertical();
				GUI.color = Color(1,1,1,1);
			}
		}
		else {
			selectedClip.target = EditorGUILayout.ObjectField("Target",selectedClip.target,GameObject,true);
			if (!selectedClip.target) {
				GUI.EndScrollView();
				EditorGUILayout.EndVertical();
				
				return;
			}
			
			EditorGUILayout.BeginHorizontal();
			GUILayout.FlexibleSpace();
			if (GUILayout.Button("Add extra target",GUILayout.ExpandWidth(false))) {
				var tmpSimpleArray:GameObject[] = new GameObject[selectedClip.extraTargets.length+1];
				for (i = 0; i < selectedClip.extraTargets.length; i++) {
					tmpSimpleArray[i] = selectedClip.extraTargets[i];
				}
				selectedClip.extraTargets = tmpSimpleArray;
			}
			EditorGUILayout.EndHorizontal();
			
			if (!selectedClip.extraTargets) {
				selectedClip.extraTargets = new GameObject[0];
			}
			if (selectedClip.extraTargets.length > 0)
				EditorGUILayout.Space();
			var deletedTarget:int = -1;
			for (i = 0; i < selectedClip.extraTargets.length; i++) {
				selectedClip.extraTargets[i] = EditorGUILayout.ObjectField("Extra Target "+i,selectedClip.extraTargets[i],GameObject,true);
				EditorGUILayout.BeginHorizontal();
				GUILayout.FlexibleSpace();
				if (GUILayout.Button("Delete target "+i,GUILayout.ExpandWidth(false))) {
					deletedTarget = i;
				}
				EditorGUILayout.EndHorizontal();
				EditorGUILayout.Space();
			}
			if (deletedTarget != -1) {
				tmpSimpleArray= new GameObject[selectedClip.extraTargets.length-1];
				var counter:int = 0;
				for (i = 0; i < selectedClip.extraTargets.length; i++) {
					if (i == deletedTarget) continue;
					tmpSimpleArray[counter] = selectedClip.extraTargets[i];
					counter++;
				}
				selectedClip.extraTargets = tmpSimpleArray;
			}
			
			EditorGUILayout.Separator ();
			
			selectedClip.updateMode = EditorGUILayout.EnumPopup("Update Mode",selectedClip.updateMode);
			
			var currentInt:int = 0;
			
			if ((selectedClip as CurveClip).updateMode == CutsceneClipUpdateMode.Action) {
				var actionFunctions:Array = APIAccess.FindActionFunctionNames(selectedClip.target,["?"],false);
				var actions:Array = actionFunctions[0];
				var actionFriendlyNames:Array = actionFunctions[1];
				var actionComponents:Array = actionFunctions[2];
				for (i = 0; i < actions.length; i++) {
					if (actions[i] == selectedClip.updateEvent) {
						currentInt = i;
						break;
					}
				}
				if (actions.length == 0) {
					actions.Add("No Valid actions Found");
					GUI.color = GUI.color = Color(1,0.4,0.4,1);
					GUILayout.Label("There are no actions on this object.\nAdd an action through the Component menu\nor change the Update Mode.");
					GUI.color = GUI.color = Color(1,1,1,1);
				}
				else {
					currentInt = EditorGUILayout.Popup("Update Action",currentInt, actionFriendlyNames.ToBuiltin(String));
					selectedClip.updateEvent = actions[currentInt];
					
					//Clear the customProperties if needed
					if (!selectedClip.targetAction || actionComponents[currentInt].GetType().Name != selectedClip.targetAction.GetType().Name) {
						selectedClip.ClearCustomProperties();
					}
					
					selectedClip.targetAction = actionComponents[currentInt];
					
					var inspectorGUIType = System.Type.GetType(actionComponents[currentInt].GetType().Name+"_Editor");
					if (inspectorGUIType) {
						GUILayout.Label("Action Properties...");
						var newInspectorGUI:CutsceneActionEditor = ScriptableObject.CreateInstance(inspectorGUIType);
						newInspectorGUI.actionTarget = actionComponents[currentInt];
						newInspectorGUI.curveClip = selectedClip;
						newInspectorGUI.OnCutsceneInspectorGUI();
						GameObject.DestroyImmediate(newInspectorGUI);
					}
				}
			}
			else if ((selectedClip as CurveClip).updateMode == CutsceneClipUpdateMode.DirectVarAccess) {
				selectedClip.ClearCustomProperties();
				//selectedClip.targetComponent = EditorGUILayout.ObjectField("Component",selectedClip.targetComponent,Component);
				var res:Array = APIAccess.FindFloatVarNames(selectedClip.target,null,["lightmapTilingOffset"],true);
				actions = res[0];
				var components:Array = res[1];
				//(selectedClip as CurveClip).targetComponent
				var firstElement:Array = new Array();
				firstElement.Add("Select A Variable");
				actions = firstElement.Concat(actions);
				for (i = 0; i < actions.length; i++) {
					if (actions[i] == selectedClip.updateEvent) {
						currentInt = i;
						break;
					}
				}
				if (actions.length == 0) {
					actions.Add("No Valid Variables Found");
				}
				
				currentInt = EditorGUILayout.Popup("Update Variable",currentInt, actions.ToBuiltin(String));
				selectedClip.updateEvent = actions[currentInt];
				selectedClip.targetComponent = components[currentInt];
			}
			/*
			else if ((selectedClip as CurveClip).updateMode == CutsceneClipUpdateMode.CustomExpression) {
				selectedClip.ClearCustomProperties();
				GUILayout.Label("Pro-Tip: edit expressions in an external text\neditor and paste here.");
				EditorGUILayout.LabelField("Builtin values...","");
				EditorGUILayout.TextArea(Cutscene.builtinExpressionStr,GUILayout.Height(55));
				EditorGUILayout.LabelField("Expression...","");
				selectedClip.expression = EditorGUILayout.TextArea(selectedClip.expression,GUILayout.Height(200));
			}
			*/
		}
		
		EditorGUILayout.Separator();
		selectedClip.activeCamera = EditorGUILayout.ObjectField("Active Camera",selectedClip.activeCamera,Camera,true);
		//selectedClip.smoothKeys = EditorGUILayout.Toggle("Smooth Keys",selectedClip.smoothKeys);
		var lastLength:float = selectedClip.length;
		selectedClip.startTime = EditorGUILayout.FloatField("Start Time",selectedClip.startTime);
		selectedClip.length = EditorGUILayout.FloatField("Length",selectedClip.length);

		if (selectedClip.startTime < 0) {
			selectedClip.startTime = 0;
		}
		if (selectedClip.length < 0.1) {
			selectedClip.length = 0.1;
		}
		
		if (lastLength != selectedClip.length) {
			var difRatio:float = lastLength/selectedClip.length;
			var keyList:Array = new Array();
			for (i = 0; i < selectedClip.animCurve.keys.length; i++) {
				var key:Keyframe = selectedClip.animCurve.keys[i];
				key.time = key.time/difRatio;
				keyList.Add(key);
			}
			selectedClip.animCurve.keys = keyList.ToBuiltin(Keyframe);
		}
		
	GUI.EndScrollView();
	EditorGUILayout.EndVertical();
}

function DrawEventInspector(recursive:boolean) {
	var rect:Rect = Rect(0,0,0,0);
	rect.x = position.width-inspectorWidth;
	rect.y = 40;
	rect.width = inspectorWidth;
	rect.height = position.height-rect.y;
	
	var eventsToShow:Array = new Array();
	//if (recursive) {
		eventsToShow.Add(selectedClip);
		for (i = 0; i < cutscene.events.length; i++) {
			if (cutscene.events[i] != selectedClip && cutscene.events[i].startTime == selectedClip.startTime) {
				eventsToShow.Add(cutscene.events[i]);
				
			}
		}
		
		//eventsToShow.Add(selectedClip);
	//}
	//else {
	//	eventsToShow.Add(selectedClip);
	//}

	GUI.SetNextControlName("Inspector");
	var contentRect:Rect = EditorGUILayout.BeginVertical(GUILayout.MaxWidth(inspectorWidth-18));
	inspectorScrollPosition = GUI.BeginScrollView(rect,inspectorScrollPosition,contentRect);
	for (eventCounter = 0; eventCounter < eventsToShow.length; eventCounter++) {
		var currentEvent:EventClip = eventsToShow[eventCounter];
		EditorGUI.indentLevel = 0;
		if (eventsToShow.length > 1) {
			currentEvent.guiExpanded = EditorGUILayout.Foldout(currentEvent.guiExpanded,currentEvent.name);
			EditorGUI.indentLevel = 1;
			if (!currentEvent.guiExpanded) continue;
			if (eventCounter > 0) {
				EditorGUILayout.BeginHorizontal();
				GUILayout.Space(12);
				if (GUILayout.Button("Select "+currentEvent.name,GUILayout.ExpandWidth(false))) {
					//Swap the desired selection to the last element in the array and then select it.
					var tmp:Array = cutscene.events;
					tmp.Remove(currentEvent);
					tmp.Add(currentEvent);
					cutscene.events = tmp.ToBuiltin(EventClip);
					selectedClip = currentEvent;
					inspectorScrollPosition.y = 0;
				}
				GUILayout.FlexibleSpace();
				EditorGUILayout.EndHorizontal();
			}
		}
		
		if (eventsToShow.length > 1) {
			EditorGUILayout.BeginHorizontal();
			GUILayout.Space(12);
		}
		currentEvent.name = EditorGUILayout.TextField(currentEvent.name);
		if (eventsToShow.length > 1) {
			EditorGUILayout.EndHorizontal();
		}
		
		currentEvent.startTime = EditorGUILayout.FloatField("Event Time",currentEvent.startTime);
		UpdateEventSafePos(currentEvent);
		//EditorGUILayout.Separator();
		currentEvent.target = EditorGUILayout.ObjectField("Target",currentEvent.target,GameObject,true);
		if (!currentEvent.target) {
			//GUI.EndScrollView();
			//EditorGUILayout.EndVertical();
			EditorGUI.indentLevel = 0;
			EditorGUILayout.Separator();
			EditorGUILayout.Separator();
			continue;
		}
		
		if (currentEvent.target) {
			var currentComponentInt:int = 0;
			var componentReturn:Array = APIAccess.FindComponents(currentEvent.target);
			var componentNames:Array = componentReturn[0];
			var components:Array = componentReturn[1];
			if (currentEvent.component) {
				for (i = 0; i < componentNames.length; i++) {
					if (componentNames[i] == APIAccess.GetEventComponentName(currentEvent.component)) {
						currentComponentInt = i;
						break;
					}
				}
			}
			currentComponentInt = EditorGUILayout.Popup("Component",currentComponentInt, componentNames.ToBuiltin(String));
			currentEvent.component = components[currentComponentInt];
			
			var currentFunctionInt:int = 0;
			var functions:Array = APIAccess.FindEventFunctionsInComponent(currentEvent.component, ["?"]);
			for (i = 0; i < functions.length; i++) {
				if (functions[i] == currentEvent.targetFunction) {
					currentFunctionInt = i;
					break;
				}
			}
			if (currentFunctionInt >= functions.length) {
				//GUI.EndScrollView();
				//EditorGUILayout.EndVertical();
				if (eventsToShow.length > 1) {
					EditorGUILayout.BeginHorizontal();
					GUILayout.Space(12);
				}
				GUILayout.Label("No valid functions on this component.");
				if (eventsToShow.length > 1) {
					EditorGUILayout.EndHorizontal();
				}
				EditorGUI.indentLevel = 0;
				EditorGUILayout.Separator();
				EditorGUILayout.Separator();
				continue;
			}
			currentFunctionInt = EditorGUILayout.Popup("Function",currentFunctionInt, functions.ToBuiltin(String));
			currentEvent.targetFunction = functions[currentFunctionInt];
			
			var paramsVariations:Array = APIAccess.FindFunctionParams(currentEvent.component,currentEvent.targetFunction);
			var params:Array = new Array();
			var paramVariationNames:Array = new Array();
			
			for (v in paramsVariations) {
				var variationName:String = "";
				var counter:int = 0;
				for (p in v) {
					variationName += p.Name;
					if (counter != v.length-1) variationName += ", ";
					counter++;
				}
				paramVariationNames.Add(variationName);
			}
			if (paramVariationNames[0] == "") {
				paramVariationNames[0] = "-Empty-";
			}
			currentEvent.paramVariationIndex = Mathf.Min(currentEvent.paramVariationIndex,paramVariationNames.length-1);
			//if (paramsVariations.length > 1) {
				currentEvent.paramVariationIndex = EditorGUILayout.Popup("Variation",currentEvent.paramVariationIndex, paramVariationNames.ToBuiltin(String));
			//}
			//else {
			//	currentEvent.paramVariationIndex = 0;
			//}
			params = paramsVariations[currentEvent.paramVariationIndex];
			
			var validParams:Array = new Array();
			
			for (i = 0; i < params.length; i++) {
				var valid:boolean = false;
				if (params[i].ParameterType == boolean) {
					valid = true;
				}
				else if (params[i].ParameterType == Color) {
					valid = true;
				}
				else if (params[i].ParameterType == float) {
					valid = true;
				}
				else if (params[i].ParameterType == int) {
					valid = true;
				}
				else if (params[i].ParameterType == System.UInt64) {
					valid = true;
				}
				else if (params[i].ParameterType == Vector2) {
					valid = true;
				}
				else if (params[i].ParameterType == Vector3) {
					valid = true;
				}
				else if (params[i].ParameterType == Vector4) {
					valid = true;
				}
				else if (params[i].ParameterType == String) {
					valid = true;
				}
				else if (params[i].ParameterType.GetType().IsInstanceOfType(UnityEngine.Object)) {
					valid = true;
				}
				
				if (valid) {
					validParams.Add(params[i]);
				}
			}
			
			EditorGUILayout.Separator();
			
			if (validParams.length == params.length) {
				if (currentEvent.params && currentEvent.params.length == validParams.length) {
					for (i = 0; i < validParams.length; i++) {
						if (validParams[i].ParameterType.ToString() != currentEvent.params[i].type) {
							currentEvent.params = null;
							//return;
							break;
						}
					}
				}
				else {
					currentEvent.params = null;
				}
				if (!currentEvent.params || currentEvent.params.length != validParams.length) {
					//Debug.Log(currentEvent.params.length+" "+validParams.length);
					currentEvent.params = new EventParam[validParams.length];
					for (i = 0; i < validParams.length; i++) {
						currentEvent.params[i] = new EventParam();
						//Debug.Log(validParams[i].ParameterType.ToString());
						currentEvent.params[i].type = validParams[i].ParameterType.ToString();
						//Debug.Log("Created new EeventParams");
					}
				}
				if (eventsToShow.length > 1) {
					EditorGUILayout.BeginHorizontal();
					GUILayout.Space(12);
				}
				GUILayout.Label("Function arguments...");
				if (eventsToShow.length > 1) {
					EditorGUILayout.EndHorizontal();
				}
				for (i = 0; i < validParams.length; i++) {
					if (validParams[i].ParameterType == boolean) {
						currentEvent.params[i].SetValue(EditorGUILayout.Toggle(validParams[i].Name,currentEvent.params[i].booleanValue),validParams[i].ParameterType);
					}
					else if (validParams[i].ParameterType == Color) {
						currentEvent.params[i].SetValue(EditorGUILayout.ColorField(validParams[i].Name,currentEvent.params[i].colorValue),validParams[i].ParameterType);
					}
					else if (validParams[i].ParameterType == float) {
						currentEvent.params[i].SetValue(EditorGUILayout.FloatField(validParams[i].Name,currentEvent.params[i].floatValue),validParams[i].ParameterType);
					}
					else if (params[i].ParameterType == int) {
						currentEvent.params[i].SetValue(EditorGUILayout.IntField(validParams[i].Name,currentEvent.params[i].intValue),validParams[i].ParameterType);
					}
					else if (validParams[i].ParameterType == System.UInt64) {
						currentEvent.params[i].SetValue(EditorGUILayout.IntField(validParams[i].Name,currentEvent.params[i].UInt64Value),validParams[i].ParameterType);
					}
					else if (validParams[i].ParameterType == Vector2) {
						currentEvent.params[i].SetValue(EditorGUILayout.Vector2Field(validParams[i].Name,currentEvent.params[i].vector2Value),validParams[i].ParameterType);
					}
					else if (validParams[i].ParameterType == Vector3) {
						currentEvent.params[i].SetValue(EditorGUILayout.Vector3Field(validParams[i].Name,currentEvent.params[i].vector3Value),validParams[i].ParameterType);
					}
					else if (validParams[i].ParameterType == Vector4) {
						currentEvent.params[i].SetValue(EditorGUILayout.Vector4Field(validParams[i].Name,currentEvent.params[i].vector4Value),validParams[i].ParameterType);
					}
					else if (validParams[i].ParameterType == String) {
						currentEvent.params[i].SetValue(EditorGUILayout.TextField(validParams[i].Name,currentEvent.params[i].stringValue),validParams[i].ParameterType);
					}
					else if (validParams[i].ParameterType.GetType().IsInstanceOfType(UnityEngine.Object)) {
						currentEvent.params[i].SetValue(EditorGUILayout.ObjectField(validParams[i].Name,currentEvent.params[i].objectValue,validParams[i].ParameterType),UnityEngine.Object);
					}
				}
			}
			else {
				GUI.color = Color(1,0.5,0.5,1);
				if (eventsToShow.length > 1) {
					EditorGUILayout.BeginHorizontal();
					GUILayout.Space(12);
				}
				GUILayout.Label("This variation contains invalid types!");
				GUILayout.Label("Pick another variation or function.");
				if (eventsToShow.length > 1) {
					EditorGUILayout.EndHorizontal();
				}
				GUI.color = Color(1,1,1,1);
			}
		}
		EditorGUILayout.Separator();
		EditorGUILayout.Separator();
		EditorGUI.indentLevel = 0;
	}
	EditorGUI.indentLevel = 0;
	GUI.EndScrollView();
	EditorGUILayout.EndVertical();
}

//function IsInstanceOf(t1:Object t2:System.Type):boolean {
//	if ()
//	return false;
//}

function DrawCutsceneInspector() {
	var rect:Rect = Rect(0,0,0,0);
	rect.x = position.width-inspectorWidth;
	rect.y = 40;
	rect.width = inspectorWidth;
	rect.height = position.height-rect.y;
	
	var totalHeight = 24.0*4.0;
	
	inspectorScrollPosition = GUI.BeginScrollView(rect,inspectorScrollPosition,Rect(0,0,rect.width-16,totalHeight));
		GUILayout.BeginArea(Rect(0,0,rect.width-16,rect.height));
		cutscene.cutsceneName = EditorGUILayout.TextField(cutscene.cutsceneName);
		if (cutscene.gameObject.name != "Cutscene_"+cutscene.cutsceneName) {
			cutscene.gameObject.name = "Cutscene_"+cutscene.cutsceneName;
		}
		//cutscene.accuracy = EditorGUILayout.EnumPopup("Accuracy",cutscene.accuracy);
		cutscene.playOnStart = EditorGUILayout.Toggle("Play On Start",cutscene.playOnStart);
		cutscene.loop = EditorGUILayout.Toggle("Loop",cutscene.loop);
		cutscene.loopCount = EditorGUILayout.IntField("Loop Count",cutscene.loopCount);
		cutscene.resetOnStop = EditorGUILayout.Toggle("Rewind On Stop",cutscene.resetOnStop);
		//cutscene.resetPlayCountOnStop = EditorGUILayout.Toggle("Reset Play Count On Stop",cutscene.resetPlayCountOnStop);
		GUILayout.EndArea();
	GUI.EndScrollView();
}

function DrawCutsceneList() {
	var rect:Rect = Rect(0,0,0,0);
	rect.x = position.width-inspectorWidth;
	rect.y = 60;
	rect.width = inspectorWidth;
	rect.height = position.height-rect.y;
	
	var cutscenes:Array = GetCutscenes();
	var totalHeight = 18.0*cutscenes.length;
	
	GUILayout.BeginHorizontal();
	if (GUI.Button(Rect(position.width-inspectorWidth,40,40,18),"New")) {
		CreateNewCutscene();
	}
	cutscene = EditorGUI.ObjectField(Rect(position.width-inspectorWidth+40,40,inspectorWidth-40,16),cutscene,Cutscene,true);
	GUILayout.EndHorizontal();
	
	inspectorScrollPosition = GUI.BeginScrollView(rect,inspectorScrollPosition,Rect(0,0,rect.width-16,Mathf.Max(totalHeight,rect.height+1)));
		if (totalHeight < rect.height) {
			inspectorScrollPosition.y = 0.0;
		}
		GUILayout.BeginArea(Rect(0,0,rect.width-16,totalHeight));
			for (i = 0; i < cutscenes.length; i++) {
				if (cutscene == cutscenes[i]) {
					GUI.color = Color(0.8,1.0,0.8,1);
				}
				

				if (GUI.Button(Rect(0,i*18,rect.width-16,18),cutscenes[i].cutsceneName,EditorStyles.toolbarButton)) {
					cutscene = cutscenes[i];
					activeName =cutscene.cutsceneName;
					ResetAllCutscenes();
				}
				GUI.color = Color(1,1,1,1);
			}
		GUILayout.EndArea();
	GUI.EndScrollView();
}

function EvalCurve(curve:CurveClip):boolean {
	if (!curve.target && !curve.ignoreTarget) return false;
	return true;
}

function DrawCurveKeyInspector() {
	if (selectedKeyframeIndex >= selectedClip.animCurve.keys.length) {
		selectedKeyframeIndex -= 1;
		selectedKeyframeIndex = Mathf.Max(selectedKeyframeIndex,-1);
		if (selectedKeyframeIndex >= selectedClip.animCurve.keys.length) {
			selectedKeyframeIndex = -1;
			return;
		}
	}
	var rect:Rect = Rect(0,0,0,0);
	rect.x = position.width-inspectorWidth;
	rect.y = 40;
	rect.width = inspectorWidth;
	rect.height = position.height-rect.y;
	
	var totalHeight = 20.0*4.0;
	
	inspectorScrollPosition = GUI.BeginScrollView(rect,inspectorScrollPosition,Rect(0,0,rect.width-16,totalHeight));
		GUILayout.BeginArea(Rect(0,0,rect.width-16,rect.height));
		EditorGUILayout.CurveField("Edit Curve",selectedClip.animCurve);
		var newKey:Keyframe = selectedClip.animCurve.keys[selectedKeyframeIndex];
		newKey.time = EditorGUILayout.FloatField("Time",newKey.time);
		newKey.value = EditorGUILayout.FloatField("Value",newKey.value);
		selectedClip.animCurve.MoveKey(selectedKeyframeIndex,newKey);
		//UpdateKeySafePos(selectedClip);
		GUILayout.EndArea();
	GUI.EndScrollView();
}

function UpdateKeySafePos(key:CurveClipKey) {
	if (key.time < 0) {
		key.time = 0;
	}
	if (key.owner && key.time > key.owner.length) {
		key.time = key.owner.length;
	}
}

function UpdateEventSafePos(event:EventClip) {
	if (gridValues[currentGridIndex] > 0) {
		var snapValue = Mathf.Round(event.startTime/gridValues[currentGridIndex])*gridValues[currentGridIndex];
		if (event.startTime != snapValue) {
			event.startTime = snapValue;
		}
	}
	
	if (event.startTime < 0) {
		event.startTime = 0;
	}
	var totalTime:float = cutscene.GetTotalTime();
	if (event.startTime > totalTime) {
		event.startTime = totalTime;
	}
}

function GetCutscenes():Array {
	return FindObjectsOfType(Cutscene);
}

function AddCurve() {
	if (selectedClip && selectedClip instanceof CurveClip) {
		selectedClip = cutscene.AddCurveClip(Cutscene.BuiltinIndexOf(cutscene.curves,selectedClip)+1);
		selectedClip.startTime = currentTime;
	}
	else {
		selectedClip = cutscene.AddCurveClip(cutscene.curves.length);
		selectedClip.startTime = currentTime;
	}
}

function DeleteCurve() {
	if (!EditorUtility.DisplayDialog("Delete Curve?", "Are you sure you want to delete this curve?", "Yes", "No")) {
		return;
	}
	if (selectedClip && selectedClip instanceof CurveClip) {
		var lastSelectionIndex:int = Cutscene.BuiltinIndexOf(cutscene.curves,selectedClip);
		cutscene.RemoveCurveClip(selectedClip);
		selectedClip = null;
	}
}

function AddCurveKeyAtPos(curveClip:CurveClip,pos:float) {
	selectedKeyframeIndex = curveClip.animCurve.AddKey(pos,curveClip.animCurve.Evaluate(pos));
	
	//selectedKeyframeIndex = -1;
}


function DeleteCurveKey() {
	selectedClip.animCurve.RemoveKey(selectedKeyframeIndex);
	selectedKeyframeIndex = -1;
}

function AddEventAtPos(pos:float) {
	var c:int = 0;
	var newEventName:String = "New Event";
	while (true) {
		var found:boolean = false;
		for (e in cutscene.events) {
			if (e.name == (newEventName+c)) {
				found = true;
			}
		}
		if (!found) {
			newEventName += ""+c;
			break;
		}
		c++;
	}
	var newEvent:EventClip = EventClip();
	newEvent.name = newEventName;
	newEvent.startTime = pos;
	cutscene.AddEvent(newEvent);
}

function DeleteEvent(event:EventClip) {
	cutscene.DeleteEvent(event);
}

function DrawBox(rect:Rect,borderColor:Color,color:Color) {
	var tColor:Color = GUI.color;
	GUI.color = borderColor;
	GUI.DrawTexture(rect,GetWhiteTex());
	GUI.color = color;
	GUI.DrawTexture(Rect(rect.x+1,rect.y+1,rect.width-2,rect.height-2),GetWhiteTex());
	GUI.color = tColor;
}

function GetWhiteTex() {
	if (whiteTex) DestroyImmediate(whiteTex);
	if (!whiteTex) {
		whiteTex = Texture2D(1,1);
		whiteTex.SetPixel(0,0,Color(1,1,1,1));
		whiteTex.Apply();
		whiteTex.hideFlags = HideFlags.HideAndDontSave;
	}
	return whiteTex;
}

function CreateNewCutscene() {
	var c:int = 0;
	var newCutsceneName:String = "Cutscene";
	var cutscenes:Array = FindObjectsOfType(Cutscene);
	while (true) {
		var found:boolean = false;
		for (cs in cutscenes) {
			if (cs.cutsceneName == (newCutsceneName+c)) {
				found = true;
			}
		}
		if (!found) {
			newCutsceneName += ""+c;
			break;
		}
		c++;
	}
	GameObject("Cutscene_"+newCutsceneName).AddComponent(Cutscene).cutsceneName = newCutsceneName;
}

function GetCutsceneControl() {
	if (activeName != "") {
		cutscene = Cutscene.Find(activeName);
	}
	if (!cutscene) {
		cutscene = FindObjectOfType(Cutscene);
	}
	if (cutscene) {
		activeName =cutscene.cutsceneName;
	}
}

}//End class
#endif