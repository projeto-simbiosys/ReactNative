import axios from "axios";
import { NativeModules, Platform } from "react-native";
import Constants from "expo-constants";

const envUrl = process.env.EXPO_PUBLIC_API_URL?.trim();

const expoHostUri =
  Constants.expoConfig?.hostUri ||
  Constants.manifest2?.extra?.expoClient?.hostUri ||
  Constants.manifest?.debuggerHost ||
  "";

const expoHost = expoHostUri.includes(":")
  ? expoHostUri.split(":")[0]
  : expoHostUri;

const scriptURL = NativeModules.SourceCode?.scriptURL || "";
const metroHostMatch = scriptURL.match(/^https?:\/\/([^/:]+)/i);
const metroHost = metroHostMatch?.[1] || "";

const inferredHost = expoHost || metroHost;

const inferredExpoUrl = inferredHost ? `http://${inferredHost}:8080` : "";

const fallbackUrl = Platform.select({
  android: inferredExpoUrl || "http://10.0.2.2:8080",
  ios: inferredExpoUrl || "http://localhost:8080",
  default: inferredExpoUrl || "http://localhost:8080",
});

const normalizedUrl = (
  envUrl ||
  fallbackUrl ||
  "http://localhost:8080"
).replace(/\/+$/, "");

const isLoopbackUrl =
  normalizedUrl.includes("http://localhost") ||
  normalizedUrl.includes("http://127.0.0.1");

const shouldUseInferredHostOnAndroid =
  Platform.OS === "android" &&
  isLoopbackUrl &&
  inferredHost &&
  inferredHost !== "localhost" &&
  inferredHost !== "127.0.0.1";

const url =
  Platform.OS !== "android"
    ? normalizedUrl
    : shouldUseInferredHostOnAndroid
      ? normalizedUrl
          .replace("http://localhost", `http://${inferredHost}`)
          .replace("http://127.0.0.1", `http://${inferredHost}`)
      : normalizedUrl
          .replace("http://localhost", "http://10.0.2.2")
          .replace("http://127.0.0.1", "http://10.0.2.2");

const api = axios.create({
  baseURL: url,
  timeout: 15000,
});

console.log("[API] baseURL:", api.defaults.baseURL);

export default api;
