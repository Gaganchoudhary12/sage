import React, {useEffect, useState} from 'react';
import {View, FlatList, ActivityIndicator, StyleSheet, Text, TouchableOpacity, Alert} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ChatBubble from '../components/ChatBubble';
import InputBox from '../components/InputBox';
import TypingIndicator from '../components/TypingIndicator';
import SplashScreen from './SplashScreen';
import {generateResponse} from '../llm';
import {loadLLM} from '../llm/loadModel';

interface Message {
  text: string;
  isUser: boolean;
}

export default function ChatScreen() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [showSplash, setShowSplash] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState('Initializing...');
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const flatListRef = React.useRef<any>(null);

  // Auto-scroll to bottom when messages change or typing starts
  useEffect(() => {
    if (messages.length > 0 || isTyping) {
      // Small delay to ensure content is rendered
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({animated: true});
      }, 100);
    }
  }, [messages, isTyping]);

  // Calculate estimated time remaining
  const getEstimatedTime = (progress: number) => {
    if (progress < 5) return 'Calculating...';
    if (progress < 25) return '~5 minutes';
    if (progress < 50) return '~3 minutes';
    if (progress < 75) return '~2 minutes';
    if (progress < 95) return '~1 minute';
    return 'Almost done...';
  };

  useEffect(() => {
    async function initApp() {
      try {
        // Show splash for minimum 2 seconds
        const splashTimer = setTimeout(() => {
          setShowSplash(false);
        }, 2000);

        // Load saved conversation history
        const savedMessages = await AsyncStorage.getItem('chatHistory');
        if (savedMessages) {
          setMessages(JSON.parse(savedMessages));
        }

        // Step 1: Initialize LLM (download if needed)
        setLoadingMessage('Preparing Sage...');
        
        // This will download the model if it doesn't exist
        await loadLLM((progress) => {
          setIsDownloading(true);
          setDownloadProgress(progress);
          setLoadingMessage('Downloading Sage for you...');
        });
        
        setIsDownloading(false);
        setLoadingMessage('Waking up Sage...');
        
        // Wait for splash timer before showing main screen
        await new Promise(resolve => setTimeout(resolve, 2000));
        clearTimeout(splashTimer);
        
        setLoading(false);
        // setShowSplash(false);

        // Show welcome message if no saved messages
        if (!savedMessages || JSON.parse(savedMessages).length === 0) {
          setMessages([
            {
              text: "Hi! I'm Sage, your personal AI assistant. I'm here to help you with anything you need - writing, planning, answering questions, or just chatting. What can I do for you today?",
              isUser: false,
            },
          ]);
        }
      } catch (e) {
        console.error('Initialization error:', e);
        setError(`Failed to initialize: ${e}`);
        setLoading(false);
      }
    }

    initApp();
  }, []);

  async function handleSend() {
    if (!input.trim()) {
      return;
    }

    const userMessage: Message = {text: input, isUser: true};
    setMessages(prev => [...prev, userMessage]);
    const userQuery = input;
    setInput('');

    try {
      // Show typing indicator
      setIsTyping(true);

      let streamed = '';
      const botMessage: Message = {text: '', isUser: false};

      // Build conversation history (last 6 messages only)
      const recentMessages = messages.slice(-6);
      const conversationHistory = recentMessages.map(msg => ({
        role: msg.isUser ? 'user' as const : 'assistant' as const,
        content: msg.text,
      }));

      await generateResponse(userQuery, chunk => {
        // Hide typing indicator on first token
        if (streamed === '') {
          setIsTyping(false);
          setMessages(prev => [...prev, botMessage]);
        }
        
        streamed += chunk;
        setMessages(prev => {
          const copy = [...prev];
          copy[copy.length - 1] = {text: streamed, isUser: false};
          return copy;
        });
      }, conversationHistory);

      // Ensure typing indicator is hidden
      setIsTyping(false);

      // Save conversation history after response
      const updatedMessages = [...messages, userMessage, {text: streamed, isUser: false}];
      await AsyncStorage.setItem('chatHistory', JSON.stringify(updatedMessages));
    } catch (e) {
      console.error('Error generating response:', e);
      setIsTyping(false); // Hide typing indicator on error
      const errorMessage = e instanceof Error ? e.message : 'Unknown error occurred';
      
      // Check if it's a context full error
      if (errorMessage.includes('Context is full') || errorMessage.includes('IllegalStateException')) {
        setMessages(prev => [
          ...prev,
          {
            text: `The conversation is too long. Please use the "Clear" button to start fresh, or ask shorter questions.`,
            isUser: false,
          },
        ]);
      } else {
        setMessages(prev => [
          ...prev,
          {
            text: `Error: ${errorMessage}\n\nTip: Try clearing the chat or restarting the app if this persists.`,
            isUser: false,
          },
        ]);
      }
    }
  }

  const handleClearChat = () => {
    Alert.alert(
      'Clear Chat History',
      'Are you sure you want to clear all messages? This cannot be undone.',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            setMessages([]);
            await AsyncStorage.removeItem('chatHistory');
          },
        },
      ],
    );
  };

  // Show splash screen first
  if (showSplash) {
    return <SplashScreen />;
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        {/* App Icon/Logo Area */}
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoText}>S</Text>
          </View>
          <Text style={styles.appName}>Sage</Text>
          <Text style={styles.appTagline}>Your Personal AI Assistant</Text>
        </View>

        {/* Loading Message */}
        <Text style={styles.loadingTitle}>{loadingMessage}</Text>

        {/* Progress Bar (only show when downloading) */}
        {isDownloading && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBarBackground}>
              <View 
                style={[
                  styles.progressBarFill, 
                  {width: `${downloadProgress}%`}
                ]} 
              />
            </View>
            <Text style={styles.progressText}>
              {downloadProgress.toFixed(1)}% • {getEstimatedTime(downloadProgress)}
            </Text>
            <Text style={styles.progressSubtext}>
              Setting up your private AI • First-time only
            </Text>
          </View>
        )}

        {/* Spinner */}
        <ActivityIndicator 
          size="large" 
          color="#2563eb" 
          style={styles.spinner}
        />

        {/* Info Text */}
        {isDownloading && (
          <Text style={styles.infoText}>
            Setting up Sage for the first time...{'\n'}
            Your conversations are private and stay on your device
          </Text>
        )}
        
        {!isDownloading && loading && (
          <Text style={styles.infoText}>
            Waking up Sage...
          </Text>
        )}
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorTitle}>Initialization Failed</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <Text style={styles.errorHint}>
            Try restarting the app or check your internet connection
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header with Clear Chat button */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.sageIcon}>
            <Text style={styles.sageIconText}>S</Text>
          </View>
          <Text style={styles.headerTitle}>Sage</Text>
        </View>
        {messages.length > 0 && (
          <TouchableOpacity onPress={handleClearChat} style={styles.clearButton}>
            <Text style={styles.clearButtonText}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={({item}) => (
          <ChatBubble text={item.text} isUser={item.isUser} />
        )}
        keyExtractor={(_, index) => String(index)}
        contentContainerStyle={{padding: 10, paddingBottom: 20}}
        maintainVisibleContentPosition={{
          minIndexForVisible: 0,
        }}
        ListFooterComponent={isTyping ? <TypingIndicator /> : null}
      />
      <InputBox value={input} setValue={setInput} onSend={handleSend} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    padding: 20,
  },
  logoContainer: {
    marginBottom: 40,
    alignItems: 'center',
  },
  logoCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6366f1',
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 10,
    marginBottom: 20,
    borderWidth: 3,
    borderColor: '#818cf8',
  },
  logoText: {
    fontSize: 52,
    fontWeight: 'bold',
    color: '#fff',
  },
  appName: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#f1f5f9',
    marginBottom: 8,
    letterSpacing: 1,
  },
  appTagline: {
    fontSize: 16,
    color: '#94a3b8',
    letterSpacing: 0.5,
  },
  loadingTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#f9fafb',
    marginBottom: 30,
  },
  progressContainer: {
    width: '100%',
    maxWidth: 400,
    marginBottom: 30,
  },
  progressBarBackground: {
    width: '100%',
    height: 8,
    backgroundColor: '#1e293b',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#6366f1',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#e2e8f0',
    textAlign: 'center',
    marginTop: 12,
  },
  progressSubtext: {
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 6,
  },
  spinner: {
    marginVertical: 24,
  },
  infoText: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 20,
  },
  errorContainer: {
    padding: 30,
    alignItems: 'center',
  },
  errorIcon: {
    fontSize: 60,
    marginBottom: 20,
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#ef4444',
    marginBottom: 12,
  },
  errorMessage: {
    fontSize: 15,
    color: '#e2e8f0',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 22,
  },
  errorHint: {
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#0f172a',
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sageIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6366f1',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 3,
  },
  sageIconText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#f1f5f9',
    letterSpacing: 0.5,
  },
  clearButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#ef4444',
    borderRadius: 8,
    shadowColor: '#ef4444',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 2,
  },
  clearButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
