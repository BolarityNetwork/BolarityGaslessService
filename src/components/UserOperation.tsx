"use client"

import { useEffect, useMemo, useState } from "react"

// UI Components
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle
} from "@/components/ui/card"
import { Loader2 } from "lucide-react"

// Privy
import {
    usePrivy,
    useSignAuthorization,
    useSignTypedData,
    useWallets
} from "@privy-io/react-auth"
import { useSetActiveWallet } from "@privy-io/wagmi"

// Blockchain
// import { useWalletClient } from "wagmi" // Not used, using Privy wallet directly
import {
    createPublicClient,
    createWalletClient,
    http,
    custom,
    zeroAddress,
    getAddress,
    parseAbi,
    maxUint256
} from "viem"
import { sepolia } from "viem/chains"
import { createSmartAccountClient } from "permissionless"
import { createPimlicoClient } from "permissionless/clients/pimlico"
import { entryPoint08Address } from "viem/account-abstraction"
import { toSimpleSmartAccount } from "permissionless/accounts"

const title = "Privy + Permissionless + 7702"

// USDC token contract address on Sepolia
const USDC_TOKEN = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238"

export function UserOperation() {
    const { user, authenticated, login, logout, ready } = usePrivy()
    const [loading, setLoading] = useState(false)
    const [testLoading, setTestLoading] = useState(false)
    const [usdcLoading, setUsdcLoading] = useState(false)
    const [txHash, setTxHash] = useState<string | null>(null)
    const [testTxHash, setTestTxHash] = useState<string | null>(null)
    const [usdcTxHash, setUsdcTxHash] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)
    const { signAuthorization } = useSignAuthorization()

    const { wallets } = useWallets()
    // const { data: walletClient } = useWalletClient() // Using Privy wallet directly instead

    const embeddedWallet = useMemo(
        () => wallets.find((wallet) => wallet.walletClientType === "privy"),
        [wallets]
    )

    const { setActiveWallet } = useSetActiveWallet()

    useEffect(() => {
        if (embeddedWallet) {
            setActiveWallet(embeddedWallet)
        }
    }, [embeddedWallet, setActiveWallet])

    const sendUserOperation = async () => {
        if (!user || !user.wallet?.address || !embeddedWallet) {
            setError("No wallet connected")
            return
        }

        setLoading(true)
        setError(null)

        try {
            // Use secure proxy instead of exposing API key
            const pimlicoUrl = process.env.NEXT_PUBLIC_PIMLICO_PROXY_URL ||'/api/pimlico-proxy'

            const publicClient = createPublicClient({
                chain: sepolia,
                transport: http(process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL!)
            })

            const pimlicoClient = createPimlicoClient({
                transport: http(pimlicoUrl)
            })

            // Create wallet client from Privy provider
            const provider = await embeddedWallet.getEthereumProvider()
            const walletClientFromPrivy = createWalletClient({
                account: embeddedWallet.address as `0x${string}`,
                chain: sepolia,
                transport: custom(provider)
            })

            // For EIP-7702, the smart account should use the EOA address as sender
            const simpleSmartAccount = await toSimpleSmartAccount({
                owner: walletClientFromPrivy,
                entryPoint: {
                    address: entryPoint08Address,
                    version: "0.8"
                },
                client: publicClient,
                address: walletClientFromPrivy.account.address
            })

            // Create the smart account client
            const smartAccountClient = createSmartAccountClient({
                account: simpleSmartAccount,
                chain: sepolia,
                bundlerTransport: http(pimlicoUrl),
                paymaster: pimlicoClient,
                userOperation: {
                    estimateFeesPerGas: async () => {
                        return (await pimlicoClient.getUserOperationGasPrice())
                            .fast
                    }
                }
            })

            // For EIP-7702, we need the EOA nonce, not the smart account nonce
            // The authorization allows the EOA to act as a smart account
            const authorization = await signAuthorization({
                contractAddress: "0xe6Cae83BdE06E4c305530e199D7217f42808555B",
                chainId: sepolia.id,
                nonce: await publicClient.getTransactionCount({
                    address: walletClientFromPrivy.account.address  // EOA nonce for 7702 auth
                })
            })

            const txnHash = await smartAccountClient.sendTransaction({
                calls: [
                    {
                        to: zeroAddress,
                        data: "0x",
                        value: BigInt(0)
                    }
                ],
                factory: '0x7702',
                factoryData: '0x',
                paymasterContext: {
                    sponsorshipPolicyId:
                        process.env.NEXT_PUBLIC_SPONSORSHIP_POLICY_ID
                },
                authorization
            })

            setTxHash(txnHash)
        } catch (err) {
            console.error("Error sending user operation:", err)
            setError(err instanceof Error ? err.message : "Unknown error")
        } finally {
            setLoading(false)
        }
    }

    const sendGaslessTest = async () => {
        if (!user || !user.wallet?.address || !embeddedWallet) {
            setError("No wallet connected")
            return
        }

        setTestLoading(true)
        setError(null)
        setTestTxHash(null)

        try {
            // Use cloud proxy server
            const pimlicoUrl = process.env.NEXT_PUBLIC_PIMLICO_PROXY_URL || '/api/pimlico-proxy'

            const publicClient = createPublicClient({
                chain: sepolia,
                transport: http(process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL!)
            })

            const pimlicoClient = createPimlicoClient({
                transport: http(pimlicoUrl)
            })

            // Create wallet client from Privy provider
            const provider = await embeddedWallet.getEthereumProvider()
            const walletClientFromPrivy = createWalletClient({
                account: embeddedWallet.address as `0x${string}`,
                chain: sepolia,
                transport: custom(provider)
            })

            // For EIP-7702, the smart account should use the EOA address as sender
            const simpleSmartAccount = await toSimpleSmartAccount({
                owner: walletClientFromPrivy,
                entryPoint: {
                    address: entryPoint08Address,
                    version: "0.8"
                },
                client: publicClient,
                address: walletClientFromPrivy.account.address
            })

            // Create the smart account client
            const smartAccountClient = createSmartAccountClient({
                account: simpleSmartAccount,
                chain: sepolia,
                bundlerTransport: http(pimlicoUrl),
                paymaster: pimlicoClient,
                userOperation: {
                    estimateFeesPerGas: async () => {
                        return (await pimlicoClient.getUserOperationGasPrice())
                            .fast
                    }
                }
            })

            // For EIP-7702, we need the EOA nonce, not the smart account nonce
            // The authorization allows the EOA to act as a smart account
            const authorization = await signAuthorization({
                contractAddress: "0xe6Cae83BdE06E4c305530e199D7217f42808555B",
                chainId: sepolia.id,
                nonce: await publicClient.getTransactionCount({
                    address: walletClientFromPrivy.account.address  // EOA nonce for 7702 auth
                })
            })

            // Send gasless test transaction
            const txnHash = await smartAccountClient.sendTransaction({
                calls: [
                    {
                        to: zeroAddress,
                        data: "0x",
                        value: BigInt(0)
                    }
                ],
                factory: '0x7702',
                factoryData: '0x',
                paymasterContext: {
                    sponsorshipPolicyId: process.env.NEXT_PUBLIC_SPONSORSHIP_POLICY_ID
                },
                authorization
            })

            console.log(`Transaction hash: ${txnHash}`)
            console.log(`View on Etherscan: https://sepolia.etherscan.io/tx/${txnHash}`)
            
            setTestTxHash(txnHash)
        } catch (err) {
            console.error("Error sending gasless test transaction:", err)
            setError(err instanceof Error ? err.message : "Unknown error")
        } finally {
            setTestLoading(false)
        }
    }

    const sendWithUsdcGas = async () => {
        if (!user || !user.wallet?.address || !embeddedWallet) {
            setError("No wallet connected")
            return
        }

        setUsdcLoading(true)
        setError(null)
        setUsdcTxHash(null)

        try {
            // Use cloud proxy server
            const pimlicoUrl = process.env.NEXT_PUBLIC_PIMLICO_PROXY_URL || '/api/pimlico-proxy'

            const publicClient = createPublicClient({
                chain: sepolia,
                transport: http(process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL!)
            })

            const pimlicoClient = createPimlicoClient({
                transport: http(pimlicoUrl)
            })

            // Create wallet client from Privy provider
            const provider = await embeddedWallet.getEthereumProvider()
            const walletClientFromPrivy = createWalletClient({
                account: embeddedWallet.address as `0x${string}`,
                chain: sepolia,
                transport: custom(provider)
            })

            // For EIP-7702, the smart account should use the EOA address as sender
            const simpleSmartAccount = await toSimpleSmartAccount({
                owner: walletClientFromPrivy,
                entryPoint: {
                    address: entryPoint08Address,
                    version: "0.8"
                },
                client: publicClient,
                address: walletClientFromPrivy.account.address
            })

            // Create the smart account client
            const smartAccountClient = createSmartAccountClient({
                account: simpleSmartAccount,
                chain: sepolia,
                bundlerTransport: http(pimlicoUrl),
                paymaster: pimlicoClient,
                userOperation: {
                    estimateFeesPerGas: async () => {
                        return (await pimlicoClient.getUserOperationGasPrice())
                            .fast
                    }
                }
            })

            // For EIP-7702, we need the EOA nonce, not the smart account nonce
            // The authorization allows the EOA to act as a smart account
            const authorization = await signAuthorization({
                contractAddress: "0xe6Cae83BdE06E4c305530e199D7217f42808555B",
                chainId: sepolia.id,
                nonce: await publicClient.getTransactionCount({
                    address: walletClientFromPrivy.account.address  // EOA nonce for 7702 auth
                })
            })
            
            const quotes = await pimlicoClient.getTokenQuotes({
                chain: sepolia,
                tokens: [USDC_TOKEN]
            })
            const paymaster = quotes[0].paymaster
            // Send transaction with USDC token as gas payment
            const txnHash = await smartAccountClient.sendTransaction({
                calls: [
                    {
                        to: getAddress(USDC_TOKEN),
                        abi: parseAbi(["function approve(address,uint256)"]),
                        functionName: "approve",
                        args: [paymaster, maxUint256], // Pimlico ERC20 Paymaster
                    },
                    {
                        to: zeroAddress,
                        data: "0x1234",
                    },
                ],
                factory: '0x7702',
                factoryData: '0x',
                paymasterContext: {
                    token: USDC_TOKEN,  // Use USDC token to pay for gas
                },
                authorization
            })

            console.log(`USDC Gas Transaction hash: ${txnHash}`)
            console.log(`View on Etherscan: https://sepolia.etherscan.io/tx/${txnHash}`)
            
            setUsdcTxHash(txnHash)
        } catch (err) {
            console.error("Error sending USDC gas transaction:", err)
            setError(err instanceof Error ? err.message : "Unknown error")
        } finally {
            setUsdcLoading(false)
        }
    }

    if (!ready) {
        return <div className="p-8 text-center">Loading...</div>
    }

    if (!authenticated) {
        return (
            <div className="p-8 flex flex-col items-center gap-4">
                <h1 className="text-2xl font-bold">{title}</h1>
                <Button onClick={login}>Login with Privy</Button>
            </div>
        )
    }

    return (
        <div className="p-8 flex flex-col items-center gap-4">
            <h1 className="text-2xl font-bold">{title}</h1>

            <Card className="w-[450px]">
                <CardHeader>
                    <CardTitle>Connected Address</CardTitle>
                    <CardDescription className="text-sm font-mono">
                        {embeddedWallet?.address || "No address available"}
                    </CardDescription>
                </CardHeader>
                <CardFooter className="flex flex-col gap-3">
                    <div className="flex gap-2 justify-end w-full">
                        <Button onClick={logout} variant="outline">
                            Logout
                        </Button>
                        <Button
                            onClick={sendGaslessTest}
                            disabled={testLoading || loading || usdcLoading}
                            variant="secondary"
                        >
                            {testLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                            ) : null}
                            Gasless Test
                        </Button>
                    </div>
                    <div className="flex gap-2 justify-end w-full">
                        <Button
                            onClick={sendWithUsdcGas}
                            disabled={usdcLoading || loading || testLoading}
                            variant="destructive"
                            className="bg-green-600 hover:bg-green-700"
                        >
                            {usdcLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin text-white" />
                            ) : null}
                            Pay with USDC 💵
                        </Button>
                        <Button
                            onClick={sendUserOperation}
                            disabled={loading || testLoading || usdcLoading}
                            variant="default"
                        >
                            {loading ? (
                                <Loader2 className="h-4 w-4 animate-spin text-amber-500" />
                            ) : null}
                            Send 7702 UserOp
                        </Button>
                    </div>
                </CardFooter>
            </Card>

            {txHash && (
                <Card className="w-full max-w-md bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-900">
                    <CardHeader>
                        <CardTitle className="text-base">
                            Transaction Hash
                        </CardTitle>
                        <CardDescription className="break-all font-mono">
                            {txHash}
                        </CardDescription>
                    </CardHeader>
                    <CardFooter>
                        <Button variant="link" className="p-0 h-auto" asChild>
                            <a
                                href={`https://sepolia.etherscan.io/tx/${txHash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                View on Etherscan
                            </a>
                        </Button>
                    </CardFooter>
                </Card>
            )}

            {testTxHash && (
                <Card className="w-full max-w-md bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900">
                    <CardHeader>
                        <CardTitle className="text-base">
                            Gasless Test Transaction ⚡
                        </CardTitle>
                        <CardDescription className="break-all font-mono">
                            {testTxHash}
                        </CardDescription>
                    </CardHeader>
                    <CardFooter>
                        <Button variant="link" className="p-0 h-auto" asChild>
                            <a
                                href={`https://sepolia.etherscan.io/tx/${testTxHash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                View on Etherscan
                            </a>
                        </Button>
                    </CardFooter>
                </Card>
            )}

            {usdcTxHash && (
                <Card className="w-full max-w-md bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-900">
                    <CardHeader>
                        <CardTitle className="text-base">
                            USDC Token Gas Payment 💵
                        </CardTitle>
                        <CardDescription className="break-all font-mono">
                            {usdcTxHash}
                        </CardDescription>
                    </CardHeader>
                    <CardFooter>
                        <Button variant="link" className="p-0 h-auto" asChild>
                            <a
                                href={`https://sepolia.etherscan.io/tx/${usdcTxHash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                View on Etherscan
                            </a>
                        </Button>
                    </CardFooter>
                </Card>
            )}

            {error && (
                <Card className="w-full max-w-md bg-destructive/10 border-destructive/20">
                    <CardHeader>
                        <CardTitle className="text-base">Error</CardTitle>
                        <CardDescription className="break-all text-destructive dark:text-destructive/90">
                            {error}
                        </CardDescription>
                    </CardHeader>
                </Card>
            )}
        </div>
    )
}
