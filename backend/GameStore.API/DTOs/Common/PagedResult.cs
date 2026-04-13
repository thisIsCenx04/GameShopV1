namespace GameStore.API.DTOs.Common;

/// <summary>
/// Generic paging container cho Repository layer
/// </summary>
public class PagedResult<T>
{
    public IReadOnlyList<T> Items { get; set; }
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }

    public PagedResult(IReadOnlyList<T> items, int totalCount, int page, int pageSize)
    {
        Items = items;
        TotalCount = totalCount;
        Page = page;
        PageSize = pageSize;
    }

    public PaginationMeta ToPaginationMeta()
        => new(Page, PageSize, TotalCount);
}
