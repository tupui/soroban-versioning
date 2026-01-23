import stellar_sdk

stellar_sdk.scval.to_symbol("transfer").to_xdr()
# 'AAAADwAAAAh0cmFuc2Zlcg=='
stellar_sdk.scval.to_int32(10_000).to_xdr()
# 'AAAABAAAJxA='
stellar_sdk.scval.to_int32(5_000).to_xdr()
# 'AAAABAAAE4g='
stellar_sdk.scval.to_int32(1_000).to_xdr()
# 'AAAABAAAA+g='
stellar_sdk.scval.to_address(
    "GA7YNBW5CBTJZ3ZZOWX3ZNBKD6OE7A7IHUQVWMY62W2ZBG2SGZVOOPVH"
).to_xdr()
# 'AAAAEgAAAAAAAAAAP4aG3RBmnO85da+8tCofnE+D6D0hWzMe1bWQm1I2auc='
stellar_sdk.scval.to_address(
    "GAFYGBHKVFP36EOIRGG74V42F3ORAA2ZWBXNULMNDXAMMXQH5MCIGXXI"
).to_xdr()
