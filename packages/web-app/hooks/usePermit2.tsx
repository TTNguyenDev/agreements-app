import { useNetwork, useSignTypedData } from "wagmi";
import {
	SignatureTransfer,
	PermitTransferFrom,
	PermitBatchTransferFrom,
} from "@uniswap/permit2-sdk";
import { useTokenAllowance, useTokenApprovals } from "./useToken";
import { BigNumber, BigNumberish, constants } from "ethers";
import { useMemo } from "react";
import { useConstants } from "./useConstants";

interface Permit2AllowanceConfig {
	account: string;
	token: string;
	required?: BigNumberish;
	enabled?: boolean;
}

interface TokenTransfer {
	token: string;
	amount: BigNumberish;
}

interface Permit2TransferSignatureConfig {
	tokenTransfer: TokenTransfer;
	spender: string;
}

interface Permit2BatchTransferSignatureConfig {
	tokenTransfers: TokenTransfer[];
	spender: string;
}

export const usePermit2Allowance = ({
	account,
	token,
	required,
	enabled = true,
}: Permit2AllowanceConfig) => {
	const { permit2Address } = useConstants();
	const tokenAllowanceConfig = {
		address: token,
		owner: account,
		spender: permit2Address,
		enabled,
	};

	const { allowance } = useTokenAllowance(tokenAllowanceConfig);

	const isEnough = useMemo(() => {
		if (!BigNumber.isBigNumber(allowance)) return false;
		if (allowance.eq(constants.MaxUint256)) return true;
		if (required && BigNumber.from(required).lte(allowance)) return true;
		return false;
	}, [allowance]);

	const { approve: approvePermit2, ...args } = useTokenApprovals(tokenAllowanceConfig);

	const approve = () => {
		approvePermit2({ amount: constants.MaxUint256 });
	};

	return { allowance, isEnough, approve, ...args };
};

export const usePermit2TransferSignature = ({
	tokenTransfer,
	spender,
}: Permit2TransferSignatureConfig) => {
	const { permit2Address } = useConstants();
	const { chain } = useNetwork();

	const nonce = useMemo(
		() => BigNumber.from(Math.floor(Math.random() * Number.MAX_SAFE_INTEGER)),
		[],
	);

	const permit: PermitTransferFrom = useMemo(
		() => ({
			permitted: tokenTransfer,
			spender,
			nonce,
			deadline: constants.MaxInt256,
		}),
		[tokenTransfer],
	);

	const domain = useMemo(
		() => ({
			name: "Permit2",
			chainId: chain?.id || 5,
			verifyingContract: permit2Address,
		}),
		[chain],
	);

	const signTypedDataConfig = useMemo(() => {
		const { types, values } = SignatureTransfer.getPermitData(permit, permit2Address, 5);
		const config = {
			domain,
			types,
			value: values,
		};
		// console.log(config.values);
		return config;
	}, [domain, permit]);

	const {
		data: signature,
		isSuccess: signSuccess,
		isError: signError,
		signTypedData: signPermit,
	} = useSignTypedData(signTypedDataConfig);

	return { permit, signature, signPermit, signSuccess, signError };
};

export const usePermit2BatchTransferSignature = ({
	tokenTransfers,
	spender,
}: Permit2BatchTransferSignatureConfig) => {
	const { permit2Address } = useConstants();
	const { chain } = useNetwork();

	const nonce = useMemo(
		() => BigNumber.from(Math.floor(Math.random() * Number.MAX_SAFE_INTEGER)),
		[],
	);

	const permit: PermitBatchTransferFrom = useMemo(
		() => ({
			permitted: tokenTransfers,
			spender,
			nonce,
			deadline: constants.MaxInt256,
		}),
		[tokenTransfers],
	);

	const domain = useMemo(
		() => ({
			name: "Permit2",
			chainId: chain?.id || 5,
			verifyingContract: permit2Address,
		}),
		[chain],
	);

	const signTypedDataConfig = useMemo(() => {
		const { types, values } = SignatureTransfer.getPermitData(permit, permit2Address, 5);
		const config = {
			domain,
			types,
			value: values,
		};
		// console.log(config.values);
		return config;
	}, [domain, permit]);

	const {
		data: signature,
		isSuccess: signSuccess,
		isError: signError,
		signTypedData: signPermit,
	} = useSignTypedData(signTypedDataConfig);

	return { permit, signature, signPermit, signSuccess, signError };
};