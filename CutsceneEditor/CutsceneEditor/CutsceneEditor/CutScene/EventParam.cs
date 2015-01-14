using UnityEngine;

public class EventParam : System.Object
{
    public bool booleanValue;
    public Color colorValue;
    public float floatValue;
    public int intValue;
    public float UInt64Value;
    public Vector2 vector2Value;
    public Vector3 vector3Value;
    public Vector4 vector4Value;
    public string stringValue;
    public UnityEngine.Object objectValue;


    public bool isBoolean = false;
    public bool isColor = false;
    public bool isFloat = false;
    public bool isInt = false;
    public bool isUInt64 = false;
    public bool isVector2 = false;
    public bool isVector3 = false;
    public bool isVector4 = false;
    public bool isString = false;
    public bool isObject = false;

    public string type;

    public void SetValue(System.Object value, System.Type valueType)
    {
        if (value == null) return;
        DisableAllTypeFlags();

        if (valueType.ToString() == "System.Boolean")
        {
            booleanValue = (bool)value;
            isBoolean = true;
        }
        else if (valueType.ToString() == "UnityEngine.Color")
        {
            colorValue = (Color)value;
            isColor = true;
        }
        else if (valueType.ToString() == "System.Single")
        {
            floatValue = (float)value;
            isFloat = true;
        }
        else if (valueType.ToString() == "System.Int32")
        {
            intValue = (int)value;
            isInt = true;
        }
        else if (valueType.ToString() == "System.UInt64")
        {
            UInt64Value = (System.UInt64)value;
            isUInt64 = true;
        }
        else if (valueType.ToString() == "UnityEngine.Vector2")
        {
            vector2Value = (Vector2)value;
            isVector2 = true;
        }
        else if (valueType.ToString() == "UnityEngine.Vector3")
        {
            vector3Value = (Vector3)value;
            isVector3 = true;
        }
        else if (valueType.ToString() == "UnityEngine.Vector4")
        {
            vector4Value = (Vector4)value;
            isVector4 = true;
        }
        else if (valueType.ToString() == "System.String")
        {
            stringValue = (string)value;
            isString = true;
        }
        else if (valueType.GetType().IsInstanceOfType(typeof(UnityEngine.Object)))
        {
            objectValue = (UnityEngine.Object)value;
            isObject = true;
        }

    }
    public System.Object GetValue()
    {
        if (isBoolean)
        {
            return booleanValue;
        }
        if (isColor)
        {
            return colorValue;
        }
        if (isFloat)
        {
            return floatValue;
        }
        if (isInt)
        {
            return intValue;
        }
        if (isUInt64)
        {
            return UInt64Value;
        }
        if (isVector2)
        {
            return vector2Value;
        }
        if (isVector3)
        {
            return vector3Value;
        }
        if (isVector4)
        {
            return vector4Value;
        }
        if (isString)
        {
            return stringValue;
        }
        if (isObject)
        {
            return objectValue;
        }
        return null;
    }

    public void DisableAllTypeFlags()
    {
        isBoolean = false;
        isColor = false;
        isFloat = false;
        isInt = false;
        isUInt64 = false;
        isVector2 = false;
        isVector3 = false;
        isVector4 = false;
        isString = false;
        isObject = false;
    }

    public System.Type GetParamType()
    {
        if (isBoolean)
        {
            return typeof(System.Boolean);
        }
        if (isColor)
        {
            return typeof(Color);
        }
        if (isFloat)
        {
            return typeof(System.Single);
        }
        if (isInt)
        {
            return typeof(System.Int32);
        }
        if (isUInt64)
        {
            return typeof(System.UInt64);
        }
        if (isVector2)
        {
            return typeof(Vector2);
        }
        if (isVector3)
        {
            return typeof(Vector3);
        }
        if (isVector4)
        {
            return typeof(Vector4);
        }
        if (isString)
        {
            return typeof(System.String);
        }
        if (isObject)
        {
            return objectValue.GetType();
        }
        return null;
    }
    //function GetValue() {
    //	if (type == "float") return floatValue;
    //}
}