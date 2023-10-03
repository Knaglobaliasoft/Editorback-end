const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Sequelize, DataTypes } = require('sequelize');
const validator = require('validator'); // for email validation


const app = express();
const PORT = 3000;

// Use body-parser to parse JSON requests
app.use(bodyParser.json());

// Configure Sequelize
const sequelize = new Sequelize({
  dialect: 'postgres',
  username: 'postgres',
  password: 'password123#',
  database: 'texteditor',
  host: 'localhost',
});

// Define User model
const User = sequelize.define('User', {
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

// Signup Endpoint
app.post('/signup', async (req, res) => {
  const { email, password } = req.body;

  // Validate email format
  if (!validator.isEmail(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  try {
    // Check if the email already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    // Validate password strength (you can customize the rules)
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password should be at least 8 characters long' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user in the database
    const user = await User.create({
      email,
      password: hashedPassword,
    });

    res.json({ id: user.id, email: user.email, password: user.password });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login Endpoint
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Retrieve user from the database
    const user = await User.findOne({ where: { email } });

    if (user) {
      // Compare passwords
      const match = await bcrypt.compare(password, user.password);

      if (match) {
        // Generate a JWT token with expiration (1 hour)
        const token = jwt.sign({ userId: user.id }, 'cvfhvgh', { expiresIn: '1h' });

        res.json({ token ,user});
      } else {
        res.status(401).json({ error: 'Invalid credentials' });
      }
    } else {
      res.status(401).json({ error: 'User not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
