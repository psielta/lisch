package services

import (
	"context"
	"errors"
	"gobid/internal/helpers"
	"gobid/internal/store/pgstore"
	"strconv"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
	"golang.org/x/crypto/bcrypt"
)

var (
	ErrDuplicatedEmailOrUsername = errors.New("username or email already exists")
	ErrInvalidCredentials        = errors.New("invalid credentials")
	ErrUserNotFound              = errors.New("user not found")
	ErrUserInvalidTenantId       = errors.New("invalid tenant id")
)

type UserService struct {
	pool    *pgxpool.Pool
	queries *pgstore.Queries
}

func NewUserService(pool *pgxpool.Pool) UserService {
	return UserService{
		pool:    pool,
		queries: pgstore.New(pool),
	}
}

func (us *UserService) CreateUser(
	ctx context.Context,
	userName, email, password, bio, tenantId string,
	admin int32,
	permissionUsers int32,
	permissionCategoria int32,
	permissionProduto int32,
	permissionAdicional int32,
	permissionCliente int32,
) (uuid.UUID, error) {
	hash, err := bcrypt.GenerateFromPassword([]byte(password), 12)
	if err != nil {
		return uuid.Nil, err
	}
	tenantID, err := uuid.Parse(tenantId)
	if err != nil {
		return uuid.Nil, err
	}
	args := pgstore.CreateUserParams{
		UserName:            userName,
		Email:               email,
		PasswordHash:        hash,
		Bio:                 bio,
		TenantID:            tenantID,
		Admin:               admin,
		PermissionUsers:     permissionUsers,
		PermissionCategoria: helpers.StringToPgTypeInt(strconv.Itoa(int(permissionCategoria))),
		PermissionProduto:   helpers.StringToPgTypeInt(strconv.Itoa(int(permissionProduto))),
		PermissionAdicional: helpers.StringToPgTypeInt(strconv.Itoa(int(permissionAdicional))),
		PermissionCliente:   helpers.StringToPgTypeInt(strconv.Itoa(int(permissionCliente))),
	}
	id, err := us.queries.CreateUser(ctx, args)
	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23505" {
			return uuid.Nil, ErrDuplicatedEmailOrUsername
		}
		if errors.As(err, &pgErr) && pgErr.Code == "23503" {
			return uuid.Nil, ErrUserInvalidTenantId
		}
		return uuid.UUID{}, err
	}

	return id.ID, nil
}

func (us *UserService) UpdateUser(ctx context.Context,
	id uuid.UUID,
	userName, email, password, bio string,
	admin int32,
	permissionUsers int32,
	permissionCategoria int32,
	permissionProduto int32,
	permissionAdicional int32,
	permissionCliente int32,
) (pgstore.UpdateUserRow, error) {
	hash, err := bcrypt.GenerateFromPassword([]byte(password), 12)
	if err != nil {
		return pgstore.UpdateUserRow{}, err
	}
	args := pgstore.UpdateUserParams{
		ID:                  id,
		UserName:            userName,
		Email:               email,
		PasswordHash:        hash,
		Bio:                 bio,
		Admin:               admin,
		PermissionUsers:     permissionUsers,
		PermissionCategoria: helpers.StringToPgTypeInt(strconv.Itoa(int(permissionCategoria))),
		PermissionProduto:   helpers.StringToPgTypeInt(strconv.Itoa(int(permissionProduto))),
		PermissionAdicional: helpers.StringToPgTypeInt(strconv.Itoa(int(permissionAdicional))),
		PermissionCliente:   helpers.StringToPgTypeInt(strconv.Itoa(int(permissionCliente))),
	}
	user, err := us.queries.UpdateUser(ctx, args)
	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23505" {
			return pgstore.UpdateUserRow{}, ErrDuplicatedEmailOrUsername
		}
		if errors.As(err, &pgErr) && pgErr.Code == "23503" {
			return pgstore.UpdateUserRow{}, ErrUserInvalidTenantId
		}
		return pgstore.UpdateUserRow{}, err
	}

	return user, nil
}

func (us *UserService) UpdateUserNoPassword(ctx context.Context,
	id uuid.UUID,
	userName, email, bio string,
	admin int32,
	permissionUsers int32,
	permissionCategoria int32,
	permissionProduto int32,
	permissionAdicional int32,
	permissionCliente int32,
) (pgstore.UpdateUserNoPasswordRow, error) {

	args := pgstore.UpdateUserNoPasswordParams{
		ID:                  id,
		UserName:            userName,
		Email:               email,
		Bio:                 bio,
		Admin:               admin,
		PermissionUsers:     permissionUsers,
		PermissionCategoria: helpers.StringToPgTypeInt(strconv.Itoa(int(permissionCategoria))),
		PermissionProduto:   helpers.StringToPgTypeInt(strconv.Itoa(int(permissionProduto))),
		PermissionAdicional: helpers.StringToPgTypeInt(strconv.Itoa(int(permissionAdicional))),
		PermissionCliente:   helpers.StringToPgTypeInt(strconv.Itoa(int(permissionCliente))),
	}
	user, err := us.queries.UpdateUserNoPassword(ctx, args)
	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23505" {
			return pgstore.UpdateUserNoPasswordRow{}, ErrDuplicatedEmailOrUsername
		}
		if errors.As(err, &pgErr) && pgErr.Code == "23503" {
			return pgstore.UpdateUserNoPasswordRow{}, ErrUserInvalidTenantId
		}
		return pgstore.UpdateUserNoPasswordRow{}, err
	}

	return user, nil
}

func (us *UserService) AuthenticateUser(ctx context.Context, email, password string) (pgstore.User, error) {
	user, err := us.queries.GetUserByEmail(ctx, email)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return pgstore.User{}, ErrInvalidCredentials
		}

		return pgstore.User{}, err
	}

	err = bcrypt.CompareHashAndPassword(user.PasswordHash, []byte(password))

	if err != nil {
		if errors.Is(err, bcrypt.ErrMismatchedHashAndPassword) {
			return pgstore.User{}, ErrInvalidCredentials
		}

		return pgstore.User{}, err
	}

	return user, nil
}

func (us *UserService) GetUserByID(ctx context.Context, id uuid.UUID) (pgstore.GetUserByIDRow, error) {
	dbUser, err := us.queries.GetUserByID(ctx, id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return pgstore.GetUserByIDRow{}, ErrUserNotFound
		}
		return pgstore.GetUserByIDRow{}, err
	}

	return dbUser, nil
}

func (us *UserService) ListUsers(ctx context.Context, tenantID uuid.UUID) ([]pgstore.ListUsersRow, error) {
	users, err := us.queries.ListUsers(ctx, tenantID)
	if err != nil {
		return nil, err
	}
	return users, nil
}

func (us *UserService) DeleteUser(ctx context.Context, id uuid.UUID) error {
	err := us.queries.DeleteUser(ctx, id)
	if err != nil {
		return err
	}
	return nil
}

func (us *UserService) GetTenantByID(ctx context.Context, id uuid.UUID) (pgstore.Tenant, error) {
	tenant, err := us.queries.GetTenant(ctx, id)
	if err != nil {
		return pgstore.Tenant{}, err
	}
	return tenant, nil
}
