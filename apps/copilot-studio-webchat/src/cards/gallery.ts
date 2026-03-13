/**
 * Adaptive Cards Gallery
 * Inspired by the Power CAT Copilot Studio Kit
 * (https://github.com/microsoft/Power-CAT-Copilot-Studio-Kit)
 * Ported to run locally without Power Platform/Dataverse dependencies.
 */

export interface CardTemplate {
  id: string;
  name: string;
  description: string;
  category: 'display' | 'input' | 'data' | 'layout';
  template: Record<string, unknown>;
  sampleData?: Record<string, unknown>;
}

import heroCard from './templates/hero-card.json';
import listCard from './templates/list-card.json';
import formCard from './templates/form-card.json';
import weatherCard from './templates/weather-card.json';
import receiptCard from './templates/receipt-card.json';

export const cardTemplates: CardTemplate[] = [
  {
    id: 'hero',
    name: 'Hero Card',
    description: 'Featured content with image, title, description, and action buttons. Great for announcements.',
    category: 'display',
    template: heroCard,
  },
  {
    id: 'list',
    name: 'List / Search Results',
    description: 'Displays a list of items with thumbnails and descriptions. Ideal for search results.',
    category: 'data',
    template: listCard,
  },
  {
    id: 'form',
    name: 'Input Form',
    description: 'Collects user input with text fields, date picker, and dropdown. Use for data collection.',
    category: 'input',
    template: formCard,
  },
  {
    id: 'weather',
    name: 'Weather / Info',
    description: 'Columnar layout showing current conditions and a forecast. Demonstrates ColumnSet.',
    category: 'layout',
    template: weatherCard,
  },
  {
    id: 'receipt',
    name: 'Receipt / Summary',
    description: 'Order summary with line items using FactSet. Good for confirmations and summaries.',
    category: 'data',
    template: receiptCard,
  },
];

export function getCardById(id: string): CardTemplate | undefined {
  return cardTemplates.find(c => c.id === id);
}

export function getCardsByCategory(category: CardTemplate['category']): CardTemplate[] {
  return cardTemplates.filter(c => c.category === category);
}
