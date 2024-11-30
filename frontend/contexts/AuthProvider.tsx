import { createContext, useState } from "react";
import { ReactNode } from "react";

interface AuthContextType {
  loggedIn: boolean;
  setLoggedIn: (loggedIn: boolean) => void;
  userName: string;
  setUserName: (userName: string) => void;
  userMetadata: Record<string, any> | null; // More flexible type
  setUserMetadata: (metadata: Record<string, any> | null) => void;
}

const AuthContext = createContext<AuthContextType>({
  loggedIn: false,
  setLoggedIn: () => {},
  userName: "",
  setUserName: () => {},
  userMetadata: null, // Initialize with null
  setUserMetadata: () => {},
});

interface Props {
  children: ReactNode;
}

export const AuthProvider = ({ children }: Props) => {
  const [loggedIn, setLoggedIn] = useState(false);
  const [userName, setUserName] = useState("");
  const [userMetadata, setUserMetadata] = useState<Record<string, any> | null>(null);

  return (
    <AuthContext.Provider value={{ loggedIn, setLoggedIn, userName, setUserName, userMetadata, setUserMetadata }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
