export interface IWallet {
  address: string;
  seeds?: string[];
  secretKey?: string;
  password: string;
}
