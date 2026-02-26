import { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { RefreshCw, Copy, Check } from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import { useColor } from '@/hooks/useColor';

export function GeneratorScreen() {
  const [length, setLength] = useState(16);
  const [includeUppercase, setIncludeUppercase] = useState(true);
  const [includeLowercase, setIncludeLowercase] = useState(true);
  const [includeNumbers, setIncludeNumbers] = useState(true);
  const [includeSymbols, setIncludeSymbols] = useState(true);
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [copied, setCopied] = useState(false);

  // Color system
  const backgroundColor = useColor('background');
  const cardColor = useColor('card');
  const textColor = useColor('text');
  const borderColor = useColor('border');
  const primaryColor = useColor('primary');
  const mutedTextColor = `${textColor}60`;

  const generatePassword = () => {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';

    let chars = '';
    if (includeUppercase) chars += uppercase;
    if (includeLowercase) chars += lowercase;
    if (includeNumbers) chars += numbers;
    if (includeSymbols) chars += symbols;

    if (chars === '') {
      setGeneratedPassword('');
      Alert.alert('错误', '请至少选择一种字符类型');
      return;
    }

    let password = '';
    for (let i = 0; i < length; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setGeneratedPassword(password);
    setCopied(false);
  };

  const copyToClipboard = async () => {
    if (generatedPassword) {
      try {
        await Clipboard.setStringAsync(generatedPassword);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        Alert.alert('错误', '复制失败');
      }
    }
  };

  const OptionToggle = ({
    label,
    value,
    onToggle,
  }: {
    label: string;
    value: boolean;
    onToggle: () => void;
  }) => (
    <TouchableOpacity onPress={onToggle} style={styles.optionRow}>
      <View style={[styles.checkbox, value && styles.checkboxChecked]}>
        {value && <Text style={styles.checkmark}>✓</Text>}
      </View>
      <Text style={styles.optionLabel}>{label}</Text>
    </TouchableOpacity>
  );

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: backgroundColor,
    },
    header: {
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: borderColor,
    },
    title: {
      fontSize: 24,
      fontWeight: '700',
      color: textColor,
    },
    content: {
      flex: 1,
      padding: 20,
    },
    passwordDisplay: {
      backgroundColor: cardColor,
      borderRadius: 12,
      padding: 16,
      marginBottom: 24,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderWidth: 1,
      borderColor: borderColor,
    },
    passwordText: {
      flex: 1,
      fontSize: 16,
      fontFamily: 'monospace',
      color: textColor,
      marginRight: 12,
      fontWeight: '500',
    },
    copyButton: {
      backgroundColor: primaryColor,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
      gap: 6,
    },
    copyButtonDisabled: {
      backgroundColor: mutedTextColor,
    },
    copyButtonText: {
      color: '#ffffff',
      fontSize: 14,
      fontWeight: '500',
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      marginBottom: 16,
      color: textColor,
    },
    slider: {
      width: '100%',
      height: 40,
    },
    thumb: {
      width: 20,
      height: 20,
      backgroundColor: primaryColor,
    },
    lengthControl: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 16,
      marginVertical: 12,
    },
    lengthButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: primaryColor,
      justifyContent: 'center',
      alignItems: 'center',
    },
    lengthButtonText: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#ffffff',
    },
    lengthValue: {
      fontSize: 16,
      fontWeight: '600',
      color: textColor,
      minWidth: 40,
      textAlign: 'center',
    },
    lengthLabels: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: -8,
    },
    lengthLabel: {
      fontSize: 12,
      color: mutedTextColor,
    },
    optionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      backgroundColor: cardColor,
      borderRadius: 12,
      paddingHorizontal: 16,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: borderColor,
    },
    checkbox: {
      width: 20,
      height: 20,
      borderWidth: 2,
      borderColor: borderColor,
      borderRadius: 4,
      marginRight: 12,
      justifyContent: 'center',
      alignItems: 'center',
    },
    checkboxChecked: {
      backgroundColor: primaryColor,
      borderColor: primaryColor,
    },
    checkmark: {
      color: '#ffffff',
      fontSize: 12,
      fontWeight: 'bold',
    },
    optionLabel: {
      fontSize: 16,
      color: textColor,
      fontWeight: '500',
    },
    generateButton: {
      backgroundColor: primaryColor,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 16,
      borderRadius: 12,
      gap: 8,
      marginTop: 'auto',
    },
    generateButtonText: {
      color: '#ffffff',
      fontSize: 16,
      fontWeight: '600',
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>密码生成器</Text>
      </View>

      <View style={styles.content}>
        {/* Generated Password Display */}
        <View style={styles.passwordDisplay}>
          <Text style={styles.passwordText}>
            {generatedPassword || '点击生成按钮创建密码'}
          </Text>
          <TouchableOpacity
            onPress={copyToClipboard}
            style={[
              styles.copyButton,
              !generatedPassword && styles.copyButtonDisabled,
            ]}
            disabled={!generatedPassword}
          >
            {copied ? (
              <Check size={20} color="#ffffff" />
            ) : (
              <Copy size={20} color="#ffffff" />
            )}
            <Text style={styles.copyButtonText}>
              {copied ? '已复制' : '复制'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Length Slider */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>密码长度: {length}</Text>
          <View style={styles.lengthControl}>
            <TouchableOpacity
              onPress={() => setLength(Math.max(4, length - 1))}
              style={styles.lengthButton}
            >
              <Text style={styles.lengthButtonText}>-</Text>
            </TouchableOpacity>
            <Text style={styles.lengthValue}>{length}</Text>
            <TouchableOpacity
              onPress={() => setLength(Math.min(64, length + 1))}
              style={styles.lengthButton}
            >
              <Text style={styles.lengthButtonText}>+</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.lengthLabels}>
            <Text style={styles.lengthLabel}>最小: 4</Text>
            <Text style={styles.lengthLabel}>最大: 64</Text>
          </View>
        </View>

        {/* Character Options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>字符类型</Text>
          <OptionToggle
            label="大写字母 (A-Z)"
            value={includeUppercase}
            onToggle={() => setIncludeUppercase(!includeUppercase)}
          />
          <OptionToggle
            label="小写字母 (a-z)"
            value={includeLowercase}
            onToggle={() => setIncludeLowercase(!includeLowercase)}
          />
          <OptionToggle
            label="数字 (0-9)"
            value={includeNumbers}
            onToggle={() => setIncludeNumbers(!includeNumbers)}
          />
          <OptionToggle
            label="特殊符号 (!@#$...)"
            value={includeSymbols}
            onToggle={() => setIncludeSymbols(!includeSymbols)}
          />
        </View>

        {/* Generate Button */}
        <TouchableOpacity
          onPress={generatePassword}
          style={styles.generateButton}
        >
          <RefreshCw size={20} color="#ffffff" />
          <Text style={styles.generateButtonText}>生成密码</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

