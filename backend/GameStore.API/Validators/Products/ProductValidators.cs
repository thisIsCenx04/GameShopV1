using FluentValidation;
using GameStore.API.DTOs.Products;

namespace GameStore.API.Validators.Products;

public class CreateProductRequestValidator : AbstractValidator<CreateProductRequest>
{
    public CreateProductRequestValidator()
    {
        RuleFor(x => x.GameId)
            .GreaterThan(0).WithMessage("Vui lòng chọn tựa game.");

        RuleFor(x => x.GameRankId)
            .GreaterThan(0).WithMessage("Vui lòng chọn rank.");

        RuleFor(x => x.Title)
            .NotEmpty().WithMessage("Tiêu đề không được để trống.")
            .MaximumLength(200).WithMessage("Tiêu đề tối đa 200 ký tự.");

        RuleFor(x => x.Price)
            .GreaterThan(0).WithMessage("Giá phải lớn hơn 0.");

        RuleFor(x => x.AccountUsername)
            .NotEmpty().WithMessage("Tên đăng nhập không được để trống.");

        RuleFor(x => x.AccountPassword)
            .NotEmpty().WithMessage("Mật khẩu không được để trống.");

        RuleFor(x => x.ImageUrls)
            .Must(urls => urls == null || urls.Count <= 10)
            .WithMessage("Tối đa 10 ảnh cho mỗi sản phẩm.");
    }
}

public class UpdateProductRequestValidator : AbstractValidator<UpdateProductRequest>
{
    public UpdateProductRequestValidator()
    {
        RuleFor(x => x.Title)
            .MaximumLength(200).WithMessage("Tiêu đề tối đa 200 ký tự.")
            .When(x => x.Title != null);

        RuleFor(x => x.Price)
            .GreaterThan(0).WithMessage("Giá phải lớn hơn 0.")
            .When(x => x.Price.HasValue);

        RuleFor(x => x.ImageUrls)
            .Must(urls => urls == null || urls.Count <= 10)
            .WithMessage("Tối đa 10 ảnh cho mỗi sản phẩm.")
            .When(x => x.ImageUrls != null);
    }
}
