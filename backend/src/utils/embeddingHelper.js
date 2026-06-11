import { AutoProcessor, CLIPVisionModelWithProjection, RawImage } from '@xenova/transformers';
import path from 'path';
import fs from 'fs';
import Product from '../models/Product.js';

let processor = null;
let model = null;
const model_id = 'Xenova/clip-vit-base-patch32';

// Lazy loader for CLIP model
export async function initModel() {
  if (!processor || !model) {
    console.log(`[CLIP] Loading vision model and processor: ${model_id}...`);
    processor = await AutoProcessor.from_pretrained(model_id);
    model = await CLIPVisionModelWithProjection.from_pretrained(model_id);
    console.log('[CLIP] Model and processor loaded successfully.');
  }
}

// Helper to check if an image path is a default placeholder
export function isPlaceholderImage(imagePath) {
  if (!imagePath) return true;
  const pathLower = imagePath.toLowerCase();
  return pathLower.includes('placeholder') || pathLower.includes('default');
}

// Generate embedding for a single image path or URL
export async function getEmbedding(imagePathOrUrl) {
  try {
    await initModel();

    let resolvedPath = imagePathOrUrl;

    // Resolve local relative paths starting with /uploads
    if (typeof imagePathOrUrl === 'string' && imagePathOrUrl.startsWith('/uploads')) {
      resolvedPath = path.join(path.resolve(), imagePathOrUrl);
    }

    // Verify local file exists before processing
    if (
      typeof resolvedPath === 'string' &&
      !resolvedPath.startsWith('http://') &&
      !resolvedPath.startsWith('https://') &&
      !fs.existsSync(resolvedPath)
    ) {
      throw new Error(`File does not exist: ${resolvedPath}`);
    }

    // Read and preprocess the image
    const image = await RawImage.read(resolvedPath);
    const image_inputs = await processor(image);

    // Run inference
    const { image_embeds } = await model(image_inputs);

    // Get JS array from tensor of shape [1, 512]
    const embedding = image_embeds.tolist()[0];
    return embedding;
  } catch (error) {
    console.error(`[CLIP] Error generating embedding for image ${imagePathOrUrl}:`, error.message);
    throw error;
  }
}

// Compute Cosine Similarity between two numeric vectors
export function cosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length !== vecB.length) {
    return 0;
  }
  let dotProduct = 0.0;
  let normA = 0.0;
  let normB = 0.0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Scan DB and generate embeddings for all products that don't have them
export async function generateMissingEmbeddings() {
  console.log('[CLIP] Checking for products missing image embeddings...');
  try {
    // Find all products without imageEmbedding
    const products = await Product.find({
      $or: [
        { imageEmbedding: { $exists: false } },
        { imageEmbedding: { $size: 0 } },
        { imageEmbedding: null }
      ]
    });

    if (products.length === 0) {
      console.log('[CLIP] All products already have image embeddings.');
      return;
    }

    console.log(`[CLIP] Found ${products.length} products missing embeddings. Starting background sync...`);
    
    // Process them sequentially to avoid memory pressure
    let successCount = 0;
    let failCount = 0;
    let skipCount = 0;

    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      const imagePath = product.image;

      if (isPlaceholderImage(imagePath)) {
        console.log(`[CLIP] Skipping placeholder image for product: "${product.name}" (${product._id})`);
        skipCount++;
        continue;
      }

      try {
        console.log(`[CLIP] Generating embedding for "${product.name}" (${i + 1}/${products.length})...`);
        const embedding = await getEmbedding(imagePath);
        product.imageEmbedding = embedding;
        await product.save();
        successCount++;
      } catch (err) {
        console.error(`[CLIP] Failed to generate embedding for product: "${product.name}" (${product._id}):`, err.message);
        failCount++;
      }
    }

    console.log(`[CLIP] Background sync completed. Success: ${successCount}, Failed: ${failCount}, Skipped: ${skipCount}`);
  } catch (error) {
    console.error('[CLIP] Error in generateMissingEmbeddings background task:', error.message);
  }
}
