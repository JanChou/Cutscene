using UnityEngine;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;

public class Cutscene : MonoBehaviour
{
    public string cutsceneName = "Cutscene01";
    public bool playOnStart = false;
    public bool loop = false;
    public int loopCount = 0;
    public bool resetOnStop = false;
    public bool resetPlayCountOnStop = true;
    public CurveClip[] curves;
    public EventClip[] events = new EventClip[0];
    public CutsceneEventClip[] cutsceneEvents;

    [HideInInspector]
    public float startTime = 0;
    [HideInInspector]
    public bool playing = false;
    [HideInInspector]
    public bool playReverse = false;
    [HideInInspector]
    public List<CurveClip> finishedCurves = new List<CurveClip>();
    [HideInInspector]
    public List<Eventclip> finishedEvents = new List<Eventclip>();
    [HideInInspector]
    public List<CutsceneEventClip> finishedCutsceneEvents = new List<CutsceneEventClip>();
    [HideInInspector]
    public int totalPlays = 0;
    [HideInInspector]
    public bool doneStartReset = false;

    public static List<Camera> cameraCache = new List<Camera>();


    public List<string> functionNames = new List<string>();
    public List<CurveClip> currentStaticClips = new List<CurveClip>();
    public List<float> currentValues = new List<float>();
    public List<bool> timeIsOverClipValues = new List<bool>();
    public static bool timeIsOverCurrentClip = false;


    [AddComponentMenu("Cutscene/Cutscene")]

    [CutsceneEventExclude()]
    public void Awake()
    {
        UpdateCutscene(0, false, false);
        UpdateCutscene(0, false, true);
    }

    [CutsceneEventExclude()]
    public void Start()
    {
        Cutscene.cameraCache = ((Camera[])FindObjectsOfType(typeof(Camera))).ToList<Camera>();
        DisableAllOverrideCameras();
        if (playOnStart)
        {
            Play();
        }
    }

    public void DisableAllOverrideCameras()
    {
        for (int i = 0; i < curves.Length; i++)
        {
            SetOverrideCameraState(curves[i], false);
        }
    }

    public void SetOverrideCameraState(CurveClip clip, bool state)
    {
        if (!clip.activeCamera) return;

        clip.activeCamera.enabled = state;
        if (state)
        {
            clip.activeCamera.depth = 10.0f;
        }
        else
        {
            clip.activeCamera.depth = -10.0f;
        }
    }

    [CutsceneEventExclude()]
    public void FixUpdateMode()
    {
        for (int i = 0; i < curves.Length; i++)
        {
            if (curves[i].updateEvent == "No Valid Events Found")
            {
                curves[i].updateMode = CutsceneClipUpdateMode.DirectVarAccess;
                continue;
            }
        }
    }

    [CutsceneEventExclude()]
    public void Update()
    {
        if (!playing) return;
        float totalTime = GetTotalTime();
        if (Time.timeSinceLevelLoad > startTime + totalTime)
        {
            if (playReverse)
            {
                UpdateCutscene(0, true, false);
                UpdateCutscene(0, true, true);
                Stop();
            }
            else
            {
                UpdateCutscene(Time.timeSinceLevelLoad - startTime, true, false);
                UpdateCutscene(Time.timeSinceLevelLoad - startTime, true, true);
                playing = false;
                if (loop && (loopCount <= 0 || totalPlays < loopCount))
                {
                    Play();
                    startTime += Time.deltaTime;
                }
                else
                {
                    Stop();
                }
            }
        }
        else
        {
            if (playReverse)
            {
                UpdateCutscene(totalTime - (Time.timeSinceLevelLoad - startTime), true, false);
                UpdateCutscene(totalTime - (Time.timeSinceLevelLoad - startTime), true, true);
            }
            else
            {
                UpdateCutscene(Time.timeSinceLevelLoad - startTime, true, false);
                UpdateCutscene(Time.timeSinceLevelLoad - startTime, true, true);
            }
        }
    }

    [CutsceneEventExclude()]
    public void UpdateCutscene(float time, bool triggerEvents, bool onlyOverClip) {
	List<CurveClip> currentClips = new List<CurveClip>();
	float totalTime = GetTotalTime();
	currentClips = curves.ToList<CurveClip>();
	
	functionNames = new List<string>();
	currentStaticClips = new List<CurveClip>();
	currentValues = new List<float>();
	timeIsOverClipValues = new List<bool>();
	
	time = Mathf.Max(0,time);
	time = Mathf.Min(totalTime,time);
	if (time > totalTime) {
		Debug.Log("time > GetTotalTime()");
	}
	for (int i = 0; i < currentClips.Count; i++) {
		var currentClip = currentClips[i] as CurveClip;
		if (currentClip==null) continue;
		
		var isTimeOverClip = false;
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
		
		var relativeClipTime = (time)-currentClip.startTime;
		var currentValue = currentClip.GetValue(relativeClipTime);
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
				var fName = currentClip.updateEvent;
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
						if (currentClip.extraTargets.Length>0) {
							foreach (var at in currentClip.extraTargets) {
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
					
					if (currentClip.extraTargets.Length>0) {
						foreach (var at in currentClip.extraTargets) {
							if (!at) continue;
							SetDirectVarValue(currentClip,at,currentValue);
						}
					}
				}
				currentClip.lastValue = currentValue;
			}
		}
		else if (!currentClip.ignoreTarget){
			if (Application.isPlaying) {
				Debug.Log("Warning: Tried to play CurveClip "+currentClip.name+" that has no target set.");
			}
		}
	}
	
	if (!triggerEvents) return;
	
	EventClip[] theseEvents = GetCurrentEvents(time).ToArray<EventClip>();
	//Events
	
	if (events.Length > 0) {
		//theseEvents = GetCurrentEvents(time);
		foreach (var e in theseEvents) {
			if (e.target) {
				//var eventMessage:String = "";
				MethodInfo method = GetIndexedMethod(e.component,e.targetFunction,e.paramVariationIndex);
				if (method!=null) {
					if (e.component != null) {
						Object[] params = new Object[e.params.length];
						for (int epi = 0; epi < e.params.length; epi++) {
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

    public bool SetDirectVarValue(CurveClip curveClip, System.Object baseObject, float newValue)
    {
        var parts = curveClip.updateEvent.Split("."[0]);
        var finalPart = parts[parts.Length - 1];

        System.Object lastObj = baseObject;
        //Debug.Log(lastObj);
        var lastPart = "";
        var isRecognizedType = false;
        try
        {
            for (int i = 1; i < parts.Length; i++)
            {
                var thisPart = parts[i];

                System.Object newObj = GetPropertyOrField(lastObj, thisPart);
                //return false;
                if (i < parts.Length - 1)
                {

                    if (newObj.GetType().ToString() == "UnityEngine.Vector2")
                    {
                        Vector2 newVector2 = (Vector2)newObj;
                        isRecognizedType = true;

                        if (finalPart == "x")
                        {
                            newVector2.x = newValue;
                        }
                        if (finalPart == "y")
                        {
                            newVector2.y = newValue;
                        }
                        SetPropertyOrField(lastObj, thisPart, newVector2);
                    }


                    //Debug.Log(newObj.GetType().ToString());
                    if (newObj.GetType().ToString() == "UnityEngine.Vector3")
                    {

                        Vector3 newVector3 = (Vector3)newObj;
                        isRecognizedType = true;

                        if (finalPart == "x")
                        {
                            newVector3.x = newValue;
                        }
                        if (finalPart == "y")
                        {
                            newVector3.y = newValue;
                        }
                        if (finalPart == "z")
                        {
                            newVector3.z = newValue;
                        }
                        SetPropertyOrField(lastObj, thisPart, newVector3);

                    }


                    if (newObj.GetType().ToString() == "UnityEngine.Vector4")
                    {
                        Vector4 newVector4 = (Vector4)newObj;
                        isRecognizedType = true;

                        if (finalPart == "x")
                        {
                            newVector4.x = newValue;
                        }
                        if (finalPart == "y")
                        {
                            newVector4.y = newValue;
                        }
                        if (finalPart == "z")
                        {
                            newVector4.z = newValue;
                        }
                        if (finalPart == "w")
                        {
                            newVector4.w = newValue;
                        }
                        SetPropertyOrField(lastObj, thisPart, newVector4);
                    }
                    if (newObj.GetType().ToString() == "UnityEngine.Rect")
                    {
                        Rect newRect = (Rect)newObj;
                        isRecognizedType = true;

                        if (finalPart == "x")
                        {
                            newRect.x = newValue;
                        }
                        if (finalPart == "y")
                        {
                            newRect.y = newValue;
                        }
                        if (finalPart == "width")
                        {
                            newRect.width = newValue;
                        }
                        if (finalPart == "height")
                        {
                            newRect.height = newValue;
                        }
                        SetPropertyOrField(lastObj, thisPart, newRect);
                    }


                    lastObj = newObj;
                }
                lastPart = parts[i];
                if (isRecognizedType)
                {
                    break;
                }
            }
            if (!isRecognizedType)
            {
                SetPropertyOrField(lastObj, lastPart, newValue);
            }
        }
        catch (System.Exception err)
        {
            return false;
        }
        return true;
    }

    [CutsceneEventExclude()]
    public System.Object GetPropertyOrField(System.Object containingObject, string propertyName)
    {
        if (containingObject == null) return null;

        System.Type t = containingObject.GetType();

        string tmpStr;
        System.Reflection.PropertyInfo p = t.GetProperty(propertyName + "asd");

        var hasProperty = false;
        System.Reflection.PropertyInfo[] propertyInfos = t.GetProperties();
        foreach (System.Reflection.PropertyInfo prop in propertyInfos)
        {
            if (prop.Name == propertyName)
            {
                hasProperty = true;
                break;
            }
        }


        if (hasProperty)
        {
            return t.InvokeMember(propertyName, BindingFlags.GetProperty, null, containingObject, null);
        }
        //return null;

        System.Reflection.FieldInfo f = t.GetField(propertyName);
        var hasField = false;
        var fieldInfos = t.GetFields();
        foreach (var field in fieldInfos)
        {
            if (field.Name == propertyName)
            {
                hasField = true;
                break;
            }
        }

        if (hasField)
        {
            return t.InvokeMember(propertyName, BindingFlags.GetField, null, containingObject, null);
        }
        return null;
    }

    [CutsceneEventExclude()]
    public void SetPropertyOrField(System.Object containingObject, string propertyName, System.Object newValue)
    {
        if (containingObject == null) return;
        var t = containingObject.GetType();
        string tmpStr;
        var p = t.GetProperty(propertyName);

        var hasProperty = false;
        var propertyInfos = t.GetProperties();
        foreach (var prop in propertyInfos)
        {
            if (prop.Name == propertyName)
            {
                hasProperty = true;
                break;
            }
        }
        if (hasProperty)
        {
            p.SetValue(containingObject, newValue, null);
            return;
        }

        var f = t.GetField(propertyName);
        var hasField = false;
        var fieldInfos = t.GetFields();
        foreach (var field in fieldInfos)
        {
            if (field.Name == propertyName)
            {
                hasField = true;
                break;
            }
        }
        if (hasField)
        {
            f.SetValue(containingObject, newValue);
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

    [CutsceneEventExclude()]
    public MethodInfo GetIndexedMethod<T>(string name, int index)
    {
        var methodInfos = typeof(T).GetMethods();
        List<MethodInfo> methods = new List<MethodInfo>();
        for (int i = 0; i < methodInfos.Length; i++)
        {
            if (methodInfos[i].Name == name)
            {
                methods.Add(methodInfos[i]);
            }
        }
        if (index < 0 || index >= methods.Count)
        {
            return null;
        }
        return methods[index];
    }


    public void Play()
    {
        if (playing) return;
        startTime = Time.timeSinceLevelLoad;
        playing = true;
        playReverse = false;
        finishedEvents = new List<Eventclip>();
        finishedCutsceneEvents = new List<CutsceneEventClip>();
        totalPlays++;
    }

    public void Stop()
    {
        playing = false;
        playReverse = false;
        finishedEvents = new List<Eventclip>();
        if (resetPlayCountOnStop)
        {
            totalPlays = 0;
        }
        if (resetOnStop)
        {
            UpdateCutscene(0, false, false);
            UpdateCutscene(0, false, true);
        }
    }

    public void Rewind()
    {
        var currentTime = Time.timeSinceLevelLoad - startTime;
        currentTime = Mathf.Max(0, Mathf.Min(currentTime, GetTotalTime()));

        Stop();
        Play();
        startTime -= GetTotalTime() - currentTime;
        playReverse = true;

        for (int i = 0; i < events.Length; i++)
        {
            if (events[i].startTime > currentTime)
            {
                finishedEvents.Remove(events[i]);
                finishedEvents.Add(events[i]);
            }
        }

        if (Time.timeSinceLevelLoad - startTime >= GetTotalTime())
        {
            UpdateCutscene(0, true, false);
            UpdateCutscene(0, true, true);
            Stop();
        }
    }

    [CutsceneEventExclude()]
    public float GetTotalTime()
    {
        float t = 0;
        foreach (var c in curves)
        {
            if (t < c.startTime + c.length)
            {
                t = c.startTime + c.length;
            }
        }
        return t;
    }

    [CutsceneEventExclude()]
    public List<CurveClip> GetCurrentCurveClips(float time)
    {
        List<CurveClip> clips = new List<CurveClip>();
        foreach (var c in curves)
        {
            if (time >= c.startTime && time <= c.startTime + c.length)
            {
                clips.Add(c);
            }
        }
        return clips;
    }

    [CutsceneEventExclude()]
    public List<EventClip> GetCurrentEvents(float time)
    {
        List<EventClip> clips = new List<EventClip>();
        if (!playReverse)
        {
            for (int i = 0; i < events.Length; i++)
            {
                if (time >= events[i].startTime)
                {
                    if (!IsInArray(finishedEvents, events[i]))
                        clips.Add(events[i]);
                }
            }
        }
        else
        {
            for (i = 0; i < events.Length; i++)
            {
                if (time <= events[i].startTime)
                {
                    if (!IsInArray(finishedEvents, events[i]))
                        clips.Add(events[i]);
                }
            }
        }
        return clips;
    }

    [CutsceneEventExclude()]
    public List<CutsceneEventClip> GetCurrentCutsceneEvents(float time)
    {
        List<CutsceneEventClip> clips = new List<CutsceneEventClip>();
        for (int i = 0; i < cutsceneEvents.Length; i++)
        {
            if (time >= cutsceneEvents[i].startTime)
            {
                if (!IsInArray(finishedCutsceneEvents, cutsceneEvents[i]))
                    clips.Add(cutsceneEvents[i]);
            }
        }
        return clips;
    }

    [CutsceneEventExclude()]
    public CurveClip AddCurveClip(int pos)
    {
        pos = Mathf.Max(Mathf.Min(pos, curves.Length), 0);
        List<CurveClip> tmp = new List<CurveClip>();
        for (int i = 0; i < pos; i++)
        {
            tmp.Add(curves[i]);
        }
        var newClip = new CurveClip();
        tmp.Add(newClip);
        for (int i = pos; i < curves.Length; i++)
        {
            tmp.Add(curves[i]);
        }
        curves = tmp.ToArray<CurveClip>();
        newClip.Init();
        return newClip;
    }
    [CutsceneEventExclude()]
    public CurveClip InsertCurveClip(int pos, CurveClip newClip)
    {
        pos = Mathf.Max(Mathf.Min(pos, curves.Length), 0);
        List<CurveClip> tmp = new List<CurveClip>();
        for (int i = 0; i < pos; i++)
        {
            tmp.Add(curves[i]);
        }

        tmp.Add(newClip);
        for (int i = pos; i < curves.Length; i++)
        {
            tmp.Add(curves[i]);
        }
        curves = tmp.ToArray<CurveClip>();
        newClip.Init();
        return newClip;
    }

    [CutsceneEventExclude()]
    public void RemoveCurveClip(CurveClip toRemove)
    {
        List<CurveClip> tmp = new List<CurveClip>();
        for (int i = 0; i < curves.Length; i++)
        {
            if (curves[i] != toRemove)
            {
                tmp.Add(curves[i]);
            }
        }
        curves = tmp.ToArray<CurveClip>();
    }

    [CutsceneEventExclude()]
    public EventClip AddEvent(EventClip newEvent)
    {
        List<EventClip> tmp = events.ToList<EventClip>();
        //for (i = 0; i < events.length; i++) {
        //	tmp.Add(events[i]);
        //}
        tmp.Add(newEvent);
        events = tmp.ToArray<EventClip>();
        return newEvent;
    }

    [CutsceneEventExclude()]
    public void DeleteEvent(EventClip _event)
    {
        List<EventClip> tmp = events.ToList<EventClip>();
        tmp.Remove(_event);
        events = tmp.ToArray<EventClip>();
    }

    [CutsceneEventExclude()]
    public static int BuiltinIndexOf(List<Object> a, Object value)
    {
        for (int i = 0; i < a.Count; i++)
        {
            if (a[i] == value)
            {
                return i;
            }
        }
        return -1;
    }

    [CutsceneEventExclude()]
    public static void SetActiveCamera(Camera cam)
    {

        //if (!cam) return;

        //for (c in cameraCache) {
        //	c.enabled = false;
        //}
        //cam.enabled = true;
    }

    [CutsceneEventExclude()]
    public static bool IsInArray(List<Object> a, Object v)
    {
        foreach (var i in a)
        {
            if (i == v) return true;
        }
        return false;
    }

    [CutsceneEventExclude()]
    public static string FormatTime(float time)
    {
        int mins = (int)Mathf.Floor(time / 60);
        int seconds = (int)Mathf.Repeat(time, 60);
        int miliSeconds = (int)Mathf.Repeat(time * 100.0f, 100.0f);
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

    [CutsceneEventExclude()]
    public static Cutscene Find(string n)
    {
        Cutscene[] cutscenes = (Cutscene[])FindObjectsOfType(typeof(Cutscene));
        Cutscene cutscene = null;
        foreach (var c in cutscenes)
        {
            if (c.cutsceneName == n)
            {
                cutscene = c;
            }
        }
        return cutscene;
    }

}