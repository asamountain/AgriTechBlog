import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAnonymousUser } from '@/hooks/useAnonymousUser';

export function useDeleteAnnotation(postId: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { userId } = useAnonymousUser();

  return useMutation({
    mutationFn: async (annotationId: string) => {
      return await apiRequest(
        'DELETE',
        `/api/blog-posts/${postId}/inline-comments?annotationId=${annotationId}&userId=${userId}`
      );
    },
    onSuccess: () => {
      toast({ title: 'Annotation deleted' });
      queryClient.invalidateQueries({
        queryKey: [`/api/blog-posts/${postId}/inline-comments`]
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to delete annotation. You can only delete your own annotations.',
        variant: 'destructive',
      });
    },
  });
}
