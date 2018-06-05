# Auth API

A complete server-side Rest API built with **Express** and **PostgreSQL** that handles the authorization process, including: user registration, user login/logout and verifying a user session using security throughout cookies.

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes. 

> **Quick Note:** This API is intended for developing. Later on a new section on deployment will be added.

### Prerequisites

All required dependencies are in ```package.json```, so just run:

```
yarn install
```

if you use **yarn**, or run:

```
npm install
```

if you use **npm**.

### Configuring Database
> **Note on using a command line:** Be sure to use a Unix-like command line that accepts bash scripts. Linux and Mac users don't worry, Windows users use **Git CMD**.


Before configuring the database, create first a ```node_user``` directly on command line, which will be the super-user with permissions to read and write into the database:

```
CREATE USER node_user WITH SUPERUSER PASSWORD 'node_password';
```

File ```users.sql``` contains the schema for the tables used in the API. Feel free to edit or add tables as you wish. If you edit this file, then also be sure to edit ```configuredb.sh``` so that you create any
new table that you wish to add.

### Configuring secrets folder
For security reasons, all the information regarding connection with the database and the APP_SECRET should
never be added to git. For this reason, create a folder ```secrets``` located on the root of the project
and add these two files:

##### db_configuration.js
```javascript
module.exports = {
    user: 'node_user',
    host: 'localhost',
    database: 'usersdb',
    password: 'node_password',
    port: 5432
};
```

##### index.js
```javascript
const APP_SECRET = 'thisisnotasafesecretok';

module.exports = { APP_SECRET };
```

### Running in development mode

Development mode uses **nodemon**, a cool dependency to refresh changes quickly. Just run script dev:

```
yarn run dev
```

or

```
npm run dev
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.


