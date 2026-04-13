namespace GameStore.API.Services.Interfaces;

public interface ICloudinaryService
{
    /// <summary>
    /// Generate a signature for client-side direct upload to Cloudinary
    /// </summary>
    (string Signature, long Timestamp, string ApiKey, string CloudName, string Folder) GenerateUploadSignature(string folder);
}
