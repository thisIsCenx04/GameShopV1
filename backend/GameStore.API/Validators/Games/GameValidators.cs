using FluentValidation;
using GameStore.API.DTOs.Games;

namespace GameStore.API.Validators.Games;

public class CreateGameRequestValidator : AbstractValidator<CreateGameRequest>
{
    public CreateGameRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Tên game không được để trống.")
            .MaximumLength(100).WithMessage("Tên game tối đa 100 ký tự.");

        RuleFor(x => x.Slug)
            .NotEmpty().WithMessage("Slug không được để trống.")
            .MaximumLength(100).WithMessage("Slug tối đa 100 ký tự.")
            .Matches("^[a-z0-9-]+$").WithMessage("Slug chỉ chứa chữ thường, số và dấu gạch ngang.");
    }
}

public class CreateGameRankRequestValidator : AbstractValidator<CreateGameRankRequest>
{
    public CreateGameRankRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Tên rank không được để trống.")
            .MaximumLength(100).WithMessage("Tên rank tối đa 100 ký tự.");
    }
}

public class CreateGameServerRequestValidator : AbstractValidator<CreateGameServerRequest>
{
    public CreateGameServerRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Tên server không được để trống.")
            .MaximumLength(100).WithMessage("Tên server tối đa 100 ký tự.");
    }
}
