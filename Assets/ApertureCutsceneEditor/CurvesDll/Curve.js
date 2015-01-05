#pragma strict
#pragma downcast
@HideInInspector var points:Transform[];

@script AddComponentMenu("Cutscene/Curve")

@script ExecuteInEditMode()

function Update() {
	UpdatePoints();
}

@CutsceneEventExclude()
function UpdatePoints() {
	if (transform.GetChildCount() <= 0) {
		var newObject:GameObject = GameObject("Point0");
		newObject.AddComponent(CurvePoint);
		newObject.transform.parent = transform;
		newObject.transform.localPosition = Vector3(0,0,0);
	}
	var tmpArray:Array = new Array();
	//var transforms:Transform[] = gameObject.GetComponentsInChildren(Transform);
	for (var t:Transform in transform) {
		tmpArray.Add(t);
		break;
	}
	for (var t:Transform in transform) {
		tmpArray.Add(t);
	}
	tmpArray.Add(tmpArray[tmpArray.length-1]);
	var i:int = 0;
	for (var t:Transform in tmpArray) {
		if (i == 0) {
			i++;
			continue;
		}
		if (i == tmpArray.length-1) {
			i++;
			continue;
		}
		if (t == gameObject.transform) {
			i++;
			continue;
		}
		var newName:String = "Point"+i;
		var currentName:String = t.gameObject.name;
		if (currentName != newName) {
			t.gameObject.name = newName;
		}
		i++;
	}
	var tmpPoints:Transform[] = tmpArray.ToBuiltin(Transform);
	if (tmpPoints != points) {
		points = tmpPoints;
	}
}

@CutsceneEventExclude()
function OnDrawGizmos() {
	if (!points) return;
	if (points.length < 3) return;
	var lastPos:Vector3 = transform.position;
	var isFirst:boolean = true;
	lastPos = points[0].position;
	Gizmos.color = Color(0.0,0.25,0.4,0.75);
	for (var i:int = 0.0; i < points.length*8.0; i++) {
		var p:Transform = points[i/8.0];
		//if (p == transform) continue;
		var ratio:float = i/(points.length*8.0);
		var pos:Vector3 = GetPosition(ratio);
		if (!isFirst) {
			Gizmos.DrawLine(lastPos,pos);
		}
		lastPos = pos;
		isFirst = false;
	}
}

@CutsceneEventExclude()
function GetForwardNormal(p:float, sampleDist:float):Vector3 {
	var curveLength:float = GetLength();
	var pos:Vector3 = GetPosition(p);
	var frontPos:Vector3 = GetPosition(p+(sampleDist/curveLength));
	var backPos:Vector3 = GetPosition(p-(sampleDist/curveLength));
	var frontNormal:Vector3 = (frontPos-pos).normalized;
	var backNormal:Vector3 = (backPos-pos).normalized;
	var normal:Vector3 = Vector3.Slerp(frontNormal,-backNormal, 0.5);
	normal.Normalize();
	return normal;
}

function GetPosition(pos:float):Vector3 {
	return GetPosition(pos,true);
}

@CutsceneEventExclude()
function GetPosition(pos:float,clamp:boolean):Vector3 {
	if (clamp) {
		pos = Mathf.Clamp(pos,0.0,1.0);
	}
	try {
		var numSections:int = points.Length - 3;
		if (numSections <= 0) return points[0].position;
		var currPt:int = Mathf.Min(Mathf.FloorToInt(pos * numSections), numSections - 1);
		var u:float = pos*numSections - currPt;
		var a:Vector3 = points[currPt].position;
		var b:Vector3 = points[currPt+1].position;
		var c:Vector3 = points[currPt+2].position;
		var d:Vector3 = points[currPt+3].position;
		return 0.5*((-a+3.0*b-3.0*c+d)*(u*u*u)+(2.0*a-5.0*b+4.0*c-d)*(u*u)+(-a+c)*u+2.0*b);
	}
	catch(err) {
		return Vector3(0,0,0);
	}
}

@CutsceneEventExclude()
function GetLength():float {
	if (points.length < 3) return 0.0;
	var l:float = 0;
	for (var i:int = 1; i < points.length-2; i++) {
		if (!points[i] || !points[i+1]) return;
		l += Vector3.Distance(points[i].position,points[i+1].position);
	}
	return l;
}

//Statics
@CutsceneEventExclude()
static function Interpolate(p:Vector3[],pos:float):Vector3 {
	var numSections:int = p.Length - 3;
	if (numSections <= 0) return Vector3(0,0,0);
	var currPt:int = Mathf.Min(Mathf.FloorToInt(pos * numSections), numSections - 1);
	var u:float = pos*numSections - currPt;
	var a:Vector3 = p[currPt];
	var b:Vector3 = p[currPt+1];
	var c:Vector3 = p[currPt+2];
	var d:Vector3 = p[currPt+3];
	return 0.5*((-a+3.0*b-3.0*c+d)*(u*u*u)+(2.0*a-5.0*b+4.0*c-d)*(u*u)+(-a+c)*u+2.0*b);
}
