import { ReduxProvider } from "./ReduxProvider";
import { ThemeProvider } from "./ThemeProvider";
import { ToastProvider } from "./ToastProvider";
import { WorkModeProvider } from "@/contexts";

export const AppProvider = ({ children }) => {
  return (
    <ThemeProvider>
      <ReduxProvider>
        <WorkModeProvider>
          <ToastProvider>{children}</ToastProvider>
        </WorkModeProvider>
      </ReduxProvider>
    </ThemeProvider>
  );
};
