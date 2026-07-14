/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Product } from '../types';

export interface SuggestionRequest {
  listName: string;
  listCategory?: string;
  existingProducts?: string[];
}

export interface HealthCheckResponse {
  status: string;
  geminiConfigured: boolean;
}

/**
 * Checks if the backend is configured with a real Gemini API Key.
 */
export async function checkAiHealth(): Promise<HealthCheckResponse> {
  try {
    const response = await fetch('/api/health');
    if (!response.ok) {
      throw new Error('Failed to fetch backend health status.');
    }
    return await response.json();
  } catch (error) {
    console.error('AI Healthcheck failed:', error);
    return { status: 'error', geminiConfigured: false };
  }
}

/**
 * Calls the backend server-side proxy to generate smart product suggestions.
 */
export async function getSmartSuggestions(req: SuggestionRequest): Promise<any[]> {
  try {
    const response = await fetch('/api/gemini/suggest', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to get smart suggestions.');
    }

    return await response.json();
  } catch (error: any) {
    console.error('Smart suggestions failed, using local/offline suggestions:', error);
    // If the server route fails, we return the fallback suggestions directly from standard items
    return getLocalOfflineFallback(req.listName, req.listCategory, req.existingProducts || []);
  }
}

/**
 * Converts a File object to a Base64-encoded string.
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
}

/**
 * Calls the backend server-side proxy to parse a receipt image using Gemini OCR.
 */
export async function parseReceiptOcr(base64Image: string): Promise<any[]> {
  try {
    const response = await fetch('/api/gemini/parse-receipt', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ base64Image }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to parse receipt.');
    }

    return await response.json();
  } catch (error) {
    console.error('OCR parsing failed, returning local offline products:', error);
    // Return mock products
    return [
      { name: 'Açúcar Refinado 1kg', brand: 'União', quantity: 2, unit: 'un', paidPrice: 4.80, category: 'Alimentação', note: 'Extraído do cupom fiscal (Simulado)' },
      { name: 'Detergente Líquido 500ml', brand: 'Ypê Coco', quantity: 3, unit: 'un', paidPrice: 2.10, category: 'Limpeza', note: 'Extraído do cupom fiscal (Simulado)' },
      { name: 'Shampoo Hidratante 400ml', brand: 'Seda', quantity: 1, unit: 'un', paidPrice: 13.90, category: 'Higiene', note: 'Extraído do cupom fiscal (Simulado)' },
      { name: 'Banana Prata', brand: '', quantity: 1.5, unit: 'kg', paidPrice: 7.50, category: 'Hortifruti', note: 'Extraído do cupom fiscal (Simulado)' }
    ];
  }
}

function getLocalOfflineFallback(listName: string, category: string | undefined, existing: string[]) {
  const nameLower = listName.toLowerCase();
  const existingLower = existing.map((e) => e.toLowerCase());

  let suggestions = [
    { name: 'Arroz Prato Fino 5kg', description: 'Arroz tipo 1', category: 'Alimentação', quantity: 1, unit: 'un', brand: 'Prato Fino', estimatedPrice: 29.90, note: 'Grão longo fino' },
    { name: 'Feijão Carioca Camil 1kg', description: 'Feijão carioquinha', category: 'Alimentação', quantity: 1, unit: 'un', brand: 'Camil', estimatedPrice: 8.50, note: 'Grão novo' },
    { name: 'Detergente Coco Ypê', description: 'Detergente líquido lava louças', category: 'Limpeza', quantity: 3, unit: 'un', brand: 'Ypê', estimatedPrice: 2.20, note: 'Fórmula suave' },
    { name: 'Creme Dental Colgate', description: 'Creme dental proteção anticárie', category: 'Higiene', quantity: 2, unit: 'un', brand: 'Colgate', estimatedPrice: 3.50, note: 'Embalagem econômica' },
    { name: 'Sabão em Pó Omo 1.6kg', description: 'Sabão em pó para roupas', category: 'Limpeza', quantity: 1, unit: 'un', brand: 'Omo', estimatedPrice: 24.50, note: 'Lavagem perfeita' },
  ];

  if (nameLower.includes('churrasco') || nameLower.includes('carne')) {
    suggestions = [
      { name: 'Picanha Maturada', description: 'Peça de picanha', category: 'Alimentação', quantity: 1.5, unit: 'kg', brand: 'Friboi Black', estimatedPrice: 89.90, note: 'Capa de gordura uniforme' },
      { name: 'Cerveja IPA', description: 'Cerveja artesanal lata 473ml', category: 'Bebidas', quantity: 6, unit: 'un', brand: 'Lagunitas', estimatedPrice: 12.90, note: 'Cerveja amarga aromática' },
      { name: 'Carvão Vegetal 5kg', description: 'Saco de carvão grande', category: 'Outros', quantity: 2, unit: 'un', brand: 'São José', estimatedPrice: 19.90, note: 'Pedaços grandes' },
      { name: 'Pão de Alho Recheado', description: 'Pão de alho tradicional', category: 'Alimentação', quantity: 2, unit: 'un', brand: 'Zinho', estimatedPrice: 13.90, note: 'Grelhar até ficar crocante' },
      { name: 'Linguiça Toscana', description: 'Linguiça de pernil para churrasco', category: 'Alimentação', quantity: 1, unit: 'kg', brand: 'Aurora', estimatedPrice: 22.90, note: 'Saborosa e suculenta' },
    ];
  }

  return suggestions.filter((item) => !existingLower.includes(item.name.toLowerCase()));
}
