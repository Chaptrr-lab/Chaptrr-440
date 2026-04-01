import { Block } from '@/types';
import JSZip from 'jszip';
import { XMLParser } from 'fast-xml-parser';

export interface ParsedChapter {
  title: string;
  blocks: Block[];
}

function stripBOM(text: string): string {
  if (text.charCodeAt(0) === 0xFEFF) {
    return text.slice(1);
  }
  return text;
}

function normalizeNewlines(text: string): string {
  let normalized = text.replace(/\r\n/g, '\n');
  normalized = normalized.replace(/\n{3,}/g, '\n\n');
  return normalized;
}

function convertSmartQuotes(text: string): string {
  return text
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2018\u2019]/g, "'");
}

function detectChapterHeadings(lines: string[]): number[] {
  const headingRE = /^(Chapter\s+\d+\b.*|#\s+.+)$/i;
  const indices: number[] = [];
  
  lines.forEach((line, idx) => {
    if (headingRE.test(line.trim())) {
      indices.push(idx);
    }
  });
  
  return indices;
}

function createBlockFromParagraph(para: string, order: number): Block {
  const trimmed = para.trim();
  
  const isQuoted = /^"\s*.*\s*"$/.test(trimmed);
  
  if (isQuoted) {
    const content = trimmed.slice(1, -1).trim();
    const hasExclamation = content.includes('!');
    
    return {
      id: `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'text',
      content,
      order,
      spacing: 0,
      textStyle: {
        bubbleType: hasExclamation ? 'shout' : 'dialogue',
        alignment: 'center',
        isBold: false,
        isItalic: false,
      },
    };
  }
  
  return {
    id: `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type: 'text',
    content: trimmed,
    order,
    spacing: 0,
    textStyle: {
      bubbleType: 'plain',
      alignment: 'center',
      isBold: false,
      isItalic: false,
    },
  };
}

export async function parseTXT(fileUri: string): Promise<ParsedChapter[]> {
  try {
    let text: string;
    
    if (fileUri.startsWith('data:')) {
      const base64 = fileUri.split(',')[1];
      text = atob(base64);
    } else if (fileUri.startsWith('file://') || fileUri.startsWith('content://')) {
      const response = await fetch(fileUri);
      const blob = await response.blob();
      text = await blob.text();
    } else {
      throw new Error('Unsupported file URI format');
    }
    
    text = stripBOM(text);
    text = normalizeNewlines(text);
    text = convertSmartQuotes(text);
    
    const lines = text.split('\n');
    const headingIndices = detectChapterHeadings(lines);
    
    if (headingIndices.length === 0) {
      const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim());
      const blocks: Block[] = paragraphs.map((para, idx) => createBlockFromParagraph(para, idx));
      
      return [{
        title: 'Chapter 1',
        blocks,
      }];
    }
    
    const chapters: ParsedChapter[] = [];
    
    for (let i = 0; i < headingIndices.length; i++) {
      const startIdx = headingIndices[i];
      const endIdx = i < headingIndices.length - 1 ? headingIndices[i + 1] : lines.length;
      
      const title = lines[startIdx].trim().replace(/^#\s*/, '');
      const chapterLines = lines.slice(startIdx + 1, endIdx);
      const chapterText = chapterLines.join('\n');
      
      const paragraphs = chapterText.split(/\n\s*\n/).filter(p => p.trim());
      const blocks: Block[] = paragraphs.map((para, idx) => createBlockFromParagraph(para, idx));
      
      chapters.push({ title, blocks });
    }
    
    return chapters;
  } catch (error) {
    console.error('[parseTXT] Error:', error);
    throw new Error('Failed to parse TXT file. Ensure it is UTF-8 encoded.');
  }
}

export async function parseDOCX(fileUri: string): Promise<ParsedChapter[]> {
  try {
    let arrayBuffer: ArrayBuffer;
    
    if (fileUri.startsWith('data:')) {
      const base64 = fileUri.split(',')[1];
      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      arrayBuffer = bytes.buffer;
    } else if (fileUri.startsWith('file://') || fileUri.startsWith('content://')) {
      const response = await fetch(fileUri);
      arrayBuffer = await response.arrayBuffer();
    } else {
      throw new Error('Unsupported file URI format');
    }
    
    const zip = await JSZip.loadAsync(arrayBuffer);
    const docXml = await zip.file('word/document.xml')?.async('string');
    
    if (!docXml) {
      throw new Error('Invalid DOCX file: missing document.xml');
    }
    
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
    });
    
    const doc = parser.parse(docXml);
    const body = doc['w:document']?.['w:body'];
    
    if (!body) {
      throw new Error('Invalid DOCX structure');
    }
    
    const paragraphs = Array.isArray(body['w:p']) ? body['w:p'] : [body['w:p']];
    
    const chapters: ParsedChapter[] = [];
    let currentChapter: ParsedChapter | null = null;
    let blockOrder = 0;
    
    for (const p of paragraphs) {
      if (!p) continue;
      
      const pPr = p['w:pPr'];
      const pStyle = pPr?.['w:pStyle']?.['@_w:val'];
      
      const runs = Array.isArray(p['w:r']) ? p['w:r'] : (p['w:r'] ? [p['w:r']] : []);
      let text = '';
      
      for (const run of runs) {
        const t = run['w:t'];
        if (typeof t === 'string') {
          text += t;
        } else if (t && typeof t === 'object' && '#text' in t) {
          text += (t as any)['#text'];
        }
      }
      
      text = text.trim();
      if (!text) continue;
      
      if (pStyle && (pStyle === 'Heading1' || pStyle === 'Heading2')) {
        if (currentChapter) {
          chapters.push(currentChapter);
        }
        currentChapter = {
          title: text,
          blocks: [],
        };
        blockOrder = 0;
      } else {
        if (!currentChapter) {
          currentChapter = {
            title: 'Chapter 1',
            blocks: [],
          };
          blockOrder = 0;
        }
        
        const block = createBlockFromParagraph(text, blockOrder++);
        currentChapter.blocks.push(block);
      }
    }
    
    if (currentChapter) {
      chapters.push(currentChapter);
    }
    
    if (chapters.length === 0) {
      throw new Error('No content found in DOCX');
    }
    
    return chapters;
  } catch (error) {
    console.error('[parseDOCX] Error:', error);
    
    const fallback: ParsedChapter = {
      title: 'Imported Chapter',
      blocks: [{
        id: `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: 'text',
        content: 'DOCX conversion failed. Please use TXT format for reliable imports.',
        order: 0,
        spacing: 0,
        textStyle: {
          bubbleType: 'plain',
          alignment: 'center',
          isBold: false,
          isItalic: false,
        },
      }],
    };
    
    return [fallback];
  }
}
