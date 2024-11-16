import sys
import numpy as np
import pandas as pd
from sklearn.tree import DecisionTreeClassifier
from sklearn.model_selection import train_test_split

# Example training data for health prediction (you can replace it with your own dataset)
data = pd.DataFrame({
    'age': [25, 30, 35, 40, 45],
    'weight': [70, 75, 80, 85, 90],
    'height': [1.75, 1.80, 1.85, 1.90, 1.95],
    'gender': [0, 1, 0, 1, 0],  # 0 for Male, 1 for Female
    'health_risk': [0, 0, 1, 1, 1]  # 0: No risk, 1: At risk
})

# Feature extraction and preprocessing
X = data[['age', 'weight', 'height', 'gender']]
y = data['health_risk']

# Train-test split
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Train the model
model = DecisionTreeClassifier()
model.fit(X_train, y_train)

# Get input from the backend (Age, Weight, Height, Gender)
try:
    age = float(sys.argv[1])
    weight = float(sys.argv[2])
    height = float(sys.argv[3])
    gender = 0 if sys.argv[4] == 'male' else 1
    print("Received inputs:", age, weight, height, gender)  # Debugging line
except Exception as e:
    print("Error parsing inputs:", str(e))  # Debugging line
    sys.exit(1)


# Predict health risk (0 = No risk, 1 = At risk)
prediction = model.predict([[age, weight, height, gender]])[0]

# Output prediction (this will be captured by Node.js)
if prediction == 0:
    print("No risk")
else:
    print("At risk")

print('Age:', age, 'Weight:', weight, 'Height:', height, 'Gender:', gender)

