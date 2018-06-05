const express = require('express');
const bodyParser = require('body-parser');
const SHA256 = require('crypto-js/sha256');
const pool = require('./db');
const { APP_SECRET } = require('./secrets');

const app = express();

app.use(bodyParser.json());

const hash = (str) => {
    return SHA256(`${APP_SECRET}${str}${APP_SECRET}`).toString();
};

app.get('/user/all', (req, res, next) => {
    pool.query('SELECT * FROM users;', (q_err, q_res) => {
        if (q_err) return next(q_err);

        res.json(q_res.rows);
    });
});

app.post('/user/new', (req, res, next) => {
    const { username, password } = req.body;
    const username_hash = hash(username);
    pool.query('SELECT * FROM users WHERE username_hash = $1',
                [username_hash],
                (q0_err, q0_res) => {
                    if (q0_err) return next(q0_err);

                    if (q0_res.rows.length === 0) {
                        // insert new user
                        pool.query('INSERT INTO users(username_hash, password_hash) VALUES($1, $2)',
                                    [username_hash, hash(password)],
                                    (q1_err, q1_res) => {
                                        if(q1_err) return next(q1_err);
                                        res.json({ msg: 'User created!' });
                                    });
                    } else {
                        // conflict
                        res.status(409).json({
                            type: 'error',
                            msg: 'The username has already been taken'
                        });
                    }
                })   
});

app.use((err, req, res, next) => {
    if (!err.statusCode) err.statusCode = 500;
    res.status(err.statusCode).json({ type: 'error', msg: err.message });
});

module.exports = app;