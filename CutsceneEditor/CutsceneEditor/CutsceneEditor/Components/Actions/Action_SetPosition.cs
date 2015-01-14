using UnityEngine;

[AddComponentMenu("Cutscene/Actions/Set Position")]

[ExecuteInEditMode()]

[CutsceneEventOverrideNameAttribute("Set Position")]

class Action_SetPosition : CutsceneAction
{

    public void SetPosition(Vector3 position)
    {
        if (transform.position != position)
            transform.position = position;
    }
    public void SetPosition(Transform transformPosition)
    {
        if (transform.position != transformPosition.position)
            transform.position = transformPosition.position;
    }

    //#if !UNITY_FLASH
    [CutsceneActionAttribute("Set Position X")]
    //#endif
    public void SetPositionX(float value)
    {
        if (transform.position.x != value)
            transform.position = new Vector3(value, transform.position.y, transform.position.z);
    }

    //#if !UNITY_FLASH
    [CutsceneActionAttribute("Set Position Y")]
    //#endif
    public void SetPositionY(float value)
    {
        if (transform.position.y != value)
            transform.position = new Vector3(transform.position.x, value, transform.position.z);
    }

    //#if !UNITY_FLASH
    [CutsceneActionAttribute("Set Position Z")]
    //#endif
    public void SetPositionZ(float value)
    {
        if (transform.position.z != value)
            transform.position = new Vector3(transform.position.x, transform.position.y, value);
    }
}

