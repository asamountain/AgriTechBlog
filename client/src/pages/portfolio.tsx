import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import type { BlogPostWithDetails } from "@shared/schema";
import { ProjectCardSkeleton } from "@/components/loading";
import Navigation from "@/components/navigation";
import Footer from "@/components/footer";
import { stripMarkdown } from "@/lib/utils";

function ProjectCard({ project }: { project: BlogPostWithDetails }) {
  const excerptText = stripMarkdown(project.excerpt || "");

  return (
    <div className="flex flex-col group h-full bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300">
      <div className="relative overflow-hidden aspect-[16/10]">
        <img 
          src={project.featuredImage || 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80'} 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          alt={project.title}
        />
        {project.impact && (
          <div className="absolute top-4 right-4 bg-forest-green text-white px-3 py-1 text-[10px] font-bold tracking-widest uppercase">
            {project.impact}
          </div>
        )}
      </div>

      <div className="p-8 flex flex-col flex-1">
        <div className="text-[10px] font-bold tracking-[0.2em] text-gray-400 uppercase mb-3">
          {project.tags?.[0] || 'AgriTech'}
        </div>
        
        <h2 className="text-2xl font-playfair font-bold text-gray-900 mb-4 italic leading-tight hover:text-forest-green cursor-pointer transition-colors">
          <Link href={`/blog/${project.slug}`}>{project.title}</Link>
        </h2>
        
        <p className="text-sm text-gray-600 leading-relaxed mb-6 line-clamp-3">
          {excerptText}
        </p>

        {project.tags && project.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            {project.tags.map((tag) => (
              <span key={tag} className="text-[9px] font-medium text-gray-500 bg-gray-50 px-2 py-1 border border-gray-100 uppercase tracking-wider">
                {tag}
              </span>
            ))}
          </div>
        )}
        
        <div className="mt-auto pt-6 border-t border-gray-50">
          <Link href={`/blog/${project.slug}`}>
            <span className="inline-flex items-center text-[10px] font-bold tracking-widest text-forest-green hover:opacity-70 transition-opacity cursor-pointer uppercase group">
              View Case Study
              <span className="ml-2 transform group-hover:translate-x-1 transition-transform">→</span>
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function PortfolioPage() {
  const { data: projects, isLoading } = useQuery<BlogPostWithDetails[]>({
    queryKey: ["/api/blog-posts", { postType: 'portfolio', includeDrafts: false }],
  });

  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      
      <main className="pt-32 pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header Section */}
          <div className="mb-20">
            <span className="text-xs font-bold tracking-[0.4em] text-gray-400 uppercase mb-4 block">Selected Work</span>
            <h1 className="text-5xl sm:text-6xl font-playfair font-bold text-gray-900 mb-8 leading-tight">
              AgriTech <span className="italic">Portfolio</span>
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed max-w-3xl">
              Case studies and technical implementations.
            </p>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-12">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <ProjectCardSkeleton key={i} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-12">
              {projects && projects.length > 0 ? (
                projects.map((project) => (
                  <ProjectCard key={project.id} project={project} />
                ))
              ) : (
                <div className="col-span-full py-24 text-center bg-gray-50 rounded-lg border border-dashed border-gray-200">
                  <p className="text-gray-500 italic">No projects added yet. Check back soon!</p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
