import { useQuery } from "@tanstack/react-query";

interface User {
  id: string;
  email: string;
  name: string;
  provider: 'google' | 'github';
  avatar?: string;
}

export function useAuth() {
  const { data: user, isLoading, error } = useQuery<User>({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    isError: !!error
  };
}