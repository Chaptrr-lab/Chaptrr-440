import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useTheme } from '@/theme/ThemeProvider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Slider from '@react-native-community/slider';
import AsyncStorage from '@/lib/async-storage';

const FONTS = [
  { key: 'DM Sans', label: 'DM Sans' },
  { key: 'Lora', label: 'Lora' },
  { key: 'Merriweather', label: 'Merriweather' },
  { key: 'Source Serif', label: 'Source Serif' },
  { key: 'Literata', label: 'Literata' },
  { key: 'Atkinson Hyperlegible', label: 'Atkinson' },
];

const THEMES = ['Light', 'Dark', 'System'] as const;
type ThemeMode = typeof THEMES[number];

const STORAGE_KEY = 'chaptrr_reader_settings';

interface ReaderPrefs {
  fontOverride: boolean;
  fontFamily: string;
  textScale: number;
  theme: ThemeMode;
  autoAdvance: boolean;
  keepAwake: boolean;
}

const DEFAULT_PREFS: ReaderPrefs = {
  fontOverride: false,
  fontFamily: 'DM Sans',
  textScale: 1.0,
  theme: 'System',
  autoAdvance: false,
  keepAwake: false,
};

export default function ReaderSettingsScreen() {
  const { activeTheme, mode } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [prefs, setPrefs] = useState<ReaderPrefs>(DEFAULT_PREFS);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) {
        try {
          setPrefs({ ...DEFAULT_PREFS, ...JSON.parse(raw) });
        } catch {}
      }
    });
  }, []);

  const update = <K extends keyof ReaderPrefs>(key: K, value: ReaderPrefs[K]) => {
    setPrefs((prev) => {
      const next = { ...prev, [key]: value };
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  };

  const c = activeTheme.colors;

  const previewText = 'The rain fell softly, tracing silver lines on the glass.';
  const previewFontFamily = prefs.fontOverride ? prefs.fontFamily : undefined;
  const previewFontSize = Math.round(16 * prefs.textScale);

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <Stack.Screen
        options={{
          title: 'Reading Preferences',
          headerStyle: { backgroundColor: c.background },
          headerTintColor: c.text.primary,
          headerTitleStyle: { color: c.text.primary },
        }}
      />

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: insets.bottom + 32 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Live preview */}
        <View style={[styles.previewCard, { backgroundColor: c.surface, borderColor: c.border }]}>
          <Text style={[styles.previewLabel, { color: c.text.muted }]}>Preview</Text>
          <Text
            style={{
              fontFamily: previewFontFamily,
              fontSize: previewFontSize,
              color: c.text.primary,
              lineHeight: previewFontSize * 1.6,
            }}
          >
            {previewText}
          </Text>
        </View>

        {/* Font override toggle */}
        <SectionHeader label="Font" c={c} />
        <Row c={c}>
          <Text style={[styles.rowLabel, { color: c.text.primary }]}>Override Story Font</Text>
          <Switch
            value={prefs.fontOverride}
            onValueChange={(v) => update('fontOverride', v)}
            trackColor={{ false: c.border, true: c.accent }}
            thumbColor={Platform.OS === 'android' ? c.accent : undefined}
          />
        </Row>

        {prefs.fontOverride && (
          <View style={styles.fontGrid}>
            {FONTS.map((f) => {
              const selected = prefs.fontFamily === f.key;
              return (
                <TouchableOpacity
                  key={f.key}
                  style={[
                    styles.fontPill,
                    {
                      backgroundColor: selected ? c.accent : c.surface,
                      borderColor: selected ? c.accent : c.border,
                    },
                  ]}
                  onPress={() => update('fontFamily', f.key)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.fontPillText,
                      { color: selected ? c.background : c.text.secondary },
                    ]}
                  >
                    {f.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Text size slider */}
        <SectionHeader label="Text Size" c={c} />
        <View style={[styles.sliderRow, { backgroundColor: c.surface, borderColor: c.border }]}>
          <Text style={[styles.sliderEndLabel, { color: c.text.muted }]}>A</Text>
          <Slider
            style={styles.slider}
            minimumValue={0.8}
            maximumValue={1.5}
            step={0.05}
            value={prefs.textScale}
            onValueChange={(v) => update('textScale', v)}
            minimumTrackTintColor={c.accent}
            maximumTrackTintColor={c.border}
            thumbTintColor={c.accent}
          />
          <Text style={[styles.sliderEndLabelLg, { color: c.text.muted }]}>A</Text>
          <Text style={[styles.sliderValue, { color: c.text.muted }]}>
            {Math.round(prefs.textScale * 100)}%
          </Text>
        </View>

        {/* Theme */}
        <SectionHeader label="Theme" c={c} />
        <View style={styles.themeRow}>
          {THEMES.map((t) => {
            const selected = prefs.theme === t;
            return (
              <TouchableOpacity
                key={t}
                style={[
                  styles.themePill,
                  {
                    backgroundColor: selected ? c.accent : c.surface,
                    borderColor: selected ? c.accent : c.border,
                    flex: 1,
                  },
                ]}
                onPress={() => update('theme', t)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.themePillText,
                    { color: selected ? c.background : c.text.secondary },
                  ]}
                >
                  {t}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Auto-advance & keep awake */}
        <SectionHeader label="Behaviour" c={c} />
        <Row c={c} bottom>
          <Text style={[styles.rowLabel, { color: c.text.primary }]}>Auto-advance Chapters</Text>
          <Switch
            value={prefs.autoAdvance}
            onValueChange={(v) => update('autoAdvance', v)}
            trackColor={{ false: c.border, true: c.accent }}
            thumbColor={Platform.OS === 'android' ? c.accent : undefined}
          />
        </Row>
        <Row c={c} bottom>
          <Text style={[styles.rowLabel, { color: c.text.primary }]}>Keep Screen Awake</Text>
          <Switch
            value={prefs.keepAwake}
            onValueChange={(v) => update('keepAwake', v)}
            trackColor={{ false: c.border, true: c.accent }}
            thumbColor={Platform.OS === 'android' ? c.accent : undefined}
          />
        </Row>
      </ScrollView>
    </View>
  );
}

function SectionHeader({ label, c }: { label: string; c: any }) {
  return (
    <Text style={[styles.sectionHeader, { color: c.text.muted }]}>{label.toUpperCase()}</Text>
  );
}

function Row({
  children,
  c,
  bottom,
}: {
  children: React.ReactNode;
  c: any;
  bottom?: boolean;
}) {
  return (
    <View
      style={[
        styles.row,
        {
          backgroundColor: c.surface,
          borderColor: c.border,
          borderBottomWidth: bottom ? 1 : 0,
        },
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingTop: 16 },
  previewCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 24,
  },
  previewLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 8,
    marginTop: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 8,
  },
  rowLabel: {
    fontSize: 15,
    flex: 1,
    marginRight: 12,
  },
  fontGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  fontPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  fontPillText: {
    fontSize: 13,
    fontWeight: '500',
  },
  sliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 8,
    gap: 8,
  },
  slider: {
    flex: 1,
    height: 32,
  },
  sliderEndLabel: {
    fontSize: 13,
    fontWeight: '500',
    width: 18,
    textAlign: 'center',
  },
  sliderEndLabelLg: {
    fontSize: 20,
    fontWeight: '500',
    width: 22,
    textAlign: 'center',
  },
  sliderValue: {
    fontSize: 12,
    width: 36,
    textAlign: 'right',
  },
  themeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  themePill: {
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  themePillText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
