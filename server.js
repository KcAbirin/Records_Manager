const express = require('express');
        const mysql = require('mysql2');
        const bcrypt = require('bcrypt');
        const app = express();
        const port = 3000;

        // Middleware to parse URL-encoded form data
        app.use(express.urlencoded({ extended: true }));
        app.use(express.json());
        app.use(express.static(__dirname));

        // --- Database Connection Pool ---
        const pool = mysql.createPool({
            host: 'localhost',
            user: 'root',
            password: 'Kcjn2025',
            database: 'boarding_house_db'
        }).promise();

        async function executeQuery(sql, params = []) {
            try {
                const [rows] = await pool.execute(sql, params);
                return rows;
            } catch (error) {
                console.error('Database query error:', error);
                throw error;
            }
        }

        // Test the database connection
        pool.getConnection()
            .then(connection => {
                console.log('Successfully connected to MySQL database!');
                connection.release(); // Release the connection back to the pool
            })
            .catch(error => {
                console.error('Error connecting to MySQL:', error);
            });
// --- API Endpoints ---

// Route to serve the login page (index.html)
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

// Route to serve the register page
app.get('/register.html', (req, res) => {
    res.sendFile(__dirname + '/register.html');
});

// Handle login form submission (POST request to /dashboard)
app.post('/dashboard', async (req, res) => {
    const { username, password } = req.body;

    try {
        const sql = 'SELECT user_id, username, hashed_password FROM users WHERE username = ?';
        const [users] = await executeQuery(sql, [username]);

        if (users.length > 0) {
            const user = users[0];
            const passwordMatch = await bcrypt.compare(password, user.hashed_password);

            if (passwordMatch) {
                res.send('Login successful!  (Session/token would be set here, then redirect to dashboard)');
            } else {
                res.send('Login failed.  Invalid credentials.');
            }
        } else {
            res.send('Login failed.  Invalid credentials.');
        }
    } catch (error) {
        console.error("Error during login:", error);
        res.status(500).send('Internal server error');
    }
});

// Handle user registration (POST request to /register)
app.post('/register', async (req, res) => {
    const { username, password } = req.body;

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const sql = 'INSERT INTO users (username, hashed_password) VALUES (?, ?)';
        await executeQuery(sql, [username, hashedPassword]);
        res.send('User registered successfully!');
    } catch (error) {
        console.error("Error registering user:", error);
        res.status(500).send('Registration failed: ' + error.message);
    }
});
    

app.get('/viewTenants', async (req, res) => {
    try {
        const sql = 'SELECT * FROM tenants';
        const tenants = await executeQuery(sql);
        res.json(tenants);
    } catch (error) {
        res.status(500).send('Error fetching tenants');
    }
});

// ... other API endpoints ...

// --- Start the server ---
app.listen(port, () => {
            console.log(`Server listening at http://localhost:${port}`);
    });
