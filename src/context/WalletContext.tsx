"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { PeraWalletConnect } from "@perawallet/connect";
import algosdk from "algosdk";

const peraWallet = new PeraWalletConnect({
  shouldShowSignTxnToast: true,
});

interface WalletContextType {
  accountAddress: string | null;
  isConnected: boolean;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  signTransactionGroup: (transactionsBase64: string[]) => Promise<string[]>;
}

const WalletContext = createContext<WalletContextType>({
  accountAddress: null,
  isConnected: false,
  connectWallet: async () => {},
  disconnectWallet: () => {},
  signTransactionGroup: async () => [],
});

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [accountAddress, setAccountAddress] = useState<string | null>(null);
  const isConnected = !!accountAddress;

  // Reconnect session on load
  useEffect(() => {
    peraWallet
      .reconnectSession()
      .then((accounts) => {
        if (accounts.length) {
          setAccountAddress(accounts[0]);
        }
        peraWallet.connector?.on("disconnect", () => disconnectWallet());
      })
      .catch((e) => console.log(e));

    return () => {
      // Avoid dangling events
      if (peraWallet.connector) {
        peraWallet.connector.off("disconnect");
      }
    };
  }, []);

  const connectWallet = useCallback(async () => {
    try {
      const newAccounts = await peraWallet.connect();
      if (newAccounts.length > 0) {
        setAccountAddress(newAccounts[0]);
      }
      peraWallet.connector?.on("disconnect", () => disconnectWallet());
    } catch (e: unknown) {
      const error = e as { data?: { type?: string }; message?: string };
      // User closed the Pera Wallet modal — not an error, just bail out silently
      if (
        error?.data?.type === "CONNECT_MODAL_CLOSED" ||
        (error?.message && /close|cancel|reject/i.test(error.message))
      ) {
        return;
      }
      console.error("Failed to connect Pera wallet", e);
    }
  }, []);

  const disconnectWallet = useCallback(() => {
    try {
      peraWallet.disconnect();
    } catch (e) {
      console.warn("Error disconnecting Pera wallet", e);
    }
    setAccountAddress(null);
  }, []);

  // Takes multiple Base64 encoded transactions originating from Go API payload,
  // packages them natively via Uint8Array, requests signature from Pera Wallet,
  // returning Array of Base64-signed payload strings representing the txn responses.
  const signTransactionGroup = useCallback(
    async (transactionsBase64: string[]): Promise<string[]> => {
      if (!accountAddress) {
        throw new Error("Wallet not connected");
      }

      const txnsToSign = transactionsBase64.map((b64) => {
        // Convert Base64 string to Uint8Array
        const rawString = window.atob(b64);
        const uint8Array = new Uint8Array(rawString.length);
        for (let i = 0; i < rawString.length; i++) {
          uint8Array[i] = rawString.charCodeAt(i);
        }
        return {
          txn: algosdk.decodeUnsignedTransaction(uint8Array),
          signers: [accountAddress],
        };
      });

      // Returns array of Uint8Arrays representing signed Txn data
      const signedData = await peraWallet.signTransaction([txnsToSign]);

      // Convert signed binary outputs back to Base64 to pipe accurately to Go API /confirm payload
      return signedData.map((bytes) => {
        let binary = "";
        bytes.forEach((b) => (binary += String.fromCharCode(b)));
        return window.btoa(binary);
      });
    },
    [accountAddress]
  );

  return (
    <WalletContext.Provider
      value={{
        accountAddress,
        isConnected,
        connectWallet,
        disconnectWallet,
        signTransactionGroup,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => useContext(WalletContext);
