import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/schema";

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  const { data: userData, isLoading, error } = useQuery<User>({
    queryKey: ["/api/auth/user"],
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  useEffect(() => {
    if (userData) {
      setUser(userData);
      setIsAuthenticated(true);
    } else if (error) {
      setUser(null);
      setIsAuthenticated(false);
    }
  }, [userData, error]);

  return {
    user,
    isAuthenticated,
    isLoading,
  };
}