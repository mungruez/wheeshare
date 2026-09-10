import React, { useState, useEffect, useLayoutEffect } from 'react';
import { View, TextInput, StyleSheet, Text, Button, ScrollView } from 'react-native';
import { useNavigation } from "@react-navigation/native";

const ROW_COUNT = 12;
const COLUMN_COUNT = 12;
const isInBounds = (row, col) => row >= 0 && row < ROW_COUNT && col >= 0 && col < COLUMN_COUNT;

const normalizePuzzle = (crosswordData) => {
  if (!Array.isArray(crosswordData)) return [];
  if (crosswordData.length > 0 && Array.isArray(crosswordData[0])) {
    return crosswordData[0];
  }
  return crosswordData;
};

const placeWord = (grid, answer, startx, starty, orientation, fillValue) => {
  if (!answer || startx === undefined || starty === undefined || !['across', 'down'].includes(orientation)) return;

  for (let i = 0; i < answer.length; i++) {
    const row = orientation === 'down' ? startx + i : startx;
    const col = orientation === 'across' ? starty + i : starty;

    if (!isInBounds(row, col)) continue;
    grid[row][col] = fillValue(i, answer);
  }
};

const generateInitialGrid = (crosswordData) => {
  const puzzle = normalizePuzzle(crosswordData);
  const initialGrid = Array(ROW_COUNT).fill(0).map(() => Array(COLUMN_COUNT).fill('.'));

  puzzle.forEach(({ answer, startx, starty, orientation }) => {
    placeWord(initialGrid, answer, startx, starty, orientation, () => '');
  });

  return initialGrid;
};

const generateAnswerGrid = (crosswordData) => {
  const puzzle = normalizePuzzle(crosswordData);
  const answerGrid = Array(ROW_COUNT).fill(0).map(() => Array(COLUMN_COUNT).fill('.'));

  puzzle.forEach(({ answer, startx, starty, orientation }) => {
    placeWord(answerGrid, answer, startx, starty, orientation, (_, value) => String(value).toUpperCase());
  });

  return answerGrid;
};

const CrosswordGrid = ({ crosswordData }) => {
  const navigation = useNavigation();
  const puzzle = normalizePuzzle(crosswordData);
  const [grid, setGrid] = useState(() => generateInitialGrid(puzzle));

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  useEffect(() => {
    setGrid(generateInitialGrid(puzzle));
  }, [puzzle]);

  const handleInputChange = (row, col, text) => {
    const newGrid = grid.map((gridRow) => [...gridRow]);
    const normalizedText = (text || "").toUpperCase().replace(/[^A-Z]/g, "").slice(0, 1);
    newGrid[row][col] = normalizedText;
    setGrid(newGrid);
  };

  const handleVerify = () => {
    const answerGrid = generateAnswerGrid(puzzle);
    const isCorrect = JSON.stringify(grid) === JSON.stringify(answerGrid);
    if (isCorrect) {
      alert('Congratulations! Your Crossword is correct.');
    } else {
      alert('Incorrect. Please try again.');
    }
  };

  const handleReset = () => {
    setGrid(generateInitialGrid(puzzle));
  };

  const handleSolve = () => {
    setGrid(generateAnswerGrid(puzzle));
  };

  const renderQuestions = () => {
    const questions = { across: [], down: [] };
    puzzle.forEach(({ hint, orientation, position }) => {
      if (!hint) return;
      const key = `${orientation}-${position}`;
      questions[orientation].push(
        <Text key={key} style={styles.questionText}>{`${position}. ${hint}`}</Text>
      );
    });

    return (
      <View style={styles.questionsWrapper}>
        <View style={styles.headingContainer}>
          <Text style={styles.headingText}>Across</Text>
        </View>
        <View style={styles.questionsContainer}>
          {questions.across.length ? questions.across : <Text style={styles.questionText}>No across clues</Text>}
        </View>
        <View style={styles.headingContainer}>
          <Text style={styles.headingText}>Down</Text>
        </View>
        <View style={styles.questionsContainer}>
          {questions.down.length ? questions.down : <Text style={styles.questionText}>No down clues</Text>}
        </View>
      </View>
    );
  };

  if (!puzzle.length) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyStateText}>No crossword to display.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.screenScroll} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      {renderQuestions()}

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.gridWrapper}>
          {grid.map((row, rowIndex) => (
            <View key={`row-${rowIndex}`} style={styles.row}>
              {row.map((cell, colIndex) => {
                const isBlocked = cell === '.';
                const startCell = puzzle.find((entry) => entry.startx === rowIndex && entry.starty === colIndex);
                return (
                  <View key={`cell-${rowIndex}-${colIndex}`} style={styles.cellContainer}>
                    {startCell && <Text style={styles.smallDigit}>{startCell.position}</Text>}
                    <TextInput
                      style={[styles.cell, isBlocked && styles.blockedCell]}
                      value={isBlocked ? "" : cell}
                      editable={!isBlocked}
                      onChangeText={(text) => handleInputChange(rowIndex, colIndex, text)}
                      maxLength={1}
                      keyboardType="default"
                      autoCapitalize="characters"
                      autoCorrect={false}
                    />
                  </View>
                );
              })}
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={styles.buttonContainer}>
        <Button color="#228B22" title="Verify" onPress={handleVerify} />
        <View style={styles.gap} />
        <Button color="#228B22" title="Reset" onPress={handleReset} />
        <View style={styles.gap} />
        <Button color="#228B22" title="Solve" onPress={handleSolve} />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flexGrow: 1, alignItems: 'center', paddingTop: 24, paddingBottom: 80, backgroundColor: '#f8fff6' },
  screenScroll: { flex: 1, width: '100%', backgroundColor: '#f8fff6' },
  questionsWrapper: { width: '100%', paddingHorizontal: 16 },
  questionsContainer: { marginBottom: 10, paddingHorizontal: 10 },
  questionText: { fontSize: 15, fontStyle: 'italic', color: '#1d460b', marginBottom: 4 },
  headingContainer: { marginTop: 10, marginBottom: 5 },
  headingText: { fontSize: 18, fontWeight: 'bold', color: '#228B22', textAlign: 'center' },
  gridWrapper: { paddingVertical: 12, paddingHorizontal: 8 },
  row: { flexDirection: 'row' },
  cellContainer: { position: 'relative' },
  cell: { borderWidth: 1, borderColor: '#228B22', width: 30, height: 30, textAlign: 'center', backgroundColor: '#ffffff', color: '#1d460b', margin: 1, fontWeight: 'bold' },
  blockedCell: { backgroundColor: '#111111', borderColor: '#111111', color: '#111111' },
  smallDigit: { position: 'absolute', top: 2, left: 4, fontSize: 9, fontWeight: 'bold', color: '#228B22', zIndex: 2 },
  buttonContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 16, marginBottom: 16, paddingHorizontal: 12 },
  gap: { width: 10 },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fff6' },
  emptyStateText: { fontSize: 18, color: '#228B22', fontWeight: '600' },
});

export default CrosswordGrid;