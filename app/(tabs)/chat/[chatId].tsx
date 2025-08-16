import { router, useLocalSearchParams } from "expo-router";
import { 
  ArrowLeft, 
  Send, 
  Loader2, 
  MoreVertical, 
  Trash2, 
  Download, 
  MessageSquare,
  Wifi,
  WifiOff,
  AlertCircle
} from "lucide-react-native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Share,
  ActionSheetIOS,
  Keyboard,
  LayoutAnimation,
  UIManager,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useChats } from "@/providers/ChatProvider";
import { useTheme } from "@/providers/ThemeProvider";
import { Message } from "@/types/chat";
import { AI_MODELS } from "@/constants/aiModels";
import { getConnectionStatus } from "@/utils/aiService";

export default function ChatScreen() {
  const { chatId } = useLocalSearchParams<{ chatId: string }>();
  const insets = useSafeAreaInsets();
  const { theme, settings, updateSettings } = useTheme();
  const { getChat, sendMessage, exportChat, isOffline } = useChats();
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [typingDots] = useState(new Animated.Value(0));
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const actionMenuAnimation = useRef(new Animated.Value(0)).current;
  const inputRef = useRef<TextInput>(null);
  
  const chat = getChat(chatId);
  const currentModel = AI_MODELS.find(m => m.id === settings.selectedModel);
  const modelName = currentModel?.name || "AI";
  const connectionStatus = currentModel ? getConnectionStatus(currentModel, settings) : 'error';

  useEffect(() => {
    if (!chat) {
      router.back();
    }
  }, [chat]);

  // iOS keyboard handling
  useEffect(() => {
    if (Platform.OS === 'ios') {
      UIManager.setLayoutAnimationEnabledExperimental?.(true);
    }

    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

        setIsKeyboardVisible(true);
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    );

    const keyboardWillHide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

        setIsKeyboardVisible(false);
      }
    );

    return () => {
      keyboardWillShow.remove();
      keyboardWillHide.remove();
    };
  }, []);

  const startTypingAnimation = useCallback(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(typingDots, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(typingDots, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [typingDots]);

  const stopTypingAnimation = useCallback(() => {
    typingDots.stopAnimation();
    typingDots.setValue(0);
  }, [typingDots]);

  useEffect(() => {
    if (isLoading) {
      startTypingAnimation();
    } else {
      stopTypingAnimation();
    }
  }, [isLoading, startTypingAnimation, stopTypingAnimation]);

  const toggleActionMenu = async () => {
    // Haptic feedback for iOS
    if (Platform.OS === 'ios') {
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {
        console.log('Haptics not available');
      }
    }

    const toValue = showActions ? 0 : 1;
    setShowActions(!showActions);
    Animated.spring(actionMenuAnimation, {
      toValue,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    // Haptic feedback for iOS
    if (Platform.OS === 'ios') {
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {
        console.log('Haptics not available');
      }
    }

    const message = input.trim();
    setInput("");
    setIsLoading(true);

    try {
      await sendMessage(chatId, message);
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error("Error sending message:", error);
      if (Platform.OS === 'ios') {
        try {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        } catch {
          console.log('Haptics not available');
        }
      }
      Alert.alert("Error", "Failed to send message. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    Alert.alert(
      "Clear Chat",
      "This will clear all messages in this chat. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: () => sendMessage(chatId, "/clear"),
        },
      ]
    );
  };

  const handleExportChat = async () => {
    try {
      const exportText = exportChat(chatId);
      if (Platform.OS === 'web') {
        navigator.clipboard.writeText(exportText);
        Alert.alert("Success", "Chat copied to clipboard");
      } else {
        await Share.share({
          message: exportText,
          title: `Chat Export - ${chat?.title}`,
        });
      }
    } catch (error) {
      console.error("Error exporting chat:", error);
      Alert.alert("Error", "Failed to export chat");
    }
  };

  const handleModelSelect = async () => {
    // Haptic feedback for iOS
    if (Platform.OS === 'ios') {
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch {
        console.log('Haptics not available');
      }
    }

    if (Platform.OS === 'ios') {
      // Use iOS ActionSheet for native feel
      const options = AI_MODELS.map(model => `${model.name} ${model.free ? '(Free)' : ''}`);
      options.push('Cancel');
      
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex: options.length - 1,
          title: 'Select AI Model',
        },
        (buttonIndex) => {
          if (buttonIndex < AI_MODELS.length) {
            const selectedModel = AI_MODELS[buttonIndex];
            updateSettings({ selectedModel: selectedModel.id });
            sendMessage(chatId, `/model ${selectedModel.id}`);
          }
        }
      );
    } else {
      Alert.alert(
        "Select Model",
        "Choose an AI model:",
        AI_MODELS.map(model => ({
          text: `${model.name} ${model.free ? '(Free)' : ''}`,
          onPress: () => {
            updateSettings({ selectedModel: model.id });
            sendMessage(chatId, `/model ${model.id}`);
          },
        })).concat([{ text: "Cancel", onPress: () => {} }])
      );
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.role === "user";
    const isSystem = item.role === "system";
    
    if (isSystem) {
      return (
        <View 
          style={[
            styles.systemMessage,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            }
          ]}
        >
          <Text style={[styles.systemMessageText, { color: theme.colors.textMuted }]}>
            {item.content}
          </Text>
        </View>
      );
    }
    
    return (
      <View 
        style={[
          styles.messageRow, 
          isUser && styles.messageRowUser,
        ]}
      >
        <View 
          style={[
            styles.messageBubble, 
            {
              backgroundColor: isUser ? theme.colors.userBubble : theme.colors.aiBubble,
              borderColor: isUser ? theme.colors.accent : theme.colors.border,
              shadowColor: isUser ? theme.colors.primary : theme.colors.text,
            }
          ]}
        >
          <Text style={[styles.messageText, { color: isUser ? theme.colors.userText : theme.colors.aiText }]}>
            {item.content}
          </Text>
          <Text style={[styles.messageTime, { color: isUser ? theme.colors.userText + '80' : theme.colors.textMuted }]}>
            {new Date(item.timestamp).toLocaleTimeString([], { 
              hour: "2-digit", 
              minute: "2-digit" 
            })}
          </Text>
        </View>
      </View>
    );
  };

  const renderTypingIndicator = () => {
    if (!isLoading) return null;
    
    return (
      <View style={[styles.typingIndicator, { backgroundColor: theme.colors.surface }]}>
        <View style={[styles.typingBubble, { backgroundColor: theme.colors.aiBubble }]}>
          <View style={styles.typingDots}>
            {[0, 1, 2].map((i) => (
              <Animated.View
                key={i}
                style={[
                  styles.typingDot,
                  {
                    backgroundColor: theme.colors.textMuted,
                    opacity: typingDots.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.3, 1],
                    }),
                    transform: [{
                      scale: typingDots.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.8, 1.2],
                      }),
                    }],
                  },
                ]}
              />
            ))}
          </View>
          <Text style={[styles.typingText, { color: theme.colors.textMuted }]}>
            {modelName} is thinking...
          </Text>
        </View>
      </View>
    );
  };

  const renderActionMenu = () => {
    if (!showActions) return null;
    
    return (
      <Animated.View 
        style={[
          styles.actionMenu,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
            transform: [{
              scale: actionMenuAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [0.8, 1],
              }),
            }],
            opacity: actionMenuAnimation,
          }
        ]}
      >
        <TouchableOpacity style={styles.actionItem} onPress={handleModelSelect}>
          <MessageSquare size={20} color={theme.colors.primary} />
          <Text style={[styles.actionText, { color: theme.colors.text }]}>Change Model</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionItem} onPress={handleClearChat}>
          <Trash2 size={20} color={theme.colors.error} />
          <Text style={[styles.actionText, { color: theme.colors.text }]}>Clear Chat</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionItem} onPress={handleExportChat}>
          <Download size={20} color={theme.colors.success} />
          <Text style={[styles.actionText, { color: theme.colors.text }]}>Export Chat</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  if (!chat) return null;

  const getConnectionIcon = () => {
    if (isOffline) {
      return <WifiOff size={16} color={theme.colors.warning} />;
    }
    switch (connectionStatus) {
      case 'connected':
        return <Wifi size={16} color={theme.colors.success} />;
      case 'no-key':
        return <WifiOff size={16} color={theme.colors.warning} />;
      default:
        return <AlertCircle size={16} color={theme.colors.error} />;
    }
  };

  const getConnectionText = () => {
    if (isOffline) {
      return 'Offline';
    }
    switch (connectionStatus) {
      case 'connected':
        return currentModel?.free ? 'Free Model' : 'Connected';
      case 'no-key':
        return 'No API Key';
      default:
        return 'Error';
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <View style={[styles.header, { backgroundColor: theme.colors.headerBackground, borderBottomColor: theme.colors.border }]}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color={theme.colors.primary} />
          </TouchableOpacity>
          
          <View style={styles.headerTitle}>
            <Text style={[styles.headerText, { color: theme.colors.text }]}>{modelName}</Text>
            <View style={styles.headerStatus}>
              {getConnectionIcon()}
              <Text style={[styles.headerSubtext, { color: theme.colors.textSecondary }]}>
                {isLoading ? "Thinking..." : getConnectionText()}
              </Text>
            </View>
          </View>
          
          <TouchableOpacity 
            style={styles.moreButton} 
            onPress={toggleActionMenu}
          >
            <MoreVertical size={24} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>

        {renderActionMenu()}

        <KeyboardAvoidingView 
          style={styles.chatContainer}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
        >
          <FlatList
            ref={flatListRef}
            data={chat.messages}
            keyExtractor={(item) => item.id}
            renderItem={renderMessage}
            contentContainerStyle={[
              styles.messagesList,
              { paddingBottom: isKeyboardVisible ? 10 : 20 }
            ]}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            showsVerticalScrollIndicator={false}
            removeClippedSubviews={true}
            initialNumToRender={10}
            maxToRenderPerBatch={5}
            windowSize={10}
            getItemLayout={(data, index) => ({
              length: 80, // Approximate message height
              offset: 80 * index,
              index,
            })}
            ListEmptyComponent={
              <View style={styles.emptyChat}>
                <MessageSquare size={48} color={theme.colors.textMuted} />
                <Text style={[styles.emptyChatText, { color: theme.colors.textMuted }]}>
                  Start a conversation with {modelName}
                </Text>
                <Text style={[styles.emptyChatSubtext, { color: theme.colors.textMuted }]}>
                  Try: &quot;Hello&quot; or use /clear, /model commands
                </Text>
              </View>
            }
          />

          {renderTypingIndicator()}

          <View style={[styles.inputContainer, { 
            paddingBottom: Platform.OS === 'ios' ? (isKeyboardVisible ? 10 : insets.bottom || 20) : 20,
            backgroundColor: theme.colors.surface,
            borderTopColor: theme.colors.border,
          }]}>
            <TextInput
              ref={inputRef}
              style={[styles.input, { 
                backgroundColor: theme.colors.inputBackground,
                color: theme.colors.text,
                borderColor: theme.colors.border,
                maxHeight: Platform.OS === 'ios' ? 120 : 100,
              }]}
              value={input}
              onChangeText={setInput}
              placeholder="Type a message or /command..."
              placeholderTextColor={theme.colors.textMuted}
              multiline
              maxLength={2000}
              onSubmitEditing={Platform.OS === 'ios' ? undefined : handleSend}
              returnKeyType={Platform.OS === 'ios' ? 'default' : 'send'}
              blurOnSubmit={false}
              editable={!isLoading}
              textAlignVertical="top"
              scrollEnabled={true}
            />
            <TouchableOpacity 
              style={[
                styles.sendButton, 
                { backgroundColor: (!input.trim() || isLoading) ? theme.colors.textMuted : theme.colors.primary },
              ]}
              onPress={handleSend}
              disabled={!input.trim() || isLoading}
            >
              {isLoading ? (
                <Loader2 size={20} color={theme.colors.text} />
              ) : (
                <Send size={20} color={theme.colors.text} />
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  headerTitle: {
    flex: 1,
  },
  headerText: {
    fontSize: 17,
    fontWeight: "600" as const,
  },
  headerStatus: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  headerSubtext: {
    fontSize: 13,
    marginLeft: 4,
  },
  moreButton: {
    padding: 4,
  },
  actionMenu: {
    position: "absolute",
    top: 80,
    right: 16,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 8,
    zIndex: 1000,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  actionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  actionText: {
    marginLeft: 12,
    fontSize: 16,
  },
  chatContainer: {
    flex: 1,
  },
  messagesList: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  messageRow: {
    marginVertical: 4,
    flexDirection: "row",
    justifyContent: "flex-start",
  },
  messageRowUser: {
    justifyContent: "flex-end",
  },
  messageBubble: {
    maxWidth: "75%",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 18,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  systemMessage: {
    alignSelf: "center",
    marginVertical: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  systemMessageText: {
    fontSize: 14,
    textAlign: "center",
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  messageTime: {
    fontSize: 11,
    marginTop: 4,
  },
  emptyChat: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 100,
  },
  emptyChatText: {
    fontSize: 18,
    fontWeight: "600" as const,
    marginTop: 16,
    textAlign: "center",
  },
  emptyChatSubtext: {
    fontSize: 14,
    marginTop: 8,
    textAlign: "center",
  },
  typingIndicator: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  typingBubble: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 18,
    maxWidth: "75%",
  },
  typingDots: {
    flexDirection: "row",
    marginRight: 8,
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginHorizontal: 1,
  },
  typingText: {
    fontSize: 14,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  input: {
    flex: 1,
    minHeight: 40,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 8,
    fontSize: 16,
    borderWidth: 1,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 2,
  },
});