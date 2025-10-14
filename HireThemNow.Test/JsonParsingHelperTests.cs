using FluentAssertions;
using HireThemNoW.Server.Services;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace HireThemNow.Test;

/// <summary>
/// Unit tests for JsonParsingHelper to verify safe JSON parsing functionality
/// </summary>
public class JsonParsingHelperTests
{
    private readonly Mock<ILogger> _mockLogger;

    public JsonParsingHelperTests()
    {
        _mockLogger = new Mock<ILogger>();
    }

    [Fact]
    public void ParseStringArray_ValidJsonArray_ShouldReturnParsedArray()
    {
        // Arrange
        var jsonString = "[\"item1\", \"item2\", \"item3\"]";

        // Act
        var result = JsonParsingHelper.ParseStringArray(jsonString, _mockLogger.Object);

        // Assert
        result.Should().NotBeNull();
        result.Should().HaveCount(3);
        result.Should().Contain("item1");
        result.Should().Contain("item2");
        result.Should().Contain("item3");
    }

    [Fact]
    public void ParseStringArray_NullInput_ShouldReturnEmptyArray()
    {
        // Act
        var result = JsonParsingHelper.ParseStringArray(null, _mockLogger.Object);

        // Assert
        result.Should().NotBeNull();
        result.Should().BeEmpty();
    }

    [Fact]
    public void ParseStringArray_EmptyString_ShouldReturnEmptyArray()
    {
        // Act
        var result = JsonParsingHelper.ParseStringArray("", _mockLogger.Object);

        // Assert
        result.Should().NotBeNull();
        result.Should().BeEmpty();
    }

    [Fact]
    public void ParseStringArray_WhitespaceString_ShouldReturnEmptyArray()
    {
        // Act
        var result = JsonParsingHelper.ParseStringArray("   ", _mockLogger.Object);

        // Assert
        result.Should().NotBeNull();
        result.Should().BeEmpty();
    }

    [Fact]
    public void ParseStringArray_InvalidJson_ShouldReturnEmptyArrayAndLog()
    {
        // Arrange
        var invalidJson = "invalid json string";

        // Act
        var result = JsonParsingHelper.ParseStringArray(invalidJson, _mockLogger.Object);

        // Assert
        result.Should().NotBeNull();
        result.Should().BeEmpty();
        
        // Verify warning was logged
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Warning,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Failed to parse JSON array")),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    [Fact]
    public void ParseStringArray_MalformedJson_ShouldReturnEmptyArrayAndLog()
    {
        // Arrange
        var malformedJson = "[\"item1\", \"item2\""; // Missing closing bracket

        // Act
        var result = JsonParsingHelper.ParseStringArray(malformedJson, _mockLogger.Object);

        // Assert
        result.Should().NotBeNull();
        result.Should().BeEmpty();
        
        // Verify warning was logged
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Warning,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Failed to parse JSON array")),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    [Fact]
    public void ParseStringArray_EmptyJsonArray_ShouldReturnEmptyArray()
    {
        // Arrange
        var emptyJsonArray = "[]";

        // Act
        var result = JsonParsingHelper.ParseStringArray(emptyJsonArray, _mockLogger.Object);

        // Assert
        result.Should().NotBeNull();
        result.Should().BeEmpty();
    }

    [Fact]
    public void ParseJsonObject_ValidJsonObject_ShouldReturnParsedObject()
    {
        // Arrange
        var jsonString = "{\"key1\": \"value1\", \"key2\": \"value2\"}";

        // Act
        var result = JsonParsingHelper.ParseJsonObject(jsonString, _mockLogger.Object);

        // Assert
        result.Should().NotBeNull();
        result.Should().HaveCount(2);
        result.Should().ContainKey("key1");
        result.Should().ContainKey("key2");
        result["key1"].ToString().Should().Be("value1");
        result["key2"].ToString().Should().Be("value2");
    }

    [Fact]
    public void ParseJsonObject_NullInput_ShouldReturnEmptyDictionary()
    {
        // Act
        var result = JsonParsingHelper.ParseJsonObject(null, _mockLogger.Object);

        // Assert
        result.Should().NotBeNull();
        result.Should().BeEmpty();
    }

    [Fact]
    public void ParseJsonObject_EmptyString_ShouldReturnEmptyDictionary()
    {
        // Act
        var result = JsonParsingHelper.ParseJsonObject("", _mockLogger.Object);

        // Assert
        result.Should().NotBeNull();
        result.Should().BeEmpty();
    }

    [Fact]
    public void ParseJsonObject_WhitespaceString_ShouldReturnEmptyDictionary()
    {
        // Act
        var result = JsonParsingHelper.ParseJsonObject("   ", _mockLogger.Object);

        // Assert
        result.Should().NotBeNull();
        result.Should().BeEmpty();
    }

    [Fact]
    public void ParseJsonObject_InvalidJson_ShouldReturnEmptyDictionaryAndLog()
    {
        // Arrange
        var invalidJson = "invalid json string";

        // Act
        var result = JsonParsingHelper.ParseJsonObject(invalidJson, _mockLogger.Object);

        // Assert
        result.Should().NotBeNull();
        result.Should().BeEmpty();
        
        // Verify warning was logged
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Warning,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Failed to parse JSON object")),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    [Fact]
    public void ParseJsonObject_MalformedJson_ShouldReturnEmptyDictionaryAndLog()
    {
        // Arrange
        var malformedJson = "{\"key1\": \"value1\", \"key2\":"; // Missing value and closing brace

        // Act
        var result = JsonParsingHelper.ParseJsonObject(malformedJson, _mockLogger.Object);

        // Assert
        result.Should().NotBeNull();
        result.Should().BeEmpty();
        
        // Verify warning was logged
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Warning,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Failed to parse JSON object")),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    [Fact]
    public void ParseJsonObject_EmptyJsonObject_ShouldReturnEmptyDictionary()
    {
        // Arrange
        var emptyJsonObject = "{}";

        // Act
        var result = JsonParsingHelper.ParseJsonObject(emptyJsonObject, _mockLogger.Object);

        // Assert
        result.Should().NotBeNull();
        result.Should().BeEmpty();
    }

    [Fact]
    public void ParseJsonObject_ComplexNestedObject_ShouldReturnParsedObject()
    {
        // Arrange
        var complexJson = "{\"personalInfo\": {\"score\": 90, \"issues\": []}, \"experience\": {\"score\": 85, \"suggestions\": [\"Add more details\"]}}";

        // Act
        var result = JsonParsingHelper.ParseJsonObject(complexJson, _mockLogger.Object);

        // Assert
        result.Should().NotBeNull();
        result.Should().HaveCount(2);
        result.Should().ContainKey("personalInfo");
        result.Should().ContainKey("experience");
    }

    [Theory]
    [InlineData("[\"strength1\", \"strength2\"]")]
    [InlineData("[\"weakness1\"]")]
    [InlineData("[]")]
    public void ParseStringArray_VariousValidArrays_ShouldReturnCorrectArrays(string jsonArray)
    {
        // Act
        var result = JsonParsingHelper.ParseStringArray(jsonArray, _mockLogger.Object);

        // Assert
        result.Should().NotBeNull();
        var expectedCount = jsonArray == "[]" ? 0 : (jsonArray.Contains("strength2") ? 2 : 1);
        result.Should().HaveCount(expectedCount);
    }

    [Theory]
    [InlineData("{\"score\": 85}")]
    [InlineData("{\"key\": \"value\", \"number\": 42}")]
    [InlineData("{}")]
    public void ParseJsonObject_VariousValidObjects_ShouldReturnCorrectObjects(string jsonObject)
    {
        // Act
        var result = JsonParsingHelper.ParseJsonObject(jsonObject, _mockLogger.Object);

        // Assert
        result.Should().NotBeNull();
        var expectedCount = jsonObject == "{}" ? 0 : (jsonObject.Contains("number") ? 2 : 1);
        result.Should().HaveCount(expectedCount);
    }
}