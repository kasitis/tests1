

import React, { useEffect } from 'react';
import { AppProvider, useAppContext } from './contexts/AppContext.tsx';
import { AppView } from './types.ts';
import Layout from '@/components/Layout'; 
import HomeView from './components/HomeView.tsx';
import MyTestsView from './components/MyTestsView.tsx'; 
import TestProfileHubView from './components/TestProfileHubView.tsx'; 
import QuizView from './components/QuizView.tsx';
import QuestionBankView from './components/QuestionBankView.tsx';
import CreateEditQuestionView from './components/CreateEditQuestionView.tsx';
import StatsView from './components/StatsView.tsx';
import TestSettingsView from './components/SettingsView.tsx'; 
import GeneralSettingsView from './components/GeneralSettingsView.tsx'; 
import { MessageModal, ConfirmModal, XlsxCsvMappingModal } from './components/Modals.tsx';
import GamesHubView from '@/components/GamesHubView';
import WordleLvView from '@/components/WordleLvView';
import NumberCruncherView from '@/components/NumberCruncherView';
// Flashcard imports
import FlashcardDecksListView from './components/FlashcardDecksListView.tsx';
import CreateEditFlashcardDeckView from './components/CreateEditFlashcardDeckView.tsx';
import FlashcardDeckHubView from './components/FlashcardDeckHubView.tsx';
import CreateEditFlashcardView from './components/CreateEditFlashcardView.tsx';
import FlashcardStudyView from './components/FlashcardStudyView.tsx';
// Article imports
import ArticlesListView from './components/ArticlesListView.tsx';
import ArticleView from './components/ArticleView.tsx';

const AppContent: React.FC = () => {
  const { state, translate } = useAppContext();

  useEffect(() => {
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      try {
        window.lucide.createIcons();
      } catch (e) {
        console.error("Error creating Lucide icons:", e);
      }
    }
  }, [state.activeView, state.isMessageModalOpen, state.isConfirmModalOpen, state.isXlsxMappingModalOpen]);

  useEffect(() => {
      document.title = translate('appTitle') + " (React)";
  }, [translate, state.generalSettings.currentLanguage]);


  const renderView = () => {
    switch (state.activeView) {
      case AppView.HOME:
        return <HomeView />;
      case AppView.MY_TESTS: 
        return <MyTestsView />;
      case AppView.TEST_PROFILE_HUB: 
        return <TestProfileHubView />;
      case AppView.QUIZ:
        return <QuizView />;
      case AppView.QUESTION_BANK:
        return <QuestionBankView />;
      case AppView.CREATE_EDIT_QUESTION:
        return <CreateEditQuestionView />;
      case AppView.STATS:
        return <StatsView />;
      case AppView.TEST_SETTINGS:
        return <TestSettingsView />;
      case AppView.GENERAL_SETTINGS:
        return <GeneralSettingsView />;
      case AppView.GAMES_HUB: 
        return <GamesHubView />;
      case AppView.WORDLE_LV: 
        return <WordleLvView />;
      case AppView.NUMBER_CRUNCHER: 
        return <NumberCruncherView />;
      // Flashcard Views
      case AppView.FLASHCARD_DECKS_LIST:
        return <FlashcardDecksListView />;
      case AppView.FLASHCARD_CREATE_EDIT_DECK:
        return <CreateEditFlashcardDeckView />;
      case AppView.FLASHCARD_DECK_HUB:
        return <FlashcardDeckHubView />;
      case AppView.FLASHCARD_CREATE_EDIT_CARD:
        return <CreateEditFlashcardView />;
      case AppView.FLASHCARD_STUDY_MODE:
        return <FlashcardStudyView />;
      // Article Views
      case AppView.ARTICLES_LIST:
        return <ArticlesListView />;
      case AppView.ARTICLE_VIEW:
        return <ArticleView />;
      default:
        return <HomeView />;
    }
  };

  return (
    <>
      <Layout>
        {renderView()}
      </Layout>
      <MessageModal />
      <ConfirmModal />
      <XlsxCsvMappingModal />
    </>
  );
};

const App: React.FC = () => {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
};

export default App;