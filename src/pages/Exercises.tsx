import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { useStudyStore } from '@/store/study-store';
import { MultipleChoice } from '@/components/exercises/MultipleChoice';
import { TrueFalse } from '@/components/exercises/TrueFalse';
import { FillBlank } from '@/components/exercises/FillBlank';
import { Matching } from '@/components/exercises/Matching';
import type { Exercise, ExerciseAnswer } from '@/types/study';

export default function Exercises() {
  const navigate = useNavigate();
  const { exercises, currentIndex, addAnswer, nextExercise, config } = useStudyStore();
  const [answered, setAnswered] = useState(false);

  useEffect(() => {
    if (!config || exercises.length === 0) {
      navigate('/inicio');
    }
  }, []);

  // Reset answered state when index changes
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
    }
  };

  return (
    <div className="min-h-screen bg-background px-4 py-6 pb-24 md:py-12">
      <div className="mx-auto max-w-lg">
        <div className="mb-6">
          <div className="mb-2 flex items-center justify-between text-sm text-muted-foreground">
            <span className="font-semibold">
              Questão {currentIndex + 1} de {exercises.length}
            </span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {renderExercise(exercise)}

        {answered && (
          <Button
            size="lg"
            className="mt-6 w-full gap-2 font-display font-bold"
            onClick={handleNext}
          >
            {currentIndex + 1 >= exercises.length ? 'Ver Resultado' : 'Próxima Questão'}
            <ArrowRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}