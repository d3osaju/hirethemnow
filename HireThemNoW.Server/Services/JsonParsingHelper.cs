using System.Text.Json;

namespace HireThemNoW.Server.Services;

/// <summary>
/// Utility class for safely parsing JSON strings with proper error handling and logging.
/// </summary>
public static class JsonParsingHelper
{
    /// <summary>
    /// Safely parses a JSON string into a List of strings.
    /// Returns an empty list if the input is null, empty, or invalid JSON.
    /// </summary>
    /// <param name="jsonString">The JSON string to parse</param>
    /// <param name="logger">Optional logger for error logging</param>
    /// <returns>A List of strings, or empty list if parsing fails</returns>
    public static List<string> ParseStringArray(string? jsonString, ILogger? logger = null)
    {
        if (string.IsNullOrWhiteSpace(jsonString))
        {
            return new List<string>();
        }

        try
        {
            var result = JsonSerializer.Deserialize<List<string>>(jsonString);
            return result ?? new List<string>();
        }
        catch (JsonException ex)
        {
            logger?.LogWarning(ex, "Failed to parse JSON array, returning empty list. JSON: {JsonString}", jsonString);
            return new List<string>();
        }
        catch (Exception ex)
        {
            logger?.LogError(ex, "Unexpected error parsing JSON array. JSON: {JsonString}", jsonString);
            return new List<string>();
        }
    }

    /// <summary>
    /// Safely parses a JSON string into a Dictionary of string to object.
    /// Returns an empty dictionary if the input is null, empty, or invalid JSON.
    /// </summary>
    /// <param name="jsonString">The JSON string to parse</param>
    /// <param name="logger">Optional logger for error logging</param>
    /// <returns>A Dictionary of string to object, or empty dictionary if parsing fails</returns>
    public static Dictionary<string, object> ParseJsonObject(string? jsonString, ILogger? logger = null)
    {
        if (string.IsNullOrWhiteSpace(jsonString))
        {
            return new Dictionary<string, object>();
        }

        try
        {
            var result = JsonSerializer.Deserialize<Dictionary<string, object>>(jsonString);
            return result ?? new Dictionary<string, object>();
        }
        catch (JsonException ex)
        {
            logger?.LogWarning(ex, "Failed to parse JSON object, returning empty dictionary. JSON: {JsonString}", jsonString);
            return new Dictionary<string, object>();
        }
        catch (Exception ex)
        {
            logger?.LogError(ex, "Unexpected error parsing JSON object. JSON: {JsonString}", jsonString);
            return new Dictionary<string, object>();
        }
    }
}