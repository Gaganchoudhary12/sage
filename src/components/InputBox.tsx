import React from 'react';
import {View, TextInput, TouchableOpacity, StyleSheet, Text} from 'react-native';

interface Props {
  value: string;
  setValue: (v: string) => void;
  onSend: () => void;
}

export default function InputBox({value, setValue, onSend}: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.inputWrapper}>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={setValue}
          placeholder="Message Sage..."
          placeholderTextColor="#64748b"
          multiline
          maxLength={500}
        />
      </View>
      
      <TouchableOpacity
        style={[styles.sendButton, !value.trim() && styles.sendButtonDisabled]}
        onPress={onSend}
        disabled={!value.trim()}>
        <Text style={styles.sendIcon}>➤</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 12,
    paddingBottom: 16,
    backgroundColor: '#0f172a',
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    alignItems: 'center',
  },
  inputWrapper: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 8,
    minHeight: 44,
    maxHeight: 120,
  },
  input: {
    color: '#f1f5f9',
    fontSize: 16,
    lineHeight: 22,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6366f1',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
  },
  sendButtonDisabled: {
    backgroundColor: '#334155',
    shadowOpacity: 0,
  },
  sendIcon: {
    fontSize: 20,
    color: '#ffffff',
    fontWeight: 'bold',
    top:-1
  },
});
