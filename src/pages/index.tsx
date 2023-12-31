import { type BtcAddress } from "@btckit/types";
import axios from "axios";
import { payments } from "bitcoinjs-lib";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useSelector } from "react-redux";
import { AddressPurposes, getAddress, signTransaction } from "sats-connect";
import Footer from "~/components/layout/Footer";
import Header from "~/components/layout/Header";
import WalletConnectModal from "~/components/wallet-connect/WalletConnectModal";
import {
  selectIsAuthenticated,
  selectWalletName,
} from "~/components/wallet-connect/walletConnectSlice";

export default function Home() {
  const [walletConnectModalVisible, setWalletConnectModalVisible] =
    useState(false);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const walletName = useSelector(selectWalletName);
  const [isLoading, setIsloading] = useState(false);

  const onMintBtnClicked = async () => {
    if (!isAuthenticated) return setWalletConnectModalVisible(true);
    if (walletName === "Unisat") {
      try {
        setIsloading(true);
        const pubkey = await window.unisat.getPublicKey();
        const [address] = await window.unisat.getAccounts();
        const res = await axios.post("/api/inscribe", {
          recipient: address,
          buyerPubkey: pubkey,
          walletType: "Unisat",
        });
        const signedPsbt = await window.unisat.signPsbt(res.data.psbt);
        const combineRes = await axios.post("/api/combine", {
          psbt: res.data.psbt,
          signedPsbt,
          walletType: "Unisat",
        });
        alert("success");
        setIsloading(false);
      } catch (error) {
        console.error(error);
        alert("failed");
        setIsloading(false);
      }
    } else if (walletName === "Hiro") {
      try {
        setIsloading(true);
        const addressesRes = await window.btc?.request("getAddresses");
        const { address } = (addressesRes as any).result.addresses.find(
          (address: BtcAddress) => address.type === "p2tr"
        );
        const pubkey = (addressesRes as any).result.addresses.find(
          (address: BtcAddress) => address.type === "p2wpkh"
        ).publicKey;
        const res = await axios.post("/api/inscribe", {
          recipient: address,
          buyerPubkey: pubkey,
          walletType: "Hiro",
        });
        const requestParams = {
          publicKey: pubkey,
          hex: res.data.psbt,
          network: "testnet",
        };
        const result = await window.btc?.request("signPsbt", requestParams);
        console.log("result", result);
        const combineRes = await axios.post("/api/combine", {
          psbt: res.data.psbt,
          signedPsbt: (result as any).result.hex,
          walletType: "Hiro",
        });
        alert("success");
        setIsloading(false);
      } catch (error) {
        console.error(error);
        alert("failed");
        setIsloading(false);
      }
    } else if (walletName === "Xverse") {
      try {
        let pubkey, address, paymentAddress;
        setIsloading(true);
        const getAddressOptions = {
          payload: {
            purposes: [AddressPurposes.ORDINALS, AddressPurposes.PAYMENT],
            message: "Address for receiving Ordinals and payments",
            network: {
              type: "Testnet",
            },
          },
          onFinish: (response: any) => {
            address = response.addresses[0].address;
            pubkey = response.addresses[1].publicKey;
            paymentAddress = response.addresses[1].address;
          },
          onCancel: () => alert("Request canceled"),
        };
        await getAddress(getAddressOptions);
        const res = await axios.post("/api/inscribe", {
          recipient: address,
          buyerPubkey: pubkey,
          walletType: "Xverse",
        });
        let signedPsbt;
        const signPsbtOptions = {
          payload: {
            network: {
              type: "Testnet",
            },
            message: "Sign Transaction",
            psbtBase64: res.data.psbt,
            broadcast: false,
            inputsToSign: [
              {
                address: paymentAddress,
                signingIndexes: [1],
              },
            ],
          },
          onFinish: (response: any) => {
            signedPsbt = response.psbtBase64;
          },
          onCancel: () => alert("Canceled"),
        };
        await signTransaction(signPsbtOptions);
        const combineRes = await axios.post("/api/combine", {
          psbt: res.data.psbt,
          signedPsbt,
          walletType: "Xverse",
        });
        alert("success");
        setIsloading(false);
      } catch (error) {
        console.error(error);
        alert("failed");
        setIsloading(false);
      }
    }
  };

  return (
    <>
      <Head>
        <title>Create T3 App</title>
        <meta name="description" content="Generated by create-t3-app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="relative min-h-screen w-full">
        {walletConnectModalVisible && (
          <WalletConnectModal setModalVisible={setWalletConnectModalVisible} />
        )}
        <Header setModalVisible={setWalletConnectModalVisible} />
        <Image
          src="/imgs/bg.png"
          alt=""
          fill
          className="absolute inset-0 -z-10"
        />
        <div className="mt-[146px] flex w-full justify-center px-[150px]">
          <div className="flex max-w-[1623px] justify-center gap-[90px]">
            <Image
              src="/imgs/bg-logo.png"
              alt=""
              width={640}
              height={640}
              className="aspect-square h-[640px] w-[640px] flex-none"
            />
            <div>
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center justify-start gap-4">
                    <Image
                      src="/imgs/btc-logo.png"
                      alt=""
                      width="69"
                      height="69"
                      className="mt-3"
                    />
                    <p className="text-[80px] uppercase text-white">ARCADIA</p>
                  </div>
                  <p className="rounded border-[1px] border-[#353535] bg-[#1E1E1E] px-2.5 py-1.5 font-tomorrow text-[22px] leading-6 text-white">
                    TOTAL ITEMS 2000
                  </p>
                  <div className="flex items-center gap-[18px]">
                    <Image
                      src="/imgs/discord.png"
                      alt=""
                      width="38"
                      height="38"
                    />
                    <Image
                      src="/imgs/twitter.png"
                      alt=""
                      width="38"
                      height="38"
                    />
                    <Image
                      src="/imgs/website.png"
                      alt=""
                      width="38"
                      height="38"
                    />
                  </div>
                </div>
                <p className="font-tomorrow text-[22px] leading-[30px] text-specialWhite">
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed
                  do eiusmod tempor incididunt ut labore et dolore magna aliqua.
                  Ut enim ad minim veniam, quis nostrud exercitation ullamco
                  laboris nisi ut aliquip ex ea commodo consequat.
                  <Link href="" className="ml-5 text-customBlue">
                    Read More
                  </Link>
                </p>
              </div>
              <div>
                <div className="mt-[70px] rounded-[5px] border-[1px] border-[#353535] bg-[#1E1E1E] px-14 py-10">
                  <div className="flex w-full items-center justify-between">
                    <p className="text-[35px] font-bold uppercase text-[#444]">
                      Public
                    </p>
                    <div className="flex items-center gap-[25px]">
                      <p className="text-[35px] uppercase text-customBlue">
                        STARTS IN
                      </p>
                      <p className="text-[60px] uppercase leading-[60px] text-white">
                        02
                      </p>
                      <p className="text-[60px] uppercase leading-[60px] text-white">
                        10
                      </p>
                      <p className="text-[60px] uppercase leading-[60px] text-white">
                        47
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-4">
                    <Image
                      src="/imgs/btc-logo.png"
                      alt=""
                      width="28"
                      height="28"
                      className="mt-2"
                    />
                    <p className="font-tomorrow text-[40px] leading-10 text-specialWhite">
                      0.0055 BTC
                    </p>
                  </div>
                </div>
                <button
                  className="mt-[30px] flex h-[80px] w-full items-center justify-center rounded-full bg-customBlue font-tomorrow text-[32px] text-specialWhite"
                  onClick={() => void onMintBtnClicked()}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Image
                      src="/imgs/spinner.svg"
                      alt=""
                      width={50}
                      height={50}
                    />
                  ) : (
                    "MINT"
                  )}
                </button>
                <div className="mt-[30px]">
                  <div className="h-1 w-full bg-[#3A3A3A]">
                    <div className="h-full w-[26%] bg-customBlue" />
                  </div>
                  <div className="mt-1.5 flex w-full justify-between font-tomorrow text-[20px] leading-10 text-white">
                    <p>TOTAL MINTED</p>
                    <p>1% (20/2000)</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    </>
  );
}
