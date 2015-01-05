#pragma strict
@script AddComponentMenu("Cutscene/Actions/Play Animation")

@script ExecuteInEditMode()

@CutsceneEventOverrideNameAttribute("Play Animation")

class Action_PlayAnimation extends CutsceneAction {
	var animationToPlay:AnimationClip;
	var containedClipPlay:boolean = true;
	var animationBlendTime:float = 0.1;
	var animationPlaySpeed:float = 1.0;
	var animtionWrapMode:WrapMode = WrapMode.Default;
	
	@HideInInspector
	var overrideAnimation:AnimationClip;
	
	@CutsceneEventExclude()
	function LateUpdate() {
		overrideAnimation = null;
	}

	function PlayAnimation() {
		if (animation) {
			SetAnimation(animationToPlay);
			if (animation[animationToPlay.name]) {
				animation[animationToPlay.name].speed = animationPlaySpeed;
				animation[animationToPlay.name].time = 0.0;
				animation[animationToPlay.name].wrapMode = animtionWrapMode;
				animation.CrossFade(animationToPlay.name,animationBlendTime);
			}
			
		}
	}
	function PlayAnimation(animClip:AnimationClip) {
		if (animClip) {
			SetAnimation(animClip);
		}
		PlayAnimation();
	}
	
	function SetAnimation(animClip:AnimationClip) {
		if (animation) {
			animationToPlay = animClip;
			if (animation[animClip.name]) {
				animation.RemoveClip(animClip);
			}
			animation.AddClip(animClip, animClip.name);
		}
	}
	function SetAnimation(animName:String) {
		if (animation && animation[animName]) {
			SetAnimation(animation[animName].clip);
		}
	}
	
	@CutsceneActionAttribute("Set Anim Time")
	function SetAnimationTime(value:float) {
		if (!Cutscene.timeIsOverCurrentClip && containedClipPlay) return;
		if (!animation) return;
		if (!animationToPlay && !overrideAnimation) return;
		if (!animation[animationToPlay.name]) {
			SetAnimation(animationToPlay);
		}
		var thisAnimClip:AnimationClip = animationToPlay;
		if (overrideAnimation != null) {
			thisAnimClip = overrideAnimation;
			if (Application.isPlaying && animation[thisAnimClip.name] == null) {
				animation.AddClip(thisAnimClip,thisAnimClip.name);
			}
		}
		
		
		if (!Application.isPlaying) {
			var animLength:float = thisAnimClip.length;
			var actualAnimPos:float = value*animLength;
			gameObject.SampleAnimation(thisAnimClip,actualAnimPos);
		}
		else {
			animation[thisAnimClip.name].enabled = true;
			animation[thisAnimClip.name].weight = 1.0;
			animation[thisAnimClip.name].normalizedTime = Mathf.Repeat(value,1.0);
			animation.Sample();
			animation[thisAnimClip.name].enabled = false;
		}
	}
	
	@CutsceneEventExclude()
	function OnTimeOverCurveClip(curveClip:CurveClip) {
		overrideAnimation = curveClip.GetCustomProperty("overrideAnimation") as AnimationClip;
	}
}

