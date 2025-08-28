
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import StarRating from "./StarRating";

export default function CommentForm({ quest, onCommentPosted }) {
  const [commentText, setCommentText] = useState("");
  const [rating, setRating] = useState(0);
  const [ratingCategory, setRatingCategory] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!commentText.trim()) return;
    setIsSubmitting(true);
    
    const commentData = {
      comment_text: commentText,
      rating: rating > 0 ? rating : undefined,
    };

    // Add rating category if rating is provided
    if (rating > 0 && ratingCategory) {
        commentData.rating_categories = [ratingCategory];
    }

    await onCommentPosted(commentData);
    setCommentText("");
    setRating(0);
    setRatingCategory("");
    setIsSubmitting(false);
  };

  return (
    <div className="space-y-6 pt-6 border-t border-gray-100 dark:border-gray-700">
      {/* Review Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Add a Review</h3>
        <div className="space-y-3">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Your Rating</label>
            <StarRating rating={rating} onRate={setRating} />
          </div>
          
          {rating > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Rating Category</label>
              <RadioGroup
                value={ratingCategory}
                onValueChange={setRatingCategory}
                className="flex flex-wrap gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="impact" id="r-impact" className="dark:bg-gray-800 dark:border-gray-600" />
                  <label htmlFor="r-impact" className="text-sm text-gray-600 dark:text-gray-400">Impact</label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="quality" id="r-quality" className="dark:bg-gray-800 dark:border-gray-600" />
                  <label htmlFor="r-quality" className="text-sm text-gray-600 dark:text-gray-400">Quality</label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="difficulty" id="r-difficulty" className="dark:bg-gray-800 dark:border-gray-600" />
                  <label htmlFor="r-difficulty" className="text-sm text-gray-600 dark:text-gray-400">Difficulty</label>
                </div>
              </RadioGroup>
            </div>
          )}
        </div>
      </div>

      {/* Comment Section */}
      <div className="space-y-3">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Add a Comment</h3>
        <div className="space-y-2">
          <Textarea
            placeholder="Share your thoughts, feedback, or ask questions..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            rows={4}
            className="dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 dark:placeholder:text-gray-500"
          />
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSubmit} disabled={isSubmitting || !commentText.trim()} className="creator-btn">
          {isSubmitting ? "Posting..." : "Post Comment"}
        </Button>
      </div>
    </div>
  );
}
