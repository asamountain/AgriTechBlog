import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAnonymousUser } from '@/hooks/useAnonymousUser';

export function useLikeAnnotation(postId: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { userId } = useAnonymousUser();

  return useMutation({
    mutationFn: async (annotationId: string) => {
      const res = await apiRequest(
        'PUT',
        `/api/blog-posts/${postId}/inline-comments/${annotationId}/like?userId=${userId}`
      );
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/blog-posts/${postId}/inline-comments`]
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to update like',
        variant: 'destructive',
      });
    },
  });
}
