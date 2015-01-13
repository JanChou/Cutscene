public class CutsceneEventOverrideNameAttribute : System.Attribute
{
    public string overrideName;

    public CutsceneEventOverrideNameAttribute(string n)
    {
        this.overrideName = n;
    }
}

