from markdown_to_faiss import load_faiss_index
from typing import List, Dict

class KnowledgeBaseSearch:
    def __init__(self, index_path='./faiss_index'):
        self.converter = load_faiss_index(index_path)
        
        # Define quality thresholds
        self.thresholds = {
            'excellent': 0.80,
            'good': 0.65,
            'moderate': 0.45,
            'minimum': 0.25
        }
    
    def search_with_quality_filter(self, query: str, min_score=0.45, max_results=10):
        """Search with quality filtering"""
        # Get more results initially
        raw_results = self.converter.search(query, k=max_results * 2)
        
        # Filter by minimum score
        filtered_results = [
            result for result in raw_results 
            if result['similarity_score'] >= min_score
        ]
        
        # Limit to max_results
        return filtered_results[:max_results]
    
    def categorize_results(self, results: List[Dict]) -> Dict:
        """Categorize results by quality"""
        categorized = {
            'excellent': [],
            'good': [],
            'moderate': [],
            'weak': []
        }
        
        for result in results:
            score = result['similarity_score']
            if score >= self.thresholds['excellent']:
                categorized['excellent'].append(result)
            elif score >= self.thresholds['good']:
                categorized['good'].append(result)
            elif score >= self.thresholds['moderate']:
                categorized['moderate'].append(result)
            else:
                categorized['weak'].append(result)
        
        return categorized
    
    def smart_search(self, query: str, return_categories=False):
        """Intelligent search with quality assessment"""
        results = self.converter.search(query, k=10)
        
        if not results:
            return {"message": "No results found", "results": []}
        
        # Get best score for reference
        best_score = max(result['similarity_score'] for result in results)
        
        # Determine search quality
        if best_score >= 0.8:
            quality = "excellent"
            message = "Found highly relevant matches"
        elif best_score >= 0.65:
            quality = "good"
            message = "Found good matches"
        elif best_score >= 0.45:
            quality = "moderate"
            message = "Found some relevant content"
        else:
            quality = "poor"
            message = "No strong matches found, showing best available"
        
        # Filter based on adaptive threshold
        if best_score >= 0.65:
            # If we have good matches, be more selective
            filtered_results = [r for r in results if r['similarity_score'] >= 0.45]
        else:
            # If no good matches, be more permissive
            filtered_results = [r for r in results if r['similarity_score'] >= 0.25]
        
        response = {
            "query": query,
            "quality": quality,
            "message": message,
            "best_score": best_score,
            "total_results": len(filtered_results),
            "results": filtered_results[:5]  # Return top 5
        }
        
        if return_categories:
            response["categories"] = self.categorize_results(results)
        
        return response
    
    def explain_scores(self, results: List[Dict]):
        """Explain what the scores mean"""
        print("📊 Score Interpretation:")
        print("  0.80-1.00: Excellent match (highly relevant)")
        print("  0.65-0.80: Good match (relevant)")
        print("  0.45-0.65: Moderate match (somewhat relevant)")
        print("  0.25-0.45: Weak match (loosely related)")
        print("  0.00-0.25: Poor match (barely related)")
        print()
        
        for i, result in enumerate(results, 1):
            score = result['similarity_score']
            
            if score >= 0.80:
                quality = "🟢 Excellent"
            elif score >= 0.65:
                quality = "🟡 Good"
            elif score >= 0.45:
                quality = "🟠 Moderate"
            elif score >= 0.25:
                quality = "🔴 Weak"
            else:
                quality = "⚫ Poor"
            
            print(f"{i}. {quality} (Score: {score:.3f})")
            print(f"   File: {result['filename']}")
            print(f"   Text: {result['text'][:100]}...")
            print()

# Example usage and testing
if __name__ == "__main__":
    # Initialize search
    kb_search = KnowledgeBaseSearch()
    
    # Test queries with different expected score ranges
    test_queries = [
        "What is blockchain technology?",  # Should get high scores
        "Smart contract development",      # Should get good scores
        "DeFi yield farming strategies",   # Moderate scores (specific)
        "How to cook pasta",              # Should get low scores (unrelated)
    ]
    
    for query in test_queries:
        print(f"\n🔍 Testing: '{query}'")
        print("=" * 60)
        
        # Smart search
        response = kb_search.smart_search(query)
        print(f"Quality: {response['quality'].upper()}")
        print(f"Message: {response['message']}")
        print(f"Best Score: {response['best_score']:.3f}")
        print(f"Results: {response['total_results']}")
        
        # Show top results with explanations
        if response['results']:
            print("\nTop Results:")
            kb_search.explain_scores(response['results'][:3])
        
        print("-" * 60)

# Benchmark function to test your specific content
def benchmark_your_content():
    """Test with your specific web3/AI content"""
    kb_search = KnowledgeBaseSearch()
    
    # Web3 + AI/ML specific queries
    web3_queries = [
        "blockchain consensus mechanisms",
        "smart contract security",
        "decentralized finance protocols",
        "NFT metadata standards",
        "machine learning in crypto",
        "AI-powered trading algorithms",
        "neural networks for prediction",
        "deep learning applications"
    ]
    
    print("🧪 Benchmarking Web3 + AI/ML Content")
    print("=" * 50)
    
    score_distribution = {'excellent': 0, 'good': 0, 'moderate': 0, 'weak': 0}
    
    for query in web3_queries:
        response = kb_search.smart_search(query)
        score_distribution[response['quality']] += 1
        
        print(f"Query: {query}")
        print(f"  Quality: {response['quality']} (Best: {response['best_score']:.3f})")
        
        if response['results']:
            print(f"  Top match: {response['results'][0]['filename']}")
        print()
    
    print("📈 Score Distribution:")
    for quality, count in score_distribution.items():
        percentage = (count / len(web3_queries)) * 100
        print(f"  {quality.capitalize()}: {count}/{len(web3_queries)} ({percentage:.1f}%)")

if __name__ == "__main__":
    benchmark_your_content()