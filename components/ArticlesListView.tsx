import React, { useState, useMemo } from 'react';
import { useAppContext } from '../contexts/AppContext.tsx';
import { AppView, Article, ArticleContentType } from '../types.ts';
// CHANGED: Removed old Icon import
// import Icon from './Icon.tsx';

// CHANGED: Added imports for specific icons from lucide-react
import { ArrowLeft, BookOpen } from 'lucide-react';

const ArticlesListView: React.FC = () => {
  const { state, dispatch, translate } = useAppContext();
  const { articles, articleProgress } = state;
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  const categories = useMemo(() => {
    const allCats = articles.map(a => a.category).filter(Boolean) as string[];
    return [...new Set(allCats)].sort((a, b) => a.localeCompare(b));
  }, [articles]);

  const filteredArticles = useMemo(() => {
    return articles
      .filter(article => !selectedCategory || article.category === selectedCategory)
      .sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [articles, selectedCategory]);

  const handleReadArticle = (articleId: string) => {
    dispatch({ type: 'SET_VIEW', payload: { view: AppView.ARTICLE_VIEW, activeArticleId: articleId } });
  };

  const getReadStatus = (articleId: string): string => {
    const progress = articleProgress.find(p => p.articleId === articleId);
    return progress?.isRead ? translate('statusRead') : translate('statusUnread');
  };
  
  const inputBaseClasses = "block w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm text-sm bg-white dark:bg-slate-700/50 text-slate-900 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:focus:ring-indigo-400 dark:focus:border-indigo-400";


  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-3">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">
          {translate('articlesListTitle')}
        </h1>
        <button
          onClick={() => dispatch({ type: 'SET_VIEW', payload: { view: AppView.HOME } })}
          className="py-2 px-3 text-sm rounded-md bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 transition-colors flex items-center gap-1.5"
        >
          {/* CHANGED: Replaced <Icon> with Lucide component */}
          <ArrowLeft size={16} /> {translate('navHome')}
        </button>
      </div>

      {categories.length > 0 && (
        <div className="mb-6">
          <label htmlFor="article-category-filter" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            {translate('articleFilterByCategory')}
          </label>
          <select
            id="article-category-filter"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className={inputBaseClasses}
          >
            <option value="">{translate('articleAllCategories')}</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      )}

      {filteredArticles.length === 0 ? (
        <p className="text-center text-slate-500 dark:text-slate-400 py-10 text-lg">{translate('articleNoArticles')}</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredArticles.map((article: Article) => {
            let excerptText = '';
            const firstParagraphBlock = article.content.find(c => c.type === ArticleContentType.PARAGRAPH);
            if (firstParagraphBlock && firstParagraphBlock.type === ArticleContentType.PARAGRAPH) {
                 const plainText = firstParagraphBlock.text.replace(/<[^>]*>?/gm, ''); // Strip HTML
                 excerptText = plainText.substring(0, 150) + (plainText.length > 150 ? '...' : '');
            }
            
            const displayExcerpt = article.excerpt || excerptText || translate('articleNoExcerptFallback');

            return (
              <div 
                  key={article.id} 
                  className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-lg flex flex-col justify-between hover:shadow-xl transition-shadow duration-300 cursor-pointer focus-within:ring-2 focus-within:ring-indigo-500 dark:focus-within:ring-indigo-400 focus-within:ring-offset-2 dark:focus-within:ring-offset-slate-900"
                  onClick={() => handleReadArticle(article.id)}
                  onKeyPress={(e) => { if (e.key === 'Enter') handleReadArticle(article.id); }}
                  tabIndex={0}
                  role="article"
                  aria-labelledby={`article-title-${article.id}`}
              >
                <div>
                  {article.coverImage && (
                      <img src={article.coverImage} alt={article.title} className="w-full h-40 object-cover rounded-lg mb-3 shadow-sm" />
                  )}
                  <h2 id={`article-title-${article.id}`} className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-2 line-clamp-2" title={article.title}>
                    {article.title}
                  </h2>
                  {article.category && (
                    <span className="text-xs bg-rose-100 dark:bg-rose-900/70 text-rose-700 dark:text-rose-300 px-2.5 py-0.5 rounded-full mb-2 inline-block font-medium">
                      {article.category}
                    </span>
                  )}
                  <p className="text-sm text-slate-600 dark:text-slate-300 mb-2 line-clamp-3 min-h-[60px]">
                    {displayExcerpt}
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mb-1">
                    {translate('articleReadStatus', { status: getReadStatus(article.id) })}
                  </p>
                   <p className="text-xs text-slate-400 dark:text-slate-500">
                    {translate('articlePublishedOn', {date: new Date(article.createdAt).toLocaleDateString(state.generalSettings.currentLanguage)})}
                  </p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); handleReadArticle(article.id); }}
                  className="mt-4 w-full py-2 px-4 text-sm rounded-md bg-indigo-500 hover:bg-indigo-600 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-sm hover:shadow-md"
                >
                  {translate('articleRead')} 
                  {/* CHANGED: Replaced <Icon> with Lucide component */}
                  <BookOpen size={16} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ArticlesListView;