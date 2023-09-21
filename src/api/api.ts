import axios, { AxiosError } from "axios";
import state from "state";
import { logoutUser } from "state/user/actions";

// Create an instance of axios
export const Api = axios.create({
  baseURL: import.meta.env.VITE_API_ENDPOINT,
  headers: {
    "Content-Type": "application/json",
    // "Cross-Origin-Opener-Policy": "same-origin",
  },
  maxBodyLength: 5 * 1024 * 1024 * 1024, // 5GB
});

Api.interceptors.response.use(
  (res) => res,
  (err: AxiosError) => {
    if (err.response?.status === 401) {
      console.error("Axios error: ", err);
      // dispatch logout
      state.dispatch(logoutUser());
    }
    return Promise.reject(err);
  }
);

export { default as setAuthToken } from "./setAuthToken";
