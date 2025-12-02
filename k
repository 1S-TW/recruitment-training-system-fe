-- Thêm user với role ADMIN
INSERT INTO users (user_id, role_id, full_name, email, phone_number, password_hash, status, email_verified, created_at)
VALUES
(UUID_TO_BIN(UUID()), (SELECT role_id FROM roles WHERE role_name='ADMIN'),
'Nguyen Van A', '12admin@example.com', '0901234567',
'$2a$12$VyZ.U7yTdWl9wDkzjZ3J8.Uu/izJHD7tES7nY7P51kYTfV2pjDUZO', -- mật khẩu mã hóa BCrypt cho '123456'
true, true, NOW());

UPDATE users
SET
   role_id = (SELECT role_id FROM roles WHERE role_name = 'SUPER_ADMIN')
WHERE
   email = '12admin@example.com';

drop table users;
select * from roles;
delete from users;