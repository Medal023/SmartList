/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Product } from '../types';

export interface ParsedImportItem {
  name: string;
  quantity: number;
  unit: string;
  category: string;
  brand: string;
  note: string;
  estimatedPrice: number;
}

/**
 * Standardizes and normalizes the parsed units of measure to standard app units.
 */
export function normalizeUnit(unit: string): string {
  const u = unit.trim().toLowerCase();
  if (!u) return 'un';
  if (u.startsWith('kg')) return 'kg';
  if (u.startsWith('g')) return 'g';
  if (u.startsWith('l') && !u.startsWith('la')) return 'l';
  if (u.startsWith('ml')) return 'ml';
  if (u.startsWith('pac')) return 'pacote';
  if (u.startsWith('caix') || u === 'cx') return 'caixa';
  if (u.startsWith('gar')) return 'garrafa';
  if (u.startsWith('lat')) return 'lata';
  if (u.startsWith('pot')) return 'pote';
  if (u.startsWith('band')) return 'bandeja';
  if (u.startsWith('un')) return 'un';
  return u;
}

/**
 * Clean up leading list markers, emojis, bullets, and checkboxes.
 */
export function cleanLine(line: string): string {
  let text = line.trim();
  // Strip bullet markers, numbers followed by dots, emojis, or checkbox markers
  // Common markers: -, *, •, +, ☐, ☑, ✓, ✅, 1., 2.
  text = text.replace(/^([\s\-\*•\+☐☑✓✅]+|\d+\.\s*)/gu, '').trim();
  return text;
}

/**
 * Fast, offline-first client-side parsing using robust regex.
 */
export function parseImportTextLocal(text: string): ParsedImportItem[] {
  const lines = text.split(/\r?\n/);
  const items: ParsedImportItem[] = [];

  for (const rawLine of lines) {
    const cleaned = cleanLine(rawLine);
    if (!cleaned) continue;

    let qty = 1;
    let unit = 'un';
    let name = cleaned;

    // Regex 1: Matches number starting, followed optional multiplier 'x', followed optional unit, then product name
    // e.g., "5 kg Arroz", "2 litros Leite", "3 Pacotes Café", "10 unidades Água", "1 Caixa Chocolate", "5x Arroz", "2 Arroz"
    const format1Regex = /^(\d+(?:[.,]\d+)?)\s*(x|X)?\s*(kg|g|l|litros?|ml|unidades?|unid?|pacotes?|caixas?|cx|garrafas?|latas?|potes?|bandejas?)?\s+(.+)$/i;
    
    // Regex 2: Matches product name followed by quantity, followed optional unit
    // e.g., "Arroz 5 kg", "Arroz x5", "Arroz 2"
    const format2Regex = /^(.+?)\s+(?:x|X)?\s*(\d+(?:[.,]\d+)?)\s*(kg|g|l|litros?|ml|unidades?|unid?|pacotes?|caixas?|cx|garrafas?|latas?|potes?|bandejas?)?$/i;

    // Regex 3: Matches product name followed by explicit 'x' and quantity
    // e.g., "Arroz x 5"
    const format3Regex = /^(.+?)\s*(?:x|X)\s*(\d+(?:[.,]\d+)?)\s*(kg|g|l|litros?|ml|unidades?|unid?|pacotes?|caixas?|cx|garrafas?|latas?|potes?|bandejas?)?$/i;

    const match1 = cleaned.match(format1Regex);
    if (match1) {
      qty = parseFloat(match1[1].replace(',', '.'));
      unit = match1[3] ? match1[3] : 'un';
      name = match1[4];
    } else {
      const match2 = cleaned.match(format2Regex);
      if (match2) {
        name = match2[1];
        qty = parseFloat(match2[2].replace(',', '.'));
        unit = match2[3] ? match2[3] : 'un';
      } else {
        const match3 = cleaned.match(format3Regex);
        if (match3) {
          name = match3[1];
          qty = parseFloat(match3[2].replace(',', '.'));
          unit = match3[3] ? match3[3] : 'un';
        }
      }
    }

    // Capitalize the first letter for display polish
    const displayName = name.trim().charAt(0).toUpperCase() + name.trim().slice(1);

    items.push({
      name: displayName,
      quantity: Number.isNaN(qty) ? 1 : qty,
      unit: normalizeUnit(unit),
      category: 'Alimentação', // default
      brand: '',
      note: '',
      estimatedPrice: 0,
    });
  }

  return items;
}

/**
 * Premium, AI-powered parsing that connects to the server-side Gemini API.
 */
export async function parseImportTextAI(text: string): Promise<ParsedImportItem[]> {
  try {
    const response = await fetch('/api/gemini/parse-text', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to parse text via AI.');
    }

    return await response.json();
  } catch (error) {
    console.error('AI text parsing failed, fallback to local parsing:', error);
    // Silent fallback to local parser so user has uninterrupted experience
    return parseImportTextLocal(text);
  }
}
