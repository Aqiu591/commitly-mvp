"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

type LoginContextValue = {
  isOpen: boolean;
  openLogin: () => void;
  closeLogin: () => void;
};

const LoginContext = createContext<LoginContextValue>({
  isOpen: false,
  openLogin: () => {},
  closeLogin: () => {}
});

export function LoginProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const openLogin = useCallback(() => setIsOpen(true), []);
  const closeLogin = useCallback(() => setIsOpen(false), []);

  return (
    <LoginContext.Provider value={{ isOpen, openLogin, closeLogin }}>
      {children}
    </LoginContext.Provider>
  );
}

export function useLogin() {
  return useContext(LoginContext);
}
