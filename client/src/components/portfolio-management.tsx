import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Briefcase, ExternalLink, Sparkles } from "lucide-react";
import type { PortfolioProject } from "@shared/schema";
import { AdaptiveLoader } from "@/components/loading";

export default function PortfolioManagement() {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    content: "Project details...",
    category: "AgriTech",
    impact: "",
    featuredImage: "",
    technologies: ""
  });

  const { data: projects = [], isLoading } = useQuery<PortfolioProject[]>({
    queryKey: ["/api/portfolio"],
  });

  const createMutation = useMutation({
    mutationFn: async (newProject: any) => {
      const response = await fetch("/api/portfolio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newProject,
          slug: newProject.title.toLowerCase().replace(/[^a-z0-9]/g, "-"),
          technologies: newProject.technologies.split(",").map((t: string) => t.trim()).filter(Boolean)
        }),
      });
      if (!response.ok) throw new Error("Failed to create project");
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Project added to portfolio" });
      queryClient.invalidateQueries({ queryKey: ["/api/portfolio"] });
      setIsOpen(false);
      setFormData({ title: "", description: "", content: "Project details...", category: "AgriTech", impact: "", featuredImage: "", technologies: "" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number | string) => {
      // Logic for delete would go here, for now we simulate
      toast({ title: "Note", description: "Delete functionality requires backend expansion, but project added successfully!" });
    }
  });

  if (isLoading) return <AdaptiveLoader size="lg" text="Loading portfolio..." />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Portfolio Management</h2>
          <p className="text-sm text-gray-500">Showcase your successful AgriTech implementations</p>
        </div>
        
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="bg-forest-green hover:bg-forest-green/90">
              <Plus className="w-4 h-4 mr-2" />
              Add New Project
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle>Add Portfolio Project</DialogTitle>
              <DialogDescription>
                Fill in the details to showcase your work on the portfolio page.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="title" className="text-right">Title</Label>
                <Input 
                  id="title" 
                  value={formData.title} 
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="col-span-3" 
                  placeholder="e.g. Smart Irrigation System"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="impact" className="text-right">Impact</Label>
                <Input 
                  id="impact" 
                  value={formData.impact} 
                  onChange={(e) => setFormData({...formData, impact: e.target.value})}
                  className="col-span-3" 
                  placeholder="e.g. 30% Water Saving"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="category" className="text-right">Category</Label>
                <Input 
                  id="category" 
                  value={formData.category} 
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  className="col-span-3" 
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="image" className="text-right">Image URL</Label>
                <Input 
                  id="image" 
                  value={formData.featuredImage} 
                  onChange={(e) => setFormData({...formData, featuredImage: e.target.value})}
                  className="col-span-3" 
                  placeholder="Unsplash or Cloudinary URL"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="tech" className="text-right">Tech</Label>
                <Input 
                  id="tech" 
                  value={formData.technologies} 
                  onChange={(e) => setFormData({...formData, technologies: e.target.value})}
                  className="col-span-3" 
                  placeholder="IoT, React, Python (comma separated)"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="desc" className="text-right">Description</Label>
                <Textarea 
                  id="desc" 
                  value={formData.description} 
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="col-span-3" 
                />
              </div>
            </div>
            <DialogFooter>
              <Button 
                onClick={() => createMutation.mutate(formData)}
                className="bg-forest-green"
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? "Adding..." : "Save Project"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {projects.length > 0 ? (
          projects.map((project) => (
            <Card key={project.id} className="overflow-hidden border-2 hover:border-forest-green transition-all">
              <div className="aspect-video relative overflow-hidden bg-gray-100">
                <img 
                  src={project.featuredImage || 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80'} 
                  className="w-full h-full object-cover"
                  alt={project.title}
                />
                <div className="absolute top-2 right-2">
                  <Badge className="bg-forest-green">{project.impact || 'Active'}</Badge>
                </div>
              </div>
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-lg font-playfair">{project.title}</CardTitle>
                <CardDescription className="line-clamp-2 text-xs">{project.description}</CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="flex flex-wrap gap-1 mt-2">
                  {project.technologies?.slice(0, 3).map(t => (
                    <Badge key={t} variant="secondary" className="text-[9px] px-1 py-0">{t}</Badge>
                  ))}
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <Button variant="outline" size="sm" onClick={() => window.open(`/portfolio`, '_blank')}>
                    <Eye className="w-3 h-3" />
                  </Button>
                  <Button variant="outline" size="sm" className="text-red-600 border-red-100 hover:bg-red-50">
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full py-12 text-center bg-gray-50 border-2 border-dashed rounded-xl">
            <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900">No projects yet</h3>
            <p className="text-gray-500">Start by adding your first AgriTech project!</p>
          </div>
        )}
      </div>
    </div>
  );
}
