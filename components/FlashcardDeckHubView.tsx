import React, { useEffect } from 'react';
import { useAppContext } from '../contexts/AppContext.tsx';
import { AppView, Flashcard } from '../types.ts';
// CHANGED: Removed old Icon import
// import Icon from './Icon.tsx';

// CHANGED: Added imports for the required icons
import { ArrowLeft, PlayCircle, PlusCircle, Image, Edit2, Trash2 } from 'lucide-react';

const FlashcardDeckHubView: React.FC = () => {
  const { state, dispatch, translate, activeFlashcardDeck } = useAppContext();

  useEffect(() => {
    if (!activeFlashcardDeck && state.activeView === AppView.FLASHCARD_DECK_HUB) {
      dispatch({ type: 'SET_VIEW', payload: { view: AppView.FLASHCARD_DECKS_LIST } });
    }
  }, [activeFlashcardDeck, state.activeView, dispatch]);

  if (!activeFlashcardDeck) {
    return <p className="text-center p-4 text-slate-600 dark:text-slate-400">{translate('msgError')}: No active deck. Redirecting...</p>;
  }

  const handleStartStudying = () => {
    dispatch({ type: 'SET_VIEW', payload: { view: AppView.FLASHCARD_STUDY_MODE, activeFlashcardDeckId: activeFlashcardDeck.id } });
  };

  const handleAddNewCard = () => {
    dispatch({ type: 'SET_VIEW', payload: { view: AppView.FLASHCARD_CREATE_EDIT_CARD, activeFlashcardDeckId: activeFlashcardDeck.id, editingId: null } });
  };

  const handleEditCard = (cardId: string) => {
    dispatch({ type: 'SET_VIEW', payload: { view: AppView.FLASHCARD_CREATE_EDIT_CARD, activeFlashcardDeckId: activeFlashcardDeck.id, editingId: cardId } });
  };

  const handleDeleteCard = (cardId: string) => {
    dispatch({
      type: 'OPEN_CONFIRM_MODAL',
      payload: {
        titleKey: 'flashcardConfirmDeleteCardTitle',
        textKey: 'flashcardConfirmDeleteCardText',
        onConfirm: () => {
          dispatch({ type: 'DELETE_FLASHCARD_FROM_DECK', payload: { deckId: activeFlashcardDeck.id, cardId } });
          dispatch({ type: 'OPEN_MESSAGE_MODAL', payload: { titleKey: 'msgDeletedSuccess', textKey: 'flashcardCardDeleted' } });
        },
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-3">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 text-center sm:text-left break-all">
          {translate('flashcardDeckHubTitle', { name: activeFlashcardDeck.name })}
        </h1>
        <button
          onClick={() => dispatch({ type: 'SET_VIEW', payload: { view: AppView.FLASHCARD_DECKS_LIST } })}
          className="py-2 px-3 text-sm rounded-md bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 transition-colors flex items-center gap-1.5"
        >
          {/* CHANGED: Icon replaced */}
          <ArrowLeft size={16} /> {translate('navBackToDecks')}
        </button>
      </div>

      {activeFlashcardDeck.description && (
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 p-3 bg-slate-50 dark:bg-slate-800/30 rounded-md border border-slate-200 dark:border-slate-700">
          {activeFlashcardDeck.description}
        </p>
      )}

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <button
          onClick={handleStartStudying}
          disabled={activeFlashcardDeck.flashcards.length === 0}
          className="flex-1 py-2.5 px-5 rounded-md bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700 text-white font-semibold transition-colors flex items-center justify-center gap-2 shadow-sm hover:shadow-md disabled:opacity-60"
        >
          {/* CHANGED: Icon replaced */}
          <PlayCircle size={20} /> {translate('flashcardDeckStartStudying')}
        </button>
        <button
          onClick={handleAddNewCard}
          className="flex-1 py-2.5 px-5 rounded-md bg-indigo-500 hover:bg-indigo-600 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white font-semibold transition-colors flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
        >
          {/* CHANGED: Icon replaced */}
          <PlusCircle size={20} /> {translate('flashcardDeckAddCard')}
        </button>
      </div>
      
      <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200">{translate('flashcardDeckManageCards')} ({activeFlashcardDeck.flashcards.length})</h3>
      
      <div className="max-h-[50vh] overflow-y-auto space-y-3 pr-1 custom-scrollbar">
        {activeFlashcardDeck.flashcards.length === 0 ? (
          <p className="text-slate-500 dark:text-slate-400 text-center p-6 text-lg">{translate('flashcardDeckNoCards')}</p>
        ) : (
          [...activeFlashcardDeck.flashcards].sort((a,b) => a.frontText.localeCompare(b.frontText)).map((card: Flashcard) => (
            <div key={card.id} className="p-3.5 border border-slate-200 dark:border-slate-700 rounded-lg flex flex-col sm:flex-row justify-between items-start gap-3 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors shadow-sm">
              <div className="flex-grow">
                <p className="text-sm font-medium text-slate-800 dark:text-slate-100 leading-relaxed">
                  <span className="font-semibold">{translate('flashcardFront')}:</span> {card.frontText}
                  {/* CHANGED: Icon replaced */}
                  {card.frontImageURL && <Image size={14} className="text-blue-500 dark:text-blue-400 ml-1.5 inline-block" />}
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                  <span className="font-semibold">{translate('flashcardBack')}:</span> {card.backText.substring(0,100)}{card.backText.length > 100 ? '...' : ''}
                  {/* CHANGED: Icon replaced */}
                  {card.backImageURL && <Image size={14} className="text-blue-500 dark:text-blue-400 ml-1.5 inline-block" />}
                </p>
              </div>
              <div className="flex gap-2 mt-2 sm:mt-0 flex-shrink-0 self-start sm:self-center">
                <button
                  onClick={() => handleEditCard(card.id)}
                  className="py-1.5 px-2.5 text-xs rounded-md flex items-center gap-1 bg-slate-200 hover:bg-slate-300 dark:bg-slate-600 dark:hover:bg-slate-500 text-slate-700 dark:text-slate-200 transition-colors"
                  aria-label={`${translate('flashcardEditCard')} ${card.frontText.substring(0,30)}`}
                >
                  {/* CHANGED: Icon replaced */}
                  <Edit2 size={14} /> {translate('flashcardEditCard')}
                </button>
                <button
                  onClick={() => handleDeleteCard(card.id)}
                  className="py-1.5 px-2.5 text-xs rounded-md flex items-center gap-1 bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 text-white transition-colors"
                  aria-label={`${translate('flashcardDeleteCard')} ${card.frontText.substring(0,30)}`}
                >
                  {/* CHANGED: Icon replaced */}
                  <Trash2 size={14} /> {translate('flashcardDeleteCard')}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default FlashcardDeckHubView;