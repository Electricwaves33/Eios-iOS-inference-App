import * as Linking from "expo-linking";
import { ChevronRight, Zap, Bot, Link2, Trash2 } from "lucide-react-native";
import React, { useState } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
  ActionSheetIOS,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useChats } from "@/providers/ChatProvider";
import { useTheme } from "@/providers/ThemeProvider";
import { AI_MODELS } from "@/constants/aiModels";
import { THEMES } from "@/constants/themes";

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { theme, settings, updateSettings, setTheme } = useTheme();
  const { clearAllChats } = useChats();
  const [streamingEnabled, setStreamingEnabled] = useState(settings.streamingEnabled);

  const handleClearChats = async () => {
    // Haptic feedback for iOS
    if (Platform.OS === 'ios') {
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch (error) {
        console.log('Haptics not available');
      }
    }

    const confirmClear = () => {
      clearAllChats();
      Alert.alert("Success", "All chats have been cleared");
    };

    if (Platform.OS === "web") {
      if (window.confirm("Clear all chat history? This cannot be undone.")) {
        confirmClear();
      }
    } else if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Clear All Chats', 'Cancel'],
          destructiveButtonIndex: 0,
          cancelButtonIndex: 1,
          title: 'This will delete all your chat history. This action cannot be undone.',
        },
        (buttonIndex) => {
          if (buttonIndex === 0) {
            confirmClear();
          }
        }
      );
    } else {
      Alert.alert(
        "Clear All Chats",
        "This will delete all your chat history. This action cannot be undone.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Clear All", style: "destructive", onPress: confirmClear },
        ]
      );
    }
  };

  const handleShortcutsInfo = async () => {
    // Haptic feedback for iOS
    if (Platform.OS === 'ios') {
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (error) {
        console.log('Haptics not available');
      }
    }

    const url = Linking.createURL("chat/new");
    Alert.alert(
      "Shortcuts Integration",
      `You can create shortcuts to:\n\n• Open the app: aichat://\n• Start new chat: ${url}\n\nAdd these URLs to the Shortcuts app to quickly access AI Chat.`,
      [{ text: "OK" }]
    );
  };

  const handleModelSelect = async () => {
    // Haptic feedback for iOS
    if (Platform.OS === 'ios') {
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (error) {
        console.log('Haptics not available');
      }
    }

    if (Platform.OS === 'ios') {
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
          }
        }
      );
    }
  };

  const handleThemeSelect = async () => {
    // Haptic feedback for iOS
    if (Platform.OS === 'ios') {
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (error) {
        console.log('Haptics not available');
      }
    }

    if (Platform.OS === 'ios') {
      const themeNames = Object.keys(THEMES);
      const options = themeNames.map(key => THEMES[key].name);
      options.push('Cancel');
      
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex: options.length - 1,
          title: 'Select Theme',
        },
        (buttonIndex) => {
          if (buttonIndex < themeNames.length) {
            const selectedThemeKey = themeNames[buttonIndex];
            setTheme(selectedThemeKey);
          }
        }
      );
    }
  };

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: theme.colors.textMuted }]}>AI Model</Text>
        <TouchableOpacity
          style={[styles.option, { borderTopColor: theme.colors.border }]}
          onPress={handleModelSelect}
        >
          <View style={styles.optionLeft}>
            <Bot size={20} color={theme.colors.primary} />
            <View style={styles.optionText}>
              <Text style={[styles.optionTitle, { color: theme.colors.text }]}>Current Model</Text>
              <Text style={[styles.optionSubtitle, { color: theme.colors.textSecondary }]}>
                {AI_MODELS.find(m => m.id === settings.selectedModel)?.name || 'Unknown'}
              </Text>
            </View>
          </View>
          <ChevronRight size={20} color={theme.colors.textMuted} />
        </TouchableOpacity>
      </View>

      <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: theme.colors.textMuted }]}>Appearance</Text>
        <TouchableOpacity
          style={[styles.option, { borderTopColor: theme.colors.border }]}
          onPress={handleThemeSelect}
        >
          <View style={styles.optionLeft}>
            <View style={[styles.themePreview, { backgroundColor: theme.colors.primary }]} />
            <View style={styles.optionText}>
              <Text style={[styles.optionTitle, { color: theme.colors.text }]}>Theme</Text>
              <Text style={[styles.optionSubtitle, { color: theme.colors.textSecondary }]}>
                {theme.name}
              </Text>
            </View>
          </View>
          <ChevronRight size={20} color={theme.colors.textMuted} />
        </TouchableOpacity>
      </View>

      <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: theme.colors.textMuted }]}>Features</Text>
        <View style={[styles.option, { borderTopColor: theme.colors.border }]}>
          <View style={styles.optionLeft}>
            <Zap size={20} color={theme.colors.primary} />
            <View style={styles.optionText}>
              <Text style={[styles.optionTitle, { color: theme.colors.text }]}>Response Streaming</Text>
              <Text style={[styles.optionSubtitle, { color: theme.colors.textSecondary }]}>Show responses as they generate</Text>
            </View>
          </View>
          <Switch
            value={streamingEnabled}
            onValueChange={(value) => {
              setStreamingEnabled(value);
              updateSettings({ streamingEnabled: value });
            }}
            trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
            thumbColor={Platform.OS === 'ios' ? undefined : theme.colors.surface}
          />
        </View>
      </View>

      <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: theme.colors.textMuted }]}>Shortcuts</Text>
        <TouchableOpacity style={[styles.option, { borderTopColor: theme.colors.border }]} onPress={handleShortcutsInfo}>
          <View style={styles.optionLeft}>
            <Link2 size={20} color={theme.colors.primary} />
            <View style={styles.optionText}>
              <Text style={[styles.optionTitle, { color: theme.colors.text }]}>Apple Shortcuts</Text>
              <Text style={[styles.optionSubtitle, { color: theme.colors.textSecondary }]}>Set up quick actions</Text>
            </View>
          </View>
          <ChevronRight size={20} color={theme.colors.textMuted} />
        </TouchableOpacity>
      </View>

      <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: theme.colors.textMuted }]}>Data</Text>
        <TouchableOpacity style={[styles.option, { borderTopColor: theme.colors.border }]} onPress={handleClearChats}>
          <View style={styles.optionLeft}>
            <Trash2 size={20} color={theme.colors.error} />
            <View style={styles.optionText}>
              <Text style={[styles.optionTitle, { color: theme.colors.error }]}>
                Clear All Chats
              </Text>
              <Text style={[styles.optionSubtitle, { color: theme.colors.textSecondary }]}>Delete all chat history</Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: theme.colors.textMuted }]}>AI Chat v1.0.0</Text>
        <Text style={[styles.footerSubtext, { color: theme.colors.textMuted }]}>
          Powered by advanced language models
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  themePreview: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 12,
  },
  section: {
    marginTop: 20,
    borderRadius: 12,
    marginHorizontal: 16,
    overflow: "hidden",
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600" as const,
    textTransform: "uppercase" as const,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    letterSpacing: 0.5,
  },
  option: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  optionLeft: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    flex: 1,
  },
  optionText: {
    marginLeft: 12,
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    marginBottom: 2,
  },
  optionSubtitle: {
    fontSize: 13,
  },

  footer: {
    alignItems: "center" as const,
    marginTop: 40,
    marginBottom: 20,
  },
  footerText: {
    fontSize: 14,
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: 12,
  },
});