import { Block } from '@/types';
import { Platform, Alert, Share } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';

export function toNovelTxt(blocks: Block[]): string {
  return blocks
    .map(b => {
      if (b.type === 'text') {
        const t = b.content?.trim() || '';
        const bt = b.textStyle?.bubbleType || 'plain';
        
        if (bt === 'dialogue' || bt === 'shout') {
          return `"${t}"`;
        }
        
        return t;
      }
      return null;
    })
    .filter(Boolean)
    .join('\n\n');
}

export function toBackupJSONL(blocks: Block[]): string {
  return blocks
    .map(b => JSON.stringify({
      type: b.type,
      content: b.content,
      spacing: b.spacing ?? 0,
      textStyle: b.textStyle,
      imageStyle: b.imageStyle,
      bgStyle: b.bgStyle
    }))
    .join('\n');
}

export async function exportFile(content: string, filename: string, mimeType: string): Promise<void> {
  if (Platform.OS === 'web') {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return;
  }

  try {
    const fileUri = `${FileSystem.documentDirectory}${filename}`;
    await FileSystem.writeAsStringAsync(fileUri, content, {
      encoding: FileSystem.EncodingType.UTF8
    });

    try {
      await Share.share({
        url: fileUri,
        title: `Export ${filename}`
      });
    } catch {
      Alert.alert('Success', `File saved to ${fileUri}`);
    }
  } catch (error) {
    console.error('Error exporting file:', error);
    throw error;
  }
}
