import { router } from "expo-router";
import { Plus, Trash2, MessageSquare } from "lucide-react-native";
import React, { useState } from "react";
import {
  Alert,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActionSheetIOS,
  LayoutAnimation,
  UIManager,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useChats } from "@/providers/ChatProvider";
import { useTheme } from "@/providers/ThemeProvider";
import { formatRelativeTime } from "@/utils/dateUtils";

export default function ChatsScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { chats, deleteChat, createChat } = useChats();
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  // Enable layout animations for iOS
  React.useEffect(() => {
    if (Platform.OS === 'ios') {
      UIManager.setLayoutAnimationEnabledExperimental?.(true);
    }
  }, []);

  const handleNewChat = async () => {
    // Haptic feedback for iOS
    if (Platform.OS === 'ios') {
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch (error) {
        console.log('Haptics not available');
      }
    }
    
    const newChatId = await createChat();
    router.push(`/chat/${newChatId}`);
  };

  const handleDeleteChat = async (chatId: string) => {
    // Haptic feedback for iOS
    if (Platform.OS === 'ios') {
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (error) {
        console.log('Haptics not available');
      }
    }

    const performDelete = () => {
      if (Platform.OS === 'ios') {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      }
      setIsDeleting(chatId);
      deleteChat(chatId);
      setTimeout(() => setIsDeleting(null), 300);
    };

    if (Platform.OS === "web") {
      if (window.confirm("Delete this chat?")) {
        performDelete();
      }
    } else if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Delete Chat', 'Cancel'],
          destructiveButtonIndex: 0,
          cancelButtonIndex: 1,
          title: 'Are you sure you want to delete this chat?',
        },
        (buttonIndex) => {
          if (buttonIndex === 0) {
            performDelete();
          }
        }
      );
    } else {
      Alert.alert(
        "Delete Chat",
        "Are you sure you want to delete this chat?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: performDelete,
          },
        ]
      );
    }
  };

  const renderChat = ({ item }: { item: any }) => {
    const lastMessage = item.messages[item.messages.length - 1];
    const isBeingDeleted = isDeleting === item.id;

    return (
      <Pressable
        style={[
          styles.chatItem, 
          { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
          isBeingDeleted && styles.chatItemDeleting
        ]}
        onPress={() => router.push(`/chat/${item.id}`)}
      >
        <View style={styles.chatContent}>
          <Text style={[styles.chatTitle, { color: theme.colors.text }]} numberOfLines={1}>
            {item.title || "New Chat"}
          </Text>
          <Text style={[styles.chatPreview, { color: theme.colors.textSecondary }]} numberOfLines={2}>
            {lastMessage?.content || "Start a conversation..."}
          </Text>
          <Text style={[styles.chatTime, { color: theme.colors.textMuted }]}>
            {formatRelativeTime(item.updatedAt)}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteChat(item.id)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Trash2 size={18} color={theme.colors.error} />
        </TouchableOpacity>
      </Pressable>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <FlatList
        data={chats}
        keyExtractor={(item) => item.id}
        renderItem={renderChat}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + 80 },
        ]}
        removeClippedSubviews={true}
        initialNumToRender={8}
        maxToRenderPerBatch={5}
        windowSize={10}
        getItemLayout={(data, index) => ({
          length: 88, // Approximate item height
          offset: 88 * index,
          index,
        })}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <MessageSquare size={48} color={theme.colors.textMuted} />
            <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>No Chats Yet</Text>
            <Text style={[styles.emptyText, { color: theme.colors.textMuted }]}>
              Start a new conversation with AI
            </Text>
          </View>
        }
      />

      <TouchableOpacity
        style={[styles.fab, { 
          bottom: insets.bottom + 90,
          backgroundColor: theme.colors.primary,
        }]}
        onPress={handleNewChat}
        activeOpacity={0.8}
      >
        <Plus size={24} color={theme.colors.text} />
      </TouchableOpacity>
    </View>
  );
}



const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingTop: 8,
  },
  chatItem: {
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chatItemDeleting: {
    opacity: 0.5,
    transform: [{ scale: 0.95 }],
  },
  chatContent: {
    flex: 1,
    marginRight: 12,
  },
  chatTitle: {
    fontSize: 16,
    fontWeight: "600" as const,
    marginBottom: 4,
  },
  chatPreview: {
    fontSize: 14,
    marginBottom: 4,
    lineHeight: 18,
  },
  chatTime: {
    fontSize: 12,
  },
  deleteButton: {
    padding: 8,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 100,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600" as const,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
  },
  fab: {
    position: "absolute",
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});