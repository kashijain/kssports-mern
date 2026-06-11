import { getEmbedding, cosineSimilarity } from './embeddingHelper.js';

async function runTest() {
  console.log('--- CLIP STANDALONE VERIFICATION TEST ---');
  try {
    const testImage1 = '/uploads/images-1774718770709.jpeg';
    const testImage2 = '/uploads/images-1774718770709.jpeg'; // same image
    const testImage3 = '/uploads/king-1774862903695.png'; // different image
    
    console.log(`1. Generating embedding for image 1: ${testImage1}`);
    const emb1 = await getEmbedding(testImage1);
    console.log(`Success! Embedding vector length: ${emb1.length} (Expected: 512)`);
    console.log('Sample dimensions (first 5 values):', emb1.slice(0, 5));
    
    console.log(`2. Generating embedding for image 2 (same image): ${testImage2}`);
    const emb2 = await getEmbedding(testImage2);
    
    console.log(`3. Generating embedding for image 3 (different image): ${testImage3}`);
    const emb3 = await getEmbedding(testImage3);
    
    console.log('\n4. Calculating similarities...');
    const similarity12 = cosineSimilarity(emb1, emb2);
    const similarity13 = cosineSimilarity(emb1, emb3);
    
    console.log(`Similarity (Image 1 vs Image 2 [Same]): ${similarity12.toFixed(4)} (Expected: ~1.0000)`);
    console.log(`Similarity (Image 1 vs Image 3 [Different]): ${similarity13.toFixed(4)} (Expected: significantly lower)`);
    
    if (emb1.length === 512 && similarity12 > 0.99 && similarity13 < 0.90) {
      console.log('\n✅ STANDALONE CLIP VERIFICATION PASSED SUCCESSFULLY!');
      process.exit(0);
    } else {
      console.error('\n❌ STANDALONE CLIP VERIFICATION FAILED: Similarity scores or vector dimensions mismatch.');
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ STANDALONE CLIP VERIFICATION ERROR:', error);
    process.exit(1);
  }
}

runTest();
