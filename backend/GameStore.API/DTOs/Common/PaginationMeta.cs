namespace GameStore.API.DTOs.Common;

/// <summary>
/// Pagination metadata cho danh sách có phân trang - RULE 10
/// </summary>
public class PaginationMeta
{
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalItems { get; set; }
    public int TotalPages { get; set; }

    public PaginationMeta(int page, int pageSize, int totalItems)
    {
        Page = page;
        PageSize = pageSize;
        TotalItems = totalItems;
        TotalPages = (int)Math.Ceiling((double)totalItems / pageSize);
    }
}
