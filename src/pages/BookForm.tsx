import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

const BookForm = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isEditMode = !!id;

  const [formData, setFormData] = useState({
    title: "",
    author: "",
    description: "",
    genre: "",
    published_year: new Date().getFullYear(),
  });

  const { data: book } = useQuery({
    queryKey: ["book", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("books")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: isEditMode,
  });

  useEffect(() => {
    if (book) {
      setFormData({
        title: book.title,
        author: book.author,
        description: book.description,
        genre: book.genre,
        published_year: book.published_year,
      });
    }
  }, [book]);

  const mutation = useMutation({
    mutationFn: async () => {
      if (isEditMode) {
        const { error } = await supabase
          .from("books")
          .update(formData)
          .eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("books")
          .insert({
            ...formData,
            added_by: user?.id,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(isEditMode ? "Book updated successfully" : "Book added successfully");
      navigate(isEditMode ? `/books/${id}` : "/");
    },
    onError: () => {
      toast.error(isEditMode ? "Failed to update book" : "Failed to add book");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate();
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <Card className="shadow-[var(--shadow-card)]">
          <CardHeader>
            <CardTitle className="text-3xl">
              {isEditMode ? "Edit Book" : "Add New Book"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="author">Author</Label>
                <Input
                  id="author"
                  value={formData.author}
                  onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="genre">Genre</Label>
                  <Input
                    id="genre"
                    value={formData.genre}
                    onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
                    placeholder="e.g., Fiction, Mystery"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="year">Published Year</Label>
                  <Input
                    id="year"
                    type="number"
                    value={formData.published_year}
                    onChange={(e) => setFormData({ ...formData, published_year: parseInt(e.target.value) })}
                    min="1000"
                    max={new Date().getFullYear()}
                    required
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <Button type="submit" disabled={mutation.isPending}>
                  {mutation.isPending 
                    ? (isEditMode ? "Updating..." : "Adding...") 
                    : (isEditMode ? "Update Book" : "Add Book")}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => navigate(isEditMode ? `/books/${id}` : "/")}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default BookForm;
