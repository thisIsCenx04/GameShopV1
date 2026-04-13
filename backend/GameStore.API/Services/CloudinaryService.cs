using CloudinaryDotNet;
using GameStore.API.Services.Interfaces;

namespace GameStore.API.Services;

public class CloudinaryService : ICloudinaryService
{
    private readonly Cloudinary _cloudinary;
    private readonly string _cloudName;
    private readonly string _apiKey;
    private readonly string _apiSecret;

    public CloudinaryService(IConfiguration configuration)
    {
        _cloudName = configuration["CLOUDINARY_CLOUD_NAME"]
            ?? throw new InvalidOperationException("CLOUDINARY_CLOUD_NAME is not configured");
        _apiKey = configuration["CLOUDINARY_API_KEY"]
            ?? throw new InvalidOperationException("CLOUDINARY_API_KEY is not configured");
        _apiSecret = configuration["CLOUDINARY_API_SECRET"]
            ?? throw new InvalidOperationException("CLOUDINARY_API_SECRET is not configured");

        var account = new Account(_cloudName, _apiKey, _apiSecret);
        _cloudinary = new Cloudinary(account);
    }

    public (string Signature, long Timestamp, string ApiKey, string CloudName, string Folder)
        GenerateUploadSignature(string folder)
    {
        var timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds();

        // Build sorted params string for signature (Cloudinary requires alphabetical order)
        var paramsToSign = $"folder={folder}&timestamp={timestamp}";
        var signature = _cloudinary.Api.SignParameters(
            new System.Collections.Generic.SortedDictionary<string, object>
            {
                { "folder", folder },
                { "timestamp", timestamp.ToString() }
            });

        return (signature, timestamp, _apiKey, _cloudName, folder);
    }
}
