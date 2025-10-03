import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StarRating } from "@/components/StarRating";
import { Link } from "react-router-dom";
import { BookOpen, Star } from "lucide-react";

const Profile = () => {
  const { user } = useAuth();

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user?.id)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const { data: userBooks } = useQuery({
    queryKey: ["user-books", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("books")
        .select(`
          *,
          reviews(rating)
        `)
        .eq("added_by", user?.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: userReviews } = useQuery({
    queryKey: ["user-reviews", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select(`
          *,
          books(title, author)
        `)
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Card className="mb-8 shadow-[var(--shadow-card)]">
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="bg-primary text-primary-foreground w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold">
                {profile?.name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <CardTitle className="text-2xl">{profile?.name}</CardTitle>
                <p className="text-muted-foreground">{user?.email}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="flex items-center justify-center gap-2 text-2xl font-bold text-primary mb-1">
                  <BookOpen className="h-6 w-6" />
                  {userBooks?.length || 0}
                </div>
                <p className="text-sm text-muted-foreground">Books Added</p>
              </div>
              <div>
                <div className="flex items-center justify-center gap-2 text-2xl font-bold text-accent mb-1">
                  <Star className="h-6 w-6" />
                  {userReviews?.length || 0}
                </div>
                <p className="text-sm text-muted-foreground">Reviews Written</p>
              </div>
              <div>
                <div className="text-2xl font-bold text-muted mb-1">
                  {userReviews?.length 
                    ? (userReviews.reduce((sum, r) => sum + r.rating, 0) / userReviews.length).toFixed(1)
                    : "0.0"}
                </div>
                <p className="text-sm text-muted-foreground">Avg Rating Given</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="books" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="books">My Books</TabsTrigger>
            <TabsTrigger value="reviews">My Reviews</TabsTrigger>
          </TabsList>
          
          <TabsContent value="books" className="space-y-4 mt-6">
            {userBooks && userBooks.length > 0 ? (
              userBooks.map((book) => {
                const ratings = book.reviews?.map(r => r.rating) || [];
                const avgRating = ratings.length > 0 
                  ? ratings.reduce((a, b) => a + b, 0) / ratings.length 
                  : 0;
                
                return (
                  <Link key={book.id} to={`/books/${book.id}`}>
                    <Card className="hover:shadow-[var(--shadow-hover)] transition-shadow">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-xl">{book.title}</CardTitle>
                            <p className="text-muted-foreground">by {book.author}</p>
                          </div>
                          <div className="text-right">
                            <StarRating rating={Math.round(avgRating)} readonly size="sm" />
                            <p className="text-xs text-muted-foreground mt-1">
                              {ratings.length} reviews
                            </p>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground line-clamp-2">{book.description}</p>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })
            ) : (
              <p className="text-center text-muted-foreground py-8">
                You haven't added any books yet
              </p>
            )}
          </TabsContent>
          
          <TabsContent value="reviews" className="space-y-4 mt-6">
            {userReviews && userReviews.length > 0 ? (
              userReviews.map((review) => (
                <Link key={review.id} to={`/books/${review.book_id}`}>
                  <Card className="hover:shadow-[var(--shadow-hover)] transition-shadow">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-xl">{review.books?.title}</CardTitle>
                          <p className="text-muted-foreground text-sm">by {review.books?.author}</p>
                        </div>
                        <StarRating rating={review.rating} readonly size="sm" />
                      </div>
                    </CardHeader>
                    {review.review_text && (
                      <CardContent>
                        <p className="text-muted-foreground">{review.review_text}</p>
                      </CardContent>
                    )}
                  </Card>
                </Link>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-8">
                You haven't written any reviews yet
              </p>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Profile;
