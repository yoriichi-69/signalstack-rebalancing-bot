# d:\intel\cryptorizz\main\signalstack-rebalancing-bot\backend\cache\data_cache.py
import redis
import json
import time

class DataCache:
    def __init__(self, host='localhost', port=6379, db=0):
        self.redis = redis.Redis(host=host, port=port, db=db)
        self.expiry = 3600  # 1 hour
    
    def set_data(self, key, data, expiry=None):
        """Store data in cache with optional expiry time"""
        if expiry is None:
            expiry = self.expiry
            
        serialized = json.dumps(data)
        self.redis.setex(key, expiry, serialized)
    
    def get_data(self, key):
        """Retrieve data from cache"""
        data = self.redis.get(key)
        if data:
            return json.loads(data)
        return None
    
    def invalidate(self, key):
        """Remove data from cache"""
        self.redis.delete(key)
    
    def get_or_compute(self, key, compute_fn, expiry=None):
        """Get from cache or compute and store"""
        data = self.get_data(key)
        if data is None:
            data = compute_fn()
            self.set_data(key, data, expiry)
        return data