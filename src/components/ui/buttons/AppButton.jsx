import React from "react";
import { Button } from "@mui/material";
import { useTheme } from "@/contexts/ThemeContext";
import { getThemeTokens } from "@/theme/getThemeTokens";
import { AppLoader } from "@/components";

const AppButton = ({
  children,
  onClick,
  type = "button",
  variant = "contained",
  colorVariant = "primary",
  size = "medium",
  fullWidth = false,
  disabled = false,
  loading = false,
  isLoading = false,
  loadingText,
  startIcon,
  endIcon,
  rounded = "md",
  elevation = false,
  uppercase = false,
  fontWeight = 600,
  loaderVariant = "spinner",
  sx = {},
  ...props
}) => {
  const { mode, theme, colorTheme } = useTheme();

  const activeMode = mode || theme;
  const isDark = activeMode === "dark";
  const t = getThemeTokens(activeMode, colorTheme);

  const colorMap = {
    primary: {
      main: t.primary,
      hover: t.primaryHover,
      text: t.primaryContrast,
      soft: t.primarySoft,
      border: t.primary,
    },
    success: {
      main: t.success,
      hover: t.successHover,
      text: t.successContrast,
      soft: t.successSoft,
      border: t.success,
    },
    error: {
      main: t.error,
      hover: t.errorHover,
      text: t.errorContrast,
      soft: t.errorSoft,
      border: t.error,
    },
    warning: {
      main: t.warning,
      hover: t.warningHover,
      text: t.warningContrast,
      soft: t.warningSoft,
      border: t.warning,
    },
    info: {
      main: t.info,
      hover: t.infoHover,
      text: t.infoContrast,
      soft: t.infoSoft,
      border: t.info,
    },
    dark: {
      main: isDark ? t.neutral[800] : t.neutral[900],
      hover: isDark ? t.neutral[700] : t.neutral[800],
      text: isDark ? t.textInverse : t.textInverse,
      soft: isDark ? "rgba(255,255,255,0.08)" : t.neutral[100],
      border: isDark ? t.borderStrong : t.neutral[300],
      outlineText: isDark ? t.text : t.neutral[900],
    },
  };

  const active = colorMap[colorVariant] || colorMap.primary;

  const radiusMap = {
    sm: "6px",
    md: "8px",
    lg: "10px",
  };

  const sizeMap = {
    small: {
      px: 1.6,
      py: 0.5,
      fontSize: "0.78rem",
      minHeight: 32,
      loaderSize: "small",
    },
    medium: {
      px: 2.2,
      py: 0.7,
      fontSize: "0.86rem",
      minHeight: 38,
      loaderSize: "small",
    },
    large: {
      px: 2.8,
      py: 0.9,
      fontSize: "0.95rem",
      minHeight: 44,
      loaderSize: "medium",
    },
  };

  const activeSize = sizeMap[size] || sizeMap.medium;
  const isDarkVariant = colorVariant === "dark";

  const baseStyles = {
    borderRadius: radiusMap[rounded] || radiusMap.md,
    px: activeSize.px,
    py: activeSize.py,
    minHeight: activeSize.minHeight,
    fontSize: activeSize.fontSize,
    fontWeight,
    textTransform: uppercase ? "uppercase" : "none",
    letterSpacing: uppercase ? "0.04em" : 0,
    boxShadow: "none",
    transition:
      "background-color 0.18s ease, border-color 0.18s ease, color 0.18s ease, transform 0.18s ease, box-shadow 0.18s ease, filter 0.18s ease",

    "&:focus-visible": {
      outline: "none",
      boxShadow: `${t.focusRing}${elevation ? `, ${t.shadowMd}` : ""}`,
    },

    "&.Mui-disabled": {
      backgroundColor:
        variant === "contained" || variant === "gradient" || variant === "soft"
          ? t.disabledBg
          : "transparent",
      color: t.disabledText,
      borderColor: variant === "outlined" ? t.disabledBorder : "transparent",
      boxShadow: "none",
      transform: "none",
      cursor: "not-allowed",
    },
  };

  const variantStyles = {
    contained: {
      backgroundColor: active.main,
      color: active.text,
      border: `1px solid ${active.main}`,

      "&:hover": {
        backgroundColor: active.hover,
        borderColor: active.hover,
        transform: "translateY(-1px)",
        boxShadow: elevation ? t.shadowLg : "none",
      },

      "&:active": {
        transform: "translateY(0)",
        filter: "brightness(0.98)",
      },
    },

    outlined: {
      backgroundColor: "transparent",
      color: isDarkVariant ? active.outlineText : active.main,
      border: `1px solid ${active.border}`,

      "&:hover": {
        backgroundColor: active.soft,
        borderColor: isDarkVariant && isDark ? t.textMuted : active.main,
        color: isDarkVariant ? active.outlineText : active.main,
        transform: "translateY(-1px)",
        boxShadow: elevation ? t.shadowSm : "none",
      },

      "&:active": {
        transform: "translateY(0)",
        backgroundColor: t.activeOverlay,
      },
    },

    text: {
      backgroundColor: "transparent",
      color: isDarkVariant ? active.outlineText : active.main,
      border: "1px solid transparent",

      "&:hover": {
        backgroundColor: active.soft,
        color: isDarkVariant ? active.outlineText : active.main,
        transform: "translateY(-1px)",
      },

      "&:active": {
        transform: "translateY(0)",
        backgroundColor: t.activeOverlay,
      },
    },

    soft: {
      backgroundColor: active.soft,
      color: isDarkVariant ? active.outlineText : active.main,
      border: `1px solid ${isDarkVariant && isDark ? t.border : "transparent"}`,

      "&:hover": {
        backgroundColor: active.soft,
        borderColor: active.border,
        color: isDarkVariant ? active.outlineText : active.main,
        transform: "translateY(-1px)",
        filter: "brightness(0.98)",
      },

      "&:active": {
        transform: "translateY(0)",
        filter: "brightness(0.95)",
      },
    },

    gradient: {
      backgroundImage: `linear-gradient(135deg, ${active.main}, ${active.hover})`,
      color: active.text,
      border: "1px solid transparent",

      "&:hover": {
        filter: "brightness(1.03)",
        transform: "translateY(-1px)",
        boxShadow: elevation ? t.shadowLg : t.shadowSm,
      },

      "&:active": {
        transform: "translateY(0)",
        filter: "brightness(0.97)",
      },
    },
  };

  const appliedVariant = variantStyles[variant] || variantStyles.contained;

  const loaderColor =
    variant === "outlined" || variant === "text" || variant === "soft"
      ? isDarkVariant
        ? active.outlineText
        : active.main
      : active.text;

  const isBusy = Boolean(loading || isLoading);

  return (
    <Button
      type={type}
      onClick={onClick}
      variant={
        ["contained", "outlined", "text"].includes(variant)
          ? variant
          : "contained"
      }
      disabled={disabled || isBusy}
      fullWidth={fullWidth}
      startIcon={!isBusy ? startIcon : undefined}
      endIcon={!isBusy ? endIcon : undefined}
      sx={{
        ...baseStyles,
        ...appliedVariant,
        ...sx,
      }}
      {...props}
    >
      {isBusy ? (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
          <AppLoader
            size={activeSize.loaderSize}
            variant={loaderVariant}
            colorVariant={colorVariant === "dark" ? "primary" : colorVariant}
            center={false}
            sx={{
              width: "auto",
              minHeight: "auto",
              display: "inline-flex",
              color: loaderColor,
              "& .MuiCircularProgress-root": {
                color: loaderColor,
              },
            }}
          />
          {loadingText && <span>{loadingText}</span>}
        </span>
      ) : (
        children
      )}
    </Button>
  );
};

export default AppButton;
