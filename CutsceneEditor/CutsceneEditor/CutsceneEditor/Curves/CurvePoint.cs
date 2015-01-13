using UnityEngine;

[AddComponentMenu("")]

public class CurvePoint : MonoBehaviour
{
    public void OnDrawGizmos()
    {
        Gizmos.DrawIcon(transform.position, "Aperture_CurvePoint.tiff");
    }

}