//App.js

import React from "react";
import { View, StyleSheet, useAnimatedValue } from "react-native";
import CrosswordGrid from "./CrosswordGrid";
import { useLayoutEffect } from "react";

const Crossword = () => {
	// levels can be added here in the crosswordData
	const crosswordData = [
		[
			{
				answer: "NONE",
				hint: "In Python, the equivalent of null is: ",
				startx: 6,
				starty: 2,
				orientation: "down",
				position: 1,
			},
			{
				answer: "YIELD",
				hint: "Which keyword is used to return from a Python generator function",
				startx: 2,
				starty: 2,
				orientation: "down",
				position: 2,
			},
			{
				answer: "LISTED",
				hint: "What is printed by the following line of Python code:  (lambda x: print(x+'TED'))('LIS')",
				startx: 2,
				starty: 5,
				orientation: "across",
				position: 3,
			},
			{
				answer: "PYTHON",
				hint:"What does the following line print:  print(''.join('P-Y-T-H-O-N'.split('-')))",
				startx: 1,
				starty: 2,
				orientation: "across",
				position: 4,
			},
		],
		[
			{
				answer: "REMOVE",
				hint: "Which List method is used to remove an item using a specified value?",
				startx: 2,
				starty: 3,
				orientation: "across",
				position: 1,
			},
			{
				answer: "MAGIC",
				hint: "In Python adding two numbers using the + operator, internally, the __add__() method will be called. 'Dunder' methods that start and end with the double underscores are also called:",
				startx: 4,
				starty: 3,
				orientation: "down",
				position: 2,
			},
			{
				answer: "RANGE",
				hint: "Which Python function is used to generate a sequence of numbers that can be used as the iterable in a for loop",
				startx: 2,
				starty: 3,
				orientation: "down",
				position: 3,
			},
			{
				answer: "ELIF",
				hint: "What is used for: 'else if' in python?",
				startx: 7,
				starty: 3,
				orientation: "down",
				position: 4,
			},
		],
		[
			{
				answer: "OCTAL",
				hint: "In Python what numbers are prefixed with a zero followed by a lowercase o",
				startx: 2,
				starty: 2,
				orientation: "down",
				position: 1,
			},
			{
				answer: "SYNTAX",
				hint: "A set of rules which defines the ways in which words can be coupled in sentences is called",
				startx: 5,
				starty: 1,
				orientation: "down",
				position: 2,
			},
			{
				answer: "PACKAGE",
				hint: "A collection of Python modules organized in a directory",
				startx: 1,
				starty: 5,
				orientation: "across",
				position: 3,
			},
			{
				answer: "APPEND",
				hint: "What is the name of the function used to add an item to the front of a list",
				startx: 7,
				starty: 2,
				orientation: "down",
				position: 4,
			},
		],
	];

	return (
		<View style={styles.container}>
			<CrosswordGrid crosswordData={crosswordData} />
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
	},
});

export default Crossword;
