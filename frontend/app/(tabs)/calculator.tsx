import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type Operation = '+' | '-' | '×' | '÷' | null;

export default function CalculatorScreen() {
  const [display, setDisplay] = useState('0');
  const [previousValue, setPreviousValue] = useState<number | null>(null);
  const [operation, setOperation] = useState<Operation>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);

  const handleNumber = (num: string) => {
    if (waitingForOperand) {
      setDisplay(num);
      setWaitingForOperand(false);
    } else {
      setDisplay(display === '0' ? num : display + num);
    }
  };

  const handleDecimal = () => {
    if (waitingForOperand) {
      setDisplay('0.');
      setWaitingForOperand(false);
    } else if (!display.includes('.')) {
      setDisplay(display + '.');
    }
  };

  const handleOperation = (op: Operation) => {
    const currentValue = parseFloat(display);

    if (previousValue !== null && operation && !waitingForOperand) {
      const result = calculate(previousValue, currentValue, operation);
      setDisplay(String(result));
      setPreviousValue(result);
    } else {
      setPreviousValue(currentValue);
    }

    setOperation(op);
    setWaitingForOperand(true);
  };

  const calculate = (prev: number, current: number, op: Operation): number => {
    switch (op) {
      case '+':
        return prev + current;
      case '-':
        return prev - current;
      case '×':
        return prev * current;
      case '÷':
        return current !== 0 ? prev / current : 0;
      default:
        return current;
    }
  };

  const handleEquals = () => {
    if (previousValue === null || operation === null) return;

    const currentValue = parseFloat(display);
    const result = calculate(previousValue, currentValue, operation);
    
    // Format result to avoid floating point issues
    const formattedResult = parseFloat(result.toFixed(10));
    setDisplay(String(formattedResult));
    setPreviousValue(null);
    setOperation(null);
    setWaitingForOperand(true);
  };

  const handleClear = () => {
    setDisplay('0');
    setPreviousValue(null);
    setOperation(null);
    setWaitingForOperand(false);
  };

  const handleBackspace = () => {
    if (display.length > 1) {
      setDisplay(display.slice(0, -1));
    } else {
      setDisplay('0');
    }
  };

  const handlePercentage = () => {
    const value = parseFloat(display) / 100;
    setDisplay(String(value));
  };

  const handlePlusMinus = () => {
    const value = parseFloat(display) * -1;
    setDisplay(String(value));
  };

  const renderButton = (
    label: string,
    onPress: () => void,
    style?: 'number' | 'operation' | 'function' | 'equals',
    wide?: boolean
  ) => {
    const buttonStyles = [
      styles.button,
      style === 'operation' && styles.operationButton,
      style === 'function' && styles.functionButton,
      style === 'equals' && styles.equalsButton,
      wide && styles.wideButton,
    ];

    const textStyles = [
      styles.buttonText,
      style === 'operation' && styles.operationText,
      style === 'function' && styles.functionText,
      style === 'equals' && styles.equalsText,
    ];

    return (
      <TouchableOpacity
        style={buttonStyles}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <Text style={textStyles}>{label}</Text>
      </TouchableOpacity>
    );
  };

  // Format display for large numbers
  const formatDisplay = (value: string): string => {
    const num = parseFloat(value);
    if (isNaN(num)) return value;
    
    if (value.includes('.') && !value.endsWith('.')) {
      return num.toLocaleString('en-US', { maximumFractionDigits: 10 });
    }
    
    if (Math.abs(num) >= 1e12) {
      return num.toExponential(4);
    }
    
    return value.length > 12 ? num.toExponential(4) : num.toLocaleString('en-US');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.logoContainer}>
            <Ionicons name="calculator" size={24} color="#3B82F6" />
          </View>
          <View>
            <Text style={styles.headerTitle}>क्याल्कुलेटर</Text>
            <Text style={styles.headerSubtitle}>Calculator</Text>
          </View>
        </View>
      </View>

      {/* Display */}
      <View style={styles.displayContainer}>
        {operation && previousValue !== null && (
          <Text style={styles.operationDisplay}>
            {previousValue} {operation}
          </Text>
        )}
        <Text
          style={styles.display}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {formatDisplay(display)}
        </Text>
      </View>

      {/* Buttons */}
      <View style={styles.buttonsContainer}>
        {/* Row 1 */}
        <View style={styles.row}>
          {renderButton('C', handleClear, 'function')}
          {renderButton('±', handlePlusMinus, 'function')}
          {renderButton('%', handlePercentage, 'function')}
          {renderButton('÷', () => handleOperation('÷'), 'operation')}
        </View>

        {/* Row 2 */}
        <View style={styles.row}>
          {renderButton('7', () => handleNumber('7'), 'number')}
          {renderButton('8', () => handleNumber('8'), 'number')}
          {renderButton('9', () => handleNumber('9'), 'number')}
          {renderButton('×', () => handleOperation('×'), 'operation')}
        </View>

        {/* Row 3 */}
        <View style={styles.row}>
          {renderButton('4', () => handleNumber('4'), 'number')}
          {renderButton('5', () => handleNumber('5'), 'number')}
          {renderButton('6', () => handleNumber('6'), 'number')}
          {renderButton('-', () => handleOperation('-'), 'operation')}
        </View>

        {/* Row 4 */}
        <View style={styles.row}>
          {renderButton('1', () => handleNumber('1'), 'number')}
          {renderButton('2', () => handleNumber('2'), 'number')}
          {renderButton('3', () => handleNumber('3'), 'number')}
          {renderButton('+', () => handleOperation('+'), 'operation')}
        </View>

        {/* Row 5 */}
        <View style={styles.row}>
          {renderButton('0', () => handleNumber('0'), 'number', true)}
          {renderButton('.', handleDecimal, 'number')}
          {renderButton('=', handleEquals, 'equals')}
        </View>

        {/* Backspace */}
        <TouchableOpacity style={styles.backspaceButton} onPress={handleBackspace}>
          <Ionicons name="backspace-outline" size={28} color="#9CA3AF" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0F',
  },
  header: {
    backgroundColor: '#1A1A24',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2D2D3D',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#3B82F6' + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  displayContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    paddingHorizontal: 24,
    paddingBottom: 20,
    minHeight: 120,
  },
  operationDisplay: {
    fontSize: 20,
    color: '#6B7280',
    marginBottom: 8,
  },
  display: {
    fontSize: 56,
    fontWeight: '300',
    color: '#FFFFFF',
    textAlign: 'right',
  },
  buttonsContainer: {
    paddingHorizontal: 12,
    paddingBottom: 20,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  button: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#2D2D3D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  wideButton: {
    width: 172,
    borderRadius: 40,
  },
  operationButton: {
    backgroundColor: '#3B82F6',
  },
  functionButton: {
    backgroundColor: '#4B5563',
  },
  equalsButton: {
    backgroundColor: '#10B981',
  },
  buttonText: {
    fontSize: 32,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  operationText: {
    color: '#FFFFFF',
    fontSize: 36,
  },
  functionText: {
    color: '#FFFFFF',
  },
  equalsText: {
    color: '#FFFFFF',
    fontSize: 36,
  },
  backspaceButton: {
    position: 'absolute',
    top: -60,
    right: 24,
    padding: 8,
  },
});
