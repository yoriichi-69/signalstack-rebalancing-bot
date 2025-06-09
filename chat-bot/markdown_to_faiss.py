import os
import json
import pickle
import numpy as np
from pathlib import Path
from typing import List, Dict, Tuple
import faiss
from sentence_transformers import SentenceTransformer
import re

class MarkdownToFAISS:
    def __init__(self, model_name='all-MiniLM-L6-v2', chunk_size=1000, overlap=200):
        """
        Initialize the converter
        
        Args:
            model_name: SentenceTransformer model name
            chunk_size: Size of text chunks in characters
            overlap: Overlap between chunks in characters
        """
        self.model = SentenceTransformer(model_name)
        self.chunk_size = chunk_size
        self.overlap = overlap
        self.chunks = []
        self.metadata = []
        self.embeddings = None
        self.index = None
    
    def chunk_text(self, text: str, filename: str) -> List[Dict]:
        """Split text into overlapping chunks"""
        chunks = []
        start = 0
        chunk_id = 0
        
        while start < len(text):
            end = start + self.chunk_size
            chunk_text = text[start:end]
            
            # Try to break at sentence boundaries
            if end < len(text):
                last_period = chunk_text.rfind('.')
                last_newline = chunk_text.rfind('\n')
                break_point = max(last_period, last_newline)
                if break_point > start + self.chunk_size // 2:
                    end = start + break_point + 1
                    chunk_text = text[start:end]
            
            chunks.append({
                'text': chunk_text.strip(),
                'filename': filename,
                'chunk_id': chunk_id,
                'start_pos': start,
                'end_pos': end
            })
            
            chunk_id += 1
            start = end - self.overlap
            
            if start >= len(text):
                break
                
        return chunks
    
    def extract_markdown_metadata(self, text: str) -> Dict:
        """Extract metadata from markdown frontmatter and headers"""
        metadata = {'title': '', 'headers': [], 'tags': []}
        
        # Extract frontmatter
        frontmatter_match = re.match(r'^---\n(.*?)\n---', text, re.DOTALL)
        if frontmatter_match:
            frontmatter = frontmatter_match.group(1)
            for line in frontmatter.split('\n'):
                if ':' in line:
                    key, value = line.split(':', 1)
                    metadata[key.strip()] = value.strip()
        
        # Extract headers
        headers = re.findall(r'^#+\s+(.+)$', text, re.MULTILINE)
        metadata['headers'] = headers
        
        # Extract title from first header if not in frontmatter
        if not metadata['title'] and headers:
            metadata['title'] = headers[0]
        
        return metadata
    
    def process_markdown_files(self, docs_folder: str):
        """Process all markdown files in the folder"""
        docs_path = Path(docs_folder)
        
        if not docs_path.exists():
            raise FileNotFoundError(f"Directory {docs_folder} not found")
        
        markdown_files = list(docs_path.rglob("*.md"))
        
        if not markdown_files:
            raise ValueError(f"No markdown files found in {docs_folder}")
        
        print(f"Found {len(markdown_files)} markdown files")
        
        all_chunks = []
        
        for md_file in markdown_files:
            print(f"Processing: {md_file}")
            
            try:
                with open(md_file, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                # Extract metadata
                file_metadata = self.extract_markdown_metadata(content)
                
                # Create chunks
                chunks = self.chunk_text(content, str(md_file.relative_to(docs_path)))
                
                # Add file metadata to each chunk
                for chunk in chunks:
                    chunk.update(file_metadata)
                    chunk['full_path'] = str(md_file)
                
                all_chunks.extend(chunks)
                
            except Exception as e:
                print(f"Error processing {md_file}: {e}")
                continue
        
        self.chunks = all_chunks
        self.metadata = [chunk for chunk in all_chunks]  # Store metadata separately
        print(f"Created {len(self.chunks)} chunks total")
    
    def create_embeddings(self, batch_size=32):
        """Generate embeddings for all chunks"""
        if not self.chunks:
            raise ValueError("No chunks to embed. Run process_markdown_files first.")
        
        print("Generating embeddings...")
        texts = [chunk['text'] for chunk in self.chunks]
        
        # Generate embeddings in batches
        embeddings = []
        for i in range(0, len(texts), batch_size):
            batch = texts[i:i+batch_size]
            batch_embeddings = self.model.encode(batch, show_progress_bar=True)
            embeddings.append(batch_embeddings)
        
        self.embeddings = np.vstack(embeddings).astype('float32')
        print(f"Generated embeddings shape: {self.embeddings.shape}")
    
    def build_faiss_index(self, index_type='flat'):
        """Build FAISS index from embeddings"""
        if self.embeddings is None:
            raise ValueError("No embeddings found. Run create_embeddings first.")
        
        dimension = self.embeddings.shape[1]
        
        if index_type == 'flat':
            # Exact search (slower but accurate)
            self.index = faiss.IndexFlatIP(dimension)  # Inner Product
        elif index_type == 'ivf':
            # Approximate search (faster)
            nlist = min(100, len(self.embeddings) // 10)
            quantizer = faiss.IndexFlatIP(dimension)
            self.index = faiss.IndexIVFFlat(quantizer, dimension, nlist)
            self.index.train(self.embeddings)
        else:
            raise ValueError("index_type must be 'flat' or 'ivf'")
        
        # Normalize embeddings for cosine similarity
        faiss.normalize_L2(self.embeddings)
        
        # Add embeddings to index
        self.index.add(self.embeddings)
        print(f"Built FAISS index with {self.index.ntotal} vectors")
    
    def save_index(self, output_dir='./faiss_index'):
        """Save FAISS index and metadata"""
        output_path = Path(output_dir)
        output_path.mkdir(exist_ok=True)
        
        # Save FAISS index
        faiss.write_index(self.index, str(output_path / 'faiss.index'))
        
        # Save metadata
        with open(output_path / 'metadata.json', 'w', encoding='utf-8') as f:
            json.dump(self.metadata, f, indent=2, ensure_ascii=False)
        
        # Save embeddings (optional, for debugging)
        np.save(output_path / 'embeddings.npy', self.embeddings)
        
        # Save model info
        config = {
            'model_name': self.model.get_sentence_embedding_dimension(),
            'chunk_size': self.chunk_size,
            'overlap': self.overlap,
            'total_chunks': len(self.chunks),
            'embedding_dimension': self.embeddings.shape[1]
        }
        
        with open(output_path / 'config.json', 'w') as f:
            json.dump(config, f, indent=2)
        
        print(f"Saved FAISS index to {output_path}")
    
    def search(self, query: str, k=5) -> List[Dict]:
        """Search the index"""
        if self.index is None:
            raise ValueError("Index not built. Run build_faiss_index first.")
        
        # Generate query embedding
        query_embedding = self.model.encode([query]).astype('float32')
        faiss.normalize_L2(query_embedding)
        
        # Search
        scores, indices = self.index.search(query_embedding, k)
        
        results = []
        for score, idx in zip(scores[0], indices[0]):
            if idx != -1:  # Valid result
                result = self.metadata[idx].copy()
                result['similarity_score'] = float(score)
                results.append(result)
        
        return results

def load_faiss_index(index_dir='./faiss_index', model_name='all-MiniLM-L6-v2'):
    """Load a saved FAISS index"""
    index_path = Path(index_dir)
    
    # Load components
    index = faiss.read_index(str(index_path / 'faiss.index'))
    
    with open(index_path / 'metadata.json', 'r', encoding='utf-8') as f:
        metadata = json.load(f)
    
    with open(index_path / 'config.json', 'r') as f:
        config = json.load(f)
    
    # Create converter instance
    converter = MarkdownToFAISS(model_name=model_name)
    converter.index = index
    converter.metadata = metadata
    converter.model = SentenceTransformer(model_name)
    
    return converter

# Example usage
if __name__ == "__main__":
    # Initialize converter
    converter = MarkdownToFAISS(
        model_name='all-MiniLM-L6-v2',  # Fast and good quality
        chunk_size=1000,
        overlap=200
    )
    
    # Process markdown files
    try:
        converter.process_markdown_files('./web3_docs')
        
        # Create embeddings
        converter.create_embeddings()
        
        # Build FAISS index
        converter.build_faiss_index(index_type='flat')
        
        # Save index
        converter.save_index('./web3_faiss_index')
        
        # Test search
        results = converter.search("What is blockchain?", k=3)
        
        print("\nSample search results:")
        for i, result in enumerate(results):
            print(f"\n{i+1}. Score: {result['similarity_score']:.3f}")
            print(f"   File: {result['filename']}")
            print(f"   Text: {result['text'][:200]}...")
            
    except Exception as e:
        print(f"Error: {e}")
        print("\nMake sure you have the required packages installed:")
        print("pip install faiss-cpu sentence-transformers numpy")