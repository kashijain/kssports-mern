import Product from '../models/Product.js';

/**
 * Parses natural language messages to perform queries on the Product catalog
 * @param {string} messageText 
 * @returns {Promise<Array>} List of matching products
 */
export const parseAndSearchProducts = async (messageText) => {
  try {
    const text = messageText.trim().toLowerCase();
    
    // Detect if this is a product-related query to prevent intercepting other intents (e.g. FAQs or greetings)
    const productKeywords = ['bat', 'ball', 'glove', 'glube', 'sleeves', 'shaker', 'racket', 'racquet', 'badminton', 'socks', 'scoks', 'grip', 'foot', 'shoe', 'accessory', 'accessories', 'football'];
    const brandKeywords = ['ss', 'sg', 'mrf', 'dsc', 'yonex', 'gtc', 'veer', 'sai', 'ks', 'nike', 'adidas', 'slimfit'];
    const priceKeywords = ['under', 'below', 'between', 'from', 'to', 'rs', '₹', 'price', 'cheap', 'expensive', 'cost', 'limit', 'budget'];
    
    // Matches "between X and Y" / "from X to Y"
    const betweenRegex = /(?:between|from)\s*(?:rs\.?|₹)?\s*(\d+)\s*(?:and|to)\s*(?:rs\.?|₹)?\s*(\d+)/i;
    const betweenMatch = text.match(betweenRegex);
    
    // Matches "under X" / "below X" / "less than X" / "lte X"
    const underRegex = /(?:under|below|less\s*than|lte)\s*(?:rs\.?|₹)?\s*(\d+)/i;
    const underMatch = text.match(underRegex);

    const hasPriceLimit = !!(betweenMatch || underMatch);
    const isProductQuery = productKeywords.some(w => text.includes(w)) ||
                           brandKeywords.some(w => text.includes(w)) ||
                           priceKeywords.some(w => text.includes(w)) ||
                           hasPriceLimit;

    if (!isProductQuery) {
      return {
        products: [],
        isFallback: false,
        limitPhrase: ''
      };
    }

    let minPrice = null;
    let maxPrice = null;
    let pricePhrase = '';
    let limitPhrase = '';
    
    if (betweenMatch) {
      pricePhrase = betweenMatch[0];
      minPrice = Number(betweenMatch[1]);
      maxPrice = Number(betweenMatch[2]);
      limitPhrase = `between ₹${minPrice} and ₹${maxPrice}`;
    } else if (underMatch) {
      pricePhrase = underMatch[0];
      maxPrice = Number(underMatch[1]);
      const prep = underMatch[0].toLowerCase().includes('below') ? 'below' : 'under';
      limitPhrase = `${prep} ₹${maxPrice}`;
    }
    
    // Extract search term by removing the price phrase
    let searchTerm = text;
    if (pricePhrase) {
      searchTerm = text.replace(pricePhrase, '');
    }
    
    // Clean up search term by removing prepositions/action verbs
    searchTerm = searchTerm.replace(/^(?:for|in|of|show|find|search|get|buy|need)\s+/gi, '');
    searchTerm = searchTerm.replace(/\s+(?:for|in|of)$/gi, '');
    searchTerm = searchTerm.trim();

    // Noise/descriptor words to strip from strict search for better matching
    let cleanedTerm = searchTerm;
    const noiseWords = ['cricket', 'sports', 'athletic', 'gear', 'original', 'premium', 'best', 'quality', 'brand', 'good', 'cheap', 'cheapest', 'expensive', 'professional', 'beginner', 'new', 'latest'];
    for (const nw of noiseWords) {
      const regex = new RegExp(`\\b${nw}\\b`, 'gi');
      cleanedTerm = cleanedTerm.replace(regex, '');
    }
    cleanedTerm = cleanedTerm.replace(/\s+/g, ' ').trim();

    const limit = 6;
    let sort = {};
    
    // Resolve Sorting requests
    if (text.includes('cheapest') || text.includes('cheap') || text.includes('lowest') || text.includes('affordable')) {
      sort = { price: 1 };
    } else if (text.includes('expensive') || text.includes('highest') || text.includes('premium') || text.includes('costly')) {
      sort = { price: -1 };
    } else {
      // Default: sort by price ascending so the user sees most budget-friendly products first
      sort = { price: 1 };
    }
    
    // Define query builder
    const buildSearchQuery = (term, applyPrice = true) => {
      const q = {};
      
      if (applyPrice) {
        if (minPrice !== null && maxPrice !== null) {
          q.price = { $gte: minPrice, $lte: maxPrice };
        } else if (maxPrice !== null) {
          q.price = { $lte: maxPrice };
        }
      }
      
      if (term) {
        const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const searchRegex = new RegExp(escapedTerm, 'i');
        const criteria = [
          { name: searchRegex },
          { category: searchRegex },
          { brand: searchRegex }
        ];
        
        // Match specific category mappings when word is found
        const lower = term.toLowerCase();
        if (lower.includes('bat')) {
          criteria.push({ category: 'Bats' });
          criteria.push({ name: /bat/i });
        }
        if (lower.includes('ball') || lower.includes('foot') || lower.includes('tennis')) {
          criteria.push({ category: 'Ball' });
          criteria.push({ name: /ball/i });
        }
        if (lower.includes('glove') || lower.includes('glube')) {
          criteria.push({ category: 'Gloves' });
          criteria.push({ name: /glove|glube/i });
        }
        if (lower.includes('shaker')) {
          criteria.push({ category: 'Shaker' });
          criteria.push({ name: /shaker/i });
        }
        if (lower.includes('racket') || lower.includes('racquet') || lower.includes('badminton')) {
          criteria.push({ category: 'Accessories' });
          criteria.push({ category: 'Other' });
          criteria.push({ name: /racket|racquet|badminton|mitton/i });
        }
        if (lower.includes('sleeves')) {
          criteria.push({ category: 'Accessories' });
          criteria.push({ name: /sleeves/i });
        }
        if (lower.includes('socks')) {
          criteria.push({ category: 'Accessories' });
          criteria.push({ name: /socks|scoks/i });
        }
        if (lower.includes('grip')) {
          criteria.push({ category: 'Accessories' });
          criteria.push({ name: /grip/i });
        }
        
        q.$or = criteria;
      }
      
      return q;
    };
    
    // 1. Try search with price constraint on cleaned term (exact matches)
    let query = buildSearchQuery(cleanedTerm, true);
    let products = await Product.find(query).sort(sort).limit(limit);
    
    if (products && products.length > 0) {
      // Check if search term implies fallback category (like football, racket, badminton)
      const termLower = searchTerm.toLowerCase();
      const isFallbackCategory = termLower.includes('football') || 
                                 termLower.includes('racket') || 
                                 termLower.includes('racquet') || 
                                 termLower.includes('badminton');
      
      return {
        products,
        isFallback: isFallbackCategory,
        limitPhrase
      };
    }
    
    // 2. If no products found, check if we had a price limit and try to query WITHOUT price limit
    if (hasPriceLimit && cleanedTerm) {
      const queryWithoutPrice = buildSearchQuery(cleanedTerm, false);
      products = await Product.find(queryWithoutPrice).sort(sort).limit(limit);
      
      if (products && products.length > 0) {
        return {
          products,
          isFallback: true,
          limitPhrase
        };
      }
    }
    
    // 3. Fallback to broad category checks if strict search returned nothing
    const getCategoryFallback = (term) => {
      const lower = term.toLowerCase();
      if (lower.includes('bat')) return 'Bats';
      if (lower.includes('ball') || lower.includes('foot') || lower.includes('tennis')) return 'Ball';
      if (lower.includes('glove') || lower.includes('glube')) return 'Gloves';
      if (lower.includes('shaker')) return 'Shaker';
      if (lower.includes('sleeves') || lower.includes('grip') || lower.includes('socks') || lower.includes('racket') || lower.includes('racquet') || lower.includes('badminton') || lower.includes('accessory') || lower.includes('accessories')) return 'Accessories';
      return null;
    };
    
    const fallbackCategory = getCategoryFallback(searchTerm);
    if (fallbackCategory) {
      // Try fallback category with price limit first
      const fallbackQueryWithPrice = { category: fallbackCategory };
      if (minPrice !== null && maxPrice !== null) {
        fallbackQueryWithPrice.price = { $gte: minPrice, $lte: maxPrice };
      } else if (maxPrice !== null) {
        fallbackQueryWithPrice.price = { $lte: maxPrice };
      }
      
      products = await Product.find(fallbackQueryWithPrice).sort(sort).limit(limit);
      
      if (products && products.length > 0) {
        return {
          products,
          isFallback: true,
          limitPhrase
        };
      }
      
      // Try fallback category WITHOUT price limit
      products = await Product.find({ category: fallbackCategory }).sort(sort).limit(limit);
      if (products && products.length > 0) {
        return {
          products,
          isFallback: true,
          limitPhrase
        };
      }
    }
    
    // 4. Ultimate fallback: retrieve any popular products sorted by rating/price
    products = await Product.find({}).sort({ rating: -1, price: 1 }).limit(limit);
    return {
      products,
      isFallback: true,
      limitPhrase: limitPhrase || 'under that price'
    };
    
  } catch (error) {
    console.error('[ChatbotSearch] Parsing error:', error.message);
    return {
      products: [],
      isFallback: false,
      limitPhrase: ''
    };
  }
};
