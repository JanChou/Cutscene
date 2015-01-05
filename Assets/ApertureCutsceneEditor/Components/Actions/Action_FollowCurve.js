#pragma strict

@script AddComponentMenu("Cutscene/Actions/Follow Curve")

@script ExecuteInEditMode()

@CutsceneEventOverrideNameAttribute("Follow Curve")

class Action_FollowCurve extends CutsceneAction {
	var curve:Curve;
	@HideInInspector var overrideCurve:Curve;
	var matchTag:String = "";
	var position:float = 0;
	var distanceBasedPosition:boolean = false;
	var autoLookDirection:boolean = true;
	var target:Transform;
	var roll:float = 0;
	@HideInInspector var overrideTarget:Transform;
	@HideInInspector var debugLookPos:Vector3;
	var softFocus:boolean = false;
	var targetFocusStrength:float = 2.0;
	
	
	@CutsceneEventExclude()
	function Update() {
		UpdatePosition();
		UpdateLook();
	}
	
	@CutsceneEventExclude()
	function LateUpdate() {
		overrideCurve = null;
		overrideTarget = null;
	}
	
	@CutsceneEventExclude()
	function OnDrawGizmosSelected() {
		if (target) {
			Gizmos.color = Color(0.5,0.4,0.25,0.5);
			Gizmos.DrawLine(transform.position,debugLookPos);
		}
	}
	
	@CutsceneEventExclude()
	function UpdatePosition() {
		var c:Curve = curve;
		if (overrideCurve) c = overrideCurve;
		if (!c) return;
		var curvePos:Vector3;
		if (position < 0.0) {
			position = 0.0;
		}
		if (distanceBasedPosition) {
			var curveLength:float = c.GetLength();
			if (position > curveLength) {
				position = curveLength;
			}
			curvePos = c.GetPosition(position/curveLength);
			if (transform.position != curvePos) {
				transform.position = curvePos;
			}
			return;
		}
		if (position > 1.0) {
			position = 1.0;
		}

		curvePos = c.GetPosition(position);
		if (transform.position != curvePos) {
			transform.position = curvePos;
		}
	}
	
	@CutsceneEventExclude()
	function UpdateLook() {
		var t:Transform = target;
		if (overrideTarget) t = overrideTarget;
		var c:Curve = curve;
		if (overrideCurve) c = overrideCurve;
		var nToSet:Vector3;
		var n:Vector3;
		if (t) {
			n = (t.position-transform.position).normalized;
			if (transform.forward != n && n.magnitude > 0) {
				//transform.forward = n;
				if (softFocus) {
					nToSet = Vector3.Slerp(transform.forward,n,targetFocusStrength*Time.deltaTime);
					if (!Application.isPlaying)
						transform.forward = n;
					else
						transform.forward = nToSet;
				}
				else {
					transform.forward = n;
				}
			}
			if (transform.localEulerAngles.z != roll) {
				transform.localEulerAngles.z = roll;
			}
			debugLookPos = t.position;
		}
		else if (autoLookDirection && c) {
			if (distanceBasedPosition) {
				var curveLength:float = c.GetLength();
				n = c.GetForwardNormal(position/curveLength,0.01);
			}
			else {
				n = c.GetForwardNormal(position,0.01);
			}
			if (transform.forward != n && n.magnitude > 0) {
				if (softFocus) {
					nToSet = Vector3.Slerp(transform.forward,n,targetFocusStrength*Time.deltaTime);
					if (!Application.isPlaying) {
						transform.forward = n;
					}
					else {
						transform.forward = nToSet;
					}
				}
				else {
					transform.forward = n;
				}
			}
			if (transform.localEulerAngles.z != roll) {
				transform.localEulerAngles.z = roll;
			}
		}
	}
	
	//#if !UNITY_FLASH
	@CutsceneActionAttribute("Set Position On Curve")
	//#endif
	function SetPositionOnCurve(value:float) {
		position = value;
		Update();
	}
	
	//#if !UNITY_FLASH
	@CutsceneActionAttribute("Set Roll")
	//#endif
	function SetRoll(value:float) {
		roll = value;
		Update();
	}
	
	function SetCurve(desiredCurve:Curve) {
		curve = desiredCurve;
		Update();
	}
	
	function SetTarget(desiredTarget:Transform) {
		target = desiredTarget;
		Update();
	}
	
	@CutsceneEventExclude()
	function OnTimeOverCurveClip(curveClip:CurveClip) {
		overrideCurve = curveClip.GetCustomProperty("overrideCurve") as Curve;
		overrideTarget = curveClip.GetCustomProperty("overrideTarget") as Transform;
	}

}