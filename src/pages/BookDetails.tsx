import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Navbar } from "@/components/Navbar";
import { StarRating } from "@/components/StarRating";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { ArrowLeft, Edit, Trash2 } from "lucide-react";

const BookDetails = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState("");

  const { data: book, isLoading } = useQuery({
    queryKey: ["book", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("books")
        .select(`
          *,
          profiles!books_added_by_fkey(name)
        `)
        .eq("id", id)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const { data: reviews } = useQuery({
    queryKey: ["reviews", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select(`
          *,
          profiles(name)
        `)
        .eq("book_id", id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const deleteBookMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("books")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Book deleted successfully");
      navigate("/");
    },
    onError: () => {
      toast.error("Failed to delete book");
    },
  });

  const addReviewMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("reviews")
        .insert({
          book_id: id,
          user_id: user?.id,
          rating,
          review_text: reviewText,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Review added successfully");
      setRating(0);
      setReviewText("");
      queryClient.invalidateQueries({ queryKey: ["reviews", id] });
    },
    onError: (error: any) => {
      if (error.message.includes("duplicate")) {
        toast.error("You've already reviewed this book");
      } else {
        toast.error("Failed to add review");
      }
    },
  });

  const avgRating = reviews?.length
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex justify-center items-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </div>
    );
  }

  if (!book) return null;

  const userHasReviewed = reviews?.some(r => r.user_id === user?.id);
  const isOwner = user?.id === book.added_by;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4" />
          Back to books
        </Link>

        <Card className="shadow-[var(--shadow-card)] mb-8">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-3xl mb-2">{book.title}</CardTitle>
                <p className="text-lg text-muted-foreground mb-4">by {book.author}</p>
                <div className="flex items-center gap-4 mb-4">
                  <StarRating rating={Math.round(avgRating)} readonly size="lg" />
                  <span className="text-sm text-muted-foreground">
                    {avgRating.toFixed(1)} ({reviews?.length || 0} reviews)
                  </span>
                </div>
              </div>
              {isOwner && (
                <div className="flex gap-2">
                  <Link to={`/books/${id}/edit`}>
                    <Button variant="outline" size="icon">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Button 
                    variant="destructive" 
                    size="icon"
                    onClick={() => deleteBookMutation.mutate()}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Description</h3>
                <p className="text-muted-foreground">{book.description}</p>
              </div>
              <div className="flex gap-6 text-sm">
                <div>
                  <span className="font-semibold">Genre:</span>{" "}
                  <span className="text-muted-foreground">{book.genre}</span>
                </div>
                <div>
                  <span className="font-semibold">Published:</span>{" "}
                  <span className="text-muted-foreground">{book.published_year}</span>
                </div>
                <div>
                  <span className="font-semibold">Added by:</span>{" "}
                  <span className="text-muted-foreground">{book.profiles?.name}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {user && !userHasReviewed && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Write a Review</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Rating</label>
                  <StarRating rating={rating} onRatingChange={setRating} size="lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Your Review</label>
                  <Textarea
                    placeholder="Share your thoughts about this book..."
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    rows={4}
                  />
                </div>
                <Button 
                  onClick={() => addReviewMutation.mutate()}
                  disabled={rating === 0 || addReviewMutation.isPending}
                >
                  Submit Review
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div>
          <h2 className="text-2xl font-bold mb-4">Reviews ({reviews?.length || 0})</h2>
          {reviews && reviews.length > 0 ? (
            <div className="space-y-4">
              {reviews.map((review) => (
                <Card key={review.id}>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-semibold">{review.profiles?.name}</p>
                        <StarRating rating={review.rating} readonly size="sm" />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {new Date(review.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    {review.review_text && (
                      <p className="text-muted-foreground mt-2">{review.review_text}</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              No reviews yet. Be the first to review this book!
            </p>
          )}
        </div>
      </main>
    </div>
  );
};

export default BookDetails;
