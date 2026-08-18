export interface Credentials {
  username: string;
  password: string;
}

export interface ApiErrorBody {
  errorMessage: string;
}

export interface OrderDetails {
  name: string;
  country: string;
  city: string;
  creditCard: string;
  month: string;
  year: string;
}

export interface OrderConfirmation {
  id: string;
  amount: number;
  cardNumber: string;
  name: string;
  date: string;
}

export interface CartRow {
  title: string;
  price: number;
}
