const { Router } = require('express');
const pool = require('./db');
const { hash, Session } = require('./helper');

const router = new Router();

router.get('/all', (req, res, next) => {
    pool.query('SELECT * FROM users;', (q_err, q_res) => {
        if (q_err) return next(q_err);

        res.json(q_res.rows);
    });
});

router.get('/infoall', (req, res, next) => {
    pool.query('SELECT * FROM users u INNER JOIN users_info ui ON (u.username_hash = ui.username_hash);',
                (q_err, q_res) => {
                    if (q_err) return next(q_err);

                    res.json(q_res.rows);
                });
});

const set_session_cookie = (session_str, res) => {
    // bake cookie
    res.cookie('session_str', session_str, {
        expire: Date.now() + 3600000,
        httpOnly: true,
        //secure: true // use with https for secure cookie
    });
};

const set_session = (username, res, session_id) => {
    let session, session_str;

    if (session_id) {
        session_str = Session.dataToString(username, session_id);
    } else {
        // bake session
        session = new Session(username);
        session_str = session.toString();
    }

    return new Promise((resolve, reject) => {
        if (session_id) {
            set_session_cookie(session_str, res);
            resolve();
        } else {
            pool.query(
                'UPDATE users SET session_id = $1 WHERE username_hash = $2',
                [session.id, hash(username)],
                (q_err, q_res) => {
                    if (q_err) return reject(q_err);        
                    set_session_cookie(session_str, res);        
                    resolve();
                }
            )
        }        
    });
};

router.post('/new', (req, res, next) => {
    const { username, password, name, surname, email } = req.body;
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
                                        
                                        pool.query('INSERT INTO users_info(username_hash, user_name, user_surname, user_email) VALUES ($1, $2, $3, $4)',
                                                    [username_hash, name, surname, email],
                                                    (q2_err, q2_res) => {
                                                        if (q2_err) return next(q2_err);

                                                        set_session(username, res)
                                                            .then(() => {
                                                                res.json({ msg: 'User created!' });
                                                            })
                                                            .catch(error => next(error));
                                                    });                                                                                                                        
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

router.post('/login', (req, res, next) => {
    const { username, password } = req.body;

    pool.query(
        'SELECT * FROM users WHERE username_hash = $1 AND password_hash = $2',
        [hash(username), hash(password)],
        (q_err, q_res) => {
            if (q_err) return next(q_err);
            
            const user = q_res.rows[0];
        
            if (user) {
                set_session(username, res, user.session_id)
                    .then(() => {
                        res.json({
                            msg: 'Succesfully logged in!'
                        });
                    })
                    .catch(error => next(error));
            } else {
                // if undefined user
                res.status(400).json({
                    type: 'error',
                    msg: 'Incorrect username or password.'
                });
            }
        }
    );
});

router.get('/logout', (req, res, next) => {
    const { username, id } = Session.parse(req.cookies.session_str);

    pool.query(
        'UPDATE users SET session_id = NULL WHERE username_hash = $1',
        [hash(username)],
        (q_err, q_res) => {
            if (q_err) return next(q_err);
            // remove session cookie
            res.clearCookie('session_str');

            res.json({
                msg: 'Succesfully logged out!'
            });
        }
    )
});

router.get('/authenticated', (req, res, next) => {
    if (req.cookies.session_str) {
        const { username, id } = Session.parse(req.cookies.session_str);

        pool.query(
            'SELECT * FROM users WHERE username_hash = $1',
            [hash(username)],
            (q_err, q_res) => {
                if (q_err) return next(q_err);        
                if (q_res.rows.length === 0) return next(new Error('Not a valid username'));
    
                res.json({
                    usrLogged: true, 
                    authenticated: Session.verify(req.cookies.session_str) &&
                        q_res.rows[0].session_id === id
                });
            }
        )
    } else {
        // no session id, means no one is logged in
        res.json({ 
            usrLogged: false,
            authenticated: false
         });
    }
    
});

module.exports = router;