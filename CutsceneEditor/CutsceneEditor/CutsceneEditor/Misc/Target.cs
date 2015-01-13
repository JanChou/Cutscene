using UnityEngine;

[AddComponentMenu("Cutscene/Misc/Target")]
public class Target : MonoBehaviour
{
    public void OnDrawGizmos()
    {
        Gizmos.DrawIcon(transform.position, "Aperture_Target.tiff");
    }
}
