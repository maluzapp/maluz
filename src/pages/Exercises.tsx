import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles } from 'lucide-react';
import { useStudyStore } from '@/store/study-store';
import { StageHeader } from '@/components/exercises/StageHeader';
import { MultipleChoice } from '@/components/exercises/MultipleChoice';
import { TrueFalse } from '@/components/exercises/TrueFalse';
import { FillBlank } from '@/components/exercises/FillBlank';
import { Matching } from '@/components/exercises/Matching';
import { Ordering } from '@/components/exercises/Ordering';
import { CompleteSentence } from '@/components/exercises/CompleteSentence';
import { ColumnClassification } from '@/components/exercises/ColumnClassification';
import { ExitExerciseDialog } from '@/components/exercises/ExitExerciseDialog';
import { useExerciseExitGuard } from '@/hooks/useExerciseExitGuard';
import type { Exercise, ExerciseAnswer } from '@/types/study';

export default function Exercises() {
  const navigate = useNavigate();
  const { exercises, answers, currentIndex, addAnswer, nextExercise, config } = useStudyStore();
  const [answered, setAnswered] = useState(false);
  const hasProgress = exercises.length > 0 && (answers.length > 0 || currentIndex > 0);
  const exitGuard = useExerciseExitGuard({ enabled: hasProgress, exitTo: '/confirmacao' });

  useEffect(() => {
    if (!config || exercises.length === 0) {
      navigate('/inicio');
    }
  }, []);

  useEffect(() => {
    setAnswered(false);
  }, [currentIndex]);

  if (!config || exercises.length === 0) return null;

  const exercise = exercises[currentIndex];
  const progress = ((currentIndex) / exercises.length) * 100;
  const isLast = currentIndex >= exercises.length;

  if (isLast) {
    navigate('/resultado');
    return null;
  }

  const handleAnswer = (answer: ExerciseAnswer) => {
    addAnswer(answer);
    setAnswered(true);
  };

  const handleNext = () => {
    if (currentIndex + 1 >= exercises.length) {
      navigate('/resultado');
    } else {
      nextExercise();
    }
  };

  const renderExercise = (ex: Exercise) => {
    const key = `exercise-${currentIndex}`;
    switch (ex.type) {
      case 'multiple_choice':
        return <MultipleChoice key={key} exercise={ex} index={currentIndex} onAnswer={handleAnswer} />;
      case 'true_false':
        return <TrueFalse key={key} exercise={ex} index={currentIndex} onAnswer={handleAnswer} />;
      case 'fill_blank':
        return <FillBlank key={key} exercise={ex} index={currentIndex} onAnswer={handleAnswer} />;
      case 'matching':
        return <Matching key={key} exercise={ex} index={currentIndex} onAnswer={handleAnswer} />;
      case 'ordering':
        return <Ordering key={key} exercise={ex} index={currentIndex} onAnswer={handleAnswer} />;
      case 'complete_sentence':
        return <CompleteSentence key={key} exercise={ex} index={currentIndex} onAnswer={handleAnswer} />;
      case 'column_classification':
        return <ColumnClassification key={key} exercise={ex} index={currentIndex} onAnswer={handleAnswer} />;
      default:
        return <MultipleChoice key={key} exercise={ex as any} index={currentIndex} onAnswer={handleAnswer} />;
    }
  };
  const correctCount = answers.filter(a => a.isCorrect).length;

  return (
    <div className="relative min-h-screen bg-background px-4 py-6 pb-24 md:py-12">
      {/* Stars background ambient */}
      <div className="pointer-events-none fixed inset-0 stars-bg opacity-30" aria-hidden="true" />
      {/* Top glow */}
      <div className="pointer-events-none fixed inset-x-0 top-0 h-48 bg-[radial-gradient(ellipse_60%_100%_at_50%_0%,hsl(var(--primary)/0.15),transparent_70%)]" aria-hidden="true" />

      <div className="relative mx-auto max-w-lg">
        <StageHeader
          current={currentIndex}
          total={exercises.length}
          correctCount={correctCount}
          exerciseType={exercise.type}
        />

        {renderExercise(exercise)}

        {answered && (
          <Button
            size="lg"
            className="mt-6 w-full gap-2 font-display font-bold h-14 text-base bg-gradient-to-r from-primary via-primary to-[hsl(38,92%,55%)] hover:brightness-110 shadow-[0_0_24px_hsl(var(--primary)/0.5),inset_0_1px_0_rgba(255,255,255,0.25)] hover:scale-[1.02] active:scale-[0.98] transition-all"
            onClick={handleNext}
          >
            <Sparkles className="h-4 w-4" />
            {currentIndex + 1 >= exercises.length ? 'Ver Resultado' : 'Próxima Fase'}
            <ArrowRight className="h-4 w-4" />
          </Button>
        )}

        <ExitExerciseDialog
          open={exitGuard.isDialogOpen}
          onOpenChange={exitGuard.setIsDialogOpen}
          onConfirm={exitGuard.confirmExit}
        />
      </div>
    </div>
  );
}