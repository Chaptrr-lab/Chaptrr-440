/**
 * NovelEditor — prose-first chapter editor.
 * - Large TextInput for typing raw prose
 * - Auto-bubble toggle: quoted "text" → animated speech bubbles
 * - File upload: .txt / .docx parsed into segments
 * - Tap a bubble to change its type (popup)
 * - Bubbles resize to their text content
 */
import React, { useState, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Modal,
  Pressable,
  Switch,
  Alert,
  Platform,
} from 'react-native';
import { Type, MessageCircle, Cloud, Upload, Zap, X } from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';
import { parseTXT, parseDOCX } from '@/lib/upload-parser';
import { useTheme } from '@/theme/ThemeProvider';
import AnimatedShoutBubble from '@/components/bubbles/AnimatedShoutBubble';
import LoudBubble from '@/components/bubbles/LoudBubble';
import MachineBubble from '@/components/bubbles/MachineBubble';
import BloomBubble from '@/components/bubbles/BloomBubble';

// ─── Types ────────────────────────────────────────────────────────────────────

export type BubbleStyle = 'shout' | 'loud' | 'loud-convex' | 'machine' | 'bloom' | 'dialogue';

export interface ProseSegment {
  id: string;
  kind: 'prose';
  text: string;
}

export interface BubbleSegment {
  id: string;
  kind: 'bubble';
  text: string;
  bubbleStyle: BubbleStyle;
}

export type NovelSegment = ProseSegment | BubbleSegment;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Parse raw prose string into segments.
 * Quoted text → bubble, everything else → prose.
 */
function parseIntoSegments(raw: string, defaultBubbleStyle: BubbleStyle): NovelSegment[] {
  const segments: NovelSegment[] = [];
  // Split by quoted regions: "..."
  const parts = raw.split(/(\"[^\"]+\")/g);
  for (const part of parts) {
    if (!part) continue;
    if (part.startsWith('"') && part.endsWith('"')) {
      const text = part.slice(1, -1).trim();
      if (text) {
        const hasExclaim = text.includes('!');
        segments.push({ id: uid(), kind: 'bubble', text, bubbleStyle: hasExclaim ? 'shout' : defaultBubbleStyle });
      }
    } else {
      const trimmed = part.trim();
      if (trimmed) {
        // Split into paragraphs
        const paras = trimmed.split(/\n\s*\n/).filter(p => p.trim());
        for (const para of paras) {
          segments.push({ id: uid(), kind: 'prose', text: para.trim() });
        }
      }
    }
  }
  return segments;
}

// ─── Bubble Picker ────────────────────────────────────────────────────────────

const BUBBLE_TYPES: { key: BubbleStyle; label: string; color: string }[] = [
  { key: 'dialogue', label: 'Dialogue', color: '#6366f1' },
  { key: 'shout', label: 'Shout', color: '#f59e0b' },
  { key: 'loud', label: 'Loud (concave)', color: '#ec4899' },
  { key: 'loud-convex', label: 'Loud (convex)', color: '#e879f9' },
  { key: 'machine', label: 'Machine', color: '#10b981' },
  { key: 'bloom', label: 'Bloom', color: '#f472b6' },
];

interface BubblePickerProps {
  visible: boolean;
  current: BubbleStyle;
  onSelect: (style: BubbleStyle) => void;
  onClose: () => void;
}

function BubbleTypePicker({ visible, current, onSelect, onClose }: BubblePickerProps) {
  const { activeTheme } = useTheme();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={[styles.pickerSheet, { backgroundColor: activeTheme.colors.surface }]}>
          <Text style={[styles.pickerTitle, { color: activeTheme.colors.text.primary }]}>Bubble Style</Text>
          <View style={styles.pickerGrid}>
            {BUBBLE_TYPES.map(bt => (
              <TouchableOpacity
                key={bt.key}
                style={[
                  styles.pickerBtn,
                  { backgroundColor: activeTheme.colors.background, borderColor: activeTheme.colors.border },
                  current === bt.key && { borderColor: bt.color, backgroundColor: bt.color + '18' },
                ]}
                onPress={() => { onSelect(bt.key); onClose(); }}
              >
                <View style={[styles.pickerDot, { backgroundColor: bt.color }]} />
                <Text style={[styles.pickerBtnText, { color: activeTheme.colors.text.primary }]}>{bt.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Pressable>
    </Modal>
  );
}

// ─── Inline Bubble ────────────────────────────────────────────────────────────

interface InlineBubbleProps {
  seg: BubbleSegment;
  onTapBubble: (id: string) => void;
  onEditText: (id: string, text: string) => void;
  editing: boolean;
}

function InlineBubble({ seg, onTapBubble, onEditText, editing }: InlineBubbleProps) {
  const [localText, setLocalText] = useState(seg.text);

  const handleBlur = () => {
    if (localText.trim() !== seg.text) onEditText(seg.id, localText.trim());
  };

  const BubbleComponent = useMemo(() => {
    switch (seg.bubbleStyle) {
      case 'shout': return AnimatedShoutBubble;
      case 'loud': return (p: any) => <LoudBubble variant="concave" {...p} />;
      case 'loud-convex': return (p: any) => <LoudBubble variant="convex" {...p} />;
      case 'machine': return MachineBubble;
      case 'bloom': return BloomBubble;
      default: return null;
    }
  }, [seg.bubbleStyle]);

  if (editing) {
    return (
      <View style={styles.bubbleEditWrap}>
        <TextInput
          style={styles.bubbleEditInput}
          value={localText}
          onChangeText={setLocalText}
          onBlur={handleBlur}
          multiline
          autoFocus
        />
      </View>
    );
  }

  if (seg.bubbleStyle === 'dialogue') {
    return (
      <TouchableOpacity onLongPress={() => onTapBubble(seg.id)} activeOpacity={0.85}>
        <View style={styles.dialogueBubble}>
          <Text style={styles.dialogueText}>{seg.text}</Text>
        </View>
      </TouchableOpacity>
    );
  }

  if (!BubbleComponent) return null;

  return (
    <TouchableOpacity onLongPress={() => onTapBubble(seg.id)} activeOpacity={0.85} style={styles.bubbleTouchable}>
      <BubbleComponent>{seg.text}</BubbleComponent>
    </TouchableOpacity>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export interface NovelEditorProps {
  /** Current raw prose text (controlled) */
  value: string;
  onChange: (text: string) => void;
  /** Whether editor is in "preview" mode (shows rendered segments) */
  preview?: boolean;
  onPreviewChange?: (v: boolean) => void;
}

export default function NovelEditor({ value, onChange, preview = false, onPreviewChange }: NovelEditorProps) {
  const { activeTheme } = useTheme();
  const [autoBubble, setAutoBubble] = useState(true);
  const [pickerTarget, setPickerTarget] = useState<string | null>(null);
  const [editingBubble, setEditingBubble] = useState<string | null>(null);

  // Overridden bubble styles (user-changed from default)
  const [bubbleOverrides, setBubbleOverrides] = useState<Record<string, BubbleStyle>>({});

  const segments: NovelSegment[] = useMemo(() => {
    if (!autoBubble || !preview) return [];
    const segs = parseIntoSegments(value, 'dialogue');
    // Apply any overrides (by position-stable id — we re-parse so ids change;
    // instead, store overrides by text content as a lightweight approach)
    return segs;
  }, [value, autoBubble, preview]);

  const handleBubbleStyleChange = useCallback((id: string, style: BubbleStyle) => {
    setBubbleOverrides(prev => ({ ...prev, [id]: style }));
    // Propagate override into the segment
  }, []);

  const handleEditText = useCallback((id: string, newText: string) => {
    // Replace the quoted region in the raw prose that matches this bubble
    // Simple approach: find and replace first matching quoted string
    const seg = segments.find(s => s.id === id);
    if (!seg || seg.kind !== 'bubble') return;
    const escaped = seg.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const updated = value.replace(new RegExp(`"${escaped}"`, ''), `"${newText}"`);
    onChange(updated);
    setEditingBubble(null);
  }, [segments, value, onChange]);

  const handleUpload = useCallback(async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/plain', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        copyToCacheDirectory: true,
      });
      if (result.canceled || !result.assets?.length) return;
      const asset = result.assets[0];
      const uri = asset.uri;
      const name = asset.name ?? '';
      const parsed = name.toLowerCase().endsWith('.docx')
        ? await parseDOCX(uri)
        : await parseTXT(uri);
      if (parsed.length > 0) {
        const combined = parsed.map(ch => ch.blocks.map(b => b.content).join('\n\n')).join('\n\n---\n\n');
        onChange(combined);
      }
    } catch (err: any) {
      Alert.alert('Upload failed', err?.message ?? 'Could not parse file.');
    }
  }, [onChange]);

  const renderSegments = () => (
    <ScrollView style={styles.previewScroll} contentContainerStyle={styles.previewContent}>
      {segments.map(seg => {
        if (seg.kind === 'prose') {
          return (
            <Text key={seg.id} style={[styles.proseText, { color: activeTheme.colors.text.primary }]}>
              {seg.text}
            </Text>
          );
        }
        // Bubble segment
        const overrideStyle = bubbleOverrides[seg.id];
        const effectiveSeg: BubbleSegment = overrideStyle
          ? { ...seg, bubbleStyle: overrideStyle }
          : seg;
        return (
          <View key={seg.id} style={styles.bubbleRow}>
            <InlineBubble
              seg={effectiveSeg}
              onTapBubble={setPickerTarget}
              onEditText={handleEditText}
              editing={editingBubble === seg.id}
            />
          </View>
        );
      })}
    </ScrollView>
  );

  return (
    <View style={[styles.container, { backgroundColor: activeTheme.colors.background }]}>
      {/* Toolbar */}
      <View style={[styles.toolbar, { backgroundColor: activeTheme.colors.surface, borderBottomColor: activeTheme.colors.border }]}>
        {/* Auto-bubble toggle */}
        <View style={styles.toggleRow}>
          <Zap size={15} color="#f59e0b" />
          <Text style={[styles.toggleLabel, { color: activeTheme.colors.text.secondary }]}>Auto-bubble</Text>
          <Switch
            value={autoBubble}
            onValueChange={setAutoBubble}
            trackColor={{ false: '#444', true: '#6366f1' }}
            thumbColor="#fff"
            style={styles.switch}
          />
        </View>

        {/* Preview toggle */}
        {onPreviewChange && (
          <TouchableOpacity
            style={[styles.toolBtn, preview && styles.toolBtnActive]}
            onPress={() => onPreviewChange(!preview)}
          >
            <Text style={[styles.toolBtnText, { color: preview ? '#6366f1' : activeTheme.colors.text.secondary }]}>
              {preview ? 'Edit' : 'Preview'}
            </Text>
          </TouchableOpacity>
        )}

        {/* Upload button */}
        <TouchableOpacity style={styles.toolBtn} onPress={handleUpload}>
          <Upload size={16} color={activeTheme.colors.text.secondary} />
        </TouchableOpacity>
      </View>

      {/* Hint */}
      {autoBubble && !preview && (
        <View style={[styles.hint, { backgroundColor: activeTheme.colors.surface + 'cc' }]}>
          <Text style={[styles.hintText, { color: activeTheme.colors.text.muted }]}>
            Text in "quotes" will become speech bubbles. Long-press a bubble in Preview to change its style.
          </Text>
        </View>
      )}

      {/* Editor / Preview */}
      {preview ? (
        renderSegments()
      ) : (
        <TextInput
          style={[styles.input, { color: activeTheme.colors.text.primary }]}
          value={value}
          onChangeText={onChange}
          multiline
          textAlignVertical="top"
          placeholder={'Start writing your story here...\n\nUse "quotes" for speech bubbles.'}
          placeholderTextColor={activeTheme.colors.text.muted}
          scrollEnabled={false}
        />
      )}

      {/* Bubble type picker */}
      {pickerTarget && (
        <BubbleTypePicker
          visible={!!pickerTarget}
          current={
            bubbleOverrides[pickerTarget] ??
            (segments.find(s => s.id === pickerTarget) as BubbleSegment | undefined)?.bubbleStyle ??
            'dialogue'
          }
          onSelect={style => handleBubbleStyleChange(pickerTarget, style)}
          onClose={() => setPickerTarget(null)}
        />
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 5, flex: 1 },
  toggleLabel: { fontSize: 13, fontWeight: '500' },
  switch: { transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] },
  toolBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  toolBtnActive: { backgroundColor: 'rgba(99,102,241,0.15)' },
  toolBtnText: { fontSize: 13, fontWeight: '600' },
  hint: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginHorizontal: 12,
    marginTop: 8,
    borderRadius: 8,
  },
  hintText: { fontSize: 12, lineHeight: 16 },
  input: {
    flex: 1,
    padding: 16,
    fontSize: 17,
    lineHeight: 28,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  previewScroll: { flex: 1 },
  previewContent: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    gap: 16,
  },
  proseText: {
    fontSize: 17,
    lineHeight: 28,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  bubbleRow: { alignItems: 'center', marginVertical: 8 },
  bubbleTouchable: {},
  bubbleEditWrap: {
    borderWidth: 1,
    borderColor: '#6366f1',
    borderRadius: 12,
    padding: 10,
    minWidth: 160,
  },
  bubbleEditInput: {
    color: '#fff',
    fontSize: 15,
    minHeight: 40,
  },
  dialogueBubble: {
    backgroundColor: '#1e1e2e',
    borderColor: 'rgba(99,102,241,0.4)',
    borderWidth: 1,
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 18,
    paddingVertical: 12,
    maxWidth: 280,
  },
  dialogueText: {
    color: '#e5e5e5',
    fontSize: 16,
    lineHeight: 24,
  },
  // Bubble picker
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  pickerSheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 36,
  },
  pickerTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 14,
    textAlign: 'center',
  },
  pickerGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  pickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
    minWidth: '44%',
    flex: 1,
  },
  pickerDot: { width: 10, height: 10, borderRadius: 5 },
  pickerBtnText: { fontSize: 13, fontWeight: '500' },
});
