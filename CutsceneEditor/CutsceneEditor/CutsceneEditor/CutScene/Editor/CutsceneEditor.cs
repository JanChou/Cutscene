using UnityEngine;
using UnityEditor;
using System.Linq;
using System.Collections.Generic;

//#if UNITY_EDITOR
class CutsceneEditor : EditorWindow {
public static CutsceneEditor current;
public GUISkin skin;
public Texture2D keyTex;
public Texture2D timeMarkerArrowTex;
public Texture2D previewButtonTex;
public Texture2D moveClipUpTex;
public Texture2D moveClipDownTex;
public Vector2 scrollPosition;
public Vector2 inspectorScrollPosition;
public  static Cutscene cutscene;
public static float zoom = 50.0f;
public object selectedClip;
public float inspectorWidth = 300.0f;
public bool lastIsPlaying = false;
public bool quitting = false;
public float currentTime = 0;
public float lastTime = -Mathf.Infinity;
public static string activeName = "";
public string toolState = "none";
public int selectedKeyframeIndex = -1;

public float curveClipHeight = 20.0f;
public Color clipColor = new Color(0.4f,0.45f,0.5f,1f);
public Color clipErrorColor = new Color(1.0f,0.5f,0.5f,1f);

public double clickTime = 0;
public double doubleClickTime = 0.3f;
public Vector2 lastClickPos;

public Texture2D whiteTex;

public int toolbarInt  = 0;
public string[] toolbarStrings = new string[] {"Cutscene List","Inspector","Cutscene"};

public int currentEventSelectionIndex = 0;


public Vector2 mouseDownPos;
public bool mouseButton0 = false;
public bool mouseButton1 = false;
public bool mouseButton2 = false;

public float draggingPos = 0;
public float draggingOffset = 0;
public bool isDragging = false;
public bool isDraggingCurveClip = false;
public bool clickedCurveKey = false;

public Rect curveOverlayRect;

public int currentGridIndex= 2;
public float[] gridValues = new float[] {0,0.05f,0.1f,0.2f,0.5f,1.0f};
public string[] gridNames = new string[] {"Off","00:00:05","00:00:10","00:00:20","00:00:50","00:01:00"};

public Color[] clipColors = new Color[]{new Color(0.4f,0.45f,0.6f,1f),new Color(0.4f,0.7f,0.4f,1f),new Color(1.0f,0.5f,0.3f,1f)};
public string[] clipColorNames = new string[] {"Blue","Green","Orange"};

public bool isPreviewing = false;
public float lastSystemTime = 0;

	
[MenuItem ("Window/Aperture Cutscene Editor")]
public void Init() {
	current = EditorWindow.GetWindow(typeof(CutsceneEditor,false, "Aperture") as CutsceneEditor;
	current.GetWhiteTex();
	current.lastIsPlaying = Application.isPlaying;
	current.curveOverlayRect = new Rect(0,0,0,0);
}

[MenuItem ("CONTEXT/CutsceneEditor/Curves/Add New Curve Track")]
public static void CMDAddCurve() {
	current.AddCurve();
}

[MenuItem ("CONTEXT/CutsceneEditor/Curves/Delete Curve Track")]
public static void CMDDeleteCurve() {
	current.DeleteCurve();
}
[MenuItem ("CONTEXT/CutsceneEditor/Curves/Delete Curve Track",true)]
public static bool CMDValDeleteCurve() {
	return (current.selectedClip.GetType().IsInstanceOfType(typeof(CurveClip)));
}


public void OnDestroy() {
	if (whiteTex) DestroyImmediate(whiteTex);
	ResetAllCutscenes();
}

public void ResetAllCutscenes() {
	List<Cutscene> cutscenes = FindObjectsOfType<Cutscene>().ToList<Cutscene>();
	foreach (var c in cutscenes) {
		EvalCutsceneAtTime(c,0);
		c.DisableAllOverrideCameras();
	}
}

public void EvalCutsceneAtTime(Cutscene c,float time) {
	for (int sampleCounter = 0; sampleCounter < 2; sampleCounter++) {
		if (sampleCounter == 0) {
			c.UpdateCutscene(time,false,false);
		}
		else {
			c.UpdateCutscene(time,false,true);
		}
		for (int i = 0; i < Cutscene.currentStaticClips.Count; i++) {
			Cutscene.timeIsOverCurrentClip = Cutscene.timeIsOverClipValues[i];
			Cutscene.currentStaticClips[i].target.SendMessage(Cutscene.functionNames[i],Cutscene.currentValues[i],SendMessageOptions.DontRequireReceiver);
			if (Cutscene.currentStaticClips[i].extraTargets.Length>0) {
				foreach (var at in Cutscene.currentStaticClips[i].extraTargets) {
					if (!at) continue;
					at.SendMessage(Cutscene.functionNames[i],Cutscene.currentValues[i],SendMessageOptions.DontRequireReceiver);
				}
			}
		}
	}
}

public void Update() {
	//Handle preview play
	if (!Application.isPlaying && isPreviewing) {
		if (cutscene) {
			currentTime += Time.realtimeSinceStartup-lastSystemTime;
			if (currentTime > cutscene.GetTotalTime()) {
				currentTime = 0;
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
		var c = new GUIContent("Playing");
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

public void OnGUI () {
	if (Application.isPlaying) {
		return;
	}
	if (!current) {
		current = this;
	}
	if (position.width < 650) {
        position.Set(position.left,position.top,650f,position.height);
	}
	if (position.height < 200) {
		position.Set(position.left,position.top,position.width,200f);
	}
	
	wantsMouseMove  = true;
	if (Event.current.type == EventType.MouseMove) {
		Repaint();
	}
	
	if (!cutscene) GetCutsceneControl();
	if (!cutscene) {
		var c = new GUIContent("There are no cutscenes in the current scene. To add a cutscene create an empty GameObject and assign a Cutscene component to it. The component is located at Component>Cutscene>Cutscene.");
		ShowNotification(c);
		if (GUI.Button(new Rect(position.width*0.5f-170f*0.5f,position.height-22f,170f,20f),"Or add one automatically")) {
			CreateNewCutscene();
		}
		return;
	}
	RemoveNotification();
	
	Event events = Event.current;
	var mousePos = events.mousePosition;
	var mouseButtonDown0 = false;
	var mouseButtonDown1 = false;
	var mouseButtonDown2 = false;
	var mouseButtonUp0 = false;
	var mouseButtonUp1 = false;
	var doubleClick = false;
	if (events.isMouse) {
		if (events.type == EventType.MouseDown) {
			mouseDownPos = mousePos;
			if (events.button == 0) {
				mouseButton0 = true;
				mouseButtonDown0 = true;
				if ((EditorApplication.timeSinceStartup - clickTime) < doubleClickTime) {
					if (Vector2.Distance(lastClickPos,mousePos) < 3.0) {
						doubleClick = true;
					}
				}
				clickTime = EditorApplication.timeSinceStartup;
			}
			if (events.button == 1) {
				mouseButton1 = true;
				mouseButtonDown1 = true;
			}
			if (events.button == 2) {
				mouseButton2 = true;
				mouseButtonDown2 = true;
			}
			lastClickPos = mousePos;
		}
		else if (events.type == EventType.MouseUp) {
			if (events.button == 0) mouseButton0 = false;
			if (events.button == 1) mouseButton1 = false;
			if (events.button == 2) mouseButton2 = false;
			
			if (events.button == 0) mouseButtonUp0 = true;
			if (events.button == 1) mouseButtonUp1 = true;
			isDragging = false;
			clickedCurveKey = false;
			isDraggingCurveClip = false;
		}
	}
	
	
	var addedAKey = false;
	
	GUI.SetNextControlName ("Editor");
	
	
	GUI.Box(new Rect(0,0,position.width,18f),"",EditorStyles.toolbar);
	zoom = GUI.HorizontalSlider(new Rect(5f,0,120f,18f), zoom, 200.0f, 1.0f);
	
	//Preview
	if (isPreviewing) GUI.color = new Color(0.75f,0.75f,0.75f,1.0f);
	if (GUI.Button(new Rect(130,0,30,18),previewButtonTex,EditorStyles.toolbarButton)) {
		isPreviewing = !isPreviewing;
	}
	GUI.color =new Color(1.0f,1.0f,1.0f,1.0f);
	
	if (GUI.Button(new Rect(130+30,0,80,18),"Curve Track...",EditorStyles.toolbarDropDown)) {
		EditorUtility.DisplayPopupMenu(new Rect(mousePos.x,mousePos.y,0,0), "CONTEXT/CutsceneEditor/Curves/", null);
	}
	//if (GUI.Button(Rect(195,0,60,18),"Events...",EditorStyles.toolbarDropDown)) {
	//	EditorUtility.DisplayPopupMenu(Rect(mousePos.x,mousePos.y,0,0), "CONTEXT/CutsceneEditor/Curves/", null);
	//}
	
	if (toolState == "drawkeys") GUI.color =new Color(0.75f,0.75f,0.75f,1.0f);
	if (GUI.Button(new Rect(210+30,0,70,18),"Add Keys",EditorStyles.toolbarButton)) {
		if (toolState == "drawkeys") toolState = "none";
		else toolState = "drawkeys";
	}
	GUI.color =new Color(1.0f,1.0f,1.0f,1.0f);
	
	if (toolState == "drawevents") GUI.color =new Color(0.75f,0.75f,0.75f,1.0f);
	if (GUI.Button(new Rect(280+30,0,70,18),"Add Events",EditorStyles.toolbarButton)) {
		if (toolState == "drawevents") toolState = "none";
		else toolState = "drawevents";
	}
	GUI.color =new Color(1.0f,1.0f,1.0f,1.0f);
	
	
	//Handle event selection dropdown.
	if (!(selectedClip.GetType().IsInstanceOfType(typeof(EventClip)))) {
		currentEventSelectionIndex = 0;
	}
	var list = new string[cutscene.events.Length+1];
	list[0] = "Select Event";
	var selEvent = -1;
	for (int i = 0; i < cutscene.events.Length; i++) {
		
		if (selectedClip == cutscene.events[i]) {
			selEvent = i;
		}
		var currentEventSelectionNewName = "";
		currentEventSelectionNewName = Cutscene.FormatTime(cutscene.events[i].startTime)+" - "+cutscene.events[i].name;
		list[i+1] = currentEventSelectionNewName;
	}
	if (selEvent != -1) {
		currentEventSelectionIndex = selEvent+1;
	}
	var oldEventIndex = currentEventSelectionIndex;
	currentEventSelectionIndex = EditorGUI.Popup(new Rect(310+70,0,125, 20),"",currentEventSelectionIndex,list,EditorStyles.toolbarPopup);
	if  (oldEventIndex != currentEventSelectionIndex) {
		if (currentEventSelectionIndex > 0) {
			selectedClip = cutscene.events[currentEventSelectionIndex-1];
			toolbarInt = 1;
			currentTime = (selectedClip as EventClip).startTime;
		}
		else {
			selectedClip = null;
		}
	}
	
	//Help
	if (GUI.Button(new Rect(position.width-35,0,35, 20),"Help",EditorStyles.toolbarButton)) {
		Application.OpenURL("http://www.aperturecutscene.com");
	}
	
	//Snap settings
	GUI.Label(new Rect(position.width-70-35-5-35,0,35, 20),"Snap:");
	currentGridIndex = EditorGUI.Popup(new Rect(position.width-70-35-5,0,70, 20),currentGridIndex,gridNames,EditorStyles.toolbarPopup);
	var currentGrid = gridValues[currentGridIndex];
	
	if (mouseButtonDown1) {
		toolState = "none";
		Repaint();
	}
	var pressedDelete = false;
	if (events.type == EventType.ValidateCommand) {
		if (events.commandName == "Delete") {
			pressedDelete = true;
		}
		if (Application.platform == RuntimePlatform.WindowsEditor) {
			if (events.commandName == "SoftDelete") {
				pressedDelete = true;
			}
		}
	}
	if (pressedDelete) {
		if (GUI.GetNameOfFocusedControl () == "Editor") {
			if (selectedClip.GetType().IsInstanceOfType(typeof(CurveClip))) {
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
			else if (selectedClip.GetType().IsInstanceOfType(typeof(EventClip))) {
				DeleteEvent(selectedClip);
			}
			Repaint();
		}
		events.Use();
	}
	
	var oldToolbarInt = toolbarInt;
	toolbarInt = GUI.Toolbar (new Rect (position.width-inspectorWidth, 18, inspectorWidth, 20), toolbarInt, toolbarStrings);
	if (oldToolbarInt != toolbarInt) {
		Repaint();
	}
	
	if (!cutscene) return;
	if (cutscene.curves.Length>0) cutscene.curves = new CurveClip[0];
	if (cutscene.events.Length>0) cutscene.events = new EventClip[0];
	if (cutscene.cutsceneEvents.Length>0) cutscene.cutsceneEvents = new CutsceneEventClip[0];
	
	//Base Colors
	GUI.color =new Color(0,0,0,0.25f);
	GUI.DrawTexture(new Rect(0,18,100,position.height),GetWhiteTex());
	GUI.color =new Color(1,1,1,1);
	
	GUI.color =new Color(1.0f,1.0f,1.0f,0.025f);
	GUI.DrawTexture(new Rect(100,18,position.width-100-inspectorWidth,position.height),GetWhiteTex());
	GUI.color =new Color(1,1,1,1);
	
	var timelineRect =new Rect(100,18,position.width-100-inspectorWidth-14,position.height-18);
	
	var rect =new Rect(0,0,0,0);
	rect.x = 100.0f;
	rect.y = 18;
	rect.width = position.width-inspectorWidth-rect.x;
	rect.height = 20;
	
	var workAreaMousePos = mousePos;
	workAreaMousePos.x -= rect.x;
	workAreaMousePos.y -= rect.y;
	var workAreaAbsMousePos = workAreaMousePos;
	workAreaAbsMousePos.x /= zoom;
	workAreaAbsMousePos.x += scrollPosition.x/zoom;
	
	//Do Timeline here
	
	rect.y += 20;
	rect.height = curveClipHeight;
	//Do Event track here
	
	rect.y += curveClipHeight;
	rect.width = position.width-inspectorWidth-rect.x;
	rect.height = position.height-rect.y;
	
	var workAreaWithoutScroll = rect;
	workAreaWithoutScroll.width -= 14;
	workAreaWithoutScroll.height -= 14;
	
	var totalHeight = cutscene.curves.Length*curveClipHeight;
	var totalWidth = cutscene.GetTotalTime()*zoom;
	var forceScrollHeight = (position.height-rect.y-14)+1;
	var forceScrollWidth = (rect.width-15)+1;
	//GUILayout.BeginArea(Rect(100,rect.y,position.width-100-inspectorWidth,position.height-rect.y));
	//for (i = 0; i < cutscene.curves.length; i++) {
	//	GUI.Box(Rect(0,(i*30)-scrollPosition.y,position.width-100-inspectorWidth,30),"");
	//}
	//GUILayout.EndArea();
	
	
	//Dark bar at edge of work area.
	GUI.color =new Color(0,0,0,0.4f);
	GUI.DrawTexture(new Rect(rect.x+rect.width-14,18,14,position.height),GetWhiteTex());
	GUI.color =new Color(1,1,1,1);
	
	if (mouseButton2 && !mouseButtonDown2 && rect.Contains(mousePos)) {
		scrollPosition -= events.delta*0.5f;
		Repaint();
	}
	scrollPosition = GUI.BeginScrollView(rect,scrollPosition,new Rect(0,0,Mathf.Max(forceScrollWidth,totalWidth),Mathf.Max(forceScrollHeight,totalHeight)), true, false);
	if (totalHeight < forceScrollHeight) {
		scrollPosition.y = 0;
	}
	if (totalWidth < forceScrollWidth) {
		//scrollPosition.x = 0;
	}
	
	float xAdd = -3;
	
	for (int i = 0; i < cutscene.curves.Length; i++) {
		
		GUI.color =new Color(1,1,1,1);
		GUI.Box(new Rect(0,(i*curveClipHeight),totalWidth,curveClipHeight),"");
		
		var clipLength = cutscene.curves[i].length*zoom;
		var clipStart = cutscene.curves[i].startTime*zoom;
		
		GUILayout.BeginArea(new Rect(clipStart,i*curveClipHeight,clipLength,curveClipHeight));
			
			for (int j = 0; j < cutscene.curves[i].animCurve.keys.Length; j++) {
				xAdd = -3;
				float otherXAdd = 0;
				if (j == 0) {
					otherXAdd = -3;
					xAdd = -1.0f;
				}
				else if (j == cutscene.curves[i].animCurve.keys.Length-1) {
					otherXAdd = 3;
					xAdd = -5.0f;
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
								var mouseDif = mousePos.x-mouseDownPos.x;
								Keyframe key = cutscene.curves[i].animCurve.keys[j];
								key.time = (draggingPos*zoom)+mouseDif;
								key.time /= zoom;
								
								if (gridValues[currentGridIndex] > 0) {
									var snapValue = Mathf.Round(key.time/gridValues[currentGridIndex])*gridValues[currentGridIndex];
									if (key.time != snapValue) {
										key.time = snapValue;
										if (j == cutscene.curves[i].animCurve.keys.Length-1) {
											key.time = Mathf.Max(key.time,0.1f);
											cutscene.curves[i].length = key.time;
											
										}
									}
								}
								cutscene.curves[i].animCurve.MoveKey(j,key);
							}
						}
						
				}
			}
			
			
			GUI.color =new Color(0,0,0,0);
			
			if (doubleClick) {
				EditorGUI.CurveField(new Rect(-100,0,clipLength+100,curveClipHeight),"", cutscene.curves[i].animCurve);
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
							var addKeyTime = (mousePos.x-100)/zoom;
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
					var mouseDif = mousePos.x-mouseDownPos.x;
					cutscene.curves[i].startTime = (draggingPos*zoom)+mouseDif;
					cutscene.curves[i].startTime /= zoom;
					
					if (gridValues[currentGridIndex] > 0) {
						var snapValue = Mathf.Round(cutscene.curves[i].startTime/gridValues[currentGridIndex])*gridValues[currentGridIndex];
						if (cutscene.curves[i].startTime != snapValue) {
							cutscene.curves[i].startTime = snapValue;
						}
					}
				}
				
			}
			
			
			if (EvalCurve(cutscene.curves[i])) {
				GUI.color = clipColors[Mathf.Max(Mathf.Min(cutscene.curves[i].colorIndex,clipColors.Length-1),0)];
			}
			else {
				GUI.color = clipErrorColor;
			}
			if (cutscene.curves[i] != selectedClip) {
				GUI.color *= new Color(0.75f,0.75f,0.75f,1f);
			}
			
			//GUI.color.a = 0.75;
			GUI.Button(new Rect(0,0,clipLength,curveClipHeight),"",skin.GetStyle("curveClipButton"));
			
			
			float maxValue = 0;
			float minValue = 0;
			List<Vector3> points = new List<Vector3>();
			
			for (float interpIndex = 0; interpIndex < cutscene.curves[i].animCurve.keys.Length+1; interpIndex += (1.0f/5.0f)) {
				var iTime = interpIndex/(cutscene.curves[i].animCurve.keys.Length);
				var v = cutscene.curves[i].animCurve.Evaluate(iTime*cutscene.curves[i].length);
				points.Add(new Vector3(iTime*cutscene.curves[i].length*zoom,v));
				maxValue = Mathf.Max(maxValue,v);
				minValue = Mathf.Min(minValue,v);
			}
			var valueDist = Mathf.Abs(minValue-maxValue);
			
			Handles.color =new Color(0,0,0,0.5f);
			var curvePointMult = (curveClipHeight-4);
			for (int j = 0; j < points.Count; j++) {
				if (j >= points.Count-1) continue;
				var value1 = points[j].y+(-minValue);
				value1 /= valueDist;
				var value2 = points[j+1].y+(-minValue);
				value2 /= valueDist;
				var point1 =new Vector3(points[j].x,2f+(1.0f-value1)*curvePointMult);
				var point2 =new Vector3(points[j+1].x,2f+(1.0f-value2)*curvePointMult);
				Handles.DrawAAPolyLine(point1,point2);
			}
			
			
			if (cutscene.curves[i].animCurve.keys.Length < 2) {
				//cutscene.curves[i].animCurve.AddKey(0,0);
				//cutscene.curves[i].animCurve.AddKey(cutscene.curves[i].length,1);
				//cutscene.curves[i].animCurve.SmoothTangents(0,1.0);
				//cutscene.curves[i].animCurve.SmoothTangents(1,1.0);
				cutscene.curves[i].animCurve = AnimationCurve.EaseInOut(0,0,cutscene.curves[i].length,1.0f);
			}
			
			var newKey = cutscene.curves[i].animCurve.keys[0];
			newKey.time = 0;
			cutscene.curves[i].animCurve.MoveKey(0, newKey);
			newKey = cutscene.curves[i].animCurve.keys[cutscene.curves[i].animCurve.keys.Length-1];
			newKey.time = cutscene.curves[i].length;
			cutscene.curves[i].animCurve.MoveKey(cutscene.curves[i].animCurve.keys.Length-1,newKey);

			
			for (int j = 0; j < cutscene.curves[i].animCurve.keys.Length; j++) {
				if (selectedClip == cutscene.curves[i] && j == selectedKeyframeIndex) {
					GUI.color =new Color(1.0f,0.7f,0.6f,1.0f);
				}
				else {
					GUI.color =new Color(0.3f,0.4f,0.5f,0.7f);
				}
				xAdd = -3;
				if (j == 0) {
					xAdd = -1.0f;
				}
				else if (j == cutscene.curves[i].animCurve.keys.Length-1) {
					xAdd = -5.0f;
				}
				GUI.Box(new Rect((cutscene.curves[i].animCurve.keys[j].time*zoom)+xAdd,2,6,16),"",skin.GetStyle("Key"));
				//GUI.DrawTexture(Rect((cutscene.curves[i].animCurve.keys[j].time*zoom)+xAdd,2,6,16),keyTex);
				GUI.color =new Color(1,1,1,1);
			}
			
		GUILayout.EndArea();
	}
	GUI.color =new Color(1,1,1,1);
	GUI.EndScrollView();
	
	//Event tract button
	GUI.color =new Color(0,0,0,0);
	if (GUI.Button(new Rect(100,38,position.width-100-inspectorWidth,curveClipHeight),"")) {
		if (toolState == "drawevents") {
			var addEventTime = (workAreaMousePos.x)/zoom;
			addEventTime += scrollPosition.x/zoom;
			addEventTime = Mathf.Min(addEventTime,cutscene.GetTotalTime());
			AddEventAtPos(addEventTime);
			addedAKey = true;
		}
		GUI.FocusControl("Editor");
	}
	GUI.color =new Color(1,1,1,1);
	
	if (events.isMouse && !addedAKey && (mouseButtonDown0 || mouseButtonDown1 || mouseButtonDown2)) {
		toolState = "none";
	}
	
	rect.x = 0;
	rect.y = 18;
	rect.width = 100.0f;
	rect.height = position.height-rect.y;
	
	GUI.color =new Color(0,0,0,0.4f);
	GUI.DrawTexture(new Rect(rect.width,rect.y,position.width-rect.width-inspectorWidth-14,20),GetWhiteTex());
	GUI.color =new Color(1,1,1,1);
	GUI.Box(new Rect(rect.width,rect.y,position.width-rect.width-inspectorWidth-14,20),"");
	
	GUILayout.BeginArea(rect);
	GUI.Box(new Rect(0,0,100,20),"");
	GUI.color =new Color(1,1,1,1);
	GUI.Label(new Rect(2,0,98,20),Cutscene.FormatTime(currentTime));
	GUILayout.EndArea();
	
	rect.y += 20;
	GUI.color =new Color(0,0,0,0.2f);
	GUI.DrawTexture(new Rect(rect.width,rect.y,position.width-rect.width-inspectorWidth-14,curveClipHeight),GetWhiteTex());
	GUI.color =new Color(1,1,1,1);
	GUI.Box(new Rect(rect.width,rect.y,position.width-rect.width-inspectorWidth-14,curveClipHeight),"");
	GUILayout.BeginArea(rect);
	//GUI.color = Color(0.5,0.5,0.5,1);
	GUI.Box(new Rect(0,0,100,curveClipHeight),"");
	GUI.color =new  Color(1,1,1,1);
	GUI.Label(new Rect(2,0,98,curveClipHeight),"Events");
	GUILayout.EndArea();
	
	//Draw events
	GUILayout.BeginArea(new Rect(100,38,position.width-100-inspectorWidth-14,curveClipHeight));
	for (int i = 0; i < cutscene.events.Length; i++) {
		var eventRect =new Rect((cutscene.events[i].startTime*zoom)-scrollPosition.x-3,2,6,16);
		GUI.color =new Color(0,0,0,0);
		
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
			 var mouseDif = mousePos.x-mouseDownPos.x;
			cutscene.events[i].startTime = draggingPos*zoom+mouseDif;
			cutscene.events[i].startTime /= zoom;
		}
		
		GUI.color =new  Color(0.3f,0.5f,0.4f,1.0f);
		if (selectedClip == cutscene.events[i]) {
			GUI.color =new Color(1.0f,0.9f,0.6f,1.0f);
		}
		GUI.Box(eventRect,"",skin.GetStyle("Key"));
		//GUI.DrawTexture(eventRect,keyTex);
	}
	GUI.color =new Color(1,1,1,1);
	GUILayout.EndArea();
	
	rect.y += curveClipHeight;
	
	GUILayout.BeginArea(rect);
	GUI.color =new Color(1,1,1,1);
	for (int i = 0; i < cutscene.curves.Length; i++) {
		var curveNameRect =new Rect(0,(i*curveClipHeight)-scrollPosition.y,100,curveClipHeight);
		var curveNamePupupRect = curveNameRect;
		curveNamePupupRect.x -= 100;
		curveNamePupupRect.width += 100;
		curveNamePupupRect.width -= 20;
		var mouseInsideNameRect = curveNameRect.Contains(new Vector2(mousePos.x,mousePos.y-rect.y));
		if (mouseInsideNameRect) {
			GUI.color =new Color(1,1,1,1);
		}
		else {
			GUI.color =new Color(0.5f,0.5f,0.5f,1);
		}
		GUI.Box(curveNameRect,"");
		GUI.color =new Color(0,0,0,0);
		cutscene.curves[i].colorIndex = EditorGUI.Popup(curveNamePupupRect,"",cutscene.curves[i].colorIndex,clipColorNames);
		GUI.color =new Color(1,1,1,1);
		GUI.Label(new Rect(2,((i*curveClipHeight)+0)-scrollPosition.y,98,curveClipHeight),cutscene.curves[i].name);
		if (mouseInsideNameRect) {
			//Debug.Log(cutscene.curves[i].name);
			var orderButtonRect = curveNameRect;
			orderButtonRect.x += 100-20;
			orderButtonRect.width = 20;
			orderButtonRect.height /= 2;
			var curveClip = cutscene.curves[i];
			GUI.color =new Color(0,0,0,0);
			if (GUI.Button(orderButtonRect,"u")) {
				if (i > 0) {
					cutscene.RemoveCurveClip(curveClip);
					cutscene.InsertCurveClip(i-1,curveClip);
				}
			}
			GUI.color =new Color(1,1,1,1);
			GUI.DrawTexture(orderButtonRect,moveClipUpTex);
			orderButtonRect.y += orderButtonRect.height;
			GUI.color =new Color(0,0,0,0);
			if (GUI.Button(orderButtonRect,"d")) {
				if (i < cutscene.curves.Length-1) {
					cutscene.RemoveCurveClip(curveClip);
					cutscene.InsertCurveClip(i+1,curveClip);
				}
			}
			GUI.color =new Color(1,1,1,1);
			GUI.DrawTexture(orderButtonRect,moveClipDownTex);
			
		}
	}
	GUILayout.EndArea();
	
	GUILayout.BeginArea(timelineRect);
	GUI.color =new Color(1,0.2f,0.2f,1);
	GUI.color =new Color(0.9f,0.25f,0.25f,1);
	GUI.DrawTexture(new Rect(((currentTime*zoom)-scrollPosition.x)-1,0,2,timelineRect.height-15),GetWhiteTex());
	GUI.color =new Color(1,1,1,1);
	GUI.Label(new Rect((currentTime*zoom)-scrollPosition.x,0,100,24),Cutscene.FormatTime(currentTime));
	GUI.color =new Color(0.8f,0.25f,0.2f,1);
	GUI.DrawTexture(new Rect(((currentTime*zoom)-scrollPosition.x)-6,0,12,6),timeMarkerArrowTex);
	GUI.color =new Color(1,1,1,1);
	
	GUILayout.EndArea();
	
	var shouldStopPreviewing = false;
	if (mouseButton0 && Rect(timelineRect).Contains(mouseDownPos)) {
		if (mouseDownPos.y > 18 && mouseDownPos.y < 18+20) {
			shouldStopPreviewing = true;
			var totalTime = cutscene.GetTotalTime();
			if (mousePos.x > 100 && mousePos.x < timelineRect.x+timelineRect.width) {
				currentTime = (mousePos.x-100)/zoom;
				currentTime += scrollPosition.x/zoom;
				currentTime = Mathf.Max(Mathf.Min(currentTime,totalTime),0);
			}
			else {
				if (mousePos.x <= 100) {
					scrollPosition.x += ((mousePos.x-100)/zoom)*20.0f;
					currentTime = Mathf.Max(((mousePos.x-100)+scrollPosition.x)/zoom,0);
				}
				if (mousePos.x >= timelineRect.x+timelineRect.width) {
					scrollPosition.x += ((mousePos.x-(timelineRect.x+timelineRect.width))/zoom)*20.0f;
					currentTime = Mathf.Min(((mousePos.x-100)+scrollPosition.x)/zoom,totalTime);
				}
			}
		}
	}
	
	if (!isPreviewing) {
		//if (event.type != EventType.MouseDown) {
			if (toolbarInt == 1) {
				if (selectedClip!=null) {
					if (selectedClip.GetType().IsInstanceOfType(typeof(CurveClip)) ) {
						if (selectedKeyframeIndex == -1)
						DrawCurveClipInspector();
						else
						DrawCurveKeyInspector();
					}
					//else if (selectedClip instanceof Keyframe) {
					//	DrawCurveKeyInspector();
					//}
					else if (selectedClip.GetType().IsInstanceOfType( typeof(EventClip))) {
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

public void DrawPreviewMessage() {
	var rect =new Rect(0,0,0,0);
	rect.x = position.width-inspectorWidth;
	rect.y = 40;
	rect.width = inspectorWidth;
	rect.height = position.height-rect.y;
	
	var totalHeight = 24.0*4.0;
	
	inspectorScrollPosition = GUI.BeginScrollView(rect,inspectorScrollPosition,new Rect(0,0,rect.width-16f,(float)totalHeight));
		GUILayout.BeginArea(new Rect(0,0,rect.width-16,rect.height));
		GUILayout.Label("Previewing cutscene.\nStop preview to continue editing.");
		GUILayout.EndArea();
	GUI.EndScrollView();
	
}

public void DrawCurveClipInspector() {
	var rect =new Rect(0,0,0,0);
	rect.x = position.width-inspectorWidth;
	rect.y = 40;
	rect.width = inspectorWidth;
	rect.height = position.height-rect.y;
	
	var totalHeight = 20.0*4.0;
	
	GUI.SetNextControlName("Inspector");
	var contentRect = EditorGUILayout.BeginVertical(GUILayout.MaxWidth(inspectorWidth-18));
	inspectorScrollPosition = GUI.BeginScrollView(rect,inspectorScrollPosition,contentRect);
		(selectedClip as CurveClip).name = EditorGUILayout.TextField((selectedClip as CurveClip).name);
		EditorGUILayout.Separator ();
		EditorGUILayout.CurveField("Edit Curve",(selectedClip as CurveClip).animCurve);
		//selectedClip.target = GUILayout.Button("Edit Curve",selectedClip.animCurve);
		if (!(selectedClip as CurveClip).target) {
			(selectedClip as CurveClip).ignoreTarget = EditorGUILayout.Toggle("Ignore Target",(selectedClip as CurveClip).ignoreTarget);
			if (!(selectedClip as CurveClip).ignoreTarget) {
				var r = EditorGUILayout.BeginVertical();
				GUI.color =new Color(1,0,0,0.25f);
				GUI.DrawTexture(r,GetWhiteTex());
				GUI.color +=new Color(0.5f,0.5f,0.5f,1);
				(selectedClip as CurveClip).target = EditorGUILayout.ObjectField("Target",(selectedClip as CurveClip).target,typeof(GameObject),true) as GameObject;
				EditorGUILayout.EndVertical();
				GUI.color =new Color(1,1,1,1);
			}
		}
		else {
			(selectedClip as CurveClip).target = EditorGUILayout.ObjectField("Target",(selectedClip as CurveClip).target,typeof(GameObject),true) as GameObject;
			if (!(selectedClip as CurveClip).target) {
				GUI.EndScrollView();
				EditorGUILayout.EndVertical();
				
				return;
			}
			
			EditorGUILayout.BeginHorizontal();
			GUILayout.FlexibleSpace();
			if (GUILayout.Button("Add extra target",GUILayout.ExpandWidth(false))) {
				var tmpSimpleArray = new GameObject[(selectedClip as CurveClip).extraTargets.Length+1];
				for (int i = 0; i < (selectedClip as CurveClip).extraTargets.Length; i++) {
					tmpSimpleArray[i] = (selectedClip as CurveClip).extraTargets[i];
				}
				(selectedClip as CurveClip).extraTargets = tmpSimpleArray;
			}
			EditorGUILayout.EndHorizontal();
			
			if ((selectedClip as CurveClip).extraTargets.Length>0) {
				(selectedClip as CurveClip).extraTargets = new GameObject[0];
			}
			if ((selectedClip as CurveClip).extraTargets.Length > 0)
				EditorGUILayout.Space();
			var deletedTarget = -1;
			for (int i = 0; i < (selectedClip as CurveClip).extraTargets.Length; i++) {
				(selectedClip as CurveClip).extraTargets[i] = EditorGUILayout.ObjectField("Extra Target "+i,(selectedClip as CurveClip).extraTargets[i],typeof(GameObject),true) as GameObject;
				EditorGUILayout.BeginHorizontal();
				GUILayout.FlexibleSpace();
				if (GUILayout.Button("Delete target "+i,GUILayout.ExpandWidth(false))) {
					deletedTarget = i;
				}
				EditorGUILayout.EndHorizontal();
				EditorGUILayout.Space();
			}
			if (deletedTarget != -1) {
				var tmpSimpleArray= new GameObject[(selectedClip as CurveClip).extraTargets.Length-1];
				int counter = 0;
				for (int i = 0; i < (selectedClip as CurveClip).extraTargets.Length; i++) {
					if (i == deletedTarget) continue;
					tmpSimpleArray[counter] = (selectedClip as CurveClip).extraTargets[i];
					counter++;
				}
				(selectedClip as CurveClip).extraTargets = tmpSimpleArray;
			}
			
			EditorGUILayout.Separator ();
			
			(selectedClip as CurveClip).updateMode = (CutsceneClipUpdateMode)EditorGUILayout.EnumPopup("Update Mode",(selectedClip as CurveClip).updateMode);
			
			var currentInt = 0;
			
			if ((selectedClip as CurveClip).updateMode == CutsceneClipUpdateMode.Action) {
				List<> actionFunctions = APIAccess.FindActionFunctionNames((selectedClip as CurveClip).target,["?"],false);
				List<> actions = actionFunctions[0];
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

public void DrawEventInspector(recursive:boolean) {
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

public void DrawCutsceneInspector() {
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

public void DrawCutsceneList() {
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

public void EvalCurve(curve:CurveClip):boolean {
	if (!curve.target && !curve.ignoreTarget) return false;
	return true;
}

public void DrawCurveKeyInspector() {
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

public void UpdateKeySafePos(key:CurveClipKey) {
	if (key.time < 0) {
		key.time = 0;
	}
	if (key.owner && key.time > key.owner.length) {
		key.time = key.owner.length;
	}
}

public void UpdateEventSafePos(event:EventClip) {
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

public List<Cutscene> GetCutscenes() {
	return FindObjectsOfType(Cutscene);
}

public void AddCurve() {
	if (selectedClip && selectedClip instanceof CurveClip) {
		selectedClip = cutscene.AddCurveClip(Cutscene.BuiltinIndexOf(cutscene.curves,selectedClip)+1);
		selectedClip.startTime = currentTime;
	}
	else {
		selectedClip = cutscene.AddCurveClip(cutscene.curves.length);
		selectedClip.startTime = currentTime;
	}
}

public void DeleteCurve() {
	if (!EditorUtility.DisplayDialog("Delete Curve?", "Are you sure you want to delete this curve?", "Yes", "No")) {
		return;
	}
	if (selectedClip && selectedClip instanceof CurveClip) {
		var lastSelectionIndex:int = Cutscene.BuiltinIndexOf(cutscene.curves,selectedClip);
		cutscene.RemoveCurveClip(selectedClip);
		selectedClip = null;
	}
}

public void AddCurveKeyAtPos(curveClip:CurveClip,pos:float) {
	selectedKeyframeIndex = curveClip.animCurve.AddKey(pos,curveClip.animCurve.Evaluate(pos));
	
	//selectedKeyframeIndex = -1;
}


public void DeleteCurveKey() {
	selectedClip.animCurve.RemoveKey(selectedKeyframeIndex);
	selectedKeyframeIndex = -1;
}

public void AddEventAtPos(pos:float) {
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

public void DeleteEvent(event:EventClip) {
	cutscene.DeleteEvent(event);
}

public void DrawBox(rect:Rect,borderColor:Color,color:Color) {
	var tColor:Color = GUI.color;
	GUI.color = borderColor;
	GUI.DrawTexture(rect,GetWhiteTex());
	GUI.color = color;
	GUI.DrawTexture(Rect(rect.x+1,rect.y+1,rect.width-2,rect.height-2),GetWhiteTex());
	GUI.color = tColor;
}

public void GetWhiteTex() {
	if (whiteTex) DestroyImmediate(whiteTex);
	if (!whiteTex) {
		whiteTex = Texture2D(1,1);
		whiteTex.SetPixel(0,0,Color(1,1,1,1));
		whiteTex.Apply();
		whiteTex.hideFlags = HideFlags.HideAndDontSave;
	}
	return whiteTex;
}

public void CreateNewCutscene() {
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

public void GetCutsceneControl() {
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
//#endif