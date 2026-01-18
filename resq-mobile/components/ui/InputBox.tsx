import { useState } from 'react';
import { View, Text, TextInput, TextInputProps, TouchableOpacity, StyleSheet } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

interface InputBoxProps extends TextInputProps {
  label?: string;
  value?: string;
  error?: string;
  icon?: keyof typeof FontAwesome.glyphMap;
}

const InputBox: React.FC<InputBoxProps> = ({
  label,
  icon,
  error,
  editable = true,
  secureTextEntry,
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPasswordField = secureTextEntry !== undefined;

  return (
    <View style={styles.wrapper}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.container, error ? styles.containerError : null]}>
        {icon && (
          <View style={styles.iconContainer}>
            <FontAwesome name={icon} size={20} color="#6B7280" />
          </View>
        )}

        <TextInput
          {...props}
          secureTextEntry={isPasswordField ? !showPassword : false}
          style={styles.input}
          placeholderTextColor="#9CA3AF"
          editable={editable}
        />

        {isPasswordField && (
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={styles.eyeIcon}
            disabled={!editable}>
            <FontAwesome name={showPassword ? 'eye' : 'eye-slash'} size={20} color="#6B7280" />
          </TouchableOpacity>
        )}
      </View>

      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#374151',
    fontFamily: 'Inter',
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 52,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  containerError: {
    borderColor: '#EF4444',
    borderWidth: 1,
  },
  iconContainer: {
    width: 24,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    fontFamily: 'Inter',
    padding: 0,
    margin: 0,
  },
  eyeIcon: {
    marginLeft: 12,
    padding: 4,
  },
  errorText: {
    fontSize: 12,
    marginTop: 6,
    color: '#EF4444',
    fontFamily: 'Inter',
  },
});

export default InputBox;
