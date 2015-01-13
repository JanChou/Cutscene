using UnityEngine;
[AddComponentMenu("Cutscene/Actions/Play Animation")]

[ExecuteInEditMode()]

[CutsceneEventOverrideNameAttribute("Play Animation")]

class Action_PlayAnimation : CutsceneAction {
	AnimationClip animationToPlay;
	bool containedClipPlay = true;
	float animationBlendTime = 0.1f;
	float animationPlaySpeed = 1.0f;
	WrapMode animtionWrapMode = WrapMode.Default;
	
	[HideInInspector]
	AnimationClip overrideAnimation;
	
	[CutsceneEventExclude()]
	public void LateUpdate() {
		overrideAnimation = null;
	}

	public void PlayAnimation() {
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
	public void PlayAnimation(AnimationClip animClip) {
		if (animClip) {
			SetAnimation(animClip);
		}
		PlayAnimation();
	}
	
	public void SetAnimation(AnimationClip animClip) {
		if (animation) {
			animationToPlay = animClip;
			if (animation[animClip.name]) {
				animation.RemoveClip(animClip);
			}
			animation.AddClip(animClip, animClip.name);
		}
	}
	public void SetAnimation(string animName) {
		if (animation && animation[animName]) {
			SetAnimation(animation[animName].clip);
		}
	}
	
	[CutsceneActionAttribute("Set Anim Time")]
	public void SetAnimationTime(float value) {
		if (!Cutscene.timeIsOverCurrentClip && containedClipPlay) return;
		if (!animation) return;
		if (!animationToPlay && !overrideAnimation) return;
		if (!animation[animationToPlay.name]) {
			SetAnimation(animationToPlay);
		}
		AnimationClip thisAnimClip = animationToPlay;
		if (overrideAnimation != null) {
			thisAnimClip = overrideAnimation;
			if (Application.isPlaying && animation[thisAnimClip.name] == null) {
				animation.AddClip(thisAnimClip,thisAnimClip.name);
			}
		}
		
		
		if (!Application.isPlaying) {
			float animLength = thisAnimClip.length;
			float actualAnimPos = value*animLength;
			gameObject.SampleAnimation(thisAnimClip,actualAnimPos);
		}
		else {
			animation[thisAnimClip.name].enabled = true;
			animation[thisAnimClip.name].weight = 1.0;
			animation[thisAnimClip.name].normalizedTime = Mathf.Repeat(value,1.0f);
			animation.Sample();
			animation[thisAnimClip.name].enabled = false;
		}
	}
	
	[CutsceneEventExclude()]
	public void OnTimeOverCurveClip(CurveClip curveClip) {
		overrideAnimation = curveClip.GetCustomProperty("overrideAnimation") as AnimationClip;
	}
}

