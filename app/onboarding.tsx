import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Animated,
  Dimensions,
  StatusBar,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack } from 'expo-router';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Step 3: 16 tropes in a 4x4 grid
const TROPES = [
  { id: 'enemies-to-lovers', label: 'Enemies to Lovers', color: '#ef4444' },
  { id: 'found-family', label: 'Found Family', color: '#f59e0b' },
  { id: 'second-chance', label: 'Second Chance', color: '#10b981' },
  { id: 'chosen-one', label: 'Chosen One', color: '#6366f1' },
  { id: 'slow-burn', label: 'Slow Burn', color: '#ec4899' },
  { id: 'fake-dating', label: 'Fake Dating', color: '#f97316' },
  { id: 'redemption-arc', label: 'Redemption Arc', color: '#8b5cf6' },
  { id: 'forbidden-love', label: 'Forbidden Love', color: '#dc2626' },
  { id: 'mystery-thriller', label: 'Mystery & Thriller', color: '#0ea5e9' },
  { id: 'magic-school', label: 'Magic Academy', color: '#7c3aed' },
  { id: 'royal-intrigue', label: 'Royal Intrigue', color: '#d97706' },
  { id: 'apocalypse', label: 'Apocalypse', color: '#64748b' },
  { id: 'time-travel', label: 'Time Travel', color: '#0891b2' },
  { id: 'anti-hero', label: 'Anti-Hero', color: '#374151' },
  { id: 'hidden-identity', label: 'Hidden Identity', color: '#059669' },
  { id: 'power-couple', label: 'Power Couple', color: '#be185d' },
];

interface TasteProfile {
  readingPace: 'binge' | 'daily' | null;
  format: 'novel' | 'mixed' | 'comic' | null;
  tropes: string[];
  mood: number; // 0 = cozy, 100 = dark & intense
  referenceStory: string;
}

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState<TasteProfile>({
    readingPace: null,
    format: null,
    tropes: [],
    mood: 50,
    referenceStory: '',
  });
  const slideAnim = useRef(new Animated.Value(0)).current;

  const totalSteps = 5;

  const animateToNext = () => {
    Animated.sequence([
      Animated.timing(slideAnim, { toValue: -30, duration: 150, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
    ]).start();
  };

  const goNext = () => {
    if (step < totalSteps - 1) {
      animateToNext();
      setStep(s => s + 1);
    }
  };

  const goBack = () => {
    if (step > 0) setStep(s => s - 1);
  };

  const toggleTrope = (id: string) => {
    setProfile(p => {
      const already = p.tropes.includes(id);
      if (already) return { ...p, tropes: p.tropes.filter(t => t !== id) };
      if (p.tropes.length >= 5) return p; // max 5
      return { ...p, tropes: [...p.tropes, id] };
    });
  };

  const finish = async () => {
    await AsyncStorage.setItem('onboarding_complete', 'true');
    await AsyncStorage.setItem('taste_profile', JSON.stringify(profile));
    router.replace('/(tabs)/explore');
  };

  const canContinue = () => {
    if (step === 0) return profile.readingPace !== null;
    if (step === 1) return profile.format !== null;
    if (step === 2) return profile.tropes.length >= 5;
    return true;
  };

  const progressWidth = ((step + 1) / totalSteps) * 100;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="light-content" backgroundColor="#0a0a0a" />

      {/* Progress bar */}
      <View style={styles.progressBarTrack}>
        <Animated.View style={[styles.progressBarFill, { width: `${progressWidth}%` }]} />
      </View>

      {/* Back button */}
      {step > 0 && (
        <TouchableOpacity style={styles.backBtn} onPress={goBack}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
      )}

      <Animated.View style={[styles.stepContainer, { transform: [{ translateX: slideAnim }] }]}>
        {step === 0 && (
          <Step1
            value={profile.readingPace}
            onSelect={pace => setProfile(p => ({ ...p, readingPace: pace }))}
          />
        )}
        {step === 1 && (
          <Step2
            value={profile.format}
            onSelect={fmt => setProfile(p => ({ ...p, format: fmt }))}
          />
        )}
        {step === 2 && (
          <Step3
            selected={profile.tropes}
            onToggle={toggleTrope}
          />
        )}
        {step === 3 && (
          <Step4
            value={profile.mood}
            onChange={v => setProfile(p => ({ ...p, mood: v }))}
          />
        )}
        {step === 4 && (
          <Step5
            value={profile.referenceStory}
            onChange={v => setProfile(p => ({ ...p, referenceStory: v }))}
          />
        )}
      </Animated.View>

      {/* CTA */}
      <View style={[styles.ctaContainer, { paddingBottom: insets.bottom + 16 }]}>
        {step === 4 ? (
          <View style={styles.ctaRow}>
            <TouchableOpacity style={styles.skipBtn} onPress={finish}>
              <Text style={styles.skipBtnText}>Skip</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.finishBtn} onPress={finish}>
              <Text style={styles.finishBtnText}>Start reading →</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.nextBtn, !canContinue() && styles.nextBtnDisabled]}
            onPress={goNext}
            disabled={!canContinue()}
          >
            <Text style={styles.nextBtnText}>
              {step === 2 && profile.tropes.length < 5
                ? `Pick ${5 - profile.tropes.length} more`
                : 'Continue →'}
            </Text>
          </TouchableOpacity>
        )}
        <Text style={styles.stepIndicator}>{step + 1} of {totalSteps}</Text>
      </View>
    </View>
  );
}

// Step 1 — Reading pace
function Step1({ value, onSelect }: { value: TasteProfile['readingPace']; onSelect: (v: TasteProfile['readingPace']) => void }) {
  return (
    <View style={styles.step}>
      <Text style={styles.stepTitle}>How do you like to read?</Text>
      <Text style={styles.stepSubtitle}>We'll match your pace</Text>
      <View style={styles.optionList}>
        <OptionCard
          selected={value === 'binge'}
          onPress={() => onSelect('binge')}
          emoji="📚"
          title="Binge long stories"
          desc="Give me chapters I can lose myself in"
        />
        <OptionCard
          selected={value === 'daily'}
          onPress={() => onSelect('daily')}
          emoji="☀️"
          title="Short chapters, daily"
          desc="Quick hits I can read on the go"
        />
      </View>
    </View>
  );
}

// Step 2 — Format preference
function Step2({ value, onSelect }: { value: TasteProfile['format']; onSelect: (v: TasteProfile['format']) => void }) {
  return (
    <View style={styles.step}>
      <Text style={styles.stepTitle}>What's your format?</Text>
      <Text style={styles.stepSubtitle}>Choose what you enjoy most</Text>
      <View style={styles.optionList}>
        <OptionCard
          selected={value === 'novel'}
          onPress={() => onSelect('novel')}
          emoji="📖"
          title="Novel"
          desc="Traditional prose storytelling with dialogue"
        />
        <OptionCard
          selected={value === 'mixed'}
          onPress={() => onSelect('mixed')}
          emoji="✨"
          title="Mixed Media"
          desc="Visual storytelling with speech bubbles & mood scenes"
        />
        <OptionCard
          selected={value === 'comic'}
          onPress={() => onSelect('comic')}
          emoji="🎨"
          title="Comic / Webtoon"
          desc="Panel-based visual storytelling"
        />
      </View>
    </View>
  );
}

// Step 3 — Trope grid
function Step3({ selected, onToggle }: { selected: string[]; onToggle: (id: string) => void }) {
  return (
    <View style={styles.step}>
      <Text style={styles.stepTitle}>Pick 5 tropes you love</Text>
      <Text style={styles.stepSubtitle}>{selected.length}/5 selected</Text>
      <ScrollView style={styles.tropeScroll} showsVerticalScrollIndicator={false}>
        <View style={styles.tropeGrid}>
          {TROPES.map(trope => {
            const isSelected = selected.includes(trope.id);
            const isDisabled = !isSelected && selected.length >= 5;
            return (
              <TouchableOpacity
                key={trope.id}
                style={[
                  styles.tropeTile,
                  { backgroundColor: isSelected ? trope.color : '#1a1a1a', borderColor: trope.color },
                  isDisabled && styles.tropeTileDisabled,
                ]}
                onPress={() => onToggle(trope.id)}
                disabled={isDisabled}
                activeOpacity={0.8}
              >
                <Text style={[styles.tropeTileText, isSelected && styles.tropeTileTextSelected]}>
                  {trope.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

// Step 4 — Mood slider
function Step4({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const steps = [0, 25, 50, 75, 100];
  const labels = ['Cozy & Warm', 'Light & Fun', 'Balanced', 'Tense & Gripping', 'Dark & Intense'];

  return (
    <View style={styles.step}>
      <Text style={styles.stepTitle}>What's your vibe?</Text>
      <Text style={styles.stepSubtitle}>Set your mood preference</Text>

      <View style={styles.moodTrack}>
        <View style={styles.moodBar} />
        <View style={styles.moodSteps}>
          {steps.map((s, i) => (
            <TouchableOpacity
              key={s}
              style={[styles.moodDot, value === s && styles.moodDotActive]}
              onPress={() => onChange(s)}
            />
          ))}
        </View>
      </View>

      <View style={styles.moodLabels}>
        <Text style={styles.moodLabelLeft}>☀️ Cozy</Text>
        <Text style={styles.moodLabelRight}>🌑 Dark</Text>
      </View>

      <View style={styles.moodSelected}>
        {steps.map((s, i) => (
          value === s && (
            <Text key={s} style={styles.moodSelectedText}>{labels[i]}</Text>
          )
        ))}
      </View>

      <View style={styles.moodDetailSteps}>
        {steps.map((s, i) => (
          <TouchableOpacity
            key={s}
            style={[styles.moodDetailBtn, value === s && styles.moodDetailBtnActive]}
            onPress={() => onChange(s)}
          >
            <Text style={[styles.moodDetailLabel, value === s && styles.moodDetailLabelActive]}>
              {labels[i]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// Step 5 — Reference story
function Step5({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <View style={styles.step}>
      <Text style={styles.stepTitle}>Any story you love?</Text>
      <Text style={styles.stepSubtitle}>
        Name a book, show, or story from any platform.{'\n'}We'll find stories with the same energy.
      </Text>
      <TextInput
        style={styles.referenceInput}
        placeholder="e.g. The Midnight Library, Attack on Titan..."
        placeholderTextColor="#555"
        value={value}
        onChangeText={onChange}
        multiline={false}
        maxLength={80}
        returnKeyType="done"
      />
      <Text style={styles.skipHint}>This is optional — you can skip it</Text>
    </View>
  );
}

// Reusable option card
function OptionCard({ selected, onPress, emoji, title, desc }: {
  selected: boolean;
  onPress: () => void;
  emoji: string;
  title: string;
  desc: string;
}) {
  return (
    <TouchableOpacity
      style={[styles.optionCard, selected && styles.optionCardSelected]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={styles.optionEmoji}>{emoji}</Text>
      <View style={styles.optionTextBlock}>
        <Text style={[styles.optionTitle, selected && styles.optionTitleSelected]}>{title}</Text>
        <Text style={styles.optionDesc}>{desc}</Text>
      </View>
      {selected && <View style={styles.optionCheck}><Text style={styles.optionCheckMark}>✓</Text></View>}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  progressBarTrack: {
    height: 3,
    backgroundColor: '#1a1a1a',
    marginHorizontal: 0,
  },
  progressBarFill: {
    height: 3,
    backgroundColor: '#6366f1',
  },
  backBtn: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backBtnText: {
    color: '#888',
    fontSize: 15,
  },
  stepContainer: {
    flex: 1,
  },
  step: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 16,
    color: '#888',
    marginBottom: 32,
    lineHeight: 22,
  },
  optionList: {
    gap: 12,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#141414',
    borderRadius: 14,
    padding: 18,
    borderWidth: 1.5,
    borderColor: '#222',
    gap: 14,
  },
  optionCardSelected: {
    borderColor: '#6366f1',
    backgroundColor: '#1a1a2e',
  },
  optionEmoji: {
    fontSize: 28,
  },
  optionTextBlock: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#ccc',
    marginBottom: 4,
  },
  optionTitleSelected: {
    color: '#fff',
  },
  optionDesc: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  optionCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionCheckMark: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  // Trope grid
  tropeScroll: {
    flex: 1,
  },
  tropeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingBottom: 20,
  },
  tropeTile: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 22,
    borderWidth: 1.5,
    minWidth: (SCREEN_WIDTH - 48 - 20) / 2,
    alignItems: 'center',
  },
  tropeTileDisabled: {
    opacity: 0.35,
  },
  tropeTileText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#aaa',
    textAlign: 'center',
  },
  tropeTileTextSelected: {
    color: '#fff',
  },
  // Mood
  moodTrack: {
    marginTop: 20,
    marginHorizontal: 8,
    position: 'relative',
    height: 40,
    justifyContent: 'center',
  },
  moodBar: {
    height: 4,
    backgroundColor: '#333',
    borderRadius: 2,
  },
  moodSteps: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 0,
  },
  moodDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#333',
    borderWidth: 2,
    borderColor: '#555',
  },
  moodDotActive: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
    transform: [{ scale: 1.3 }],
  },
  moodLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    marginHorizontal: 4,
  },
  moodLabelLeft: {
    color: '#888',
    fontSize: 13,
  },
  moodLabelRight: {
    color: '#888',
    fontSize: 13,
  },
  moodSelected: {
    alignItems: 'center',
    marginTop: 16,
    minHeight: 28,
  },
  moodSelectedText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  moodDetailSteps: {
    marginTop: 24,
    gap: 10,
  },
  moodDetailBtn: {
    padding: 14,
    borderRadius: 10,
    backgroundColor: '#141414',
    borderWidth: 1,
    borderColor: '#222',
  },
  moodDetailBtnActive: {
    backgroundColor: '#1a1a2e',
    borderColor: '#6366f1',
  },
  moodDetailLabel: {
    color: '#666',
    fontSize: 15,
    fontWeight: '500',
    textAlign: 'center',
  },
  moodDetailLabelActive: {
    color: '#fff',
  },
  // Reference input
  referenceInput: {
    backgroundColor: '#141414',
    borderRadius: 12,
    padding: 16,
    color: '#fff',
    fontSize: 16,
    borderWidth: 1.5,
    borderColor: '#333',
  },
  skipHint: {
    color: '#555',
    fontSize: 13,
    marginTop: 10,
    textAlign: 'center',
  },
  // CTA
  ctaContainer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#111',
    gap: 10,
  },
  nextBtn: {
    backgroundColor: '#6366f1',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
  },
  nextBtnDisabled: {
    backgroundColor: '#222',
  },
  nextBtnText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
  ctaRow: {
    flexDirection: 'row',
    gap: 12,
  },
  skipBtn: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
  },
  skipBtnText: {
    color: '#666',
    fontSize: 17,
    fontWeight: '600',
  },
  finishBtn: {
    flex: 2,
    backgroundColor: '#6366f1',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
  },
  finishBtnText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
  stepIndicator: {
    textAlign: 'center',
    color: '#444',
    fontSize: 13,
  },
});
