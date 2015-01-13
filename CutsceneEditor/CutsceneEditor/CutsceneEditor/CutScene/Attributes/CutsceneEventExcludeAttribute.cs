class CutsceneEventExcludeAttribute : System.Attribute
{
    public bool exclude = true;

    public CutsceneEventExcludeAttribute()
    {
        this.exclude = true;
    }
}

