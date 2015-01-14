using UnityEngine;

public class EventClip : System.Object
{
    public string name = "event clip";
    public float startTime = 0;
    public GameObject target;
    public Component component;
    public string targetFunction = "";
    public int paramVariationIndex = 0;
    public EventParam[] param;// = new EventParam[0];
    public bool guiExpanded = true;
}
