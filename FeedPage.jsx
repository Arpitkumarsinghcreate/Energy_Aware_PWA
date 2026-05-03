import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Bookmark, BookmarkCheck, Search, Filter, Loader2 } from 'lucide-react';

const CATEGORIES = ['All', 'Tech', 'Business', 'AI'];

const FeedPage = () => {
  const [content, setContent] = useState([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState('All');
  const [bookmarks, setBookmarks] = useState(
    JSON.parse(localStorage.getItem('bookmarks') || '[]')
  );

  const fetchContent = useCallback(async (reset = false) => {
    setLoading(true);
    try {
      const currentPage = reset ? 0 : page;
      const response = await axios.get(`http://localhost:8080/api/content`, {
        params: {
          page: currentPage,
          category: category === 'All' ? undefined : category
        }
      });
      
      if (reset) {
        setContent(response.data);
      } else {
        setContent(prev => [...prev, ...response.data]);
      }
      setPage(currentPage + 1);
    } catch (error) {
      console.error('Error fetching content:', error);
    } finally {
      setLoading(false);
    }
  }, [page, category]);

  useEffect(() => {
    fetchContent(true);
  }, [category]);

  const toggleBookmark = (id) => {
    const newBookmarks = bookmarks.includes(id)
      ? bookmarks.filter(b => b !== id)
      : [...bookmarks, id];
    setBookmarks(newBookmarks);
    localStorage.setItem('bookmarks', JSON.stringify(newBookmarks));
  };

  const handleScroll = (e) => {
    const bottom = Math.abs(e.target.scrollHeight - e.target.scrollTop - e.target.clientHeight) < 1;
    if (bottom && !loading) {
      fetchContent();
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold">Content Feed</h2>
          <p className="text-dark-muted">Personalized updates and news</p>
        </div>
        
        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                category === cat
                  ? 'bg-blue-600 text-white'
                  : 'bg-dark-card border border-dark-border text-dark-muted hover:text-dark-text'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {content.map((item, index) => (
          <div key={`${item.id}-${index}`} className="card group hover:border-blue-500/50 transition-all duration-300">
            <div className="relative h-48 mb-4 overflow-hidden rounded-lg bg-dark-border">
              <div className={`w-full h-full flex items-center justify-center text-white font-bold text-lg ${
                item.category === 'Tech' ? 'bg-blue-600/50' :
                item.category === 'Business' ? 'bg-purple-600/50' : 'bg-green-600/50'
              }`}>
                {item.category} Article
              </div>
              <div className="absolute top-2 right-2">
                <button
                  onClick={() => toggleBookmark(item.id)}
                  className="p-2 bg-black/50 backdrop-blur-md rounded-full text-white hover:bg-blue-600 transition-colors"
                >
                  {bookmarks.includes(item.id) ? (
                    <BookmarkCheck size={18} className="text-blue-400" />
                  ) : (
                    <Bookmark size={18} />
                  )}
                </button>
              </div>
              <div className="absolute bottom-2 left-2">
                <span className="px-2 py-1 bg-blue-600 text-[10px] font-bold uppercase tracking-wider rounded">
                  {item.category}
                </span>
              </div>
            </div>
            <h3 className="text-xl font-bold mb-2 group-hover:text-blue-400 transition-colors">
              {item.title}
            </h3>
            <p className="text-dark-muted text-sm line-clamp-3 mb-4">
              {item.description}
            </p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-dark-muted">5 min read</span>
              <button className="text-blue-400 text-sm font-medium hover:underline">
                Read More →
              </button>
            </div>
          </div>
        ))}

        {loading && (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="h-48 bg-dark-border rounded-lg mb-4" />
              <div className="h-6 bg-dark-border rounded w-3/4 mb-2" />
              <div className="h-4 bg-dark-border rounded w-full mb-1" />
              <div className="h-4 bg-dark-border rounded w-full mb-4" />
              <div className="flex justify-between">
                <div className="h-4 bg-dark-border rounded w-1/4" />
                <div className="h-4 bg-dark-border rounded w-1/4" />
              </div>
            </div>
          ))
        )}
      </div>

      {!loading && (
        <div className="flex justify-center pt-8">
          <button
            onClick={() => fetchContent()}
            className="btn-secondary flex items-center gap-2"
          >
            Load More Content
          </button>
        </div>
      )}
    </div>
  );
};

export default FeedPage;
