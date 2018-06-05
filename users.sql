CREATE TABLE users (
    username_hash character(64) PRIMARY KEY,
    password_hash character(64),
    session_id character(36)
);

CREATE TABLE users_info (
    username_hash character(64) REFERENCES users(username_hash),
    user_name character(30),
    user_surname character(30),
    user_email varchar(30)
);