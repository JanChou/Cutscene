using UnityEngine;

[AddComponentMenu("Cutscene/Actions/Set Material Color")]

[ExecuteInEditMode()]

[CutsceneEventOverrideNameAttribute("Set Material Color")]

class Action_SetMaterialColor : CutsceneAction
{
    bool useMaterialOnObject = true;
    int materialIndex = 0;
    Material material;
    string propertyName = "_Color";

    public void SetColor(Color value)
    {
        SetupMaterial();
        if (!material) return;
        if (!material.HasProperty(propertyName)) return;
        material.SetColor(propertyName, value);
    }

    //#if !UNITY_FLASH
    [CutsceneActionAttribute("Set Channel R")]
    //#endif
    public void SetChannelR(float value)
    {
        SetupMaterial();
        if (!material) return;
        if (!material.HasProperty(propertyName)) return;
        Color c = material.GetColor(propertyName);
        c.r = value;
        material.SetColor(propertyName, c);
    }

    //#if !UNITY_FLASH
    [CutsceneActionAttribute("Set Channel G")]
    //#endif
    public void SetChannelG(float value)
    {
        SetupMaterial();
        if (!material) return;
        if (!material.HasProperty(propertyName)) return;
        Color c = material.GetColor(propertyName);
        c.g = value;
        material.SetColor(propertyName, c);
    }

    //#if !UNITY_FLASH
    [CutsceneActionAttribute("Set Channel B")]
    //#endif
    public void SetChannelB(float value)
    {
        SetupMaterial();
        if (!material) return;
        if (!material.HasProperty(propertyName)) return;
        Color c = material.GetColor(propertyName);
        c.b = value;
        material.SetColor(propertyName, c);
    }

    //#if !UNITY_FLASH
    [CutsceneActionAttribute("Set Channel A")]
    //#endif
    public void SetChannelA(float value)
    {
        SetupMaterial();
        if (!material) return;
        if (!material.HasProperty(propertyName)) return;
        Color c = material.GetColor(propertyName);
        c.a = value;
        material.SetColor(propertyName, c);
    }

    [CutsceneEventExclude()]
    public void SetupMaterial()
    {
        if (useMaterialOnObject)
        {
            if (!Application.isPlaying)
            {
                if (renderer && renderer.sharedMaterials.length > materialIndex)
                {
                    material = renderer.sharedMaterials[materialIndex];
                }
            }
            else
            {
                if (renderer && renderer.materials.length > materialIndex)
                {
                    material = renderer.materials[materialIndex];
                }
            }
        }
    }
}

