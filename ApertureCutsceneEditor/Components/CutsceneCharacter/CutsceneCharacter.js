#pragma strict

@script AddComponentMenu("Cutscene/Character/Cutscene Character")
@CutsceneEventOverrideNameAttribute("Cutscene Character")

var startDestinationPoint:Transform;
var startDestinationLookAt:Transform;
var walkSpeed:float = 1.0;
var walkAnimSpeed:float  = 1.0;
var runSpeed:float = 3.0;
var runAnimSpeed:float  =1.0;
var stopSpeed:float = 10.0;
var stepHeight:float = 0.25;
var turnSpeed:float = 2.0;
var useRunDistanceThreshold:boolean = true;
var runDistanceThreshold:float = 10.0;
var idleAnimationName:String = "Idle";
var walkAnimationName:String = "Walk";
var overrideWalkAnimName:String = "";
var runAnimationName:String = "Run";
var overrideRunAnimName:String = "";
@HideInInspector var currentDestination:CutsceneCharacterNavPoint = null;
@HideInInspector var capsule:CapsuleCollider;
@HideInInspector var height:float = 0.0;
@HideInInspector var currentNavPoint:int = 0;
@HideInInspector var anim:Animation;
@HideInInspector var grounded:boolean = false;
@HideInInspector var forceRunning:boolean = false;
@HideInInspector var disableAnimations:boolean = false;

@CutsceneEventExclude()
function Start() {
	capsule = gameObject.GetComponent(CapsuleCollider);
	height = capsule.height;
	anim = GetComponentInChildren(Animation);
	currentDestination = null;
	if (startDestinationPoint) {
		SetDistination(startDestinationPoint,startDestinationLookAt,0.0);
	}
}


function SetDistination(destTransform:Transform,speed:float) {
	SetDistination(destTransform,null,speed);
}


function SetDistination(destTransform:Transform,lookAt:Transform,speed:float) {
	var newPoint:CutsceneCharacterNavPoint = new CutsceneCharacterNavPoint();
	newPoint.transform = destTransform;
	newPoint.lookAt = lookAt;
	newPoint.speed = speed;
	newPoint.dontUse = false;
	if (speed <= 0.0) {
		newPoint.speed = walkSpeed;
	}
	currentDestination = newPoint;
}


function SetDistination(destVector:Vector3,speed:float) {
	SetDistination(destVector,null,speed);
}


function SetDistination(destVector:Vector3,lookAt:Transform,speed:float) {
	var newPoint:CutsceneCharacterNavPoint = new CutsceneCharacterNavPoint();
	newPoint.position = destVector;
	newPoint.lookAt = lookAt;
	newPoint.speed = speed;
	newPoint.dontUse = false;
	if (speed <= 0.0) {
		newPoint.speed = walkSpeed;
	}
	currentDestination = newPoint;
}

function ClearDestination() {
	currentDestination = null;
}

@CutsceneEventExclude()
function GetDestinationDistance():float {
	if (!currentDestination) return 0.0;
	var cp:Vector3 = transform.position;
	var dp:Vector3 = currentDestination.GetPosition();
	return Vector2.Distance(Vector2(cp.x,cp.z),Vector2(dp.x,dp.z));
}


@CutsceneEventExclude()
function Update () {
	forceRunning = false;
	if (useRunDistanceThreshold) {
		forceRunning = false;
		if (currentDestination) {
			if (GetDestinationDistance() > runDistanceThreshold) {
				forceRunning = true;
			}
		}
	}
	UpdateHover();
	UpdateLooking();
}

@CutsceneEventExclude()
function FixedUpdate() {
	UpdateNav();
}

@CutsceneEventExclude()
function UpdateHover() {
	var hit:RaycastHit;
	if (Physics.Raycast(transform.position,Vector3(0,-1,0),hit,(height*0.5)+0.01+stepHeight)) {
		transform.position = hit.point;
		transform.position.y += (height*0.5)+(stepHeight);
		rigidbody.velocity.y = 0.0;
		grounded = true;
	}
	else {
		grounded = false;
	}
	if (grounded) {
		rigidbody.velocity.x = Mathf.Lerp(rigidbody.velocity.x,0.0,Time.deltaTime*stopSpeed);
		rigidbody.velocity.z = Mathf.Lerp(rigidbody.velocity.z,0.0,Time.deltaTime*stopSpeed);
	}
	var flatVelocity:float = Vector3.Scale(rigidbody.velocity,Vector3(1.0,0.0,1.0)).magnitude;
	var animName:String;
	if (rigidbody.velocity.magnitude >= 2.0) {
		animName = runAnimationName;
		if (overrideRunAnimName != "") animName = overrideRunAnimName;
		LoopAnim(animName,(flatVelocity/runSpeed)*runAnimSpeed);
	}
	else if (rigidbody.velocity.magnitude >= 0.25) {
		animName = walkAnimationName;
		if (overrideWalkAnimName != "") animName = overrideWalkAnimName;
		LoopAnim(animName,(flatVelocity/walkSpeed)*walkAnimSpeed);
	}
	else {
		LoopAnim(idleAnimationName,1.0);
	}
}

@CutsceneEventExclude()
function UpdateLooking() {
	if (!currentDestination) return;
	if (currentDestination.dontUse) return;
	var lookPos:Vector3 = currentDestination.GetPosition();
	if (currentDestination.lookAt) {
		lookPos = currentDestination.lookAt.position;
	}
	var cp:Vector3 = transform.position;
	var n:Vector3 = (lookPos-cp).normalized;
	var bodyN:Vector3 = Vector3(n.x,0.0,n.z).normalized;
	if (bodyN.magnitude  == 0.0) return;
	if (n.magnitude == 0.0) return;
	var weight:float = turnSpeed*currentDestination.turnSpeedScaler*Time.deltaTime;
	weight *= ((Vector3.Angle(transform.forward,bodyN)/180.0)*0.5)+0.5;
	transform.forward = Vector3.Slerp(transform.forward,bodyN,weight);
}

@CutsceneEventExclude()
function UpdateNav() {
	if (!currentDestination) return;
	if (currentDestination.dontUse) return;
	var cp:Vector3 = transform.position;
	var dp:Vector3 = currentDestination.GetPosition();
	if (GetDestinationDistance() < 0.2) {
		//if (currentDestination.autoRemove) {
			//currentDestination = null;
		//}
		return;
	}
	var n:Vector3 = (dp-cp).normalized;
	if (currentDestination.instantMove) {
		transform.position = currentDestination.GetPosition();
		//currentDestination = null;
	}
	else {
		if (grounded) {
			var speed:float = currentDestination.speed;
			if (forceRunning) {
				speed = runSpeed;
			}
			rigidbody.AddForce(n*speed*5.0);
		}
	}
}

function SetAnimationEnabledState(state:boolean) {
	disableAnimations = !state;
}

function LoopAnim(s:String,speed:float) {
	if (disableAnimations) return;
	anim[s].speed = speed;
	anim[s].wrapMode = WrapMode.Loop;
	if (anim.isPlaying && anim.clip.name == s) return;
	anim.CrossFade(s);
	anim.clip = anim[s].clip;
}

@CutsceneEventExclude()
function OnDrawGizmos() {
	if (!Application.isPlaying) {
		return;
	}
	var c:CapsuleCollider = gameObject.GetComponent(CapsuleCollider);
	if (c) {
		Gizmos.DrawLine(transform.position,transform.position+(Vector3(0,-1,0)*(capsule.height*0.5)+Vector3(0,-stepHeight,0)));
	}
	if (currentDestination && !currentDestination.dontUse) {
		Gizmos.DrawLine(transform.position,currentDestination.GetPosition());
		if (currentDestination.lookAt) {
			Gizmos.DrawLine(transform.position,currentDestination.lookAt.position);
		}
	}
}
