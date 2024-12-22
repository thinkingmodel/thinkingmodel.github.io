---
layout: post
read_time: true
show_date: true
title:  Single Neuron Perceptron
date:   2019-06-25 13:32:20 -0600
description: Single neuron perceptron that classifies elements while learning efficiently.
img: /posts/20210125/Perceptron.jpg 
tags: [machine learning, neural networks]
author: Abhinav Thorat
mathjax: yes
---

Human brains are remarkable in their ability to process information and make decisions. This capability stems from the billions of interconnected neurons in our brain, which receive, process, and transmit signals to perform complex tasks. Inspired by these biological neurons, artificial neurons like the perceptron have been designed to mimic this behavior on a much simpler scale, paving the way for advancements in Artificial Intelligence.

As an introduction to Python and Machine Learning, I decided to code the "Hello World!" of the field—a single neuron perceptron.

## What is a Perceptron?

A perceptron is the fundamental building block of a neural network, analogous to a biological neuron. Its invention laid the foundation for the vast field of Artificial Intelligence we see today.

In the late 1950s, [Frank Rosenblatt](https://en.wikipedia.org/wiki/Frank_Rosenblatt) introduced a simple yet powerful algorithm to construct machines capable of learning various tasks.

At its core, a perceptron is a mechanism for processing inputs and applying rules to generate outputs. Despite its simplicity, it serves as a gateway to understanding more complex systems.

<center><img src='./assets/img/posts/20210125/Perceptron.png'></center>

Picture a "neuron" that activates when it receives input signals through synapses. The neuron aggregates these signals, applies rules, and generates one or more outputs. Mathematically, a perceptron uses weights to process input signals, combining them into a single value.

For example, consider a perceptron with three inputs: $x_1 = 1$, $x_2 = 2$, and $x_3 = 3$, and corresponding weights $w_1 = 0.5$, $w_2 = 1$, and $w_3 = -1$. The perceptron calculates the output by multiplying each input by its weight and summing the results:

<p style="text-align:center">\(<br>
\begin{align}
\begin{split}
(x_1 \times w_1) + (x_2 \times w_2) + (x_3 \times w_3)
\end{split}
\end{align}
\)</p>

<p style="text-align:center">\(<br>
\begin{align}<br>
\begin{split}<br>
(0.5 \times 1) + (1 \times 2) + (-1 \times 3) = 0.5 + 2 - 3 = -0.5
\end{split}<br>
\end{align}<br>
\)</p>

After computing this value, an activation function is applied. If we use a linear activation function (i.e., keep the value as is), the output here is -0.5. 

In practice, this output helps classify data. For instance, negative values might correspond to Type A and positive values to Type B. The real power of a perceptron comes from its ability to learn through backpropagation, where it adjusts its weights to improve predictions.

<tweet>The magic starts with backpropagation, where the perceptron "learns" by iteratively adjusting its weights to minimize errors.</tweet>

To train a perceptron, we use a dataset with known inputs and outputs (a training set). By comparing the perceptron's predictions with actual outcomes, we calculate errors and adjust the weights accordingly. Over time, this iterative process enables the perceptron to make accurate predictions even on unseen data.

This learning process is driven by gradient descent, a mathematical technique that uses differential calculus to fine-tune the weights. [This video series by 3Blue1Brown explains it wonderfully.](https://www.youtube.com/watch?v=aircAruvnKk&list=PLZHQObOWTQDNU6R1_67000Dx_ZCJB-3pi)

### My Perceptron Implementation

I implemented a single-neuron perceptron to classify whether a point lies above or below a randomly generated line. The perceptron has three inputs and corresponding weights:

1. Input 1: The x-coordinate of the point
2. Input 2: The y-coordinate of the point
3. Input 3: The bias, always set to 1 (to handle lines that don't pass through the origin)

Initially, all weights are set to zero. The perceptron learns using 1,000 random points per iteration.

The perceptron calculates its output using the following activation function:

- If $x \times w_x + y \times w_y + w_{bias}$ is positive, the output is 1.
- Otherwise, the output is 0.

The error for each point is computed as:

| Expected  |  Predicted | Error |
|:----:|:----:|:----:|
| 1    | -1   |  1    |
| 1    |  1   |  0    |
| -1   | -1   |  0    |
| -1   |  1   | -1    |

When an error occurs, weights are updated as follows:

    New_weight = Old_weight + error \times input \times learning_rate
    
For example:

    New_weight_x = Old_weight_x + error \times x \times learning_rate

The learning rate, a critical parameter, determines the adjustment size. To ensure stability as weights approach optimal values, I programmed the learning rate to decrease over iterations:

    learning_rate = 0.01 / (iteration + 1)

This gradual reduction ensures more precise adjustments over time.

<center><img src='./assets/img/posts/20210125/Learning_1000_points_per_iteration.jpg'></center>

### Final Thoughts

Ultimately, the perceptron converges to a solution, accurately identifying the line separating the data. While perceptrons are powerful for solving linear problems, they have limitations. For instance, they can't solve non-linear problems.

Modern neural networks overcome these limitations by combining multiple perceptrons across layers, introducing other types of neurons (e.g., convolutional or recurrent), and enabling solutions for a vast array of complex problems.
