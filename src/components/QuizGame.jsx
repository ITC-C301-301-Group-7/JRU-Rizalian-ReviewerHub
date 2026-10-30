import React, { useCallback, useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';
import {
  ArrowRight, Camera, Check, Clock, FileUp, Flame, Gamepad2, ImageUp, Lightbulb, LoaderCircle, QrCode, RotateCcw, Trophy, X,
} from 'lucide-react';
import QrScannerModal from './QrScannerModal';
import { apiRequest } from '../utils/teacherApi';
import { fetchBlob } from '../utils/Authedfile';
import { ACCEPTED_EXTENSIONS, extractText } from '../utils/documentText';
import { parseResourceId } from '../utils/resourceLinks';
import { QUESTION_TYPES, TYPE_IDS, analyzeText, buildQuiz, isAnswerCorrect } from '../utils/quizGenerator';

const COUNT_CHOICES = [5, 10, 15, 20];
const CHOICE_SECONDS = 20; // multiple choice and true / false
const TYPED_SECONDS = 35; // identification and fill in the blank
const LETTERS = ['A', 'B', 'C', 'D'];

const TYPE_HELP = {
  mcq: 'Pick the right answer from four choices.',
  tf: 'Decide if a statement from the file is true.',
  identification: 'Type the term that matches a definition.',
  blank: 'Type the missing word in a sentence.',
};

const bestKey = (key) => `reviewerhub_quiz_best:${key}`;

const readBest = (key) => {
  try {
    return Number(localStorage.getItem(bestKey(key))) || 0;
  } catch {
    return 0;
  }
};

const writeBest = (key, score) => {
  try {
    localStorage.setItem(bestKey(key), String(score));
  } catch {
    /* storage unavailable: the best score just is not remembered */
  }
};

const gradeFor = (accuracy) => {
  if (accuracy >= 90) return 'Quiz Master';
  if (accuracy >= 70) return 'Sharp Mind';
  if (accuracy >= 50) return 'Getting There';
  return 'Keep Practicing';
};

const secondsFor = (question) => (question.type === 'mcq' || question.type === 'tf' ? CHOICE_SECONDS : TYPED_SECONDS);

const cardClass = 'rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6';
const compactCardClass = 'rounded-2xl border border-slate-200 bg-white p-4 shadow-sm';
const primaryButton =
  'inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#002147] px-4 py-2.5 text-xs font-bold text-amber-300 hover:bg-blue-900 disabled:cursor-not-allowed disabled:opacity-50';
const secondaryButton =
  'inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50';

function ProgressBar({ label, fraction }) {
  const pct = Math.round(Math.max(0, Math.min(1, fraction)) * 100);

  return (
    <div role="status" aria-live="polite" className="space-y-1">
      <div className="flex justify-between text-[11px] font-semibold text-slate-600">
        <span>{label}</span>
        <span>{pct}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-200">
        <div className="h-full rounded-full bg-[#002147] transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

/* ---------------- Screen 1: pick a reviewer ---------------- */

function StartScreen({ error, onScan, onQrPicture, onFile }) {
  const qrInput = useRef(null);
  const fileInput = useRef(null);

  const options = [
    { id: 'scan', icon: Camera, title: 'Scan QR code', text: 'Point your camera at the QR code of a reviewer.', onClick: onScan },
    { id: 'picture', icon: ImageUp, title: 'Upload QR picture', text: 'Use a screenshot or photo of the QR code.', onClick: () => qrInput.current?.click() },
    { id: 'file', icon: FileUp, title: 'Upload the file', text: 'PDF, Word, PowerPoint, or an image of notes.', onClick: () => fileInput.current?.click() },
  ];

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-gradient-to-br from-[#002147] to-blue-900 p-6 text-white shadow-sm sm:p-8">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-400 text-[#002147]"><Gamepad2 className="h-6 w-6" /></span>
          <div>
            <h1 className="text-lg font-black">Quiz Game</h1>
            <p className="text-xs text-blue-100">Turn any reviewer into a game and test what you remember.</p>
          </div>
        </div>
        <p className="mt-4 max-w-2xl text-xs leading-relaxed text-blue-100">
          Scan or upload the QR code of a reviewer file. The questions are made from the text inside that file, so every
          reviewer gives you a different game.
        </p>
      </div>

      {error && (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">{error}</div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {options.map(({ id, icon: Icon, title, text, onClick }) => (
          <button key={id} type="button" onClick={onClick} className={`${cardClass} cursor-pointer text-left transition hover:border-[#002147] hover:shadow-md`}>
            <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-[#002147]"><Icon className="h-5 w-5" /></span>
            <span className="block text-sm font-black text-slate-900">{title}</span>
            <span className="mt-1 block text-[11px] text-slate-500">{text}</span>
          </button>
        ))}
      </div>

      <input
        ref={qrInput}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = '';
          if (file) onQrPicture(file);
        }}
      />
      <input
        ref={fileInput}
        type="file"
        accept={ACCEPTED_EXTENSIONS.map((ext) => `.${ext}`).join(',')}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = '';
          if (file) onFile(file);
        }}
      />

      <div className={cardClass}>
        <h2 className="text-xs font-black text-slate-900">Question types in the game</h2>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {TYPE_IDS.map((type) => (
            <div key={type} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs font-bold text-[#002147]">{QUESTION_TYPES[type]}</p>
              <p className="mt-0.5 text-[11px] text-slate-500">{TYPE_HELP[type]}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-[11px] leading-relaxed text-slate-500">
          Questions are built on your device from the file’s text, and nothing is sent to an AI service. They are made
          automatically, so a question may sometimes be awkward. Each answer shows the sentence it came from, so you can check it against your notes.
        </p>
      </div>
    </div>
  );
}

/* ---------------- Screen 2: choose the game settings ---------------- */

function SetupScreen({ source, available, maxQuestions, settings, onChange, onStart, onBack, error }) {
  const countOptions = COUNT_CHOICES.filter((n) => n <= maxQuestions);
  const choices = countOptions.length ? countOptions : [maxQuestions];

  const toggleType = (type) => {
    const has = settings.types.includes(type);
    if (has && settings.types.length === 1) return; // keep at least one type
    onChange({ types: has ? settings.types.filter((t) => t !== type) : [...settings.types, type] });
  };

  return (
    <div className={`${cardClass} space-y-5`}>
      <div>
        <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Ready to play</p>
        <h2 className="mt-1 text-base font-black text-slate-900">{source.title}</h2>
        {source.subtitle && <p className="text-[11px] text-slate-500">{source.subtitle}</p>}
        <p className="mt-2 text-xs text-slate-600">We can make up to <strong>{maxQuestions}</strong> questions from this file.</p>
      </div>

      <div>
        <h3 className="mb-2 text-xs font-black text-slate-900">How many questions?</h3>
        <div className="flex flex-wrap gap-2">
          {choices.map((n) => (
            <button
              key={n}
              type="button"
              aria-pressed={settings.count === n}
              onClick={() => onChange({ count: n })}
              className={`cursor-pointer rounded-xl border px-4 py-2 text-xs font-bold ${settings.count === n ? 'border-[#002147] bg-[#002147] text-white' : 'border-slate-300 text-slate-700 hover:bg-slate-50'}`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-2 text-xs font-black text-slate-900">Question types</h3>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {TYPE_IDS.map((type) => {
            const count = available[type] || 0;
            const checked = settings.types.includes(type) && count > 0;

            return (
              <label key={type} className={`flex items-start gap-2 rounded-xl border p-3 text-xs ${count === 0 ? 'cursor-not-allowed border-slate-200 bg-slate-50 opacity-60' : 'cursor-pointer border-slate-200 hover:bg-slate-50'}`}>
                <input type="checkbox" checked={checked} disabled={count === 0} onChange={() => toggleType(type)} className="mt-0.5 h-4 w-4 accent-[#002147]" />
                <span>
                  <span className="block font-bold text-slate-900">{QUESTION_TYPES[type]}</span>
                  <span className="block text-[11px] text-slate-500">{count === 0 ? 'Not enough material in this file' : `${count} possible`}</span>
                </span>
              </label>
            );
          })}
        </div>
      </div>

      <label className="flex cursor-pointer items-start gap-2 rounded-xl border border-slate-200 p-3 text-xs hover:bg-slate-50">
        <input type="checkbox" checked={settings.timed} onChange={(e) => onChange({ timed: e.target.checked })} className="mt-0.5 h-4 w-4 accent-[#002147]" />
        <span>
          <span className="block font-bold text-slate-900">Beat the clock</span>
          <span className="block text-[11px] text-slate-500">{CHOICE_SECONDS} seconds for choices, {TYPED_SECONDS} seconds for typed answers. Faster answers earn bonus points.</span>
        </span>
      </label>

      {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">{error}</p>}

      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={onStart} className={primaryButton}><Gamepad2 className="h-4 w-4" /> Start game</button>
        <button type="button" onClick={onBack} className={secondaryButton}>Choose another reviewer</button>
      </div>
    </div>
  );
}

/* ---------------- Screen 3: the game ---------------- */

function PlayScreen({ game, onAnswer, onNext, onHint, onQuit }) {
  const { question, index, total, score, streak, timed, timeLeft, result, hintShown } = game;
  const [typed, setTyped] = useState('');
  const limit = secondsFor(question);
  const checked = Boolean(result);

  // Keyboard shortcuts for the choice questions: 1-4 for options, T / F for true or false.
  useEffect(() => {
    if (checked || (question.type !== 'mcq' && question.type !== 'tf')) return undefined;

    const onKey = (event) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const key = event.key.toLowerCase();

      if (question.type === 'mcq' && /^[1-4]$/.test(key) && question.options[Number(key) - 1]) {
        onAnswer(question.options[Number(key) - 1]);
      } else if (question.type === 'tf' && (key === 't' || key === 'f')) {
        onAnswer(key === 't');
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [checked, question, onAnswer]);

  const optionClass = (value, large = false) => {
    const base = `flex w-full cursor-pointer items-center gap-3 rounded-xl border px-4 text-left font-semibold transition ${large ? 'justify-center py-4 text-sm' : 'py-3 text-xs'}`;
    if (!checked) return `${base} border-slate-300 bg-white text-slate-800 hover:border-[#002147] hover:bg-blue-50`;
    if (value === question.answer) return `${base} cursor-default border-emerald-500 bg-emerald-50 text-emerald-900`;
    if (value === result.response) return `${base} cursor-default border-red-400 bg-red-50 text-red-800`;
    return `${base} cursor-default border-slate-200 bg-white text-slate-400`;
  };

  const correctAnswerText = question.type === 'tf' ? (question.answer ? 'True' : 'False') : question.answer;

  return (
    <div className="space-y-4">
      <div className={`${compactCardClass} space-y-3`}>
        <div className="flex items-center justify-between gap-3 text-xs font-bold text-slate-700">
          <span>Question {index + 1} of {total}</span>
          <span className="flex items-center gap-3">
            <span className={`flex items-center gap-1 ${streak >= 2 ? 'text-orange-600' : 'text-slate-400'}`} title="Answers right in a row">
              <Flame className="h-4 w-4" /> {streak}
            </span>
            <span className="rounded-full bg-amber-100 px-3 py-1 text-[#002147]">{score} pts</span>
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-slate-200" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={index + (checked ? 1 : 0)} aria-label="Quiz progress">
          <div className="h-full rounded-full bg-[#002147] transition-all" style={{ width: `${((index + (checked ? 1 : 0)) / total) * 100}%` }} />
        </div>
        {timed && (
          <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-500">
            <Clock className="h-3.5 w-3.5" />
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200">
              <div
                className={`h-full rounded-full ${timeLeft / limit < 0.25 ? 'bg-red-500' : 'bg-emerald-500'}`}
                style={{ width: `${checked ? 0 : Math.max(0, (timeLeft / limit) * 100)}%` }}
              />
            </div>
            <span className="w-8 text-right tabular-nums">{checked ? '–' : `${Math.ceil(timeLeft)}s`}</span>
          </div>
        )}
      </div>

      <div className={`${cardClass} space-y-4`}>
        <div>
          <span className="rounded bg-[#002147] px-2 py-0.5 text-[10px] font-bold text-white">{QUESTION_TYPES[question.type]}</span>
          <p className="mt-3 text-[11px] font-bold uppercase tracking-wide text-slate-400">{question.prompt}</p>
          <p className="mt-1 text-sm font-bold leading-relaxed text-slate-900 sm:text-base">{question.body}</p>
        </div>

        {question.type === 'mcq' && (
          <div className="space-y-2">
            {question.options.map((option, i) => (
              <button key={option} type="button" disabled={checked} onClick={() => onAnswer(option)} className={optionClass(option)}>
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[11px] font-black text-slate-600">{LETTERS[i]}</span>
                <span className="flex-1">{option}</span>
                {checked && option === question.answer && <Check className="h-4 w-4 text-emerald-600" />}
                {checked && option === result.response && option !== question.answer && <X className="h-4 w-4 text-red-600" />}
              </button>
            ))}
          </div>
        )}

        {question.type === 'tf' && (
          <div className="grid grid-cols-2 gap-3">
            {[true, false].map((value) => (
              <button key={String(value)} type="button" disabled={checked} onClick={() => onAnswer(value)} className={optionClass(value, true)}>
                {value ? 'True' : 'False'}
              </button>
            ))}
          </div>
        )}

        {(question.type === 'identification' || question.type === 'blank') && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!checked && typed.trim()) onAnswer(typed.trim());
            }}
            className="space-y-3"
          >
            <input
              key={question.id}
              autoFocus
              type="text"
              value={typed}
              disabled={checked}
              onChange={(e) => setTyped(e.target.value)}
              placeholder="Type your answer"
              aria-label="Your answer"
              autoComplete="off"
              className={`w-full rounded-xl border px-4 py-3 text-sm outline-none focus:border-[#002147] ${checked ? (result.correct ? 'border-emerald-500 bg-emerald-50' : 'border-red-400 bg-red-50') : 'border-slate-300 bg-white'}`}
            />
            {!checked && (
              <div className="flex flex-wrap items-center gap-2">
                <button type="submit" disabled={!typed.trim()} className={primaryButton}>Check answer</button>
                <button type="button" onClick={onHint} disabled={hintShown} className={secondaryButton}>
                  <Lightbulb className="h-4 w-4" /> {hintShown ? 'Hint shown' : 'Show hint (−30 pts)'}
                </button>
                <button type="button" onClick={() => onAnswer('')} className="cursor-pointer px-2 py-2 text-xs font-bold text-slate-500 hover:text-slate-800">Skip</button>
              </div>
            )}
            {hintShown && !checked && <p className="text-[11px] font-semibold text-amber-700">Hint: {question.hint}</p>}
          </form>
        )}

        <div aria-live="polite">
          {checked && (
            <div className={`space-y-2 rounded-xl border p-4 text-xs ${result.correct ? 'border-emerald-300 bg-emerald-50 text-emerald-900' : 'border-red-300 bg-red-50 text-red-900'}`}>
              <p className="text-sm font-black">
                {result.correct ? 'Correct!' : result.timedOut ? 'Time’s up!' : 'Not quite.'}
                {result.correct && <span className="ml-2 font-bold">+{result.gained} pts</span>}
              </p>
              {result.correct && (result.timeBonus > 0 || result.streakBonus > 0) && (
                <p className="text-[11px]">
                  {result.timeBonus > 0 && `Speed bonus +${result.timeBonus}`}
                  {result.timeBonus > 0 && result.streakBonus > 0 && ' · '}
                  {result.streakBonus > 0 && `Streak bonus +${result.streakBonus}`}
                </p>
              )}
              {!result.correct && <p>Correct answer: <strong>{correctAnswerText}</strong></p>}
              <p className="text-[11px] leading-relaxed opacity-80">From your reviewer: “{question.source}”</p>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <button type="button" onClick={onQuit} className="cursor-pointer text-[11px] font-bold text-slate-400 hover:text-slate-700">End game</button>
          {checked && (
            <button type="button" autoFocus onClick={onNext} className={primaryButton}>
              {index + 1 < total ? 'Next question' : 'See results'} <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------------- Screen 4: results ---------------- */

function ResultsScreen({ summary, source, onAgain, onSettings, onNew }) {
  const { answers, score, bestStreak, previousBest, isNewBest } = summary;
  const correct = answers.filter((a) => a.correct).length;
  const accuracy = answers.length ? Math.round((correct / answers.length) * 100) : 0;
  const missed = answers.filter((a) => !a.correct);

  return (
    <div className="space-y-4">
      <div className={`${cardClass} space-y-4 text-center`}>
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-400 text-[#002147]"><Trophy className="h-7 w-7" /></span>
        <div>
          <h2 className="text-lg font-black text-slate-900">{gradeFor(accuracy)}</h2>
          <p className="text-[11px] text-slate-500">{source.title}</p>
        </div>
        <p className="text-3xl font-black text-[#002147]">{score} <span className="text-sm font-bold text-slate-500">points</span></p>
        {isNewBest ? (
          <p className="text-xs font-bold text-emerald-700">New best score for this reviewer!</p>
        ) : previousBest > 0 ? (
          <p className="text-[11px] text-slate-500">Your best for this reviewer: {previousBest} pts</p>
        ) : null}

        <div className="grid grid-cols-3 gap-3">
          {[
            ['Correct', `${correct}/${answers.length}`],
            ['Accuracy', `${accuracy}%`],
            ['Best streak', bestStreak],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-base font-black text-slate-900">{value}</p>
              <p className="text-[11px] text-slate-500">{label}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap justify-center gap-2">
          <button type="button" onClick={onAgain} className={primaryButton}><RotateCcw className="h-4 w-4" /> Play again</button>
          <button type="button" onClick={onSettings} className={secondaryButton}>Change settings</button>
          <button type="button" onClick={onNew} className={secondaryButton}><QrCode className="h-4 w-4" /> New reviewer</button>
        </div>
      </div>

      {missed.length > 0 && (
        <div className={`${cardClass} space-y-3`}>
          <h3 className="text-sm font-black text-slate-900">Review what you missed ({missed.length})</h3>
          <ul className="space-y-3">
            {missed.map(({ question, response, timedOut }) => (
              <li key={question.id} className="space-y-1 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs">
                <p className="font-bold text-slate-900">{question.body}</p>
                <p className="text-emerald-800">Correct answer: <strong>{question.type === 'tf' ? (question.answer ? 'True' : 'False') : question.answer}</strong></p>
                {!timedOut && response !== '' && response !== null && (
                  <p className="text-red-700">You answered: {typeof response === 'boolean' ? (response ? 'True' : 'False') : response}</p>
                )}
                {timedOut && <p className="text-red-700">You ran out of time.</p>}
                <p className="text-[11px] text-slate-500">From your reviewer: “{question.source}”</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/* ---------------- The tab ---------------- */

export default function QuizGame({ token, initialResource, onInitialResourceUsed }) {
  const [stage, setStage] = useState('start'); // start | loading | setup | playing | results
  const [error, setError] = useState('');
  const [progress, setProgress] = useState({ label: '', fraction: 0 });
  const [scannerOpen, setScannerOpen] = useState(false);

  const [source, setSource] = useState(null); // { title, subtitle, key }
  const [analysis, setAnalysis] = useState(null);
  const [available, setAvailable] = useState({});
  const [maxQuestions, setMaxQuestions] = useState(0);
  const [settings, setSettings] = useState({ count: 10, types: TYPE_IDS, timed: true });

  const [questions, setQuestions] = useState([]);
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [result, setResult] = useState(null); // set once the current question is answered
  const [hintShown, setHintShown] = useState(false);
  const [timeLeft, setTimeLeft] = useState(CHOICE_SECONDS);
  const [summary, setSummary] = useState(null);

  const abortRef = useRef(null);
  const deadlineRef = useRef(0);
  const resolveRef = useRef(null);

  useEffect(() => () => abortRef.current?.abort(), []);

  /* ----- getting a file ready ----- */

  // loadFile(signal) -> { file, meta }
  const begin = useCallback(async (loadFile) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setError('');
    setStage('loading');
    setProgress({ label: 'Starting', fraction: 0 });

    try {
      const { file, meta } = await loadFile(controller.signal, (label, fraction) => setProgress({ label, fraction }));

      const extracted = await extractText(file, {
        signal: controller.signal,
        onProgress: (p) => setProgress({ label: p.label, fraction: 0.15 + p.fraction * 0.85 }),
      });

      const nextAnalysis = analyzeText(extracted.text);
      const preview = buildQuiz(nextAnalysis, { count: 500, seed: 1 });

      if (preview.questions.length < 3) {
        throw new Error('This file does not have enough full sentences or definitions to build questions. Try a reviewer written in sentences, or a clearer scan.');
      }

      const max = preview.questions.length;
      const defaultCount = [10, 5].find((n) => n <= max) ?? max;

      setAnalysis(nextAnalysis);
      setAvailable(preview.available);
      setMaxQuestions(max);
      setSource(meta);
      setSettings((prev) => ({
        ...prev,
        count: defaultCount,
        types: TYPE_IDS.filter((type) => preview.available[type] > 0),
      }));
      setStage('setup');
    } catch (err) {
      if (err.name === 'AbortError') return;
      setError(err.message || 'Could not build a quiz from this file.');
      setStage('start');
    }
  }, []);

  const fromResource = useCallback((resourceOrId) => async (signal, report) => {
    let resource = resourceOrId;

    if (typeof resourceOrId === 'number' || typeof resourceOrId === 'string') {
      report('Opening the reviewer', 0.02);
      resource = (await apiRequest(`/resources/${resourceOrId}`, token, { signal })).resource;
    }

    report('Downloading the file', 0.07);
    const blob = await fetchBlob(resource.downloadUrl, token, signal);
    const file = new File([blob], resource.filename || `${resource.title}.pdf`, { type: resource.mimeType || blob.type });

    return {
      file,
      meta: { title: resource.title, subtitle: resource.courseCode ? `${resource.courseCode} · ${resource.filename || ''}` : resource.filename, key: `r${resource.id}` },
    };
  }, [token]);

  const fromFile = (file) => async () => ({
    file,
    meta: { title: file.name, subtitle: 'Uploaded file', key: `f:${file.name}:${file.size}` },
  });

  const readQrPicture = async (file) => {
    setError('');

    try {
      const bitmap = await createImageBitmap(file);
      const canvas = document.createElement('canvas');
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(bitmap, 0, 0);
      bitmap.close?.();

      const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(data.data, data.width, data.height, { inversionAttempts: 'attemptBoth' });

      if (!code?.data) {
        setError('No QR code was found in that picture. Try a sharper, closer photo or a screenshot.');
        return;
      }

      const id = parseResourceId(code.data);
      if (!id) {
        setError('That QR code is not a ReviewerHub reviewer.');
        return;
      }

      begin(fromResource(id));
    } catch {
      setError('That file could not be read as a picture.');
    }
  };

  // Opened from a reviewer's "Play Quiz" button.
  useEffect(() => {
    if (!initialResource) return;

    begin(fromResource(initialResource));
    onInitialResourceUsed?.();
    // Only when a different reviewer is passed in.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialResource]);

  /* ----- playing ----- */

  const question = questions[index];

  const resolveAnswer = (response, timedOut = false) => {
    if (!question || result) return;

    const correct = !timedOut && response !== '' && response !== null && isAnswerCorrect(question, response);
    const limit = secondsFor(question);
    const remaining = Math.max(0, (deadlineRef.current - Date.now()) / 1000);

    const base = correct ? (hintShown ? 70 : question.points) : 0;
    const timeBonus = correct && settings.timed ? Math.round((remaining / limit) * 50) : 0;
    const streakBonus = correct ? Math.min(streak, 5) * 10 : 0;
    const gained = base + timeBonus + streakBonus;

    setResult({ correct, gained, timeBonus, streakBonus, timedOut, response });
    setScore((s) => s + gained);
    setStreak(correct ? streak + 1 : 0);
    if (correct) setBestStreak((b) => Math.max(b, streak + 1));
    setAnswers((list) => [...list, { question, response, correct, timedOut, gained }]);
  };

  // The timer's interval always calls the latest version of resolveAnswer.
  resolveRef.current = resolveAnswer;

  useEffect(() => {
    if (stage !== 'playing' || !question) return undefined;

    const limit = secondsFor(question);
    deadlineRef.current = Date.now() + limit * 1000;
    setTimeLeft(limit);

    if (!settings.timed || result) return undefined;

    const timer = setInterval(() => {
      const left = Math.max(0, (deadlineRef.current - Date.now()) / 1000);
      setTimeLeft(left);

      if (left <= 0) {
        clearInterval(timer);
        resolveRef.current?.(null, true);
      }
    }, 100);

    return () => clearInterval(timer);
    // Restart only for a new question (or when an answer stops the clock).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, index, Boolean(result), settings.timed]);

  const startGame = (nextSeed) => {
    const built = buildQuiz(analysis, { count: settings.count, types: settings.types, seed: nextSeed });

    if (built.questions.length === 0) {
      setError('No questions could be made with those settings. Try choosing more question types.');
      return;
    }

    setError('');
    setQuestions(built.questions);
    setIndex(0);
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setAnswers([]);
    setResult(null);
    setHintShown(false);
    setSummary(null);
    setStage('playing');
  };

  const finish = () => {
    const previousBest = readBest(source.key);
    const isNewBest = score > previousBest;
    if (isNewBest) writeBest(source.key, score);

    setSummary({ answers, score, bestStreak, previousBest, isNewBest });
    setStage('results');
  };

  const next = () => {
    if (index + 1 < questions.length) {
      setIndex(index + 1);
      setResult(null);
      setHintShown(false);
    } else {
      finish();
    }
  };

  const quit = () => {
    if (answers.length === 0) {
      setStage('setup');
    } else if (window.confirm('End the game now and see your results?')) {
      finish();
    }
  };

  const reset = () => {
    abortRef.current?.abort();
    setError('');
    setStage('start');
  };

  /* ----- screens ----- */

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4">
      {stage === 'start' && (
        <StartScreen
          error={error}
          onScan={() => setScannerOpen(true)}
          onQrPicture={readQrPicture}
          onFile={(file) => begin(fromFile(file))}
        />
      )}

      {stage === 'loading' && (
        <div className={`${cardClass} space-y-4`}>
          <h2 className="flex items-center gap-2 text-sm font-black text-slate-900">
            <LoaderCircle className="h-4 w-4 animate-spin" /> Building your quiz...
          </h2>
          <ProgressBar label={progress.label} fraction={progress.fraction} />
          <p className="text-[11px] text-slate-500">Scanned pages and photos take longer because the text has to be read first.</p>
          <button type="button" onClick={reset} className={secondaryButton}>Cancel</button>
        </div>
      )}

      {stage === 'setup' && source && (
        <SetupScreen
          source={source}
          available={available}
          maxQuestions={maxQuestions}
          settings={settings}
          error={error}
          onChange={(patch) => setSettings((prev) => ({ ...prev, ...patch }))}
          onStart={() => startGame()}
          onBack={reset}
        />
      )}

      {stage === 'playing' && question && (
        <PlayScreen
          key={question.id}
          game={{ question, index, total: questions.length, score, streak, timed: settings.timed, timeLeft, result, hintShown }}
          onAnswer={resolveAnswer}
          onNext={next}
          onHint={() => setHintShown(true)}
          onQuit={quit}
        />
      )}

      {stage === 'results' && summary && source && (
        <ResultsScreen
          summary={summary}
          source={source}
          onAgain={() => startGame()}
          onSettings={() => setStage('setup')}
          onNew={reset}
        />
      )}

      {scannerOpen && (
        <QrScannerModal
          onClose={() => setScannerOpen(false)}
          onResource={(id) => {
            setScannerOpen(false);
            begin(fromResource(id));
          }}
        />
      )}
    </div>
  );
}