import React, { useState, useEffect, ChangeEvent, useCallback } from 'react';
import { useAppContext } from '../contexts/AppContext.tsx';
import { Question, AppView, QuestionType } from '../types.ts';
import { ArrowLeft, Trash2, Download, Upload, FileSpreadsheet, Image, Edit2 } from 'lucide-react';
import { MAX_XLSX_IMPORT_ERRORS_TO_SHOW, MAX_FORM_OPTIONS } from '../constants.ts';

const generateId = () => Date.now().toString(36) + Math.random().toString(36).substring(2, 9);

const QuestionBankView: React.FC = () => {
  const { state, dispatch, translate, activeProfile } = useAppContext();
  
  const questionsForCurrentProfile = activeProfile ? activeProfile.questions : [];

  const [searchTerm, setSearchTerm] = useState('');
  const [topicFilter, setTopicFilter] = useState('');
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);
  const [allVisibleSelected, setAllVisibleSelected] = useState(false);
  
  const importJsonInputRef = React.useRef<HTMLInputElement>(null);
  const importXlsxCsvInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!activeProfile && state.activeView === AppView.QUESTION_BANK) {
        dispatch({ type: 'SET_VIEW', payload: { view: AppView.MY_TESTS, activeTestProfileId: null } });
    }
  }, [activeProfile, state.activeView, dispatch]);

  const filteredQuestions = React.useMemo(() => {
    return questionsForCurrentProfile.filter(q => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        q.question.toLowerCase().includes(searchLower) ||
        (q.topic && q.topic.toLowerCase().includes(searchLower)) ||
        q.options.some(opt => opt.text.toLowerCase().includes(searchLower));
      const matchesTopic = !topicFilter || q.topic === topicFilter;
      return matchesSearch && matchesTopic;
    }).sort((a,b) => a.question.localeCompare(b.question));
  }, [questionsForCurrentProfile, searchTerm, topicFilter]);

  useEffect(() => {
    setSelectedQuestionIds([]);
    setAllVisibleSelected(false);
  }, [filteredQuestions]);

  useEffect(() => {
    if (filteredQuestions.length > 0 && selectedQuestionIds.length > 0) {
        const allCurrentlyVisibleAreSelected = filteredQuestions.every(q => selectedQuestionIds.includes(q.id));
        setAllVisibleSelected(allCurrentlyVisibleAreSelected && selectedQuestionIds.length === filteredQuestions.length);
    } else {
        setAllVisibleSelected(false);
    }
  }, [filteredQuestions, selectedQuestionIds]);


  const handleSelectQuestion = (id: string, checked: boolean) => {
    setSelectedQuestionIds(prev => 
      checked ? [...prev, id] : prev.filter(qid => qid !== id)
    );
  };

  const handleSelectAllVisible = (checked: boolean) => {
    setAllVisibleSelected(checked);
    setSelectedQuestionIds(checked ? filteredQuestions.map(q => q.id) : []);
  };

  const handleDeleteSelected = () => {
    if (!activeProfile) return;
    if (selectedQuestionIds.length === 0) {
      dispatch({type: 'OPEN_MESSAGE_MODAL', payload: { titleKey: 'modalNotificationTitle', textKey: 'msgNoItemsSelected' }});
      return;
    }
    dispatch({type: 'OPEN_CONFIRM_MODAL', payload: { 
      titleKey: 'msgBulkDeleteConfirm', 
      textKey: 'msgBulkDeleteConfirmDetail', 
      textReplacements: { count: String(selectedQuestionIds.length) },
      onConfirm: () => {
        dispatch({ type: 'DELETE_BULK_QUESTIONS_FROM_PROFILE', payload: {profileId: activeProfile.id, questionIds: selectedQuestionIds }});
        setSelectedQuestionIds([]); 
        dispatch({type: 'OPEN_MESSAGE_MODAL', payload: { titleKey: 'msgDeletedSuccess', textKey: 'msgDeletedSuccessDetail' }});
      }
    }});
  };

  const handleExportJson = () => {
    if (!activeProfile) return;
    if (activeProfile.questions.length === 0) {
      dispatch({type: 'OPEN_MESSAGE_MODAL', payload: { titleKey: 'msgNoDataToExport', textKey: 'msgNoDataToExportDetail', textReplacements: { name: activeProfile.name } }});
      return;
    }
    const dataStr = JSON.stringify(activeProfile.questions, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `macies_lv_questions_${activeProfile.name.replace(/\s/g, '_')}_${new Date().toISOString().slice(0,10)}.json`;
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    linkElement.remove();
    dispatch({type: 'OPEN_MESSAGE_MODAL', payload: { titleKey: 'msgExported', textKey: 'msgExportedDetail', textReplacements: {filename: exportFileDefaultName, testName: activeProfile.name} }});
  };

  const handleImportJson = (event: ChangeEvent<HTMLInputElement>) => {
    if (!activeProfile) return;
    const file = event.target.files?.[0];
    if (!file) return;

    dispatch({type: 'OPEN_CONFIRM_MODAL', payload: {
      titleKey: 'msgImportConfirm',
      textKey: 'msgImportConfirmDetail',
      textReplacements: { filename: file.name, testName: activeProfile.name },
      onConfirm: () => {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            let importedData = JSON.parse(e.target?.result as string);
            if (Array.isArray(importedData)) {
              const allValid = importedData.every(q => 
                q && q.id && q.question && Array.isArray(q.options) && 
                q.hasOwnProperty('correctOptionText') && q.hasOwnProperty('type') &&
                Object.values(QuestionType).includes(q.type) &&
                q.options.every((opt: any) => opt && typeof opt.text === 'string' && (opt.imageURL === null || typeof opt.imageURL === 'string'))
              );
              if (allValid) {
                dispatch({ type: 'SET_QUESTIONS_FOR_PROFILE', payload: {profileId: activeProfile.id, questions: importedData }});
                dispatch({type: 'OPEN_MESSAGE_MODAL', payload: { titleKey: 'msgImportedSuccess', textKey: 'msgImportedSuccessDetail', textReplacements: {testName: activeProfile.name} }});
              } else {
                dispatch({type: 'OPEN_MESSAGE_MODAL', payload: { titleKey: 'msgImportError', textKey: 'msgImportErrorInvalidFormat' }});
              }
            } else {
              dispatch({type: 'OPEN_MESSAGE_MODAL', payload: { titleKey: 'msgImportError', textKey: 'msgImportErrorInvalidFormat' }});
            }
          } catch (err: any) {
            dispatch({type: 'OPEN_MESSAGE_MODAL', payload: { titleKey: 'msgImportError', textKey: 'msgImportErrorReadFile', textReplacements: {errorMessage: err.message} }});
          } finally {
            if(importJsonInputRef.current) importJsonInputRef.current.value = "";
          }
        };
        reader.readAsText(file);
      },
      onCancel: () => { 
          if(importJsonInputRef.current) importJsonInputRef.current.value = "";
      }
    } as any});
  };
  
  const processAndImportMappedData = useCallback((
    userMapping: Record<string, string>,
    sheetDataForImport: string[][] | null,
    fileNameForImport: string | null 
  ) => {
    if (!sheetDataForImport || !fileNameForImport || !activeProfile) {
        dispatch({type: 'OPEN_MESSAGE_MODAL', payload: {titleKey: 'msgError', textKey: 'msgImportErrorReadingFile'}});
        return;
    }
    const { APP_FIELDS_FOR_MAPPING } = require('../constants.ts'); // Or wherever it's defined
    const sheetHeaders = sheetDataForImport[0];
    const dataRows = sheetDataForImport.slice(1);
    const importedQuestions: Question[] = [];
    const errorMessagesList: string[] = [];

    let questionTextMapped = false;
    APP_FIELDS_FOR_MAPPING.forEach((appField: any) => {
        if (appField.key === 'question' && userMapping[appField.key]) {
            questionTextMapped = true;
        }
    });

    if (!questionTextMapped && APP_FIELDS_FOR_MAPPING.find((f: any) => f.key === 'question')?.required) {
        dispatch({type: 'OPEN_MESSAGE_MODAL', payload: {titleKey: 'msgValidationError', textKey: 'msgXlsxImportErrorMapping'}});
        return;
    }

    dataRows.forEach((rowArray, rowIndex) => {
        const rowNumForMsg = rowIndex + 2; 
        try {
            const questionObj: Partial<Question> & { id: string } = { id: generateId() };
            const getRowValue = (appFieldKey: string): string => {
                const sheetHeaderName = userMapping[appFieldKey];
                if (!sheetHeaderName) return "";
                const headerIndex = sheetHeaders.indexOf(sheetHeaderName);
                return headerIndex !== -1 && rowArray[headerIndex] !== undefined ? String(rowArray[headerIndex]).trim() : "";
            };

            questionObj.question = getRowValue('question');
            if (!questionObj.question) {
                errorMessagesList.push(`${translate('msgXlsxImportRowErrorPrefix', { rowNum: rowNumForMsg })}: ${translate('msgErrorQuestionTextMissing')}`);
                return; 
            }

            const typeValue = getRowValue('type').toLowerCase();
            if (typeValue === 'true-false' || typeValue === 'tf') questionObj.type = QuestionType.TRUE_FALSE;
            else if (typeValue === 'fill-in-the-blank' || typeValue === 'fib' || typeValue === "fill" || typeValue === "blank") questionObj.type = QuestionType.FILL_IN_THE_BLANK;
            else questionObj.type = QuestionType.MULTIPLE_CHOICE; 

            questionObj.topic = getRowValue('topic');
            questionObj.correctOptionText = getRowValue('correctOptionText');
            questionObj.options = [];
            questionObj.questionImageURL = null; 

            for (let i = 1; i <= MAX_FORM_OPTIONS; i++) {
                const optionText = getRowValue(`option${i}`);
                if (optionText) {
                    questionObj.options.push({ text: optionText, imageURL: null });
                }
            }
            
            if (questionObj.type === QuestionType.MULTIPLE_CHOICE) {
                if (questionObj.options.length < 2) { errorMessagesList.push(`${translate('msgXlsxImportRowErrorPrefix', {rowNum: rowNumForMsg})}: ${translate('msgErrorMcqNeedsMinOptions', {minCount: 2, foundCount: questionObj.options.length})}`); return; }
                if (!questionObj.correctOptionText) { errorMessagesList.push(`${translate('msgXlsxImportRowErrorPrefix', {rowNum: rowNumForMsg})}: ${translate('msgErrorCorrectAnswerMissingMcq')}`); return; }
                if (!questionObj.options.map(opt => opt.text).includes(questionObj.correctOptionText)) { errorMessagesList.push(`${translate('msgXlsxImportRowErrorPrefix', {rowNum: rowNumForMsg})}: ${translate('msgErrorCorrectAnswerMismatchMcq', {correctAnswer: questionObj.correctOptionText, optionList: questionObj.options.map(o=>o.text).join('; ')})}`); return; }
            } else if (questionObj.type === QuestionType.TRUE_FALSE) {
                const cotLower = questionObj.correctOptionText.toLowerCase();
                const trueText = translate('optionTrue'); 
                const falseText = translate('optionFalse');
                if (cotLower === 'true' || cotLower === trueText.toLowerCase()) questionObj.correctOptionText = trueText;
                else if (cotLower === 'false' || cotLower === falseText.toLowerCase()) questionObj.correctOptionText = falseText;
                else { errorMessagesList.push(`${translate('msgXlsxImportRowErrorPrefix', {rowNum: rowNumForMsg})}: ${translate('msgErrorInvalidCorrectAnswerTf', {trueText, falseText, providedAnswer: questionObj.correctOptionText})}`); return; }
                questionObj.options = [{text: trueText, imageURL: null}, {text: falseText, imageURL: null}];
            } else if (questionObj.type === QuestionType.FILL_IN_THE_BLANK) {
                if (!questionObj.correctOptionText) { errorMessagesList.push(`${translate('msgXlsxImportRowErrorPrefix', {rowNum: rowNumForMsg})}: ${translate('msgErrorCorrectAnswerMissingFib')}`); return; }
                questionObj.options = [];
            }
            importedQuestions.push(questionObj as Question);
        } catch (error: any) {
            errorMessagesList.push(`${translate('msgXlsxImportRowErrorPrefix', {rowNum: rowNumForMsg})}: ${translate('msgErrorUnexpectedRowProcessing', {errorMessage: error.message})}`);
        }
    });

    if (errorMessagesList.length > 0) {
        const errorListString = errorMessagesList.slice(0, MAX_XLSX_IMPORT_ERRORS_TO_SHOW).join('\n');
        const moreErrorsCount = errorMessagesList.length - MAX_XLSX_IMPORT_ERRORS_TO_SHOW;
        const finalErrorString = errorListString + (moreErrorsCount > 0 ? `\n... (${moreErrorsCount} ${translate('msgErrorMoreErrorsText', {count: moreErrorsCount})})` : '');
        dispatch({type: 'OPEN_MESSAGE_MODAL', payload: { titleKey: 'msgXlsxImportCompletedWithRowErrorsTitle', textKey: 'msgXlsxImportCompletedWithRowErrorsDetail', textReplacements: { errorCount: String(errorMessagesList.length), shownErrorCount: String(Math.min(errorMessagesList.length, MAX_XLSX_IMPORT_ERRORS_TO_SHOW)), errorListString: finalErrorString}}});
    } else if (importedQuestions.length > 0) {
        dispatch({type: 'OPEN_CONFIRM_MODAL', payload: {
            titleKey: 'msgImportXlsxCsvConfirm', 
            textKey: 'msgImportXlsxCsvConfirmDetail',
            textReplacements: { filename: fileNameForImport!, testName: activeProfile.name },
            onConfirm: () => {
                dispatch({ type: 'SET_QUESTIONS_FOR_PROFILE', payload: {profileId: activeProfile.id, questions: importedQuestions }});
                dispatch({type: 'OPEN_MESSAGE_MODAL', payload: { titleKey: 'msgXlsxImportedSuccess', textKey: 'msgXlsxImportedSuccessDetail', textReplacements: {count: String(importedQuestions.length), filename: fileNameForImport!, testName: activeProfile.name }}});
            }
        }});
    } else if (dataRows.length > 0) { 
        dispatch({type: 'OPEN_MESSAGE_MODAL', payload: {titleKey: 'modalNotificationTitle', textKey: 'msgXlsxImportNoValidQuestionsFound'}});
    } else { 
        dispatch({type: 'OPEN_MESSAGE_MODAL', payload: {titleKey: 'modalNotificationTitle', textKey: 'qBankNoQuestions', textReplacements: {name: activeProfile.name }}});
    }
  }, [activeProfile, dispatch, translate]); 


  const handleXlsxCsvFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
    if (!activeProfile) return; 
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = new Uint8Array(e.target?.result as ArrayBuffer);
            const workbook = (window as any).XLSX.read(data, { type: 'array' });

            if (!workbook.SheetNames.length) {
                dispatch({type: 'OPEN_MESSAGE_MODAL', payload: {titleKey: 'msgImportError', textKey: 'msgXlsxImportErrorNoSheet'}});
                return;
            }
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            const sheetDataArray: string[][] = (window as any).XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });

            if (!sheetDataArray.length || !sheetDataArray[0] || sheetDataArray[0].length === 0) { 
                dispatch({type: 'OPEN_MESSAGE_MODAL', payload: {titleKey: 'msgImportError', textKey: 'msgXlsxImportErrorNoHeaders'}});
                return;
            }
            dispatch({ 
                type: 'OPEN_XLSX_MAPPING_MODAL', 
                payload: { 
                    sheetData: sheetDataArray, 
                    fileName: file.name,
                    onConfirm: (mapping) => processAndImportMappedData(mapping, sheetDataArray, file.name)
                } 
            });
        } catch (err: any) {
            dispatch({type: 'OPEN_MESSAGE_MODAL', payload: {titleKey: 'msgImportError', textKey: 'msgImportErrorReadFile', textReplacements: {errorMessage: err.message }}});
        } finally {
            if(importXlsxCsvInputRef.current) importXlsxCsvInputRef.current.value = "";
        }
    };
    reader.onerror = () => {
        dispatch({type: 'OPEN_MESSAGE_MODAL', payload: {titleKey: 'msgImportError', textKey: 'msgImportErrorReadingFile'}});
        if(importXlsxCsvInputRef.current) importXlsxCsvInputRef.current.value = "";
    };
    reader.readAsArrayBuffer(file);
  };

  const topics = React.useMemo(() => 
    [...new Set(questionsForCurrentProfile.map(q => q.topic).filter(Boolean) as string[])].sort((a,b) => a.localeCompare(b))
  , [questionsForCurrentProfile]);

  if (!activeProfile) {
    return <p className="text-center p-4 text-slate-600 dark:text-slate-400">{translate('msgError')}: No active test profile. Redirecting...</p>;
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-5 gap-3">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 text-center sm:text-left break-all">
          {translate('qBankTitle', { name: activeProfile.name })}
        </h2>
        <button
            onClick={() => dispatch({ type: 'SET_VIEW', payload: { view: AppView.TEST_PROFILE_HUB, activeTestProfileId: activeProfile.id }})}
            className="py-2 px-3 text-sm rounded-md bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 transition-colors flex items-center gap-1.5"
        >
            <ArrowLeft size={16}/> {translate('navBackToHub')}
        </button>
      </div>

      <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800/30 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="qbank-search-text" className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">{translate('qBankSearchByText')}</label>
            <input 
              type="text" 
              id="qbank-search-text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={translate('qBankSearchPlaceholder')}
              className="block w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm text-sm bg-white dark:bg-slate-700/50 text-slate-900 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:focus:ring-indigo-400 dark:focus:border-indigo-400"
            />
          </div>
          <div>
            <label htmlFor="qbank-filter-topic" className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">{translate('qBankFilterByTopic')}</label>
            <select 
              id="qbank-filter-topic" 
              value={topicFilter}
              onChange={(e) => setTopicFilter(e.target.value)}
              className="block w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm text-sm bg-white dark:bg-slate-700/50 text-slate-900 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:focus:ring-indigo-400 dark:focus:border-indigo-400"
            >
              <option value="">{translate('qBankAllTopics')}</option>
              {topics.map(topic => <option key={topic} value={topic}>{topic}</option>)}
            </select>
          </div>
        </div>
      </div>

      {filteredQuestions.length > 0 && (
        <div className="p-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-100 dark:bg-slate-800 flex flex-wrap items-center gap-x-4 gap-y-2">
            <label htmlFor="qbank-select-all-visible" className="flex items-center text-sm text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                <input 
                type="checkbox" 
                id="qbank-select-all-visible"
                checked={allVisibleSelected}
                onChange={(e) => handleSelectAllVisible(e.target.checked)}
                className="h-4 w-4 rounded mr-2 border-slate-400 dark:border-slate-500 text-indigo-600 dark:text-indigo-500 focus:ring-indigo-500 dark:focus:ring-indigo-400 dark:ring-offset-slate-100 dark:focus:ring-offset-slate-800"
                />
                {translate('qBankSelectAll')}
            </label>
            <button 
                onClick={handleDeleteSelected}
                disabled={selectedQuestionIds.length === 0}
                className="py-1.5 px-3 text-sm rounded-md flex items-center gap-1.5 bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 text-white disabled:opacity-60 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
                <Trash2 size={14} />
                {translate('qBankDeleteSelected')}
            </button>
            {selectedQuestionIds.length > 0 && (
                <span className="text-sm text-slate-500 dark:text-slate-400">
                {translate('qBankItemsSelected', { count: selectedQuestionIds.length })}
                </span>
            )}
        </div>
      )}

      <div className="mb-4 flex flex-wrap justify-between items-center gap-3">
        <p className="text-sm text-slate-500 dark:text-slate-400">{translate('totalQuestions')} {filteredQuestions.length}</p>
        <div className="flex flex-wrap gap-2">
            <button onClick={handleExportJson} disabled={!activeProfile || activeProfile.questions.length === 0} className="py-1.5 px-3 text-sm rounded-md flex items-center gap-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 transition-colors disabled:opacity-60 shadow-sm">
                <Download size={14} /> {translate('export')}
            </button>
            <label htmlFor="import-questions-file" className={`py-1.5 px-3 text-sm rounded-md flex items-center gap-1.5 cursor-pointer bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 transition-colors shadow-sm ${!activeProfile ? 'opacity-60 cursor-not-allowed' : ''}`}>
                <Upload size={14} /> {translate('import')}
            </label>
            <input type="file" id="import-questions-file" ref={importJsonInputRef} accept=".json" className="hidden" onChange={handleImportJson} disabled={!activeProfile} />
            
            <label htmlFor="import-xlsx-csv-file" className={`py-1.5 px-3 text-sm rounded-md flex items-center gap-1.5 cursor-pointer bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 transition-colors shadow-sm ${!activeProfile ? 'opacity-60 cursor-not-allowed' : ''}`}>
                <FileSpreadsheet size={14} /> {translate('navImportXlsxCsv')}
            </label>
            <input type="file" id="import-xlsx-csv-file" ref={importXlsxCsvInputRef} accept=".xlsx, .csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, text/csv" className="hidden" onChange={handleXlsxCsvFileSelect} disabled={!activeProfile}/>
        </div>
      </div>

      <div className="max-h-[60vh] sm:max-h-[70vh] overflow-y-auto space-y-3 pr-1 custom-scrollbar">
        {filteredQuestions.length === 0 ? (
          <p className="text-slate-500 dark:text-slate-400 text-center p-6 text-lg">{translate('qBankNoQuestions', { name: activeProfile.name })}</p>
        ) : (
          filteredQuestions.map(q => (
            <div key={q.id} className="p-3.5 border border-slate-200 dark:border-slate-700 rounded-lg flex flex-col sm:flex-row justify-between items-start gap-3 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors shadow-sm">
              <div className="flex-shrink-0 mr-2 mt-1 sm:mt-0 self-center sm:self-start">
                <input 
                  type="checkbox" 
                  id={`qbank-checkbox-${q.id}`}
                  checked={selectedQuestionIds.includes(q.id)}
                  onChange={(e) => handleSelectQuestion(q.id, e.target.checked)}
                  className="h-4.5 w-4.5 rounded border-slate-400 dark:border-slate-500 text-indigo-600 dark:text-indigo-500 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 dark:ring-offset-white dark:focus:ring-offset-slate-800"
                  aria-labelledby={`qbank-item-label-${q.id}`}
                />
              </div>
              <div className="flex-grow" id={`qbank-item-label-${q.id}`}>
                {q.topic && <span className="text-xs bg-indigo-100 dark:bg-indigo-900/70 text-indigo-700 dark:text-indigo-300 px-2.5 py-0.5 rounded-full mb-1.5 inline-block font-medium">{q.topic}</span>}
                <p className="text-sm font-medium text-slate-800 dark:text-slate-100 leading-relaxed">{q.question}</p>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 space-x-3">
                  <span className="mr-2">{translate('qBankTypeLabel')} <span className="font-semibold">{translate(`qType${q.type.split('-').map(s=>s.charAt(0).toUpperCase() + s.slice(1)).join('')}` as any)}</span></span>
                  {q.type !== QuestionType.FILL_IN_THE_BLANK && <span>{translate('qBankAnswersCount')} <span className="font-semibold">{q.options.length}</span></span>}
                  {q.questionImageURL && <span className="inline-flex items-center"><Image size={14} className="text-green-500 dark:text-green-400 mr-0.5" /> {translate('qBankQuestionImageIndicator')}</span>}
                  {(q.type === QuestionType.MULTIPLE_CHOICE && q.options.some(opt => opt.imageURL)) && <span className="inline-flex items-center"><Image size={14} className="text-blue-500 dark:text-blue-400 mr-0.5" /> {translate('qBankOptionImageIndicator')}</span>}
                </div>
                <p className="text-xs text-green-600 dark:text-green-400 mt-1 font-medium">{translate('qBankCorrectIs')} {q.correctOptionText || translate('qBankNotSpecified')}</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{translate('qBankIdIs')} {q.id.substring(0,8)}...</p>
              </div>
              <div className="flex gap-2 mt-2 sm:mt-0 flex-shrink-0 self-start sm:self-center">
                <button 
                  onClick={() => {
                    dispatch({ type: 'SET_VIEW', payload: { view: AppView.CREATE_EDIT_QUESTION, editingId: q.id, activeTestProfileId: activeProfile.id } });
                  }}
                  className="py-1.5 px-2.5 text-xs rounded-md flex items-center gap-1 bg-slate-200 hover:bg-slate-300 dark:bg-slate-600 dark:hover:bg-slate-500 text-slate-700 dark:text-slate-200 transition-colors"
                  aria-label={`${translate('qBankEditBtn')} ${q.question.substring(0,30)}`}
                >
                  <Edit2 size={14} /> {translate('qBankEditBtn')}
                </button>
                <button 
                  onClick={() => dispatch({type: 'OPEN_CONFIRM_MODAL', payload: { 
                    titleKey: 'msgDeleteConfirm', 
                    textKey: 'msgDeleteConfirmDetail',
                    textReplacements: {questionText: q.question.substring(0,50)},
                    onConfirm: () => {
                      if (activeProfile) {
                        dispatch({ type: 'DELETE_QUESTION_FROM_PROFILE', payload: {profileId: activeProfile.id, questionId: q.id }});
                        dispatch({type: 'OPEN_MESSAGE_MODAL', payload: { titleKey: 'msgDeletedSuccess', textKey: 'msgDeletedSuccessDetail' }});
                      }
                    }
                  }})}
                  className="py-1.5 px-2.5 text-xs rounded-md flex items-center gap-1 bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 text-white transition-colors"
                  aria-label={`${translate('qBankDeleteBtn')} ${q.question.substring(0,30)}`}
                >
                  <Trash2 size={14} /> {translate('qBankDeleteBtn')}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default QuestionBankView;