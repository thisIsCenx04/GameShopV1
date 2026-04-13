using FluentValidation;
using GameStore.API.DTOs.Admin;

namespace GameStore.API.Validators.Admin;

public class GrantCollaboratorRequestValidator : AbstractValidator<GrantCollaboratorRequest>
{
    public GrantCollaboratorRequestValidator()
    {
        RuleFor(x => x.AdminFeeRate)
            .InclusiveBetween(0.01m, 0.50m)
            .WithMessage("Tỷ lệ hoa hồng Admin phải từ 1% đến 50%.");

        RuleFor(x => x.InsuranceAmount)
            .GreaterThan(0)
            .WithMessage("Phí bảo hiểm phải lớn hơn 0.");
    }
}
