//#if !UNITY_FLASH
class CutsceneActionAttribute : System.Attribute
{
    public string attributeName;

    public CutsceneActionAttribute(string n)
    {
        this.attributeName = n;
    }
}
//#endif
