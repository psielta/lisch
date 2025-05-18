package user

import (
	"context"
	"gobid/internal/usecase/validator"
)

type CreateUserReq struct {
	UserName            string `json:"user_name"`
	Email               string `json:"email"`
	Password            string `json:"password"`
	Bio                 string `json:"bio"`
	TenantID            string `json:"tenant_id"`
	Admin               int32  `json:"admin"`
	PermissionUsers     int32  `json:"permission_users"`
	PermissionCategoria int32  `json:"permission_categoria"`
	PermissionProduto   int32  `json:"permission_produto"`
	PermissionAdicional int32  `json:"permission_adicional"`
}

type UpdateUserReq struct {
	ID                  string `json:"id"`
	UserName            string `json:"user_name"`
	Email               string `json:"email"`
	Password            string `json:"password"`
	Bio                 string `json:"bio"`
	TenantID            string `json:"tenant_id"`
	Admin               int32  `json:"admin"`
	PermissionUsers     int32  `json:"permission_users"`
	PermissionCategoria int32  `json:"permission_categoria"`
	PermissionProduto   int32  `json:"permission_produto"`
	PermissionAdicional int32  `json:"permission_adicional"`
}
type UpdateUserReqNoPassword struct {
	ID                  string `json:"id"`
	UserName            string `json:"user_name"`
	Email               string `json:"email"`
	Bio                 string `json:"bio"`
	TenantID            string `json:"tenant_id"`
	Admin               int32  `json:"admin"`
	PermissionUsers     int32  `json:"permission_users"`
	PermissionCategoria int32  `json:"permission_categoria"`
	PermissionProduto   int32  `json:"permission_produto"`
	PermissionAdicional int32  `json:"permission_adicional"`
}

func (req CreateUserReq) Valid(ctx context.Context) validator.Evaluator {
	var eval validator.Evaluator

	eval.CheckField(validator.NotBlank(req.UserName), "user_name", "this field cannot be empty")
	eval.CheckField(validator.NotBlank(req.Email), "email", "this field cannot be empty")
	eval.CheckField(validator.NotBlank(req.TenantID), "tenant_id", "this field cannot be empty")
	eval.CheckField(validator.IsUUID(req.TenantID), "tenant_id", "this field must be a valid uuid")
	eval.CheckField(validator.Matches(req.Email, validator.EmailRX), "email", "must be a valid email")
	eval.CheckField(validator.NotBlank(req.Email), "bio", "this field cannot be empty")
	eval.CheckField(
		validator.MinChars(req.Bio, 10) && validator.MaxChars(req.Bio, 255),
		"bio",
		"this field must have a length between 10 and 255",
	)

	eval.CheckField(validator.MinChars(req.Password, 8), "password", "password must be bigger than 8 chars")

	return eval
}

func (req UpdateUserReq) Valid(ctx context.Context) validator.Evaluator {
	var eval validator.Evaluator
	eval.CheckField(validator.NotBlank(req.UserName), "user_name", "this field cannot be empty")
	eval.CheckField(validator.NotBlank(req.Email), "email", "this field cannot be empty")
	eval.CheckField(validator.NotBlank(req.TenantID), "tenant_id", "this field cannot be empty")
	eval.CheckField(validator.IsUUID(req.TenantID), "tenant_id", "this field must be a valid uuid")
	eval.CheckField(validator.Matches(req.Email, validator.EmailRX), "email", "must be a valid email")
	eval.CheckField(validator.NotBlank(req.Email), "bio", "this field cannot be empty")
	eval.CheckField(
		validator.MinChars(req.Bio, 10) && validator.MaxChars(req.Bio, 255),
		"bio",
		"this field must have a length between 10 and 255",
	)

	eval.CheckField(validator.MinChars(req.Password, 8), "password", "password must be bigger than 8 chars")
	return eval
}
func (req UpdateUserReqNoPassword) Valid(ctx context.Context) validator.Evaluator {
	var eval validator.Evaluator
	eval.CheckField(validator.NotBlank(req.UserName), "user_name", "this field cannot be empty")
	eval.CheckField(validator.NotBlank(req.Email), "email", "this field cannot be empty")
	eval.CheckField(validator.NotBlank(req.TenantID), "tenant_id", "this field cannot be empty")
	eval.CheckField(validator.IsUUID(req.TenantID), "tenant_id", "this field must be a valid uuid")
	eval.CheckField(validator.Matches(req.Email, validator.EmailRX), "email", "must be a valid email")
	eval.CheckField(validator.NotBlank(req.Email), "bio", "this field cannot be empty")
	eval.CheckField(
		validator.MinChars(req.Bio, 10) && validator.MaxChars(req.Bio, 255),
		"bio",
		"this field must have a length between 10 and 255",
	)

	return eval
}
