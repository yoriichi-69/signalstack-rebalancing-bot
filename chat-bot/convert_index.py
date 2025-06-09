from markdown_to_faiss import MarkdownToFAISS

# Initialize converter
converter = MarkdownToFAISS(
    chunk_size=1000,    # Adjust based on your content
    overlap=200         # Overlap between chunks
)

# Process your markdown files
print("Processing markdown files...")
converter.process_markdown_files('./web3_docs')

# Create embeddings
print("Creating embeddings...")
converter.create_embeddings()

# Build FAISS index
print("Building FAISS index...")
converter.build_faiss_index(index_type='flat')

# Save everything
print("Saving index...")
converter.save_index('./faiss_index')

print("Done! Your knowledge base is ready.")