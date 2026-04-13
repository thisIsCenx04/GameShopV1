namespace GameStore.API.Exceptions;

/// <summary>
/// Business rule violation — maps to HTTP 422
/// </summary>
public class BusinessException : Exception
{
    public BusinessException(string message) : base(message) { }
}

/// <summary>
/// Resource not found — maps to HTTP 404
/// </summary>
public class NotFoundException : Exception
{
    public NotFoundException(string message) : base(message) { }
}

/// <summary>
/// Conflict — maps to HTTP 409
/// </summary>
public class ConflictException : Exception
{
    public ConflictException(string message) : base(message) { }
}

/// <summary>
/// Forbidden — maps to HTTP 403
/// </summary>
public class ForbiddenException : Exception
{
    public ForbiddenException(string message) : base(message) { }
}
