const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const { PythonShell } = require('python-shell');  // To call Python for ML
require('dotenv').config();

const app = express();

// Middleware
app.use(cors({ origin: '*' }));  // Allow all domains to make requests
app.use(bodyParser.json());  // Parse incoming JSON requests

const PORT = process.env.PORT || 5000;

// MongoDB connection (only required if you are using MongoDB)
if (process.env.MONGO_URI) {
  mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('Error connecting to MongoDB:', err));
} else {
  console.log('Mongo URI is not set. You can still test the prediction API.');
}

// Health calculation route
app.post('/api/calculate', async (req, res) => {
  // Log the incoming request data
  console.log('Request received with data:', req.body);

  const { age, weight, height, gender, waist, hip } = req.body;

  // Validate the input
  if (!age || !weight || !height || !gender) {
    return res.status(400).json({ error: 'Please provide age, weight, height, and gender' });
  }

  if (typeof age !== 'number' || age <= 0) {
    return res.status(400).json({ error: 'Age must be a positive number' });
  }

  if (typeof weight !== 'number' || weight <= 0) {
    return res.status(400).json({ error: 'Weight must be a positive number' });
  }

  if (typeof height !== 'number' || height <= 0) {
    return res.status(400).json({ error: 'Height must be a positive number' });
  }

  // Calculate BMI
  const bmi = weight / (height * height);  // BMI formula: weight (kg) / height (m)²

  // Calculate BMR (Harris-Benedict Equation)
  let bmr = 0;
  if (gender === 'male') {
    bmr = 66 + (13.75 * weight) + (5 * height * 100) - (6.75 * age);  // For men
  } else if (gender === 'female') {
    bmr = 655 + (9.56 * weight) + (1.85 * height * 100) - (4.68 * age);  // For women
  }

  // Calculate Body Fat Percentage (U.S. Navy Method)
  let bodyFatPercentage = 0;
  if (gender === 'male') {
    bodyFatPercentage = 86.01 * Math.log10(waist - hip) - 70.041 * Math.log10(height) + 36.76;
  } else if (gender === 'female') {
    bodyFatPercentage = 163.205 * Math.log10(waist + hip) - 97.684 * Math.log10(height) - 78.387;
  }

  // Prepare arguments for Python script
  const pythonArgs = [age.toString(), weight.toString(), height.toString(), gender];

  // Log the arguments for debugging
  console.log('Python arguments:', pythonArgs);

  // Call Python ML model to predict health risk
  PythonShell.run('./backend/predict_health.py', { args: pythonArgs }, (err, result) => {
    if (err) {
      console.error('Error with machine learning model:', err.message); // Log error message
      console.error('Full Error Object:', err); // Log full error object for more info
      return res.status(500).json({ error: 'Error with machine learning model' });
    }

    // Log the prediction result
    console.log('Prediction Result:', result);

    if (result && result[0]) {
      const prediction = result[0]; // Get prediction result from Python model

      // Return the result as prediction along with health metrics
      res.json({
        prediction,
        bmi: bmi.toFixed(2),
        bmr: bmr.toFixed(2),
        bodyFatPercentage: bodyFatPercentage.toFixed(2),
      });
    } else {
      res.status(500).json({ error: 'No prediction result returned from Python' });
    }
  });
});

// Basic route for testing
app.get('/', (req, res) => {
  res.send('Welcome to Smart Health Check API');
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
