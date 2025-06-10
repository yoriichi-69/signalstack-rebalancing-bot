# AI/ML Algorithms & Models

## Linear Regression

**Definition**: Statistical method that models the relationship between a dependent variable and independent variables using a linear equation.

**Mathematical Form**: y = β₀ + β₁x₁ + β₂x₂ + ... + βₙxₙ + ε

**Key Components**:

- **y**: Dependent variable (target)
- **x**: Independent variables (features)
- **β**: Coefficients (slopes)
- **β₀**: Intercept
- **ε**: Error term

**Assumptions**:

- Linear relationship between variables
- Independence of observations
- Homoscedasticity (constant variance)
- Normal distribution of residuals

**Variants**:

- **Simple Linear Regression**: One independent variable
- **Multiple Linear Regression**: Multiple independent variables
- **Polynomial Regression**: Non-linear relationships using polynomial features

**Applications**: Price prediction, sales forecasting, risk assessment

---

## Logistic Regression

**Definition**: Statistical method used for binary classification problems that uses the logistic function to model probabilities.

**Logistic Function**: p = 1 / (1 + e^(-z))
where z = β₀ + β₁x₁ + β₂x₂ + ... + βₙxₙ

**Key Properties**:

- **Output Range**: Probabilities between 0 and 1
- **S-shaped Curve**: Sigmoid function shape
- **Linear Decision Boundary**: In feature space
- **Maximum Likelihood Estimation**: Parameter estimation method

**Types**:

- **Binary Logistic Regression**: Two classes
- **Multinomial Logistic Regression**: Multiple classes
- **Ordinal Logistic Regression**: Ordered categories

**Advantages**: Interpretable, no distribution assumptions, fast training
**Disadvantages**: Assumes linear relationship, sensitive to outliers

---

## Decision Trees

**Definition**: Tree-like model that makes decisions by splitting data based on feature values, creating a hierarchical set of if-else conditions.

**Structure**:

- **Root Node**: Starting point with entire dataset
- **Internal Nodes**: Decision points based on feature values
- **Leaf Nodes**: Final predictions or classifications
- **Branches**: Connections representing decision outcomes

**Splitting Criteria**:

- **Classification**: Gini impurity, Information gain (entropy)
- **Regression**: Mean squared error, Mean absolute error

**Advantages**:

- Easy to understand and interpret
- Requires little data preparation
- Handles both numerical and categorical data
- Can capture non-linear relationships

**Disadvantages**:

- Prone to overfitting
- Unstable (small data changes can create different trees)
- Biased toward features with more levels

**Pruning**: Technique to reduce overfitting by removing unnecessary branches

---

## Random Forest

**Definition**: Ensemble method that combines multiple decision trees to create a more robust and accurate model.

**Key Concepts**:

- **Bootstrap Aggregating (Bagging)**: Train trees on random subsets of data
- **Feature Randomness**: Each tree considers random subset of features
- **Voting**: Combine predictions from all trees
- **Out-of-Bag (OOB) Error**: Validation using unused bootstrap samples

**Algorithm**:

1. **Bootstrap Sampling**: Create random subsets of training data
2. **Tree Training**: Train decision tree on each subset
3. **Feature Selection**: Use random subset of features at each split
4. **Ensemble**: Combine predictions from all trees
5. **Prediction**: Majority vote (classification) or average (regression)

**Advantages**:

- Reduces overfitting compared to single trees
- Handles missing values well
- Provides feature importance measures
- Works well with default parameters

**Applications**: Feature selection, handling missing data, general-purpose classification and regression

---

## Support Vector Machines (SVM)

**Definition**: Supervised learning algorithm that finds the optimal hyperplane to separate different classes by maximizing the margin between them.

**Key Concepts**:

- **Hyperplane**: Decision boundary that separates classes
- **Support Vectors**: Data points closest to the hyperplane
- **Margin**: Distance between hyperplane and nearest data points
- **Kernel Trick**: Transform data to higher dimensions for non-linear separation

**Types**:

- **Linear SVM**: Linear decision boundary
- **Non-linear SVM**: Uses kernel functions for complex boundaries
- **Support Vector Regression (SVR)**: SVM for regression problems

**Kernel Functions**:

- **Linear**: K(x₁, x₂) = x₁ᵀx₂
- **Polynomial**: K(x₁, x₂) = (γx₁ᵀx₂ + r)^d
- **RBF (Gaussian)**: K(x₁, x₂) = exp(-γ||x₁ - x₂||²)
- **Sigmoid**: K(x₁, x₂) = tanh(γx₁ᵀx₂ + r)

**Advantages**: Effective in high dimensions, memory efficient, versatile
**Disadvantages**: Slow on large datasets, sensitive to feature scaling, no probability estimates

---

## K-Nearest Neighbors (KNN)

**Definition**: Lazy learning algorithm that classifies data points based on the class of their k nearest neighbors in the feature space.

**Algorithm**:

1. **Choose k**: Select number of neighbors to consider
2. **Calculate Distances**: Compute distance to all training points
3. **Find Neighbors**: Identify k closest points
4. **Vote**: Majority class (classification) or average (regression)

**Distance Metrics**:

- **Euclidean**: √Σ(x₁ - x₂)²
- **Manhattan**: Σ|x₁ - x₂|
- **Minkowski**: (Σ|x₁ - x₂|^p)^(1/p)
- **Cosine**: Measures angle between vectors

**Choosing k**:

- **Small k**: More sensitive to noise, complex decision boundaries
- **Large k**: Smoother decision boundaries, less sensitive to noise
- **Odd k**: Avoids ties in binary classification

**Advantages**: Simple, no assumptions about data, works well with small datasets
**Disadvantages**: Computationally expensive, sensitive to irrelevant features, requires feature scaling

---

## K-Means Clustering

**Definition**: Unsupervised learning algorithm that partitions data into k clusters by minimizing within-cluster sum of squares.

**Algorithm**:

1. **Initialize**: Choose k random cluster centers
2. **Assign**: Assign each point to nearest cluster center
3. **Update**: Recalculate cluster centers as mean of assigned points
4. **Repeat**: Continue until convergence (centers stop moving)

**Objective Function**: Minimize Σ||xᵢ - μⱼ||² where μⱼ is cluster center

**Choosing k**:

- **Elbow Method**: Plot inertia vs k, look for "elbow"
- **Silhouette Analysis**: Measure how well-separated clusters are
- **Gap Statistic**: Compare with random data
- **Domain Knowledge**: Use business understanding

**Advantages**: Simple, efficient, works well with spherical clusters
**Disadvantages**: Requires choosing k, sensitive to initialization, assumes spherical clusters

**Variants**: K-means++, Mini-batch K-means, Fuzzy C-means

---

## Principal Component Analysis (PCA)

**Definition**: Dimensionality reduction technique that transforms data to lower-dimensional space while preserving maximum variance.

**Key Concepts**:

- **Principal Components**: New variables that are linear combinations of original features
- **Eigenvalues**: Measure variance explained by each component
- **Eigenvectors**: Directions of maximum variance
- **Explained Variance Ratio**: Proportion of total variance explained

**Algorithm**:

1. **Standardize**: Center and scale data
2. **Covariance Matrix**: Calculate covariance between features
3. **Eigendecomposition**: Find eigenvalues and eigenvectors
4. **Select Components**: Choose top k components
5. **Transform**: Project data onto selected components

**Applications**:

- **Dimensionality Reduction**: Reduce feature space
- **Data Visualization**: Project to 2D/3D for plotting
- **Noise Reduction**: Remove low-variance components
- **Feature Engineering**: Create new uncorrelated features

**Advantages**: Reduces overfitting, removes multicollinearity, speeds up algorithms
**Disadvantages**: Loses interpretability, linear transformation only

---

## Naive Bayes

**Definition**: Probabilistic classifier based on Bayes' theorem with the "naive" assumption of conditional independence between features.

**Bayes' Theorem**: P(A|B) = P(B|A) \* P(A) / P(B)

**For Classification**: P(class|features) = P(features|class) \* P(class) / P(features)

**Types**:

- **Gaussian Naive Bayes**: Assumes features follow normal distribution
- **Multinomial Naive Bayes**: For discrete count data (text classification)
- **Bernoulli Naive Bayes**: For binary/boolean features

**Algorithm**:

1. **Calculate Prior**: P(class) for each class
2. **Calculate Likelihood**: P(feature|class) for each feature
3. **Apply Bayes' Theorem**: Calculate posterior probabilities
4. **Predict**: Choose class with highest probability

**Advantages**: Fast, works well with small datasets, handles multiple classes naturally
**Disadvantages**: Strong independence assumption, can be outperformed by more sophisticated methods

**Applications**: Text classification, spam filtering, sentiment analysis

---

## Gradient Boosting Machines

**Definition**: Ensemble method that builds models sequentially, with each new model correcting errors made by previous models.

**Key Concepts**:

- **Boosting**: Sequential learning where models learn from previous mistakes
- **Gradient Descent**: Optimize loss function by following gradients
- **Weak Learners**: Simple models (usually decision trees) combined to create strong learner
- **Learning Rate**: Controls contribution of each model

**Algorithm**:

1. **Initialize**: Start with simple prediction (mean for regression)
2. **Calculate Residuals**: Find errors from current prediction
3. **Train Weak Learner**: Fit model to predict residuals
4. **Update Prediction**: Add scaled prediction from weak learner
5. **Repeat**: Continue until convergence or max iterations

**Popular Implementations**:

- **XGBoost**: Extreme Gradient Boosting with regularization
- **LightGBM**: Fast gradient boosting with leaf-wise tree growth
- **CatBoost**: Handles categorical features automatically

**Advantages**: High predictive accuracy, handles mixed data types, built-in feature importance
**Disadvantages**: Can overfit, requires hyperparameter tuning, computationally intensive

---

## Neural Network Architectures

### Feedforward Neural Networks

**Definition**: Basic neural network where information flows in one direction from input to output.

**Characteristics**:

- **Unidirectional**: No cycles or loops
- **Fully Connected**: Each neuron connected to all neurons in next layer
- **Multiple Layers**: Input, hidden, and output layers
- **Universal Approximator**: Can approximate any continuous function

**Applications**: Classification, regression, pattern recognition

### Convolutional Neural Networks (CNNs)

**Definition**: Neural networks designed for processing grid-like data such as images.

**Key Components**:

- **Convolutional Layers**: Apply filters to detect local features
- **Pooling Layers**: Reduce spatial dimensions and computational load
- **Filter/Kernel**: Small matrices that detect specific patterns
- **Feature Maps**: Output of convolution operations

**Architecture Pattern**: Convolution → Activation → Pooling → Fully Connected → Output

**Applications**: Image classification, object detection, medical imaging, computer vision

### Recurrent Neural Networks (RNNs)

**Definition**: Neural networks designed for sequential data with connections that create loops.

**Types**:

- **Vanilla RNN**: Basic recurrent structure
- **LSTM (Long Short-Term Memory)**: Solves vanishing gradient problem
- **GRU (Gated Recurrent Unit)**: Simplified version of LSTM

**Key Features**:

- **Memory**: Maintains hidden state across time steps
- **Variable Length**: Handles sequences of different lengths
- **Parameter Sharing**: Same weights used across time steps

**Applications**: Natural language processing, time series prediction, speech recognition

### Transformers

**Definition**: Architecture based on self-attention mechanisms, particularly effective for sequence-to-sequence tasks.

**Key Components**:

- **Self-Attention**: Weighs importance of different positions in sequence
- **Multi-Head Attention**: Multiple attention mechanisms in parallel
- **Positional Encoding**: Adds position information to embeddings
- **Feed-Forward Networks**: Process attention outputs

**Advantages**: Parallelizable, captures long-range dependencies, state-of-the-art performance

**Applications**: Machine translation, text summarization, language models (GPT, BERT)
