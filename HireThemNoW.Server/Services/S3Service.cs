using Amazon.S3;
using Amazon.S3.Model;

namespace HireThemNoW.Server.Services;

public class S3Service : IS3Service
{
    private readonly IAmazonS3 _s3Client;
    private readonly IConfiguration _configuration;
    private readonly ILogger<S3Service> _logger;
    private readonly string _bucketName;

    public S3Service(IAmazonS3 s3Client, IConfiguration configuration, ILogger<S3Service> logger)
    {
        _s3Client = s3Client;
        _configuration = configuration;
        _logger = logger;
        _bucketName = _configuration["AWS:S3:BucketName"] ?? "hirethemnow-resumes";
    }

    public async Task<string> UploadFileAsync(Stream fileStream, string fileName, string contentType, string? prefix = null)
    {
        try
        {
            // Generate unique file key with optional custom prefix
            var folder = prefix ?? "resumes";
            var fileKey = $"{folder}/{DateTime.UtcNow:yyyy/MM/dd}/{Guid.NewGuid()}_{fileName}";

            // Use resume bucket for resumes, regular bucket for other files
            var bucketToUse = folder == "resumes"
                ? _configuration["AWS:S3:ResumeBucket"] ?? _bucketName
                : _bucketName;

            var request = new PutObjectRequest
            {
                BucketName = bucketToUse,
                Key = fileKey,
                InputStream = fileStream,
                ContentType = contentType,
                ServerSideEncryptionMethod = ServerSideEncryptionMethod.AES256,
                Metadata =
                {
                    ["uploaded-at"] = DateTime.UtcNow.ToString("o"),
                    ["original-filename"] = fileName
                }
            };

            var response = await _s3Client.PutObjectAsync(request);

            if (response.HttpStatusCode == System.Net.HttpStatusCode.OK)
            {
                _logger.LogInformation("Successfully uploaded file {FileName} to S3 with key {FileKey}", fileName, fileKey);
                return fileKey;
            }
            else
            {
                _logger.LogError("Failed to upload file {FileName} to S3. Status: {StatusCode}", fileName, response.HttpStatusCode);
                throw new Exception($"Failed to upload file to S3. Status: {response.HttpStatusCode}");
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error uploading file {FileName} to S3", fileName);
            throw;
        }
    }

    public async Task<bool> DeleteFileAsync(string fileKey)
    {
        try
        {
            var request = new DeleteObjectRequest
            {
                BucketName = _bucketName,
                Key = fileKey
            };

            var response = await _s3Client.DeleteObjectAsync(request);

            if (response.HttpStatusCode == System.Net.HttpStatusCode.NoContent)
            {
                _logger.LogInformation("Successfully deleted file with key {FileKey} from S3", fileKey);
                return true;
            }
            else
            {
                _logger.LogWarning("Failed to delete file with key {FileKey} from S3. Status: {StatusCode}", fileKey, response.HttpStatusCode);
                return false;
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting file with key {FileKey} from S3", fileKey);
            return false;
        }
    }

    public async Task<string> GetPreSignedUrlAsync(string fileKey, int expirationMinutes = 60)
    {
        try
        {
            var request = new GetPreSignedUrlRequest
            {
                BucketName = _bucketName,
                Key = fileKey,
                Verb = HttpVerb.GET,
                Expires = DateTime.UtcNow.AddMinutes(expirationMinutes)
            };

            var url = await _s3Client.GetPreSignedURLAsync(request);
            _logger.LogInformation("Generated pre-signed URL for file key {FileKey}", fileKey);
            return url;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating pre-signed URL for file key {FileKey}", fileKey);
            throw;
        }
    }

    public async Task<Stream> DownloadFileAsync(string fileKey)
    {
        try
        {
            var request = new GetObjectRequest
            {
                BucketName = _bucketName,
                Key = fileKey
            };

            var response = await _s3Client.GetObjectAsync(request);

            if (response.HttpStatusCode == System.Net.HttpStatusCode.OK)
            {
                _logger.LogInformation("Successfully downloaded file with key {FileKey} from S3", fileKey);
                return response.ResponseStream;
            }
            else
            {
                _logger.LogError("Failed to download file with key {FileKey} from S3. Status: {StatusCode}", fileKey, response.HttpStatusCode);
                throw new Exception($"Failed to download file from S3. Status: {response.HttpStatusCode}");
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error downloading file with key {FileKey} from S3", fileKey);
            throw;
        }
    }
}