using Amazon.S3.Model;

namespace HireThemNoW.Server.Services;

public interface IS3Service
{
    Task<string> UploadFileAsync(Stream fileStream, string fileName, string contentType);
    Task<bool> DeleteFileAsync(string fileKey);
    Task<string> GetPreSignedUrlAsync(string fileKey, int expirationMinutes = 60);
}