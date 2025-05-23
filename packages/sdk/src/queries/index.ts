import { nemoApi } from "./request"
import {useMutation } from "@tanstack/react-query"
import { TokenInfoMap } from "@/types"

export const getTokenInfo = async (): Promise<TokenInfoMap> => {
  const res = await nemoApi<TokenInfoMap>("/api/v1/market/info").get()

  // Filter out tokens with NaN prices
  const filteredTokens = Object.entries(res).reduce((acc, [key, token]) => {
    if (!isNaN(Number(token.price))) {
      acc[key] = token
    }
    return acc
  }, {} as TokenInfoMap)

  console.log("filteredTokens", filteredTokens)

  return filteredTokens
}

export const useTokenInfo = () => {
  return useMutation<TokenInfoMap, Error>({
    mutationFn: getTokenInfo,
  })
}
