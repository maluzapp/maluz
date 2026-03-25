import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Progress } from '@/components/ui/progress';
import { useStudyStore } from '@/store/study-store';
import { MultipleChoice } from '@/components/exercises/MultipleChoice';
import { TrueFalse } from '@/components/exercises/TrueFalse';
import { FillBlank } from '@/components/exercises/FillBlank';
import { Matching } from '@/components/exercises/Matching';
import type { Exercise, ExerciseAnswer } from '@/types/study';

export default function Exercises() {
  const navigate = useNavigate();
  const { exercises, currentIndex, addAnswer, nextExercise, config } = useStudyStore();

  useEffect(() => {
    if (!config || exercises.length === 0) {
      navigate('/');
    }
  }, []);

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
    setTimeout(() => {
      if (currentIndex + 1 >= exercises.length) {
        navigate('/resultado');
      } else {
        nextExercise();
      }
    }, 2000);
  };

  const renderExercise = (ex: Exercise) => {
    switch (ex.type) {
      case 'multiple_choice':
        return <MultipleChoice exercise={ex} index={currentIndex} onAnswer={handleAnswer} />;
      case 'true_false':
        return <TrueFalse exercise={ex} index={currentIndex} onAnswer={handleAnswer} />;
      case 'fill_blank':
        return <FillBlank exercise={ex} index={currentIndex} onAnswer={handleAnswer} />;
      case 'matching':
        return <Matching exercise={ex} index={currentIndex} onAnswer={handleAnswer} />;
    }
  };

  return (
    <div className="min-h-screen bg-background px-4 py-6 md:py-12">
      <div className="mx-auto max-w-lg">
        {/* Progress header */}
        <div className="mb-6">
          <div className="mb-2 flex items-center justify-between text-sm text-muted-foreground">
            <span className="font-semibold">
              Questão {currentIndex + 1} de {exercises.length}
            </span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Exercise */}
        {renderExercise(exercise)}
      </div>
    </div>
  );
}
