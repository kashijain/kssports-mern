import Product from '../models/Product.js';

/**
 * Parses natural language messages to perform queries on the Product catalog
 * @param {string} messageText 
 * @returns {Promise<Array>} List of matching products
 */
export const parseAndSearchProducts = async (messageText) => {
  try {
    const text = messageText.trim().toLowerCase();
    
    const query = {};
    let sort = {};
    const limit = 6; // Max matching product cards to output
    
    // 1. Resolve Category Keywords
    if (text.includes('bat')) {
      query.category = 'Bat';
    } else if (text.includes('ball')) {
      query.category = 'Ball';
    } else if (text.includes('glove')) {
      query.category = 'Gloves';
    } else if (text.includes('sleeves')) {
      query.category = 'Sleeves';
    } else if (text.includes('shaker')) {
      query.category = 'Shaker';
    } else if (text.includes('racket') || text.includes('racquet') || text.includes('badminton')) {
      query.$or = [
        { category: 'Accessories' },
        { name: /racket|racquet|badminton/i }
      ];
    } else if (text.includes('accessories') || text.includes('accessory')) {
      query.category = 'Accessories';
    } else if (text.includes('shoe') || text.includes('shoes') || text.includes('footwear')) {
      query.category = 'Shoes';
    }
    
    // 2. Resolve Brand Keywords
    const brands = ['ss', 'sg', 'mrf', 'dsc', 'yonex', 'gtc', 'veer', 'sai', 'ks', 'nike', 'adidas'];
    for (const b of brands) {
      const regex = new RegExp(`\\b${b}\\b`, 'i');
      if (regex.test(text)) {
        query.brand = new RegExp(`^${b}$`, 'i');
        break; // Match first matching brand
      }
    }
    
    // 3. Resolve Price Boundaries
    // Matches "under X" or "below X" or "less than X"
    const underMatch = text.match(/(?:under|below|less\s*than)\s*(?:rs\.?|₹)?\s*(\d+)/i);
    // Matches "between X and Y"
    const betweenMatch = text.match(/(?:between|from)\s*(?:rs\.?|₹)?\s*(\d+)\s*(?:and|to)\s*(?:rs\.?|₹)?\s*(\d+)/i);
    
    if (betweenMatch) {
      const min = Number(betweenMatch[1]);
      const max = Number(betweenMatch[2]);
      query.price = { $gte: min, $lte: max };
    } else if (underMatch) {
      const max = Number(underMatch[1]);
      query.price = { $lte: max };
    }
    
    // 4. Resolve Sorting requests
    if (text.includes('cheapest') || text.includes('cheap') || text.includes('lowest') || text.includes('affordable')) {
      sort = { price: 1 };
    } else if (text.includes('expensive') || text.includes('highest') || text.includes('premium') || text.includes('costly')) {
      sort = { price: -1 };
    }
    
    // 5. Resolve quality metrics (beginner vs professional recommendations)
    if (text.includes('beginner') || text.includes('starter') || text.includes('learn') || text.includes('new player')) {
      query.$or = query.$or || [];
      query.$or.push(
        { features: /beginner|starter/i },
        { description: /beginner|starter|control/i },
        { name: /beginner|starter/i }
      );
    } else if (text.includes('professional') || text.includes('pro ') || text.includes('match') || text.includes('advanced')) {
      query.$or = query.$or || [];
      query.$or.push(
        { features: /pro|professional|match/i },
        { description: /professional|advanced|english/i },
        { name: /pro|legend|premium/i }
      );
    }
    
    // 6. Generic Text Search Fallback
    // If no specific selectors matched, search title/description using text keywords safely
    if (!query.category && !query.brand && !query.price && (!query.$or || query.$or.length === 0)) {
      // Prevent regex injection by escaping search terms
      const sanitizedText = text.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      if (sanitizedText.length > 2) {
        query.$or = [
          { name: new RegExp(sanitizedText, 'i') },
          { brand: new RegExp(sanitizedText, 'i') },
          { category: new RegExp(sanitizedText, 'i') },
          { description: new RegExp(sanitizedText, 'i') }
        ];
      }
    }
    
    // Clear empty $or selectors
    if (query.$or && query.$or.length === 0) {
      delete query.$or;
    }
    
    return await Product.find(query)
      .sort(sort)
      .limit(limit);
      
  } catch (error) {
    console.error('[ChatbotSearch] Parsing error:', error.message);
    return [];
  }
};
