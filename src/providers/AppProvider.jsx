import { ReduxProvider } from "./ReduxProvider";
import { ThemeProvider } from "./ThemeProvider";
import { ToastProvider } from "./ToastProvider";
import { WorkModeProvider } from "@/contexts";

export const AppProvider = ({ children }) => {
  return (
    <ThemeProvider>
      <WorkModeProvider>
        <ReduxProvider>
          <ToastProvider>{children}</ToastProvider>
        </ReduxProvider>
      </WorkModeProvider>
    </ThemeProvider>
  );
};
