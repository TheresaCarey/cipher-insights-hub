import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Survey, useSurveyContract } from "@/hooks/useSurveyContract";
import { useState } from "react";
import { Loader2 } from "lucide-react";

interface SubmitRatingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  surveyId: number;
  survey: Survey;
  onSuccess: () => void;
}

export const SubmitRatingDialog = ({
  open,
  onOpenChange,
  surveyId,
  survey,
  onSuccess,
}: SubmitRatingDialogProps) => {
  const { submitRatings, isLoading } = useSurveyContract();
  const [ratings, setRatings] = useState<number[]>(
    Array(Number(survey.productCount)).fill(3)
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (ratings.some(r => r < 1 || r > 5)) {
      alert("All ratings must be between 1 and 5");
      return;
    }
    
    if (ratings.length !== Number(survey.productCount)) {
      alert(`Please rate all ${survey.productCount} products`);
      return;
    }

    setIsSubmitting(true);
    const success = await submitRatings(surveyId, ratings);
    setIsSubmitting(false);
    
    if (success) {
      onSuccess();
      onOpenChange(false);
      // Reset ratings
      setRatings(Array(Number(survey.productCount)).fill(3));
    }
  };

  const updateRating = (index: number, value: number[]) => {
    const newRatings = [...ratings];
    newRatings[index] = value[0];
    setRatings(newRatings);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Submit Ratings</DialogTitle>
          <DialogDescription>
            Rate each product from 1 (Very Unsatisfied) to 5 (Very Satisfied). Your ratings are encrypted before submission.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {survey.productNames.map((productName, index) => (
            <div key={index} className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor={`rating-${index}`} className="text-base font-semibold">
                  {productName}
                </Label>
                <span className="text-sm font-medium text-muted-foreground">
                  {ratings[index]}/5
                </span>
              </div>
              <Slider
                id={`rating-${index}`}
                min={1}
                max={5}
                step={1}
                value={[ratings[index]]}
                onValueChange={(value) => updateRating(index, value)}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground px-1">
                <span>1 - Very Unsatisfied</span>
                <span>3 - Neutral</span>
                <span>5 - Very Satisfied</span>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading || isSubmitting}>
            {(isLoading || isSubmitting) ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit Ratings"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

