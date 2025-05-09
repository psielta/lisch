-- SQLC Queries for Multi-Tenant SaaS

-- ***********************
-- TENANTS
-- ***********************

-- name: CreateTenant :one
INSERT INTO tenants (name, plan, status)
VALUES ($1, $2, $3)
RETURNING id, name, plan, status, created_at;

-- name: GetTenant :one
SELECT id, name, plan, status, created_at
FROM tenants
WHERE id = $1;

-- name: ListTenants :many
SELECT id, name, plan, status, created_at
FROM tenants
ORDER BY created_at DESC
LIMIT $1 OFFSET $2;

-- name: UpdateTenant :one
UPDATE tenants
SET name = $2, plan = $3, status = $4
WHERE id = $1
RETURNING id, name, plan, status, created_at;

-- name: DeleteTenant :exec
DELETE FROM tenants
WHERE id = $1;


-- ***********************
-- USERS
-- ***********************

-- name: CreateUser :one
INSERT INTO users (user_name, email, password_hash, bio, tenant_id, admin, permission_users)
VALUES ($1, $2, $3, $4, $5, $6, $7)
RETURNING id, user_name, email, bio, created_at, updated_at, tenant_id;

-- name: GetUserByID :one
SELECT id, user_name, email, bio, created_at, updated_at, tenant_id, admin, permission_users
FROM users
WHERE id = $1;

-- name: GetUserByEmail :one
SELECT id, user_name, email, password_hash, bio, created_at, updated_at, tenant_id, admin, permission_users
FROM users
WHERE email = $1;

-- name: ListUsers :many
SELECT id, user_name, email, bio, created_at, updated_at, tenant_id, admin, permission_users
FROM users
WHERE tenant_id = $1
ORDER BY email;

-- name: UpdateUser :one
UPDATE users
SET user_name = $2,
    email = $3,
    bio = $4,
    password_hash = $5,
    admin = $6,
    permission_users = $7,
    updated_at = now()
WHERE id = $1
RETURNING id, user_name, email, bio, created_at, updated_at, tenant_id, admin, permission_users;

-- name: UpdateUserNoPassword :one
UPDATE users
SET user_name = $2,
    email = $3,
    bio = $4,
    admin = $5,
    permission_users = $6,
    updated_at = now()
WHERE id = $1
RETURNING id, user_name, email, bio, created_at, updated_at, tenant_id, admin, permission_users;

-- name: DeleteUser :exec
DELETE FROM users
WHERE id = $1;


-- ***********************
-- PRODUCTS
-- ***********************

-- name: CreateProduct :one
INSERT INTO products (seller_id, product_name, description, baseprice, auction_end, tenant_id)
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING id, seller_id, product_name, description, baseprice, auction_end, is_sold, created_at, updated_at, tenant_id;

-- name: GetProductByID :one
SELECT id, seller_id, product_name, description, baseprice, auction_end, is_sold, created_at, updated_at, tenant_id
FROM products
WHERE id = $1;

-- name: ListProducts :many
SELECT id, seller_id, product_name, description, baseprice, auction_end, is_sold, created_at, updated_at, tenant_id
FROM products
ORDER BY created_at DESC
LIMIT $1 OFFSET $2;

-- name: UpdateProduct :one
UPDATE products
SET product_name = $2,
    description = $3,
    baseprice = $4,
    auction_end = $5,
    is_sold = $6,
    updated_at = now()
WHERE id = $1
RETURNING id, seller_id, product_name, description, baseprice, auction_end, is_sold, created_at, updated_at, tenant_id;

-- name: DeleteProduct :exec
DELETE FROM products
WHERE id = $1;
