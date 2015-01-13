using UnityEngine;

[AddComponentMenu("Cutscene/Actions/Follow Curve")]

[ExecuteInEditMode()]

[CutsceneEventOverrideNameAttribute("Follow Curve")]

class Action_FollowCurve : CutsceneAction {
	Curve curve;
	[HideInInspector] Curve overrideCurve;
	string matchTag = "";
	float position = 0;
	bool distanceBasedPosition = false;
	bool autoLookDirection = true;
	Transform target;
	float roll = 0;
	[HideInInspector] Transform overrideTarget;
	[HideInInspector] Vector3 debugLookPos;
	bool softFocus = false;
	float targetFocusStrength = 2.0f;
	
	
	[CutsceneEventExclude()]
	public void Update() {
		UpdatePosition();
		UpdateLook();
	}
	
	[CutsceneEventExclude()]
	public void LateUpdate() {
		overrideCurve = null;
		overrideTarget = null;
	}
	
	[CutsceneEventExclude()]
	public void OnDrawGizmosSelected() {
		if (target) {
			Gizmos.color = new Color(0.5f,0.4f,0.25f,0.5f);
			Gizmos.DrawLine(transform.position,debugLookPos);
		}
	}
	
	[CutsceneEventExclude()]
	public void UpdatePosition() {
		Curve c = curve;
		if (overrideCurve) c = overrideCurve;
		if (!c) return;
		Vector3 curvePos;
		if (position < 0.0) {
			position = 0;
		}
		if (distanceBasedPosition) {
			float curveLength = c.GetLength();
			if (position > curveLength) {
				position = curveLength;
			}
			curvePos = c.GetPosition(position/curveLength);
			if (transform.position != curvePos) {
				transform.position = curvePos;
			}
			return;
		}
		if (position > 1.0f) {
			position = 1.0f;
		}

		curvePos = c.GetPosition(position);
		if (transform.position != curvePos) {
			transform.position = curvePos;
		}
	}
	
	[CutsceneEventExclude()]
	public void UpdateLook() {
		Transform t = target;
		if (overrideTarget) t = overrideTarget;
		Curve c = curve;
		if (overrideCurve) c = overrideCurve;
		Vector3 nToSet;
		Vector3 n;
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
				float curveLength = c.GetLength();
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
	[CutsceneActionAttribute("Set Position On Curve")]
	//#endif
	public void SetPositionOnCurve(float value) {
		position = value;
		Update();
	}
	
	//#if !UNITY_FLASH
	[CutsceneActionAttribute("Set Roll")]
	//#endif
	public void SetRoll(float value) {
		roll = value;
		Update();
	}
	
	public void SetCurve(Curve desiredCurve) {
		curve = desiredCurve;
		Update();
	}
	
	public void SetTarget(Transform desiredTarget) {
		target = desiredTarget;
		Update();
	}
	
	[CutsceneEventExclude()]
	public void OnTimeOverCurveClip(CurveClip curveClip) {
		overrideCurve = curveClip.GetCustomProperty("overrideCurve") as Curve;
		overrideTarget = curveClip.GetCustomProperty("overrideTarget") as Transform;
	}

}