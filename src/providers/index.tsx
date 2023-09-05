import { FC, ReactNode } from "react";
import { ToastContainer } from "react-toastify";
import { Provider } from "react-redux";

import { ModalProvider } from "components/Modal";

import state from "state";
import EthProvider from "./EthProvider";
import GoogleOAuth from "./GoogleOAuthProvider";
import SWRProvider from "./SWRProvider";

const Providers: FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <>
      <Provider store={state}>
        <GoogleOAuth>
          <EthProvider>
            <SWRProvider>
              <ModalProvider>{children}</ModalProvider>
            </SWRProvider>
          </EthProvider>
        </GoogleOAuth>
      </Provider>

      {/* toast */}
      <ToastContainer position="top-right" theme="colored" closeOnClick />
    </>
  );
};

export default Providers;
