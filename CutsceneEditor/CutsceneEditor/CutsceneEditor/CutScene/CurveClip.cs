using UnityEngine;
using System.Linq;
using System.Collections.Generic;
public enum CutsceneClipUpdateMode {Action,DirectVarAccess,Disable};

class CurveClip : System.Object
{
    public string name = "curve clip";
    public GameObject target;
    public GameObject[] extraTargets;
    public Component targetComponent;
    public CutsceneAction targetAction;
    public Camera activeCamera;
    public float startTime = 0;
    public float length = 1.0f;
    public bool smoothKeys = false;
    public string updateEvent = "";
    public string expression = "";
    public float lastValue = -Mathf.Infinity;
    public bool usePreValue = false;
    public float preValue = 0;
    public bool usePostValue = false;
    public float postValue = 0;
    public bool activeCalculateOnly = false;
    public CutsceneClipUpdateMode updateMode = CutsceneClipUpdateMode.Action;
    public int colorIndex = 0;
    public bool ignoreTarget = false;

    public CurveClipCustomProperty[] customProperties = new CurveClipCustomProperty[0];

    public AnimationCurve animCurve = new AnimationCurve();

    public CurveClip()
    {

    }

    public void Init()
    {

    }

    public float GetValue(float pos)
    {
        var v = animCurve.Evaluate(pos);
        return v;
    }

    public void SetCustomProperty(string propName, Object value)
    {
        for (int i = 0; i < customProperties.Length; i++)
        {
            if (customProperties[i].name == propName)
            {
                customProperties[i].value = value as UnityEngine.Object;
                return;
            }
        }
        //Not found so add it at the end
        var p = customProperties.ToList<CurveClipCustomProperty>();
        CurveClipCustomProperty newProp = new CurveClipCustomProperty();
        newProp.name = propName;
        newProp.value = value as UnityEngine.Object;
        p.Add(newProp);
        customProperties = p.ToArray<CurveClipCustomProperty>();
    }

    public Object GetCustomProperty(string propName)
    {
        for (int i = 0; i < customProperties.Length; i++)
        {
            if (customProperties[i].name == propName)
            {
                return customProperties[i].value;
            }
        }
        return null;
    }

    public void ClearCustomProperties()
    {
        customProperties = new CurveClipCustomProperty[0];
    }

}
