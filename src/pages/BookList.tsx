import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StarRating } from "@/components/StarRating";
import { Link } from "react-router-dom";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";

const BOOKS_PER_PAGE = 5;

const BookList = () => {
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");

  const { data: booksData, isLoading } = useQuery({
    queryKey: ["books", page, searchTerm],
    queryFn: async () => {
      let query = supabase
        .from("books")
        .select(`
          *,
          profiles!books_added_by_fkey(name),
          reviews(rating)
        `, { count: "exact" });

      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,author.ilike.%${searchTerm}%`);
      }

      const { data, error, count } = await query
        .range((page - 1) * BOOKS_PER_PAGE, page * BOOKS_PER_PAGE - 1)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const booksWithRatings = data?.map(book => {
        const ratings = book.reviews?.map(r => r.rating) || [];
        const avgRating = ratings.length > 0 
          ? ratings.reduce((a, b) => a + b, 0) / ratings.length 
          : 0;
        return { ...book, avgRating, reviewCount: ratings.length };
      });

      return { books: booksWithRatings, count };
    },
  });

  const totalPages = Math.ceil((booksData?.count || 0) / BOOKS_PER_PAGE);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Discover Books</h1>
          <p className="text-muted-foreground">Browse our collection of amazing books</p>
        </div>

        <div className="mb-6 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search books by title or author..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            className="pl-10"
          />
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : booksData?.books && booksData.books.length > 0 ? (
          <>
            <div className="grid gap-6 mb-8">
              {booksData.books.map((book) => (
                <Link key={book.id} to={`/books/${book.id}`}>
                  <Card className="hover:shadow-[var(--shadow-hover)] transition-shadow cursor-pointer">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <CardTitle className="text-2xl mb-1">{book.title}</CardTitle>
                          <CardDescription className="text-base">by {book.author}</CardDescription>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-2 mb-1">
                            <StarRating rating={Math.round(book.avgRating)} readonly size="sm" />
                            <span className="text-sm text-muted-foreground">
                              ({book.reviewCount})
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">{book.published_year}</p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground line-clamp-2 mb-2">{book.description}</p>
                      <div className="flex items-center justify-between text-sm">
                        <span className="inline-block px-3 py-1 bg-secondary rounded-full text-secondary-foreground">
                          {book.genre}
                        </span>
                        <span className="text-muted-foreground">
                          Added by {book.profiles?.name}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No books found</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default BookList;
