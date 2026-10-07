import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { Appearance, Platform, StyleSheet } from "react-native";
import * as SecureStore from "expo-secure-store";

const THEME_STORAGE_KEY = "inviteflow-theme";
const ThemeContext = createContext(null);

const PALETTES = {
  light: {
    background: "#F8FAFC",
    surface: "#FFFFFF",
    surfaceMuted: "#F1F5F9",
    text: "#0F172A",
    textMuted: "#64748B",
    border: "#E2E8F0",
  },
  dark: {
    background: "#111827",
    surface: "#1F2937",
    surfaceMuted: "#273449",
    text: "#F8FAFC",
    textMuted: "#CBD5E1",
    border: "#374151",
  },
};

const WEB_DARK_MODE_STYLES = `
  html[data-inviteflow-theme="dark"],
  body[data-inviteflow-theme="dark"],
  body[data-inviteflow-theme="dark"] #root,
  body[data-inviteflow-theme="dark"] #root > div {
    background-color: #111827 !important;
    color: #F8FAFC !important;
  }
  body[data-inviteflow-theme="dark"] * {
    transition-property: background-color, color, border-color;
    transition-duration: 180ms;
    transition-timing-function: ease;
  }
  body[data-inviteflow-theme="dark"] [style*="background-color: rgb(255, 255, 255)"],
  body[data-inviteflow-theme="dark"] [style*="background-color: rgb(255, 255, 255);"] {
    background-color: #1F2937 !important;
  }
  body[data-inviteflow-theme="dark"] [style*="background-color: rgb(248, 250, 252)"],
  body[data-inviteflow-theme="dark"] [style*="background-color: rgb(241, 245, 249)"] {
    background-color: #111827 !important;
  }
  body[data-inviteflow-theme="dark"] [style*="color: rgb(15, 23, 42)"],
  body[data-inviteflow-theme="dark"] [style*="color: rgb(30, 41, 59)"],
  body[data-inviteflow-theme="dark"] [style*="color: rgb(51, 65, 85)"] {
    color: #F8FAFC !important;
  }
  body[data-inviteflow-theme="dark"] [style*="color: rgb(100, 116, 139)"],
  body[data-inviteflow-theme="dark"] [style*="color: rgb(71, 85, 105)"] {
    color: #CBD5E1 !important;
  }
  body[data-inviteflow-theme="dark"] [style*="border-color: rgb(226, 232, 240)"],
  body[data-inviteflow-theme="dark"] [style*="border-color: rgb(203, 213, 225)"] {
    border-color: #374151 !important;
  }
  body[data-inviteflow-theme="dark"] input,
  body[data-inviteflow-theme="dark"] textarea,
  body[data-inviteflow-theme="dark"] select {
    color: #F8FAFC;
    color-scheme: dark;
  }
`;

const WEB_THEME_OVERRIDES = new WeakMap();
const WEB_THEME_SELF_WRITES = new WeakSet();
const COLOR_PROPERTIES = [
  ["backgroundColor", "background-color"],
  ["color", "color"],
  ["borderTopColor", "border-top-color"],
  ["borderRightColor", "border-right-color"],
  ["borderBottomColor", "border-bottom-color"],
  ["borderLeftColor", "border-left-color"],
];

const mapThemeColor = (value, kind) => {
  if (typeof value !== "string") return value;
  let rgb;
  const hex = value.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  const channels = value.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
  if (hex?.[1].length === 3) {
    rgb = hex[1].split("").map((channel) => parseInt(channel + channel, 16));
  } else if (hex?.[1].length === 6) {
    rgb = [0, 2, 4].map((offset) => parseInt(hex[1].slice(offset, offset + 2), 16));
  } else if (channels) {
    rgb = channels.slice(1, 4).map(Number);
  } else {
    return value;
  }
  const [red, green, blue] = rgb;
  const min = Math.min(red, green, blue);
  const max = Math.max(red, green, blue);
  const spread = max - min;

  if (kind === "background" && min >= 220 && spread <= 24) {
    return min >= 242 ? "#1F2937" : "#273449";
  }
  if (kind === "text" && max <= 125 && spread <= 60) return "#F8FAFC";
  if (kind === "text" && max <= 175 && spread <= 48) return "#CBD5E1";
  if (kind === "border" && min >= 150 && spread <= 55) return "#374151";
  return value;
};

const transformStyle = (style, mode) => {
  if (Array.isArray(style)) return style.map((item) => transformStyle(item, mode));
  if (typeof style === "number") return transformStyle(StyleSheet.flatten(style), mode);
  if (!style || typeof style !== "object") return style;
  return Object.fromEntries(Object.entries(style).map(([key, value]) => {
    if (mode !== "dark") return [key, value];
    if (key === "backgroundColor") return [key, mapThemeColor(value, "background")];
    if (key === "color" || key === "placeholderTextColor") return [key, mapThemeColor(value, "text")];
    if (key.toLowerCase().includes("border") && key.toLowerCase().includes("color")) {
      return [key, mapThemeColor(value, "border")];
    }
    return [key, value];
  }));
};

const restoreWebThemeOverrides = (node, overrides) => {
  overrides.forEach(({ property, value, priority, appliedValue, appliedPriority }) => {
    if (
      node.style.getPropertyValue(property) !== appliedValue
      || node.style.getPropertyPriority(property) !== appliedPriority
    ) {
      return;
    }
    WEB_THEME_SELF_WRITES.add(node);
    if (value) node.style.setProperty(property, value, priority);
    else node.style.removeProperty(property);
  });
};

const themeElement = (element, mode) => {
  if (!React.isValidElement(element)) return element;
  const props = { ...element.props };
  if (props.style) props.style = transformStyle(props.style, mode);
  if (props.contentContainerStyle) {
    props.contentContainerStyle = transformStyle(props.contentContainerStyle, mode);
  }
  if (props.placeholderTextColor) {
    props.placeholderTextColor = mapThemeColor(props.placeholderTextColor, "text");
  }
  if (props.color && element.type?.displayName === "ActivityIndicator") {
    props.color = mapThemeColor(props.color, "text");
  }
  if (props.renderItem) {
    const renderItem = props.renderItem;
    props.renderItem = (...args) => themeElement(renderItem(...args), mode);
  }
  ["ListEmptyComponent", "ListHeaderComponent", "ListFooterComponent"].forEach((key) => {
    const component = props[key];
    if (React.isValidElement(component)) {
      props[key] = themeElement(component, mode);
    } else if (typeof component === "function") {
      props[key] = (...args) => themeElement(component(...args), mode);
    }
  });
  if (props.children) {
    props.children = React.Children.map(props.children, (child) => themeElement(child, mode));
  }
  return React.cloneElement(element, props);
};

export const ThemeTree = ({ children }) => {
  const { mode } = useAppTheme();
  return themeElement(children, mode);
};

const applyWebTheme = (mode) => {
  const root = document.getElementById("root");
  if (!root) return;

  const nodes = [root, ...root.querySelectorAll("*")];
  nodes.forEach((node) => {
    const previous = WEB_THEME_OVERRIDES.get(node);
    if (mode !== "dark") {
      if (!previous) return;
      restoreWebThemeOverrides(node, previous);
      WEB_THEME_OVERRIDES.delete(node);
      return;
    }

    if (previous) return;
    const computed = window.getComputedStyle(node);
    const overrides = [];
    COLOR_PROPERTIES.forEach(([property, cssProperty]) => {
      const kind = property === "backgroundColor"
        ? "background"
        : property === "color"
          ? "text"
          : "border";
      const mapped = mapThemeColor(computed[property], kind);
      if (mapped === computed[property]) return;
      const value = node.style.getPropertyValue(cssProperty);
      const priority = node.style.getPropertyPriority(cssProperty);
      WEB_THEME_SELF_WRITES.add(node);
      node.style.setProperty(cssProperty, mapped, "important");
      overrides.push({
        property: cssProperty,
        value,
        priority,
        appliedValue: node.style.getPropertyValue(cssProperty),
        appliedPriority: node.style.getPropertyPriority(cssProperty),
      });
    });
    if (overrides.length) WEB_THEME_OVERRIDES.set(node, overrides);
  });
};

const restoreWebThemeNode = (node) => {
  const previous = WEB_THEME_OVERRIDES.get(node);
  if (!previous) return;
  restoreWebThemeOverrides(node, previous);
  WEB_THEME_OVERRIDES.delete(node);
};

const getSavedTheme = async () => {
  if (Platform.OS === "web") {
    return window.localStorage.getItem(THEME_STORAGE_KEY);
  }
  return SecureStore.getItemAsync(THEME_STORAGE_KEY);
};

const saveTheme = async (mode) => {
  if (Platform.OS === "web") {
    window.localStorage.setItem(THEME_STORAGE_KEY, mode);
    return;
  }
  await SecureStore.setItemAsync(THEME_STORAGE_KEY, mode);
};

export const ThemeProvider = ({ children }) => {
  const [mode, setMode] = useState("light");

  useEffect(() => {
    let mounted = true;
    getSavedTheme()
      .then((savedTheme) => {
        if (mounted && (savedTheme === "light" || savedTheme === "dark")) {
          setMode(savedTheme);
        }
      })
      .catch((error) => {
        console.error("Unable to load the saved appearance setting.", error);
      });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (typeof Appearance.setColorScheme === "function") {
      Appearance.setColorScheme(mode);
    }
    if (Platform.OS === "web") {
      document.documentElement.dataset.inviteflowTheme = mode;
      document.body.dataset.inviteflowTheme = mode;
      let styleElement = document.getElementById("inviteflow-theme-styles");
      if (!styleElement) {
        styleElement = document.createElement("style");
        styleElement.id = "inviteflow-theme-styles";
        styleElement.textContent = WEB_DARK_MODE_STYLES;
        document.head.appendChild(styleElement);
      }
      applyWebTheme(mode);
      if (!window.inviteFlowThemeObserver) {
        window.inviteFlowThemeObserver = new MutationObserver((changes) => {
          const externalStyleChanges = new Set();
          const internalStyleChanges = new Set();
          changes.forEach((change) => {
            if (change.attributeName === "class") restoreWebThemeNode(change.target);
            if (change.attributeName === "style") {
              if (WEB_THEME_SELF_WRITES.has(change.target)) {
                internalStyleChanges.add(change.target);
              } else {
                externalStyleChanges.add(change.target);
              }
            }
          });
          internalStyleChanges.forEach((node) => WEB_THEME_SELF_WRITES.delete(node));
          externalStyleChanges.forEach((node) => {
            if (!internalStyleChanges.has(node)) restoreWebThemeNode(node);
          });
          applyWebTheme(document.body.dataset.inviteflowTheme || "light");
        });
        window.inviteFlowThemeObserver.observe(document.getElementById("root"), {
          attributes: true,
          childList: true,
          subtree: true,
          attributeFilter: ["class", "style"],
        });
      }
    }
  }, [mode]);

  const updateMode = async (nextMode) => {
    setMode(nextMode);
    try {
      await saveTheme(nextMode);
    } catch (error) {
      console.error("Unable to save the appearance setting.", error);
    }
  };

  const value = useMemo(
    () => ({ mode, isDark: mode === "dark", colors: PALETTES[mode], setMode: updateMode }),
    [mode],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useAppTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useAppTheme must be used within ThemeProvider.");
  }
  return context;
};
