# AI/ML Fundamentals

## Artificial Intelligence (AI)

**Definition**: Computer systems designed to perform tasks that typically require human intelligence, such as visual perception, speech recognition, decision-making, and language translation.

**Types of AI**:

- **Narrow AI**: Designed for specific tasks (current state of AI)
- **General AI**: Human-level intelligence across all domains (theoretical)
- **Super AI**: Exceeds human intelligence in all areas (theoretical)

**Subfields**:

- **Machine Learning**: Systems that learn from data
- **Natural Language Processing**: Understanding and generating human language
- **Computer Vision**: Interpreting visual information
- **Robotics**: Physical AI systems that interact with the world
- **Expert Systems**: Rule-based systems that mimic human expertise

**Applications**: Image recognition, speech processing, autonomous vehicles, recommendation systems, game playing

---

## Machine Learning (ML)

**Definition**: A subset of AI that enables computers to learn and improve from experience without being explicitly programmed for every task.

**Learning Process**:

1. **Data Collection**: Gather relevant training data
2. **Data Preprocessing**: Clean and prepare data for training
3. **Model Selection**: Choose appropriate algorithm
4. **Training**: Learn patterns from training data
5. **Evaluation**: Test model performance on new data
6. **Deployment**: Use model to make predictions

**Types of Learning**:

- **Supervised Learning**: Learn from labeled examples
- **Unsupervised Learning**: Find patterns in unlabeled data
- **Reinforcement Learning**: Learn through interaction and feedback
- **Semi-supervised Learning**: Combine labeled and unlabeled data

**Key Concepts**: Features, labels, training/validation/test sets, bias-variance tradeoff

---

## Deep Learning

**Definition**: A subset of machine learning based on artificial neural networks with multiple layers (deep networks).

**Key Characteristics**:

- **Hierarchical Learning**: Each layer learns increasingly complex features
- **Automatic Feature Extraction**: No manual feature engineering required
- **Large Data Requirements**: Performs best with big datasets
- **Computational Intensity**: Requires significant computing power

**Deep Learning Architectures**:

- **Feedforward Networks**: Information flows in one direction
- **Convolutional Neural Networks (CNNs)**: Specialized for image processing
- **Recurrent Neural Networks (RNNs)**: Handle sequential data
- **Transformers**: Attention-based models for various tasks

**Applications**: Image recognition, natural language processing, speech recognition, autonomous driving

---

## Supervised Learning

**Definition**: Machine learning approach where models learn from labeled training data to make predictions on new, unseen data.

**Components**:

- **Input Features**: Variables used to make predictions
- **Target Variable**: What the model is trying to predict
- **Training Data**: Labeled examples used to train the model
- **Test Data**: Unseen data used to evaluate model performance

**Types**:

- **Classification**: Predict categories or classes
  - Binary Classification: Two classes (spam/not spam)
  - Multi-class Classification: Multiple classes (image categories)
  - Multi-label Classification: Multiple labels per instance
- **Regression**: Predict continuous numerical values
  - Linear Regression: Straight-line relationships
  - Polynomial Regression: Curved relationships

**Evaluation Metrics**:

- **Classification**: Accuracy, Precision, Recall, F1-Score, ROC-AUC
- **Regression**: Mean Squared Error, Mean Absolute Error, R-squared

---

## Unsupervised Learning

**Definition**: Machine learning approach that finds hidden patterns in data without labeled examples.

**Types**:

- **Clustering**: Group similar data points together
  - K-Means: Partition data into k clusters
  - Hierarchical Clustering: Create tree-like cluster structures
  - DBSCAN: Density-based clustering
- **Dimensionality Reduction**: Reduce number of features while preserving information
  - Principal Component Analysis (PCA): Linear dimensionality reduction
  - t-SNE: Non-linear visualization technique
  - UMAP: Uniform Manifold Approximation and Projection
- **Association Rules**: Find relationships between different variables
  - Market Basket Analysis: "People who buy X also buy Y"

**Applications**: Customer segmentation, anomaly detection, data visualization, feature engineering

---

## Reinforcement Learning

**Definition**: Learning approach where an agent learns to make decisions by interacting with an environment and receiving rewards or penalties.

**Key Components**:

- **Agent**: The learner or decision maker
- **Environment**: The world the agent interacts with
- **State**: Current situation of the agent
- **Action**: What the agent can do
- **Reward**: Feedback from the environment
- **Policy**: Strategy for choosing actions

**Learning Process**:

1. **Observation**: Agent observes current state
2. **Action**: Agent chooses and performs an action
3. **Reward**: Environment provides feedback
4. **Learning**: Agent updates its strategy
5. **Repeat**: Process continues until optimal policy is learned

**Algorithms**:

- **Q-Learning**: Learn action-value functions
- **Policy Gradients**: Directly optimize policy
- **Actor-Critic**: Combine value and policy methods
- **Deep Q-Networks (DQN)**: Use deep learning for Q-learning

**Applications**: Game playing, robotics, autonomous vehicles, resource allocation

---

## Neural Networks

**Definition**: Computing systems inspired by biological neural networks, consisting of interconnected nodes (neurons) that process information.

**Basic Structure**:

- **Input Layer**: Receives input data
- **Hidden Layers**: Process information (can have multiple layers)
- **Output Layer**: Produces final results
- **Weights**: Connections between neurons with different strengths
- **Biases**: Additional parameters to adjust neuron outputs

**Forward Propagation**:

1. **Input**: Data enters through input layer
2. **Computation**: Each neuron computes weighted sum of inputs
3. **Activation**: Apply activation function to the sum
4. **Output**: Pass result to next layer

**Backpropagation**:

1. **Error Calculation**: Compare output with target
2. **Error Propagation**: Send error backward through network
3. **Weight Updates**: Adjust weights to reduce error
4. **Iteration**: Repeat process to improve performance

**Types**: Perceptron, Multi-layer Perceptron, Deep Neural Networks

---

## Activation Functions

**Definition**: Mathematical functions that determine the output of neural network neurons, introducing non-linearity to enable complex learning.

**Common Activation Functions**:

### ReLU (Rectified Linear Unit)

- **Formula**: f(x) = max(0, x)
- **Properties**: Simple, computationally efficient, helps with vanishing gradient
- **Use**: Hidden layers in deep networks

### Sigmoid

- **Formula**: f(x) = 1 / (1 + e^(-x))
- **Properties**: Outputs between 0 and 1, smooth gradient
- **Use**: Binary classification output layer

### Tanh (Hyperbolic Tangent)

- **Formula**: f(x) = (e^x - e^(-x)) / (e^x + e^(-x))
- **Properties**: Outputs between -1 and 1, zero-centered
- **Use**: Hidden layers, RNN applications

### Softmax

- **Formula**: f(x_i) = e^(x_i) / Σ(e^(x_j))
- **Properties**: Outputs sum to 1, used for probability distributions
- **Use**: Multi-class classification output layer

### Leaky ReLU

- **Formula**: f(x) = max(αx, x) where α is small positive value
- **Properties**: Prevents dying ReLU problem
- **Use**: Deep networks with ReLU issues

---

## Loss Functions

**Definition**: Functions that measure the difference between predicted and actual values, guiding the learning process.

**Regression Loss Functions**:

### Mean Squared Error (MSE)

- **Formula**: MSE = (1/n) \* Σ(y_true - y_pred)²
- **Properties**: Penalizes large errors heavily
- **Use**: Regression problems, neural network training

### Mean Absolute Error (MAE)

- **Formula**: MAE = (1/n) \* Σ|y_true - y_pred|
- **Properties**: Less sensitive to outliers than MSE
- **Use**: Robust regression, when outliers are present

**Classification Loss Functions**:

### Binary Cross-Entropy

- **Formula**: -Σ(y*log(p) + (1-y)*log(1-p))
- **Properties**: Measures probability distribution difference
- **Use**: Binary classification problems

### Categorical Cross-Entropy

- **Formula**: -Σ(y_true \* log(y_pred))
- **Properties**: Multi-class extension of binary cross-entropy
- **Use**: Multi-class classification

### Sparse Categorical Cross-Entropy

- **Properties**: Same as categorical but with integer labels
- **Use**: Multi-class classification with integer encoded labels

---

## Overfitting & Underfitting

### Overfitting

**Definition**: When a model learns training data too well, including noise and irrelevant patterns, resulting in poor performance on new data.

**Symptoms**:

- High training accuracy, low validation accuracy
- Large gap between training and validation performance
- Model performs poorly on test data

**Solutions**:

- **Regularization**: Add penalty terms to prevent complexity
- **Cross-validation**: Use multiple validation sets
- **Early stopping**: Stop training when validation performance degrades
- **Data augmentation**: Increase training data variety
- **Dropout**: Randomly deactivate neurons during training

### Underfitting

**Definition**: When a model is too simple to capture underlying patterns in the data.

**Symptoms**:

- Low training and validation accuracy
- Model cannot learn from training data
- Poor performance across all datasets

**Solutions**:

- **Increase model complexity**: Add more layers or neurons
- **Feature engineering**: Create more relevant features
- **Reduce regularization**: Allow model more flexibility
- **Train longer**: Give model more time to learn
- **Better algorithms**: Use more sophisticated methods

---

## Training, Validation, Testing

### Training Set

**Definition**: Data used to train the machine learning model.

**Purpose**: Model learns patterns and relationships from this data
**Typical Size**: 60-80% of total dataset
**Usage**: Adjust model parameters (weights, biases)

### Validation Set

**Definition**: Data used to tune hyperparameters and evaluate model during development.

**Purpose**: Select best model configuration and prevent overfitting
**Typical Size**: 10-20% of total dataset
**Usage**: Hyperparameter tuning, model selection, early stopping

### Test Set

**Definition**: Data held out until final evaluation to assess model performance.

**Purpose**: Unbiased evaluation of final model performance
**Typical Size**: 10-20% of total dataset
**Usage**: Final performance assessment, never used during training

**Cross-Validation**: Technique that uses multiple train/validation splits to get more robust performance estimates.
