@script AddComponentMenu ("Cutscene/Misc/Target")

function OnDrawGizmos() {
	Gizmos.DrawIcon(transform.position, "Aperture_Target.tiff");
}
