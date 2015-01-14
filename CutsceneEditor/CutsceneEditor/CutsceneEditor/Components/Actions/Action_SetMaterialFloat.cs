using UnityEngine;

[AddComponentMenu("Cutscene/Actions/Set Material Float")]

[ExecuteInEditMode()]

[CutsceneEventOverrideNameAttribute("Set Material Float")]

public class Action_SetMaterialFloat : CutsceneAction
{
    public bool useMaterialOnObject = true;
    public int materialIndex = 0;
    public Material material;
    public string propertyName = "_MyFloat";

    //#if !UNITY_FLASH
    [CutsceneActionAttribute("Set Float")]
    //#endif
    public void SetFloat(float value)
    {
        if (!material) return;
        if (!material.HasProperty(propertyName)) return;
        material.SetFloat(propertyName, value);
    }

    [CutsceneEventExclude()]
    public void SetupMaterial()
    {
        if (useMaterialOnObject)
        {
            if (!Application.isPlaying)
            {
                if (renderer && renderer.sharedMaterials.Length > materialIndex)
                {
                    material = renderer.sharedMaterials[materialIndex];
                }
            }
            else
            {
                if (renderer && renderer.materials.Length > materialIndex)
                {
                    material = renderer.materials[materialIndex];
                }
            }
        }
    }
}

