using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using UnityEngine;

public class Curve : MonoBehaviour
{

    [HideInInspector]
    public Transform[] points;

    [AddComponentMenu("Cutscene/Curve")]

    [ExecuteInEditMode()]

    public void Update()
    {
        UpdatePoints();
    }

    [CutsceneEventExclude()]
    public void UpdatePoints()
    {
        if (transform.childCount <= 0)
        {
            var newObject = new GameObject("Point0");
            newObject.AddComponent(typeof(CurvePoint));
            newObject.transform.parent = transform;
            newObject.transform.localPosition = new Vector3(0, 0, 0);
        }
        List<Transform> tmpArray = new List<Transform>();
        //var transforms:Transform[] = gameObject.GetComponentsInChildren(Transform);
        foreach (Transform t in transform)
        {
            tmpArray.Add(t);
            break;
        }
        foreach (Transform t in transform)
        {
            tmpArray.Add(t);
        }
        tmpArray.Add(tmpArray[tmpArray.Count - 1]);
        int i = 0;
        foreach (Transform t in tmpArray)
        {
            if (i == 0)
            {
                i++;
                continue;
            }
            if (i == tmpArray.Count - 1)
            {
                i++;
                continue;
            }
            if (t == gameObject.transform)
            {
                i++;
                continue;
            }
            var newName = "Point" + i;
            var currentName = t.gameObject.name;
            if (currentName != newName)
            {
                t.gameObject.name = newName;
            }
            i++;
        }
        Transform[] tmpPoints = tmpArray.ToArray<Transform>();
        if (tmpPoints != points)
        {
            points = tmpPoints;
        }
    }

    [CutsceneEventExclude()]
    public void OnDrawGizmos()
    {
        if (points.Length == 0) return;
        if (points.Length < 3) return;
        var lastPos = transform.position;
        var isFirst = true;
        lastPos = points[0].position;
        Gizmos.color = new Color(0, 0.25f, 0.4f, 0.75f);
        for (int i = 0; i < points.Length * 8; i++)
        {
            var p = points[i / 8];
            //if (p == transform) continue;
            float ratio = i / (points.Length * 8);
            Vector3 pos = GetPosition(ratio);
            if (!isFirst)
            {
                Gizmos.DrawLine(lastPos, pos);
            }
            lastPos = pos;
            isFirst = false;
        }
    }

    [CutsceneEventExclude()]
    public Vector3 GetForwardNormal(float p, float sampleDist)
    {
        float curveLength = GetLength();
        Vector3 pos = GetPosition(p);
        Vector3 frontPos = GetPosition(p + (sampleDist / curveLength));
        Vector3 backPos = GetPosition(p - (sampleDist / curveLength));
        Vector3 frontNormal = (frontPos - pos).normalized;
        Vector3 backNormal = (backPos - pos).normalized;
        Vector3 normal = Vector3.Slerp(frontNormal, -backNormal, 0.5f);
        normal.Normalize();
        return normal;
    }

    public Vector3 GetPosition(float pos)
    {
        return GetPosition(pos, true);
    }

    [CutsceneEventExclude()]
    public Vector3 GetPosition(float pos, bool clamp)
    {
        if (clamp)
        {
            pos = Mathf.Clamp(pos, 0, 1.0f);
        }
        try
        {
            var numSections = points.Length - 3;
            if (numSections <= 0) return points[0].position;
            var currPt = Mathf.Min(Mathf.FloorToInt(pos * numSections), numSections - 1);
            float u = pos * numSections - currPt;
            var a = points[currPt].position;
            var b = points[currPt + 1].position;
            var c = points[currPt + 2].position;
            var d = points[currPt + 3].position;
            return 0.5f * ((-a + 3.0f * b - 3.0f * c + d) * (u * u * u) + (2.0f * a - 5.0f * b + 4.0f * c - d) * (u * u) + (-a + c) * u + 2.0f * b);
        }
        catch (Exception e)
        {
            return new Vector3(0, 0, 0);
        }
    }

    [CutsceneEventExclude()]
    public float GetLength()
    {
        if (points.Length < 3) return 0;
        float l = 0;
        for (int i = 1; i < points.Length - 2; i++)
        {
            if (!points[i] || !points[i + 1]) break;
            l += Vector3.Distance(points[i].position, points[i + 1].position);
        }
        return l;
    }

    //Statics
    [CutsceneEventExclude()]
    public static Vector3 Interpolate(Vector3[] p, float pos)
    {
        var numSections = p.Length - 3;
        if (numSections <= 0) return new Vector3(0, 0, 0);
        var currPt = Mathf.Min(Mathf.FloorToInt(pos * numSections), numSections - 1);
        float u = pos * numSections - currPt;
        var a = p[currPt];
        var b = p[currPt + 1];
        var c = p[currPt + 2];
        var d = p[currPt + 3];
        return 0.5f * ((-a + 3.0f * b - 3.0f * c + d) * (u * u * u) + (2.0f * a - 5.0f * b + 4.0f * c - d) * (u * u) + (-a + c) * u + 2.0f * b);
    }

}