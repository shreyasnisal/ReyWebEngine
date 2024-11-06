import * as MathUtils from "./MathUtils.js"
import Vec3 from "../../Engine/Math/Vec3.js"
import Vec4 from "../../Engine/Math/Vec4.js"

export default class Mat44
{
    static Elements = Object.freeze({
        Ix: 0, Iy: 1, Iz: 2, Iw: 3,
        Jx: 4, Jy: 5, Jz: 6, Jw: 7,
        Kx: 8, Ky: 9, Kz: 10, Kw: 11,
        Tx: 12, Ty: 13, Tz: 14, Tw: 15
      });

    static IDENTITY = new Mat44();
    static SIZE = 16;

    constructor(iBasis = Vec4.EAST, jBasis = Vec4.NORTH, kBasis = Vec4.SKYWARD, translation = Vec4.TRANSLATION)
    {
        this.m_values = [
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1
        ];

        this.m_values[Mat44.Elements.Ix] = iBasis.x;
        this.m_values[Mat44.Elements.Iy] = iBasis.y;
        this.m_values[Mat44.Elements.Iz] = iBasis.z;
        this.m_values[Mat44.Elements.Iw] = iBasis.w;

        this.m_values[Mat44.Elements.Jy] = jBasis.y;
        this.m_values[Mat44.Elements.Jx] = jBasis.x;
        this.m_values[Mat44.Elements.Jz] = jBasis.z;
        this.m_values[Mat44.Elements.Jw] = jBasis.w;

        this.m_values[Mat44.Elements.Kx] = kBasis.x;
        this.m_values[Mat44.Elements.Ky] = kBasis.y;
        this.m_values[Mat44.Elements.Kz] = kBasis.z;
        this.m_values[Mat44.Elements.Kw] = kBasis.w;

        this.m_values[Mat44.Elements.Tx] = translation.x;
        this.m_values[Mat44.Elements.Ty] = translation.y;
        this.m_values[Mat44.Elements.Tz] = translation.z;
        this.m_values[Mat44.Elements.Tw] = translation.w;
    }

    static CreateTranslation2D(translationXY)
    {
        return new Mat44(Vec4.EAST, Vec4.NORTH, Vec4.SKYWARD, new Vec4(translationXY.x, translationXY.y, 0, 1));
    }
    
    static CreateTranslation3D(translationXYZ)
    {
        return new Mat44(Vec4.EAST, Vec4.NORTH, Vec4.SKYWARD, new Vec4(translationXYZ.x, translationXYZ.y, translationXYZ.z, 1));
    }

    static CreateUniformScale2D(uniformScaleXY)
    {
        let matrix = new Mat44();
        matrix.m_values[Mat44.Elements.Ix] = uniformScaleXY;
        matrix.m_values[Mat44.Elements.Jy] = uniformScaleXY;
        return matrix;
    }

    static CreateUniformScale3D(uniformScaleXYZ)
    {
        let matrix = new Mat44();
        matrix.m_values[Mat44.Elements.Ix] = uniformScaleXYZ;
        matrix.m_values[Mat44.Elements.Jy] = uniformScaleXYZ;
        matrix.m_values[Mat44.Elements.Kz] = uniformScaleXYZ;
        return matrix;
    }

    static CreateNonUniformScale2D(nonUniformScaleXY)
    {
        let matrix = new Mat44();
        matrix.m_values[Mat44.Elements.Ix] = nonUniformScaleXY.x;
        matrix.m_values[Mat44.Elements.Jy] = nonUniformScaleXY.y;
        return matrix;
    }

    static CreateNonUniformScale3D(nonUniformScaleXYZ)
    {
        let matrix = new Mat44();
        matrix.m_values[Mat44.Elements.Ix] = nonUniformScaleXYZ.x;
        matrix.m_values[Mat44.Elements.Jy] = nonUniformScaleXYZ.y;
        matrix.m_values[Mat44.Elements.Kz] = nonUniformScaleXYZ.z;
        return matrix;
    }

    static CreateZRotationDegrees(rotationDegreesAboutZ)
    {
        let matrix = new Mat44();
        matrix.m_values[Mat44.Elements.Ix] = MathUtils.CosDegrees(rotationDegreesAboutZ);
        matrix.m_values[Mat44.Elements.Iy] = MathUtils.SinDegrees(rotationDegreesAboutZ);
        matrix.m_values[Mat44.Elements.Jx] = -MathUtils.SinDegrees(rotationDegreesAboutZ);
        matrix.m_values[Mat44.Elements.Jy] = MathUtils.CosDegrees(rotationDegreesAboutZ);
        return matrix;
    }

    static CreateYRotationDegrees(rotationDegreesAboutY)
    {
        let matrix = new Mat44();
        matrix.m_values[Mat44.Elements.Ix] = MathUtils.CosDegrees(rotationDegreesAboutY);
        matrix.m_values[Mat44.Elements.Iz] = -MathUtils.SinDegrees(rotationDegreesAboutY);
        matrix.m_values[Mat44.Elements.Kx] = MathUtils.SinDegrees(rotationDegreesAboutY);
        matrix.m_values[Mat44.Elements.Kz] = MathUtils.CosDegrees(rotationDegreesAboutY);
        return matrix;
    }

    static CreateXRotationDegrees(rotationDegreesAboutX)
    {
        let matrix = new Mat44();
        matrix.m_values[Mat44.Elements.Jy] = MathUtils.CosDegrees(rotationDegreesAboutX);
        matrix.m_values[Mat44.Elements.Jz] = MathUtils.SinDegrees(rotationDegreesAboutX);
        matrix.m_values[Mat44.Elements.Ky] = -MathUtils.SinDegrees(rotationDegreesAboutX);
        matrix.m_values[Mat44.Elements.Kz] = MathUtils.CosDegrees(rotationDegreesAboutX);
        return matrix;
    }

    static CreateOrthoProjection(xMin, xMax, yMin, yMax, orthoNear, orthoFar)
    {
        let orthoMatrix = new Mat44();

        const orthoRight = xMax;
        const orthoLeft = xMin;
        const orthoTop = yMax;
        const orthoBottom = yMin;

        orthoMatrix.m_values[Mat44.Elements.Ix] = 2.0 / (orthoRight - orthoLeft);
        orthoMatrix.m_values[Mat44.Elements.Jy] = 2.0 / (orthoTop - orthoBottom);
        orthoMatrix.m_values[Mat44.Elements.Kz] = 1.0 / (orthoFar - orthoNear);

        orthoMatrix.m_values[Mat44.Elements.Tx] = -(orthoRight + orthoLeft) / (orthoRight - orthoLeft);
        orthoMatrix.m_values[Mat44.Elements.Ty] = -(orthoTop + orthoBottom) / (orthoTop - orthoBottom);
        orthoMatrix.m_values[Mat44.Elements.Tz] = -orthoNear / (orthoFar - orthoNear);

        return orthoMatrix;
    }

    static CreatePerspectiveProjection(fov, aspect, perspectiveNear, perspectiveFar)
    {
        const top = perspectiveNear * MathUtils.TanDegrees(fov * 0.5);
        const bottom = -top;
        const right = top * aspect;
        const left = -right;

        let perspectiveMatrix = new Mat44();

        if (perspectiveNear === 0.0)
        {
            perspectiveMatrix.m_values[Mat44.Elements.Ix] = 1.0;
            perspectiveMatrix.m_values[Mat44.Elements.Jy] = 1.0;
        }
        else
        {
            perspectiveMatrix.m_values[Mat44.Elements.Ix] = 2.0 * perspectiveNear / (right - left);
            perspectiveMatrix.m_values[Mat44.Elements.Jy] = 2.0 * perspectiveNear / (top - bottom);
        }

        perspectiveMatrix.m_values[Mat44.Elements.Kz] = perspectiveFar / (perspectiveFar - perspectiveNear);
        perspectiveMatrix.m_values[Mat44.Elements.Kw] = 1.0;

        perspectiveMatrix.m_values[Mat44.Elements.Tz] = -1.0 * perspectiveFar * perspectiveNear / (perspectiveFar - perspectiveNear);
        perspectiveMatrix.m_values[Mat44.Tw] = 0.0;

        return perspectiveMatrix;
    }

    TransformVectorQuantity2D(vectorQuantityXY)
    {

    }

    TransformVectorQuantity3D(vectorQuantityXYZ)
    {

    }

    TransformPosition2D(positionXY)
    {

    }

    TransformPosition3D(positionXYZ)
    {

    }

    TransformHomogeneous3D(homogeneousPoint3D)
    {

    }

    GetAsFloatArray()
    {
        return m_values;
    }

    GetIBasis2D()
    {
        return new Vec2(this.m_values[Mat44.Elements.Ix], this.m_values[Mat44.Elements.Iy]);
    }

    GetJBasis2D()
    {
        return new Vec2(this.m_values[Mat44.Elements.Jx], this.m_values[Mat44.Elements.Jy]);
    }

    GetTranslation2D()
    {
        return new Vec2(this.m_values[Mat44.Elements.Tx], this.m_values[Mat44.Elements.Ty]);
    }

    GetIBasis3D()
    {
        return new Vec3(this.m_values[Mat44.Elements.Ix], this.m_values[Mat44.Elements.Iy], this.m_values[Mat44.Elements.Iz]);
    }

    GetJBasis3D()
    {
        return new Vec3(this.m_values[Mat44.Elements.Jx], this.m_values[Mat44.Elements.Jy], this.m_values[Mat44.Elements.Jz]);
    }

    GetKBasis3D()
    {
        return new Vec3(this.m_values[Mat44.Elements.Kx], this.m_values[Mat44.Elements.Ky], this.m_values[Mat44.Elements.Kz]);
    }

    GetTranslation3D()
    {
        return new Vec3(this.m_values[Mat44.Elements.Tx], this.m_values[Mat44.Elements.Ty], this.m_values[Mat44.Elements.Tz]);
    }

    GetIBasis4D()
    {
        return new Vec4(this.m_values[Mat44.Elements.Ix], this.m_values[Mat44.Elements.Iy], this.m_values[Mat44.Elements.Iz], this.m_values[Mat44.Elements.Iw]);
    }

    GetJBasis4D()
    {
        return new Vec4(this.m_values[Mat44.Elements.Jx], this.m_values[Mat44.Elements.Jy], this.m_values[Mat44.Elements.Jz], this.m_values[Mat44.Elements.Jw]);
    }

    GetKBasis4D()
    {
        return new Vec4(this.m_values[Mat44.Elements.Kx], this.m_values[Mat44.Elements.Ky], this.m_values[Mat44.Elements.Kz], this.m_values[Mat44.Elements.Kw]);
    }

    GetTranslation4D()
    {
        return new Vec4(this.m_values[Mat44.Elements.Tx], this.m_values[Mat44.Elements.Ty], this.m_values[Mat44.Elements.Tz], this.m_values[Mat44.Elements.Tw]);
    }

    SetTranslation2D(translationXY)
    {
        this.m_values[Mat44.Elements.Tx] = translationXY.x;
        this.m_values[Mat44.Elements.Ty] = translationXY.y;
        this.m_values[Mat44.Elements.Tz] = 0;
        this.m_values[Mat44.Elements.Tw] = 0;
    }

    SetTranslation3D(translationXYZ)
    {
        this.m_values[Mat44.Elements.Tx] = translationXYZ.x;
        this.m_values[Mat44.Elements.Ty] = translationXYZ.y;
        this.m_values[Mat44.Elements.Tz] = translationXYZ.z;
        this.m_values[Mat44.Elements.Tw] = 0;
    }

    SetIJ2D(iBasis2D, jBasis2D)
    {
        this.m_values[Mat44.Elements.Ix] = iBasis2D.x;
        this.m_values[Mat44.Elements.Iy] = jBasis2D.y;
    }

    SetIJT2D(iBasis2D, jBasis2D, translationXY)
    {

    }

    SetIJK3D(iBasis3D, jBasis3D, kBasis3D)
    {

    }

    SetIJKT3D(iBasis3D, jBasis3D, kBasis3D, translationXYZ)
    {

    }

    SetIJKT4D(iBasis4D, jBasis4D, kBasis4D, translation4D)
    {

    }

    Append(matrixToAppend)
    {
        let result = new Mat44(); // Temporary result matrix to store values

        for (let rowIndex = 0; rowIndex < 4; rowIndex++)
        {
            for (let colIndex = 0; colIndex < 4; colIndex++)
            {
                const resultIndex = rowIndex + colIndex * 4;
                const matrixRow = new Vec4(this.m_values[rowIndex + 0], this.m_values[rowIndex + 4], this.m_values[rowIndex + 8], this.m_values[rowIndex + 12]);
                const appendMatrixCol = new Vec4(matrixToAppend.m_values[colIndex * 4], matrixToAppend.m_values[colIndex * 4 + 1], matrixToAppend.m_values[colIndex * 4 + 2], matrixToAppend.m_values[colIndex * 4 + 3]);
                result.m_values[resultIndex] = MathUtils.DotProduct4D(matrixRow, appendMatrixCol);
            }
        }

        // Copy values from temporary result into this matrix
        for (let valueIndex = 0; valueIndex < 4; valueIndex++)
        {
            this.m_values[valueIndex] = result.m_values[valueIndex];
        }
    }

    AppendZRotation(zRotationDegrees)
    {
        const zRotationMatrix = Mat44.CreateZRotationDegrees(zRotationDegrees);
        this.Append(zRotationMatrix);
    }

    AppendYRotation(yRotationDegrees)
    {
        const yRotationMatrix = Mat44.CreateYRotationDegrees(yRotationDegrees);
        this.Append(yRotationMatrix);
    }

    AppendXRotation(xRotationDegrees)
    {
        const xRotationMatrix = Mat44.CreateXRotationDegrees(xRotationDegrees);
        this.Append(xRotationMatrix);
    }

    AppendTranslation2D(translationXY)
    {
        const translationMatrix = Mat44.CreateTranslation2D(translationXY);
        this.Append(translationMatrix);
    }

    AppendTranslation3D(translation3D)
    {
        const translationMatrix = Mat44.CreateTranslation3D(translation3D);
        this.Append(translationMatrix);
    }

    AppendScaleUniform2D(uniformScaleXY)
    {
        const uniformScaleMatrix = Mat44.CreateUniformScale2D(uniformScaleXY);
        this.Append(uniformScaleMatrix);
    }

    AppendScaleUniform3D(uniformScale3D)
    {
        const uniformScaleMatrix = Mat44.CreateUniformScale3D(uniformScale3D);
        this.Append(uniformScaleMatrix);
    }

    AppendScaleNonUniform2D(scaleXY)
    {
        const nonUniformScaleMatrix = Mat44.CreateNonUniformScale2D(scaleXY);
        this.Append(nonUniformScaleMatrix);
    }

    AppendScaleNonUniform3D(scale3D)
    {
        const nonUniformScaleMatrix = Mat44.CreateNonUniformScale3D(scale3D);
        this.Append(nonUniformScaleMatrix);
    }

    Transpose()
    {
        const matrixCopy = new Mat44(this.GetIBasis4D(), this.GetJBasis4D(), this.GetKBasis4D(), this.GetTranslation4D());

        this.m_values[Mat44.Elements.Iy] = matrixCopy.m_values[Mat44.Elements.Jx];
        this.m_values[Mat44.Elements.Iz] = matrixCopy.m_values[Mat44.Elements.Kx];
        this.m_values[Mat44.Elements.Iw] = matrixCopy.m_values[Mat44.Elements.Tx];

        this.m_values[Mat44.Elements.Jx] = matrixCopy.m_values[Mat44.Elements.Iy];
        this.m_values[Mat44.Elements.Jz] = matrixCopy.m_values[Mat44.Elements.Ky];
        this.m_values[Mat44.Elements.Jw] = matrixCopy.m_values[Mat44.Elements.Ty];

        this.m_values[Mat44.Elements.Kx] = matrixCopy.m_values[Mat44.Elements.Jx];
        this.m_values[Mat44.Elements.Ky] = matrixCopy.m_values[Mat44.Elements.Jx];
        this.m_values[Mat44.Elements.Kw] = matrixCopy.m_values[Mat44.Elements.Jx];

        this.m_values[Mat44.Elements.Tx] = matrixCopy.m_values[Mat44.Elements.Jx];
        this.m_values[Mat44.Elements.Ty] = matrixCopy.m_values[Mat44.Elements.Jx];
        this.m_values[Mat44.Elements.Tz] = matrixCopy.m_values[Mat44.Elements.Jx];
    }

    GetOrthonormalInverse()
    {
        const rotationInverseMatrix = new Mat44(this.GetIBasis4D(), this.GetJBasis4D(), this.GetKBasis4D(), Vec4.TRANSLATION);
        rotationInverseMatrix.Transpose();

        const inverseMatrix = rotationInverseMatrix;
        inverseMatrix.AppendTranslation3D(-this.GetTranslation3D());

        return inverseMatrix;
    }
}